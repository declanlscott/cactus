import * as v from "valibot";

export type Primitive =
  | string
  | number
  | boolean
  | ({} & { [key: string]: unknown })
  | Array<string>
  | Array<number>
  | null
  | undefined
  | Array<Primitive>;

export const Primitive: v.GenericSchema<Primitive> = v.nullish(
  v.union([
    v.string(),
    v.number(),
    v.boolean(),
    v.looseObject({}),
    v.array(v.string()),
    v.array(v.number()),
    v.lazy(() => v.array(Primitive)),
  ]),
);
