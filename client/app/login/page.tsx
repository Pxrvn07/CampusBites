"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AUTH_API } from "../config";

export default function LoginPage() {
    const router = useRouter();
    const [rollNo, setRollNo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${AUTH_API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roll_no: rollNo.toUpperCase(), password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Login failed");
            localStorage.setItem("cb_user", JSON.stringify(data));
            router.push("/");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
            {/* Ambient blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-900/15 blur-[140px]" />
                <div className="absolute top-[45%] left-[40%] w-[25%] h-[25%] rounded-full bg-blue-900/10 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md animate-slide-up">
                {/* Logo */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <span className="font-heading text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CampusBites</span>
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-slate-100 mb-1.5">Welcome back 👋</h1>
                    <p className="text-slate-500 text-sm">Log in to order from your campus canteen</p>
                </div>

                {/* Glass card */}
                <div className="glass-panel rounded-3xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Registration Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={rollNo}
                                    onChange={e => setRollNo(e.target.value.toUpperCase())}
                                    placeholder="e.g. 22CS101"
                                    required
                                    className="w-full rounded-2xl border border-white/8 bg-slate-900/60 pl-11 pr-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/15 focus:bg-slate-900 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full rounded-2xl border border-white/8 bg-slate-900/60 pl-11 pr-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/15 focus:bg-slate-900 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400 flex items-center gap-2 animate-fade-in">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="group relative w-full mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 font-bold text-slate-950 text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        Log In
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-white/5 text-center">
                        <p className="text-sm text-slate-500">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                                Create one free
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-slate-700">CampusBites · Campus Dining Platform</p>
            </div>
        </div>
    );
}
