import * as v from "valibot";

import type { HttpError } from "../errors/http";
import type { CustomError } from "../types/errors";

export const vValidator =
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
