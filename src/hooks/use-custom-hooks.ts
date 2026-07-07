/**
 * Custom React hooks for common functionality
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Debounced value hook - delays updates to a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook - limits function call frequency
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Previous value hook - get previous value of a prop/state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Local storage hook with type safety
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage?.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Session storage hook with type safety
 */
export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.sessionStorage?.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Async state hook - handle loading, data, error states
 */
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}

/**
 * Intersection observer hook - detect when element enters viewport
 */
export function useIntersectionObserver(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}

/**
 * Fetch with cache hook
 */
export function useCachedFetch<T>(
  url: string,
  cacheTime: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<{ data: T; time: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Check cache
      if (cacheRef.current && Date.now() - cacheRef.current.time < cacheTime) {
        setData(cacheRef.current.data);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        cacheRef.current = { data: json, time: Date.now() };
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Fetch failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, cacheTime]);

  return { data, loading, error };
}

/**
 * Uncontrolled component with state tracking
 */
export function useUncontrolledInput(defaultValue: string = '') {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  return {
    value,
    setValue,
    inputRef,
    reset: () => setValue(defaultValue),
    bind: {
      ref: inputRef,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    },
  };
}

/**
 * Counter hook with increment/decrement
 */
export function useCounter(initialValue = 0, { min, max }: { min?: number; max?: number } = {}) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => (max !== undefined ? Math.min(prev + 1, max) : prev + 1));
  }, [max]);

  const decrement = useCallback(() => {
    setCount((prev) => (min !== undefined ? Math.max(prev - 1, min) : prev - 1));
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

/**
 * Toggle hook for boolean state
 */
export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}
