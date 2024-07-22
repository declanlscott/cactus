import type { HttpError } from "../errors/http";

export type CustomError<TError extends HttpError> = {
  Error: new (message?: string, statusCode?: number) => TError;
  message?: string;
};
