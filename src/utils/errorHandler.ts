import Toast from 'react-native-toast-message';

/**
 * Handles API errors centrally
 * @param error - error object from Axios or other async call
 * @param fallbackMessage - message shown when error doesn't contain server message
 */
export const handleApiError = (
  error: any,
  fallbackMessage = 'Something went wrong'
) => {
  const status = error?.response?.status;
  const messageFromServer = error?.response?.data?.message;

  if (status === 401) {
    // Interceptor already handles toast + redirect
    return;
  }

  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: messageFromServer || fallbackMessage,
  });

  // console.error('API Error:', {
  //   status,
  //   message: messageFromServer,
  //   fallbackMessage,
  //   fullError: error,
  // });

  // Optional: integrate error reporting (Sentry, etc.)
};
