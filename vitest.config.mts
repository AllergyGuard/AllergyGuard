import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Match the "@/*" path alias in tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Component tests opt into a DOM with a `// @vitest-environment jsdom`
    // comment at the top of the file; everything else stays in plain Node.
    environment: "node",
    // Retired Sprint 1 stack, kept for reference only — see docs/legacy-notes.md.
    // testcases/ is pre-existing Jest-style test code for that stack (its
    // require() path now points into legacy/); left as-is per instruction
    // not to touch it, so it's out of scope for this runner too.
    exclude: [...configDefaults.exclude, "legacy/**", "testcases/**"],
  },
});
