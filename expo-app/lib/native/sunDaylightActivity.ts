import { Platform } from 'react-native';
import type {
  StartSunLiveActivityInput,
  SunLiveActivityState,
} from '@/modules/sun-daylight-activity/src/SunDaylightActivity.types';

// Only import the native module on iOS — it crashes on Android at import time
// because requireNativeModule('SunDaylightActivity') throws when the module doesn't exist.
const SunDaylightActivityModule = Platform.OS === 'ios'
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? (require('@/modules/sun-daylight-activity').default as {
      startSunLiveActivity(input: StartSunLiveActivityInput): Promise<SunLiveActivityState>;
      endSunLiveActivity(): Promise<SunLiveActivityState>;
      getSunLiveActivityState(): Promise<SunLiveActivityState>;
    })
  : null;

const unsupportedState: SunLiveActivityState = {
  isSupported: false,
  areActivitiesEnabled: false,
  activeActivityId: null,
  phase: null,
  targetDate: null,
  staleDate: null,
};

export type { StartSunLiveActivityInput, SunLiveActivityState };

export async function startSunLiveActivity(
  input: StartSunLiveActivityInput
): Promise<SunLiveActivityState> {
  if (!SunDaylightActivityModule) return unsupportedState;
  return SunDaylightActivityModule.startSunLiveActivity(input);
}

export async function endSunLiveActivity(): Promise<SunLiveActivityState> {
  if (!SunDaylightActivityModule) return unsupportedState;
  return SunDaylightActivityModule.endSunLiveActivity();
}

export async function getSunLiveActivityState(): Promise<SunLiveActivityState> {
  if (!SunDaylightActivityModule) return unsupportedState;
  return SunDaylightActivityModule.getSunLiveActivityState();
}
