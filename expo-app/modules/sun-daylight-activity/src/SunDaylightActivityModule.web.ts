import { registerWebModule, NativeModule } from 'expo';

import type {
  StartSunLiveActivityInput,
  SunLiveActivityState,
} from './SunDaylightActivity.types';

const unsupportedState: SunLiveActivityState = {
  isSupported: false,
  areActivitiesEnabled: false,
  activeActivityId: null,
  phase: null,
  targetDate: null,
  staleDate: null,
};

class SunDaylightActivityModule extends NativeModule<Record<string, never>> {
  async startSunLiveActivity(input: StartSunLiveActivityInput): Promise<SunLiveActivityState> {
    void input;
    return unsupportedState;
  }

  async endSunLiveActivity(): Promise<SunLiveActivityState> {
    return unsupportedState;
  }

  async getSunLiveActivityState(): Promise<SunLiveActivityState> {
    return unsupportedState;
  }
}

export default registerWebModule(SunDaylightActivityModule, 'SunDaylightActivity');
