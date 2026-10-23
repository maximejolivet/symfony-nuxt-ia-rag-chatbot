import type { ToolCallTrace } from '../types/index';

// Name of the workflow the agent calls to check Maxime's Cal.eu availability
// (see docs/backend/bruno/Workflows, "planifier_entretien").
export const LIST_SLOTS_TOOL = 'lister_creneaux_disponibles';

export interface SlotChoice {
  // The datetime string exactly as Cal.eu returned it (offset included) --
  // sent back to the model verbatim so it never has to re-derive a timezone.
  iso: string;
  date: Date;
}

export interface SlotDay {
  // Local YYYY-MM-DD, stable key for v-for.
  key: string;
  date: Date;
  slots: SlotChoice[];
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const MAX_DEPTH = 5;

const asSlotString = (value: unknown): string | null =>
  'string' === typeof value && DATETIME.test(value) && !Number.isNaN(Date.parse(value))
    ? value
    : null;

// Accepts the shapes the Cal.com-compatible slots API is known to use: a bare
// ISO string, or an object carrying it under `start` (v2, 2024-09-04) or
// `time` (older v1-style payloads).
const asSlotEntry = (value: unknown): string | null => {
  if ('string' === typeof value) return asSlotString(value);
  if (value && 'object' === typeof value) {
    const record = value as Record<string, unknown>;

    return asSlotString(record.start) ?? asSlotString(record.time);
  }

  return null;
};

const collect = (node: unknown, out: string[], depth: number): void => {
  if (depth > MAX_DEPTH || null === node || 'object' !== typeof node) return;

  if (Array.isArray(node)) {
    for (const item of node) {
      const slot = asSlotEntry(item);
      if (slot) out.push(slot);
      else collect(item, out, depth + 1);
    }

    return;
  }

  for (const [key, value] of Object.entries(node)) {
    // `{ "2026-09-21": [ {start}, ... ] }` -- slots grouped by day.
    if (DATE_KEY.test(key) && Array.isArray(value)) {
      for (const item of value) {
        const slot = asSlotEntry(item);
        if (slot) out.push(slot);
      }
    } else {
      collect(value, out, depth + 1);
    }
  }
};

/**
 * Availability slots the model really got back from `lister_creneaux_disponibles`
 * in this message -- never slots parsed out of the model's own prose, which
 * (BACKLOG, "Valider start_time avant l'appel Cal.eu") can be wrong.
 *
 * `output` is the workflow's output_data: the tool arguments merged with the
 * step result, i.e. `{ ...arguments, status_code, response_data }`, where
 * `response_data` is Cal.eu's raw response. Falls back to the rest of the
 * output (minus the echoed arguments) if `response_data` is absent. An
 * unrecognised shape yields no slots, so the UI simply shows none.
 */
export const extractSlots = (toolCalls: ToolCallTrace[] | undefined): SlotChoice[] => {
  const call = toolCalls?.findLast((c) => LIST_SLOTS_TOOL === c.tool && 'completed' === c.status);
  const output = call?.output;
  if (!call || !output || 'object' !== typeof output) return [];

  const record = output as Record<string, unknown>;
  const args = call.arguments ?? {};
  const payload =
    record.response_data ??
    Object.fromEntries(
      Object.entries(record).filter(([key]) => 'status_code' !== key && !(key in args)),
    );

  const found: string[] = [];
  collect(payload, found, 0);

  const seen = new Set<number>();
  const slots: SlotChoice[] = [];
  for (const iso of found) {
    const date = new Date(iso);
    if (seen.has(date.getTime())) continue;
    seen.add(date.getTime());
    slots.push({ iso, date });
  }

  return slots.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// `count` indexes spread evenly over [0, length) -- keeps a morning slot, a
// midday one and an afternoon one rather than the first four half-hours.
const spread = (length: number, count: number): number[] => {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  if (1 === count) return [0];

  return [
    ...new Set(
      Array.from({ length: count }, (_, i) => Math.round((i * (length - 1)) / (count - 1))),
    ),
  ];
};

/**
 * Keeps the list short enough to be a row of chips rather than a wall: future
 * slots only, grouped by the visitor's local day, the first `maxDays` days,
 * `perDay` slots each.
 */
export const groupSlotsByDay = (
  slots: SlotChoice[],
  {
    now = new Date(),
    maxDays = 3,
    perDay = 4,
  }: { now?: Date; maxDays?: number; perDay?: number } = {},
): SlotDay[] => {
  const days = new Map<string, SlotDay>();
  for (const slot of slots) {
    if (slot.date.getTime() <= now.getTime()) continue;
    const key = localDayKey(slot.date);
    const day = days.get(key) ?? { key, date: slot.date, slots: [] };
    day.slots.push(slot);
    days.set(key, day);
  }

  return [...days.values()]
    .slice(0, maxDays)
    .map((day) => ({ ...day, slots: spread(day.slots.length, perDay).map((i) => day.slots[i]!) }));
};
