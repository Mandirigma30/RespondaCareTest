import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
  BookOpen, Search, Heart, Zap, Thermometer, Wind, ChevronRight, X,
  ShieldAlert, Activity, Utensils, Ban, Loader2, AlertCircle, Star
} from "lucide-react";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

// ─── Typed interfaces ────────────────────────────────────────────────────────

interface HowToStep {
  step: string;
}

interface DoNotItem {
  item: string;
}

interface EducationModule {
  title: string;
  desc: string;
  cat: string;
  tag: string;
  time: string;
  howTo: HowToStep[];
  doNot: DoNotItem[];
  icon: React.ReactNode;
}

// ─── Condition → Education map (data-driven, typed) ─────────────────────────

const CONDITION_EDUCATION_MAP: Record<string, EducationModule[]> = {
  diabetes: [
    {
      title: "Insulin Administration Guide",
      desc: "Safe and correct techniques for self-administering insulin injections.",
      cat: "Diabetes Management",
      tag: "Critical",
      time: "6 min read",
      icon: <Activity className="w-5 h-5 text-blue-400" />,
      howTo: [
        { step: "Wash hands thoroughly with soap and water before preparing injection." },
        { step: "Select a rotation site (abdomen, thigh, upper arm) to prevent lipohypertrophy." },
        { step: "Pinch the skin gently and insert the needle at a 90° angle (45° if thin)." },
        { step: "Inject the full dose slowly, then hold needle in place for 10 seconds before removing." },
        { step: "Do not rub the injection site. Dispose of needle in a sharps container immediately." },
        { step: "Record dose, time, and blood glucose reading in your log every session." },
      ],
      doNot: [
        { item: "Do NOT inject into bruised, infected, or scarred tissue." },
        { item: "Do NOT reuse needles — each injection requires a fresh, sterile needle." },
        { item: "Do NOT skip doses without consulting your endocrinologist." },
        { item: "Do NOT shake insulin vials vigorously; roll gently to mix cloudy insulin." },
      ],
    },
    {
      title: "Diabetic Dietary Restrictions",
      desc: "Foods to avoid and safe alternatives for managing blood glucose levels.",
      cat: "Diabetes Management",
      tag: "Wellness",
      time: "5 min read",
      icon: <Utensils className="w-5 h-5 text-amber-400" />,
      howTo: [
        { step: "Prioritize low-GI foods: leafy greens, legumes, whole grains, and non-starchy vegetables." },
        { step: "Eat consistent portion sizes at regular meal times to prevent glucose spikes." },
        { step: "Choose lean proteins: fish, chicken breast, tofu, and eggs." },
        { step: "Replace white rice with brown rice, cauliflower rice, or quinoa." },
        { step: "Drink water, unsweetened tea, or sugar-free beverages instead of sodas." },
      ],
      doNot: [
        { item: "Avoid: white sugar, honey, syrup, candy, sweetened beverages, and fruit juice." },
        { item: "Avoid: white bread, white rice, refined pasta, pastries, and crackers." },
        { item: "Avoid: high-GI fruits in large quantities — bananas, mangoes, grapes, watermelon." },
        { item: "Avoid: fried foods, fast food, processed meats, and full-fat dairy." },
      ],
    },
    {
      title: "Foot Care for Diabetic Residents",
      desc: "Daily foot care routines to prevent diabetic neuropathy complications.",
      cat: "Diabetes Management",
      tag: "Important",
      time: "4 min read",
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      howTo: [
        { step: "Inspect both feet daily with a mirror for cuts, sores, blisters, or swelling." },
        { step: "Wash feet daily in lukewarm (not hot) water and dry thoroughly, especially between toes." },
        { step: "Apply non-perfumed moisturizer to the tops and soles — avoid applying between toes." },
        { step: "Cut toenails straight across and file edges smooth to prevent ingrown nails." },
        { step: "Wear properly fitted shoes and clean, padded socks at all times — never walk barefoot." },
      ],
      doNot: [
        { item: "Do NOT use heating pads or hot water bottles on feet — neuropathy reduces sensation." },
        { item: "Do NOT use sharp objects to remove calluses or corns; visit a podiatrist." },
        { item: "Do NOT ignore minor cuts or wounds — seek medical care within 24 hours." },
        { item: "Do NOT wear tight shoes, high heels, or pointed-toe footwear." },
      ],
    },
    {
      title: "Blood Glucose Monitoring",
      desc: "How to correctly measure and interpret your blood glucose readings.",
      cat: "Diabetes Management",
      tag: "Essential",
      time: "4 min read",
      icon: <Activity className="w-5 h-5 text-green-400" />,
      howTo: [
        { step: "Wash and dry hands before testing — residue on fingers affects accuracy." },
        { step: "Insert a fresh test strip into the glucometer and prick the side of a fingertip." },
        { step: "Apply a small blood drop to the test strip; read result within 5 seconds." },
        { step: "Target ranges: fasting 4.0–7.0 mmol/L; 2 hours post-meal below 10.0 mmol/L." },
        { step: "Log every reading with time of day and recent meal for your BHW or doctor." },
      ],
      doNot: [
        { item: "Do NOT test from the same finger repeatedly; rotate among all fingers." },
        { item: "Do NOT use expired test strips — results will be inaccurate." },
        { item: "Do NOT ignore readings above 13.9 mmol/L; seek medical attention immediately." },
        { item: "Do NOT calibrate against online values — use the controls provided with your kit." },
      ],
    },
  ],
  hypertension: [
    {
      title: "Low-Sodium Diet for Hypertension",
      desc: "Reducing salt intake is the most impactful dietary change for blood pressure control.",
      cat: "Hypertension Control",
      tag: "Critical",
      time: "5 min read",
      icon: <Utensils className="w-5 h-5 text-orange-400" />,
      howTo: [
        { step: "Aim for under 2,000 mg of sodium per day (approximately 1 teaspoon of salt)." },
        { step: "Cook at home using herbs, lemon, garlic, and spices instead of salt or MSG." },
        { step: "Read nutrition labels: choose products with less than 140 mg sodium per serving." },
        { step: "Eat potassium-rich foods to counterbalance sodium: bananas, sweet potatoes, spinach." },
        { step: "Eat 4–5 servings of fruits and vegetables daily following the DASH diet guidelines." },
      ],
      doNot: [
        { item: "Avoid: table salt, soy sauce, patis (fish sauce), and bagoong (shrimp paste)." },
        { item: "Avoid: processed meats (tocino, hotdogs, longganisa), canned goods, and instant noodles." },
        { item: "Avoid: fast food, pickled foods, and restaurant meals with hidden sodium." },
        { item: "Avoid: excessive alcohol consumption — limit to 1 drink/day for women, 2 for men." },
      ],
    },
    {
      title: "Medication Adherence for Hypertension",
      desc: "Why taking your antihypertensive medication on schedule is non-negotiable.",
      cat: "Hypertension Control",
      tag: "Important",
      time: "4 min read",
      icon: <ShieldAlert className="w-5 h-5 text-yellow-400" />,
      howTo: [
        { step: "Take medications at the same time every day — set a daily phone alarm as a reminder." },
        { step: "Never skip a dose; if missed, take it as soon as remembered unless it's near the next dose." },
        { step: "Never double-dose to make up for a missed one." },
        { step: "Store medications in a cool, dry place away from direct sunlight." },
        { step: "Report any side effects (dizziness, swelling, dry cough) to your BHW or doctor immediately." },
      ],
      doNot: [
        { item: "Do NOT stop taking medication because your BP feels normal — hypertension is often silent." },
        { item: "Do NOT take herbal supplements without consulting your physician first." },
        { item: "Do NOT substitute your prescribed medication with a different brand without clearance." },
        { item: "Do NOT share your medications with others, even family members with similar symptoms." },
      ],
    },
    {
      title: "Blood Pressure Monitoring Technique",
      desc: "How to measure your blood pressure accurately at home.",
      cat: "Hypertension Control",
      tag: "Essential",
      time: "4 min read",
      icon: <Activity className="w-5 h-5 text-red-400" />,
      howTo: [
        { step: "Rest quietly for 5 minutes before measuring — avoid caffeine and exercise beforehand." },
        { step: "Sit upright with your back supported, feet flat on the floor, arm at heart level." },
        { step: "Wrap the cuff around bare upper arm, 2–3 cm above the elbow." },
        { step: "Take two readings, 1–2 minutes apart, and record the average." },
        { step: "Measure at the same times daily (morning before medications, evening before dinner)." },
        { step: "Target: below 130/80 mmHg. Alert BHW if consistently above 140/90 mmHg." },
      ],
      doNot: [
        { item: "Do NOT talk, cross your legs, or hold your breath during measurement." },
        { item: "Do NOT use a cuff that is too small or too large — it gives false readings." },
        { item: "Do NOT measure immediately after smoking, eating, or exercising." },
        { item: "Do NOT rely solely on pharmacy machines — validate with a calibrated home monitor." },
      ],
    },
  ],
  asthma: [
    {
      title: "Proper Inhaler Technique",
      desc: "Correct use of metered-dose inhalers (MDIs) ensures medication reaches your lungs.",
      cat: "Asthma Care",
      tag: "Critical",
      time: "5 min read",
      icon: <Wind className="w-5 h-5 text-blue-400" />,
      howTo: [
        { step: "Remove the cap and shake the inhaler vigorously for 5 seconds." },
        { step: "Breathe out fully to empty your lungs before inhaling." },
        { step: "Place the mouthpiece in your mouth, forming a complete seal with your lips." },
        { step: "Press the canister down while simultaneously breathing in slowly and deeply." },
        { step: "Hold your breath for 10 seconds to allow medication to settle in the airways." },
        { step: "Wait 30–60 seconds between puffs if more than one is prescribed." },
      ],
      doNot: [
        { item: "Do NOT breathe in too quickly — the medication will deposit in your throat, not lungs." },
        { item: "Do NOT skip using a spacer device if prescribed — it significantly improves delivery." },
        { item: "Do NOT use a reliever inhaler more than 3 times per week without seeking medical review." },
        { item: "Do NOT forget to rinse your mouth after using steroid (preventer) inhalers." },
      ],
    },
    {
      title: "Asthma Trigger Avoidance",
      desc: "Identifying and eliminating triggers is the most effective long-term asthma strategy.",
      cat: "Asthma Care",
      tag: "Important",
      time: "5 min read",
      icon: <Ban className="w-5 h-5 text-red-400" />,
      howTo: [
        { step: "Identify your personal triggers by keeping a diary of episodes and exposures." },
        { step: "Vacuum carpets and upholstered furniture weekly using a HEPA-filter vacuum." },
        { step: "Wash bedding in hot water (≥55°C) weekly to eliminate dust mites." },
        { step: "Keep indoor humidity below 50% using air conditioning or a dehumidifier." },
        { step: "Stay indoors on high-pollution, high-pollen days; check the air quality index daily." },
      ],
      doNot: [
        { item: "Avoid: cigarette smoke, incense, candles, and strong perfumes in enclosed spaces." },
        { item: "Avoid: mold exposure — fix water leaks and clean visible mold with diluted bleach." },
        { item: "Avoid: pets in the bedroom if you have pet dander sensitivity." },
        { item: "Avoid: NSAID pain relievers (ibuprofen, aspirin) — they can trigger bronchospasm." },
        { item: "Avoid: cold, dry air without a scarf or mask over the mouth during weather changes." },
      ],
    },
    {
      title: "Peak Flow Monitoring",
      desc: "How to use a peak flow meter to detect asthma flare-ups before they worsen.",
      cat: "Asthma Care",
      tag: "Essential",
      time: "4 min read",
      icon: <Activity className="w-5 h-5 text-green-400" />,
      howTo: [
        { step: "Set the indicator to zero. Stand upright and take a deep breath." },
        { step: "Place the mouthpiece in your mouth and seal your lips tightly around it." },
        { step: "Blow out as fast and hard as possible in one sharp breath." },
        { step: "Record the reading. Repeat 3 times and note the highest value." },
        { step: "Compare against your personal best. Green: ≥80%, Yellow: 50–79%, Red: <50%." },
        { step: "Contact BHW or go to the health center if reading falls into the Yellow or Red zone." },
      ],
      doNot: [
        { item: "Do NOT block the air hole with your tongue or teeth during the measurement." },
        { item: "Do NOT sit down during peak flow measurement — always stand for best effort." },
        { item: "Do NOT measure after using your reliever inhaler — it will inflate the reading." },
        { item: "Do NOT ignore Yellow Zone readings — they indicate deteriorating control." },
      ],
    },
  ],
  default: [
    {
      title: "General Wellness & Preventive Care",
      desc: "Foundational health habits for all barangay residents.",
      cat: "Wellness",
      tag: "Wellness",
      time: "5 min read",
      icon: <Heart className="w-5 h-5 text-green-400" />,
      howTo: [
        { step: "Aim for 150 minutes of moderate aerobic activity per week (brisk walking, cycling)." },
        { step: "Eat a balanced diet with half your plate as fruits and vegetables at every meal." },
        { step: "Drink 8–10 glasses of water daily and limit sugary beverages." },
        { step: "Sleep 7–9 hours per night and maintain a consistent sleep schedule." },
        { step: "Schedule annual physical exams and quarterly blood pressure screenings at the barangay clinic." },
      ],
      doNot: [
        { item: "Do NOT skip regular health check-ups even if you feel healthy." },
        { item: "Do NOT self-medicate with antibiotics — take only as prescribed to prevent resistance." },
        { item: "Avoid: sedentary behavior — stand and stretch every 30 minutes if working at a desk." },
        { item: "Avoid: smoking or tobacco use in any form." },
      ],
    },
    {
      title: "How to Perform CPR",
      desc: "Step-by-step guide to cardiopulmonary resuscitation for adults and children.",
      cat: "First Aid",
      tag: "Critical",
      time: "5 min read",
      icon: <Zap className="w-5 h-5 text-red-400" />,
      howTo: [
        { step: "Verify the scene is safe, then tap the victim's shoulder and shout 'Are you okay?'" },
        { step: "If unresponsive, call emergency response services immediately and request an AED." },
        { step: "Check for breathing: tilt head back, lift chin, look/listen for breathing 5–10 seconds." },
        { step: "Begin chest compressions: hands center of chest, push hard and fast (100–120/min, 2 inches deep)." },
        { step: "After 30 compressions, give 2 rescue breaths. Repeat until help arrives or AED is ready." },
      ],
      doNot: [
        { item: "Do NOT stop compressions unless the person wakes, help arrives, or you are physically unable to continue." },
        { item: "Do NOT delay starting CPR to wait for an AED — begin immediately." },
        { item: "Do NOT give rescue breaths if you are not trained — hands-only CPR is still effective." },
      ],
    },
    {
      title: "Managing High Fever at Home",
      desc: "Safe methods to reduce fever and when to seek emergency care.",
      cat: "Fever & Flu",
      tag: "Tips",
      time: "3 min read",
      icon: <Thermometer className="w-5 h-5 text-yellow-400" />,
      howTo: [
        { step: "Drink plenty of fluids (water, ORS, clear broths) to prevent dehydration." },
        { step: "Wear lightweight clothing and keep the room at a comfortable, cool temperature." },
        { step: "Use Paracetamol or Ibuprofen per age/weight instructions for fever reduction." },
        { step: "Sponge with lukewarm (not cold) water if fever is above 38.5°C." },
        { step: "Seek emergency care if fever exceeds 39.4°C, lasts over 3 days, or causes confusion." },
      ],
      doNot: [
        { item: "Do NOT use cold water, ice baths, or rubbing alcohol — they can cause dangerous shivering." },
        { item: "Do NOT give aspirin to children under 16 (risk of Reye's syndrome)." },
        { item: "Do NOT bundle the patient in thick blankets — it traps heat and worsens fever." },
      ],
    },
  ],
};

