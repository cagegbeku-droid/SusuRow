import React from 'react';
import { X, ShieldCheck, Building2, ExternalLink, Lock, CheckCircle2 } from 'lucide-react';

export const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1">
            <ShieldCheck size={13} />
            <span>Compliance & Legal Standards</span>
          </div>

          <h2 className="text-xl font-black text-white">
            Terms of Service & Privacy
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            SusuRow Digital ROSCA Platform • Powered by Coratech Global
          </p>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed flex-1">
          
          {/* Engineering Entity Note */}
          <div className="bg-[#0E1322] rounded-2xl p-4 border border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Building2 size={16} className="text-blue-400" />
              <span>Engineered by Coratech Global</span>
            </div>
            <p className="text-[11px] text-slate-400">
              SusuRow is developed and managed by <strong>Coratech Global</strong>, providing enterprise IT support, custom software development, and FinTech infrastructure.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400">Website: coratechglobal.com</span>
              <a 
                href="https://coratechglobal.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1 font-bold"
              >
                <span>Visit Site</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* 1. ROSCA Mechanics & 0% Interest */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>1. Peer-to-Peer Rotational Savings</span>
            </h4>
            <p>
              SusuRow operates strictly as a Rotating Savings and Credit Association (ROSCA) system. Contributions are pooled from enrolled group members and disbursed on a rotational schedule with <strong>zero (0%) loan interest</strong>.
            </p>
          </div>

          {/* 2. Ghana Mobile Money & Payment Processing */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>2. Ghana Mobile Money Integration</span>
            </h4>
            <p>
              Payments and pot disbursements are facilitated via registered telecom operators (MTN Mobile Money, Telecel Cash, and AT Money) utilizing Bank of Ghana-licensed payment gateways (Paystack Ghana).
            </p>
          </div>

          {/* 3. Escrow Security Deposits */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>3. Escrow Security & Default Deterrence</span>
            </h4>
            <p>
              Groups may enforce an optional upfront commitment deposit held in escrow. This deposit is locked for the entire cycle duration and is returned or applied upon completion of all rotational rounds.
            </p>
          </div>

          {/* 4. Privacy & Data Security */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Lock size={14} className="text-blue-400" />
              <span>4. Data Privacy & Cryptography</span>
            </h4>
            <p>
              User authentication passwords are encrypted using PBKDF2-HMAC-SHA256 with unique per-user salts. We do not store credit card numbers or Mobile Money PINs on our servers.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#0E1322] flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-500 font-semibold">
            Coratech Global • Ghana Tech Solutions
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow transition-all"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
