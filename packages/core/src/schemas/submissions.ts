import * as v from "valibot";

import { Primitive } from "./primitive";

export const NewSubmissionQueryParams = v.object({
  siteId: v.pipe(v.string(), v.uuid()),
  formId: v.pipe(v.string(), v.uuid()),
});
export type NewSubmissionQueryParams = v.InferOutput<
  typeof NewSubmissionQueryParams
>;

export const NewSubmissionFormData = v.record(v.string(), Primitive);
export type NewSubmissionFormData = v.InferOutput<typeof NewSubmissionFormData>;
