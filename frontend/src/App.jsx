import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import translations from "./translations.js"
import {
  Download,
  Landmark,
  Moon,
  Sun,
  Sparkles,
  Search,
  MessageCircle,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  Tractor,
  GraduationCap,
  HardHat,
  Briefcase,
  Store,
  UserX,
  Users,
  Loader2,
  IndianRupee,
  MapPin,
  Building2,
  Layers,
  Mic,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const API_BASE = "https://yojanasathi-api.onrender.com"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

const CASTES = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
]

const OCCUPATIONS = [
  { value: "farmer", label: "Farmer", Icon: Tractor },
  { value: "student", label: "Student", Icon: GraduationCap },
  { value: "labor", label: "Labor", Icon: HardHat },
  { value: "entrepreneur", label: "Entrepreneur", Icon: Briefcase },
  { value: "self-employed", label: "Self-Employed", Icon: Store },
  { value: "unemployed", label: "Unemployed", Icon: UserX },
  { value: "any", label: "Any", Icon: Users },
]

/* ---------- Demo fallback data (used if backend unreachable) ---------- */
const DEMO_SCHEMES = [
  {
    id: 1,
    title: "PM-KISAN Samman Nidhi",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    state: null,
    type: "central",
    eligible: true,
    description:
      "Income support of ₹6,000 per year in three equal installments to all landholding farmer families to supplement their financial needs for agriculture and allied activities.",
    benefits: "₹6,000/year direct benefit transfer",
    reasons: ["Occupation: Farmer", "Income below threshold", "Indian citizen"],
    documents: ["Aadhaar Card", "Land Records", "Bank Account Passbook"],
    url: "https://pmkisan.gov.in",
  },
  {
    id: 2,
    title: "Pradhan Mantri Fasal Bima Yojana",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    state: null,
    type: "central",
    eligible: true,
    description:
      "Comprehensive crop insurance scheme providing financial support to farmers suffering crop loss/damage arising out of unforeseen events.",
    benefits: "Up to ₹2,0,000 crop insurance cover",
    reasons: ["Occupation: Farmer", "Cultivating notified crops"],
    documents: ["Aadhaar Card", "Land Records", "Sowing Certificate"],
    url: "https://pmfby.gov.in",
  },
  {
    id: 3,
    title: "Mahatma Phule Krishi Samman",
    ministry: "Department of Agriculture",
    state: "Maharashtra",
    type: "state",
    eligible: false,
    description:
      "State-level farm loan waiver and support scheme for distressed farmers in Maharashtra with outstanding crop loans.",
    benefits: "Loan waiver up to ₹2,0,000",
    reasons: ["State scheme — domicile check required", "Occupation: Farmer"],
    documents: ["Domicile Certificate", "Loan Documents", "Aadhaar Card"],
    url: "https://krishi.maharashtra.gov.in",
  },
  {
    id: 4,
    title: "National Scheduled Caste Scholarship",
    ministry: "Ministry of Social Justice & Empowerment",
    state: null,
    type: "central",
    eligible: true,
    description:
      "Financial assistance to SC students to pursue higher education, covering tuition fees and maintenance allowance.",
    benefits: "Full tuition + ₹13,500 maintenance/year",
    reasons: ["Caste: SC", "Family income within limit"],
    documents: ["Caste Certificate", "Income Certificate", "Marksheet"],
    url: "https://scholarships.gov.in",
  },
]

/* =================================================================== */
/* Reusable bits                                                      */
/* =================================================================== */

function useInView(options) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        obs.disconnect()
      }
    }, options || { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function CountUp({ end, duration = 1500, suffix = "" }) {
  const [ref, inView] = useInView()
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = null
    let raf
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * end))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, end, duration])
  return (
    <span ref={ref}>
      {val.toLocaleString("en-IN")}
      {suffix}
    </span>
  )
}

/* =================================================================== */
/* Navbar                                                             */
/* =================================================================== */

