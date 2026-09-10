import React from 'react';
import { ShieldCheck, RefreshCw, MessageSquare, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SusuRow Crash Guard] Error intercepted:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.href = '/';
  };

  handleWhatsAppSupport = () => {
    const errorSnippet = this.state.error ? encodeURIComponent(this.state.error.message || 'Unknown error') : 'Client state crash';
    window.open(`https://wa.me/233599360626?text=Hello%20SusuRow%20Support,%20I%20encountered%20an%20issue%20in%20the%20app:%20${errorSnippet}`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <ShieldCheck className="w-8 h-8 text-[#005B52]" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 mb-3">
              Funds & Records 100% Secure
            </span>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              We encountered an unexpected display issue. Don't worry — your contributions, savings circle rotations, and payout schedules are completely safe on the ledger.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#005B52] hover:bg-[#004840] text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload SusuRow
              </button>

              <button
                onClick={this.handleWhatsAppSupport}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Helpline (0599360626)
              </button>

              <a
                href="/"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Home
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Coratech Global Enterprise Financial Guard • 24/7 Monitored
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
