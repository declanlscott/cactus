import { createPrefix } from "../utils/keys";

export const PK = "pk";
export const SK = "sk";
export const GSI1PK = "gsi1pk";
export const GSI1SK = "gsi1sk";

export const KEY_DELIMITER = "#";

export const prefix = createPrefix(["site", "form", "submission"]);
