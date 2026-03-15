import { Platform } from 'react-native';
import SunDaylightActivityModule, {
  type StartSunLiveActivityInput,
  type SunLiveActivityState,
} from '@/modules/sun-daylight-activity';

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
  if (Platform.OS !== 'ios') {
    return unsupportedState;
  }

  return SunDaylightActivityModule.startSunLiveActivity(input);
}

export async function endSunLiveActivity(): Promise<SunLiveActivityState> {
  if (Platform.OS !== 'ios') {
    return unsupportedState;
  }

  return SunDaylightActivityModule.endSunLiveActivity();
}

export async function getSunLiveActivityState(): Promise<SunLiveActivityState> {
  if (Platform.OS !== 'ios') {
    return unsupportedState;
  }

  return SunDaylightActivityModule.getSunLiveActivityState();
}
