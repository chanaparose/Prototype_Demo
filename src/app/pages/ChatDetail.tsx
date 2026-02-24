import { useState } from "react";
import { ArrowLeft, MoreVertical, FileText, Download, Send, CreditCard, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

export function ChatDetail() {
  const navigate = useNavigate();
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Header with Mini-Dashboard Toggle */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 z-30 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-700">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 flex-1" onClick={() => setDashboardOpen(!dashboardOpen)}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-100">
              <img src="https://images.unsplash.com/photo-1769778674824-e69f58d7c55d?w=100&h=100&fit=crop" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-1 min-w-0 cursor-pointer">
              <h2 className="text-lg font-bold text-slate-800 leading-tight truncate">Alpha Tech Mfg</h2>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                <span className="text-slate-300 mx-0.5">•</span>
                <span className="hover:underline flex items-center gap-1">View Quote <ChevronDownIcon open={dashboardOpen} /></span>
              </div>
            </div>
          </div>

          <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Expandable Mini Dashboard */}
        <AnimatePresence>
          {dashboardOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-50/50"
            >
              <div className="p-5 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quote Summary</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">#QT-2993</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium text-sm">Total Cost</span>
                    <span className="font-bold text-slate-800 text-sm">$4,800.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium text-sm">Lead Time</span>
                    <span className="font-bold text-slate-800 text-sm">20 Days</span>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="flex justify-between items-center text-indigo-600 font-bold text-sm cursor-pointer hover:underline">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Download PDF</span>
                    <Download className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 flex flex-col gap-6">
        <div className="text-center text-xs font-bold text-slate-400 my-2">Today, 10:45 AM</div>

        <ChatMessage
          avatar="https://images.unsplash.com/photo-1769778674824-e69f58d7c55d?w=100&h=100&fit=crop"
          text="Hello! We reviewed your specs for the custom packaging boxes."
        />
        
        <ChatMessage
          avatar="https://images.unsplash.com/photo-1769778674824-e69f58d7c55d?w=100&h=100&fit=crop"
          text="We can meet your deadline. Attached is the formal quote."
        />

        {/* Embedded Document/Quote Bubble */}
        <div className="flex gap-3 max-w-[85%] relative pl-11">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm p-4 flex flex-col gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Formal_Quote_#2993.pdf</h4>
                <p className="text-xs text-slate-500 font-medium">1.2 MB</p>
              </div>
            </div>
            
            {!paid ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaid(true)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl mt-1 flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <CreditCard className="w-4 h-4" /> Pay 30% Deposit ($1,440)
              </motion.button>
            ) : (
              <div className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 rounded-xl mt-1 flex items-center justify-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Deposit Paid
              </div>
            )}
          </div>
        </div>
        
        {paid && (
          <ChatMessage
            isMe
            text="Deposit paid! Please proceed with production."
          />
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4 pb-8 z-30 fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3">
          <button className="p-3 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl transition-colors shrink-0">
            <div className="w-6 h-6 border-2 border-current rounded-full flex items-center justify-center pb-0.5 font-bold text-lg">+</div>
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-3.5 outline-none font-medium text-slate-800 placeholder:text-slate-400"
          />
          <button className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-sm hover:bg-indigo-700 transition-colors shrink-0 active:scale-95">
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ text, avatar, isMe = false }: { text: string; avatar?: string; isMe?: boolean }) {
  return (
    <div className={clsx("flex gap-3 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "")}>
      {!isMe && avatar && (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-100 mt-auto">
          <img src={avatar} className="w-full h-full object-cover" />
        </div>
      )}
      <div
        className={clsx(
          "px-4 py-3 text-[15px] font-medium leading-relaxed shadow-sm",
          isMe
            ? "bg-indigo-600 text-white rounded-[20px] rounded-br-[4px]"
            : "bg-white border border-slate-100 text-slate-700 rounded-[20px] rounded-bl-[4px]"
        )}
      >
        {text}
      </div>
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={clsx("w-3.5 h-3.5 transition-transform duration-300", open && "rotate-180")}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
