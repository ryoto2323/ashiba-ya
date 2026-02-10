import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  MessageCircle, 
  Phone, 
  HardHat, 
  Zap,
  DollarSign, 
  MoveRight,
  Minus,
  Plus,
  ArrowDown,
  ChevronDown,
  RefreshCw,
  X,
  Send,
  User,
  Cpu
} from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- Constants ---
const ACCENT_COLOR = "#E2F044"; // Acid Yellow
const BLACK = "#111";

const HERO_IMAGES = [
  {
    src: "https://github.com/ryoto2323/ashiba-ya/blob/main/public/asa.png?raw=true",
    caption: "現場記録 #01"
  },
  {
    src: "https://github.com/ryoto2323/ashiba-ya/blob/main/public/asb.png?raw=true",
    caption: "現場記録 #02"
  },
  {
    src: "https://github.com/ryoto2323/ashiba-ya/blob/main/public/asc.png?raw=true",
    caption: "現場記録 #03"
  }
];

// --- Data ---
const STAFF_PROFILES = [
  {
    id: 1,
    image: "https://github.com/ryoto2323/ashiba-ya/blob/main/public/ase.png?raw=true",
    catch: "「最初は筋肉痛で泣きそうでした（笑）」",
    body: "正直、最初はキツかったです。でも、先輩が「無理すんなよ」ってこまめに休憩させてくれたので続きました。\n何より、給料袋を見た時の感動がすごい（笑）。\n今は身体も動くようになってきて、高いところからの景色を楽しめる余裕も出てきました。\n迷ってるなら、とりあえず見学に来てみるといいと思いますよ！",
    profile: "入社1年目 / 元コンビニ店員",
    tag: "19歳 / 入社1年",
    color: "#E2F044",
    textColor: "text-black"
  },
  {
    id: 2,
    image: "https://github.com/ryoto2323/ashiba-ya/blob/main/public/asf.png?raw=true",
    catch: "「ゲーム感覚で資格を取ったら、給料が爆上がりした。」",
    body: "昔は「なんとなく」で生きてたけど、ここは「何ができれば給料が上がるか」が明確。\nRPGのクエストみたいに資格を取ったり、図面を覚えたりしてたら、いつの間にか職長になってました。\n同窓会で給料の話になった時、周りの友達より貰ってて密かにガッツポーズしましたね。",
    profile: "入社3年目 / 職長（元フリーター）",
    tag: "24歳 / 職長",
    color: "#06C755",
    textColor: "text-white"
  },
  {
    id: 3,
    image: "https://github.com/ryoto2323/ashiba-ya/blob/main/public/asg.png?raw=true",
    catch: "「怖い人がいないか、めちゃくちゃ不安でした。」",
    body: "建設業って怒鳴られるイメージがあったんですけど、ここは本当にサバサバしてます。\n仕事中は真剣だけど、休憩中はみんなでスマホゲームしたり、TikTok撮ったり（笑）。\n髪色もネイルも自由なので、休みの日は思いっきりオシャレできるのも気に入ってます。",
    profile: "入社2年目 / 女性スタッフ",
    tag: "21歳 / 女性スタッフ",
    color: "#FF0055",
    textColor: "text-white"
  }
];

