'use client';
import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-400 mb-4 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button onClick={this.reset} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Inline error card — use for section-level failures
 */
export const ErrorCard = ({
  message = 'Failed to load',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="card p-5 border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20 flex items-center gap-3">
    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
    <p className="text-sm text-red-700 dark:text-red-400 flex-1">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    )}
  </div>
);
