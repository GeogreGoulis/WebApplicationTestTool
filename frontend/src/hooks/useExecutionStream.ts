import { useEffect, useState, useCallback } from 'react';

export interface ExecutionUpdate {
  type: string;
  status?: string;
  suiteId?: string;
  browsers?: string[];
  [key: string]: any;
}

export interface UseExecutionStreamOptions {
  onUpdate?: (update: ExecutionUpdate) => void;
  onError?: (error: Event) => void;
}

export const useExecutionStream = (
  executionId: string | null,
  options: UseExecutionStreamOptions = {}
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ExecutionUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { onUpdate, onError } = options;

  const connect = useCallback(() => {
    if (!executionId) return null;

    const apiUrl = process.env.REACT_APP_CORE_API_URL || 'http://localhost:3100';
    const eventSource = new EventSource(`${apiUrl}/api/executions/${executionId}/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        setLastUpdate(update);
        onUpdate?.(update);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      setIsConnected(false);
      setError('Connection error');
      onError?.(err);
      eventSource.close();
    };

    return eventSource;
  }, [executionId, onUpdate, onError]);

  useEffect(() => {
    const eventSource = connect();

    return () => {
      if (eventSource) {
        eventSource.close();
        setIsConnected(false);
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastUpdate,
    error,
  };
};
