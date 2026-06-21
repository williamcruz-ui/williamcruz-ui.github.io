import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F7", white: "#FFFFFF", border: "#D2D2D7", sep: "#F2F2F7",
  text: "#1D1D1F", sub: "#6E6E73",
  blue: "#0071E3", green: "#34C759", orange: "#FF9500", red: "#FF3B30",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={fill === "none" ? "currentColor" : "none"}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  home:     "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users:    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m2 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  chart:    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  bolt:     "M13 10V3L4 14h7v7l9-11h-7z",
  plus:     "M12 4v16m8-8H4",
  x:        "M6 18L18 6M6 6l12 12",
  send:     "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  spark:    "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
};

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const maskCNPJ = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2").replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2").replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
};
const cnpjValid = (v) => (v || "").replace(/\D/g, "").length === 14;

const maskPhone = (v) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

// ─── Mapeamento camelCase <-> colunas snake_case do Supabase ──────────────────
const customerToRow   = (c, userId) => ({ user_id: userId, nome: c.nome ?? null, email: c.email ?? null, telefone: c.telefone ?? null, cidade: c.cidade ?? null });
const customerFromRow = (r) => ({ id: r.id, nome: r.nome, email: r.email, telefone: r.telefone, cidade: r.cidade });
const supplierToRow   = (s, userId) => ({ user_id: userId, razao_social: s.razaoSocial ?? null, cnpj: s.cnpj ?? null, contato: s.contato ?? null, categoria: s.categoria ?? null });
const supplierFromRow = (r) => ({ id: r.id, razaoSocial: r.razao_social, cnpj: r.cnpj, contato: r.contato, categoria: r.categoria });
const saleToRow       = (s, userId) => ({ user_id: userId, cliente: s.cliente ?? null, produto: s.produto ?? null, qtd: s.qtd ? Number(s.qtd) : null, valor_unit: s.valorUnit ? Number(s.valorUnit) : null, data: s.data || null, status: s.status ?? null });
const saleFromRow     = (r) => ({ id: r.id, cliente: r.cliente, produto: r.produto, qtd: r.qtd, valorUnit: r.valor_unit, data: r.data, status: r.status });

// ─── Tela de carregamento ─────────────────────────────────────────────────────
function Splash({ label }) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#F5F5F7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: 28, height: 28, border: "3px solid #D2D2D7", borderTopColor: "#0071E3", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      {label && <div style={{ fontSize: 13, color: "#6E6E73" }}>{label}</div>}
    </div>
  );
}

