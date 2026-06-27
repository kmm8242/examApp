import {NativeModules, Platform} from 'react-native';

export interface InstalledApp {
  packageName: string;
  appName: string;
}

const native = NativeModules.AppLockModule;

// No-op stub used on iOS (feature is Android-only for now)
const stub = {
  getInstalledApps: async (): Promise<InstalledApp[]> => [],
  getLockedApps: async (): Promise<string[]> => [],
  setLockedApps: async (_packages: string[]): Promise<void> => {},
  getSelectedSubjects: async (): Promise<string[]> => [],
  setSelectedSubjects: async (_subjects: string[]): Promise<void> => {},
  isAccessibilityServiceEnabled: async (): Promise<boolean> => false,
  openAccessibilitySettings: async (): Promise<void> => {},
};

const AppLockModule =
  Platform.OS === 'android' && native
    ? {
        getInstalledApps: (): Promise<InstalledApp[]> =>
          native.getInstalledApps(),
        getLockedApps: (): Promise<string[]> => native.getLockedApps(),
        setLockedApps: (packages: string[]): Promise<void> =>
          native.setLockedApps(packages),
        getSelectedSubjects: (): Promise<string[]> =>
          native.getSelectedSubjects(),
        setSelectedSubjects: (subjects: string[]): Promise<void> =>
          native.setSelectedSubjects(subjects),
        isAccessibilityServiceEnabled: (): Promise<boolean> =>
          native.isAccessibilityServiceEnabled(),
        openAccessibilitySettings: (): Promise<void> =>
          native.openAccessibilitySettings(),
      }
    : stub;

export default AppLockModule;
