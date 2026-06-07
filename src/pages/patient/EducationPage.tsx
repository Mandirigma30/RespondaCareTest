import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { BookOpen, Search, Heart, Zap, Thermometer, Wind, ChevronRight, X, ShieldAlert } from "lucide-react";

const categories = [
  { icon: <Heart className="w-5 h-5" />,       label: "Heart Health",      color: "text-[#e53e3e]", bg: "bg-red-900/20" },
  { icon: <Zap className="w-5 h-5" />,         label: "First Aid",         color: "text-[#ed8936]", bg: "bg-orange-900/20" },
  { icon: <Thermometer className="w-5 h-5" />, label: "Fever & Flu",       color: "text-yellow-400", bg: "bg-yellow-900/20" },
  { icon: <Wind className="w-5 h-5" />,        label: "Respiratory",       color: "text-[#4299e1]", bg: "bg-blue-900/20" },
  { icon: <BookOpen className="w-5 h-5" />,    label: "All Articles",      color: "text-[#48bb78]", bg: "bg-green-900/20" },
];

const articles = [
  { 
    cat: "First Aid", 
    title: "How to Perform CPR", 
    desc: "Step-by-step guide to cardiopulmonary resuscitation for adults and children.", 
    time: "5 min read", 
    tag: "Critical",
    content: [
      "Verify the scene is safe, then tap the victim's shoulder and shout 'Are you okay?' to check for responsiveness.",
      "If unresponsive, call emergency response services immediately and request an AED.",
      "Check for breathing: tilt the head back, lift the chin, and look/listen for breathing for 5-10 seconds.",
      "If not breathing, begin chest compressions: Place hands in the center of the chest, push hard and fast (100-120 per minute, 2 inches deep).",
      "After 30 compressions, give 2 rescue breaths (tilt head, pinch nose, blow for 1 second until chest rises).",
      "Repeat cycle of 30 compressions and 2 breaths until help arrives or the AED is ready."
    ]
  },
  { 
    cat: "Heart Health", 
    title: "Recognizing Heart Attack Symptoms", 
    desc: "Early warning signs and what to do when you suspect a cardiac event.", 
    time: "4 min read", 
    tag: "Important",
    content: [
      "Watch for chest discomfort: pain, squeezing, pressure, or fullness in the center of the chest that lasts more than a few minutes.",
      "Upper body pain: discomfort spreading to the jaw, neck, back, stomach, or one/both arms.",
      "Shortness of breath, often occurring before or alongside chest discomfort.",
      "Other signs: unexplained cold sweat, lightheadedness, nausea, or dizziness.",
      "Action steps: Call emergency medical assistance immediately. Do not drive yourself. Chew an aspirin if not allergic."
    ]
  },
  { 
    cat: "Fever & Flu", 
    title: "Managing High Fever at Home", 
    desc: "Safe methods to reduce fever and when to seek emergency care.", 
    time: "3 min read", 
    tag: "Tips",
    content: [
      "Stay hydrated: drink plenty of fluids (water, oral rehydration solutions, clear broths).",
      "Wear lightweight clothing and keep the room at a comfortable, cool temperature.",
      "Use over-the-counter fever reducers such as Paracetamol or Ibuprofen according to age/weight instructions.",
      "Cool down with lukewarm sponge baths. Avoid cold water, ice baths, or rubbing alcohol as they can cause shivering.",
      "Seek emergency care if fever exceeds 39.4°C (103°F), lasts over 3 days, or is accompanied by confusion, stiff neck, or breathing difficulty."
    ]
  },
  { 
    cat: "Respiratory", 
    title: "Asthma Attack Response Protocol", 
    desc: "Immediate steps to manage an asthma attack before help arrives.", 
    time: "4 min read", 
    tag: "Critical",
    content: [
      "Help the person sit upright immediately. Do not let them lie down, which restricts breathing.",
      "Reassure them and encourage slow, steady breathing to help prevent panic.",
      "Administer rescue inhaler: give 1 puff of their reliever inhaler (blue) every 30-60 seconds, up to 10 puffs.",
      "Call emergency response if the person has trouble speaking, shows blue coloring around the lips/fingers, or fails to improve after 10 puffs."
    ]
  },
  { 
    cat: "First Aid", 
    title: "Wound Care & Bleeding Control", 
    desc: "Proper techniques to control bleeding and dress wounds in the field.", 
    time: "6 min read", 
    tag: "Essential",
    content: [
      "Apply direct pressure to the wound with a sterile gauze or clean cloth until bleeding stops.",
      "Elevate the injured area above the heart level if possible to reduce localized blood pressure.",
      "Once controlled, clean the wound gently with mild soap and water. Do not scrub.",
      "Apply an antibiotic ointment and cover with a sterile, non-stick dressing.",
      "Seek medical attention for deep puncture wounds, animal bites, embedded dirt, or if bleeding does not stop after 10 minutes of direct pressure."
    ]
  },
  { 
    cat: "Heart Health", 
    title: "Hypertension: Diet & Lifestyle Tips", 
    desc: "Practical changes to manage high blood pressure in daily life.", 
    time: "5 min read", 
    tag: "Wellness",
    content: [
      "Follow the DASH diet: prioritize fruits, vegetables, whole grains, and lean proteins while minimizing saturated fats.",
      "Reduce sodium intake: aim for under 2,000 mg of sodium daily by avoiding processed foods and excess table salt.",
      "Engage in regular physical activity: target 150 minutes of moderate aerobic exercise per week (e.g., brisk walking).",
      "Manage stress levels: practice breathing exercises, meditation, and ensure adequate sleep.",
      "Monitor blood pressure regularly at home and take prescribed medications consistently."
    ]
  },
];

