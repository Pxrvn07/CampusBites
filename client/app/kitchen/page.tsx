"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// ─── Types ─────────────────────────────────────────────────────────────────
type MenuItem = { _id: string; name: string; price: number };
type OrderItem = { menuItem: MenuItem; quantity: number };
type Order = {
  _id: string;
  orderNumber?: number;
  userId: string | { _id: string };
  status: "Queued" | "Pending" | "Cooking" | "Ready" | "Completed";
  items: OrderItem[];
  totalAmount?: number;
  counter?: string;
  createdAt: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────
const SOCKET_URL = "http://localhost:5000";
const ORDER_API = "http://localhost:5000/api/orders";

// ─── Live clock hook ───────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── Elapsed time string ───────────────────────────────────────────────────
function useElapsed(createdAt: string) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, []);
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min";
  return `${mins} mins`;
}

// ─── Order Ticket ──────────────────────────────────────────────────────────
function OrderTicket({ order, onAdvance, accent }: {
  order: Order;
  onAdvance: (order: Order) => void;
  accent: { bar: string; glow: string; btn: string; btnHover: string; btnText: string };
}) {
  const elapsed = useElapsed(order.createdAt);
  const isOverdue = (Date.now() - new Date(order.createdAt).getTime()) > 10 * 60 * 1000;

  const nextLabel = order.status === "Pending" ? "🔥 Start Cooking" :
    order.status === "Cooking" ? "✅ Mark Ready" : "📦 Mark Collected";

  return (
    <article className={`relative flex flex-col rounded-2xl border border-white/8 bg-slate-900/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/14 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5`}>
      {/* Status bar */}
      <div className={`h-1 w-full ${accent.bar}`} />

      {/* Glow when overdue */}
      {isOverdue && order.status === "Pending" && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-red-500/30 animate-pulse pointer-events-none" />
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between">
          {/* Token */}
          <div className={`flex items-center justify-center h-11 w-11 rounded-xl ${accent.glow} border shrink-0`}>
            <span className="font-heading font-black text-lg">
              {order.orderNumber ? `#${order.orderNumber}` : "?"}
            </span>
          </div>
          {/* Time */}
          <div className="text-right">
            <div className={`text-xs font-bold ${isOverdue ? "text-red-400" : "text-slate-500"}`}>
              {elapsed}
            </div>
            <div className="text-[10px] text-slate-600 font-mono">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Items */}
        <ul className="space-y-1.5 flex-1">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 h-5 w-5 rounded bg-slate-800 border border-white/5 flex items-center justify-center text-[11px] font-black text-slate-300">
                {it.quantity}
              </span>
              <span className="text-sm text-slate-200 font-medium leading-tight">
                {it.menuItem?.name ?? "Item"}
              </span>
            </li>
          ))}
        </ul>

        {/* Advance button */}
        <button
          onClick={() => onAdvance(order)}
          className={`mt-2 w-full py-2.5 rounded-xl ${accent.btn} ${accent.btnHover} ${accent.btnText} text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5`}
        >
          {nextLabel}
        </button>
      </div>
    </article>
  );
}

