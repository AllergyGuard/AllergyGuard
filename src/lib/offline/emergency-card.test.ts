import "fake-indexeddb/auto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRow, ProfileBundle } from "@/lib/profile/types";
import { offlineDb, type EmergencyCard } from "./db";

vi.mock("@/lib/profile/load", () => ({ loadOwnProfile: vi.fn(), loadContacts: vi.fn() }));
const load = await import("@/lib/profile/load");
const {
  buildEmergencyCard,
  clearEmergencyCards,
  readEmergencyCards,
  requestPersistentStorage,
  syncEmergencyCard,
} = await import("./emergency-card");

const NOW = new Date("2026-10-03T09:30:00.000Z");

const ravi: ContactRow = { id: "c1", name: "Ravi", phone: "+91 98765 43210", relationship: null, is_primary: false };
const asha: ContactRow = { id: "c2", name: "Asha", phone: "+44 20 7946 0958", relationship: "Mum", is_primary: true };

const bundle: ProfileBundle = {
  profile: {
    id: "p1",
    name: "Sam",
    disclaimer_accepted_at: "2026-10-01T00:00:00Z",
    onboarding_step: 6,
    onboarding_completed_at: "2026-10-01T00:00:00Z",
  },
  allergens: [{ id: "a1", kind: "predefined", code: "peanut", severity: "severe" }],
  primaryContact: asha,
  medications: [{ id: "m1", name: "EpiPen", dose: "0.3 mg", expiry_date: "2027-01-31" }],
};

function fakeSupabase(sub: string | null): SupabaseClient {
  return {
    auth: { getClaims: async () => ({ data: sub ? { claims: { sub } } : null, error: null }) },
  } as unknown as SupabaseClient;
}

function card(overrides: Partial<EmergencyCard>): EmergencyCard {
  return { ...buildEmergencyCard("u1", bundle, [asha], NOW), ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(load.loadOwnProfile).mockResolvedValue(bundle);
  vi.mocked(load.loadContacts).mockResolvedValue([ravi, asha]);
});

afterEach(async () => {
  await offlineDb.emergencyCards.clear();
  vi.restoreAllMocks();
});

describe("buildEmergencyCard", () => {
  it("snapshots the profile with the primary contact first and the sync time", () => {
    const result = buildEmergencyCard("u1", bundle, [ravi, asha], NOW);
    expect(result).toEqual({
      profileId: "p1",
      ownerId: "u1",
      name: "Sam",
      allergens: bundle.allergens,
      contacts: [asha, ravi],
      medications: bundle.medications,
      syncedAt: "2026-10-03T09:30:00.000Z",
    });
  });
});

describe("syncEmergencyCard", () => {
  it("writes the signed-in user's card to Dexie", async () => {
    expect(await syncEmergencyCard(fakeSupabase("u1"), () => NOW)).toBe(true);
    const cards = await readEmergencyCards();
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ profileId: "p1", ownerId: "u1", contacts: [asha, ravi] });
  });

  it("replaces the previous snapshot instead of merging", async () => {
    await offlineDb.emergencyCards.put(card({ name: "Old name", medications: [] }));
    await syncEmergencyCard(fakeSupabase("u1"), () => NOW);
    const [stored] = await readEmergencyCards();
    expect(stored.name).toBe("Sam");
    expect(stored.medications).toEqual(bundle.medications);
  });

  it("drops cards that belong to another user", async () => {
    await offlineDb.emergencyCards.put(card({ profileId: "p-other", ownerId: "u-other" }));
    await syncEmergencyCard(fakeSupabase("u1"), () => NOW);
    expect((await readEmergencyCards()).map((c) => c.ownerId)).toEqual(["u1"]);
  });

  it("keeps the existing card when there is no session (expired or signed out elsewhere)", async () => {
    await offlineDb.emergencyCards.put(card({}));
    expect(await syncEmergencyCard(fakeSupabase(null))).toBe(false);
    expect(await readEmergencyCards()).toHaveLength(1);
    expect(load.loadOwnProfile).not.toHaveBeenCalled();
  });

  it("keeps the existing card and does not throw when Supabase is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await offlineDb.emergencyCards.put(card({}));
    vi.mocked(load.loadOwnProfile).mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await syncEmergencyCard(fakeSupabase("u1"))).toBe(false);
    expect(await readEmergencyCards()).toEqual([card({})]);
  });

  it("writes nothing when the user has no profile yet", async () => {
    vi.mocked(load.loadOwnProfile).mockResolvedValue(null);
    expect(await syncEmergencyCard(fakeSupabase("u1"))).toBe(false);
    expect(await readEmergencyCards()).toEqual([]);
  });

  it("asks for persistent storage after a successful write", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("navigator", { storage: { persisted: vi.fn().mockResolvedValue(false), persist } });
    try {
      await syncEmergencyCard(fakeSupabase("u1"), () => NOW);
      expect(persist).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("requestPersistentStorage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not ask again when storage is already persistent", async () => {
    const persist = vi.fn();
    vi.stubGlobal("navigator", { storage: { persisted: vi.fn().mockResolvedValue(true), persist } });
    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it("returns false when the browser has no storage API or refuses", async () => {
    vi.stubGlobal("navigator", {});
    expect(await requestPersistentStorage()).toBe(false);
    vi.stubGlobal("navigator", {
      storage: { persisted: vi.fn().mockResolvedValue(false), persist: vi.fn().mockResolvedValue(false) },
    });
    expect(await requestPersistentStorage()).toBe(false);
  });
});

describe("clearEmergencyCards", () => {
  it("removes every card on the device", async () => {
    await offlineDb.emergencyCards.bulkPut([card({}), card({ profileId: "p2" })]);
    await clearEmergencyCards();
    expect(await readEmergencyCards()).toEqual([]);
  });
});