// ─── Category pill config ────────────────────────────────────────────────────

const CATEGORY_PILLS = [
  { label: "Personalized",  icon: <Star className="w-4 h-4" />,       color: "text-amber-400",   bg: "bg-amber-900/20" },
  { label: "All Articles",  icon: <BookOpen className="w-4 h-4" />,   color: "text-green-400",   bg: "bg-green-900/20" },
  { label: "First Aid",     icon: <Zap className="w-4 h-4" />,        color: "text-orange-400",  bg: "bg-orange-900/20" },
  { label: "Fever & Flu",   icon: <Thermometer className="w-4 h-4" />, color: "text-yellow-400", bg: "bg-yellow-900/20" },
  { label: "Respiratory",   icon: <Wind className="w-4 h-4" />,       color: "text-blue-400",    bg: "bg-blue-900/20" },
  { label: "Heart Health",  icon: <Heart className="w-4 h-4" />,      color: "text-red-400",     bg: "bg-red-900/20" },
];

const TAG_COLORS: Record<string, string> = {
  Critical:  "bg-red-900/20 text-red-400",
  Important: "bg-orange-900/20 text-orange-400",
  Tips:      "bg-blue-900/20 text-blue-400",
  Essential: "bg-purple-900/20 text-purple-400",
  Wellness:  "bg-green-900/20 text-green-400",
};

