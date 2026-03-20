"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

// ─── Types ────────────────────────────────────────────────────────────────────
type MenuItem = {
  _id: string; name: string; category: string; price: number;
  isAvailable: boolean; imageUrl?: string; veg_or_nonveg: "veg" | "non-veg";
};
type CartItem = { item: MenuItem; quantity: number };
type User = { _id: string; name: string; roll_no: string; role: string };
type PaymentMethod = "upi" | "card" | "cash";
type OrderHistoryItem = {
  _id: string; createdAt: string; totalAmount: number;
  orderNumber?: number;
  status: "Queued" | "Pending" | "Cooking" | "Ready" | "Completed";
  paymentMethod: PaymentMethod;
  items: { menuItem: { name: string; price: number } | null; quantity: number }[];
};
type PaymentConfig = { configured: boolean; keyId: string | null; upiId: string; canteenName: string };

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "http://localhost:5000";
const MENU_API = `${API}/api/menu`;
const ORDER_API = `${API}/api/orders`;
const PAY_API = `${API}/api/payment`;

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  Breakfast: { icon: "🍳", color: "from-amber-500/20 to-yellow-500/10" },
  "Rice & Biryani": { icon: "🍚", color: "from-emerald-500/20 to-teal-500/10" },
  Curries: { icon: "🍛", color: "from-orange-500/20 to-red-500/10" },
  Snacks: { icon: "🍟", color: "from-yellow-500/20 to-orange-500/10" },
  Beverages: { icon: "☕", color: "from-sky-500/20 to-blue-500/10" },
};
const catIcon = (c: string) => CATEGORY_META[c]?.icon ?? "🍽️";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  Queued: { label: "In Queue", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: "🕒" },
  Pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: "⏳" },
  Cooking: { label: "Cooking", color: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: "👨‍🍳" },
  Ready: { label: "Ready", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: "✅" },
  Completed: { label: "Completed", color: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: "🎉" },
};

// ─── Declare Razorpay global ──────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

