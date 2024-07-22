import * as v from "valibot";

export const Uuid = v.pipe(v.string(), v.uuid());
export type Uuid = v.InferOutput<typeof Uuid>;
