import * as v from "valibot";

export const SiteName = v.pipe(v.string(), v.trim());
export type SiteName = v.InferOutput<typeof SiteName>;
