import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { addDays, format, parseISO, isAfter, addMinutes } from 'date-fns';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Doctor's timezone — all schedule hours (09:00, 18:00, etc.) are in this tz.
// CST = UTC-6, CDT = UTC-5. We use a helper to compute the real offset at runtime.
const DOCTOR_TZ = 'America/Mexico_City';

/**
 * Returns the UTC offset in minutes for a given IANA timezone on a given date.
 * Positive means *behind* UTC (e.g. UTC-6 → 360).
 */
function getTzOffsetMinutes(tz: string, date: Date): number {
  // Format the date in the target timezone to extract the UTC offset
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset'
  }).formatToParts(date);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
  // offsetPart looks like "GMT-6" or "GMT-5" or "GMT+2"
  const match = offsetPart.match(/GMT([+-]?\d+):?(\d+)?/);
  if (!match) return 360; // default CST = 6 hours
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2] || '0', 10);
  // Return offset as positive-west (so UTC-6 → +360)
  return -(hours * 60 + (hours < 0 ? -mins : mins));
}

/**
 * Build a Date in UTC that corresponds to the given local time in the doctor's tz.
 * E.g. if baseDateUTC is June 23 (any time), localHour=9, localMin=0, tz offset = 360 (UTC-6)
 * → returns a Date for June 23 09:00 Mexico = June 23 15:00 UTC.
 */
function localTimeToUTC(baseDateUTC: Date, localHour: number, localMin: number, tzOffsetMin: number): Date {
  const d = new Date(baseDateUTC);
  // Set to midnight UTC first
  d.setUTCHours(0, 0, 0, 0);
  // Add the local hour/min, then add the offset to convert to UTC
  d.setUTCHours(localHour, localMin, 0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + tzOffsetMin);
  return d;
}

/**
 * Get the local date string (yyyy-MM-dd) for a UTC date in the doctor's timezone.
 */
function getLocalDateStr(utcDate: Date, tz: string): string {
  return utcDate.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA gives yyyy-MM-dd
}

/**
 * Get the day-of-week (0=Sun..6=Sat) in the doctor's local timezone.
 */
function getLocalDayOfWeek(utcDate: Date, tz: string): number {
  const localStr = utcDate.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[localStr] ?? utcDate.getDay();
}

