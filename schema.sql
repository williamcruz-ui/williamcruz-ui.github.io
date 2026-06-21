-- ═══════════════════════════════════════════════════════════════════════════
-- SalesFlow — Schema do banco (rode no Supabase: SQL Editor → New query → Run)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tabelas ──────────────────────────────────────────────────────────────────
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nome       text,
  email      text,
  telefone   text,
  cidade     text,
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  razao_social text,
  cnpj         text,
  contato      text,
  categoria    text,
  created_at   timestamptz default now()
);

create table if not exists sales (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  cliente    text,
  produto    text,
  qtd        numeric,
  valor_unit numeric,
  data       date,
  status     text,
  created_at timestamptz default now()
);

-- ── Row Level Security: cada usuário só enxerga os próprios dados ─────────────
alter table customers enable row level security;
alter table suppliers enable row level security;
alter table sales     enable row level security;

create policy "own_customers" on customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_suppliers" on suppliers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_sales" on sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- OPCIONAL — dados de exemplo (pra NOVA já ter padrões de compra pra analisar)
-- 1) Crie sua conta no app primeiro.
-- 2) Supabase → Authentication → Users → copie seu User UID.
-- 3) Substitua <SEU_USER_ID> abaixo e rode este bloco.
-- ═══════════════════════════════════════════════════════════════════════════
-- insert into customers (user_id, nome, email, telefone, cidade) values
--   ('<SEU_USER_ID>', 'Farmácia Central', 'contato@farmcentral.com', '(11) 3456-7890', 'São Paulo'),
--   ('<SEU_USER_ID>', 'Drogaria Sul',     'sul@drogsul.com',         '(51) 3322-4455', 'Porto Alegre');
--
-- insert into sales (user_id, cliente, produto, qtd, valor_unit, data, status) values
--   ('<SEU_USER_ID>', 'Drogaria Sul', 'Dipirona 500mg', 320, 0.60, current_date - 28, 'Concluída'),
--   ('<SEU_USER_ID>', 'Drogaria Sul', 'Dipirona 500mg', 280, 0.60, current_date - 14, 'Concluída'),
--   ('<SEU_USER_ID>', 'Drogaria Sul', 'Dipirona 500mg', 300, 0.60, current_date - 1,  'Concluída');
