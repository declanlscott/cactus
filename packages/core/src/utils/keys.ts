import { KEY_DELIMITER } from "../constants";
import { Prefix, WithPrefix } from "../types/keys";

export const createPrefix = <TKey extends string>(
  keys: Array<TKey>,
): Prefix<TKey> =>
  keys.reduce((prefix, key) => {
    prefix[key] = `${key}${KEY_DELIMITER}`;

    return prefix;
  }, {} as Prefix<TKey>);

export const withPrefix = <TPrefix extends string, TValue extends string>(key: {
  prefix: TPrefix;
  value: TValue;
}): WithPrefix<TPrefix, TValue> => `${key.prefix}${key.value}`;

export const stripPrefix = <TPrefix extends string>(
  prefix: TPrefix,
  value: string,
) => value.slice(prefix.length);

export const delimitKeys = (keys: Array<string>) =>
  `${keys.join(KEY_DELIMITER)}${KEY_DELIMITER}`;

export const pk = withPrefix;

export const sk = <TPrefix extends string, TValue extends string>(
  keys: Array<{ prefix: TPrefix; value: TValue }>,
) => delimitKeys(keys.map(withPrefix));
