import Ajv from "ajv";

import type { SchemaObject } from "ajv";
import type { HttpError } from "../errors";
import type { CustomError } from "../types/errors";

export type JsonSchema = SchemaObject;

export const ajv = new Ajv();

export const validateSchema = <TSchema extends SchemaObject>(schema: TSchema) =>
  ajv.validateSchema(schema);

export const ajvValidator =
  <TError extends HttpError>(
    schema: JsonSchema,
    customError?: CustomError<TError>,
  ) =>
  (data: Record<string, unknown>) => {
    const validate = ajv.compile(schema);

    const isValid = validate(data);

    if (!isValid) {
      console.error(validate.errors);

      const errorMessage = validate.errors
        ?.map((error) => error.message)
        .join(", ");

      if (customError)
        throw new customError.Error(customError.message ?? errorMessage);

      throw new Error(errorMessage);
    }

    return data;
  };
