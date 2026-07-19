import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5] dark:bg-gray-900 text-[#41525d] dark:text-gray-100 p-6 animate-fade-in transition-colors">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <AlertTriangle size={48} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-light mb-3 text-center">Something went wrong</h2>
          <p className="text-[#667781] dark:text-gray-400 text-[15px] mb-8 text-center max-w-md leading-relaxed">
            We encountered an unexpected error. Please refresh the page or try again later.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-[#00a884] text-white px-8 py-3 rounded-full font-medium hover:bg-[#008f6f] transition-all shadow-md hover:shadow-lg active:scale-95 mb-8"
          >
            <RefreshCcw size={18} />
            Refresh Page
          </button>

          <details className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-3xl overflow-auto custom-scrollbar">
            <summary className="cursor-pointer text-[#00a884] font-medium mb-3 select-none outline-none">View error details</summary>
            <div className="text-left font-mono text-[13px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-4 rounded mt-2">
              <strong>{this.state.error && this.state.error.toString()}</strong>
              <div className="mt-3 whitespace-pre-wrap text-[#667781] dark:text-gray-400 border-t border-red-200 dark:border-red-900/30 pt-3">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            </div>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
