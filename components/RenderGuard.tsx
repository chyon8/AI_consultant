import React, { useEffect, useState } from 'react';
import { validateBeforeRender, sessionManager, RenderValidation } from '../services/sessionInstance';

interface RenderGuardProps {
  targetSessionId: string | null;
  dataSessionId: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onValidationFail?: (validation: RenderValidation) => void;
}

export const RenderGuard: React.FC<RenderGuardProps> = ({
  targetSessionId,
  dataSessionId,
  children,
  fallback = null,
  onValidationFail
}) => {
  const [isValid, setIsValid] = useState(true);
  const [validation, setValidation] = useState<RenderValidation | null>(null);

  useEffect(() => {
    if (!targetSessionId) {
      setIsValid(true);
      return;
    }

    const result = validateBeforeRender(targetSessionId, dataSessionId);
    setValidation(result);
    setIsValid(result.isValid);

    if (!result.isValid && onValidationFail) {
      onValidationFail(result);
    }

    if (!result.isValid) {
      console.warn(
        `[RenderGuard] Blocked render: target=${targetSessionId}, data=${dataSessionId}, reason=${result.reason}`
      );
    }
  }, [targetSessionId, dataSessionId, onValidationFail]);

  if (!isValid) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface SessionBoundaryProps {
  sessionId: string | null;
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export const SessionBoundary: React.FC<SessionBoundaryProps> = ({
  sessionId,
  children,
  loadingFallback = <div className="flex items-center justify-center h-full">Loading...</div>
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setIsReady(true);
      return;
    }

    const instance = sessionManager.getInstance(sessionId);
    if (!instance) {
      setError(`Session ${sessionId} not found`);
      setIsReady(false);
      return;
    }

    const namespace = sessionManager.getNamespace(sessionId);
    if (!namespace) {
      setError(`Namespace for session ${sessionId} not found`);
      setIsReady(false);
      return;
    }

    sessionManager.setCurrentSession(sessionId);
    setIsReady(true);
    setError(null);
  }, [sessionId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Session Error: {error}
      </div>
    );
  }

  if (!isReady) {
    return <>{loadingFallback}</>;
  }

  return <>{children}</>;
};

export function useSessionValidation(
  targetSessionId: string | null,
  dataSessionId: string | null
): { isValid: boolean; validation: RenderValidation | null } {
  const [result, setResult] = useState<{ isValid: boolean; validation: RenderValidation | null }>({
    isValid: true,
    validation: null
  });

  useEffect(() => {
    if (!targetSessionId) {
      setResult({ isValid: true, validation: null });
      return;
    }

    const validation = validateBeforeRender(targetSessionId, dataSessionId);
    setResult({ isValid: validation.isValid, validation });
  }, [targetSessionId, dataSessionId]);

  return result;
}

export function useIsolatedState<T>(
  sessionId: string | null,
  initialValue: T,
  stateKey: string
): [T, (value: T | ((prev: T) => T)) => void] {
  const [internalState, setInternalState] = useState<Map<string, T>>(new Map());
  
  const getCurrentValue = (): T => {
    if (!sessionId) return initialValue;
    return internalState.get(sessionId) ?? initialValue;
  };

  const setIsolatedValue = (value: T | ((prev: T) => T)) => {
    if (!sessionId) return;
    
    setInternalState(prev => {
      const newMap = new Map(prev);
      const currentValue = prev.get(sessionId) ?? initialValue;
      const newValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(currentValue)
        : value;
      newMap.set(sessionId, newValue);
      
      console.log(`[useIsolatedState] ${stateKey} updated for session ${sessionId}`);
      return newMap;
    });
  };

  return [getCurrentValue(), setIsolatedValue];
}