function Navbar({ dark, toggleDark, lang, setLang, user, setShowAuth, setAuthMode, onLogout }) {
  const t = translations[lang] || translations.en
  const links = [
    { label: t.home, id: "hero" },
    { label: t.categoriesNav, id: "categories" },
    { label: t.findSchemesNav, id: "form" },
    { label: t.about, id: "stats" },
  ]
  const langs = ["EN", "हिं", "मर"]
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => scrollTo("hero")}
          className="flex items-center gap-2 font-bold text-lg"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <Landmark size={20} />
          </span>
          <span>
            {t.appName}
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)]">
                <span className="inline-flex h-2 w-2 rounded-full bg-violet-600" />
                {user.name || user.email}
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthMode("login")
                  setShowAuth(true)
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setAuthMode("register")
                  setShowAuth(true)
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                Register
              </button>
            </div>
          )}
          <div className="hidden sm:flex items-center glass rounded-lg p-0.5">
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l === "EN" ? "en" : l === "हिं" ? "hi" : "mr")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  lang === (l === "EN" ? "en" : l === "हिं" ? "hi" : "mr")
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={toggleDark}
            aria-label={t.toggleDarkMode}
            className="grid place-items-center w-10 h-10 rounded-lg glass hover:text-[var(--primary)] transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  )
}

/* =================================================================== */
/* Hero                                                               */
/* =================================================================== */

function Hero({ lang }) {
  const t = translations[lang] || translations.en
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{
        background:
          "radial-gradient(ellipse at center, #2D1B69 0%, #13102A 70%), linear-gradient(180deg, #13102A 0%, #13102A 100%)",
      }}
    >
      <div className="aurora">
        <span className="a1" />
        <span className="a2" />
        <span className="a3" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-20">
        <div
          className="fade-up inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-[var(--muted)] mb-8"
          style={{ animationDelay: "0.05s" }}
        >
          <Sparkles size={15} className="text-[var(--primary)]" />
          {t.subtitle}
        </div>

        <h1
          className="fade-up text-4xl sm:text-6xl font-bold tracking-tight text-balance leading-[1.1]"
          style={{ animationDelay: "0.15s" }}
        >
          {t.tagline}
        </h1>

        <p
          className="fade-up mt-6 text-lg text-[var(--muted)] max-w-2xl mx-auto text-pretty leading-relaxed"
          style={{ animationDelay: "0.25s" }}
        >
          {t.subtitle}
        </p>

        <div
          className="fade-up mt-9 flex flex-col sm:flex-row gap-3 justify-center"
          style={{ animationDelay: "0.35s" }}
        >
          <button
            onClick={() => scrollTo("form")}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-dark)] transition-all hover:scale-[1.03] shadow-lg shadow-[var(--primary)]/25"
          >
            <Search size={18} />
            {t.checkEligibility}
          </button>
          <button
            onClick={() => window.dispatchEvent(new Event("open-chat"))}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl glass font-semibold hover:text-[var(--primary)] transition-all hover:scale-[1.03]"
          >
            <MessageCircle size={18} />
            {t.askAssistant}
          </button>
        </div>

        <div
          className="fade-up mt-12 inline-flex items-center gap-3 glass rounded-2xl px-6 py-4"
          style={{ animationDelay: "0.45s" }}
        >
          <span className="text-3xl font-bold text-[var(--primary)]">
            <CountUp end={3000} suffix="+" />
          </span>
          <span className="text-sm text-[var(--muted)] text-left leading-tight">
            {t.schemesAcross}
          </span>
        </div>
      </div>
    </section>
  )
}

/* =================================================================== */
/* Categories Section                                                 */
/* =================================================================== */

