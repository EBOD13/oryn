import { NativeModules, Platform } from 'react-native';

type AuthStatus = 'approved' | 'denied' | 'notDetermined' | 'unknown' | 'unsupported';

interface MonitoringConfig {
  intervalMinutes: number;
  activityName: string;
}

interface ScreenTimeNativeModule {
  requestAuthorization(): Promise<{ authorized: boolean; status: string }>;
  getAuthorizationStatus(): Promise<AuthStatus>;
  startMonitoring(configJSON: string): Promise<{ monitoring: boolean; activity: string }>;
  stopMonitoring(activityName: string): Promise<{ stopped: boolean }>;
  presentAppPicker(): Promise<{ pickerPresented: boolean }>;
  applyShield(isActive: boolean): Promise<{ applied: boolean }>;
}

const { ScreenTimeModule } = NativeModules as { ScreenTimeModule?: ScreenTimeNativeModule };

const unsupported = (name: string) => () =>
  Promise.reject(new Error(`${name}: Screen Time is iOS-only. Not available on ${Platform.OS}.`));

export const ScreenTime = {
  isSupported: Platform.OS === 'ios' && !!ScreenTimeModule,

  requestAuthorization: ScreenTimeModule?.requestAuthorization.bind(ScreenTimeModule) ??
    unsupported('requestAuthorization'),

  getAuthorizationStatus: ScreenTimeModule?.getAuthorizationStatus.bind(ScreenTimeModule) ??
    (async (): Promise<AuthStatus> => 'unsupported'),

  startMonitoring: (config: MonitoringConfig) =>
    ScreenTimeModule
      ? ScreenTimeModule.startMonitoring(JSON.stringify(config))
      : unsupported('startMonitoring')(),

  stopMonitoring: ScreenTimeModule?.stopMonitoring.bind(ScreenTimeModule) ??
    unsupported('stopMonitoring'),

  presentAppPicker: ScreenTimeModule?.presentAppPicker.bind(ScreenTimeModule) ??
    unsupported('presentAppPicker'),

  applyShield: ScreenTimeModule?.applyShield.bind(ScreenTimeModule) ??
    unsupported('applyShield'),
};
