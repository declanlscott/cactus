import * as v from "valibot";

import { Primitive } from "./primitive";

export const PostSubmissionPathParams = v.object({
  siteId: v.pipe(v.string(), v.uuid()),
  formId: v.pipe(v.string(), v.uuid()),
});
export type PostSubmissionPathParams = v.InferOutput<
  typeof PostSubmissionPathParams
>;

export const PostSubmissionForm = v.record(v.string(), Primitive);
export type PostSubmissionForm = v.InferOutput<typeof PostSubmissionForm>;
