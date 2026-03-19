"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Animated counter hook ─────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
}

// ─── Particle Canvas ───────────────────────────────────────────────────────
function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 1.5 + 0.3,
                a: Math.random(),
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(16,185,129,${p.a * 0.6})`;
                ctx.fill();

                // Draw lines between close particles
                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dist = Math.hypot(p.x - q.x, p.y - q.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(16,185,129,${(1 - dist / 120) * 0.12})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-70" />;
}

// ─── Feature Card ──────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay }: {
    icon: string; title: string; desc: string; color: string; delay: string;
}) {
    return (
        <div
            className="group relative p-6 rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl hover:border-emerald-500/30 hover:bg-white/6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/30"
            style={{ animationDelay: delay }}
        >
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="font-heading font-bold text-slate-100 text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
    );
}

// ─── Step Card ─────────────────────────────────────────────────────────────
function StepCard({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: string }) {
    return (
        <div className="flex gap-5 group">
            <div className="flex flex-col items-center gap-2">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-heading font-black text-slate-950 text-base shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                    {num}
                </div>
                <div className="flex-1 w-px bg-gradient-to-b from-emerald-500/40 to-transparent min-h-[2rem]" />
            </div>
            <div className="pb-8">
                <div className="text-2xl mb-2">{icon}</div>
                <h3 className="font-heading font-bold text-slate-100 text-lg mb-1">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

// ─── Stat Counter ──────────────────────────────────────────────────────────
function StatCard({ target, suffix, label, started }: { target: number; suffix: string; label: string; started: boolean }) {
    const count = useCounter(target, 1800, started);
    return (
        <div className="text-center">
            <div className="font-heading font-black text-4xl md:text-5xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {count}{suffix}
            </div>
            <div className="text-slate-400 text-sm mt-2 font-medium">{label}</div>
        </div>
    );
}

// ─── Tech Badge ────────────────────────────────────────────────────────────
function TechBadge({ name, icon, color }: { name: string; icon: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${color} bg-white/3 backdrop-blur-sm hover:scale-105 transition-transform duration-200 cursor-default`}>
            <span>{icon}</span>
            <span className="text-sm font-semibold text-slate-300">{name}</span>
        </div>
    );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────
