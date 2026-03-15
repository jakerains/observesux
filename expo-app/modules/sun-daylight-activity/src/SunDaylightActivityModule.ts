import { NativeModule, requireNativeModule } from 'expo';

import type {
  StartSunLiveActivityInput,
  SunDaylightActivityModuleEvents,
  SunLiveActivityState,
} from './SunDaylightActivity.types';

declare class SunDaylightActivityModule extends NativeModule<SunDaylightActivityModuleEvents> {
  startSunLiveActivity(input: StartSunLiveActivityInput): Promise<SunLiveActivityState>;
  endSunLiveActivity(): Promise<SunLiveActivityState>;
  getSunLiveActivityState(): Promise<SunLiveActivityState>;
}

export default requireNativeModule<SunDaylightActivityModule>('SunDaylightActivity');
