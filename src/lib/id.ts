/** Short, collision-resistant id that works in every browser we target. */
export function createId(prefix = "id"): string {
  const random = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-6);
  return `${prefix}_${time}${random}`;
}