// Default schedule settings if doctor has not set any
const DEFAULT_DURATION = 30; // 30 minutes
const DEFAULT_SCHEDULE = {
  duration: DEFAULT_DURATION,
  days: {
    '1': { active: true, start: '09:00', end: '18:00' }, // Mon
    '2': { active: true, start: '09:00', end: '18:00' }, // Tue
    '3': { active: true, start: '09:00', end: '18:00' }, // Wed
    '4': { active: true, start: '09:00', end: '18:00' }, // Thu
    '5': { active: true, start: '09:00', end: '18:00' }, // Fri
    '6': { active: false, start: '09:00', end: '14:00' }, // Sat
    '0': { active: false, start: '09:00', end: '14:00' }  // Sun
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Falta el enlace de perfil (slug)' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Fetch the doctor's profile by slug
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[Public Doctor GET] Profile not found for slug:', slug, profileError);
      return NextResponse.json({ error: 'Médico no encontrado' }, { status: 404 });
    }

    // Resolve schedule settings with defaults
    const scheduleSettings = {
      duration: profile.schedule_settings?.duration || DEFAULT_SCHEDULE.duration,
      days: {
        ...DEFAULT_SCHEDULE.days,
        ...(profile.schedule_settings?.days || {})
      },
      break_enabled: !!profile.schedule_settings?.break_enabled,
      break_start: profile.schedule_settings?.break_start || '14:00',
      break_end: profile.schedule_settings?.break_end || '15:00'
    };

    const duration = Number(scheduleSettings.duration) || DEFAULT_DURATION;

    const nowUTC = new Date();
    const endDate = addDays(nowUTC, 14);

    // Clean up expired pending appointments (older than 15 minutes) to release slots
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('payment_status', 'pendiente')
      .lt('created_at', fifteenMinsAgo);

    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('id, start_time, end_time, status')
      .eq('doctor_id', profile.user_id)
      .neq('status', 'cancelled')
      .gte('start_time', nowUTC.toISOString())
      .lte('start_time', endDate.toISOString());

    if (appointmentsError) {
      console.error('[Public Doctor GET] Error fetching appointments:', appointmentsError);
      return NextResponse.json({ error: 'Error al obtener la disponibilidad' }, { status: 500 });
    }

    // 3. Generate available slots for the next 14 days
    //    All doctor schedule hours are in DOCTOR_TZ (America/Mexico_City).
    //    We must convert them to UTC before generating ISO strings.
    const availableSlotsByDay: Record<string, string[]> = {};
    const nowPlusBuffer = addMinutes(nowUTC, 30); // 30-minute buffer

    for (let i = 0; i < 14; i++) {
      const currentDayUTC = addDays(nowUTC, i);
      // Compute the local day of week in the doctor's timezone
      const localDow = getLocalDayOfWeek(currentDayUTC, DOCTOR_TZ);
      const dayOfWeekStr = String(localDow);
      const daySettings = scheduleSettings.days[dayOfWeekStr as keyof typeof scheduleSettings.days];

      if (!daySettings || !daySettings.active) {
        continue;
      }

      // Get the local date string for grouping
      const dateStr = getLocalDateStr(currentDayUTC, DOCTOR_TZ);
      availableSlotsByDay[dateStr] = [];

      // Compute the UTC offset for this specific date (handles DST transitions)
      const tzOffset = getTzOffsetMinutes(DOCTOR_TZ, currentDayUTC);

      // Parse work hours start and end (in local time)
      const [startHour, startMin] = daySettings.start.split(':').map(Number);
      const [endHour, endMin] = daySettings.end.split(':').map(Number);

      // Convert local work-window boundaries to UTC Date objects
      // Use the local date (not UTC date) as the base for correct day alignment
      const localDateParts = dateStr.split('-').map(Number); // [yyyy, mm, dd]
      const baseDateForLocal = new Date(Date.UTC(localDateParts[0], localDateParts[1] - 1, localDateParts[2]));
      
      const dayStartUTC = localTimeToUTC(baseDateForLocal, startHour, startMin, tzOffset);
      const dayEndUTC = localTimeToUTC(baseDateForLocal, endHour, endMin, tzOffset);

      // Parse break start and end, and convert to UTC for this specific day
      let breakStartUTC: Date | null = null;
      let breakEndUTC: Date | null = null;
      if (scheduleSettings.break_enabled) {
        const [bStartHour, bStartMin] = scheduleSettings.break_start.split(':').map(Number);
        const [bEndHour, bEndMin] = scheduleSettings.break_end.split(':').map(Number);
        breakStartUTC = localTimeToUTC(baseDateForLocal, bStartHour, bStartMin, tzOffset);
        breakEndUTC = localTimeToUTC(baseDateForLocal, bEndHour, bEndMin, tzOffset);
      }

      let slotStart = dayStartUTC;

      while (slotStart < dayEndUTC) {
        const slotEnd = addMinutes(slotStart, duration);

        // Check if slot overlaps with break time
        let overlapsWithBreak = false;
        if (scheduleSettings.break_enabled && breakStartUTC && breakEndUTC) {
          overlapsWithBreak = slotStart < breakEndUTC && slotEnd > breakStartUTC;
        }

        // Only include future slots (past the buffer) and slots not overlapping with break
        if (!overlapsWithBreak && isAfter(slotStart, nowPlusBuffer)) {
          const hasConflict = appointments?.some(app => {
            const appStart = parseISO(app.start_time);
            const appEnd = parseISO(app.end_time);
            return appStart < slotEnd && appEnd > slotStart;
          });

          if (!hasConflict) {
            availableSlotsByDay[dateStr].push(slotStart.toISOString());
          }
        }

        slotStart = slotEnd;
      }

      if (availableSlotsByDay[dateStr].length === 0) {
        delete availableSlotsByDay[dateStr];
      }
    }

    // Return the public profile details and available slots
    return NextResponse.json({
      doctor: {
        id: profile.user_id,
        full_name: profile.full_name,
        specialty: profile.specialty,
        bio: profile.bio,
        profile_photo_url: profile.profile_photo_url,
        social_links: profile.social_links,
        clinic_name: profile.clinic_name,
        clinic_id: profile.clinic_id,
        clinic_address: profile.clinic_address,
        clinic_city: profile.clinic_city,
        clinic_state: profile.clinic_state,
        clinic_postal_code: profile.clinic_postal_code,
        gallery_images: profile.gallery_images || [],
        teleconsulta_enabled: profile.teleconsulta_enabled,
        teleconsulta_price: profile.teleconsulta_price,
        presencial_price: profile.presencial_price,
        payment_required: profile.payment_required
      },
      duration,
      availableSlots: availableSlotsByDay
    });
  } catch (error) {
    console.error('[Public Doctor GET] Exception:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
