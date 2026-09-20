import { describe, it, expect } from 'vitest';
import { extractSlots, groupSlotsByDay, LIST_SLOTS_TOOL } from './slots';
import type { ToolCallTrace } from '../types/index';

const call = (output: unknown, overrides: Partial<ToolCallTrace> = {}): ToolCallTrace => ({
  tool: LIST_SLOTS_TOOL,
  arguments: { start: '2026-09-21', end: '2026-09-25' },
  status: 'completed',
  output,
  ...overrides,
});

// Cal.com v2 (slots 2024-09-04) shape: { status, data: { "YYYY-MM-DD": [{ start }] } }
const v2Response = {
  status: 'success',
  data: {
    '2026-09-21': [
      { start: '2026-09-21T09:00:00.000+02:00' },
      { start: '2026-09-21T09:30:00.000+02:00' },
    ],
    '2026-09-22': [{ start: '2026-09-22T14:00:00.000+02:00' }],
  },
};

describe('extractSlots', () => {
  it('reads slots grouped by day out of the Cal.eu response, sorted', () => {
    const slots = extractSlots([call({ status_code: 200, response_data: v2Response })]);

    expect(slots.map((s) => s.iso)).toEqual([
      '2026-09-21T09:00:00.000+02:00',
      '2026-09-21T09:30:00.000+02:00',
      '2026-09-22T14:00:00.000+02:00',
    ]);
  });

  it('also understands the older { data: { slots: { day: [{ time }] } } } shape', () => {
    const slots = extractSlots([
      call({
        response_data: {
          data: { slots: { '2026-09-21': [{ time: '2026-09-21T10:00:00+02:00' }] } },
        },
      }),
    ]);

    expect(slots.map((s) => s.iso)).toEqual(['2026-09-21T10:00:00+02:00']);
  });

  it('understands a flat list of ISO strings or { start } objects', () => {
    const slots = extractSlots([
      call({
        response_data: { data: ['2026-09-21T11:00:00Z', { start: '2026-09-21T10:00:00Z' }] },
      }),
    ]);

    expect(slots.map((s) => s.iso)).toEqual(['2026-09-21T10:00:00Z', '2026-09-21T11:00:00Z']);
  });

  it('drops duplicates of the same instant', () => {
    const slots = extractSlots([
      call({
        response_data: {
          data: { '2026-09-21': ['2026-09-21T10:00:00+02:00', '2026-09-21T08:00:00Z'] },
        },
      }),
    ]);

    expect(slots).toHaveLength(1);
  });

  it('uses the most recent completed call when the tool ran more than once', () => {
    const slots = extractSlots([
      call({ response_data: { data: { '2026-09-21': ['2026-09-21T10:00:00Z'] } } }),
      call({ response_data: { data: { '2026-09-22': ['2026-09-22T10:00:00Z'] } } }),
    ]);

    expect(slots.map((s) => s.iso)).toEqual(['2026-09-22T10:00:00Z']);
  });

  it('ignores failed calls and other tools', () => {
    expect(
      extractSlots([
        call({ error: 'boom' }, { status: 'failed' }),
        call(v2Response, { tool: 'planifier_entretien' }),
      ]),
    ).toEqual([]);
  });

  it('returns nothing for an unrecognised or empty output rather than guessing', () => {
    expect(extractSlots(undefined)).toEqual([]);
    expect(extractSlots([call(null)])).toEqual([]);
    expect(extractSlots([call({ response_data: { data: { message: 'no slots' } } })])).toEqual([]);
  });

  it('does not mistake the echoed tool arguments for slots when response_data is absent', () => {
    const slots = extractSlots([
      call(
        { start: '2026-09-21T09:00:00Z', end: '2026-09-25T09:00:00Z' },
        {
          arguments: { start: '2026-09-21T09:00:00Z', end: '2026-09-25T09:00:00Z' },
        },
      ),
    ]);

    expect(slots).toEqual([]);
  });

  it('skips strings that are not datetimes', () => {
    const slots = extractSlots([
      call({
        response_data: { data: { '2026-09-21': ['not a date', '2026-09-21', { start: 42 }] } },
      }),
    ]);

    expect(slots).toEqual([]);
  });
});

describe('groupSlotsByDay', () => {
  const now = new Date('2026-09-20T00:00:00Z');
  // Midday-ish UTC instants so the grouping by *local* day is the same in any
  // timezone the tests happen to run in.
  const at = (day: number, hour: number) => {
    const iso = `2026-09-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`;

    return { iso, date: new Date(iso) };
  };

  it('groups by day and keeps only the first three days', () => {
    const days = groupSlotsByDay([at(21, 10), at(22, 10), at(23, 10), at(24, 10)], { now });

    expect(days).toHaveLength(3);
    expect(days.map((d) => d.slots.length)).toEqual([1, 1, 1]);
  });

  it('spreads at most four slots per day across the whole day instead of the first four', () => {
    const slots = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => at(21, h));
    const [day] = groupSlotsByDay(slots, { now });

    expect(day!.slots).toHaveLength(4);
    expect(day!.slots[0]).toBe(slots[0]);
    expect(day!.slots[3]).toBe(slots[9]);
  });

  it('drops slots that are already in the past', () => {
    const days = groupSlotsByDay([at(19, 10), at(21, 10)], { now });

    expect(days).toHaveLength(1);
    expect(days[0]!.slots[0]!.iso).toBe('2026-09-21T10:00:00Z');
  });

  it('returns an empty list when nothing is left', () => {
    expect(groupSlotsByDay([], { now })).toEqual([]);
  });
});
