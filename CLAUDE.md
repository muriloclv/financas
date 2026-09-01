# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

**Olimpo Finanças** — controle financeiro pessoal, PWA instalável, interface toda em
**português do Brasil**. Um único arquivo `index.html` (~3.160 linhas: HTML + CSS + JS
vanilla, sem build, sem framework, sem bundler) servido estaticamente. O backend é
**Supabase** (projeto `xigdzgvingsmqzyxvpfz`), carregado por CDN.

Escreva código, comentários, commits e UI em português. O `index.html` usa **CRLF**;
preserve ao editar por script.

## ⚠️ O banco é produção, com usuários reais

Não existe staging. Há **dois usuários com dados próprios** — um deles não é o dono do
repositório e nunca deve ser tocado. Antes de qualquer mudança de schema:

- Audite com `list_tables` + `pg_policies` **antes** de propor.
- **Só migrações aditivas**: tabela nova, coluna nova com `DEFAULT`/`NULL`. Nunca `DROP`,
  `RENAME` ou troca de tipo em coluna com dado sem um plano de duas fases combinado.
- Mostre o SQL antes de rodar. DDL via `apply_migration` (fica versionado), dados via
  `execute_sql`.
- Toda tabela nova nasce com RLS ligada e a política `own_rows`
  (`auth.uid() = user_id`), senão o dado vaza entre os usuários.
- Confira as contagens por tabela antes e depois de escrever, e relate.
- Prefira resolver no front quando dá o mesmo resultado sem tocar no schema.

**Dados de teste:** use o **ano 2027**, que está livre nas duas contas (os dados reais
vivem em 2026). Limpe depois com `delete ... where user_id=<dono> and ano=2027`.

**Os `.sql` da raiz estão obsoletos — não rode.** `supabase-setup-categorias.sql` e
`supabase-setup-faturas.sql` são de antes do isolamento por usuário: criam políticas
abertas (`using (true)`) e `fin_categorias` com `nome` como PK sozinha. O banco vivo tem
`own_rows` por `auth.uid()` e PK `(nome, user_id)`. Rodar esses arquivos **reabriria os
dados entre os usuários**. Servem só como registro histórico.

## Rodando e verificando

Não há build, lint nem suíte de testes automatizados.

```bash
# servir (file:// não funciona: a extensão do Chrome bloqueia, e o SW exige origem)
python -m http.server 8765 --bind 127.0.0.1

# checar a sintaxe do <script> embutido — o mais perto de um lint que existe aqui
python -c "import io,re;s=io.open('index.html',encoding='utf-8').read();b=re.findall(r'<script>(.*?)</script>',s,re.S);io.open('_app.js','w',encoding='utf-8',newline='\n').write(max(b,key=len))" && node --check _app.js && rm _app.js
```

Ao testar no navegador, **use query string** (`?v=2`) para furar o cache — sem isso o
navegador serve a versão antiga e você depura um arquivo que não é o que está no disco.

`TESTES.md` é um roteiro de teste **manual**, marcado à mão conforme cada item é
validado. Não é executável.

O login é por e-mail e senha reais: **nunca digite a senha do usuário** — peça que ele
mesmo faça o login. Para testar lógica sem tocar no banco, sobrescreva `db.saveSec`,
`db.saveCards` e `db.saveCampos` por funções que só registram o que seria gravado.

## Arquitetura

### Estado e persistência

Tudo gira em torno de um objeto `state` em memória (`secoes`, `prevSecoes`, `campos`,
`cards`, `config`), hidratado por `db.loadMonth(ano, mes)` a cada troca de mês. O objeto
`db` é a **única** fronteira com o Supabase — cinco funções, todas `upsert` com
`onConflict` explícito:

| Função | Tabela | Chave de conflito |
|---|---|---|
| `saveSec(y,m,secao,items)` | `fin_secoes` | `user_id,ano,mes,secao` |
| `saveCampos(y,m,campos)` | `fin_campos` | `user_id,ano,mes` |
| `saveCards(y,m,cards)` | `fin_cards` | `user_id,ano,mes` |
| `saveConfig(key,value)` | `fin_config` | `user_id,key` |
| — | `fin_faturas`, `fin_categorias` | `id` / `user_id,nome` |

Mexer numa dessas chaves quebra o `onConflict` correspondente. Os itens de uma seção são
um **array JSON dentro de uma linha só** — por isso reordenar (arrastar) e replicar são
puro JavaScript, sem schema.

`user_id` tem `default auth.uid()` e FK para `auth.users`; a política `own_rows` cobre
`USING` e `WITH CHECK` nas seis tabelas.

### Armadilhas de dados

- **`mes` é 0-indexado** (0 = Janeiro), igual ao `Date.getMonth()` do JS. Os dados de
  2026 vão de `mes=4` (Maio) a `mes=9` (Outubro).
