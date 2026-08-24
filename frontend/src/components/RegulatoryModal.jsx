import React from 'react';
import { X, ShieldCheck, Award, FileText, CheckCircle2, Building, ExternalLink } from 'lucide-react';

export const RegulatoryModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Regulatory & Compliance</h3>
              <p className="text-[11px] text-emerald-100">Bank of Ghana & Coratech Global Governance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#080B11] text-xs text-slate-300">
          
          {/* Engineering Entity Card */}
          <div className="p-4 rounded-2xl bg-[#141A2D] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Building className="w-4 h-4 text-blue-400" />
              <span>Technology Engineering Entity</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              SusuRow is architected and maintained by <strong>Coratech Global</strong> (Registered Software & Managed IT Engineering Enterprise, Ghana).
            </p>
            <a
              href="https://coratechglobal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-bold"
            >
              <span>Visit coratechglobal.com</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Bank of Ghana FinTech Framework */}
          <div className="p-4 rounded-2xl bg-[#141A2D] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Bank of Ghana (BoG) ROSCA Framework</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              SusuRow complies with non-lending Rotating Savings and Credit Association guidelines. The platform does not issue loans, charge credit interest, or hold custodial balances. All transactions settle peer-to-peer via licensed Payment Service Providers (Paystack Ghana, GhIPSS rails).
            </p>
          </div>

          {/* Compliance Checklist */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-1">
              Statutory Safeguards
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0E1322] border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">Data Protection Act, 2012 (Act 843)</div>
                  <div className="text-[10px] text-slate-400">All member records and Ghana Card data are encrypted using 256-bit AES standards.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0E1322] border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">Anti-Money Laundering (Act 1044)</div>
                  <div className="text-[10px] text-slate-400">Tier 1 KYC verification and Paystack automated fraud velocity screening.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0E1322] border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-[11px]">0% Loan Interest & Transparent Peer Rotation</div>
                  <div className="text-[10px] text-slate-400">100% of collected group contributions are disbursed to the round's designated saver.</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0E1322] flex items-center justify-between text-xs text-slate-500">
          <span>SusuRow v1.5.0 (Build 2026)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
