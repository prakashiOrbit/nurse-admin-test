import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'itouch_nurse_biometric';

export type BiometricCapability = 'fingerprint' | 'face' | 'none';

export const getBiometricCapability = async (): Promise<BiometricCapability> => {
  try {
    const type = await Keychain.getSupportedBiometryType();
    if (!type) return 'none';
    if (
      type === Keychain.BIOMETRY_TYPE.FACE_ID ||
      type === Keychain.BIOMETRY_TYPE.FACE
    ) {
      return 'face';
    }
    return 'fingerprint';
  } catch {
    return 'none';
  }
};

export const enrollBiometric = async (
  username: string,
  token: string,
): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword(username, token, {
      service: KEYCHAIN_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    return false;
  }
};

export const authenticateWithBiometric = async (
  promptTitle: string,
  cancelLabel: string,
): Promise<string | null> => {
  try {
    const result = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
      authenticationPrompt: {
        title: promptTitle,
        cancel: cancelLabel,
      },
    });
    if (result && result.password) {
      return result.password;
    }
    return null;
  } catch {
    return null;
  }
};

export const isBiometricEnrolled = async (): Promise<boolean> => {
  try {
    return await Keychain.hasGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch {
    return false;
  }
};

export const revokeBiometric = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch {
    // silently ignore
  }
};
