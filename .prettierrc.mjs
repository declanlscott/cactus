/** @type {import("@ianvs/prettier-plugin-sort-imports")} */
export default {
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "",
    "^hono",
    "<THIRD_PARTY_MODULES>",
    "",
    "^[~]",
    "^[.]",
    "",
    "<TYPES>",
    "<TYPES>^[~]",
    "<TYPES>^[.]",
  ],
};