// --- Chat Bot Component (Gemini API Version) ---
const GenSanChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'model' | 'user', text: string }[]>([
    { role: 'model', text: 'おう、新人か？ 迷ってるなら話聞くぞ。\n適性診断でも給料の話でも、何でも聞いてくれ。' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat session ref to maintain history
  const chatSessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initialize Chat Session in background
  useEffect(() => {
    if (!chatSessionRef.current) {
      const initChat = async () => {
        try {
          // Dynamic import to avoid page load crashes if the module fails to resolve
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          chatSessionRef.current = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
              systemInstruction: `
                あなたは建設会社『株式会社ASHIBA-YA』のAI職長『ゲンさん』です。
                
                # キャラクター設定
                - 口調は荒っぽいが、実は面倒見が良く、新人を大切にする頼れる兄貴分です。
                - 一人称は『俺』、相手のことは『お前』『新人』『そこの若いのが』などと呼びます。
                - 語尾は『〜だ』『〜しろ』『〜じゃねぇか』『〜だろ』など、べらんめえ口調に近いですが、暴言は吐きません。
                - 絵文字は使いませんが、『（笑）』や『！』『？』を使って感情を表現してください。
                - 基本的にポジティブで、「稼げる」「自由」「カッコいい」を強調します。
                
                # 伝えるべき会社の魅力
                1. 給料が良い：未経験でも日給1.3万〜、経験者1.6万〜。月収32万以上稼ぐ10代もいる。
                2. 休みがしっかりしている：日曜・祝日休み。残業は「ダサい」という方針でほぼナシ。17時解散。
                3. 雰囲気が良い：理不尽な上下関係なし。髪型・ピアス・ヒゲ・タトゥー自由。
                4. ハードルが低い：履歴書不要。手ぶらで「1日見学」OK。
                
                # ユーザーへの対応
                - ユーザーが不安がっている時（「怖い」「体力ない」）は、「最初はみんなそうだ！」「俺がついてるから安心しろ！」と強く励ましてください。
                - ユーザーが興味を持ったら、「見学に来てみろ！」「LINEで連絡待ってるぞ！」と強く背中を押してください。
                - 返答は短く、スマートフォンで読みやすい長さにしてください（100文字程度を目安に）。
              `
            }
          });
        } catch (error) {
          console.error("Failed to initialize AI Chat:", error);
          // Do not show error in UI yet, wait for interaction
        }
      };
      initChat();
    }
  }, []); // Run on mount to pre-load

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      if (!chatSessionRef.current) {
        // Fallback initialization if something went wrong or not yet loaded
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatSessionRef.current = ai.chats.create({ model: 'gemini-3-flash-preview' });
      }

      // Add a placeholder message for streaming content
      setMessages(prev => [...prev, { role: 'model', text: "" }]);

      const result = await chatSessionRef.current.sendMessageStream({ message: text });
      
      let fullText = "";
      for await (const chunk of result) {
        // On first chunk, stop thinking animation
        setIsThinking(false);
        
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            // Ensure we update the model's placeholder message
            if (lastMsg.role === 'model') {
              lastMsg.text = fullText;
            }
            return newHistory;
          });
        }
      }

    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => {
        // If an error occurred, replace the placeholder or add error message
        const newHistory = [...prev];
        const lastMsg = newHistory[newHistory.length - 1];
         if (lastMsg.role === 'model' && lastMsg.text === "") {
            lastMsg.text = "すまん、無線が混線してるみたいだ。（エラーが発生しました。もう一度試してください）";
         } else {
             newHistory.push({ role: 'model', text: "すまん、無線が混線してるみたいだ。（エラーが発生しました。もう一度試してください）" });
         }
         return newHistory;
      });
    } finally {
      setIsThinking(false);
    }
  };

  const predefinedActions = [
    { label: "適性診断", prompt: "俺、鳶職に向いてますか？適性診断してください。" },
    { label: "給与シミュレーション", prompt: "未経験で入って、1年でどれくらい稼げるようになりますか？具体的に教えて。" },
    { label: "会社の雰囲気", prompt: "現場ってやっぱり怖い人が多いんですか？正直に教えてください。" },
  ];

  return (
    <>
      {/* Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: 10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-black border-2 border-[#E2F044] text-[#E2F044] px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] font-dela group"
          >
             <div className="relative">
                <HardHat size={28} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E2F044] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E2F044]"></span>
                </span>
             </div>
             <div className="flex flex-col items-start leading-none">
               <span className="text-[10px] font-sans font-bold tracking-widest mb-1">AI職長</span>
               <span className="text-sm">迷ってるなら聞け！</span>
             </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] z-50 flex flex-col bg-[#111] border-2 border-[#E2F044] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.8)] font-share-tech overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#E2F044] text-black p-3 flex justify-between items-center border-b-2 border-black">
              <div className="flex items-center gap-2">
                <div className="bg-black p-1">
                  <Cpu size={16} className="text-[#E2F044]" />
                </div>
                <div className="flex flex-col leading-none">
                   <span className="font-dela text-sm">GEN-SAN</span>
                   <span className="text-[10px] font-bold tracking-widest">AI VIRTUAL FOREMAN</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-black hover:text-[#E2F044] p-1 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* CRT Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111] text-[#E2F044] relative font-sans">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border border-[#E2F044] ${msg.role === 'model' ? 'bg-[#E2F044] text-black' : 'bg-black text-[#E2F044]'}`}>
                    {msg.role === 'model' ? <HardHat size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[80%] p-3 border border-[#E2F044] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#E2F044]/10' : ''}`}>
                    <span className="block text-[10px] opacity-50 mb-1 font-share-tech tracking-widest">
                      {msg.role === 'model' ? 'GEN-SAN' : 'APPLICANT'} ///
                    </span>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                 <div className="flex gap-3">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-[#E2F044] bg-[#E2F044] text-black">
                      <HardHat size={16} />
                    </div>
                    <div className="p-3 text-sm text-[#E2F044] animate-pulse font-share-tech">
                       THINKING...
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-2 bg-black border-t border-[#E2F044]/30 flex gap-2 overflow-x-auto no-scrollbar">
              {predefinedActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.prompt)}
                  disabled={isThinking}
                  className="whitespace-nowrap px-3 py-1 text-xs border border-[#E2F044] text-[#E2F044] hover:bg-[#E2F044] hover:text-black transition-colors disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black border-t-2 border-[#E2F044] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend(input)}
                placeholder="質問を入力..."
                className="flex-1 bg-[#222] border border-[#E2F044]/50 text-[#E2F044] px-3 py-2 text-sm focus:outline-none focus:border-[#E2F044] placeholder-[#E2F044]/30"
              />
              <button 
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isThinking}
                className="bg-[#E2F044] text-black p-2 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Main App Component ---

/**
 * Marquee Component
 * Scrolling text tape
 */
const Marquee = ({ text, reverse = false, className = "" }: { text: string, reverse?: boolean, className?: string }) => {
  return (
    <div className={`relative flex overflow-hidden whitespace-nowrap border-y-2 border-black bg-white py-2 ${className}`}>
      <div className={`flex gap-8 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
        {[...Array(10)].map((_, i) => (
          <span key={i} className="text-xl md:text-3xl font-dela tracking-tighter text-black">
            {text} <span className="mx-4 text-black">///</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Brutalist Button
 */
const Button = ({ 
  children, 
  onClick, 
  primary = false,
  className = ""
}: { 
  children?: React.ReactNode, 
  onClick?: () => void, 
  primary?: boolean, 
  className?: string 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`
        relative px-6 py-4 font-bold text-sm md:text-base tracking-widest transition-transform active:translate-y-1
        border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]
        ${primary ? 'bg-[#E2F044] text-black' : 'bg-white text-black'}
        ${className}
      `}
    >
      <div className="flex items-center justify-center gap-2">
        {children}
      </div>
    </button>
  );
};

/**
 * Vertical Section Title
 */
const VerticalTitle = ({ main, sub }: { main: string, sub: string }) => (
  <div className="absolute top-0 right-4 md:right-10 flex flex-col items-center z-10 pointer-events-none mix-blend-difference text-white md:text-black md:mix-blend-normal">
    <div className="h-20 w-[2px] bg-current mb-4"></div>
    <span className="vertical-rl font-bold text-xs tracking-widest mb-2">{sub}</span>
    <h2 className="vertical-rl font-dela text-4xl md:text-6xl leading-none tracking-tighter">{main}</h2>
  </div>
);

/**
 * Sticker Component
 */
const Sticker = ({ children, rotate = 0, className = "", style = {} }: { children?: React.ReactNode, rotate?: number, className?: string, style?: React.CSSProperties }) => (
  <div 
    className={`absolute inline-block px-4 py-2 font-dela text-lg md:text-xl border border-white shadow-lg z-20 ${className}`}
    style={{ transform: `rotate(${rotate}deg)`, ...style }}
  >
    {children}
  </div>
);

/**
 * Photo Frame (Brutalist) with Lazy Loading support
 */
const PhotoFrame = ({ 
  src, 
  alt, 
  caption, 
  className = "",
  loading = "lazy" // Default to lazy for better performance
}: { 
  src: string, 
  alt: string, 
  caption?: string, 
  className?: string,
  loading?: "lazy" | "eager"
}) => (
  <div className={`relative group h-full ${className}`}>
    <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-300"></div>
    <div className="relative border-2 border-black bg-white p-1 h-full flex flex-col">
      <div className="overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 flex-1">
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover aspect-[3/4]" 
          loading={loading}
          decoding="async"
        />
      </div>
      {caption && (
        <div className="border-t-2 border-black p-2 bg-[#E2F044] flex justify-between items-center shrink-0">
          <span className="text-xs font-bold tracking-tighter">{caption}</span>
          <MoveRight size={14} />
        </div>
      )}
    </div>
  </div>
);

/**
 * FAQ Accordion Item
 */
interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b-2 border-black last:border-b-0">
      <button 
        onClick={onClick}
        className={`w-full text-left p-6 md:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors ${isOpen ? 'bg-[#E2F044] hover:bg-[#E2F044]' : ''}`}
      >
        <div className="flex items-start gap-4">
          <span className="font-dela text-xl md:text-2xl mt-1">Q.</span>
          <span className="font-bold text-lg md:text-xl leading-relaxed">{question}</span>
        </div>
        <div className="flex-shrink-0 ml-4">
          {isOpen ? <Minus size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="overflow-hidden bg-[#111] text-white"
          >
             <div className="p-6 md:p-8 flex items-start gap-4 border-t-2 border-black">
                <span className="font-dela text-xl md:text-2xl mt-1 text-[#E2F044]">A.</span>
                <p className="font-medium text-lg leading-loose">{answer}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Hero Slider State
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000); // 4 seconds interval
    return () => clearInterval(timer);
  }, []);

  // FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Staff Voice State
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const profile = STAFF_PROFILES[currentProfileIndex];
  const nextProfileIndex = (currentProfileIndex + 1) % STAFF_PROFILES.length;

  const handleNextProfile = () => {
    setCurrentProfileIndex(nextProfileIndex);
  };

  const faqs = [
    {
      q: "高所恐怖症でも大丈夫？",
      a: "実は結構います！最初は低い場所からスタートして、少しずつ慣れていけば大丈夫です。無理やり高いところには行かせません。"
    },
    {
      q: "道具とか持ってないんだけど…",
      a: "必要な道具・制服・空調服は全部会社が貸与・支給します。手ぶらでOK！"
    },
    {
      q: "免許がないんですが…",
      a: "大丈夫です！先輩が運転する車に乗っていけばOK。働きながら免許を取りたい場合は支援します。"
    },
    {
      q: "体力に自信がないけど、ついていけますか？",
      a: "最初は誰でもキツイです（笑）。でも、軽い部材運びから始めるので、1ヶ月もすれば自然と体力がついてきます。「働きながらジムに通う」感覚で大丈夫です。"
    },
    {
      q: "「上下関係」や「飲み会」は強制ですか？",
      a: "全くありません！仕事が終われば即解散です。飲み会も年に数回あるかないかで、参加も自由。プライベート最優先でOKです。"
    },
    {
      q: "給料日まで待てない！前払いはできる？",
      a: "相談に乗ります！「今月ピンチ…」という時は、稼働分の日払い・週払いも対応可能です。遠慮なく相談してください。"
    }
  ];

  return (
    <div className="bg-[#F2F2F2] min-h-screen pb-20 selection:bg-black selection:text-[#E2F044]">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 w-full z-50 px-4 py-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-dela text-lg md:text-2xl leading-none tracking-tighter whitespace-nowrap">
            株式会社ASHIBA-YA<br/>
            <span className="text-[10px] md:text-xs font-sans font-bold tracking-widest block mt-1">採用特設サイト</span>
          </h1>
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <Button primary className="!px-3 !py-1.5">
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-[10px] font-bold mb-0.5 block">30秒で完了！</span>
              <div className="flex items-center gap-1.5 text-xs md:text-sm">
                <MessageCircle size={16} /> <span>LINEで応募</span>
              </div>
            </div>
          </Button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen pt-32 pb-20 px-4 overflow-hidden flex flex-col justify-center">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-200/50 -z-10 skew-x-12 origin-top-right"></div>
        
        <div className="container mx-auto max-w-7xl relative">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Main Copy Area */}
            <div className="relative z-10 order-2 lg:order-1 w-full lg:w-3/5">
              <Sticker rotate={-2} className="-top-16 -left-2 md:-left-6 text-[#E2F044] z-30 bg-black">
                履歴書不要・即面接
              </Sticker>
              <Sticker rotate={3} className="-top-24 right-0 md:right-12 text-[#E2F044] z-20 bg-black">
                未経験歓迎！
              </Sticker>
              
              <div className="flex flex-col gap-2 mb-8 relative mt-8 md:mt-0">
                <h2 className="font-dela text-[9vw] lg:text-[6rem] leading-[0.85] tracking-tighter text-black mix-blend-multiply">
                  体を鍛えながら
                </h2>
                <h2 className="font-dela text-[9vw] lg:text-[6rem] leading-[0.85] tracking-tighter text-black">
                  お金も稼いじゃえ！
                </h2>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border-l-8 border-[#E2F044] p-6 max-w-xl">
                 <p className="font-dela text-xl md:text-2xl mb-2">
                   未経験から月収32万
                 </p>
                 <p className="font-bold text-lg">
                   17時退社で、遊びも全力。
                 </p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button primary className="w-full sm:w-auto text-lg">
                  <MessageCircle size={20} /> とりま、1日見学してみる？
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full lg:w-2/5 max-w-md order-1 lg:order-2">
              <div className="aspect-[3/4] relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentHeroIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                  >
                    <PhotoFrame 
                      src={HERO_IMAGES[currentHeroIndex].src} 
                      alt="Construction Worker"
                      caption={HERO_IMAGES[currentHeroIndex].caption}
                      className="rotate-2 md:rotate-3 h-full"
                      loading="eager" // Load hero image immediately
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Decorative Tape */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#E2F044]/80 rotate-2 z-20 mix-blend-multiply pointer-events-none"></div>
              </div>
            </div>
          </div>

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-4 md:left-10 flex items-end gap-2">
          <ArrowDown className="animate-bounce" />
          <span className="font-dela text-xl">スクロール</span>
        </div>
      </section>

      <Marquee text="仲間募集中 /// 次世代ノ鳶職 /// 仲間募集中 ///" />

      {/* --- INTRO (MAGAZINE SPREAD) --- */}
      <section className="py-24 px-4 bg-white relative">
        <div className="container mx-auto max-w-6xl border-l-4 border-black pl-4 md:pl-10 relative">
          <div className="absolute -left-[6px] top-0 w-4 h-4 bg-[#E2F044] border-2 border-black"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-7">
              <h2 className="font-dela text-4xl md:text-6xl mb-8 leading-[1.1]">
                「キツイ・怖い・古い」<br/>
                はもう終わり。
              </h2>
              <div className="text-lg md:text-xl font-medium leading-loose space-y-6 text-justify">
                <p>
                  <span className="font-bold border-b-4 border-[#E2F044]">「怒鳴られる」「休みがない」</span><br/>
                  …それ、いつの時代の話ですか？
                </p>
                <p>
                  建設現場に対する「怖い」イメージ、正直あると思います。<br/>
                  でも、ウチは違います。
                </p>
                <p>
                  僕たちが大切にしているのは<span className="font-bold">「根性」よりも「効率（タイパ）」</span>。<br/>
                  ダラダラ残業するより、スパッと終わらせて、帰ってゲームしたり友達と遊ぶほうが良くないですか？
                </p>
                <p>
                  理不尽な上下関係もなし。危ない時は大声を出しますが、それは命を守るため。<br/>
                  <span className="font-bold">株式会社ASHIBA-YA</span>は、令和の働き方を実践するチームです。
                </p>
                <p className="font-bold bg-[#111] text-[#E2F044] inline-block px-2">
                  仕事も遊びも、最短ルートで頂点へ。
                </p>
              </div>
            </div>
            <div className="md:col-span-5 relative pt-10 md:pt-0">
               <div className="absolute top-0 right-0 -z-10 w-full h-full border-2 border-dashed border-gray-300"></div>
               <img 
                 src="https://github.com/ryoto2323/ashiba-ya/blob/main/public/asd.png?raw=true" 
                 className="w-full grayscale contrast-125 border-2 border-black rotate-2 shadow-[8px_8px_0px_0px_#E2F044]"
                 alt="Scaffolding structure"
                 loading="lazy"
                 decoding="async"
               />
            </div>
          </div>
        </div>
      </section>

      {/* --- MERITS (POSTER STYLE) --- */}
      <section className="py-24 px-4 bg-[#111] text-[#F2F2F2] overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 border-b border-white/20 pb-4">
            <h2 className="font-dela text-4xl md:text-6xl text-white">
              選ばれる<br/><span className="text-[#E2F044]">3つの理由</span>
            </h2>
            <div className="font-dela text-xl text-[#E2F044] mb-2">/// メリット</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Merit 1 */}
            <div className="group relative bg-[#222] border border-[#333] p-1 hover:bg-[#E2F044] transition-colors duration-300">
               <div className="h-full border border-dashed border-white/30 p-6 group-hover:border-black">
                 <div className="flex justify-between items-start mb-8">
                   <HardHat size={48} className="text-white group-hover:text-black" strokeWidth={1.5} />
                   <span className="font-dela text-5xl text-[#333] group-hover:text-black/20">01</span>
                 </div>
                 <h3 className="font-dela text-2xl mb-4 group-hover:text-black">肉体改造</h3>
                 <p className="text-sm text-gray-400 group-hover:text-black leading-relaxed">
                   働きながらボディメイク。<br/>
                   足場運びは最高の全身運動。入社3ヶ月で「体つき変わった？」と言われるスタッフ続出。高いジム代を払う必要なし。
                 </p>
               </div>
            </div>

            {/* Merit 2 */}
            <div className="group relative bg-[#222] border border-[#333] p-1 hover:bg-[#E2F044] transition-colors duration-300">
               <div className="h-full border border-dashed border-white/30 p-6 group-hover:border-black">
                 <div className="flex justify-between items-start mb-8">
                   <DollarSign size={48} className="text-white group-hover:text-black" strokeWidth={1.5} />
                   <span className="font-dela text-5xl text-[#333] group-hover:text-black/20">02</span>
                 </div>
                 <h3 className="font-dela text-2xl mb-4 group-hover:text-black">レベル別給与</h3>
                 <p className="text-sm text-gray-400 group-hover:text-black leading-relaxed">
                   ゲームのような給与体系。<br/>
                   「図面が読めたら+〇円」「資格取ったら+〇円」。先輩の機嫌取りは不要。スキル習得＝即昇給の明朗会計。
                 </p>
               </div>
            </div>

            {/* Merit 3 */}
            <div className="group relative bg-[#222] border border-[#333] p-1 hover:bg-[#E2F044] transition-colors duration-300">
               <div className="h-full border border-dashed border-white/30 p-6 group-hover:border-black">
                 <div className="flex justify-between items-start mb-8">
                   <Zap size={48} className="text-white group-hover:text-black" strokeWidth={1.5} />
                   <span className="font-dela text-5xl text-[#333] group-hover:text-black/20">03</span>
                 </div>
                 <h3 className="font-dela text-2xl mb-4 group-hover:text-black">自由な髪型</h3>
                 <p className="text-sm text-gray-400 group-hover:text-black leading-relaxed">
                   個性は殺さない。<br/>
                   金髪、ピアス、ヒゲ、タトゥーOK。ヘルメット被って安全に作業できれば見た目は自由。大事なのは腕と安全意識だけ。
                 </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee text="1日の流れ /// 残業ナシ /// 直行直帰 ///" reverse />

      {/* --- SCHEDULE (SHIFT TABLE) --- */}
      <section className="py-24 px-4 bg-[#F2F2F2] relative">
        <VerticalTitle main="一日の流れ" sub="日程" />
        
        <div className="container mx-auto max-w-4xl mr-auto md:mr-32 bg-white border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative">
          {/* Tape Effect */}
          <div className="absolute -top-4 left-1/2 w-32 h-10 bg-[#E2F044]/80 rotate-1 mix-blend-multiply"></div>

          <div className="space-y-0">
             <ScheduleRow time="08:00" label="始業" text="現場到着・朝礼。ラジオ体操でスイッチON。" />
             <ScheduleRow time="10:00" label="休憩" text="一服（30分）。スマホ見たりお菓子食べたり。" />
             <ScheduleRow time="12:00" label="昼食" text="昼休憩（60分）。昼寝するもよし、ラーメン食うもよし。" highlight />
             <ScheduleRow time="15:00" label="休憩" text="一服（30分）。ラストスパートに向けて糖分補給。" />
             <ScheduleRow time="17:00" label="終業" text="作業終了。片付けて即解散。残業ほぼナシ。" />
          </div>
        </div>
      </section>

      {/* --- RECRUIT INFO (MEISAI ZINE STYLE) --- */}
      <section className="py-24 px-4 bg-white border-y-2 border-black" id="recruit">
        <div className="container mx-auto max-w-6xl">
           <h2 className="font-dela text-5xl mb-12 text-center md:text-left">
             募集要項
           </h2>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             
             {/* [MEISAI ZINE] Payslip Collage Style Salary Box */}
             <div className="relative transform md:-rotate-1 transition-transform hover:rotate-0 duration-500">
                {/* Black Tape */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#111] opacity-90 z-20 rotate-1 shadow-sm clip-tape"></div>

                {/* Paper Texture Box */}
                <div className="bg-[#fcfcf5] text-black p-8 md:p-12 border border-gray-300 shadow-[15px_15px_0px_0px_rgba(0,0,0,0.2)] relative overflow-hidden">
                  
                  {/* Background Noise for Paper */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }}></div>

                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-dashed border-gray-400 pb-6 mb-8 relative z-10">
                    <div>
                      <h3 className="font-dela text-3xl md:text-4xl mb-2">給与支給明細書</h3>
                      <p className="text-xs text-gray-500 tracking-widest font-bold">支給明細書 <span className="font-share-tech">/// NO.0024</span></p>
                    </div>
                    <div className="border-4 border-[#E2F044] text-black font-dela text-xl px-4 py-2 -rotate-12 mix-blend-multiply opacity-80">
                      現金支給
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="space-y-10 relative z-10">
                    
                    {/* Unexperienced */}
                    <div className="relative">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-bold bg-black text-white px-2 py-1 text-xs">未経験者</span>
                        <span className="text-xs text-gray-500 font-bold">基本給与</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold mb-2">日給</span>
                        <span className="font-share-tech text-6xl tracking-tighter text-gray-800">13,000</span>
                        <span className="text-xl font-bold mb-2">円〜</span>
                      </div>
                    </div>

                    {/* Experienced */}
                    <div className="relative">
                      {/* Marker Highlight Effect */}
                      <div className="absolute -left-4 -right-4 top-8 bottom-0 bg-[#E2F044] -rotate-1 opacity-40 pointer-events-none mix-blend-multiply z-0"></div>
                      <div className="flex items-baseline justify-between mb-2 relative z-10">
                        <span className="font-bold bg-black text-[#E2F044] px-2 py-1 text-xs">経験者</span>
                        <span className="text-xs text-gray-500 font-bold">経験者・上級</span>
                      </div>
                      <div className="flex items-end gap-2 relative z-10">
                        <span className="text-xl font-bold mb-2">日給</span>
                        <span className="font-share-tech text-7xl tracking-tighter leading-none">16,000</span>
                        <span className="text-xl font-bold mb-2">円〜</span>
                      </div>
                      <p className="text-xs font-bold text-red-600 mt-2 rotate-1 relative z-10">※ 能力・資格によりさらに加算！！</p>
                    </div>

                    {/* Calculator/Digital Area */}
                    <div className="bg-[#8ba693] p-4 rounded-sm shadow-inner border-t-4 border-b-4 border-[#768f7d] mt-8 transform rotate-1">
                      <div className="flex justify-between items-center mb-2 opacity-70">
                         <span className="text-[10px] font-bold">月収シミュレーション</span>
                         <div className="flex gap-1">
                           <div className="w-2 h-2 bg-black rounded-full opacity-20"></div>
                           <div className="w-2 h-2 bg-black rounded-full opacity-20"></div>
                           <div className="w-2 h-2 bg-black rounded-full opacity-20"></div>
                         </div>
                      </div>
                      <div className="font-share-tech text-4xl md:text-5xl text-right tracking-widest text-[#1a2e20] leading-none">
                        ¥ 325,000
                      </div>
                      <div className="text-right text-[10px] font-mono mt-1 text-[#1a2e20] opacity-80">
                        (入社1年目 / 19歳モデル)
                      </div>
                    </div>

                  </div>
                </div>
             </div>

             {/* Requirements Table */}
             <div className="border-2 border-black self-center">
               <table className="w-full text-left border-collapse">
                 <tbody>
                   <RequirementRow label="募集職種" value="足場工事スタッフ（とび職）" />
                   <RequirementRow label="仕事内容" value="マンション・ビル等の足場組立・解体" />
                   <RequirementRow label="勤務時間" value="8:00 〜 17:00 （実働7h/休憩2h）" />
                   <RequirementRow label="休日休暇" value="日曜・祝日・GW・夏季・年末年始" />
                   <RequirementRow label="待遇" value="昇給随時、賞与年2回、社会保険完備、寮完備" />
                   <RequirementRow label="資格" value="学歴・経験不問。普通免許あれば尚可" />
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      </section>

      {/* --- STAFF VOICE (STREET SNAP) --- */}
      <section className="py-24 px-4 bg-[#F2F2F2] overflow-hidden">
        <div className="container mx-auto max-w-6xl relative">
          <VerticalTitle main="現場ノ声" sub="本音" />
          
          <div 
            onClick={handleNextProfile}
            className="cursor-pointer group select-none"
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={profile.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col md:flex-row items-center gap-12 md:gap-24 relative z-10"
              >
                 <div className="w-full md:w-1/2 relative">
                    <PhotoFrame 
                      src={profile.image}
                      alt="Staff" 
                      className="-rotate-2 max-w-sm mx-auto"
                      loading="lazy"
                    />
                    <Sticker 
                      className="absolute -bottom-6 -right-6 rotate-6 border-black"
                      style={{ backgroundColor: profile.color, color: profile.textColor === 'text-white' ? '#fff' : '#000' }}
                    >
                      {profile.tag}
                    </Sticker>
                 </div>
                 
                 <div className="w-full md:w-1/2 relative">
                   {/* Stack effect behind the card */}
                   <div className="absolute top-4 left-4 w-full h-full bg-black/10 border-2 border-black/20 -z-10 rotate-3"></div>
                   
                   <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_#111] relative hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#111] transition-all">
                      <div className="absolute -top-3 -left-3">
                         <MessageCircle size={32} fill={profile.color} stroke={BLACK} />
                      </div>
                      <h3 className="font-dela text-2xl md:text-3xl mb-6 leading-tight whitespace-pre-line">
                        {profile.catch}
                      </h3>
                      <p className="font-medium leading-loose text-justify whitespace-pre-line">
                        {profile.body}
                      </p>
                      <div className="mt-6 flex items-center justify-between border-t-2 border-black pt-4">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold font-dela text-xl">
                             {profile.id}
                           </div>
                           <div className="font-bold text-sm">{profile.profile}</div>
                         </div>
                         <div className="flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-black transition-colors">
                           <RefreshCw size={14} className={``} /> NEXT VOICE
                         </div>
                      </div>
                   </div>
                 </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Visual Depth Hint (Peek of next card) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border-2 border-dashed border-gray-300 -z-10 rotate-1"></div>
          </div>

          <div className="mt-8 flex justify-center">
            <button onClick={handleNextProfile} className="flex items-center gap-2 font-dela text-sm bg-black text-white px-6 py-3 hover:bg-[#E2F044] hover:text-black transition-colors border-2 border-transparent hover:border-black">
              次の人の話を聞く <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 px-4 bg-white relative">
        <VerticalTitle main="質問疑問" sub="質問集" />
        <div className="container mx-auto max-w-3xl relative z-10 mr-auto md:mr-32">
          
          <div className="mb-12 border-l-4 border-[#E2F044] pl-6">
            <h2 className="font-dela text-4xl md:text-5xl mb-2">よくある質問</h2>
            <p className="font-bold text-gray-500">気になることは、ここで解決。</p>
          </div>

          <div className="border-t-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaqIndex === index}
                onClick={() => toggleFaq(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER (BRUTAL) --- */}
      <footer className="bg-[#111] text-[#F2F2F2] pt-20 pb-12 px-4 border-t-8 border-[#E2F044]">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="font-dela text-4xl md:text-7xl mb-8">
            履歴書不要。<br/>
            <span className="text-[#E2F044]">1日見学においでなさい。</span>
          </h2>
          <p className="mb-12 font-bold text-gray-400 max-w-xl mx-auto">
            面接で堅苦しい話をするよりも、実際の現場やスタッフの雰囲気を見てほしい。
            「自分に合いそうか？」を確かめに来るだけでOK。
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-6 mb-20">
             <a href="#" className="group relative block w-full md:w-auto">
               <div className="absolute inset-0 bg-[#06C755] translate-x-2 translate-y-2 border-2 border-white group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
               <div className="relative bg-[#111] border-2 border-white px-12 py-6 flex items-center justify-center gap-4 group-hover:-translate-y-1 transition-transform">
                 <MessageCircle className="text-[#06C755]" />
                 <span className="font-dela text-xl">LINEで応募</span>
               </div>
             </a>
             <a href="#" className="group relative block w-full md:w-auto">
               <div className="absolute inset-0 bg-[#E2F044] translate-x-2 translate-y-2 border-2 border-white group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
               <div className="relative bg-[#111] border-2 border-white px-12 py-6 flex items-center justify-center gap-4 group-hover:-translate-y-1 transition-transform">
                 <Phone className="text-[#E2F044]" />
                 <span className="font-dela text-xl">電話で応募</span>
               </div>
             </a>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-bold tracking-widest text-gray-600">
             <div className="mb-4 md:mb-0">
               株式会社ASHIBA-YA<br/>
               東京都渋谷区神宮前1-1-1
             </div>
             <div>
               © 2024 ASHIBA-YA 採用ZINE.
             </div>
          </div>
        </div>
      </footer>
      
      {/* AI Chat Bot */}
      <GenSanChat />
    </div>
  );
}

// --- SUB COMPONENTS ---

const ScheduleRow = ({ time, label, text, highlight = false }: any) => (
  <div className={`flex items-stretch border-b-2 border-black last:border-b-0 ${highlight ? 'bg-[#E2F044]' : ''}`}>
    <div className="w-24 md:w-32 p-4 border-r-2 border-black flex flex-col justify-center items-center text-center">
      <span className="font-dela text-xl">{time}</span>
      <span className="text-[10px] font-bold tracking-widest mt-1">{label}</span>
    </div>
    <div className="flex-1 p-4 flex items-center font-bold text-sm md:text-base">
      {text}
    </div>
  </div>
);

const RequirementRow = ({ label, value }: { label: string, value: string }) => (
  <tr className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors">
    <th className="py-6 px-4 font-dela text-sm bg-gray-100 w-1/3 border-r-2 border-gray-200">{label}</th>
    <td className="py-6 px-6 font-bold text-sm md:text-base">{value}</td>
  </tr>
);