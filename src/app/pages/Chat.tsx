import { useState, useRef, useEffect } from "react";
import { ArrowLeft, MoreVertical, Paperclip, Send, FileText, ChevronDown, CheckCircle2, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { cn } from "../../lib/utils";

const factoryInfo = {
  name: "EcoBox Packagings Co.",
  status: "Online",
  avatar: "https://images.unsplash.com/photo-1768796372362-05c256e61d8c?w=100&q=80",
};

const quoteDetails = {
  rfq: "10,000 Custom Printed Mailer Boxes",
  price: "$2,150.00",
  leadTime: "14 Days",
  validUntil: "20 May 2024",
};

const initialMessages = [
  {
    id: 1,
    sender: "factory",
    text: "Hello! We have reviewed your RFQ for the mailer boxes.",
    time: "10:30 AM",
  },
  {
    id: 2,
    sender: "factory",
    text: "We can meet your requirements with our E-flute corrugated material. Attached is our formal quotation.",
    time: "10:31 AM",
  },
  {
    id: 3,
    sender: "factory",
    type: "quote",
    time: "10:31 AM",
    quoteId: "QT-2024-089",
    amount: "$2,150.00",
  },
  {
    id: 4,
    sender: "user",
    text: "Thanks for the quick response. The price looks good.",
    time: "10:45 AM",
  },
];

export function Chat() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMessage]);
    setInputText("");
    
    // Simulate typing and response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "factory",
        text: "Great! Let me know when you're ready to proceed with the deposit.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] relative">
      {/* Header Area */}
      <div className="bg-white z-20 shadow-sm border-b border-slate-100 sticky top-0">
        <header className="px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="text-slate-700" size={24} />
          </button>
          
          <div className="flex items-center gap-3 flex-1 ml-2">
            <div className="relative">
              <img src={factoryInfo.avatar} alt="Factory" className="w-10 h-10 rounded-full object-cover border-2 border-slate-50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-[15px] text-slate-800 leading-tight">{factoryInfo.name}</h2>
              <span className="text-xs font-semibold text-emerald-500">{factoryInfo.status}</span>
            </div>
          </div>
          
          <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors">
            <MoreVertical className="text-slate-400" size={20} />
          </button>
        </header>

        {/* Mini-Dashboard (Collapsible Quote) */}
        <div className="px-6 py-2 border-t border-slate-50">
          <button 
            onClick={() => setIsQuoteOpen(!isQuoteOpen)}
            className="w-full flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[#6C5CE7]">
                <FileText size={16} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Quote</span>
                <span className="font-bold text-[15px] text-slate-800">{quoteDetails.price}</span>
              </div>
            </div>
            {isQuoteOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
          </button>

          <AnimatePresence>
            {isQuoteOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50 rounded-2xl p-4 mt-2 mb-2 flex flex-col gap-3 border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">RFQ</span>
                    <span className="font-bold text-slate-800 max-w-[150px] truncate">{quoteDetails.rfq}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Lead Time</span>
                    <span className="font-bold text-slate-800">{quoteDetails.leadTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Valid Until</span>
                    <span className="font-bold text-slate-800">{quoteDetails.validUntil}</span>
                  </div>
                  <button className="w-full py-2.5 mt-2 bg-white border border-[#6C5CE7] text-[#6C5CE7] rounded-xl text-sm font-bold shadow-sm">
                    View Full PDF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 pt-6 flex flex-col gap-4 bg-[#F8F9FA]">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={cn(
              "flex max-w-[85%]",
              msg.sender === "user" ? "ml-auto" : "mr-auto"
            )}
          >
            {msg.type === "quote" ? (
              <div className="bg-white border border-indigo-100 rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex flex-col gap-4 w-[280px]">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7] flex items-center justify-center text-white">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[15px]">Formal Quotation</h4>
                    <span className="text-xs font-semibold text-slate-400">{msg.quoteId}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                    <span className="font-black text-2xl text-slate-800 tracking-tight">{msg.amount}</span>
                  </div>
                </div>

                {/* The "Pay Deposit" Action Button */}
                <button 
                  onClick={() => navigate('/orders/1')}
                  className="w-full bg-[#6C5CE7] text-white py-3.5 rounded-2xl font-bold text-sm mt-1 shadow-md shadow-indigo-200/50 flex justify-center items-center gap-2 transition-transform active:scale-95"
                >
                  <CheckCircle2 size={18} />
                  Pay 30% Deposit
                </button>
              </div>
            ) : (
              <div
                className={cn(
                  "p-4 rounded-3xl text-[15px] leading-relaxed relative",
                  msg.sender === "user"
                    ? "bg-[#6C5CE7] text-white rounded-tr-none shadow-md shadow-indigo-200"
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm"
                )}
              >
                <p className="font-medium">{msg.text}</p>
                <span
                  className={cn(
                    "text-[10px] font-bold mt-2 block",
                    msg.sender === "user" ? "text-indigo-200 text-right" : "text-slate-400"
                  )}
                >
                  {msg.time}
                </span>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* Input Area */}
      <div className="bg-white p-4 pb-8 border-t border-slate-100 flex items-center gap-3 z-10 sticky bottom-0 w-full">
        <button className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors shrink-0">
          <Paperclip size={20} />
        </button>
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-50 border border-slate-100 rounded-[2rem] px-5 py-3.5 focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all text-[15px] font-medium text-slate-800 placeholder:text-slate-400"
        />
        
        <button 
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="p-3 bg-[#6C5CE7] text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-md shadow-indigo-200 shrink-0"
        >
          <Send size={20} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}
