// Função serverless da Vercel — mantém a chave da Anthropic no servidor.
// O frontend chama /api/nova; a chave NUNCA vai para o navegador.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chave ANTHROPIC_API_KEY não configurada no servidor." });
  }

  try {
    const { system, messages } = req.body || {};

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Erro na API da IA." });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Falha ao chamar a IA: " + (e.message || e) });
  }
}
