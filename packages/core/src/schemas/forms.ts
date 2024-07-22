import * as v from "valibot";

import { Uuid } from "./utils";

export const PostFormPathParams = v.object({
  siteId: Uuid,
});
export type PostFormPathParams = v.InferOutput<typeof PostFormPathParams>;

export const FormSchema = v.nullish(v.looseObject({}));
export type FormSchema = v.InferOutput<typeof FormSchema>;

export const PostFormJson = v.object({
  name: v.pipe(v.string(), v.trim()),
  schema: FormSchema,
});
export type PostFormJson = v.InferOutput<typeof PostFormJson>;

export const PatchFormPathParams = v.object({
  siteId: Uuid,
  formId: Uuid,
});
export type PatchFormPathParams = v.InferOutput<typeof PatchFormPathParams>;

export const PatchFormJson = v.partial(PostFormJson);
export type PatchFormJson = v.InferOutput<typeof PatchFormJson>;
