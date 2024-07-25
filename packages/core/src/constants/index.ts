import { createPrefix } from "../utils/keys";

export const PK = "pk";
export const SK = "sk";
export const gsi1 = {
  name: "Gsi1",
  pk: "gsi1pk",
  sk: "gsi1sk",
} as const;

export const KEY_DELIMITER = "#";

export const prefix = createPrefix(["email", "site", "form", "submission"]);