- **`value` muda de tipo conforme o dono.** Item de seção guarda **número** (`2200`); card
  personalizado guarda **string já formatada** (`"R$ 1.500,00"`). `fmt()` faz
  `Math.abs(n)` — passar um card por ele devolve `R$ NaN`. Use `repVal()`.
- Item de **investimento** tem forma diferente dos demais: `tipo`/`valor`/`data`, não
  `name`/`value`/`obs`.

### Regras de negócio que parecem bug e não são

- **"Total de Gastos" soma apenas a seção `fixas`.** Cartão e Gastos com IA são
  acompanhados à parte, de propósito, e ficam fora do total **e** da Sobra do Mês. Foi
  confirmado com o dono; não "conserte" somando as três seções. A UI mostra isso
  explicitamente (selo "fora do total").
- **Card com `influi: true` entra na conta pelo lado do `sinal`:** `+` é entrada, `−` é
  saída. `recalc()` calcula `entradas` e `saidas` já com eles dentro, e
  `sobra = entradas − saidas`.

### Renderização

Sem framework: `renderSec(secao)`, `renderInvestimentos()`, `renderCC()` (cards),
`recalc()` (os totais das três faixas) e `renderChart()` reescrevem `innerHTML` e são
chamados manualmente após cada mutação. Handlers vão inline no HTML gerado, referenciando
o **índice** do item no array — por isso toda mutação precisa re-renderizar a seção, ou
os índices dos botões apontam para o item errado.

O resumo do topo são três faixas — **Entradas → Saídas → Resultado** — com cor semântica
(verde entra, vermelho sai, dourado resulta), campos editáveis distinguidos dos
calculados por sublinhado tracejado.

### Arrastar para reordenar

`sortable(cont, itemSel, eixo, onEnd)` usa **PointerEvents**, não o drag-and-drop do
HTML5 (que não funciona em celular). Dois gestos, por tipo de ponteiro: **mouse** pega ao
mover 6px; **toque** exige 500ms de pressão, porque ali arrastar o dedo precisa rolar a
lista. Constantes `ARRASTE_ESPERA` / `ARRASTE_FOLGA` / `ARRASTE_LIMIAR` no topo do bloco.

Três detalhes que quebram se removidos: `dragstart` é bloqueado nos containers (senão
arrasta-se o **texto do input**, não a linha, já que os campos de valor fazem `selAll` no
foco); a rolagem no toque é segurada por um `touchmove` **não-passivo** (mudar
`touch-action` no meio do gesto não tem efeito); e o `<tr>` flutuante é reembalado numa
`<table>` própria com as larguras congeladas, porque `<tr>` não renderiza fora de uma
tabela.

### Replicar mês

`openRepModal()` abre a seleção do que replicar; `openPickModal(secao)` escolhe item a
item e **mescla** com o destino (mantidos primeiro, replicados depois). Item do destino
com nome igual a um que está chegando é marcado como duplicado e vem desmarcado. Parcelas
incrementam; concluídas (`atual >= total`) são descartadas. Seção não marcada **não sofre
upsert** — a linha do destino fica intacta.

### Leitura de fatura por IA

`supabase/functions/ler-fatura/index.ts` (Deno) recebe o id da fatura, baixa o arquivo do
bucket `faturas`, manda para a **OpenRouter** (`anthropic/claude-sonnet-4.6`, PDF nativo,
`json_schema` strict) e grava o resultado em `fin_faturas.analise`. A chave
`OPENROUTER_API_KEY` só existe como secret da Edge Function — o navegador nunca a vê.
Modelo e motor de PDF são trocáveis por env (`OPENROUTER_MODEL`, `PDF_ENGINE`).

A IA classifica cada lançamento usando o dicionário de `fin_categorias` (categoria +
apelidos, casamento por "contém") e marca `sugerido: true` quando foi palpite. O editor
de categorias na UI existe para corrigir e ensinar o dicionário.

### PWA

`service-worker.js`: navegação = network-first (cai no cache só offline); assets
same-origin = stale-while-revalidate; **requisições externas — Supabase, CDN, Google
Fonts — não são interceptadas**. Ao mudar o cache, bump `CACHE` (`olimpo-v1`).

## Notas

- `.mcp.json` (servidor MCP do Supabase) e `backup/` são gitignored — um clone novo não
  os tem.
- A aba **Planejamento Financeiro** é placeholder. O que está previsto para ela está em
  `PLANEJAMENTO-FINANCEIRO.md`: **Prometheus**, uma IA consultora com prompt e skills
  guardados no Supabase, chat privado e campos de plano; e uma **Sessão de Viagem** sem
  IA. Nada disso existe em código ainda.
- Combinado e ainda não feito: quando a fatura for lida, os lançamentos devem popular as
  seções automaticamente (destino natural é `cartao`, que não entra no Total de Gastos).
- O fluxo de git é branch por feature e merge na `main` (ex.: `mobile-pwa`,
  `replicacao-seletiva`).
