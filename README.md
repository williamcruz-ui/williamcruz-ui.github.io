# SalesFlow

Aplicativo web de gestão comercial — clientes, fornecedores, vendas e assistente IA (NOVA).
Login com e-mail/senha, banco de dados real (Supabase) e deploy automático (Vercel).

---

## Stack

- **React 18 + Vite** — frontend
- **Supabase** — banco PostgreSQL + autenticação
- **Vercel** — hospedagem + função serverless (proxy da IA) + deploy automático via GitHub

---

## Setup completo (≈15 min)

### 1. Supabase — banco e login

1. No seu projeto Supabase: **SQL Editor → New query**
2. Cole o conteúdo de `schema.sql` e clique em **Run** (cria as tabelas + segurança por usuário)
3. **Authentication → Providers → Email**: deixe habilitado
4. Para login imediato sem confirmar e-mail (recomendado p/ começar):
   **Authentication → Sign In / Providers → Email → desligue "Confirm email"**
5. **Project Settings → API**: copie a **Project URL** e a **anon public key**

### 2. Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha com URL e anon key do passo 1
npm run dev
```
Abre em `http://localhost:5173`. Crie uma conta e teste.

> A NOVA (IA) **não funciona** com `npm run dev` puro, porque depende da função
> serverless. Para testar a IA localmente use `npx vercel dev` (após o passo 3).
> Todo o resto — login, cadastros, vendas — funciona normal no `npm run dev`.

### 3. GitHub

```bash
git init
git add .
git commit -m "SalesFlow v1.0"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/salesflow.git
git push -u origin main
```

### 4. Vercel — deploy automático

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do GitHub
2. Vercel detecta Vite sozinho. Antes de finalizar, em **Environment Variables**, adicione:

   | Nome | Valor | Onde usar |
   |------|-------|-----------|
   | `VITE_SUPABASE_URL` | sua Project URL | navegador |
   | `VITE_SUPABASE_ANON_KEY` | sua anon key | navegador |
   | `ANTHROPIC_API_KEY` | sua chave da Anthropic | **só servidor** |

3. Clique em **Deploy**. Em ~1 min você tem a URL pública.

A partir daqui: **todo `git push` na branch `main` faz deploy automático.**

---

## Sobre a NOVA (assistente IA)

A NOVA usa a API da Anthropic. A chave fica numa função serverless (`api/nova.js`),
nunca no navegador. **É um custo pay-per-use, cobrado por token, separado de qualquer
assinatura Claude.ai.** Pegue uma chave em [console.anthropic.com](https://console.anthropic.com)
(Settings → API Keys) e cole em `ANTHROPIC_API_KEY` na Vercel.

Sem essa chave, o app funciona inteiro — só a NOVA fica indisponível.

---

## Como editar e republicar

1. Edite os arquivos em `src/`
2. `git add . && git commit -m "minha mudança" && git push`
3. A Vercel rebuilda e publica sozinha

---

## Estrutura

```
salesflow/
├── api/
│   └── nova.js              ← função serverless (proxy da IA, guarda a chave)
├── src/
│   ├── App.jsx              ← app principal (CRUD + dashboard + NOVA)
│   ├── Login.jsx            ← tela de login/cadastro
│   ├── supabaseClient.js    ← conexão com o Supabase
│   ├── main.jsx
│   └── index.css
├── schema.sql              ← rode no Supabase
├── .env.example
├── vercel.json
├── vite.config.js
└── package.json
```
