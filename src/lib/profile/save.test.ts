import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileRow } from "./types";

vi.mock("@/lib/offline/emergency-card", () => ({ syncEmergencyCard: vi.fn() }));
const { syncEmergencyCard } = await import("@/lib/offline/emergency-card");
const { SAVE_ERROR, setPrimaryContact, skipContact } = await import("./save");

const finished: ProfileRow = {
  id: "p1",
  name: "Sam",
  disclaimer_accepted_at: "2026-10-01T00:00:00Z",
  onboarding_step: 6,
  onboarding_completed_at: "2026-10-01T00:00:00Z",
};

function fakeSupabase(rpcError: unknown = null): SupabaseClient {
  return { rpc: vi.fn().mockResolvedValue({ data: null, error: rpcError }) } as unknown as SupabaseClient;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(syncEmergencyCard).mockResolvedValue(true);
});

describe("offline mirror of profile saves", () => {
  it("refreshes the Dexie emergency card after a successful save", async () => {
    const supabase = fakeSupabase();
    expect(await setPrimaryContact(supabase, "c1")).toEqual({ ok: true, data: null });
    expect(syncEmergencyCard).toHaveBeenCalledWith(supabase);
  });

  it("does not touch the card when the Supabase write fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await setPrimaryContact(fakeSupabase({ message: "offline" }), "c1");
    expect(result).toEqual({ ok: false, error: SAVE_ERROR });
    expect(syncEmergencyCard).not.toHaveBeenCalled();
  });

  it("still reports success when the mirror itself fails", async () => {
    vi.mocked(syncEmergencyCard).mockResolvedValue(false);
    const result = await skipContact(fakeSupabase(), finished);
    expect(result).toEqual({ ok: true, data: finished });
  });
});