// ─── Condition keyword → map key ─────────────────────────────────────────────

function resolveConditionKeys(conditionsText: string): string[] {
  const lower = conditionsText.toLowerCase();
  const keys: string[] = [];
  if (lower.includes("diabet")) keys.push("diabetes");
  if (lower.includes("hypertension") || lower.includes("blood pressure") || lower.includes("hbp")) keys.push("hypertension");
  if (lower.includes("asthma") || lower.includes("copd") || lower.includes("respiratory")) keys.push("asthma");
  return keys;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EducationPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All Articles");
  const [selectedArticle, setSelectedArticle] = useState<EducationModule | null>(null);

  // Personalization state
  const [personalizedModules, setPersonalizedModules] = useState<EducationModule[]>([]);
  const [conditionLabel, setConditionLabel] = useState<string>("your conditions");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, [profileLoading]);

  // Fetch health.profiles from Supabase, scoped to the logged-in resident via RLS
  const fetchPersonalizedContent = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);

    try {
      if (isPlaceholderUrl) {
        // Offline mode: fall back to cached session data
        const session = localStorage.getItem("respondaCare_session");
        if (session) {
          const parsed = JSON.parse(session) as Record<string, unknown>;
          const chronic = typeof parsed.chronic === "string" ? parsed.chronic : "";
          if (chronic) {
            const keys = resolveConditionKeys(chronic);
            const modules = keys.flatMap((k) => CONDITION_EDUCATION_MAP[k] ?? []);
            setPersonalizedModules(modules.length > 0 ? modules : CONDITION_EDUCATION_MAP.default);
            setConditionLabel(chronic || "your conditions");
          } else {
            setPersonalizedModules(CONDITION_EDUCATION_MAP.default);
            setConditionLabel("general wellness");
          }
        } else {
          setPersonalizedModules(CONDITION_EDUCATION_MAP.default);
          setConditionLabel("general wellness");
        }
        return;
      }

      // Live Supabase: get authenticated user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);

      const authUser = sessionData?.session?.user;
      if (!authUser) {
        setPersonalizedModules(CONDITION_EDUCATION_MAP.default);
        setConditionLabel("general wellness");
        return;
      }

      // Resolve resident_id from core.residents (RLS ensures we only get our own row)
      const { data: resData, error: resError } = await supabase
        .schema("core")
        .from("residents")
        .select("resident_id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (resError) throw new Error(resError.message);
      if (!resData?.resident_id) {
        setPersonalizedModules(CONDITION_EDUCATION_MAP.default);
        setConditionLabel("general wellness");
        return;
      }

      // Fetch health profile — RLS health_profiles_self ensures resident only reads own row
      const { data: profileData, error: profileErr } = await supabase
        .schema("health")
        .from("profiles")
        .select("signs_symptoms, past_medical_hx")
        .eq("resident_id", resData.resident_id)
        .maybeSingle();

      if (profileErr) throw new Error(profileErr.message);

      const conditionsText = [
        profileData?.signs_symptoms ?? "",
        profileData?.past_medical_hx ?? "",
      ].join(" ").trim();

      if (!conditionsText) {
        setPersonalizedModules(CONDITION_EDUCATION_MAP.default);
        setConditionLabel("general wellness");
        return;
      }

      const keys = resolveConditionKeys(conditionsText);
      const modules = keys.flatMap((k) => CONDITION_EDUCATION_MAP[k] ?? []);
      setPersonalizedModules(modules.length > 0 ? modules : CONDITION_EDUCATION_MAP.default);
      setConditionLabel(conditionsText.slice(0, 60) + (conditionsText.length > 60 ? "..." : ""));

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setProfileError(message);
      setPersonalizedModules(CONDITION_EDUCATION_MAP.default);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonalizedContent();
  }, [fetchPersonalizedContent]);

  // Build the full article list based on active category
  const allModules: EducationModule[] = [
    ...CONDITION_EDUCATION_MAP.diabetes,
    ...CONDITION_EDUCATION_MAP.hypertension,
    ...CONDITION_EDUCATION_MAP.asthma,
    ...CONDITION_EDUCATION_MAP.default,
  ];

  const catModuleMap: Record<string, EducationModule[]> = {
    "Personalized":  personalizedModules,
    "All Articles":  allModules,
    "First Aid":     allModules.filter((m) => m.cat === "First Aid"),
    "Fever & Flu":   allModules.filter((m) => m.cat === "Fever & Flu"),
    "Respiratory":   allModules.filter((m) => m.cat === "Asthma Care"),
    "Heart Health":  allModules.filter((m) => m.cat === "Hypertension Control"),
  };

  const sourceModules = catModuleMap[activeCat] ?? allModules;

  const filtered = sourceModules.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase()) ||
    m.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8 text-white relative">
      <header data-animate className="mb-8">
        <h1 className="text-3xl font-bold text-white">Health Education Library</h1>
        <p className="text-[#9ca3af] mt-2">
          First-aid guides, health alerts, and preventive care resources — personalised for you.
        </p>
      </header>

      {/* Personalized banner */}
      {!profileLoading && !profileError && personalizedModules.length > 0 && activeCat === "Personalized" && (
        <div data-animate className="mb-6 p-4 rounded-xl bg-amber-950/25 border border-amber-500/20 flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-300">Personalized Content Active</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Showing modules tailored to: <span className="italic">{conditionLabel}</span></p>
          </div>
        </div>
      )}

      {/* Profile loading banner */}
      {profileLoading && (
        <div data-animate className="mb-6 p-4 rounded-xl bg-[#1a1d23] border border-gray-800 flex items-center gap-3 text-sm text-[#9ca3af]">
          <Loader2 className="w-4 h-4 animate-spin text-[#8b1a1a]" />
          Fetching your health profile for personalized content…
        </div>
      )}

      {/* Profile error banner (non-blocking — defaults to general content) */}
      {profileError && (
        <div data-animate className="mb-6 p-4 rounded-xl bg-red-950/25 border border-red-500/20 flex items-center gap-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Could not load your health profile ({profileError}). Showing general content.</span>
        </div>
      )}

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
        {CATEGORY_PILLS.map(({ label, icon, color, bg }) => (
          <button
            key={label}
            onClick={() => setActiveCat(label)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border",
              activeCat === label
                ? "bg-[#8b1a1a] text-white border-[#8b1a1a]"
                : `${bg} ${color} border-transparent hover:border-current`,
            ].join(" ")}
          >
            {icon} {label}
            {label === "Personalized" && !profileLoading && personalizedModules.length > 0 && (
              <span className="ml-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {personalizedModules.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!profileLoading && filtered.length === 0 && (
        <div data-animate className="text-center py-16 text-[#8b949e]">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No articles found</p>
          <p className="text-xs mt-1">Try a different search term or category.</p>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((m, i) => (
          <article
            key={`${m.title}-${i}`}
            data-animate
            onClick={() => setSelectedArticle(m)}
            className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 hover-lift cursor-pointer group flex flex-col justify-between transition-all hover:border-[#8b1a1a]/40"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${TAG_COLORS[m.tag] ?? "bg-gray-800 text-gray-400"}`}>
                  {m.tag}
                </span>
                <span className="text-xs text-[#9ca3af]">{m.time}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {m.icon}
                <h3 className="font-bold text-white text-base group-hover:text-[#e53e3e] transition-colors leading-tight">{m.title}</h3>
              </div>
              <p className="text-[#9ca3af] text-sm leading-relaxed">{m.desc}</p>
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
            className="bg-[#161b22] border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sm animate-scaleIn max-h-[90vh]"
          >
            <header className="px-6 py-4 bg-[#1e222a] border-b border-gray-800 flex justify-between items-center flex-shrink-0">
              <div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${TAG_COLORS[selectedArticle.tag] ?? "bg-gray-800"}`}>
                  {selectedArticle.tag}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{selectedArticle.title}</h3>
                <p className="text-xs text-[#8b949e] mt-0.5">{selectedArticle.cat} · {selectedArticle.time}</p>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <p className="text-[#9ca3af] text-sm italic">{selectedArticle.desc}</p>

              {/* How To section */}
              <div>
                <h4 className="text-xs font-mono text-[#ff8080] uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#8b1a1a]" /> How To
                </h4>
                <ol className="space-y-3">
                  {selectedArticle.howTo.map((s, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-300 leading-relaxed text-sm">
                      <span className="w-6 h-6 rounded-full bg-[#8b1a1a]/25 text-[#ff8080] font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{s.step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* What NOT To Do / Eat section */}
              <div className="border-t border-gray-800 pt-5">
                <h4 className="text-xs font-mono text-orange-400 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-orange-500" /> What NOT To Do / Eat
                </h4>
                <ul className="space-y-2">
                  {selectedArticle.doNot.map((d, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-sm text-orange-300/80 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        ✕
                      </span>
                      <span>{d.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
