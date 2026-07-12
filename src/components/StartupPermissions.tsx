import React, {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import AppLockModule from '../native/AppLockModule';
import AccessibilityDisclosureModal from './AccessibilityDisclosureModal';

// Asks for everything the app needs right at launch. The only requirement is
// the Accessibility Service (a special access with no runtime dialog), so we
// show the disclosure once per cold start while it is still disabled.
export default function StartupPermissions() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    let cancelled = false;
    AppLockModule.isAccessibilityServiceEnabled()
      .then(enabled => {
        if (!cancelled && !enabled) {
          setVisible(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AccessibilityDisclosureModal
      visible={visible}
      onCancel={() => setVisible(false)}
      onConfirm={() => {
        setVisible(false);
        AppLockModule.openAccessibilitySettings();
      }}
    />
  );
}
