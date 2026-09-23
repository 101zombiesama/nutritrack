/**
 * Memoizes a two-argument derivation by the identity of its first argument
 * (a data array) plus a primitive key for the second, so the same input is
 * not re-derived on every render. Entries are released with the array.
 */
export function memoizeByRef<A extends object, K, R>(
  fn: (input: A, key: K) => R,
  keyFor: (key: K) => string | number = (key) => key as unknown as string,
): (input: A, key: K) => R {
  const cache = new WeakMap<A, Map<string | number, R>>();

  return (input, key) => {
    const cacheKey = keyFor(key);
    let bucket = cache.get(input);
    if (!bucket) {
      bucket = new Map();
      cache.set(input, bucket);
    }
    const hit = bucket.get(cacheKey);
    if (hit !== undefined) return hit;

    const result = fn(input, key);
    bucket.set(cacheKey, result);
    return result;
  };
}
