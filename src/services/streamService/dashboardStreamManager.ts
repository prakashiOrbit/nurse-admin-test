import EventSource from 'react-native-sse';

let dashboardStream: EventSource | null = null;

export const setDashboardStream = (stream: EventSource) => {
  dashboardStream = stream;
};

export const closeDashboardStream = () => {
  if (dashboardStream) {
    console.log('[SSE] Closing dashboard stream');

    dashboardStream.removeAllEventListeners();
    dashboardStream.close();

    dashboardStream = null;
  }
};