// ─── Column ────────────────────────────────────────────────────────────────
function Column({ title, icon, orders, accent, onAdvance, delay }: {
  title: string;
  icon: string;
  orders: Order[];
  accent: { bar: string; glow: string; btn: string; btnHover: string; btnText: string; header: string };
  onAdvance: (order: Order) => void;
  delay: string;
}) {
  return (
    <section
      className="flex flex-col h-full rounded-3xl border border-white/8 bg-white/2 backdrop-blur-xl overflow-hidden animate-slide-up"
      style={{ animationDelay: delay }}
    >
      {/* Column header */}
      <div className={`px-5 py-4 border-b border-white/5 ${accent.header} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <h2 className="font-heading font-bold text-slate-100 text-base">{title}</h2>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              {orders.length} ticket{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {orders.length > 0 && (
          <span className={`h-7 w-7 rounded-full ${accent.btn} ${accent.btnText} flex items-center justify-center font-heading font-black text-sm`}>
            {orders.length}
          </span>
        )}
      </div>

      {/* Tickets */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-white/5">
            <div className="text-3xl mb-2 opacity-40">✓</div>
            <p className="text-sm font-medium text-slate-500">Queue clear</p>
            <p className="text-xs text-slate-600 mt-1">Waiting for orders…</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderTicket key={order._id} order={order} onAdvance={onAdvance} accent={accent} />
          ))
        )}
      </div>
    </section>
  );
}

// ─── Main KDS Page ─────────────────────────────────────────────────────────
export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCounter, setSelectedCounter] = useState<string>("All");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const now = useClock();

  const fetchActiveOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${ORDER_API}/active`);
      if (!res.ok) throw new Error("Failed to fetch active orders");
      setOrders(await res.json());
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => { fetchActiveOrders(); }, [fetchActiveOrders]);

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("newOrder", (order: Order) => {
      setOrders(prev => {
        if (order.status === "Completed") return prev;
        const exists = prev.find(o => o._id === order._id);
        return exists ? prev.map(o => o._id === order._id ? order : o) : [order, ...prev];
      });
    });

    socket.on("orderStatusUpdated", (order: Order) => {
      setOrders(prev => {
        const filtered = prev.filter(o => o._id !== order._id);
        return order.status === "Completed" ? filtered : [order, ...filtered];
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleAdvance = useCallback(async (order: Order) => {
    const next = order.status === "Pending" ? "Cooking" :
      order.status === "Cooking" ? "Ready" : "Completed";

    // Optimistic update
    setOrders(prev => {
      const filtered = prev.filter(o => o._id !== order._id);
      return next === "Completed" ? filtered : [{ ...order, status: next as Order["status"] }, ...filtered];
    });

    try {
      await fetch(`${ORDER_API}/${order._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    } catch { /* silent — socket will correct */ }
  }, []);

  const grouped = useMemo(() => {
    const filteredOrders = selectedCounter === "All" 
      ? orders 
      : orders.filter(o => o.counter === selectedCounter);

    const sort = (arr: Order[]) => [...arr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return {
      pending: sort(filteredOrders.filter(o => o.status === "Pending")),
      cooking: sort(filteredOrders.filter(o => o.status === "Cooking")),
      ready: sort(filteredOrders.filter(o => o.status === "Ready")),
    };
  }, [orders, selectedCounter]);

  const displayedTotal = grouped.pending.length + grouped.cooking.length + grouped.ready.length;

  const ACCENTS = {
    pending: {
      bar: "bg-yellow-500",
      glow: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
      btn: "bg-orange-500",
      btnHover: "hover:bg-orange-400",
      btnText: "text-slate-950",
      header: "bg-yellow-500/5",
    },
    cooking: {
      bar: "bg-orange-500",
      glow: "bg-orange-500/15 border-orange-500/30 text-orange-400",
      btn: "bg-emerald-500",
      btnHover: "hover:bg-emerald-400",
      btnText: "text-slate-950",
      header: "bg-orange-500/5",
    },
    ready: {
      bar: "bg-emerald-500",
      glow: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      btn: "bg-slate-700",
      btnHover: "hover:bg-slate-600",
      btnText: "text-slate-100",
      header: "bg-emerald-500/5",
    },
  };

  return (
    <div className="min-h-screen h-screen bg-[#020617] text-slate-50 font-sans flex flex-col overflow-hidden selection:bg-emerald-500/30">
      {/* Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-emerald-900/15 blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full px-6 py-5 max-w-[120rem] mx-auto w-full gap-5">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex items-center justify-between bg-white/3 backdrop-blur-xl border border-white/8 rounded-2xl px-6 py-4 shrink-0 animate-slide-up">
          {/* Left: Identity */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-xl text-slate-50 tracking-tight">Kitchen Display System</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
                </span>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  {connected ? "Live Feed" : "Reconnecting…"}
                </p>
              </div>
            </div>
          </div>

          {/* Centre: Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative border-r border-white/10 pr-6 mr-2">
              <label className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1 block">Station View</label>
              <select value={selectedCounter} onChange={e => setSelectedCounter(e.target.value)}
                className="appearance-none bg-slate-900 border border-white/10 rounded-xl pl-4 pr-8 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500/50 shadow-lg cursor-pointer">
                <option value="All">All Stations</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Snacks">Snacks</option>
                <option value="Fresh Juice">Fresh Juice</option>
                <option value="Biriyani">Biriyani</option>
                <option value="Breakfast">Breakfast</option>
                <option value="None">Unassigned</option>
              </select>
              <div className="pointer-events-none absolute right-9 top-1/2 mt-1 -translate-y-1/2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {[
              { label: "Pending", value: grouped.pending.length, color: "text-yellow-400" },
              { label: "Cooking", value: grouped.cooking.length, color: "text-orange-400" },
              { label: "Ready", value: grouped.ready.length, color: "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="text-center bg-white/3 border border-white/5 rounded-xl px-5 py-2">
                <div className={`font-heading font-black text-2xl ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Right: clock + refresh */}
          <div className="flex items-center gap-4">
            {error && (
              <div className="rounded-full bg-red-500/10 px-4 py-2 text-xs text-red-400 border border-red-500/20">
                {error}
              </div>
            )}
            <button onClick={fetchActiveOrders} title="Refresh"
              className="h-9 w-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="text-right">
              <div className="font-heading font-black text-2xl text-slate-100 tabular-nums">
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                {now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
          </div>
        </header>

        {/* ── Columns ─────────────────────────────────────────────── */}
        <main className="grid grid-cols-3 gap-5 flex-1 min-h-0">
          <Column
            title="New Orders"
            icon="⏳"
            orders={grouped.pending}
            accent={ACCENTS.pending}
            onAdvance={handleAdvance}
            delay="0.05s"
          />
          <Column
            title="In Progress"
            icon="👨‍🍳"
            orders={grouped.cooking}
            accent={ACCENTS.cooking}
            onAdvance={handleAdvance}
            delay="0.1s"
          />
          <Column
            title="Ready for Pickup"
            icon="✅"
            orders={grouped.ready}
            accent={ACCENTS.ready}
            onAdvance={handleAdvance}
            delay="0.15s"
          />
        </main>

        {/* ── Footer ticker ────────────────────────────────────────── */}
        <footer className="shrink-0 flex items-center justify-between text-[11px] text-slate-700 font-medium px-1">
          <span>CampusBites KDS · localhost:3000/kitchen</span>
          <span>{displayedTotal} active ticket{displayedTotal !== 1 ? "s" : ""} on display</span>
        </footer>
      </div>
    </div>
  );
}
