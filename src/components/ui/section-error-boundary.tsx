import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A section-level error boundary for catching errors in specific parts of the UI
 * without crashing the entire application.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('SectionErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallbackTitle = 'Something went wrong', 
        fallbackMessage = 'This section encountered an error.',
        showRetry = true,
        compact = false
      } = this.props;

      if (compact) {
        return (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-muted-foreground flex-1">{fallbackMessage}</span>
            {showRetry && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={this.handleRetry}
                className="shrink-0"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        );
      }

      return (
        <Card className="p-6 text-center border-destructive/20 bg-destructive/5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{fallbackTitle}</h3>
              <p className="text-sm text-muted-foreground">{fallbackMessage}</p>
            </div>
            {showRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            {import.meta.env.DEV && this.state.error && (
              <details className="w-full text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-2 text-xs bg-muted rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <SectionErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </SectionErrorBoundary>
    );
  };
}
