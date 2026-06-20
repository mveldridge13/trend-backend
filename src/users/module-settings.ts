/**
 * Per-user feature module toggles.
 *
 * Stored as a JSON column on the User (`moduleSettings`). Defaults are applied
 * on read so clients never have to invent their own default, and only the keys
 * a client actually sets are persisted. Adding a new module = add a key here,
 * no migration required.
 */
export interface ModuleSettings {
  pokerTracker: boolean;
  [key: string]: boolean;
}

export const DEFAULT_MODULE_SETTINGS: ModuleSettings = {
  pokerTracker: false,
};

/**
 * Coerce a raw stored value into a plain object of module flags.
 */
function asRecord(value: unknown): Record<string, boolean> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, boolean>;
  }
  return {};
}

/**
 * Read-side: merge stored settings over the canonical defaults so every known
 * module always has an explicit boolean (e.g. `{ pokerTracker: false }`).
 */
export function withModuleDefaults(stored: unknown): ModuleSettings {
  return { ...DEFAULT_MODULE_SETTINGS, ...asRecord(stored) };
}

/**
 * Write-side: shallow last-write-wins merge of an incoming partial over the
 * existing stored settings, so toggling one module never clobbers others.
 * Defaults are intentionally NOT injected here — they're applied on read — to
 * keep persisted data minimal.
 */
export function mergeModuleSettings(
  existing: unknown,
  incoming: Record<string, boolean> | undefined,
): Record<string, boolean> {
  return { ...asRecord(existing), ...asRecord(incoming) };
}
