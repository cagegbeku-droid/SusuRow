import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { UserCheck, Phone, ShieldCheck, X, Sparkles, PlusCircle } from 'lucide-react';

export const UserSessionModal = () => {
  const { currentUser, switchUser, setCustomUser, isSessionModalOpen, setIsSessionModalOpen, PRESET_SAVERS } = useUser();
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customProvider, setCustomProvider] = useState('MTN');
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'

  if (!isSessionModalOpen) return null;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName.trim() || !customPhone.trim()) return;
    setCustomUser(customName.trim(), customPhone.trim(), customProvider);
    setCustomName('');
    setCustomPhone('');
  };

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'MTN':
        return <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">MTN MoMo</span>;
      case 'TELECEL':
        return <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">Telecel Cash</span>;
      case 'AT':
        return <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">AT Money</span>;
      default:
        return <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">{provider}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={() => setIsSessionModalOpen(false)}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Multi-Saver Testing Mode</span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-white">Switch Active Saver Session</h2>
          <p className="text-emerald-100/90 text-sm mt-1">
            Simulate realistic multi-party Ghanaian Susu contributions and instant hand payouts seamlessly.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Preset Ghanaian Savers</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Custom Mobile Wallet</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'presets' ? (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 font-medium mb-3">
                Select a saver profile to act as their handset:
              </p>
              {PRESET_SAVERS.map((saver) => {
                const isActive = currentUser?.phone_number === saver.phone_number;
                return (
                  <button
                    key={saver.id}
                    onClick={() => switchUser(saver)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                      isActive
                        ? 'border-emerald-700 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-600/30'
                        : 'border-slate-200 hover:border-emerald-500 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-xl shadow-inner">
                        {saver.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-base">{saver.full_name}</span>
                          {getProviderBadge(saver.momo_provider)}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{saver.phone_number}</span>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium mt-1">
                          {saver.role_hint}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center space-x-1 text-emerald-800 font-bold text-xs bg-emerald-200/60 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nana Yaw Bediako"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ghana Mobile Number (10 digits)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0244123456"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mobile Money Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['MTN', 'TELECEL', 'AT'].map((prov) => (
                    <button
                      type="button"
                      key={prov}
                      onClick={() => setCustomProvider(prov)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        customProvider === prov
                          ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {prov === 'MTN' ? 'MTN MoMo' : prov === 'TELECEL' ? 'Telecel Cash' : 'AT Money'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-md transition-all text-sm mt-2"
              >
                Set as Active Saver Session
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Session data is saved locally on your device for fast end-to-end testing.
          </p>
        </div>
      </div>
    </div>
  );
};
