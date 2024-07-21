import * as v from "valibot";

export const NewSite = v.object({ name: v.pipe(v.string(), v.trim()) });
export type NewSite = v.InferOutput<typeof NewSite>;
