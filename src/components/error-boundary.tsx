/**
 * Error Boundary Component
 * 
 * Catches React errors and displays user-friendly error messages
 * Also logs errors for debugging
 */

import React, { ReactNode } from 'react';
import { createErrorLog, sanitizeErrorMessage } from '@/lib/error-handling';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error
    const errorLog = createErrorLog(error, {
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    console.error('Error Boundary caught:', errorLog);

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error tracking service (Sentry, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Terjadi Kesalahan
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {sanitizeErrorMessage(this.state.error.message)}
            </p>

            {/* Show component stack in development */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mb-4 text-left text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded border border-red-200 dark:border-red-800">
                <summary className="font-semibold cursor-pointer text-red-900 dark:text-red-100">
                  Debug Info
                </summary>
                <pre className="mt-2 overflow-auto max-h-32 text-red-800 dark:text-red-200">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={this.handleReset}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="w-full"
              >
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of Error Boundary for function components
 * Usage: useErrorHandler(error) inside try-catch
 */
export function useErrorHandler(error: Error | null) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      const errorLog = createErrorLog(error);
      console.error('useErrorHandler caught:', errorLog);
      setHasError(true);
    }
  }, [error]);

  const resetError = () => setHasError(false);

  return { hasError, resetError, error };
}
