import * as v from "valibot";

import type { HttpError } from "../errors/http";

export type CustomError<TError extends HttpError> = {
  Error: new (message?: string, statusCode?: number) => TError;
  message?: string;
};

export const validator =
  <TSchema extends v.GenericSchema, TError extends HttpError>(
    schema: TSchema,
    customError?: CustomError<TError>,
  ) =>
  (input: unknown) => {
    try {
      return v.parse(schema, input);
    } catch (e) {
      console.error(e);

      if (v.isValiError(e) && customError)
        throw new customError.Error(customError.message ?? e.message);

      throw e;
    }
  };
