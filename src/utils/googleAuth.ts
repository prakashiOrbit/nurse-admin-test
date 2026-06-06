import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '420059277266-n57ermcdok8i2p2th64kbm9o3b2tndss.apps.googleusercontent.com',
  });
};