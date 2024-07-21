import * as v from "valibot";

export const NewForm = v.object({
  siteId: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.trim()),
});
export type NewForm = v.InferOutput<typeof NewForm>;