export default function LandingPage() {
    const [statsVisible, setStatsVisible] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 font-sans overflow-x-hidden">
            <ParticleCanvas />

            {/* ── Ambient blobs ─────────────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-900/20 blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/15 blur-[160px]" />
                <div className="absolute top-[50%] left-[40%] w-[30%] h-[30%] rounded-full bg-violet-900/10 blur-[120px]" />
            </div>

            {/* ── Grid overlay ──────────────────────────────────────── */}
            <div
                className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            {/* ════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════ */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrollY > 50 ? "bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/40" : ""}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-emerald-500/30">
                            C
                        </div>
                        <span className="font-heading font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            CampusBites
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
                        <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
                        <a href="#howitworks" className="hover:text-emerald-400 transition-colors">How It Works</a>
                        <a href="#tech" className="hover:text-emerald-400 transition-colors">Tech Stack</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login"
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link href="/signup"
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:scale-105 transition-transform shadow-lg shadow-emerald-500/25">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
            <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center pt-16">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Smart Canteen Management System
                </div>

                {/* Headline */}
                <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight max-w-5xl mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    The Future of
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Campus Dining
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                    Order food seamlessly, track in real-time, pay digitally —
                    all from your phone. No queues. No confusion. Just food, fast.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-20 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                    <Link href="/login"
                        className="group relative flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold text-slate-950 text-base shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative">🚀 Launch App</span>
                        <svg className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                    <a href="#features"
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm font-semibold text-slate-300 text-base hover:border-white/25 hover:bg-white/10 hover:text-white transition-all duration-200">
                        Explore Features
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </a>
                </div>

                {/* Mockup preview card */}
                <div className="relative w-full max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "0.4s" }}>
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl rounded-3xl" />
                    <div className="relative rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                        {/* Fake browser chrome */}
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/3">
                            <div className="flex gap-1.5">
                                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
                            </div>
                            <div className="flex-1 mx-4 bg-white/5 rounded-lg px-3 py-1 text-xs text-slate-500 font-mono text-center">
                                localhost:3000 · CampusBites
                            </div>
                        </div>
                        {/* App preview */}
                        <div className="p-6 grid grid-cols-3 gap-4">
                            {/* Sidebar */}
                            <div className="col-span-1 space-y-2">
                                <div className="h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center px-3 gap-2">
                                    <span className="text-xs text-emerald-400 font-bold">🍳 Breakfast</span>
                                </div>
                                {["🍚 Rice & Biryani", "🍛 Curries", "🍟 Snacks", "☕ Beverages"].map(c => (
                                    <div key={c} className="h-8 rounded-xl bg-white/3 border border-white/5 flex items-center px-3">
                                        <span className="text-xs text-slate-400 font-medium">{c}</span>
                                    </div>
                                ))}
                                <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/8 p-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-emerald-400 font-bold">Canteen Open</span>
                                    </div>
                                    <span className="text-[9px] text-slate-500">UPI · Card · Cash</span>
                                </div>
                            </div>
                            {/* Menu items */}
                            <div className="col-span-1 space-y-3">
                                {[
                                    { name: "Masala Dosa", price: 35, type: "veg" },
                                    { name: "Chicken Biryani", price: 120, type: "non-veg" },
                                    { name: "Filter Coffee", price: 20, type: "veg" },
                                ].map(item => (
                                    <div key={item.name} className="rounded-xl bg-white/3 border border-white/5 p-3 flex items-center justify-between">
                                        <div>
                                            <div className={`text-[9px] font-bold mb-1 ${item.type === "veg" ? "text-emerald-400" : "text-red-400"}`}>
                                                {item.type === "veg" ? "● VEG" : "● NON-VEG"}
                                            </div>
                                            <div className="text-xs font-semibold text-slate-200">{item.name}</div>
                                            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">₹{item.price}</div>
                                        </div>
                                        <button className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">ADD</button>
                                    </div>
                                ))}
                            </div>
                            {/* Cart & Orders */}
                            <div className="col-span-1 space-y-3">
                                <div className="rounded-xl bg-white/3 border border-white/5 p-3">
                                    <div className="text-xs font-bold text-slate-200 mb-2">🛒 Your Cart</div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Masala Dosa × 2</span><span>₹70</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Filter Coffee × 1</span><span>₹20</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-xs font-bold">
                                        <span className="text-slate-300">Total</span>
                                        <span className="text-emerald-400">₹90</span>
                                    </div>
                                    <button className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-[10px] font-extrabold">
                                        Proceed to Pay 🔒
                                    </button>
                                </div>
                                <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="h-5 w-5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400">#3</span>
                                        <span className="text-[10px] font-bold text-slate-300">Your Order</span>
                                    </div>
                                    <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                                        <span className="animate-ping inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-75" />
                                        ✅ Ready for pickup!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════════════════ */}
            <section ref={statsRef} className="relative z-10 py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl p-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <StatCard target={500} suffix="+" label="Orders Managed" started={statsVisible} />
                            <StatCard target={3} suffix="s" label="Avg. Order Time" started={statsVisible} />
                            <StatCard target={100} suffix="%" label="Cashless Transactions" started={statsVisible} />
                            <StatCard target={99} suffix="%" label="Uptime" started={statsVisible} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════ */}
            <section id="features" className="relative z-10 py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Section header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/8 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-5">
                            ✦ Feature-Rich Platform
                        </div>
                        <h2 className="font-heading font-black text-4xl md:text-5xl text-slate-50 mb-4">
                            Everything the campus
                            <br />
                            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">canteen needs</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Built from the ground up for speed, reliability, and a seamless experience for both students and staff.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FeatureCard
                            icon="🎫"
                            title="Smart Token Numbers"
                            desc="Every order gets a unique auto-incrementing token. Staff call it out, students collect — no confusion."
                            color="bg-emerald-500/15 border border-emerald-500/20"
                            delay="0s"
                        />
                        <FeatureCard
                            icon="⚡"
                            title="Real-Time Updates"
                            desc="Socket.IO-powered live status: Pending → Cooking → Ready. Students get instant push notifications."
                            color="bg-yellow-500/15 border border-yellow-500/20"
                            delay="0.05s"
                        />
                        <FeatureCard
                            icon="💳"
                            title="Multi-Method Payments"
                            desc="UPI QR codes, Razorpay card payments, and cash — all supported with beautiful in-app flows."
                            color="bg-cyan-500/15 border border-cyan-500/20"
                            delay="0.1s"
                        />
                        <FeatureCard
                            icon="🧑‍🍳"
                            title="Live Admin Dashboard"
                            desc="Kitchen staff see all active orders in real-time, update status with one tap, manage the full menu."
                            color="bg-orange-500/15 border border-orange-500/20"
                            delay="0.15s"
                        />
                        <FeatureCard
                            icon="🌿"
                            title="Veg / Non-Veg Filtering"
                            desc="Students can filter the menu by dietary preference, category, or search by dish name instantly."
                            color="bg-green-500/15 border border-green-500/20"
                            delay="0.2s"
                        />
                        <FeatureCard
                            icon="🌗"
                            title="Light & Dark Mode"
                            desc="Premium warm light theme and a sleek dark mode. Persisted across sessions with one click."
                            color="bg-violet-500/15 border border-violet-500/20"
                            delay="0.25s"
                        />
                        <FeatureCard
                            icon="🔔"
                            title="Push Notifications"
                            desc="Native browser push notifications for both admins (new orders) and students (order ready)."
                            color="bg-blue-500/15 border border-blue-500/20"
                            delay="0.3s"
                        />
                        <FeatureCard
                            icon="📊"
                            title="Order History"
                            desc="Students see full order history with token, status, items and totals. Collapsible for a clean UI."
                            color="bg-pink-500/15 border border-pink-500/20"
                            delay="0.35s"
                        />
                        <FeatureCard
                            icon="🔒"
                            title="Canteen Open/Close"
                            desc="Admin can close the canteen with one click — all ordering is blocked instantly across all devices."
                            color="bg-red-500/15 border border-red-500/20"
                            delay="0.4s"
                        />
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════ */}
            <section id="howitworks" className="relative z-10 py-24 px-6 overflow-hidden">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    {/* Left: steps */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
                            ✦ Simple Flow
                        </div>
                        <h2 className="font-heading font-black text-4xl md:text-5xl text-slate-50 mb-10">
                            Order in
                            <br />
                            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">3 steps</span>
                        </h2>
                        <div>
                            <StepCard num="1" icon="🍽️" title="Browse & Add to Cart" desc="Explore the live menu with veg/non-veg filters. Add items to your cart instantly." />
                            <StepCard num="2" icon="💳" title="Pay Your Way" desc="Scan the UPI QR, pay via Razorpay, or settle in cash. All options supported seamlessly." />
                            <StepCard num="3" icon="🎫" title="Collect with Your Token" desc="Get your token number instantly. When it's ready, you'll get notified — then just walk up and collect." />
                        </div>
                    </div>

                    {/* Right: Admin flow */}
                    <div className="space-y-5">
                        <div className="rounded-3xl border border-white/8 bg-white/3 backdrop-blur-xl p-6 hover:border-emerald-500/20 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-xl">🧑‍💻</div>
                                <div>
                                    <div className="font-bold text-slate-100 text-sm">Admin Portal</div>
                                    <div className="text-[11px] text-slate-500">Real-time kitchen management</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: "New Order #4 — Chicken Biryani × 1", color: "bg-yellow-500", status: "Pending" },
                                    { label: "Order #3 — Masala Dosa × 2", color: "bg-orange-500", status: "Cooking" },
                                    { label: "Order #2 — Filter Coffee × 1", color: "bg-emerald-500", status: "Ready ✅" },
                                ].map(o => (
                                    <div key={o.label} className="flex items-center justify-between bg-white/3 rounded-xl px-4 py-3 border border-white/5">
                                        <span className="text-xs text-slate-300 truncate">{o.label}</span>
                                        <span className={`ml-3 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-950 ${o.color}`}>{o.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-cyan-500/15 bg-cyan-500/5 backdrop-blur-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-xl">📱</div>
                                <div>
                                    <div className="font-bold text-slate-100 text-sm">Student App</div>
                                    <div className="text-[11px] text-slate-500">Instant order tracking</div>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center gap-3">
                                <span className="text-2xl">🎉</span>
                                <div>
                                    <div className="text-sm font-bold text-emerald-300">Order Ready for Pickup!</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Your token <span className="text-emerald-400 font-bold">#3</span> is ready at the counter</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
          TECH STACK
      ════════════════════════════════════════════════════════ */}
            <section id="tech" className="relative z-10 py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/8 text-violet-400 text-xs font-bold uppercase tracking-widest mb-6">
                        ✦ Built With
                    </div>
                    <h2 className="font-heading font-black text-4xl md:text-5xl text-slate-50 mb-12">
                        Modern
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> Tech Stack</span>
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        <TechBadge name="Next.js 15" icon="▲" color="border-white/15 text-slate-300" />
                        <TechBadge name="TypeScript" icon="🔷" color="border-blue-500/25 text-blue-300" />
                        <TechBadge name="Tailwind CSS" icon="🎨" color="border-cyan-500/25 text-cyan-300" />
                        <TechBadge name="Node.js" icon="🟢" color="border-green-500/25 text-green-300" />
                        <TechBadge name="Express.js" icon="⚡" color="border-slate-500/25 text-slate-300" />
                        <TechBadge name="MongoDB" icon="🍃" color="border-emerald-500/25 text-emerald-300" />
                        <TechBadge name="Socket.IO" icon="🔌" color="border-violet-500/25 text-violet-300" />
                        <TechBadge name="Razorpay" icon="💳" color="border-blue-500/25 text-blue-300" />
                        <TechBadge name="Mongoose" icon="🔵" color="border-red-500/25 text-red-300" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                        {[
                            { title: "Frontend", desc: "Next.js App Router with TypeScript, Tailwind CSS v4, Socket.IO client, and Razorpay SDK.", icon: "🖥️" },
                            { title: "Backend", desc: "Express.js REST API, Mongoose ODM on MongoDB Atlas, Socket.IO server, JWT auth.", icon: "⚙️" },
                            { title: "Real-Time", desc: "Bidirectional Socket.IO events for live order updates, canteen status, and push notifications.", icon: "📡" },
                        ].map(b => (
                            <div key={b.title} className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-5 hover:border-white/15 transition-colors">
                                <div className="text-2xl mb-3">{b.icon}</div>
                                <div className="font-bold text-slate-100 text-base mb-2">{b.title}</div>
                                <div className="text-slate-400 text-sm leading-relaxed">{b.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════════════ */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="relative rounded-[2.5rem] border border-white/8 bg-white/3 backdrop-blur-xl p-14 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-cyan-500/8" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                        <div className="relative">
                            <div className="text-5xl mb-5">🚀</div>
                            <h2 className="font-heading font-black text-4xl md:text-5xl text-slate-50 mb-4">
                                Ready to experience
                                <br />
                                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CampusBites?</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                                Join hundreds of students and staff already using the smarter way to manage campus dining.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link href="/signup"
                                    className="group relative flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold text-slate-950 text-base shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] transition-all duration-200 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative">Create Account</span>
                                    <svg className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Link>
                                <Link href="/admin"
                                    className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 font-semibold text-slate-300 text-base hover:border-white/25 hover:bg-white/10 transition-all duration-200">
                                    Admin Portal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
            <footer className="relative z-10 border-t border-white/5 py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xs">C</div>
                        <span className="font-heading font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CampusBites</span>
                    </div>
                    <div className="text-sm text-slate-600">
                        Built with ❤️ for campus life · Smart Canteen Management System
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                        <Link href="/login" className="hover:text-emerald-400 transition-colors">Student Login</Link>
                        <Link href="/admin" className="hover:text-emerald-400 transition-colors">Admin</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
