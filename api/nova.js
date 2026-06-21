export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chave GEMINI_API_KEY não configurada no servidor." });
  }

  try {
    const { system, messages } = req.body || {};

    const contents = [];
    if (system) {
      contents.push({ role: "user", parts: [{ text: system }] });
      contents.push({ role: "model", parts: [{ text: "Entendido. Sou a NOVA, assistente comercial do SalesFlow. Como posso ajudar?" }] });
    }
    (messages || []).forEach((m) => {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Erro na API do Gemini." });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
    return res.status(200).json({ content: [{ text }] });
  } catch (e) {
    return res.status(500).json({ error: "Falha ao chamar a IA: " + (e.message || e) });
  }
}
