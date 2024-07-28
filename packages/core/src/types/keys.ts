import type { KEY_DELIMITER } from "../constants";

export type KeyDelimiter = typeof KEY_DELIMITER;

export type Prefix<TPrefix extends string> = {
  [Prefix in TPrefix]: `${Prefix}${KeyDelimiter}`;
};

export type WithPrefix<
  TPrefix extends string,
  TValue extends string,
> = `${TPrefix}${TValue}`;
