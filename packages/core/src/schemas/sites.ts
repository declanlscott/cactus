import * as v from "valibot";

export const PostSiteJson = v.object({ name: v.pipe(v.string(), v.trim()) });
export type PostSiteJson = v.InferOutput<typeof PostSiteJson>;
