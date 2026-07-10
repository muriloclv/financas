// ============================================================================
// Edge Function: ler-fatura
// Lê uma fatura de cartão (PDF ou imagem) com IA via OpenRouter (Claude Sonnet)
// e grava a análise estruturada em public.fin_faturas.analise.
//
// Deploy (painel): Supabase → Edge Functions → Create function → nome "ler-fatura"
//                  → cole este arquivo.
// Secret:          Settings → Edge Functions → Secrets → OPENROUTER_API_KEY = sk-or-...
//                  (opcional) OPENROUTER_MODEL para trocar de modelo sem mexer no código.
//
// O navegador NUNCA vê a OPENROUTER_API_KEY: ela só existe aqui, no servidor.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Variáveis injetadas automaticamente pelo Supabase no ambiente da função:
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Secret que VOCÊ cadastra no painel:
const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
// Modelo (trocável sem editar código). Confirme o ID atual em openrouter.ai/models.
const MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "anthropic/claude-sonnet-4.6";
// Motor de leitura de PDF: "native" = o próprio modelo lê o PDF (melhor precisão p/ Claude,
// cobrado como tokens). Alternativas: "mistral-ocr" ($2/1000 pág) ou "cloudflare-ai" (grátis)
// se você trocar para um modelo sem suporte nativo a PDF.
const PDF_ENGINE = Deno.env.get("PDF_ENGINE") ?? "native";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Formato de saída que a IA é OBRIGADA a devolver (strict json_schema).
const ANALISE_SCHEMA = {
  name: "analise_fatura",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      total:      { type: "number", description: "Valor total da fatura em reais." },
      vencimento: { type: ["string", "null"], description: "Data de vencimento no formato AAAA-MM-DD." },
      fechamento: { type: ["string", "null"], description: "Data de fechamento no formato AAAA-MM-DD, se houver." },
      cartao:     { type: ["string", "null"], description: "Nome/banco/bandeira do cartão, se identificável." },
      lancamentos: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            descricao:      { type: "string", description: "Descrição bruta exatamente como aparece na fatura." },
            estabelecimento:{ type: "string", description: "Nome limpo/normalizado do estabelecimento. Ex: 'IFOOD *IFOOD' -> 'iFood'." },
            categoria:      { type: "string", description: "UMA das categorias fornecidas na lista fixa." },
            valor:          { type: "number", description: "Valor do lançamento em reais (negativo se for estorno/crédito)." },
            data:           { type: ["string", "null"], description: "Data do lançamento AAAA-MM-DD, se houver." },
            parcela:        { type: ["string", "null"], description: "Ex: '1/3' quando parcelado; null caso contrário." },
            sugerido:       { type: "boolean", description: "true se a categoria foi PALPITE da IA (estabelecimento não estava no dicionário); false se casou com um apelido do dicionário." },
          },
          required: ["descricao", "estabelecimento", "categoria", "valor", "data", "parcela", "sugerido"],
        },
      },
    },
    required: ["total", "vencimento", "fechamento", "cartao", "lancamentos"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { fatura_id } = await req.json();
    if (!fatura_id) return json({ error: "fatura_id é obrigatório." }, 400);

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Metadados da fatura
    const { data: fatura, error: fErr } = await sb
      .from("fin_faturas").select("*").eq("id", fatura_id).single();
    if (fErr || !fatura) return json({ error: "Fatura não encontrada." }, 404);

    // 2) Baixa o arquivo do bucket privado e converte para base64
    const { data: blob, error: dErr } = await sb.storage.from("faturas").download(fatura.file_path);
    if (dErr || !blob) return json({ error: "Não foi possível baixar o arquivo: " + dErr?.message }, 500);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const base64 = toBase64(bytes);
    const mime = fatura.mime || guessMime(fatura.file_name);
    const isPdf = mime.includes("pdf") || /\.pdf$/i.test(fatura.file_name || "");

    // 3) Carrega o dicionário de categorias
    const { data: cats } = await sb.from("fin_categorias").select("nome,apelidos").order("ordem");
    const categorias = cats ?? [];
    const listaNomes = categorias.map((c) => c.nome);
    const dicionario = categorias
      .map((c) => `- ${c.nome}: ${(c.apelidos as string[]).join(", ") || "(sem apelidos ainda)"}`)
      .join("\n");

    // 4) Monta o conteúdo (PDF -> file; imagem -> image_url)
    const fileBlock = isPdf
      ? { type: "file", file: { filename: fatura.file_name || "fatura.pdf", file_data: `data:application/pdf;base64,${base64}` } }
      : { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } };

    const prompt = `Você é um extrator de faturas de cartão de crédito brasileiras. Analise o documento e extraia:
- o valor TOTAL da fatura (o total ATUAL a pagar);
- a data de VENCIMENTO (e a de fechamento, se houver);
- o nome/bandeira do cartão;
- APENAS as COMPRAS/GASTOS reais do titular, com descrição, estabelecimento normalizado, valor, data e parcela.

NÃO INCLUA nos "lancamentos" (guardrail — estas linhas NÃO são gastos, são acerto de conta da fatura):
- "Saldo/Total da fatura anterior", "Fatura anterior", "Saldo anterior";
- "Pagamento", "Pagamento efetuado", "Pagamento recebido", "PGTO", "Pgto débito automático";
- Créditos/estornos que se referem a pagamento da fatura anterior;
- Juros, multa, IOF, encargos e anuidade SÓ se o objetivo fosse gasto de consumo — em dúvida, INCLUA encargos como "Outros", mas NUNCA inclua pagamentos e saldo anterior.
Ignore por completo essas linhas: elas não devem aparecer na lista, nem entrar em nenhuma categoria.
O campo "total" continua sendo o total atual da fatura (não somar/subtrair a partir dos lançamentos).

CLASSIFICAÇÃO — para cada lançamento defina "categoria" usando SOMENTE esta lista fixa:
${listaNomes.join(", ")}

DICIONÁRIO (apelido -> categoria). O casamento é por "CONTÉM" (ignore maiúsculas/acentos):
se a descrição contiver o apelido, use a categoria dele e marque "sugerido": false.
${dicionario}

Se o estabelecimento NÃO casar com nenhum apelido, escolha a categoria mais provável da lista fixa
e marque "sugerido": true. Se não houver categoria plausível, use "Outros" com "sugerido": true.
Nunca invente uma categoria fora da lista. Valores em número (ponto decimal), datas em AAAA-MM-DD.`;

    // 5) Chamada à OpenRouter
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://financas.local",
        "X-Title": "Olimpo Finanças",
      },
      body: JSON.stringify({
        model: MODEL,
        // exige que o provider escolhido suporte de fato o response_format:
        provider: { require_parameters: true },
        // p/ PDF, garante a extração pelo motor escolhido (native = Claude lê direto):
        ...(isPdf ? { plugins: [{ id: "file-parser", pdf: { engine: PDF_ENGINE } }] } : {}),
        response_format: { type: "json_schema", json_schema: ANALISE_SCHEMA },
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, fileBlock] }],
      }),
    });

    if (!orRes.ok) {
      const t = await orRes.text();
      return json({ error: `OpenRouter ${orRes.status}: ${t}` }, 502);
    }
    const orData = await orRes.json();
    const raw = orData?.choices?.[0]?.message?.content;
    if (!raw) return json({ error: "Resposta vazia da IA.", debug: orData }, 502);

    let analise;
    try {
      if (typeof raw === "string") {
        const txt = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
        analise = JSON.parse(txt);
      } else {
        analise = raw;
      }
    } catch { return json({ error: "A IA não devolveu JSON válido.", raw }, 502); }

    // 6) Salva a análise na fatura
    const { error: uErr } = await sb.from("fin_faturas").update({ analise }).eq("id", fatura_id);
    if (uErr) return json({ error: "Erro ao salvar análise: " + uErr.message }, 500);

    return json({ ok: true, analise });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

// ─── helpers ────────────────────────────────────────────────────────────────
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
function guessMime(name = ""): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".heic") || n.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}
