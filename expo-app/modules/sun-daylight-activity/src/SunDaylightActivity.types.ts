export type SunLiveActivityPhase = 'daylight' | 'night';

export type StartSunLiveActivityInput = {
  sunrise: string;
  sunset: string;
  lastLight: string;
  dayLength?: string;
  deepLink?: string;
};

export type SunLiveActivityState = {
  isSupported: boolean;
  areActivitiesEnabled: boolean;
  activeActivityId: string | null;
  phase: SunLiveActivityPhase | null;
  targetDate: string | null;
  staleDate: string | null;
};

export type SunDaylightActivityModuleEvents = Record<string, never>;
