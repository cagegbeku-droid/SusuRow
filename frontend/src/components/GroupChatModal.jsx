import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Loader2, 
  Sparkles, 
  User, 
  Megaphone, 
  Clock 
} from 'lucide-react';
import { getGroupMessages, sendGroupMessage } from '../api/client';
import { useUser } from '../context/UserContext';

export const GroupChatModal = ({ isOpen, onClose, group }) => {
  const { user, isAuthenticated, openAuthModal } = useUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const cleanUserPhone = user?.phone_number?.replace('+233', '0').replace(/\s+/g, '');
  const cleanCreatorPhone = group?.creator_id?.replace('+233', '0').replace(/\s+/g, '');

  const fetchMessages = async () => {
    if (!group?.id) return;
    try {
      const data = await getGroupMessages(group.id);
      setMessages(data);
    } catch (e) {
      console.error('Failed to load chat', e);
    }
  };

  useEffect(() => {
    if (isOpen && group?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, group?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !group) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setSending(true);
    try {
      await sendGroupMessage({
        group_id: group.id,
        sender_phone: user.phone_number,
        sender_name: user.full_name || 'Group Member',
        message_text: text.trim(),
        is_announcement: false
      });
      setText('');
      await fetchMessages();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send message. Must be enrolled in this group.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{group.name} Chat</h3>
              <p className="text-[11px] text-sky-100">Activity Wall & Turn Coordination</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-700">No messages in this group yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Say hello, cheer group members on, or coordinate your payout turn!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_phone === cleanUserPhone;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 px-1 text-[10px] text-slate-600 font-bold">
                    <span>{msg.sender_name}</span>
                    {msg.sender_phone === cleanCreatorPhone && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-black text-[9px]">
                        LEADER
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      isMe
                        ? 'bg-sky-600 text-white shadow-xs rounded-tr-xs'
                        : 'bg-white text-slate-900 border border-slate-200 shadow-xs rounded-tl-xs font-medium'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                    <div className={`text-[9px] text-right mt-1 font-mono font-bold ${isMe ? 'text-sky-100' : 'text-slate-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder={isAuthenticated ? "Type a message..." : "Sign in to post..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!isAuthenticated || sending}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            {sending ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
          </button>
        </form>

      </div>
    </div>
  );
};
