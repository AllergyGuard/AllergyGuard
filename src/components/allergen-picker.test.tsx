// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { AllergenSelection } from "@/lib/profile/allergen-selection";
import { AllergenPicker } from "./allergen-picker";

afterEach(cleanup);

// Holds the picker's value in state, like a real parent, and exposes the latest value.
function setup(initial: AllergenSelection[] = []) {
  const latest: { value: AllergenSelection[] } = { value: initial };
  function Harness() {
    const [value, setValue] = useState(initial);
    return (
      <AllergenPicker
        value={value}
        onChange={(next) => {
          latest.value = next;
          setValue(next);
        }}
      />
    );
  }
  const user = userEvent.setup();
  render(<Harness />);
  return { user, latest };
}

const chip = (name: string) => screen.getByRole("button", { name: new RegExp(`^(✓)?${name}$`) });
const customInput = () => screen.getByLabelText("Something else?");

describe("AllergenPicker", () => {
  it("shows all 10 predefined allergens, none pressed", () => {
    setup();
    const group = screen.getByRole("group", { name: "Common allergens" });
    const chips = within(group).getAllByRole("button");
    expect(chips).toHaveLength(10);
    for (const c of chips) expect(c.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText(/Your allergens/)).toBeNull();
  });

  it("ticks and unticks a predefined allergen", async () => {
    const { user, latest } = setup();
    await user.click(chip("Milk"));
    expect(chip("Milk").getAttribute("aria-pressed")).toBe("true");
    expect(latest.value).toEqual([{ kind: "predefined", code: "milk", severity: null }]);
    expect(screen.getByText("Your allergens (1)")).toBeTruthy();

    await user.click(chip("Milk"));
    expect(chip("Milk").getAttribute("aria-pressed")).toBe("false");
    expect(latest.value).toEqual([]);
  });

  it("starts at Not sure and lets the user pick a severity", async () => {
    const { user, latest } = setup();
    await user.click(chip("Peanut"));
    const group = screen.getByRole("radiogroup", { name: "Peanut severity" });
    const notSure = within(group).getByRole("radio", { name: "Not sure" }) as HTMLInputElement;
    expect(notSure.checked).toBe(true);

    await user.click(within(group).getByRole("radio", { name: "Severe" }));
    expect(latest.value).toEqual([{ kind: "predefined", code: "peanut", severity: "severe" }]);
    expect(
      (within(group).getByRole("radio", { name: "Severe" }) as HTMLInputElement).checked,
    ).toBe(true);
  });

  it("adds a custom allergen with the Add button, normalizing spaces", async () => {
    const { user, latest } = setup();
    await user.type(customInput(), "  green   kiwi ");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(latest.value).toEqual([{ kind: "custom", name: "green kiwi", severity: null }]);
    expect((customInput() as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("radiogroup", { name: "green kiwi severity" })).toBeTruthy();
  });

  it("adds a custom allergen with Enter without submitting a surrounding form", async () => {
    const user = userEvent.setup();
    let submitted = false;
    function InForm() {
      const [value, setValue] = useState<AllergenSelection[]>([]);
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitted = true;
          }}
        >
          <AllergenPicker value={value} onChange={setValue} />
        </form>
      );
    }
    render(<InForm />);
    await user.type(customInput(), "Lupin{Enter}");
    expect(submitted).toBe(false);
    expect(screen.getByRole("radiogroup", { name: "Lupin severity" })).toBeTruthy();
  });

  it("stores synonyms like dairy as custom text", async () => {
    const { user, latest } = setup();
    await user.type(customInput(), "dairy{Enter}");
    expect(latest.value).toEqual([{ kind: "custom", name: "dairy", severity: null }]);
  });

  it("shows an error and does not add an empty name", async () => {
    const { user, latest } = setup();
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Type the name/);
    expect(customInput().getAttribute("aria-invalid")).toBe("true");
    expect(latest.value).toEqual([]);
  });

  it("rejects a duplicate custom allergen", async () => {
    const { user, latest } = setup([{ kind: "custom", name: "Lupin", severity: null }]);
    await user.type(customInput(), "LUPIN{Enter}");
    expect(screen.getByRole("alert").textContent).toMatch(/already added Lupin/);
    expect(latest.value).toHaveLength(1);
  });

  it("points a predefined name back to its chip instead of adding it", async () => {
    const { user, latest } = setup();
    await user.type(customInput(), "peanuts{Enter}");
    expect(screen.getByRole("alert").textContent).toMatch(/Peanut is already in the list/);
    expect(latest.value).toEqual([]);
  });

  it("clears the error once the user edits the name", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(customInput(), "k");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("removes an allergen from the selected list", async () => {
    const { user, latest } = setup([
      { kind: "predefined", code: "egg", severity: "mild" },
      { kind: "custom", name: "Lupin", severity: null },
    ]);
    await user.click(screen.getByRole("button", { name: "Remove Lupin" }));
    expect(latest.value).toEqual([{ kind: "predefined", code: "egg", severity: "mild" }]);

    await user.click(screen.getByRole("button", { name: "Remove Egg" }));
    expect(latest.value).toEqual([]);
    expect(chip("Egg").getAttribute("aria-pressed")).toBe("false");
  });

  it("shows saved selections, including their severity", () => {
    setup([{ kind: "predefined", code: "sesame", severity: "moderate", id: "row-1" }]);
    expect(chip("Sesame").getAttribute("aria-pressed")).toBe("true");
    const group = screen.getByRole("radiogroup", { name: "Sesame severity" });
    expect(
      (within(group).getByRole("radio", { name: "Moderate" }) as HTMLInputElement).checked,
    ).toBe(true);
  });
});
