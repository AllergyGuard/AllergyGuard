// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { offlineDb, type EmergencyCard } from "@/lib/offline/db";
import { EmergencyCardView } from "./emergency-card-view";

const card: EmergencyCard = {
  profileId: "p1",
  ownerId: "u1",
  name: "Sam",
  allergens: [
    { id: "a1", kind: "custom", name: "whey", severity: "mild" },
    { id: "a2", kind: "predefined", code: "peanut", severity: "severe" },
  ],
  contacts: [
    { id: "c2", name: "Asha", phone: "+44 20 7946 0958", relationship: "Mum", is_primary: true },
    { id: "c1", name: "Ravi", phone: "+91 98765 43210", relationship: null, is_primary: false },
  ],
  medications: [{ id: "m1", name: "EpiPen", dose: "0.3 mg", expiry_date: "2020-01-31" }],
  syncedAt: "2026-10-03T09:30:00.000Z",
};

afterEach(async () => {
  cleanup();
  await offlineDb.emergencyCards.clear();
});

describe("EmergencyCardView", () => {
  it("says nothing is saved when Dexie is empty", async () => {
    render(<EmergencyCardView />);
    expect(await screen.findByText("No emergency info saved on this device.")).toBeTruthy();
  });

  it("shows the saved card from Dexie with tel: call links", async () => {
    await offlineDb.emergencyCards.put(card);
    render(<EmergencyCardView />);

    const primary = await screen.findByRole("link", { name: /Call Asha/ });
    // The link dials "+" and digits only; the number shown keeps its spaces.
    expect(primary.getAttribute("href")).toBe("tel:+442079460958");
    expect(primary.getAttribute("href")).toMatch(/^tel:\+[0-9]+$/);
    expect(primary.textContent).toContain("+44 20 7946 0958");
    expect(screen.getByRole("link", { name: /Call Ravi/ }).getAttribute("href")).toBe(
      "tel:+919876543210",
    );

    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items.indexOf("PeanutSevere")).toBeLessThan(items.indexOf("wheyMild"));

    expect(screen.getByText("EpiPen").closest("li")?.textContent).toContain("Expired 2020-01-31");
    expect(screen.getByText(/^Last updated /)).toBeTruthy();
  });

  it("warns when the card has no emergency contact", async () => {
    await offlineDb.emergencyCards.put({ ...card, contacts: [] });
    render(<EmergencyCardView />);
    expect(await screen.findByText("No emergency contact saved.")).toBeTruthy();
  });
});