// ─── Load Razorpay script helper ──────────────────────────────────────────────
function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  total, config, user, onSuccess, onClose,
}: {
  total: number;
  config: PaymentConfig;
  user: User;
  onSuccess: (method: PaymentMethod) => void;
  onClose: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Base UPI params shared by QR + app links
  const upiParams = `pa=${encodeURIComponent(config.upiId)}&pn=${encodeURIComponent(config.canteenName)}&am=${total}&cu=INR&tn=${encodeURIComponent("CampusBites Order")}`;
  const upiLink = `upi://pay?${upiParams}`;

  const UPI_ICONS = {
    gpay: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M11.96 9.87v4.14h5.88c-.24 1.76-1.39 3.26-3.32 4.19l5.35 4.15c3.13-2.88 4.93-7.12 4.93-11.83 0-.84-.08-1.65-.22-2.45h-12.62z" fill="#4285F4"/>
        <path d="M12.04 24c3.55 0 6.53-1.18 8.7-3.19l-5.35-4.15c-1.17.78-2.67 1.25-4.35 1.25-3.35 0-6.19-2.26-7.2-5.32h-5.54v4.29C1.03 22.37 5.8 24 12.04 24z" fill="#34A853"/>
        <path d="M4.84 15.68c-.26-.78-.41-1.62-.41-2.48s.15-1.7.41-2.48V6.43H-.7C-.14 7.56-1.5 8.74-1.5 10c0 1.26.24 2.44.7 3.57l5.54-4.29z" fill="#FBBC05"/>
        <path d="M12.04 4.8c1.93 0 3.66.66 5.03 1.96l3.77-3.77C18.5 1.13 15.53 0 12.04 0 5.8 0 1.03 1.63-2.74 6.43l5.54 4.29c1.01-3.06 3.85-5.32 7.2-5.32z" fill="#EA4335"/>
      </svg>
    ),
    phonepe: <span className="font-heading font-black text-lg text-white">Pě</span>,
    paytm: <span className="font-heading font-black text-xs tracking-tighter text-white">Paytm</span>,
    bhim: <span className="font-heading font-black text-[11px] tracking-tight text-white"><span className="text-[#ff9933]">BH</span><span className="text-[#138808]">IM</span></span>,
    cred: <span className="font-heading font-black text-xl leading-none tracking-tighter text-white">C</span>,
    amazon: <span className="font-heading font-black text-[10px] tracking-tight text-slate-900 mt-1">amazon<span className="text-[#ff9900] text-lg leading-[0] relative top-0.5">.</span></span>
  };

  const appLinks = [
    { name: "GPay", bg: "bg-white", tc: "text-slate-800", icon: UPI_ICONS.gpay, href: `tez://upi/pay?${upiParams}` },
    { name: "PhonePe", bg: "bg-[#5f259f]", tc: "text-white", icon: UPI_ICONS.phonepe, href: `phonepe://pay?${upiParams}` },
    { name: "Paytm", bg: "bg-[#00b9f1]", tc: "text-white", icon: UPI_ICONS.paytm, href: `paytmmp://pay?${upiParams}` },
    { name: "BHIM", bg: "bg-[#00a676]", tc: "text-white", icon: UPI_ICONS.bhim, href: `upi://pay?${upiParams}` },
    { name: "Cred", bg: "bg-[#1c1c1c]", tc: "text-white", icon: UPI_ICONS.cred, href: `credpay://upi/pay?${upiParams}` },
    { name: "Amazon", bg: "bg-white", tc: "text-slate-900", icon: UPI_ICONS.amazon, href: `amazonpay://pay?${upiParams}` },
  ];

  // ── Razorpay checkout ─────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    setProcessing(true);
    setStatusMsg(null);
    try {
      // 1. Create Razorpay order on backend
      const res = await fetch(`${PAY_API}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      const data = await res.json();

      if (!res.ok || !data.configured) {
        setStatusMsg(data.message || "Payment gateway not configured. Add Razorpay keys to server/.env");
        setProcessing(false);
        return;
      }

      // 2. Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        setStatusMsg("Failed to load Razorpay SDK. Check your internet connection.");
        setProcessing(false);
        return;
      }

      // 3. Open checkout
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "CampusBites",
        description: `Order for ${user.name} (${user.roll_no})`,
        order_id: data.orderId,
        prefill: { name: user.name },
        theme: { color: "#10b981" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // 4. Verify signature on backend
          const vRes = await fetch(`${PAY_API}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const vData = await vRes.json();
          if (vData.verified) {
            onSuccess("card");
          } else {
            setStatusMsg("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      });
      rzp.open();
    } catch {
      setStatusMsg("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const handlePaid = () => {
    setProcessing(true);
    setStatusMsg("Confirming...");
    setTimeout(() => { onSuccess("upi"); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden shadow-2xl animate-slide-up border border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-50">Scan &amp; Pay</h3>
            <p className="text-xs text-slate-400 mt-0.5">Amount: <span className="font-heading font-bold text-emerald-400">&#8377;{total}</span></p>
          </div>
          <button onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">&#x2715;</button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 bg-white rounded-2xl p-5 shadow-inner">
            <QRCodeSVG
              value={upiLink} size={190}
              bgColor="#ffffff" fgColor="#020617" level="M"
              imageSettings={{ src: "/favicon.ico", excavate: true, height: 22, width: 22 }}
            />
            <div className="text-center">
              <p className="text-slate-700 font-bold text-sm">{config.canteenName}</p>
              <p className="text-slate-400 text-xs font-mono mt-0.5">{config.upiId}</p>
              <p className="text-[#00a676] font-extrabold text-2xl mt-1 font-heading">&#8377;{total}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Open app</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* UPI App buttons */}
          <div className="grid grid-cols-6 gap-2">
            {appLinks.map(app => (
              <a key={app.name} href={app.href}
                onClick={e => { e.preventDefault(); window.location.href = app.href; }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer">
                <div className={`h-11 w-11 rounded-2xl ${app.bg} flex items-center justify-center font-black text-[13px] ${app.tc} shadow-lg group-hover:scale-110 group-active:scale-95 transition-transform duration-150 border border-slate-200/20`}>
                  {app.icon}
                </div>
                <span className="text-[9px] text-slate-500 font-semibold truncate w-full text-center">{app.name}</span>
              </a>
            ))}
          </div>

          {/* Status */}
          {statusMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs text-emerald-300 text-center animate-fade-in">
              {statusMsg}
            </div>
          )}

          {/* Primary confirm */}
          <button onClick={handlePaid} disabled={processing}
            className="group relative w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-extrabold text-slate-950 text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative">{processing ? "Confirming..." : "\u2705 I\u2019ve Paid \u2014 Place My Order"}</span>
          </button>

          {/* Secondary: card + cash */}
          <div className="flex gap-2">
            <button onClick={handleRazorpay} disabled={processing}
              className="flex-1 py-2.5 rounded-xl bg-[#1a73e8]/10 border border-[#1a73e8]/30 text-[#5b9cf6] text-xs font-bold hover:bg-[#1a73e8]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1">
              &#128179; Pay by Card
            </button>
            <button onClick={() => onSuccess("cash")} disabled={processing}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1">
              &#128181; Cash
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-center gap-1.5 text-[9px] text-slate-700">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          UPI &#183; 256-bit SSL &#183; Razorpay secured
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: OrderHistoryItem }) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.Pending;
  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {order.orderNumber && (
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-heading font-black text-sm shrink-0">
              #{order.orderNumber}
            </span>
          )}
          <div>
            <p className="text-xs font-bold text-slate-500">
              {new Date(order.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5 capitalize">
              {order.paymentMethod === "upi" ? "UPI" : order.paymentMethod === "card" ? "Card / Razorpay" : "Cash"}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <div className="space-y-1">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between text-xs text-slate-400">
            <span>{it.menuItem?.name ?? "Item"} × {it.quantity}</span>
            <span>₹{(it.menuItem?.price ?? 0) * it.quantity}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <span className="text-xs text-slate-500">Total</span>
        <span className="font-bold text-emerald-400 font-heading text-sm">₹{order.totalAmount}</span>
      </div>
    </div>
  );
}

// ─── Order History Panel (collapsible) ────────────────────────────────────────
function OrderHistoryPanel({ orders, loading }: { orders: OrderHistoryItem[]; loading: boolean }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header — click anywhere to toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 border-b border-white/5 flex items-center justify-between group hover:bg-white/3 transition-colors"
      >
        <h3 className="font-heading font-extrabold text-slate-50 text-base flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Your Orders
        </h3>
        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold px-2 py-0.5 rounded-full">
              {orders.length}
            </span>
          )}
          {/* Chevron rotates on collapse */}
          <svg
            className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-all duration-300 ${open ? "rotate-0" : "rotate-[-90deg]"}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible body */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        {/* Scrollable orders list — independent scroll, ~4 cards visible */}
        <div
          className="overflow-y-auto px-4 pt-3 pb-4 space-y-3"
          style={{ maxHeight: "min(22rem, 45vh)" }}
        >
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-sm">
              <p className="text-2xl mb-2">📋</p>
              <p className="font-medium text-slate-400">No orders yet</p>
              <p className="text-[11px] text-slate-600 mt-1">Your order history will appear here</p>
            </div>
          ) : (
            orders.map(order => <OrderCard key={order._id} order={order} />)
          )}
          {orders.length > 3 && (
            <p className="text-center text-[10px] text-slate-700 pb-1 select-none">↑ scroll for more</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [showPayment, setShowPayment] = useState(false);
  const [orderMsg, setOrderMsg] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [payConfig, setPayConfig] = useState<PaymentConfig>({ configured: false, keyId: null, upiId: "campusbites@okaxis", canteenName: "CampusBites Canteen" });
  const [cartPulse, setCartPulse] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isCanteenOpen, setIsCanteenOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load + apply theme from localStorage
  useEffect(() => {
    const saved = (localStorage.getItem("cb_theme") ?? "dark") as "dark" | "light";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("cb_theme", next);
    document.documentElement.dataset.theme = next;
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!showProfile) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfile]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("cb_user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  // ── Fetch config + menu + settings ───────────────────────────────────────
  useEffect(() => {
    fetch(`${PAY_API}/config`).then(r => r.json()).then(setPayConfig).catch(() => { });
    fetch("http://localhost:5000/api/settings").then(r => r.json()).then(d => setIsCanteenOpen(d.isOpen)).catch(() => { });
    fetch(MENU_API).then(r => r.json()).then((d: MenuItem[]) => setMenu(d.filter(m => m.isAvailable)))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // ── Order history ────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (uid: string) => {
    setHistoryLoading(true);
    try { const r = await fetch(`${ORDER_API}/${uid}`); setOrderHistory(await r.json()); }
    catch { /* silent */ } finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { if (user) fetchHistory(user._id); }, [user, fetchHistory]);

  // ── Socket.IO ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket: Socket = io(`${API}`, { transports: ["websocket"] });
    socket.on("orderStatusUpdated", (order: { userId?: string | { _id?: string }; status: string }) => {
      const uid = typeof order.userId === "string" ? order.userId : order.userId?._id;
      const stored = JSON.parse(localStorage.getItem("cb_user") || "{ }");
      if (uid === stored._id) {
        setLastStatus(order.status);
        const msg = order.status === "Ready" ? "Your order is ready for pickup! 🎉" : `Order is now ${order.status}...`;
        setOrderMsg(msg);
        fetchHistory(stored._id);
        // Push browser notification
        if (typeof window !== "undefined" && Notification.permission === "granted") {
          new Notification("🍴 CampusBites Order Update", {
            body: msg,
            icon: "/logo.png",
          });
        }
      }
    });

    socket.on("canteenStatusUpdate", (data: { isOpen: boolean }) => {
      setIsCanteenOpen(data.isOpen);
      if (!data.isOpen) {
        setOrderMsg("The canteen is now closed. Ordering is paused.");
      }
    });

    return () => { socket.disconnect(); };
  }, [fetchHistory]);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const triggerPulse = useCallback(() => { setCartPulse(true); setTimeout(() => setCartPulse(false), 400); }, []);
  const addToCart = useCallback((item: MenuItem) => {
    setCart(p => { const e = p.find(c => c.item._id === item._id); return e ? p.map(c => c.item._id === item._id ? { ...c, quantity: c.quantity + 1 } : c) : [...p, { item, quantity: 1 }]; });
    triggerPulse();
  }, [triggerPulse]);
  const decrease = useCallback((id: string) => setCart(p => p.map(c => c.item._id === id ? { ...c, quantity: c.quantity - 1 } : c).filter(c => c.quantity > 0)), []);
  const increase = useCallback((id: string) => { setCart(p => p.map(c => c.item._id === id ? { ...c, quantity: c.quantity + 1 } : c)); triggerPulse(); }, [triggerPulse]);

  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.quantity * c.item.price, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.quantity, 0), [cart]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(menu.map(m => m.category)))], [menu]);
  const filtered = useMemo(() => menu.filter(i => (activeCategory === "All" || i.category === activeCategory) && i.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filter === "all" || i.veg_or_nonveg === filter)), [menu, activeCategory, searchQuery, filter]);
  const grouped = useMemo(() => filtered.reduce((a, i) => { if (!a[i.category]) a[i.category] = []; a[i.category].push(i); return a; }, {} as Record<string, MenuItem[]>), [filtered]);

  // ── Place order (called after payment is verified) ───────────────────────
  const handlePaymentSuccess = useCallback(async (method: PaymentMethod) => {
    if (!user) return;
    try {
      const res = await fetch(ORDER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, paymentMethod: method, items: cart.map(c => ({ menuItem: c.item._id, quantity: c.quantity })) }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const placed = await res.json();
      setCart([]);
      setShowPayment(false);
      setLastStatus("Pending");
      
      const tokens = (placed.orders || [])
        .filter((o: any) => o.orderNumber)
        .map((o: any) => `#${o.orderNumber}`)
        .join(", ");
      const tokenMsg = tokens ? ` Your token(s): ${tokens} 🎫` : "";
      
      setOrderMsg(`Payment confirmed! Kitchen has been notified.${tokenMsg}`);
      fetchHistory(user._id);
    } catch (e) {
      setOrderMsg(`Error: ${(e as Error).message}`);
      setShowPayment(false);
    }
  }, [user, cart, fetchHistory]);

  const handleLogout = () => { localStorage.removeItem("cb_user"); router.push("/login"); };
  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    if (cat === "All") menuRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    else document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-400">

      {/* Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-0">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-emerald-900/20 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-900/15 blur-[130px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      {showPayment && user && (
        <PaymentModal total={cartTotal} config={payConfig} user={user}
          onSuccess={handlePaymentSuccess} onClose={() => setShowPayment(false)} />
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-5">
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/25 shrink-0">
              <Image src="/logo.png" alt="CampusBites Logo" width={40} height={40} className="object-cover w-full h-full" priority />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CampusBites</span>
          </div>
          <div className="flex-1 max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search dishes..."
              className="w-full bg-slate-900/60 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/30 transition-all" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(["all", "veg", "non-veg"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filter === f ? (f === "veg" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : f === "non-veg" ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-white/10 text-white border-white/20") : "text-slate-500 border-white/8 hover:text-slate-300"}`}>
                {f === "veg" && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                {f === "non-veg" && <span className="h-2 w-2 rounded-full bg-red-400" />}
                {f === "all" ? "All" : f === "veg" ? "Veg" : "Non-Veg"}
              </button>
            ))}
          </div>

          {/* ── Theme toggle ─── */}
          <button onClick={toggleTheme} title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="h-9 w-9 rounded-full glass-panel border border-white/10 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all hover:scale-105 shrink-0">
            {theme === "dark" ? (
              /* Sun icon */
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              /* Moon icon */
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user && (() => {
            // Weekly spend: sum of all orders placed in the last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekOrders = orderHistory.filter(o => new Date(o.createdAt) >= weekAgo);
            const weekSpend = weekOrders.reduce((s, o) => s + o.totalAmount, 0);

            return (
              <div className="relative shrink-0" ref={profileRef}>
                {/* Clickable pill */}
                <button
                  onClick={() => setShowProfile(p => !p)}
                  className="flex items-center gap-2 glass-panel rounded-full pl-1.5 pr-3 py-1 hover:bg-white/8 transition-all"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-black text-slate-950">{user.name[0].toUpperCase()}</div>
                  <span className="text-xs font-semibold text-slate-300">{user.name.split(" ")[0]}</span>
                  <svg className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Profile dropdown */}
                {showProfile && (
                  <div className="absolute right-0 top-10 z-50 w-64 bg-[#0d1526] border border-white/12 rounded-2xl shadow-2xl shadow-black/60 animate-slide-up overflow-hidden">
                    {/* Avatar + name */}
                    <div className="px-5 py-4 flex items-center gap-3 border-b border-white/5">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-lg font-black text-slate-950 shrink-0 shadow-lg shadow-emerald-500/25">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-100 text-sm truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{user.roll_no}</p>
                      </div>
                    </div>

                    {/* This-week stats */}
                    <div className="px-5 py-4 space-y-3">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Last 7 Days</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                          <p className="text-[10px] text-slate-500 font-semibold">Orders</p>
                          <p className="font-heading font-extrabold text-xl text-slate-100 mt-0.5">{weekOrders.length}</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                          <p className="text-[10px] text-emerald-500 font-semibold">Spent</p>
                          <p className="font-heading font-extrabold text-xl text-emerald-400 mt-0.5">&#8377;{weekSpend}</p>
                        </div>
                      </div>
                      {weekOrders.length > 0 && (
                        <div className="rounded-xl bg-slate-900/40 border border-white/5 px-3 py-2">
                          <p className="text-[10px] text-slate-500 mb-1">Recent</p>
                          {weekOrders.slice(0, 2).map(o => (
                            <div key={o._id} className="flex justify-between text-xs py-0.5">
                              <span className="text-slate-400 truncate mr-2">{new Date(o.createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</span>
                              <span className="text-emerald-400 font-bold shrink-0">&#8377;{o.totalAmount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="px-4 pb-4">
                      <button onClick={handleLogout}
                        className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </header>

      {/* 3-column body */}
      <div className="relative z-10 flex-1 max-w-[1400px] mx-auto w-full px-6 py-6 grid grid-cols-[220px_1fr_340px] gap-5 items-start">

        {/* LEFT sidebar */}
        <aside className="sticky top-[4.5rem] glass-panel rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5"><p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Browse Menu</p></div>
          <nav className="py-1.5">
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button key={cat} onClick={() => scrollToCategory(cat)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all text-left relative ${isActive ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-r-full" />}
                  <span className="text-base shrink-0">{cat === "All" ? "🍴" : catIcon(cat)}</span>
                  <span className="flex-1 truncate">{cat}</span>
                  {cat !== "All" && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"}`}>{menu.filter(m => m.category === cat).length}</span>}
                </button>
              );
            })}
          </nav>
          <div className={`m-3 rounded-xl border p-3 ${isCanteenOpen ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/15" : "bg-red-500/10 border-red-500/20"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              {isCanteenOpen ? (
                <>
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                  <p className="text-xs font-bold text-emerald-400">Canteen Open</p>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2"><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>
                  <p className="text-xs font-bold text-red-500">Canteen Closed</p>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-500">{isCanteenOpen ? "UPI QR · Razorpay · Cash · Pick up at counter" : "Ordering is currently paused."}</p>
          </div>
        </aside>

        {/* CENTRE: menu */}
        <main ref={menuRef} className="min-w-0">
          {orderMsg && (
            <div className={`mb-5 rounded-2xl p-4 text-sm flex items-center gap-3 animate-fade-in border ${lastStatus === "Ready" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300" : lastStatus === "Pending" ? "bg-blue-500/10 border-blue-500/25 text-blue-300" : "bg-orange-500/10 border-orange-500/25 text-orange-300"}`}>
              <span className="text-lg shrink-0">{lastStatus === "Ready" ? "✅" : "⏳"}</span>
              <p className="font-semibold flex-1">{orderMsg}</p>
              <button onClick={() => setOrderMsg(null)} className="text-slate-500 hover:text-white transition-colors shrink-0">✕</button>
            </div>
          )}
          {error && <div className="mb-5 rounded-2xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400">{error}</div>}
          {loading ? (
            <div className="flex flex-col items-center py-28 gap-4">
              <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Fetching today&apos;s menu...</p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="glass-panel rounded-3xl text-center py-24 px-10">
              <p className="text-4xl mb-3">{menu.length === 0 ? "😴" : "🔍"}</p>
              <p className="font-heading font-bold text-lg text-slate-300">{menu.length === 0 ? "Canteen is Closed" : "No Items Found"}</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items], sIdx) => (
              <section key={category} id={`cat-${category}`} className="mb-8 scroll-mt-20 animate-slide-up" style={{ animationDelay: `${sIdx * 0.06}s` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${CATEGORY_META[category]?.color ?? "from-slate-700 to-slate-800"} border border-white/8 flex items-center justify-center text-xl`}>{catIcon(category)}</div>
                  <div><h2 className="font-heading font-extrabold text-xl text-slate-50">{category}</h2><p className="text-xs text-slate-500">{items.length} item{items.length !== 1 ? "s" : ""}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item, iIdx) => {
                    const qty = cart.find(c => c.item._id === item._id)?.quantity ?? 0;
                    return (
                      <div key={item._id} className="group flex gap-4 bg-slate-900/60 hover:bg-slate-800/80 rounded-2xl p-4 border border-white/5 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${iIdx * 0.04}s` }}>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className={`inline-flex items-center gap-1 mb-1.5 px-1.5 py-0.5 rounded border text-[10px] font-bold w-fit ${item.veg_or_nonveg === "veg" ? "border-emerald-500/60 text-emerald-400" : "border-red-500/60 text-red-400"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${item.veg_or_nonveg === "veg" ? "bg-emerald-400" : "bg-red-400"}`} />
                            {item.veg_or_nonveg === "veg" ? "VEG" : "NON-VEG"}
                          </div>
                          <h3 className="font-bold text-slate-100 text-base leading-snug line-clamp-2 group-hover:text-white transition-colors">{item.name}</h3>
                          <p className="mt-auto pt-3 font-extrabold text-emerald-400 text-lg font-heading">₹{item.price}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 shrink-0">
                          <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                            {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                              : <div className="h-full w-full flex items-center justify-center text-3xl">{catIcon(item.category)}</div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          {!isCanteenOpen ? (
                            <button disabled className="w-24 py-1.5 rounded-lg bg-slate-800 text-slate-500 border border-white/5 text-sm font-black cursor-not-allowed">CLOSED</button>
                          ) : qty === 0 ? (
                            <button onClick={() => addToCart(item)} className="w-24 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-sm font-black hover:bg-emerald-500 hover:text-slate-950 hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95">ADD</button>
                          ) : (
                            <div className="flex items-center bg-emerald-500 rounded-lg overflow-hidden w-24 justify-between shadow-lg shadow-emerald-500/20">
                              <button onClick={() => decrease(item._id)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-950 hover:bg-emerald-600 text-lg active:scale-90 transition-colors">−</button>
                              <span className="font-extrabold text-slate-950 text-sm">{qty}</span>
                              <button onClick={() => increase(item._id)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-950 hover:bg-emerald-600 text-lg active:scale-90 transition-colors">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-7 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </section>
            ))
          )}
        </main>

        {/* RIGHT: Cart + Orders */}
        <aside className="sticky top-[4.5rem] flex flex-col gap-4">

          {/* Cart — flex-col so the checkout button is always visible */}
          <div className={`glass-panel rounded-2xl flex flex-col transition-all duration-300 ${cartPulse ? "ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/10" : ""}`}>
            {/* Cart header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-heading font-extrabold text-slate-50 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Your Cart
              </h3>
              {cartCount > 0 && <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-lg shadow-emerald-500/30">{cartCount}</span>}
            </div>

            {cartCount === 0 ? (
              <div className="flex flex-col items-center py-10 px-5 text-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <p className="font-semibold text-slate-400 text-sm">Cart is empty</p>
                <p className="text-[11px] text-slate-600">Click ADD on a dish to begin</p>
              </div>
            ) : (
              <>
                {/* Scrollable items list — capped at ~4 rows */}
                <div className="overflow-y-auto divide-y divide-white/5" style={{ maxHeight: "min(13rem, 35vh)" }}>
                  {cart.map(c => (
                    <div key={c.item._id} className="flex items-center gap-3 px-5 py-3">
                      <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/5">
                        {c.item.imageUrl ? <Image src={c.item.imageUrl} alt={c.item.name} fill className="object-cover" unoptimized /> : <div className="h-full w-full flex items-center justify-center text-base">{catIcon(c.item.category)}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-slate-200 truncate">{c.item.name}</p>
                        <p className="text-[10px] text-slate-500">₹{c.item.price} × {c.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => decrease(c.item._id)} className="h-6 w-6 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-400 text-sm font-bold transition-all border border-white/5">−</button>
                        <span className="font-bold text-slate-200 text-xs w-4 text-center">{c.quantity}</span>
                        <button onClick={() => increase(c.item._id)} className="h-6 w-6 flex items-center justify-center bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-full text-slate-400 text-sm font-bold transition-all border border-white/5">+</button>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 shrink-0 w-12 text-right">₹{c.item.price * c.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Total + CTA — always visible, never scrolled away */}
                <div className="px-5 py-4 bg-slate-950/40 border-t border-white/5 shrink-0">
                  <div className="flex justify-between font-black text-base mb-4">
                    <span className="text-slate-200">Total <span className="text-xs font-medium text-slate-500">({cartCount} item{cartCount !== 1 ? "s" : ""})</span></span>
                    <span className="font-heading text-emerald-400">₹{cartTotal}</span>
                  </div>
                  {isCanteenOpen ? (
                    <button onClick={() => setShowPayment(true)}
                      className="group relative w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-extrabold text-slate-950 text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center gap-2">
                        Proceed to Pay 🔒
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </span>
                    </button>
                  ) : (
                    <button disabled className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-500 text-sm font-extrabold cursor-not-allowed border border-white/5">
                      Canteen Closed
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Order History — collapsible */}
          <OrderHistoryPanel orders={orderHistory} loading={historyLoading} />
        </aside>
      </div>
    </div>
  );
}
