/**
 * Helpers for editing lists of records that carry an `id`.
 *
 * Edits are applied through a draft. Short lists are copied first; long
 * histories (months of logged meals) skip the copy so a one-record change
 * stays O(1) instead of cloning the whole array on every keystroke.
 */
const COPY_UP_TO = 64;

function edit<T>(list: T[], apply: (draft: T[]) => void): T[] {
  const draft = list.length < COPY_UP_TO ? [...list] : list;
  apply(draft);
  return draft;
}

/** The list without the record whose id matches. Unknown ids are a no-op. */
export function withoutId<T extends { id: string }>(list: T[], id: string): T[] {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return list;
  return edit(list, (draft) => {
    draft.splice(index, 1);
  });
}

/** The list with `patch` applied to the record whose id matches. */
export function withPatch<T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return list;
  return edit(list, (draft) => {
    Object.assign(draft[index], patch);
  });
}
