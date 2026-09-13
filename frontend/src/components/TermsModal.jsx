import React, { useState } from 'react';
import { X, ShieldCheck, Building2, ExternalLink, Lock, CheckCircle2, FileText, Handshake, ShieldAlert } from 'lucide-react';

export const TermsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' | 'privacy' | 'partnerships'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="bg-[#0B0F19] text-white w-full max-w-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1">
            <ShieldCheck size={13} />
            <span>Compliance & Legal Standards</span>
          </div>

          <h2 className="text-xl font-black text-white">
            Terms, Privacy & Trust
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            SusuRow Digital ROSCA • Engineered by Coratech Global
          </p>

          {/* Navigation Tabs */}
          <div className="flex gap-1 bg-black/25 p-1 rounded-xl mt-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'terms' ? 'bg-white text-slate-900 shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <FileText size={13} />
              <span>Terms of Service</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'privacy' ? 'bg-white text-slate-900 shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Lock size={13} />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => setActiveTab('partnerships')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'partnerships' ? 'bg-white text-slate-900 shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Handshake size={13} />
              <span>Trust & Partners</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed flex-1">
          
          {/* TAB 1: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-sky-400" />
                  <span>1. Peer-to-Peer Rotational Savings (ROSCA)</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  SusuRow operates strictly as a digitized Rotating Savings and Credit Association (ROSCA). All member contributions are pooled collectively and disbursed to the scheduled turn recipient directly.
                </p>
              </div>

              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-sky-400" />
                  <span>2. Payment Obligations & Automated Due Processing</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enrolled circle participants must submit their scheduled contribution on or before the due timestamp. Members may choose automated payment or manual payment via Mobile Money. Once a round payment is completed, reminders and prompts automatically pause for that member until the subsequent round begins.
                </p>
              </div>

              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-amber-400" />
                  <span>3. Escrow Security Deposits & Default Deterrence</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  For circles requiring an upfront commitment deposit, funds are locked in escrow for the full cycle. If a member defaults beyond the 24-hour grace window, escrow funds are deployed to safeguard the round recipient's payout, and emergency contacts are notified.
                </p>
              </div>

              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>4. Bank of Ghana Regulatory Compliance</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Platform operations adhere to the <strong>Payment Systems and Services Act, 2019 (Act 987)</strong> and the <strong>Electronic Transactions Act, 2008 (Act 772)</strong> of the Republic of Ghana.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Lock size={15} className="text-sky-400" />
                  <span>1. Ghana Data Protection Act, 2012 (Act 843)</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  SusuRow processes user data in strict adherence to Act 843 standards. We collect only required information: full legal name, phone number, Ghana Card number, next of kin contact, and mobile wallet details for transaction execution.
                </p>
              </div>

              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Lock size={15} className="text-emerald-400" />
                  <span>2. Cryptographic Security & Vaulting</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  User authentication credentials are salted and encrypted using PBKDF2-HMAC-SHA256. All communications are protected with TLS 1.3 encryption. We never store personal telecom mobile banking PINs.
                </p>
              </div>

              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-sky-400" />
                  <span>3. No Data Selling / Controlled Purpose</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your identity and financial information are utilized exclusively for payout disbursements, circle tracking, and regulatory KYC. We never sell, lease, or monetize user data.
                </p>
              </div>

              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-amber-400" />
                  <span>4. Your Rights Under Act 843</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  You possess the legal right to request access, correction, or deletion of your registered data by contacting our compliance desk at <strong>support@coratechglobal.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TRUST & PARTNERSHIPS */}
          {activeTab === 'partnerships' && (
            <div className="space-y-4">
              {/* Engineering Entity */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-sky-500/20 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Building2 size={16} className="text-sky-400" />
                  <span>Platform Engineered by Coratech Global</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  SusuRow is developed, maintained, and operated by <strong>Coratech Global</strong>. Coratech Global delivers enterprise software engineering, FinTech infrastructure, and cloud security architecture.
                </p>
              </div>

              {/* Payment Processing Partner */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Payment Infrastructure Partners</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Payments and payout settlements are processed in partnership with Bank of Ghana licensed payment gateways (Paystack Ghana) and registered Mobile Money operators (MTN Mobile Money, Telecel Cash, and AT Money).
                </p>
              </div>

              {/* Escrow Custody Trust */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <CheckCircle2 size={16} className="text-amber-400" />
                  <span>Segregated Client Escrow</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Savings pool deposits are held in segregated, audited escrow accounts until scheduled round disbursements, ensuring full solvency and protection against operational commingling.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#080C14] flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-500 font-semibold">
            Coratech Global • Ghana Tech Solutions
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
export default TermsModal;