function CategoriesSection({ lang, setAge, setGender, setCaste, setOccupation }) {
  const t = translations[lang] || translations.en
  const categories = [
    { name: t.agriculture, icon: "🌾", count: "35", action: () => setOccupation("farmer") },
    { name: t.health, icon: "🏥", count: "28", action: () => setOccupation("any") },
    { name: t.education, icon: "🎓", count: "42", action: () => setOccupation("student") },
    { name: t.women, icon: "👩", count: "25", action: () => setGender("female") },
    { name: t.housing, icon: "🏠", count: "18", action: () => setOccupation("any") },
    { name: t.business, icon: "💼", count: "22", action: () => setOccupation("entrepreneur") },
    { name: t.scst, icon: "⚡", count: "20", action: () => setCaste("sc") },
    { name: t.skills, icon: "👷", count: "15", action: () => setOccupation("labor") },
    { name: t.pension, icon: "🧓", count: "12", action: () => setAge(65) },
  ]

  const handleCategoryClick = (action) => {
    action()
    document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="categories" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance">
            {t.categoriesTitle}
          </h2>
        </div>

        {/* 3 Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="glass backdrop-blur-md bg-slate-950/40 rounded-2xl p-6 text-center border border-white/5 shadow-inner">
            <p className="text-4xl font-extrabold text-white mb-1">217+</p>
            <p className="text-xs text-[var(--muted)] tracking-wider uppercase font-medium">{t.totalSchemes}</p>
          </div>
          <div className="glass backdrop-blur-md bg-slate-950/40 rounded-2xl p-6 text-center border border-white/5 shadow-inner">
            <p className="text-4xl font-extrabold text-[var(--primary)] mb-1">150+</p>
            <p className="text-xs text-[var(--muted)] tracking-wider uppercase font-medium">{t.centralSchemes}</p>
          </div>
          <div className="glass backdrop-blur-md bg-slate-950/40 rounded-2xl p-6 text-center border border-white/5 shadow-inner">
            <p className="text-4xl font-extrabold text-violet-400 mb-1">67+</p>
            <p className="text-xs text-[var(--muted)] tracking-wider uppercase font-medium">{t.stateSchemes}</p>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => handleCategoryClick(cat.action)}
              className="glass rounded-2xl p-6 text-left border border-white/5 bg-slate-900/20 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.25)] transition-all duration-300 flex items-center gap-4 group"
            >
              <span className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </span>
              <div>
                <h4 className="font-bold text-base text-white group-hover:text-[var(--primary)] transition-colors">
                  {cat.name}
                </h4>
                <p className="text-xs text-[var(--muted)] mt-1">{cat.count} {t.schemesUnit}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =================================================================== */
/* Searchable state dropdown                                          */
/* =================================================================== */

function StateSelect({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="focus-glow w-full flex items-center justify-between gap-2 rounded-xl glass px-4 py-3 text-left transition-colors"
      >
        <span className={value ? "" : "text-[var(--muted)]"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full glass rounded-xl p-2 shadow-2xl">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1 rounded-lg bg-[var(--surface)]">
            <Search size={15} className="text-[var(--muted)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchStates}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <div className="max-h-56 overflow-y-auto thin-scroll">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-[var(--muted)]">{t.noMatch}</p>
            )}
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s)
                  setOpen(false)
                  setQuery("")
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--primary)]/15 ${
                  value === s ? "text-[var(--primary)] font-medium" : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* =================================================================== */
/* Profile Form                                                       */
/* =================================================================== */

function ProfileForm({
  lang,
  onResults,
  loading,
  setLoading,
  setError,
  age,
  setAge,
  gender,
  setGender,
  caste,
  setCaste,
  income,
  setIncome,
  occupation,
  setOccupation,
  state,
  setState,
  domicileYears,
  setDomicileYears,
  homeState,
  setHomeState,
}) {
  const t = translations[lang] || translations.en
  const submit = async (e) => {
    e.preventDefault()
    if (!state) {
      setError(t.selectCurrentStateError)
      return
    }
    setError("")
    setLoading(true)
    const payload = {
      age: Number(age),
      gender,
      caste,
      income: Number(income),
      occupation,
      domicile_state: state,
      domicile_years: Number(domicileYears),
      home_state: homeState || state,
    }
    try {
      const res = await axios.post(`${API_BASE}/match`, payload, {
        timeout: 12000,
      })
      onResults(res.data, false, payload)
    } catch (err) {
      console.log("[v0] /match request failed:", err.message)
      // Graceful fallback to demo data so the UI remains usable in preview.
      onResults(
        { total: DEMO_SCHEMES.length, schemes: DEMO_SCHEMES },
        true,
        payload,
      )
      setError(t.matchBackendFallback)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="form" className="relative py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance">{t.formTitle}</h2>
          <p className="mt-3 text-[var(--muted)]">{t.formSubtitle}</p>
        </div>

        <form onSubmit={submit} className="glass rounded-3xl p-6 sm:p-9 space-y-7">
          {/* Age + Years grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label={t.age}>
              <input
                type="number"
                min={0}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="focus-glow w-full rounded-xl glass px-4 py-3 outline-none"
              />
            </Field>
            <Field label={t.yearsInState}>
              <input
                type="number"
                min={0}
                max={120}
                value={domicileYears}
                onChange={(e) => setDomicileYears(e.target.value)}
                className="focus-glow w-full rounded-xl glass px-4 py-3 outline-none"
              />
            </Field>
          </div>

          {/* Gender */}
          <Field label={t.gender}>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              {["male", "female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`capitalize rounded-xl px-4 py-3 font-medium transition-all ${
                    gender === g
                      ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25"
                      : "glass hover:text-[var(--primary)]"
                  }`}
                >
                  {g === "male" ? t.male : t.female}
                </button>
              ))}
            </div>
          </Field>

          {/* Caste */}
          <Field label={t.caste}>
            <div className="flex flex-wrap gap-2.5">
              {CASTES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCaste(c.value)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    caste === c.value
                      ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25"
                      : "glass hover:text-[var(--primary)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Income */}
          <Field label={t.income}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <input
                type="range"
                min={0}
                max={1000000}
                step={5000}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="flex-1"
              />
              <div className="focus-glow flex items-center gap-1 rounded-xl glass px-3 py-2 sm:w-48">
                <IndianRupee size={16} className="text-[var(--muted)]" />
                <input
                  type="number"
                  min={0}
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              ₹{Number(income).toLocaleString("en-IN")} per year
            </p>
          </Field>

          {/* Occupation icon grid */}
          <Field label={t.occupation}>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {OCCUPATIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOccupation(value)}
                  className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-xs font-medium transition-all ${
                    occupation === value
                      ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25 scale-105"
                      : "glass hover:text-[var(--primary)]"
                  }`}
                >
                  <Icon size={22} />
                  {value === "farmer"
                    ? t.farmer
                    : value === "student"
                      ? t.student
                      : value === "labor"
                        ? t.labor
                        : value === "entrepreneur"
                          ? t.entrepreneur
                          : value === "self-employed"
                            ? t.selfEmployed
                            : value === "unemployed"
                              ? t.unemployed
                              : t.any}
                </button>
              ))}
            </div>
          </Field>

          {/* States */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label={t.currentState}>
              <StateSelect
                value={state}
                onChange={setState}
                placeholder={t.selectState}
              />
            </Field>
            <Field label={t.homeState}>
              <StateSelect
                value={homeState}
                onChange={setHomeState}
                placeholder={t.selectHomeState}
              />
            </Field>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-white font-semibold py-4 text-lg transition-all hover:bg-[var(--primary-dark)] disabled:opacity-80 ${
              loading ? "pulse-glow" : "hover:scale-[1.01]"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t.finding}
              </>
            ) : (
              <>
                <Sparkles size={20} />
                {t.findSchemes}
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--muted)] mb-2.5">
        {label}
      </label>
      {children}
    </div>
  )
}

