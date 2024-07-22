import Ajv from "ajv";

import type { AnySchema, JSONSchemaType } from "ajv";
import type { HttpError } from "../errors";
import type { CustomError } from "../types/errors";

export type { JSONSchemaType } from "ajv";

export const ajv = new Ajv();

export const validateSchema = <TSchema extends AnySchema>(schema: TSchema) =>
  ajv.validateSchema(schema);

export const ajvValidator =
  <TSchema, TError extends HttpError>(
    schema: JSONSchemaType<TSchema>,
    customError?: CustomError<TError>,
  ) =>
  (data: unknown) => {
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
