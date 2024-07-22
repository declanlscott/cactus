import * as v from "valibot";

import { Primitive } from "./primitive";

export const PostSubmissionQueryParams = v.object({
  siteId: v.pipe(v.string(), v.uuid()),
  formId: v.pipe(v.string(), v.uuid()),
});
export type PostSubmissionQueryParams = v.InferOutput<
  typeof PostSubmissionQueryParams
>;

export const PostSubmissionForm = v.record(v.string(), Primitive);
export type PostSubmissionForm = v.InferOutput<typeof PostSubmissionForm>;