/* =================================================================== */
/* Results                                                            */
/* =================================================================== */

function SchemeCard({ scheme, index, t }) {
  const [expanded, setExpanded] = useState(false)
  const eligible = scheme.eligible
  const isCentral = scheme.type === "central" || !scheme.state

  return (
    <article
      className="fade-up glass rounded-2xl p-6 flex flex-col"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            eligible
              ? "bg-[var(--primary)]/15 text-[var(--primary)]"
              : "bg-[var(--amber)]/15 text-[var(--amber)]"
          }`}
        >
          {eligible ? (
            <>
              <CheckCircle2 size={13} /> {t.fullyEligible}
            </>
          ) : (
            <>
              <AlertTriangle size={13} /> {t.checkDomicile}
            </>
          )}
        </span>
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
            isCentral
              ? "bg-sky-500/15 text-sky-400"
              : "bg-violet-500/15 text-violet-400"
          }`}
        >
          {isCentral ? t.central : t.state}
        </span>
      </div>

      <h3 className="text-lg font-bold leading-snug">{scheme.title}</h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
        {scheme.ministry && (
          <span className="inline-flex items-center gap-1">
            <Building2 size={12} /> {scheme.ministry}
          </span>
        )}
        {scheme.state && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {scheme.state}
          </span>
        )}
      </div>

      {scheme.description && (
        <div className="mt-3">
          <p
            className={`text-sm text-[var(--muted)] leading-relaxed ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {scheme.description}
          </p>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]"
          >
            {expanded ? (
              <>
                {t.showLess} <ChevronUp size={13} />
              </>
            ) : (
              <>
                {t.readMore} <ChevronDown size={13} />
              </>
            )}
          </button>
        </div>
      )}

      {scheme.benefits && (
        <div className="mt-3 rounded-xl bg-[var(--primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--primary)]">
          {scheme.benefits}
        </div>
      )}

      {scheme.reasons?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {scheme.reasons.map((r, i) => (
            <span
              key={i}
              className="rounded-full bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-1 text-[11px] font-medium"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {scheme.documents?.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] mb-1.5">
            <FileText size={13} /> {t.documentsNeeded}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
            {scheme.documents.map((d, i) => (
              <li key={i} className="list-disc list-inside">
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={scheme.scheme_url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-white font-semibold py-2.5 transition-all hover:bg-[var(--primary-dark)] hover:gap-3"
      >
        {t.applyNow}
      </a>
    </article>
  )
}

function Results({ lang, data, isDemo, onDownload, pdfLoading }) {
  const t = translations[lang] || translations.en
  const [filter, setFilter] = useState("all")
  const schemes = data?.schemes || []

  const filtered = schemes.filter((s) => {
    const isCentral = s.type === "central" || !s.state
    if (filter === "all") return true
    if (filter === "central") return isCentral
    if (filter === "state") return !isCentral
    if (filter === "partial") return !s.eligible
    return true
  })

  const filters = [
    { value: "all", label: t.allFilters },
    { value: "central", label: t.central },
    { value: "state", label: t.state },
    { value: "partial", label: t.partial },
  ]

  return (
    <section id="results" className="py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t.found}{" "}
              <span className="text-[var(--primary)]">{schemes.length}</span>{" "}
              {t.resultsTitle}
            </h2>
            {isDemo && (
              <p className="mt-1 text-sm text-[var(--amber)]">
                {t.demoNotice}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === f.value
                    ? "bg-[var(--primary)] text-white"
                    : "glass hover:text-[var(--primary)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-3xl py-20 text-center">
            <div className="grid place-items-center w-16 h-16 rounded-2xl bg-[var(--surface)] mx-auto mb-4">
              <Search size={28} className="text-[var(--muted)]" />
            </div>
            <h3 className="text-xl font-bold">{t.noSchemes}</h3>
            <p className="mt-2 text-[var(--muted)]">{t.noSchemesSubtitle}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s, i) => (
              <SchemeCard key={s.id || i} scheme={s} index={i} t={t} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <button
            onClick={onDownload}
            disabled={pdfLoading}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 rounded-xl bg-violet-700 text-white font-semibold py-3.5 text-lg transition-all hover:bg-violet-700 disabled:opacity-70"
          >
            {pdfLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t.generatingPdf}
              </>
            ) : (
              <>
                <Download size={20} />
                {t.downloadPdf}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

/* =================================================================== */
/* Stats Dashboard                                                    */
/* =================================================================== */

function StatCard({ icon: Icon, label, value, delay }) {
  return (
    <div
      className="fade-up glass rounded-2xl p-6"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="grid place-items-center w-11 h-11 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] mb-4">
        <Icon size={22} />
      </div>
      <p className="text-3xl font-bold">
        <CountUp end={value} />
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
    </div>
  )
}

function StatsDashboard({ lang }) {
  const t = translations[lang] || translations.en
  const categoryData = [
    { name: "Agriculture", value: 620 },
    { name: "Education", value: 540 },
    { name: "Health", value: 410 },
    { name: "Employment", value: 380 },
    { name: "Housing", value: 290 },
    { name: "Social", value: 760 },
  ]
  const [ref, inView] = useInView({ threshold: 0.2 })

  return (
    <section id="stats" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance">
            {t.statsTitle}
          </h2>
          <p className="mt-3 text-[var(--muted)]">{t.statsSubtitle}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
          <StatCard icon={Layers} label={t.totalSchemes} value={3000} delay={0} />
          <StatCard icon={Landmark} label={t.centralSchemes} value={740} delay={0.1} />
          <StatCard icon={Building2} label={t.stateSchemes} value={2260} delay={0.2} />
          <StatCard icon={Layers} label={t.categoriesCovered} value={28} delay={0.3} />
        </div>

        <div ref={ref} className="glass rounded-3xl p-5 sm:p-8">
          <h3 className="font-semibold mb-6">{t.schemesByCategory}</h3>
          <div className="h-72">
            {inView && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(16,185,129,0.08)" }}
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--surface-border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill="#7C3AED" fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* =================================================================== */
/* AI Chatbot                                                         */
/* =================================================================== */

function Chatbot({ lang }) {
  const t = translations[lang] || translations.en
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: t.chatGreeting,
    },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Please use Chrome browser for voice input.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setRecording(true)

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }
      
      setInput(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Speech error:', event.error)
      }
      setRecording(false)
    }

    recognition.onend = () => {
      // Restart if still recording (handles Chrome auto-stop)
      if (recording) {
        try { recognition.start() } catch(e) {}
      }
    }

    recognition.start()
    setMediaRecorder(recognition)
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setRecording(false)
    }
  }

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("open-chat", handler)
    return () => window.removeEventListener("open-chat", handler)
  }, [])

  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text:
          lang === "hi"
            ? "नमस्ते! 🙏 मैं आपका योजना सहायक हूं। मुझसे पूछें जैसे 'मैं महाराष्ट्र में 40 साल का किसान हूं, मुझे कौन सी योजनाएं मिल सकती हैं?'"
            : lang === "mr"
              ? "नमस्ते! 🙏 मी तुमचा योजना सहाय्यक आहे. मला विचारा जसे 'मी महाराष्ट्रातील ४० वर्षांचा शेतकरी आहे, मला कोणत्या योजना मिळू शकतात?'"
              : "Namaste! 🙏 I'm your YojanaSaathi assistant. Ask me anything like 'I am a 40 year old farmer in Maharashtra, what schemes can I get?'",
      },
    ])
  }, [lang])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" })
  }, [messages, typing])

  const parseSchemeReply = (text) => {
    if (
      !text.includes("Based on your query") &&
      !text.includes("आपके प्रश्न") &&
      !text.includes("तुमच्या प्रश्नावर")
    ) {
      return null
    }

    const lines = text.split("\n").filter((l) => l.trim())
    const schemes = []
    let current = null

    lines.forEach((line) => {
      const match = line.match(/^\d+\.\s+(.+)/)
      if (match) {
        if (current) schemes.push(current)
        current = { title: match[1], benefits: "" }
      } else if (
        line.includes("Benefits:") ||
        line.includes("फ़ायदे:") ||
        line.includes("फायदे:") ||
        line.includes("लाभ:")
      ) {
        if (current) {
          current.benefits = line
            .replace(/^.*?(Benefits:|फ़ायदे:|फायदे:|लाभ:)/, "")
            .trim()
        }
      }
    })

    if (current) schemes.push(current)
    return schemes.length > 0 ? schemes : null
  }

  const getFollowUpLine = (text) => {
    const lines = text.split("\n").filter((l) => l.trim())
    return lines[lines.length - 1] || ""
  }

  const send = async () => {
    const text = input.trim()
    if (!text || typing) return
    setMessages((m) => [...m, { role: "user", text }])
    setInput("")
    setTyping(true)
    try {
      const res = await axios.post(
        `${API_BASE}/chat`,
        { message: text, lang: lang },
        { timeout: 60000 },
      )
      setMessages((m) => [
        ...m,
        { role: "ai", text: res.data?.reply || "I couldn't find an answer." },
      ])
    } catch (err) {
      console.log("[v0] /chat request failed:", err.message)
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "I couldn't reach the AI service at https://yojanasathi-api.onrender.com right now. Please make sure the backend is running and try again.",
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.openAssistant}
        className="fixed bottom-6 right-6 z-50 grid place-items-center w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/40 hover:bg-[var(--primary-dark)] transition-all hover:scale-110"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="slide-in-right fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[34rem] max-h-[75vh] glass rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          <header className="flex items-center gap-3 px-5 py-4 border-b">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-semibold leading-tight">{t.chatTitle}</p>
              <p className="text-xs text-[var(--primary)]">● {t.online}</p>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto thin-scroll px-4 py-4 space-y-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "ai" && parseSchemeReply(m.text) ? (
                  <div className="max-w-[80%] space-y-2">
                    <div className="glass rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
                      <p className="font-medium">Here are the matching schemes:</p>
                      <div className="mt-2 space-y-2">
                        {parseSchemeReply(m.text).map((scheme, schemeIndex) => (
                          <div
                            key={schemeIndex}
                            className="bg-slate-800/50 rounded-lg p-3 border border-violet-500/20"
                          >
                            <p className="font-bold text-white">{scheme.title}</p>
                            {scheme.benefits && (
                              <p className="mt-1 text-xs text-violet-300">
                                {scheme.benefits}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted)] px-1">
                      {getFollowUpLine(m.text)}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[var(--primary)] text-white rounded-br-sm"
                        : "glass rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="dot w-2 h-2 rounded-full bg-[var(--muted)]" />
                  <span className="dot w-2 h-2 rounded-full bg-[var(--muted)]" />
                  <span className="dot w-2 h-2 rounded-full bg-[var(--muted)]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t">
            <div className="focus-glow flex items-center gap-2 rounded-xl glass px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t.chatPlaceholder}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`p-2 rounded-lg transition ${
                  recording 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-violet-600 hover:bg-violet-700'
                }`}
                title={recording ? t.voiceStop : t.voiceStart}
              >
                {recording ? (
                  <span className="text-white text-xs font-medium px-1.5">{t.voiceStop}</span>
                ) : (
                  <Mic size={18} className="text-white" />
                )}
              </button>
              <button
                onClick={send}
                disabled={typing || !input.trim()}
                aria-label={t.sendMessage}
                className="grid place-items-center w-9 h-9 rounded-lg bg-[var(--primary)] text-white disabled:opacity-40 hover:bg-[var(--primary-dark)] transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* =================================================================== */
/* Root App                                                           */
/* =================================================================== */

export default function App() {
  const [dark, setDark] = useState(true)
  const [lang, setLang] = useState("en")
  const t = translations[lang] || translations.en
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState("login") // login or register
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token")
    const name = localStorage.getItem("name")
    if (token && name) return { token, name }
    return null
  })
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" })
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  /* Lifted Eligibility Checker fields to support smart category filtering */
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [caste, setCaste] = useState("general")
  const [income, setIncome] = useState(150000)
  const [occupation, setOccupation] = useState("farmer")
  const [state, setState] = useState("")
  const [domicileYears, setDomicileYears] = useState(5)
  const [homeState, setHomeState] = useState("")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#0D0D1A" : "#f1f5f9")
  }, [dark])

  const handleResults = useCallback((data, demo, profile) => {
    setResults(data)
    setIsDemo(demo)
    setProfileData(profile)
    setTimeout(
      () =>
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth" }),
      120,
    )
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError("")

    if (authMode === "register") {
      if (!authForm.name.trim() || !authForm.email.trim() || !authForm.password.trim()) {
        setAuthError(t.fillAllFields)
        return
      }
    } else if (authMode === "login") {
      if (!authForm.email.trim() || !authForm.password.trim()) {
        setAuthError(t.enterEmailPassword)
        return
      }
    }

    if (!authForm.email.includes("@") || !authForm.email.includes(".")) {
      setAuthError(t.validEmail)
      return
    }

    if (authForm.password.length < 6) {
      setAuthError(t.passwordLength)
      return
    }

    setAuthLoading(true)
    try {
      const endpoint = authMode === "login" ? "/login" : "/register"
      const res = await axios.post(`${API_BASE}${endpoint}`, authForm, {
        timeout: 12000,
      })
      const data = res.data || {}

      if (res.data && res.data.success) {
        // try common token/name shapes from various backends
        const token = data.token || data.access_token || data?.user?.token
        const name = data.name || data.user?.name || authForm.name || authForm.email

        if (token) localStorage.setItem("token", token)
        if (name) localStorage.setItem("name", name)

        if (token || name) {
          setUser({ token, name })
        } else {
          // fallback to minimal user info
          setUser({ name: authForm.name || authForm.email })
        }

        setShowAuth(false)
        setAuthForm({ name: "", email: "", password: "" })
      } else {
        setAuthError(data.message || data.detail || t.authFailed)
      }
    } catch (err) {
      setAuthError(
        err.response?.data?.detail || err.response?.data?.message || err.message ||
          t.authBackendError(authMode),
      )
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("name")
    setUser(null)
    setResults(null)
    setProfileData(null)
    setIsDemo(false)
    setError("")
    setAuthForm({ name: "", email: "", password: "" })
  }

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true)
      const form = profileData
      const res = await axios.post(
        `${API_BASE}/export-pdf`,
        {
          age: parseInt(form.age),
          gender: form.gender,
          caste: form.caste,
          income: parseInt(form.income),
          occupation: form.occupation,
          domicile_state: form.domicile_state,
          domicile_years: parseInt(form.domicile_years)
        },
        { responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'my_schemes.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert(t.pdfError)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar
        dark={dark}
        toggleDark={() => setDark((d) => !d)}
        lang={lang}
        setLang={setLang}
        user={user}
        setShowAuth={setShowAuth}
        setAuthMode={setAuthMode}
        onLogout={handleLogout}
      />

      <Hero lang={lang} />

      {/* Inserted Categories Section */}
      <CategoriesSection 
        lang={lang}
        setAge={setAge}
        setGender={setGender}
        setCaste={setCaste}
        setOccupation={setOccupation}
      />

      <ProfileForm
        lang={lang}
        onResults={handleResults}
        loading={loading}
        setLoading={setLoading}
        setError={setError}
        age={age}
        setAge={setAge}
        gender={gender}
        setGender={setGender}
        caste={caste}
        setCaste={setCaste}
        income={income}
        setIncome={setIncome}
        occupation={occupation}
        setOccupation={setOccupation}
        state={state}
        setState={setState}
        domicileYears={domicileYears}
        setDomicileYears={setDomicileYears}
        homeState={homeState}
        setHomeState={setHomeState}
      />

      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 mb-4">
          <div className="glass rounded-xl px-4 py-3 text-sm text-[var(--amber)] flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        </div>
      )}

      {results && (
        <Results
          lang={lang}
          data={results}
          isDemo={isDemo}
          onDownload={handleDownloadPdf}
          pdfLoading={pdfLoading}
        />
      )}

      <StatsDashboard lang={lang} />

      <footer className="border-t py-8 px-4 text-center text-sm text-[var(--muted)]">
        <p className="flex items-center justify-center gap-2">
          <Landmark size={16} className="text-[var(--primary)]" />
          {t.footer}
        </p>
      </footer>

      <Chatbot lang={lang} />

      {showAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-md px-4">
          <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--primary)] mb-2">
                  {authMode === "login" ? t.loginTitle : t.registerTitle}
                </p>
                <h3 className="text-2xl font-bold">
                  {authMode === "login" ? t.login : t.register}
                </h3>
              </div>
              <button
                onClick={() => setShowAuth(false)}
                className="grid place-items-center w-10 h-10 rounded-full glass hover:text-[var(--primary)] transition-colors"
                aria-label="Close auth modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "register" && (
                <Field label={t.name}>
                  <input
                    value={authForm.name}
                    onChange={(e) =>
                      setAuthForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="focus-glow w-full rounded-xl glass px-4 py-3 outline-none"
                    placeholder={t.namePlaceholder}
                  />
                </Field>
              )}
              <Field label={t.email}>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="focus-glow w-full rounded-xl glass px-4 py-3 outline-none"
                  placeholder={t.emailPlaceholder}
                />
              </Field>
              <Field label={t.password}>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="focus-glow w-full rounded-xl glass px-4 py-3 outline-none"
                  placeholder={t.passwordPlaceholder}
                />
              </Field>

              {authError && (
                <div className="rounded-xl bg-violet-600/10 px-4 py-3 text-sm text-violet-300 border border-violet-600/20">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-[var(--primary)] text-white font-semibold py-3.5 transition-all hover:bg-[var(--primary-dark)] disabled:opacity-80"
              >
                {authLoading
                  ? t.pleaseWait
                  : authMode === "login"
                    ? t.login
                    : t.register}
              </button>

              <button
                type="button"
                onClick={() =>
                  setAuthMode((mode) => (mode === "login" ? "register" : "login"))
                }
                className="w-full text-sm font-medium text-[var(--primary)] hover:underline"
              >
                {authMode === "login"
                  ? t.needAccount
                  : t.haveAccount}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}