const tagColors: Record<string, string> = {
  Critical: "bg-red-900/20 text-red-400", 
  Important: "bg-orange-900/20 text-orange-400",
  Tips: "bg-blue-900/20 text-blue-400", 
  Essential: "bg-purple-900/20 text-purple-400",
  Wellness: "bg-green-900/20 text-green-400",
};

export default function EducationPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All Articles");
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const filtered = articles.filter((a) => {
    const matchCat = activeCat === "All Articles" || a.cat === activeCat;
    const matchQ = a.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8 text-white relative">
      <header data-animate className="mb-8">
        <h1 className="text-3xl font-bold text-white">Health Education Library</h1>
        <p className="text-[#9ca3af] mt-2">First-aid guides, health alerts, and preventive care resources.</p>
      </header>

      {/* Search */}
      <div data-animate className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full bg-[#1a1d23] border border-gray-800 rounded-xl pl-12 pr-5 py-4 text-white placeholder-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
        />
      </div>

      {/* Category pills */}
      <div data-animate className="flex gap-3 mb-8 flex-wrap">
        {categories.map(({ label, icon, color, bg }) => (
          <button key={label} onClick={() => setActiveCat(label)}
            className={["flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border",
              activeCat === label ? "bg-[#8b1a1a] text-white border-[#8b1a1a]" : `${bg} ${color} border-transparent hover:border-current`
            ].join(" ")}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((a, i) => (
          <article 
            key={i} 
            data-animate 
            onClick={() => setSelectedArticle(a)}
            className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 hover-lift cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${tagColors[a.tag] ?? "bg-gray-800 text-gray-400"}`}>
                  {a.tag}
                </span>
                <span className="text-xs text-[#9ca3af]">{a.time}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2 group-hover:text-[#e53e3e] transition-colors">{a.title}</h3>
              <p className="text-[#9ca3af] text-sm leading-relaxed">{a.desc}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[#8b1a1a] font-semibold text-sm">
              Read article <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </article>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div 
          onClick={() => setSelectedArticle(null)}
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#161b22] border border-gray-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sm animate-scaleIn"
          >
            <header className="px-6 py-4 bg-[#1e222a] border-b border-gray-800 flex justify-between items-center">
              <div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${tagColors[selectedArticle.tag] ?? "bg-gray-800"}`}>
                  {selectedArticle.tag}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{selectedArticle.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh]">
              <p className="text-[#9ca3af] text-sm italic">{selectedArticle.desc}</p>
              
              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-xs font-mono text-[#ff8080] uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#8b1a1a]" /> Step-by-Step Instructions
                </h4>
                <ol className="space-y-3">
                  {selectedArticle.content?.map((step: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-gray-300 leading-relaxed text-sm">
                      <span className="w-6 h-6 rounded-full bg-[#8b1a1a]/25 text-[#ff8080] font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <footer className="px-6 py-4 bg-[#1e222a] border-t border-gray-800 flex justify-between items-center text-xs text-[#8b949e]">
              <span>Category: {selectedArticle.cat}</span>
              <span>{selectedArticle.time}</span>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
