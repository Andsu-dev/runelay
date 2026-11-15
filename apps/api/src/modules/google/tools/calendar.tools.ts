import { ok } from "@runelay/shared";
import { z } from "zod";
import { GOOGLE_API } from "@/modules/google/constants/google.constants";
import { defineGoogleTool } from "@/modules/google/utils/google-tool";

interface CalendarTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  htmlLink?: string;
  start?: CalendarTime;
  end?: CalendarTime;
  attendees?: { email?: string; responseStatus?: string }[];
}

interface CalendarListEntry {
  id: string;
  summary?: string;
  primary?: boolean;
  accessRole?: string;
  timeZone?: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const when = z.union([z.iso.date(), z.iso.datetime({ offset: true, local: true })]);

const calendarId = z.string().min(1).default("primary");

const eventsUrl = (calendar: string) => `${GOOGLE_API.calendar}/calendars/${encodeURIComponent(calendar)}/events`;

const timeOf = (value: string, timeZone: string | undefined) =>
  DATE_ONLY.test(value) ? { date: value } : { dateTime: value, ...(timeZone ? { timeZone } : {}) };

const eventView = (event: CalendarEvent) => ({
  id: event.id,
  summary: event.summary ?? null,
  description: event.description ?? null,
  location: event.location ?? null,
  status: event.status ?? null,
  start: event.start ?? null,
  end: event.end ?? null,
  attendees: (event.attendees ?? []).map((attendee) => ({
    email: attendee.email ?? null,
    responseStatus: attendee.responseStatus ?? null,
  })),
  htmlLink: event.htmlLink ?? null,
});

export const calendarTools = [
  defineGoogleTool({
    name: "list_calendars",
    description: "List the calendars on the user's calendar list with their ids and access role. Scope: calendar.",
    input: z.object({}),
    run: async (api) => {
      const listed = await api<{ items?: CalendarListEntry[] }>({
        url: `${GOOGLE_API.calendar}/users/me/calendarList`,
      });
      if (listed.error) return listed;
      return ok({
        calendars: (listed.data.items ?? []).map((calendar) => ({
          id: calendar.id,
          summary: calendar.summary ?? null,
          primary: calendar.primary ?? false,
          accessRole: calendar.accessRole ?? null,
          timeZone: calendar.timeZone ?? null,
        })),
      });
    },
  }),
  defineGoogleTool({
    name: "list_events",
    description:
      "List events of a calendar ordered by start time, optionally between timeMin and timeMax (RFC 3339) or matching a text query. Scope: calendar.events.",
    input: z.object({
      calendarId,
      timeMin: z.iso.datetime({ offset: true }).optional(),
      timeMax: z.iso.datetime({ offset: true }).optional(),
      q: z.string().min(1).optional(),
      maxResults: z.number().int().min(1).max(250).default(25),
      pageToken: z.string().optional(),
    }),
    run: async (api, { calendarId: calendar, timeMin, timeMax, q, maxResults, pageToken }) => {
      const listed = await api<{ items?: CalendarEvent[]; nextPageToken?: string }>({
        url: eventsUrl(calendar),
        query: { singleEvents: true, orderBy: "startTime", timeMin, timeMax, q, maxResults, pageToken },
      });
      if (listed.error) return listed;
      return ok({
        events: (listed.data.items ?? []).map(eventView),
        nextPageToken: listed.data.nextPageToken ?? null,
      });
    },
  }),
  defineGoogleTool({
    name: "create_event",
    description:
      "Create a calendar event. start and end are RFC 3339 date-times or YYYY-MM-DD dates for all-day events (end date is exclusive). Pass timeZone (IANA) when the date-times have no offset. Returns its id and link. Scope: calendar.events.",
    input: z.object({
      calendarId,
      summary: z.string().min(1),
      description: z.string().optional(),
      location: z.string().optional(),
      start: when,
      end: when,
      timeZone: z.string().min(1).optional(),
      attendees: z.array(z.email()).optional(),
    }),
    run: async (api, input) => {
      const created = await api<CalendarEvent>({
        url: eventsUrl(input.calendarId),
        method: "POST",
        json: {
          summary: input.summary,
          description: input.description,
          location: input.location,
          start: timeOf(input.start, input.timeZone),
          end: timeOf(input.end, input.timeZone),
          attendees: input.attendees?.map((email) => ({ email })),
        },
      });
      if (created.error) return created;
      return ok({ id: created.data.id, htmlLink: created.data.htmlLink ?? null });
    },
  }),
  defineGoogleTool({
    name: "delete_event",
    description: "Delete an event from a calendar. Scope: calendar.events.",
    input: z.object({ calendarId, eventId: z.string().min(1) }),
    run: async (api, { calendarId: calendar, eventId }) => {
      const deleted = await api({ url: `${eventsUrl(calendar)}/${encodeURIComponent(eventId)}`, method: "DELETE" });
      if (deleted.error) return deleted;
      return ok({ deleted: true, eventId });
    },
  }),
];