// ─── Análise de padrão de compra ──────────────────────────────────────────────
function computeInsights(sales) {
  const TODAY = new Date();
  const byCust = {};
  sales.forEach((s) => {
    if (!byCust[s.cliente]) byCust[s.cliente] = [];
    byCust[s.cliente].push({ ...s, _d: new Date(s.data) });
  });
  return Object.entries(byCust).map(([cliente, list]) => {
    list.sort((a, b) => a._d - b._d);
    const intervals = list.slice(1).map((s, i) => (s._d - list[i]._d) / 86400000);
    const avgInterval = intervals.length
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : null;
    const last      = list[list.length - 1];
    const daysSince = Math.round((TODAY - last._d) / 86400000);
    const daysUntil = avgInterval !== null ? avgInterval - daysSince : null;
    const pCount    = {};
    list.forEach((s) => { pCount[s.produto] = (pCount[s.produto] || 0) + 1; });
    const topProduct  = Object.entries(pCount).sort((a, b) => b[1] - a[1])[0][0];
    const avgQtd      = Math.round(list.reduce((a, s) => a + Number(s.qtd), 0) / list.length);
    const totalSpent  = list.reduce((a, s) => a + Number(s.qtd) * Number(s.valorUnit), 0);
    return {
      cliente, avgInterval, daysSince, daysUntil,
      purchases: list.length, topProduct, avgQtd, totalSpent, lastDate: last.data,
      urgent:     daysUntil !== null && daysUntil >= 0 && daysUntil <= 3,
      approaching:daysUntil !== null && daysUntil > 3  && daysUntil <= 10,
      overdue:    daysUntil !== null && daysUntil < 0,
    };
  }).sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999));
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Inp({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 3px ${C.blue}22`; }}
        onBlur={(e)  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        style={{ width: "100%", padding: "10px 12px", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, color: C.text, background: C.white, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" }} />
    </div>
  );
}
function Sel({ label, value, onChange, opts }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 3px ${C.blue}22`; }}
        onBlur={(e)  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, color: C.text, background: C.white, outline: "none", appearance: "none", cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" }}>
        <option value="">Selecionar…</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Btn({ children, onClick, variant = "primary", sm, full }) {
  const v = { primary: { background: C.blue, color: C.white, border: "none" }, ghost: { background: "transparent", color: C.sub, border: `1px solid ${C.border}` }, danger: { background: C.red, color: C.white, border: "none" } };
  return (
    <button onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.78"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
      style={{ ...v[variant], padding: sm ? "6px 12px" : "10px 22px", borderRadius: 10, cursor: "pointer", fontSize: sm ? 13 : 15, fontWeight: 500, fontFamily: "inherit", transition: "opacity .12s", width: full ? "100%" : undefined }}>
      {children}
    </button>
  );
}
function Badge({ s }) {
  const m = { "Concluída": { bg: "#E3F9EC", color: C.green }, "Pendente": { bg: "#FFF4E5", color: C.orange }, "Cancelada": { bg: "#FFE5E5", color: C.red } };
  const st = m[s] || { bg: C.sep, color: C.sub };
  return <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>{s}</span>;
}

// ─── NOVA ChatPanel ───────────────────────────────────────────────────────────
function ChatPanel({ salesData, insights, onClose, mobile }) {
  const { customers, suppliers, sales } = salesData;
  const endRef = useRef(null);

  const initMsg = useMemo(() => {
    const urgent     = insights.filter(i => i.urgent || i.overdue);
    const approaching= insights.filter(i => i.approaching);
    const lines = [];
    if (urgent.length > 0) {
      lines.push("🚨 **Ação necessária agora:**");
      urgent.forEach(i => {
        const when = i.overdue ? "ATRASADO" : i.daysUntil === 0 ? "hoje" : `em ${i.daysUntil} dia(s)`;
        lines.push(`• **${i.cliente}** — pedido ${when}`);
        lines.push(`  ↳ Sugestão: ${i.avgQtd} un. de ${i.topProduct}`);
      });
    }
    if (approaching.length > 0) {
      if (lines.length) lines.push("");
      lines.push("📅 **Chegando em breve:**");
      approaching.forEach(i => lines.push(`• **${i.cliente}** — daqui ${i.daysUntil} dias (ciclo: ${i.avgInterval}d)`));
    }
    if (!urgent.length && !approaching.length) lines.push("✅ Nenhuma compra urgente no radar.");
    lines.push(""); lines.push("Como posso ajudar?");
    return lines.join("\n");
  }, [insights]);

  const [msgs, setMsgs]     = useState([{ role: "assistant", content: initMsg }]);
  const [input, setInput]   = useState("");
  const [loading, setLoad]  = useState(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const system = () => `Você é NOVA, assistente de inteligência comercial do SalesFlow.

CLIENTES: ${JSON.stringify(customers.map(c => ({ nome: c.nome, cidade: c.cidade })))}
FORNECEDORES: ${JSON.stringify(suppliers.map(s => ({ nome: s.razaoSocial, categoria: s.categoria })))}
VENDAS: ${JSON.stringify(sales.map(s => ({ cliente: s.cliente, produto: s.produto, qtd: s.qtd, valor: s.valorUnit, data: s.data, status: s.status })))}
PADRÕES DE COMPRA: ${JSON.stringify(insights)}

Data de hoje: ${new Date().toLocaleDateString("pt-BR")}.
Responda em português. Use **negrito** para destaques. Seja direto (máx 150 palavras). Sugira ações concretas.`;

  const send = async (text) => {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setInput("");
    const next = [...msgs, { role: "user", content: msg }];
    setMsgs(next);
    setLoad(true);
    try {
      const res  = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: system(),
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || data?.error || "Erro ao processar.";
      setMsgs(p => [...p, { role: "assistant", content: text }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Erro de conexão. Tente novamente." }]);
    }
    setLoad(false);
  };

  const md = (text) => text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <div key={i} style={{ marginBottom: line === "" ? 6 : 1, minHeight: line === "" ? 6 : undefined }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </div>
    );
  });

  const QUICK = ["Próximas compras", "Clientes em risco", "Sugerir pedido para Drogaria Sul", "Resumo da semana"];

  const panelStyle = mobile ? {
    position: "fixed", bottom: 0, left: 0, right: 0, height: "88vh",
    borderRadius: "20px 20px 0 0", background: C.white,
    boxShadow: "0 -4px 40px rgba(0,0,0,0.15)", zIndex: 50,
    display: "flex", flexDirection: "column",
    animation: "slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94)",
  } : {
    position: "fixed", right: 24, bottom: 96, width: 380,
    height: "min(580px, calc(100vh - 140px))",
    borderRadius: 18, background: C.white,
    boxShadow: "0 8px 40px rgba(0,0,0,0.14)", border: `1px solid ${C.border}`,
    zIndex: 50, display: "flex", flexDirection: "column",
    animation: "chatIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",
  };

  return (
    <>
      {mobile && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 49 }} />}
      <div style={panelStyle}>
        {mobile && (
          <div style={{ padding: "10px 0 2px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} />
          </div>
        )}

        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.sep}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #0071E3 0%, #9B59B6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ico d={I.spark} size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>NOVA</div>
            <div style={{ fontSize: 11, color: C.sub }}>Assistente Comercial IA</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub, display: "flex", padding: 4 }}>
            <Ico d={I.x} size={18} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 8 }}>
              {m.role === "assistant" && (
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #0071E3, #9B59B6)", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ico d={I.bolt} size={11} />
                </div>
              )}
              <div style={{
                maxWidth: "82%", padding: "9px 13px",
                borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                background: m.role === "user" ? C.blue : C.bg,
                color: m.role === "user" ? C.white : C.text,
                fontSize: 13.5, lineHeight: 1.55,
                border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
              }}>
                {md(m.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #0071E3, #9B59B6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ico d={I.bolt} size={11} />
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "4px 14px 14px 14px", background: C.bg, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.sub, animation: `dot 1.2s ${i * 0.2}s infinite ease-in-out` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: "8px 14px", borderTop: `1px solid ${C.sep}`, display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)}
              style={{ padding: "5px 10px", borderRadius: 16, fontSize: 12, border: `1px solid ${C.border}`, background: C.bg, color: C.sub, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "10px 14px 16px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Pergunte sobre clientes, pedidos…"
            onFocus={(e) => e.target.style.borderColor = C.blue}
            onBlur={(e)  => e.target.style.borderColor = C.border}
            style={{ flex: 1, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 14, color: C.text, background: C.bg, outline: "none", fontFamily: "inherit", transition: "border-color .15s" }} />
          <button onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{ width: 38, height: 38, borderRadius: 10, border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? C.blue : C.sep, color: input.trim() && !loading ? C.white : C.sub, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}>
            <Ico d={I.send} size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dot    { 0%,80%,100%{opacity:.3;transform:scale(1)} 40%{opacity:1;transform:scale(1.35)} }
        @keyframes chatIn { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const [session, setSession]         = useState(null);
  const [authReady, setAuthReady]     = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setCustomers([]); setSuppliers([]); setSales([]); return; }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const [sec, setSec]             = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales]         = useState([]);
  const [drawer, setDrawer]       = useState(null);
  const [form, setForm]           = useState({});
  const [q, setQ]                 = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [chatOpen, setChatOpen]   = useState(false);

  const insights    = useMemo(() => computeInsights(sales), [sales]);
  const totalVendas = useMemo(() => sales.reduce((a, s) => a + Number(s.qtd) * Number(s.valorUnit), 0), [sales]);
  const hasUrgent   = insights.some(i => i.urgent || i.overdue);

  const openDrawer  = (type, mode, data = {}) => { setForm({ ...data }); setDrawer({ type, mode }); };
  const closeDrawer = () => { setDrawer(null); setForm({}); };
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadAll = async () => {
    setLoadingData(true);
    const [c, s, sa] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("*").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("data", { ascending: false }),
    ]);
    setCustomers((c.data  || []).map(customerFromRow));
    setSuppliers((s.data  || []).map(supplierFromRow));
    setSales((sa.data || []).map(saleFromRow));
    setLoadingData(false);
  };

  const TABLES = {
    customer: { name: "customers", to: customerToRow, from: customerFromRow, set: setCustomers },
    supplier: { name: "suppliers", to: supplierToRow, from: supplierFromRow, set: setSuppliers },
    sale:     { name: "sales",     to: saleToRow,     from: saleFromRow,     set: setSales },
  };

  const save = async () => {
    if (drawer.type === "supplier" && !cnpjValid(form.cnpj)) {
      alert("CNPJ inválido. Preencha os 14 dígitos.");
      return;
    }
    const t = TABLES[drawer.type];
    const row = t.to(form, session.user.id);
    try {
      if (drawer.mode === "add") {
        const { data, error } = await supabase.from(t.name).insert(row).select().single();
        if (error) throw error;
        t.set((l) => [t.from(data), ...l]);
      } else {
        const { data, error } = await supabase.from(t.name).update(row).eq("id", form.id).select().single();
        if (error) throw error;
        t.set((l) => l.map((x) => (x.id === form.id ? t.from(data) : x)));
      }
      closeDrawer();
    } catch (e) {
      alert("Erro ao salvar: " + (e.message || e));
    }
  };

  const del = async (type, id) => {
    const t = TABLES[type];
    try {
      const { error } = await supabase.from(t.name).delete().eq("id", id);
      if (error) throw error;
      t.set((l) => l.filter((x) => x.id !== id));
    } catch (e) {
      alert("Erro ao excluir: " + (e.message || e));
    }
  };

  const filter = (list) =>
    !q ? list : list.filter((i) => Object.values(i).some((v) => String(v ?? "").toLowerCase().includes(q.toLowerCase())));

  const NAV = [
    { id: "dashboard", icon: I.home,     label: "Início",       short: "Início" },
    { id: "customers", icon: I.users,    label: "Clientes",     short: "Clientes" },
    { id: "suppliers", icon: I.building, label: "Fornecedores", short: "Fornec." },
    { id: "sales",     icon: I.chart,    label: "Vendas",       short: "Vendas" },
  ];
  const ADD_ACTIONS = {
    customers: { type: "customer" },
    suppliers: { type: "supplier" },
    sales:     { type: "sale" },
  };

  const COLS = {
    customers: [
      { k: "nome", label: "Nome" },
      { k: "email", label: "E-mail", muted: true },
      { k: "telefone", label: "Telefone", muted: true },
      { k: "cidade", label: "Cidade" },
    ],
    suppliers: [
      { k: "razaoSocial", label: "Razão Social" },
      { k: "cnpj", label: "CNPJ", muted: true },
      { k: "contato", label: "Contato" },
      { k: "categoria", label: "Categoria" },
    ],
    sales: [
      { k: "cliente", label: "Cliente" },
      { k: "produto", label: "Produto", muted: true },
      { k: "qtd", label: "Qtd", muted: true },
      { k: "data", label: "Data", muted: true },
      { k: "status", label: "Status", render: (v) => <Badge s={v} /> },
      { k: "total", label: "Total", render: (_, r) => brl(r.qtd * r.valorUnit) },
    ],
  };
  const COLS_DASH = [
    { k: "cliente", label: "Cliente" },
    { k: "produto", label: "Produto", muted: true },
    { k: "data",    label: "Data", muted: true },
    { k: "status",  label: "Status", render: (v) => <Badge s={v} /> },
    { k: "total",   label: "Total", render: (_, r) => <span style={{ fontWeight: 600 }}>{brl(r.qtd * r.valorUnit)}</span> },
  ];

  // ── Desktop table ──────────────────────────────────────────────────────────
  const renderTable = (cols, rows, type) => (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#FAFAFA", borderBottom: `1px solid ${C.border}` }}>
            {cols.map((c) => (
              <th key={c.k} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.sub, letterSpacing: 0.6, textTransform: "uppercase" }}>{c.label}</th>
            ))}
            <th style={{ padding: "11px 16px", width: 100 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} style={{ borderTop: i > 0 ? `1px solid ${C.sep}` : "none", transition: "background .1s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {cols.map((c) => (
                <td key={c.k} style={{ padding: "13px 16px", fontSize: 14, color: c.muted ? C.sub : C.text }}>
                  {c.render ? c.render(row[c.k], row) : row[c.k]}
                </td>
              ))}
              <td style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn sm onClick={() => openDrawer(type, "edit", row)} variant="ghost">Editar</Btn>
                  <Btn sm onClick={() => del(type, row.id)} variant="danger">✕</Btn>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={cols.length + 1} style={{ padding: "48px 16px", textAlign: "center", color: C.sub, fontSize: 14 }}>Nenhum registro encontrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Mobile card list ────────────────────────────────────────────────────────
  const renderMobileList = (cols, rows, type) => {
    if (!rows.length) return <div style={{ padding: "60px 0", textAlign: "center", color: C.sub, fontSize: 14 }}>Nenhum registro.</div>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row) => (
          <div key={row.id} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.sep}` }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                {cols[0].render ? cols[0].render(row[cols[0].k], row) : row[cols[0].k]}
              </div>
            </div>
            <div style={{ padding: "10px 16px 0" }}>
              {cols.slice(1).map((c) => (
                <div key={c.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${C.sep}` }}>
                  <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{c.label}</span>
                  <span style={{ fontSize: 13, color: C.text }}>{c.render ? c.render(row[c.k], row) : row[c.k]}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "10px 16px 14px", display: "flex", gap: 8 }}>
              <Btn sm onClick={() => openDrawer(type, "edit", row)} variant="ghost">Editar</Btn>
              <Btn sm onClick={() => del(type, row.id)} variant="danger">Excluir</Btn>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderList = (cols, rows, type) => mobile ? renderMobileList(cols, rows, type) : renderTable(cols, rows, type);

  const renderHeader = (title, sub, onAdd, addLabel) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: mobile ? 18 : 28 }}>
      <div>
        <h1 style={{ fontSize: mobile ? 22 : 26, fontWeight: 700, color: C.text, letterSpacing: -0.5, margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>{sub}</p>}
      </div>
      {onAdd && !mobile && <Btn onClick={onAdd}>{addLabel}</Btn>}
    </div>
  );

  const renderDrawerContent = () => {
    if (!drawer) return null;
    const TITLES = { customer: { add: "Novo Cliente", edit: "Editar Cliente" }, supplier: { add: "Novo Fornecedor", edit: "Editar Fornecedor" }, sale: { add: "Nova Venda", edit: "Editar Venda" } };
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {mobile && <div style={{ padding: "12px 0 2px", display: "flex", justifyContent: "center" }}><div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} /></div>}
        <div style={{ padding: mobile ? "10px 20px 16px" : "22px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.text }}>{TITLES[drawer.type][drawer.mode]}</div>
          <button onClick={closeDrawer} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub, display: "flex", padding: 4 }}><Ico d={I.x} size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "16px 20px" : "20px 24px" }}>
          {drawer.type === "customer" && <><Inp label="Nome" value={form.nome} onChange={(v) => setF("nome", v)} /><Inp label="E-mail" value={form.email} onChange={(v) => setF("email", v)} type="email" /><Inp label="Telefone" value={form.telefone} onChange={(v) => setF("telefone", maskPhone(v))} placeholder="(00) 00000-0000" /><Inp label="Cidade" value={form.cidade} onChange={(v) => setF("cidade", v)} /></>}
          {drawer.type === "supplier" && <><Inp label="Razão Social" value={form.razaoSocial} onChange={(v) => setF("razaoSocial", v)} /><Inp label="CNPJ" value={form.cnpj} onChange={(v) => setF("cnpj", maskCNPJ(v))} placeholder="00.000.000/0001-00" /><Inp label="Contato" value={form.contato} onChange={(v) => setF("contato", v)} /><Sel label="Categoria" value={form.categoria} onChange={(v) => setF("categoria", v)} opts={["Distribuidora", "Logística", "Fabricante", "Representante", "Outro"]} /></>}
          {drawer.type === "sale" && <><Sel label="Cliente" value={form.cliente} onChange={(v) => setF("cliente", v)} opts={customers.map((c) => c.nome)} /><Inp label="Produto" value={form.produto} onChange={(v) => setF("produto", v)} /><Inp label="Quantidade" value={form.qtd} onChange={(v) => setF("qtd", v)} type="number" /><Inp label="Valor Unitário (R$)" value={form.valorUnit} onChange={(v) => setF("valorUnit", v)} type="number" /><Inp label="Data" value={form.data} onChange={(v) => setF("data", v)} type="date" /><Sel label="Status" value={form.status} onChange={(v) => setF("status", v)} opts={["Pendente", "Concluída", "Cancelada"]} /></>}
        </div>
        <div style={{ padding: mobile ? "12px 20px 28px" : "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: mobile ? "column" : "row", gap: 8 }}>
          <Btn onClick={save} full={mobile}>Salvar</Btn>
          <Btn onClick={closeDrawer} variant="ghost" full={mobile}>Cancelar</Btn>
        </div>
      </div>
    );
  };

  // ── Floating chat button ────────────────────────────────────────────────────
  const ChatFAB = () => (
    <button onClick={() => setChatOpen(o => !o)}
      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.07)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      style={{
        position: "fixed", bottom: mobile ? 72 : 32, right: mobile ? 16 : 32,
        width: 52, height: 52, borderRadius: 14, border: "none", cursor: "pointer",
        background: chatOpen ? C.sub : "linear-gradient(135deg, #0071E3 0%, #9B59B6 100%)",
        boxShadow: chatOpen ? "none" : "0 4px 20px rgba(0,113,227,0.38)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 40, transition: "transform .15s, box-shadow .15s, background .15s",
      }}>
      {hasUrgent && !chatOpen && (
        <div style={{ position: "absolute", top: -3, right: -3, width: 13, height: 13, background: C.red, borderRadius: "50%", border: "2px solid white" }} />
      )}
      <Ico d={chatOpen ? I.x : I.spark} size={22} />
    </button>
  );

  // ── Insight alert bar (top of dashboard) ───────────────────────────────────
  const AlertBar = () => {
    const urgent = insights.filter(i => i.urgent || i.overdue);
    if (!urgent.length) return null;
    return (
      <div style={{ background: "#FFF4E5", border: "1px solid #FFD580", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🚨</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>Ação necessária hoje</div>
          {urgent.map(i => (
            <div key={i.cliente} style={{ fontSize: 13, color: "#92400E" }}>
              <strong>{i.cliente}</strong> — pedido esperado {i.overdue ? "ATRASADO" : `em ${i.daysUntil} dia(s)`} · Sugestão: {i.avgQtd} un. de {i.topProduct}
            </div>
          ))}
        </div>
        <button onClick={() => setChatOpen(true)} style={{ marginLeft: "auto", background: C.orange, border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: C.white, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
          Ver com NOVA
        </button>
      </div>
    );
  };

  // ── Gate de autenticação ────────────────────────────────────────────────────
  if (!authReady)  return <Splash />;
  if (!session)    return <Login />;
  if (loadingData) return <Splash label="Carregando seus dados…" />;

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (mobile) {
    const action = ADD_ACTIONS[sec];
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", background: C.bg, minHeight: "100vh" }}>
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
          * { -webkit-tap-highlight-color: transparent; }
        `}</style>
        <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, zIndex: 10, background: "rgba(245,245,247,0.92)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico d={I.bolt} size={13} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>SalesFlow</span>
            {hasUrgent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub, fontSize: 13, fontFamily: "inherit", padding: "6px 4px" }}>Sair</button>
            <button onClick={() => setShowSearch(!showSearch)} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub, padding: 6, display: "flex" }}><Ico d={I.search} size={20} /></button>
            {action && <button onClick={() => openDrawer(action.type, "add")} style={{ background: C.blue, border: "none", cursor: "pointer", color: C.white, borderRadius: 8, padding: "6px 12px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}><Ico d={I.plus} size={14} /> Novo</button>}
          </div>
        </header>
        {showSearch && (
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 9, background: "rgba(245,245,247,0.96)", backdropFilter: "blur(20px)", padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.sub, display: "flex" }}><Ico d={I.search} size={14} /></span>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar em todos os campos…" style={{ width: "100%", padding: "9px 9px 9px 30px", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, color: C.text, background: C.white, outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
        )}
        <div style={{ paddingTop: showSearch ? 116 : 56, paddingBottom: 80 }}>
          <div style={{ padding: "20px 16px" }}>
            {sec === "dashboard" && (
              <div>
                {renderHeader("Visão Geral", "Resumo de atividade")}
                <AlertBar />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
                  {[
                    { title: "Clientes", value: customers.length, sub: "cadastrados", accent: C.blue },
                    { title: "Fornecedores", value: suppliers.length, sub: "cadastrados", accent: C.sub },
                    { title: "Vendas", value: sales.length, sub: "registradas", accent: C.green },
                    { title: "Volume", value: brl(totalVendas), sub: "em vendas", accent: C.orange },
                  ].map((card) => (
                    <div key={card.title} style={{ background: C.white, borderRadius: 14, padding: "16px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{card.title}</div>
                      <div style={{ fontSize: card.title === "Volume" ? 16 : 26, fontWeight: 700, color: card.accent, letterSpacing: -0.5, lineHeight: 1 }}>{card.value}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 5 }}>{card.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 14 }}>Últimas vendas</div>
                {renderMobileList(COLS_DASH, [...sales].reverse().slice(0, 3), "sale")}
              </div>
            )}
            {sec === "customers" && <div>{renderHeader("Clientes", `${customers.length} cadastrados`)}{renderList(COLS.customers, filter(customers), "customer")}</div>}
            {sec === "suppliers" && <div>{renderHeader("Fornecedores", `${suppliers.length} cadastrados`)}{renderList(COLS.suppliers, filter(suppliers), "supplier")}</div>}
            {sec === "sales"     && <div>{renderHeader("Vendas", `${sales.length} registros · ${brl(totalVendas)}`)}{renderList(COLS.sales, filter(sales), "sale")}</div>}
          </div>
        </div>
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderTop: `1px solid ${C.border}`, display: "flex", height: 60, paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setSec(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: sec === n.id ? C.blue : C.sub, transition: "color .15s" }}>
              <span style={{ opacity: sec === n.id ? 1 : 0.55, display: "flex" }}><Ico d={n.icon} size={22} /></span>
              <span style={{ fontSize: 10, fontWeight: sec === n.id ? 600 : 400 }}>{n.short}</span>
            </button>
          ))}
        </nav>
        <ChatFAB />
        {chatOpen && <ChatPanel salesData={{ customers, suppliers, sales }} insights={insights} onClose={() => setChatOpen(false)} mobile />}
        {drawer && (
          <>
            <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 30 }} />
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxHeight: "90vh", background: C.white, borderRadius: "20px 20px 0 0", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)", zIndex: 31, display: "flex", flexDirection: "column", animation: "slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
              {renderDrawerContent()}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", background: C.bg, overflow: "hidden" }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
      <aside style={{ width: 220, flexShrink: 0, background: "rgba(255,255,255,0.84)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "22px 12px 18px" }}>
        <div style={{ padding: "0 4px 18px", marginBottom: 12, borderBottom: `1px solid ${C.sep}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Ico d={I.bolt} size={15} /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>SalesFlow</div>
              <div style={{ fontSize: 11, color: C.sub }}>Gestão Comercial</div>
            </div>
          </div>
        </div>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.sub, display: "flex" }}><Ico d={I.search} size={13} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" style={{ width: "100%", padding: "7px 8px 7px 28px", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg, outline: "none", fontFamily: "inherit" }} />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setSec(n.id)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 12px", borderRadius: 8, background: sec === n.id ? "#0071E318" : "transparent", border: "none", cursor: "pointer", color: sec === n.id ? C.blue : C.sub, fontSize: 14, fontWeight: sec === n.id ? 600 : 400, fontFamily: "inherit", textAlign: "left", transition: "all .12s" }}>
              <span style={{ opacity: sec === n.id ? 1 : 0.65, display: "flex" }}><Ico d={n.icon} /></span>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ borderTop: `1px solid ${C.sep}`, paddingTop: 12, paddingLeft: 4 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email}</div>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Sair</button>
        </div>
      </aside>
      <main style={{ flex: 1, overflowY: "auto", padding: "40px 44px" }}>
        {sec === "dashboard" && (
          <div>
            {renderHeader("Visão Geral", "Resumo de atividade comercial")}
            <AlertBar />
            <div style={{ display: "flex", gap: 14, marginBottom: 36, flexWrap: "wrap" }}>
              {[
                { title: "Clientes",      value: customers.length,      sub: "cadastrados", accent: C.blue },
                { title: "Fornecedores",  value: suppliers.length,      sub: "cadastrados", accent: C.sub },
                { title: "Vendas",        value: sales.length,          sub: "registradas", accent: C.green },
                { title: "Volume Total",  value: brl(totalVendas),      sub: "em vendas",   accent: C.orange },
              ].map((card) => (
                <div key={card.title} style={{ background: C.white, borderRadius: 14, padding: "20px 22px", border: `1px solid ${C.border}`, flex: 1, minWidth: 130 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>{card.title}</div>
                  <div style={{ fontSize: card.title === "Volume Total" ? 20 : 28, fontWeight: 700, color: card.accent, letterSpacing: -0.8, lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>{card.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 14 }}>Últimas vendas</div>
            {renderTable(COLS_DASH, [...sales].reverse().slice(0, 3), "sale")}
          </div>
        )}
        {sec === "customers" && <div>{renderHeader("Clientes", `${customers.length} cadastrados`, () => openDrawer("customer", "add"), "+ Novo Cliente")}{renderTable(COLS.customers, filter(customers), "customer")}</div>}
        {sec === "suppliers" && <div>{renderHeader("Fornecedores", `${suppliers.length} cadastrados`, () => openDrawer("supplier", "add"), "+ Novo Fornecedor")}{renderTable(COLS.suppliers, filter(suppliers), "supplier")}</div>}
        {sec === "sales"     && <div>{renderHeader("Vendas", `${sales.length} registros · ${brl(totalVendas)}`, () => openDrawer("sale", "add"), "+ Nova Venda")}{renderTable(COLS.sales, filter(sales), "sale")}</div>}
      </main>
      <ChatFAB />
      {chatOpen && <ChatPanel salesData={{ customers, suppliers, sales }} insights={insights} onClose={() => setChatOpen(false)} mobile={false} />}
      {drawer && (
        <>
          <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 20 }} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 380, background: C.white, boxShadow: "-4px 0 28px rgba(0,0,0,0.08)", zIndex: 21, animation: "slideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
            {renderDrawerContent()}
          </div>
        </>
      )}
    </div>
  );
}
