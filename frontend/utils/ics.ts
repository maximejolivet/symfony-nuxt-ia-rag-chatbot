// Minimal RFC 5545 (iCalendar) builder for the "Entretien confirmé" card's
// "Ajouter à mon calendrier" button -- one VEVENT, generated client-side, no
// backend involved.

const DEFAULT_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 4 * 60;

export interface IcsEvent {
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  // Deterministic per booking so re-importing the same file updates the
  // calendar entry instead of duplicating it.
  uid: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');

// UTC form (`YYYYMMDDTHHMMSSZ`) -- no VTIMEZONE block needed.
const formatUtc = (date: Date): string =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
  `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

const escapeText = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Content lines are limited to 75 octets; longer ones continue on the next
// line after CRLF + one space. Counted in UTF-8 bytes, never splitting a
// code point.
const fold = (line: string): string => {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  // First line may hold 75 octets, continuations 74 (the leading space counts).
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);

  return parts.join('\r\n ');
};

export const buildIcs = (event: IcsEvent, now: Date = new Date()): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//maxime.bzh//Chatbot IA//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(event.start)}`,
    `DTEND:${formatUtc(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.map(fold).join('\r\n') + '\r\n';
};

/**
 * End of the booking. Cal.eu's booking response carries the real `end`, which
 * matters because the event type is offered in 30 and 60 minutes; anything
 * unparseable, not after `start`, or implausibly long falls back to one hour
 * rather than trusting an odd value from a third-party payload.
 */
export const resolveEventEnd = (start: Date, rawEnd: unknown): Date => {
  const fallback = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60_000);
  if ('string' !== typeof rawEnd) return fallback;

  const end = new Date(rawEnd);
  const minutes = (end.getTime() - start.getTime()) / 60_000;
  if (Number.isNaN(minutes) || minutes <= 0 || minutes > MAX_DURATION_MINUTES) return fallback;

  return end;
};

export const downloadIcs = (content: string, filename: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
