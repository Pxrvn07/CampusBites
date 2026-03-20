"use client";

import { useEffect, useState, FormEvent, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { MENU_API as API_BASE, ORDER_API, SOCKET_URL, SETTINGS_API } from "../config";

// ─── Live clock ────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type MenuItem = {
  _id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  veg_or_nonveg: "veg" | "non-veg";
  counter?: string;
};

type OrderItem = { menuItem: { name: string; price: number } | null; quantity: number };
type Order = {
  _id: string;
  orderNumber?: number;
  status: "Pending" | "Cooking" | "Ready" | "Completed";
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
};


// Constants removed - using central config

// ─── Push notification helper ──────────────────────────────────────────────
function showPush(title: string, body: string, icon = "/logo.png") {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon });
  }
}

// ─── Edit Modal ────────────────────────────────────────────────────────────
function EditModal({
  item,
  onSave,
  onClose,
}: {
  item: MenuItem;
  onSave: (updated: Partial<MenuItem>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [price, setPrice] = useState(String(item.price));
  const [vegOrNonVeg, setVegOrNonVeg] = useState<"veg" | "non-veg">(item.veg_or_nonveg);
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [counter, setCounter] = useState(item.counter || "None");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (Number.isNaN(numericPrice)) { setErr("Price must be a valid number"); return; }
    setSaving(true);
    try {
      await onSave({ name, category, price: numericPrice, veg_or_nonveg: vegOrNonVeg, imageUrl, counter });
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0d1526] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-50">Edit Dish</h3>
            <p className="text-xs text-slate-500 mt-0.5">Changes apply instantly to the student app</p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dish Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full rounded-xl border border-white/8 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all" />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} required
              className="w-full rounded-xl border border-white/8 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all" />
          </div>

          {/* Price + Veg toggle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
                <input type="number" min={0} step="0.5" value={price} onChange={e => setPrice(e.target.value)} required
                  className="w-full rounded-xl border border-white/8 bg-slate-900/60 pl-8 pr-3 py-2.5 text-sm text-slate-100 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dietary</label>
              <div className="flex h-[42px] items-center rounded-xl border border-white/8 bg-slate-900/60 p-1 relative z-0">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 z-[-1] ${vegOrNonVeg === "veg" ? "left-1 bg-emerald-500/20 border border-emerald-500/30" : "left-[calc(50%+2px)] bg-red-500/20 border border-red-500/30"}`} />
                {(["veg", "non-veg"] as const).map(v => (
                  <button key={v} type="button" onClick={() => setVegOrNonVeg(v)}
                    className={`flex-1 text-xs font-bold h-full rounded-lg flex items-center justify-center gap-1 transition-colors ${vegOrNonVeg === v ? (v === "veg" ? "text-emerald-400" : "text-red-400") : "text-slate-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${v === "veg" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {v === "veg" ? "Veg" : "Non‑Veg"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Counter Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kitchen Counter</label>
            <div className="relative">
              <select value={counter} onChange={e => setCounter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/8 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all">
                <option value="None">None (Unassigned)</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Snacks">Snacks</option>
                <option value="Fresh Juice">Fresh Juice</option>
                <option value="Biriyani">Biriyani</option>
                <option value="Breakfast">Breakfast</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Image URL <span className="text-slate-600 normal-case">(optional)</span></label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-white/8 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all" />
            {imageUrl && (
              <div className="h-24 w-full rounded-xl overflow-hidden border border-white/8 mt-2">
                <Image src={imageUrl} alt="preview" width={400} height={96} className="w-full h-full object-cover" unoptimized />
              </div>
            )}
          </div>

          {err && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-sm font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2">
              {saving ? <><div className="h-4 w-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />Saving...</> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main AdminPage ────────────────────────────────────────────────────────
export default function AdminPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const [isCanteenOpen, setIsCanteenOpen] = useState(true);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [vegOrNonVeg, setVegOrNonVeg] = useState<"veg" | "non-veg">("veg");
  const [imageUrl, setImageUrl] = useState("");
  const [counter, setCounter] = useState("None");

  const socketRef = useRef<Socket | null>(null);
  const now = useClock();

  // ── Fetch menu ──────────────────────────────────────────────────────────
  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch menu");
      const data: MenuItem[] = await res.json();
      setMenu(data);
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };



  // ── On mount: fetch menu + settings + init socket + check notif permission ─────────
  useEffect(() => {
    fetchMenu();

    // Fetch global settings
    fetch(`${SETTINGS_API}`)
      .then(res => res.json())
      .then(data => setIsCanteenOpen(data.isOpen))
      .catch(console.error);

    if (typeof window !== "undefined") {
      setNotifPerm(Notification.permission);
    }

    // Socket for real-time order alerts on admin
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("newOrder", (data: { orderNumber?: number; totalAmount?: number }) => {
      const tokenStr = data.orderNumber ? ` — Token #${data.orderNumber}` : "";
      showPush("🛒 New Order!", `A new order just came in!${tokenStr}`);
    });

    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ── Request notification permission ────────────────────────────────────
  const requestNotifPermission = async () => {
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") showPush("🔔 Notifications enabled!", "You'll receive alerts for new orders and status updates.");
  };

  // ── Toggle Canteen Status ──────────────────────────────────────────────
  const toggleCanteenStatus = async () => {
    try {
      const res = await fetch(`${SETTINGS_API}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !isCanteenOpen }),
      });
      if (!res.ok) throw new Error("Failed to update canteen status");
      const data = await res.json();
      setIsCanteenOpen(data.isOpen);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // ── Add new item ────────────────────────────────────────────────────────
  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const numericPrice = parseFloat(price);
      if (Number.isNaN(numericPrice)) { setError("Price must be a valid number"); setSubmitting(false); return; }
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, price: numericPrice, veg_or_nonveg: vegOrNonVeg, imageUrl, counter }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || "Failed to add menu item"); }
      setName(""); setCategory(""); setPrice(""); setVegOrNonVeg("veg"); setImageUrl(""); setCounter("None");
      await fetchMenu();
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit item ───────────────────────────────────────────────────────────
  const handleEditSave = async (updated: Partial<MenuItem>) => {
    if (!editItem) return;
    const res = await fetch(`${API_BASE}/${editItem._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || "Failed to save changes"); }
    setEditItem(null);
    await fetchMenu();
  };

  // ── Toggle availability ─────────────────────────────────────────────────
  const handleToggleAvailability = async (id: string) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to update item");
      await fetchMenu();
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    }
  };

  // ── Delete item ─────────────────────────────────────────────────────────
  const handleDeleteItem = async (id: string) => {
    try {
      if (!window.confirm("Are you sure you want to delete this item?")) return;
      setError(null);
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      await fetchMenu();
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-500">
      {/* Edit Modal */}
      {editItem && (
        <EditModal item={editItem} onSave={handleEditSave} onClose={() => setEditItem(null)} />
      )}

      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[85rem] flex-col gap-8 px-6 py-10 lg:px-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end animate-slide-up pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-50">Menu Management</h1>
            </div>
            <p className="mt-2 text-sm text-slate-400 pl-14">Control the CampusBites catalog seamlessly.</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {error && (
              <div className="rounded-full bg-red-500/10 px-4 py-2 text-sm text-red-400 border border-red-500/20 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            {/* Notification permission button */}
            {notifPerm !== "granted" && (
              <button onClick={requestNotifPermission}
                className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 text-sm font-semibold hover:bg-amber-500/20 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {notifPerm === "denied" ? "Notifications Blocked" : "Enable Notifications"}
              </button>
            )}
            {notifPerm === "granted" && (
              <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 text-sm font-semibold">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                Notifications On
              </span>
            )}

            {/* Canteen Open/Close Toggle */}
            <button onClick={toggleCanteenStatus}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all border shadow-lg ${isCanteenOpen
                ? "bg-emerald-500 text-slate-900 border-emerald-400 hover:bg-emerald-400 shadow-emerald-500/20"
                : "bg-red-500 text-slate-50 border-red-400 hover:bg-red-400 shadow-red-500/20"
                }`}>
              {isCanteenOpen ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
                  Canteen is OPEN
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                  Canteen is CLOSED
                </>
              )}
            </button>

            {/* Clock */}
            <div className="hidden md:block text-right">
              <div className="font-heading font-black text-lg text-slate-100 tabular-nums">
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                {now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
          </div>
        </header>



        <main className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] items-start">
          {/* ── Add Dish panel ────────────────────────────────────────── */}
          <section className="glass-panel rounded-[2rem] p-8 animate-slide-up sticky top-6">
            <div className="mb-8">
              <h2 className="font-heading text-xl font-bold text-slate-50 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Create New Dish
              </h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">Add a culinary delight to the menu.</p>
            </div>

            <form onSubmit={handleAddItem} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Dish Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    placeholder="e.g. Truffle Mushroom Pasta" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    placeholder="e.g. Signature Mains" required />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                      <input type="number" min={0} step="0.5" value={price} onChange={(e) => setPrice(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/50 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                        placeholder="0.00" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Dietary Tag</label>
                    <div className="flex h-[46px] items-center rounded-2xl border border-white/10 bg-slate-900/50 p-1 relative z-0">
                      <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 z-[-1] ${vegOrNonVeg === "veg" ? "left-1 bg-emerald-500/20 border border-emerald-500/30" : "left-[calc(50%+2px)] bg-red-500/20 border border-red-500/30"}`} />
                      {(["veg", "non-veg"] as const).map(v => (
                        <button key={v} type="button" onClick={() => setVegOrNonVeg(v)}
                          className={`flex-1 rounded-xl text-sm font-semibold transition-colors h-full flex items-center justify-center gap-2 ${vegOrNonVeg === v ? (v === "veg" ? "text-emerald-400" : "text-red-400") : "text-slate-500 hover:text-slate-300"}`}>
                          <span className={`h-2 w-2 rounded-full ${v === "veg" ? (vegOrNonVeg === "veg" ? "bg-emerald-400" : "bg-transparent border border-slate-500") : (vegOrNonVeg === "non-veg" ? "bg-red-400" : "bg-transparent border border-slate-500")}`} />
                          {v === "veg" ? "Veg" : "Non‑Veg"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Kitchen Counter</label>
                  <div className="relative">
                    <select value={counter} onChange={(e) => setCounter(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all">
                      <option value="None">None (Unassigned)</option>
                      <option value="Fast Food">Fast Food</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Fresh Juice">Fresh Juice</option>
                      <option value="Biriyani">Biriyani</option>
                      <option value="Breakfast">Breakfast</option>
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Image URL <span className="text-slate-500 font-normal">(Optional)</span></label>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    placeholder="https://..." />
                  {imageUrl && (
                    <div className="mt-3 h-32 w-full rounded-xl border border-white/5 overflow-hidden bg-slate-900/80 group relative">
                      <Image src={imageUrl} alt="Preview" width={400} height={128} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-emerald-500 px-8 py-4 font-bold text-slate-950 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_20px_-5px_var(--color-emerald-500)]">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-300 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex items-center gap-2 text-base">
                  {submitting ? (
                    <><div className="h-5 w-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />Adding to Menu...</>
                  ) : (
                    <>Add Menu Item<svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg></>
                  )}
                </span>
              </button>
            </form>
          </section>

          {/* ── Menu table ────────────────────────────────────────────── */}
          <section className="glass-panel rounded-[2rem] p-8 animate-slide-up bg-slate-900/40" style={{ animationDelay: "0.1s" }}>
            <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-50">Current Menu</h2>
                <p className="mt-2 text-sm text-slate-400">Manage availability, edit, or remove items.</p>
              </div>
              <div className="h-10 px-4 rounded-xl bg-slate-800/50 border border-white/5 flex items-center gap-2 text-sm text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {menu.length} items
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-300">Syncing Menu...</p>
              </div>
            ) : menu.length === 0 ? (
              <div className="flex pl-4 py-20 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/20 text-center">
                <h3 className="text-lg font-bold text-slate-300">The Kitchen is Empty</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-[250px]">Use the form on the left to add your first dish.</p>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                {menu.map((item) => (
                  <div key={item._id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition-all hover:border-white/10 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-black/20">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-slate-800 flex items-center justify-center">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="h-full w-full object-cover" unoptimized />
                        ) : (
                          <span className="font-heading text-lg font-bold text-slate-400">{item.name.substring(0, 2).toUpperCase()}</span>
                        )}
                        <div className={`absolute bottom-0 inset-x-0 h-1 ${item.veg_or_nonveg === "veg" ? "bg-emerald-500" : "bg-red-500"}`} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <h3 className="truncate font-semibold text-slate-100 text-base flex items-center gap-2">
                          {item.name}
                          {!item.isAvailable && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase font-bold text-slate-400 ring-1 ring-white/10">Disabled</span>}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-xs border border-white/5">{item.category}</span>
                          {item.counter && item.counter !== "None" && (
                            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                              {item.counter}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-auto w-full pt-3 sm:pt-0 border-t border-white/5 sm:border-0 mt-3 sm:mt-0">
                      <div className="font-heading text-lg font-bold text-emerald-400 pr-2 sm:pr-4 sm:border-r border-white/10">
                        ₹{item.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* ✏️ Edit button */}
                        <button type="button" onClick={() => setEditItem(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 transition-all hover:bg-blue-500/20 hover:scale-105"
                          title="Edit Dish">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {/* 👁 Toggle availability */}
                        <button type="button" onClick={() => handleToggleAvailability(item._id)}
                          className={`relative inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all ${item.isAvailable ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"}`}>
                          {item.isAvailable ? (
                            <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>Hide</span>
                          ) : (
                            <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>Show</span>
                          )}
                        </button>
                        {/* 🗑 Delete */}
                        <button type="button" onClick={() => handleDeleteItem(item._id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 transition-all hover:bg-red-500 hover:text-white"
                          title="Delete Item">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
