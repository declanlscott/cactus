import * as v from "valibot";

export const JwtPayload = v.object({
  sub: v.pipe(v.string(), v.email()),
  exp: v.pipe(v.number(), v.integer(), v.minValue(0)),
});
export type JwtPayload = v.InferOutput<typeof JwtPayload>;
