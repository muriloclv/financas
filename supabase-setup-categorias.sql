-- ============================================================================
-- SETUP — Dicionário de Categorias (classificação dos lançamentos da fatura)
-- Rode no Supabase → SQL Editor (cole tudo e clique em "Run").
-- Seguro rodar mais de uma vez (IF NOT EXISTS / on conflict do nothing).
-- ============================================================================

-- 1) TABELA DO DICIONÁRIO ----------------------------------------------------
--    Cada linha é uma categoria e a lista de "apelidos" (palavras-chave) que
--    a IA usa para encaixar um lançamento nela. O casamento é por "contém":
--    se a descrição da fatura CONTÉM o apelido, cai naquela categoria.
create table if not exists public.fin_categorias (
  nome     text primary key,                    -- "Supermercado", "Delivery"...
  apelidos jsonb   not null default '[]'::jsonb, -- ["Muffato","Amigão","Atacadão"]
  ordem    integer not null default 0,           -- ordem de exibição no editor
  created_at timestamptz not null default now()
);

-- 2) POLÍTICAS (mesmo modelo aberto/anon do restante do app) -----------------
alter table public.fin_categorias enable row level security;

drop policy if exists "fin_categorias_all" on public.fin_categorias;
create policy "fin_categorias_all"
  on public.fin_categorias
  for all
  using (true)
  with check (true);

-- 3) CATEGORIAS INICIAIS -----------------------------------------------------
--    "on conflict do nothing" = não sobrescreve o que você já editou depois.
insert into public.fin_categorias (nome, apelidos, ordem) values
  ('Supermercado', '["Muffato","Amigão","Atacadão","Carrefour","Pão de Açúcar","Assaí"]', 1),
  ('Delivery',     '["iFood","Rappi","Uber Eats"]',                                        2),
  ('Transporte',   '["Uber","99","Shell","Ipiranga","Petrobras","Estacionamento"]',        3),
  ('Assinaturas',  '["Netflix","Spotify","Claude","OpenAI","Amazon Prime","Google"]',      4),
  ('Saúde',        '["Drogasil","Droga Raia","Pague Menos","Farmácia","Ultrafarma"]',      5),
  ('Compras',      '["Amazon","Mercado Livre","Shopee","AliExpress","Magazine Luiza"]',    6),
  ('Casa',         '["Leroy Merlin","Havan","Telha Norte","Enel","Sabesp","Copel"]',       7),
  ('Lazer',        '["Cinemark","Booking","Airbnb","Latam","Gol","Steam"]',                8),
  ('Outros',       '[]',                                                                    99)
on conflict (nome) do nothing;

-- ============================================================================
-- PRONTO. As categorias e os apelidos poderão ser editados pela engrenagem (⚙️)
-- na aba "Faturas de Cartão de Crédito" do app.
-- ============================================================================
