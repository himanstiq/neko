import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error boundary caught error:", error, errorInfo);

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to an error reporting service in production
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service (e.g., Sentry)
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService(error, errorInfo) {
    // Placeholder for error logging service
    console.log("Logging error to service:", {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Optional: reload the page if too many errors
    if (this.state.errorCount > 3) {
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">⚠️</div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Something went wrong
                </h1>
                <p className="text-gray-400">
                  We're sorry for the inconvenience. The application encountered
                  an error.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4 mb-6">
                <p className="text-red-300 font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-400 text-xs cursor-pointer hover:text-red-300">
                      View stack trace
                    </summary>
                    <pre className="text-xs text-red-200 mt-2 overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
              <a
                href="/dashboard"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors inline-flex items-center"
              >
                Go to Dashboard
              </a>
            </div>

            {this.state.errorCount > 1 && (
              <div className="mt-6 p-4 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ This error has occurred {this.state.errorCount} times. If
                  the problem persists, please try reloading the page or contact
                  support.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
