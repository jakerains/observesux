import type { SunData } from '@/lib/types';

export type SunLiveActivityPayload = {
  sunrise: string;
  sunset: string;
  lastLight: string;
  dayLength?: string;
  deepLink: string;
};

function toNativeISOString(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function parseSunClockTime(time: string, onDate: Date = new Date()): Date {
  const match = time.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)/i);
  if (!match) {
    throw new Error(`Invalid sun clock time: ${time}`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  const meridiem = match[4].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  const result = new Date(onDate);
  result.setHours(hours, minutes, seconds, 0);
  return result
}

export function buildSunLiveActivityPayload(
  sun: SunData,
  now: Date = new Date()
): SunLiveActivityPayload {
  const sunrise = parseSunClockTime(sun.sunrise, now);
  const sunset = parseSunClockTime(sun.sunset, now);
  const lastLight = parseSunClockTime(sun.lastLight, now);

  return {
    sunrise: toNativeISOString(sunrise),
    sunset: toNativeISOString(sunset),
    lastLight: toNativeISOString(lastLight),
    dayLength: sun.dayLength,
    deepLink: 'siouxland://sun',
  };
}
