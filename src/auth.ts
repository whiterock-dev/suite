/** Emails allowed to edit the suite. Enforce the same list in Firestore rules. */
const ALLOWED_EDITORS = new Set(
  ["axit@nerdshouse.com", "shravansuthar80@gmail.com"].map((e) =>
    e.toLowerCase()
  )
);

export function isEditorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EDITORS.has(email.trim().toLowerCase());
}
