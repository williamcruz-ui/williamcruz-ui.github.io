import { useState } from "react";
import { supabase } from "./supabaseClient";

const C = {
  bg: "#F5F5F7", white: "#FFFFFF", border: "#D2D2D7",
  text: "#1D1D1F", sub: "#6E6E73", blue: "#0071E3", red: "#FF3B30", green: "#34C759",
};

const Bolt = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default function Login() {
  const [mode, setMode]   = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [msg, setMsg]     = useState("");
  const [loading, setLd]  = useState(false);

  const submit = async () => {
    setErr(""); setMsg("");
    if (!email || !pass) { setErr("Preencha e-mail e senha."); return; }
    setLd(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        if (!data.session) {
          setMsg("Conta criada. Verifique seu e-mail para confirmar e depois entre.");
          setMode("login");
        }
        // se a confirmação de e-mail estiver desativada, a sessão já vem pronta
        // e o App troca de tela automaticamente.
      }
    } catch (e) {
      const m = (e.message || "").toLowerCase();
      if (m.includes("invalid login")) setErr("E-mail ou senha incorretos.");
      else if (m.includes("already registered")) setErr("Este e-mail já está cadastrado.");
      else if (m.includes("at least 6")) setErr("A senha precisa ter no mínimo 6 caracteres.");
      else setErr(e.message || "Erro ao autenticar.");
    }
    setLd(false);
  };

  const field = {
    width: "100%", padding: "11px 13px", boxSizing: "border-box",
    border: `1px solid ${C.border}`, borderRadius: 10,
    fontSize: 15, color: C.text, background: C.white,
    outline: "none", fontFamily: "inherit", marginBottom: 12,
    transition: "border-color .15s, box-shadow .15s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, marginBottom: 14, boxShadow: "0 4px 16px rgba(0,113,227,0.32)" }}>
            <Bolt size={26} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>SalesFlow</div>
          <div style={{ fontSize: 14, color: C.sub, marginTop: 3 }}>Gestão Comercial</div>
        </div>

        {/* Card */}
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "26px 24px" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 18 }}>
            {mode === "login" ? "Entrar" : "Criar conta"}
          </div>

          <input type="email" placeholder="E-mail" value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 3px ${C.blue}22`; }}
            onBlur={(e)  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
            style={field} />

          <input type="password" placeholder="Senha" value={pass}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 3px ${C.blue}22`; }}
            onBlur={(e)  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
            style={field} />

          {err && <div style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{err}</div>}
          {msg && <div style={{ fontSize: 13, color: C.green, marginBottom: 12 }}>{msg}</div>}

          <button onClick={submit} disabled={loading}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.82"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: C.blue, color: C.white, fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "inherit", opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </div>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: C.sub }}>
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); setMsg(""); }}
            style={{ background: "none", border: "none", color: C.blue, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
