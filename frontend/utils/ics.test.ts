import { describe, it, expect } from 'vitest';
import { buildIcs, resolveEventEnd } from './ics';

const start = new Date('2026-09-21T13:00:00Z');
const end = new Date('2026-09-21T14:00:00Z');
const now = new Date('2026-09-20T08:30:00Z');

describe('buildIcs', () => {
  it('produces a single VEVENT with UTC start/end, CRLF line endings and a trailing CRLF', () => {
    const ics = buildIcs({ start, end, summary: 'Échange', uid: 'booking-1@ia.maxime.bzh' }, now);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics).toContain('UID:booking-1@ia.maxime.bzh\r\n');
    expect(ics).toContain('DTSTAMP:20260920T083000Z\r\n');
    expect(ics).toContain('DTSTART:20260921T130000Z\r\n');
    expect(ics).toContain('DTEND:20260921T140000Z\r\n');
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('escapes backslashes, semicolons, commas and newlines in text values', () => {
    const ics = buildIcs(
      { start, end, summary: 'a;b,c\\d', description: 'ligne 1\nligne 2', uid: 'u' },
      now,
    );

    expect(ics).toContain('SUMMARY:a\\;b\\,c\\\\d\r\n');
    expect(ics).toContain('DESCRIPTION:ligne 1\\nligne 2\r\n');
  });

  it('omits DESCRIPTION when none is given', () => {
    expect(buildIcs({ start, end, summary: 'x', uid: 'u' }, now)).not.toContain('DESCRIPTION');
  });

  it('folds content lines longer than 75 octets without splitting a multi-byte character', () => {
    const ics = buildIcs({ start, end, summary: 'é'.repeat(100), uid: 'u' }, now);
    const encoder = new TextEncoder();

    for (const line of ics.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    // Unfolding restores the original text exactly.
    expect(ics.replace(/\r\n /g, '')).toContain(`SUMMARY:${'é'.repeat(100)}`);
  });
});

describe('resolveEventEnd', () => {
  it('uses the end returned by Cal.eu when it is sensible', () => {
    expect(resolveEventEnd(start, '2026-09-21T13:30:00Z').toISOString()).toBe(
      '2026-09-21T13:30:00.000Z',
    );
  });

  it('falls back to one hour when the end is missing, unparseable, not after start, or too long', () => {
    const oneHour = end.toISOString();

    expect(resolveEventEnd(start, undefined).toISOString()).toBe(oneHour);
    expect(resolveEventEnd(start, 'garbage').toISOString()).toBe(oneHour);
    expect(resolveEventEnd(start, '2026-09-21T12:00:00Z').toISOString()).toBe(oneHour);
    expect(resolveEventEnd(start, '2026-09-22T13:00:00Z').toISOString()).toBe(oneHour);
  });
});
