import React from 'react';
import { X, ShieldCheck, Award, FileText, CheckCircle2, Building, ExternalLink } from 'lucide-react';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

export const RegulatoryModal = ({ isOpen, onClose }) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Regulatory & Compliance</h3>
              <p className="text-[11px] text-slate-500">Bank of Ghana & Coratech Global Governance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white text-xs text-slate-700">
          
          {/* Engineering Entity Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Technology Engineering Entity</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              SusuRow is architected and maintained by <strong>Coratech Global</strong> (Registered Software & Managed IT Engineering Enterprise, Ghana).
            </p>
          </div>

          {/* Bank of Ghana FinTech Framework */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Bank of Ghana (BoG) ROSCA Framework</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              SusuRow complies with non-lending Rotating Savings and Credit Association guidelines. The platform does not issue loans, charge credit interest, or hold custodial balances. All transactions settle peer-to-peer via licensed Payment Service Providers (Paystack Ghana, GhIPSS rails).
            </p>
          </div>

          {/* Compliance Checklist */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-500 px-1">
              Statutory Safeguards
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">Data Protection Act, 2012 (Act 843)</div>
                  <div className="text-[10px] text-slate-600">All member records and Ghana Card data are encrypted using 256-bit AES standards.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">Anti-Money Laundering (Act 1044)</div>
                  <div className="text-[10px] text-slate-600">Tier 1 KYC verification and Paystack automated fraud velocity screening.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">Transparent Peer Rotation & Direct Payouts</div>
                  <div className="text-[10px] text-slate-600">100% of collected group contributions are disbursed to the round's designated saver.</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>SusuRow v1.5.0 (Build 2026)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
