/** UUID-shape validation aligned with Java UUID and PostgreSQL UUID values. */

import { z } from "zod";

/**
 * Zod's strict uuid() also validates RFC version and variant bits. HemoGrid's
 * deterministic seed IDs are valid Java/PostgreSQL UUID values but intentionally
 * do not encode those bits, so guid() is the correct transport-boundary rule.
 */
export function backendUuid(message: string) {
  return z.guid(message);
}
