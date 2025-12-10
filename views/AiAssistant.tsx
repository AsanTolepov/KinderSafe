import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
// IMPORT YO'LI O'ZGARDI (geminiService -> ai):
import { askParentingAdvice } from '../services/ai';
import { Sparkles, Send, Bot, User as UserIcon } from 'lucide-react';
import { differenceInMonths } from 'date-fns';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AiAssistant: React.FC<{ state: AppState }> = ({ state }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Salom! Men sizning KinderSafe AI yordamchingizman. Mendan bolangizning uyqusi, ovqatlanishi yoki rivojlanishi haqida istalgan narsani so‘rashingiz mumkin.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const baby = state.babies.find(b => b.id === state.activeBabyId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // AI uchun kontekst yaratish
    let context = "Umumiy maslahatlar";
    if (baby) {
      const ageMonths = differenceInMonths(new Date(), new Date(baby.dob));
      context = `Bola ismi: ${baby.name}, Yoshi: ${ageMonths} oylik, Jinsi: ${baby.gender}.`;
    }

    try {
      const responseText = await askParentingAdvice(userMsg.text, context);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Uzr, bog'lanishda xatolik yuz berdi. Internetni tekshirib qayta urinib ko'ring.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen pt-6 pb-24 bg-gray-50 dark:bg-gray-900 max-w-md mx-auto">
      {/* HEADER */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Sparkles className="text-purple-500 fill-purple-500" /> KinderSafe AI
        </h2>
        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-semibold">Beta</span>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 py-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                {msg.sender === 'user' ? <UserIcon size={16} className="text-blue-600"/> : <Bot size={16} className="text-purple-600"/>}
              </div>
              
              {/* Message Bubble */}
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-purple-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm ml-10 border border-gray-100 dark:border-gray-700">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 fixed bottom-16 left-0 right-0 max-w-md mx-auto z-10">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Savolingizni yozing..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          AI xato qilishi mumkin. Tibbiy masalalarda shifokor bilan maslahatlashing.
        </p>
      </div>
    </div>
  );
};