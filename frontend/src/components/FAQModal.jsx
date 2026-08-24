import React, { useState } from 'react';
import { X, Search, HelpCircle, ChevronDown, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';

const FAQ_DATA = [
  {
    category: "General & Susu Mechanics",
    items: [
      {
        q: "How does SusuRow rotational savings work?",
        a: "SusuRow digitizes the traditional West African Susu/ROSCA system. A fixed group of savers contribute an equal amount each cycle (Daily, Weekly, or Monthly). Each round, the total collected pot is disbursed to one designated member in turn until everyone receives their lump sum."
      },
      {
        q: "Are there any loan interest charges or hidden fees?",
        a: "No! SusuRow operates on a strict 0% loan interest model. Members receive exactly what the group pooled together with zero predatory interest charges."
      },
      {
        q: "What are the 3 turn rotation schemes?",
        a: "1. Sequential: Pre-assigned turn order.\n2. Ballot Draw: Cryptographic random shuffle when the group fills.\n3. Bidding Scheme: Members bid discounts to claim early payout pots."
      }
    ]
  },
  {
    category: "Mobile Money & Payments",
    items: [
      {
        q: "Which Mobile Money networks are supported in Ghana?",
        a: "SusuRow connects directly to MTN Mobile Money (*170#), Telecel Cash (*110#), and AT Money (*110#) via our live Paystack payment gateway."
      },
      {
        q: "How does the lump-sum pot payout reach my phone?",
        a: "When a round completes, our automated rotation engine sends the entire pot directly into your selected Mobile Money wallet or linked Bank Account without manual queues."
      },
      {
        q: "What happens if a member delays their contribution?",
        a: "Automated SMS reminders are sent. Savers who fail to contribute lose Saver Trust points. Upfront commitment escrow deposits and Next of Kin recovery details protect the circle."
      }
    ]
  },
  {
    category: "KYC & Verification",
    items: [
      {
        q: "Why do I need to provide my Ghana Card number?",
        a: "Ghana Card verification satisfies Bank of Ghana Tier 1 FinTech standards, prevents duplicate accounts, and builds saver trust scores across the platform."
      },
      {
        q: "Why is a digital signature and Next of Kin required?",
        a: "A signature legally binds high-value lump-sum receipts. Next of Kin details serve as emergency contact to prevent defaults and protect group members."
      }
    ]
  }
];

export const FAQModal = ({ isOpen, onClose, onOpenLiveChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  if (!isOpen) return null;

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredCategories = FAQ_DATA.map(category => ({
    ...category,
    items: category.items.filter(
      item => item.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
              item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Frequently Asked Questions</h3>
              <p className="text-[11px] text-blue-200">SusuRow & Coratech Global Support</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5 bg-[#0E1322] shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search deposits, payouts, ballot draw, KYC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#141A2D] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5 bg-[#080B11]">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching questions found for "{searchTerm}".
            </div>
          ) : (
            filteredCategories.map((cat, catIdx) => (
              <div key={cat.category} className="space-y-2">
                <h4 className="text-[10px] uppercase font-black tracking-wider text-blue-400 px-1">
                  {cat.category}
                </h4>
                <div className="space-y-2">
                  {cat.items.map((item, itemIdx) => {
                    const globalIdx = `${catIdx}-${itemIdx}`;
                    const isOpen = openIndex === globalIdx;
                    return (
                      <div
                        key={item.q}
                        className="rounded-2xl bg-[#141A2D] border border-white/5 overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => toggleAccordion(globalIdx)}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-400' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5 whitespace-pre-line bg-[#0E1322]/50">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Support Escalation */}
        <div className="p-4 border-t border-white/5 bg-[#0E1322] flex items-center justify-between gap-3 shrink-0 text-xs">
          <span className="text-slate-400 text-[11px]">Still need help?</span>
          <a
            href="https://wa.me/233244000000?text=Hello%20Coratech%20Global%2C%20I%20have%20a%20question%20about%20SusuRow"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
          >
            <MessageSquare size={13} />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};
