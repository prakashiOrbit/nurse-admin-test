// hooks/useWardDashboard.ts — Phase 2: SSE
// Replaces 5-second polling of POST /ward/dashboard
// with a persistent GET /dashboard/stream connection.
import { useEffect, useRef, useState, useCallback } from 'react';
import EventSource, { EventSourceListener } from 'react-native-sse';
import { createDashboardStream } from '../services/streamService/streamService';
import { setDashboardStream } from '../services/streamService/dashboardStreamManager';

export interface BedStatus {
  bedCode: string;
  bedStatus?: string;
}

export interface WardDashboardData {
  monitoringBeds: BedStatus[];
  inpatientBeds:  BedStatus[];
  transferBeds:   BedStatus[];
  dischargeBeds:  BedStatus[];
  emptyBeds:      BedStatus[];
}

interface UseWardDashboardOptions {
  enabled: boolean;
}

interface UseWardDashboardResult {
  data:      WardDashboardData | null;
  connected: boolean;
  error:     string | null;
  reconnect: () => void;
}

export const useWardDashboard = (
  { enabled }: UseWardDashboardOptions,
): UseWardDashboardResult => {

  const [data,      setData]      = useState<WardDashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const esRef     = useRef<InstanceType<typeof EventSource> | null>(null);
  const isMounted = useRef(true);

const closeStream = useCallback(() => {
  if (esRef.current) {
    esRef.current.removeAllEventListeners();
    esRef.current.close();
    esRef.current = null;
  }

  setConnected(false);
}, []);

const connect = useCallback(async () => {
  if (!isMounted.current || !enabled) return;

  closeStream();

  try {
    const es = await createDashboardStream();

    esRef.current = es;
    setDashboardStream(es);
    const onOpen: EventSourceListener<'open'> = () => {
      if (!isMounted.current) return;

      console.log('[useWardDashboard] SSE connected');

      setConnected(true);
      setError(null);
    };

    const onMessage: EventSourceListener<'message'> = (event: any) => {
      if (!isMounted.current || !event.data) return;

      try {
        const parsed: WardDashboardData = JSON.parse(event.data);

        console.log('[useWardDashboard] SSE push received');

        setData(parsed);
      } catch (e) {
        console.warn(
          '[useWardDashboard] Failed to parse SSE message:',
          event.data,
        );
      }
    };

    const onError: EventSourceListener<'error'> = (event: any) => {
      if (!isMounted.current) return;

      const status = event?.status;

      console.warn('[useWardDashboard] SSE error:', status);

      if (status === 401 || status === 403) {
        setError('Session expired');

        closeStream();

        return;
      }

      setConnected(false);
      setError('Connection interrupted — reconnecting…');
    };

    es.addEventListener('open', onOpen);
    es.addEventListener('message', onMessage);
    es.addEventListener('error', onError);

  } catch (e: any) {
    console.log('[useWardDashboard] connect error:', e);

    setError(e?.message || 'Failed to connect');
  }

}, [enabled, closeStream]);

  useEffect(() => {
    isMounted.current = true;

    if (enabled) {
      connect();
    } else {
      closeStream();
    }

    return () => {
      isMounted.current = false;
      closeStream();
    };
  }, [enabled, connect, closeStream]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  return { data, connected, error, reconnect };
};