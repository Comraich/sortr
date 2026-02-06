import React from 'react';

/**
 * Error Boundary component to catch React errors and prevent app crashes
 * Wraps components to provide graceful error handling
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="card" style={{
          maxWidth: '600px',
          margin: '40px auto',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc2626' }}>⚠️ Something went wrong</h2>
          <p style={{ marginBottom: '20px', color: '#6b7280' }}>
            We're sorry for the inconvenience. An unexpected error occurred.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                Error Details (Development Mode)
              </summary>
              <pre style={{
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              className="btn-primary"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
