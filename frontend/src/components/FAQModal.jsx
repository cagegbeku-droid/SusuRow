import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  ChevronDown, 
  Search, 
  MessageSquare, 
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Phone
} from 'lucide-react';

const FAQ_DATA = [
  {
    category: "Rotational Susu Basics",
    items: [
      {
        q: "What is SusuRow and how does it work?",
        a: "SusuRow is a modern digital ROSCA (Rotating Savings and Credit Association) platform. Groups of savers pool equal contributions on a schedule (daily, weekly, or monthly). In every round, one member takes home the entire lump-sum pot until everyone in the group has had their turn with 0% loan interest."
      },
      {
        q: "What is the difference between Sequential, Ballot, and Bidding?",
        a: "• Sequential: Payout positions are fixed in order (1st, 2nd, 3rd...).\n• Ballot: Positions are randomly shuffled using a fair verifiable random draw.\n• Bidding: In each round, members bid discounts if they need the pot urgently."
      },
      {
        q: "How does the lump-sum pot payout reach my phone?",
        a: "When a round completes, our automated rotation engine sends the entire pot directly into your registered Mobile Money wallet or linked Bank Account."
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
        q: "Why is Next of Kin required?",
        a: "Next of Kin details serve as emergency contact to prevent defaults and protect group members."
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Frequently Asked Questions</h3>
              <p className="text-[11px] text-sky-100">SusuRow & Coratech Global Support</p>
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
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search deposits, payouts, ballot draw, KYC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5 bg-white">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-600 text-xs font-bold">
              No matching questions found for "{searchTerm}".
            </div>
          ) : (
            filteredCategories.map((cat, catIdx) => (
              <div key={cat.category} className="space-y-2">
                <h4 className="text-xs uppercase font-black tracking-wider text-sky-700 px-1">
                  {cat.category}
                </h4>
                <div className="space-y-2">
                  {cat.items.map((item, itemIdx) => {
                    const globalIdx = `${catIdx}-${itemIdx}`;
                    const isOpen = openIndex === globalIdx;
                    return (
                      <div
                        key={item.q}
                        className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => toggleAccordion(globalIdx)}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900 hover:text-sky-700 cursor-pointer"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-sky-600' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-700 leading-relaxed border-t border-slate-200 whitespace-pre-line bg-white font-medium">
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
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0 text-xs">
          <span className="text-slate-700 font-bold text-xs">Still need help?</span>
          <div className="flex items-center gap-2">
            <a
              href="tel:0599360626"
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Phone size={13} className="text-sky-600" />
              <span>0599360626</span>
            </a>
            <a
              href="https://wa.me/233599360626?text=Hello%20Coratech%20Global%2C%20I%20have%20a%20question%20about%20SusuRow"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <MessageSquare size={13} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
