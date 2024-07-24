import * as v from "valibot";

import { gsi1, PK, SK } from "../constants";
import { validateSchema } from "./ajv";

export const FormName = v.pipe(v.string(), v.trim());
export type FormName = v.InferOutput<typeof FormName>;

export const FormSchema = v.pipeAsync(
  v.nullish(v.looseObject({})),
  v.checkAsync(async (schema) => {
    if (!schema) return true;

    const result = await Promise.resolve(validateSchema(schema));

    return Boolean(result);
  }),
);
export type FormSchema = v.InferOutput<typeof FormSchema>;

export const FormEmails = v.pipe(
  v.array(v.pipe(v.string(), v.email())),
  v.minLength(1),
  v.maxLength(3),
);

export const Form = v.objectAsync({
  [PK]: v.string(),
  [SK]: v.string(),
  [gsi1.pk]: v.string(),
  [gsi1.sk]: v.string(),
  name: FormName,
  schema: v.nullishAsync(FormSchema),
  emails: v.nullish(FormEmails),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type Form = v.InferOutput<typeof Form>;
