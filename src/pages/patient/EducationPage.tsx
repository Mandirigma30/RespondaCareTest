import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { BookOpen, Search, Heart, Zap, Thermometer, Wind, ChevronRight } from "lucide-react";

const categories = [
  { icon: <Heart className="w-5 h-5" />,       label: "Heart Health",      color: "text-[#e53e3e]", bg: "bg-red-900/20" },
  { icon: <Zap className="w-5 h-5" />,         label: "First Aid",         color: "text-[#ed8936]", bg: "bg-orange-900/20" },
  { icon: <Thermometer className="w-5 h-5" />, label: "Fever & Flu",       color: "text-yellow-400", bg: "bg-yellow-900/20" },
  { icon: <Wind className="w-5 h-5" />,        label: "Respiratory",       color: "text-[#4299e1]", bg: "bg-blue-900/20" },
  { icon: <BookOpen className="w-5 h-5" />,    label: "All Articles",      color: "text-[#48bb78]", bg: "bg-green-900/20" },
];

const articles = [
  { cat: "First Aid",   title: "How to Perform CPR",                   desc: "Step-by-step guide to cardiopulmonary resuscitation for adults and children.", time: "5 min read", tag: "Critical" },
  { cat: "Heart Health", title: "Recognizing Heart Attack Symptoms",    desc: "Early warning signs and what to do when you suspect a cardiac event.", time: "4 min read", tag: "Important" },
  { cat: "Fever & Flu",  title: "Managing High Fever at Home",          desc: "Safe methods to reduce fever and when to seek emergency care.", time: "3 min read", tag: "Tips" },
  { cat: "Respiratory",  title: "Asthma Attack Response Protocol",      desc: "Immediate steps to manage an asthma attack before help arrives.", time: "4 min read", tag: "Critical" },
  { cat: "First Aid",   title: "Wound Care & Bleeding Control",         desc: "Proper techniques to control bleeding and dress wounds in the field.", time: "6 min read", tag: "Essential" },
  { cat: "Heart Health", title: "Hypertension: Diet & Lifestyle Tips",  desc: "Practical changes to manage high blood pressure in daily life.", time: "5 min read", tag: "Wellness" },
];

const tagColors: Record<string, string> = {
  Critical: "bg-red-900/20 text-red-400", Important: "bg-orange-900/20 text-orange-400",
  Tips: "bg-blue-900/20 text-blue-400", Essential: "bg-purple-900/20 text-purple-400",
  Wellness: "bg-green-900/20 text-green-400",
};

export default function EducationPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All Articles");
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
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8 text-white">
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
          <article key={i} data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 hover-lift cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${tagColors[a.tag] ?? "bg-gray-800 text-gray-400"}`}>
                {a.tag}
              </span>
              <span className="text-xs text-[#9ca3af]">{a.time}</span>
            </div>
            <h3 className="font-bold text-white text-base mb-2 group-hover:text-[#e53e3e] transition-colors">{a.title}</h3>
            <p className="text-[#9ca3af] text-sm leading-relaxed">{a.desc}</p>
            <div className="flex items-center gap-2 mt-4 text-[#8b1a1a] font-semibold text-sm">
              Read article <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
