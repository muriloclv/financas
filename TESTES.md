# 🧪 Roteiro de Testes — Controle Financeiro

Documento de testes das alterações. Cada seção corresponde a um item pedido.
Marque `[x]` conforme for validando. Ambiente: abrir o `index.html` no navegador.

> **Backup:** branch git `backup-2026-07-03` (commit `ab9fb20`). Para reverter tudo:
> `git checkout backup-2026-07-03 -- index.html`

---

## ✅ Item 1 — Formatação automática de moeda (R$ X.XXX,XX)

**Regra:** ao digitar um valor e **sair do campo** (clicar fora ou apertar Tab), ele deve
virar o padrão brasileiro `R$ 1.234,56`. Sempre usar **vírgula** para centavos.

### Cards do topo

- [x] **Salário:** digitar `5587,22` → deve virar `R$ 5.587,22`.
- [x] **Salário:** digitar `500` → deve virar `R$ 500,00`.
- [x] **Demais Proventos:** digitar `1200,5` → deve virar `R$ 1.200,50`.
- [x] **Saldo em Conta:** digitar `-300` → deve virar `-R$ 300,00` (aceita negativo).
- [x] **Saldo em Conta:** digitar `1000` → deve virar `R$ 1.000,00`.
- [x] Após formatar, o card **Sobra do Mês** recalcula corretamente.



### Tabelas de gastos (Gastos Fixos, Cartão, IA)

- [x] Adicionar um item com valor `824,04` → na coluna Valor aparece `R$ 824,04`.
- [x] Editar o valor de uma linha para `1250` → ao sair do campo vira `R$ 1.250,00`.
- [x] O **total** da seção (badge no cabeçalho) atualiza junto e bate a soma.



### Investimentos

- [x] Adicionar investimento com valor `500` → aparece `R$ 500,00`.
- [x] Editar para `2192` → vira `R$ 2.192,00`.



### Cards personalizados

- [x] Criar um novo card com valor `300` → mostra `R$ 300,00`.
- [x] Editar o valor inline para `450,9` → vira `R$ 450,90`.



### Verificação geral

- [x] Recarregar a página (F5) e reabrir o mês: todos os valores continuam formatados.
- [x] Nenhum erro no Console do navegador (F12 → aba Console).

---



## ✅ Item 2 — Botão de editar parcela nas linhas

**Regra:** toda linha das tabelas **Gastos Fixos**, **Cartão** e **IA** ganha um botão ✎
(lápis) que abre um modal para editar a parcela. Investimentos **não** tem esse botão.

### Botão e modal

- [x] Em cada linha de Gastos Fixos há 3 botões: ✎ (parcela), ✓ (pago), × (remover).
- [x] A tabela de **Investimentos** NÃO mostra o botão ✎ (só × de remover).
- [x] Clicar no ✎ abre o modal "Editar Parcela" mostrando o nome do item.



### Editar parcela existente

- [x] Abrir o ✎ de um item já parcelado (ex.: 3/12): o modal vem com "Parcelado?" marcado
  ```
  e os campos preenchidos (Atual=3, De=12).
  ```
- [x] Mudar Atual para `5` e salvar → o selo na linha vira `5/12`.



### Ativar/desativar parcelamento

- [x] Abrir o ✎ de um item comum (sem parcela): "Parcelado?" vem desmarcado e os campos escondidos.
- [x] Marcar "Parcelado?" → aparecem os campos Atual/De. Preencher `1` e `10`, salvar → selo vira `1/10`.
- [x] Reabrir um item parcelado, desmarcar "Parcelado?" e salvar → o selo vira `—`.



### Validações

- [x] ~~Colocar Atual~~ `8` ~~e De~~ `3` ~~e salvar → total é corrigido para 8/8.~~
  ```
  **(comportamento alterado — ver Rodada 2, item C)**
  ```
- [x] Botão **Cancelar** (ou tecla Esc) fecha sem alterar nada.
- [x] Tecla **Enter** dentro do modal salva.
- [x] Recarregar a página: a parcela editada persiste (salva no Supabase).

---



## ✅ Item 3 — Cards "Já Pago" e "A Pagar" (Gastos Fixos)

**Regra:** nos cards do topo, além de "Total de Gastos", há 2 novos cards:
**Gastos Fixos · Já Pago** (verde) e **Gastos Fixos · A Pagar** (dourado).

- Já Pago = soma das linhas de Gastos Fixos marcadas com ✓.
- A Pagar = Total de Gastos − Já Pago.



### Testes

- [x] Com nenhum item pago: Já Pago = `R$ 0,00` e A Pagar = igual ao Total de Gastos.
- [x] Marcar ✓ em um item de `R$ 500,00` → Já Pago sobe `R$ 500,00` e A Pagar desce `R$ 500,00`.
- [x] Marcar todos os itens como pagos → Já Pago = Total e A Pagar = `R$ 0,00`.
- [x] Desmarcar um item → os valores voltam corretamente.
- [x] Editar o valor de um item já pago → Já Pago e A Pagar recalculam.
- [x] Marcar ✓ em itens de **Cartão** ou **IA** NÃO afeta esses cards (são só de Gastos Fixos).
- [x] Recarregar a página: os valores continuam corretos.

---



## ✅ Item 4 — Menu lateral com abas (novo layout)

**Regra:** há um menu à esquerda com: Gastos Fixos, Contas parceladas e fixas no cartão,
Gastos com IA, Investimentos. A área principal mostra só a aba ativa. Os cards de resumo
ficam sempre no topo. O gráfico fica na aba Gastos Fixos.

### Navegação

- [x] Ao entrar, a aba **Gastos Fixos** já vem selecionada (destacada em dourado).
- [x] Clicar em cada item do menu troca o conteúdo mostrado, e só um fica ativo por vez.
- [x] Os **cards de resumo** (Total, Já Pago, A Pagar, Salário, Proventos, Sobra, Saldo)
  ```
  continuam visíveis em **todas** as abas.
  ```
- [x] O **gráfico Comparativo Mensal** aparece só na aba **Gastos Fixos** (abaixo da tabela)
  ```
  e é desenhado com a largura correta ao abrir essa aba.
  ```
- [x] A aba do cartão mostra o título "Contas parceladas e fixas no cartão".



### Cálculo (não mudou)

- [x] Só os **Gastos Fixos** influenciam a Sobra do Mês. Cartão, IA e Investimentos
  ```
  continuam consultivos (não entram na conta final).
  ```



### Responsivo (celular / tela estreita < 860px)

- [x] Aparece o botão **☰** no topo à esquerda.
- [x] Clicar no ☰ abre o menu lateral por cima, com um fundo escurecido (overlay).
- [x] Clicar num item do menu ou no fundo escuro fecha o menu.
- [x] No desktop (tela larga) o menu fica fixo à esquerda, sem o botão ☰.



### Verificação geral

- [x] Trocar de mês (setas do topo) funciona normalmente em qualquer aba.
- [x] Nenhum erro no Console (F12).

---



## ✅ Item 5 — Aba "Faturas de Cartão de Crédito" (upload)

> ⚠️ **ANTES DE TESTAR:** rode o script `supabase-setup-faturas.sql` no
> Supabase → **SQL Editor** (cole tudo e clique em **Run**). Ele cria a tabela
> `fin_faturas`, o bucket `faturas` e as políticas de acesso. Sem isso, a aba
> mostra a mensagem "Já rodou o script SQL de setup?".



### Passo a passo do Supabase (fazer 1 vez)

1. [ ] Abrir o projeto no [Supabase](https://supabase.com) → **SQL Editor** → **New query**.
2. [ ] Colar o conteúdo de `supabase-setup-faturas.sql` e clicar em **Run**.
3. [ ] Ver a mensagem de sucesso (sem erros em vermelho).
4. [ ] (Opcional) Conferir em **Storage** que existe um bucket chamado `faturas`.



### Upload

- [x] Abrir a aba **Faturas de Cartão de Crédito** no menu.
- [x] Preencher "Cartão" (ex.: Nubank), escolher um **PDF** e clicar **Enviar fatura**.
- [x] Aparece "Enviando…" e depois "✓ Fatura enviada!"; a fatura surge na tabela abaixo.
- [x] Repetir com uma **imagem** (JPG/PNG) → também deve funcionar.
- [x] Tentar enviar sem escolher arquivo → mensagem "Selecione um arquivo."
- [x] Tentar enviar um arquivo não permitido (ex.: .txt) → mensagem "Tipo não permitido."



### Organização por mês + cartão

- [x] A lista mostra Cartão, nome do Arquivo e data/hora do envio.
- [x] Trocar para outro mês (setas do topo) → a lista mostra as faturas daquele mês
  ```
  (faturas de meses diferentes não se misturam).
  ```
- [x] Enviar 2 cartões diferentes no mesmo mês → ambos aparecem na lista.



### Abrir e remover

- [x] Clicar no botão **↗** de uma fatura → abre o arquivo numa nova aba do navegador.
- [x] Clicar no **×** → pede confirmação e, ao confirmar, remove da lista (e do Storage).
- [x] Recarregar a página: as faturas enviadas continuam lá.



### Observação

- A **IA que lê a fatura** foi implementada na **Rodada 4** (ver seção no fim deste
documento): extrai total, vencimento e lançamentos, classificando cada um por categoria
(iFood, mercado, combustível, etc.) com um dicionário editável.

---

---



# 🧪 RODADA 2 — Novas alterações



## A — Campos de valor: só números + limite de R$ 999.999,99

**Regra:** não é possível digitar letras em campos de valor. O máximo é `R$ 999.999,99`
(8 dígitos). Acima disso, aparece um aviso (toast vermelho na base da tela) e o valor
**não é aceito** (o campo volta ao valor anterior).

- [x] Tentar digitar letras em Salário / valor de gasto / investimento / card → letras não entram.
- [x] Digitar `1000000` (um milhão) em qualquer campo de valor → aparece o aviso
  ```
  "Valor máximo permitido: R$ 999.999,99" e o campo volta ao valor anterior.
  ```
- [x] Digitar `999999,99` → é aceito e vira `R$ 999.999,99`.
- [x] Testar o limite em: card de topo (Salário), tabela (Gasto Fixo), Investimento,
  ```
  card personalizado e no formulário "+ Adicionar".
  ```
- [x] Saldo em Conta ainda aceita o sinal de menos (ex.: `-500`).



## B — Card com opção de influenciar a Sobra do Mês

**Regra:** ao criar/editar um card, há a opção "Este card entra no cálculo da Sobra".
Se ligada, você escolhe **+ Soma (receita)** ou **− Subtrai (despesa)**.

- [x] Criar card "BICO" = `R$ 500,00`, marcar influência, escolher **+ Soma** → a
  ```
  **Sobra do Mês** aumenta em R$ 500,00 e o card mostra o selo "↑ Sobra" (verde).
  ```
- [x] Criar card "EXTRA" = `R$ 200,00`, influência **− Subtrai** → a Sobra diminui
  ```
  R$ 200,00 e o card mostra "↓ Sobra" (vermelho).
  ```
- [x] Criar card SEM marcar influência → não altera a Sobra e não tem selo.
- [x] Editar o valor de um card que influencia (inline) → a Sobra recalcula.
- [x] Remover um card que influencia → a Sobra volta ao valor sem ele.
- [x] Recarregar a página: a configuração de influência persiste.



## C — Parcela: erro quando atual > total

**Regra:** no modal de editar parcela, se a parcela atual for maior que o total,
aparece uma mensagem vermelha embaixo e **não salva**.

- [x] Abrir editar parcela, marcar Parcelado, colocar Atual `8` e De `3`, clicar Salvar →
  ```
  mensagem vermelha "Não é possível: a parcela atual é maior que o número de parcelas."
  e o modal continua aberto (não salvou).
  ```
- [x] Corrigir para Atual `3` e De `8` → salva normal (3/8) e a mensagem some.



## D — Modal de parcela não fecha ao clicar fora

- [x] Abrir o modal de editar parcela e clicar **fora** dele (na área escura) → NÃO fecha.
- [x] Fecha apenas clicando em **Cancelar** ou **Salvar**. (A tecla Esc também cancela.)



## E — Sem botão "Pago" em Cartão e Gastos com IA

- [x] Nas linhas de **Contas parceladas e fixas no cartão**: só os botões ✎ (parcela) e × (remover).
- [x] Nas linhas de **Gastos com IA**: só ✎ e ×.
- [x] Em **Gastos Fixos**: continua com ✎, ✓ (pago) e ×.

---

---



# 🧪 RODADA 3 — Layout



## A — Cards do topo reorganizados e uniformes

**Regra:** todos os cards do topo têm o **mesmo tamanho** (grid uniforme), independente
de haver 1, 2 ou 10 cards. Nova ordem:
Saldo em Conta → Salário → Demais Proventos → Total de Gastos →
Gastos Fixos · Já Pago → Gastos Fixos · A Pagar → **Possível Sobra do Mês**.

- [x] Os cards aparecem exatamente nessa ordem.
- [x] Todos os cards têm o mesmo tamanho (largura e altura), alinhados num grid.
- [x] Com poucos cards, eles NÃO ficam gigantes (mantêm o tamanho padrão).
- [x] Criar vários cards personalizados → todos entram no grid com o mesmo tamanho,
  ```
  e o botão "Novo Card" também fica do mesmo tamanho.
  ```
- [x] O card antes chamado "Sobra do Mês" agora se chama **"Possível Sobra do Mês"**
  ```
  (valor fica verde se positivo, vermelho se negativo).
  ```
- [x] O card do saldo agora mostra **"Saldo em Conta"** (nome mais curto).
- [x] No celular, os cards ficam em 2 colunas.



## B — Menu com nomes novos, em linha única

- [x] O menu mostra: Gastos Fixos, **Contas parceladas**, **Gastos com IA**,
  ```
  Investimentos, **Faturas de Cartão**.
  ```
- [x] Cada nome ocupa **uma única linha, sem reticências** (…).
- [x] Os 3 itens consultivos (Contas parceladas, Gastos com IA, Investimentos) têm um
  ```
  **asterisco roxo (\*)** no fim do nome, no lugar do antigo selo "consultivo".
  ```
- [x] Gastos Fixos e Faturas de Cartão NÃO têm o asterisco.



## C — Botão "Replicar para o mês seguinte" em destaque

- [x] O botão tem **borda dourada** e **texto em negrito**, chamando atenção no cabeçalho.
- [x] Ao passar o mouse, ele preenche de dourado.
- [x] Continua funcionando normalmente (replica os dados para o mês seguinte).

---

---



# 🧪 RODADA 4 — IA que lê a fatura do cartão (OpenRouter + Claude)

**Objetivo:** ao enviar uma fatura (PDF ou imagem), uma IA extrai o **total**, a data de
**vencimento** e **todos os lançamentos**, classificando cada um por **categoria**
(Supermercado, Delivery, Transporte, etc.). O filtro agrupa em **2 níveis**
(categoria → estabelecimento), ordenado do **maior gasto** para o menor. Um dicionário
editável (⚙️) ensina a IA a qual categoria cada estabelecimento pertence.

## O que foi alterado

**Arquivos novos**

- `supabase-setup-categorias.sql` — cria a tabela `fin_categorias` (o "dicionário":
  `nome`, `apelidos` jsonb, `ordem`) já populada com 9 categorias e apelidos de exemplo.
- `supabase/functions/ler-fatura/index.ts` — **Edge Function** (roda no servidor do
  Supabase). Baixa o arquivo do bucket `faturas`, carrega o dicionário, chama a
  **OpenRouter** (modelo Claude Sonnet, saída forçada em JSON via `response_format`) e
  grava o resultado em `fin_faturas.analise`. A chave `OPENROUTER_API_KEY` fica só aqui,
  como *secret* — nunca no navegador. Modelo trocável pela env `OPENROUTER_MODEL`.

**`index.html`** (aba "Faturas de Cartão de Crédito")

- Botão de **engrenagem (⚙️)** no cabeçalho → abre o editor do dicionário de categorias.
- Nova coluna **"Análise IA"** na tabela: botão **🤖 Analisar com IA** (chama a Edge
  Function) e, quando pronta, selo **✓ analisada** + botão **Ver**.
- Painel de análise `#fat-analise`: KPIs (total, vencimento, fechamento, cartão), barra de
  **filtro por categoria** e a **árvore categoria → estabelecimento** ordenada por gasto.
- Lançamentos que a IA **chutou** aparecem com selo **"sugerido"**, botão **"✓ é isso"** e
  um seletor de correção — confirmar/corrigir **grava o apelido** no dicionário (a IA
  aprende para as próximas faturas).
- **Modal do editor de categorias** (`#cat-modal-bg`): chips por categoria com
  adicionar/remover apelido, criar categoria nova e excluir categoria.
- CSS e funções JS de apoio (analisarFatura, verAnalise, renderAnalise, addApelido,
  confirmar/corrigirEstabIdx, editor do dicionário).

## Setup do Supabase (fazer 1 vez)

1. [ ] **SQL Editor** → colar `supabase-setup-categorias.sql` → **Run** (cria `fin_categorias`).
2. [ ] **Edge Functions** → *Deploy a new function / Via Editor* → nome **`ler-fatura`** →
       colar o conteúdo de `supabase/functions/ler-fatura/index.ts` → **Deploy**.
3. [ ] **Edge Functions → Secrets** → adicionar `OPENROUTER_API_KEY` com uma chave **nova**
       da OpenRouter (revogar a anterior). (Opcional: `OPENROUTER_MODEL` para trocar o modelo.)
4. [ ] Conferir o ID do modelo em [openrouter.ai/models](https://openrouter.ai/models)
       (padrão `anthropic/claude-sonnet-4.6`).

## Testes — análise da fatura

- [ ] Enviar uma fatura (PDF) e clicar **🤖 Analisar com IA** → aparece "Analisando…" e
      depois o painel com **total** e **vencimento** corretos.
- [ ] Todos (ou quase todos) os **lançamentos** aparecem, agrupados por categoria.
- [ ] **Guardrail:** linhas de "Total/Saldo da fatura anterior", "Pagamento efetuado/recebido"
      e créditos de pagamento **NÃO** aparecem na lista (não são gastos do titular). O
      **total** da fatura continua correto mesmo sem essas linhas.
- [ ] As **categorias** vêm ordenadas por maior gasto; dentro de cada uma, os
      **estabelecimentos** também do maior para o menor.
- [ ] As categorias vêm **fechadas por padrão** (visão minimalista); clicar no cabeçalho
      **expande** para ver gasto por gasto. Clicar de novo fecha.
- [ ] No card principal há um **gráfico de rosca** com a % de cada categoria sobre o total
      de gastos, com legenda (categoria, % e valor) e o total no centro.
- [ ] As cores da rosca batem com as da legenda e cada categoria mantém sua cor.
- [ ] Clicar numa categoria no filtro mostra só ela **já expandida**; "Todas" volta a
      mostrar tudo (fechado).
- [ ] Repetir com uma **imagem** (JPG/PNG) de fatura → também analisa.
- [ ] Recarregar a página e clicar **Ver** → a análise persiste (salva em `fin_faturas.analise`).

## Testes — dicionário e aprendizado (⚙️)

- [ ] Abrir a engrenagem → aparecem as 9 categorias com seus apelidos em chips.
- [ ] Adicionar um apelido (ex.: "Carrefour" em Supermercado) e remover outro → persiste
      ao reabrir o modal.
- [ ] Criar uma categoria nova (ex.: "Pets") e excluí-la → funciona.
- [ ] Um lançamento **desconhecido** vem com selo **"sugerido"**; clicar **"✓ é isso"**
      remove o selo e adiciona o estabelecimento como apelido daquela categoria.
- [ ] Usar o **seletor** para mover um lançamento sugerido para outra categoria → ele muda
      de grupo e o apelido é gravado na categoria escolhida.
- [ ] Analisar de novo uma fatura com o mesmo estabelecimento → agora ele já entra
      classificado (sem o selo "sugerido").

## Segurança

- [ ] A `OPENROUTER_API_KEY` **não** aparece em nenhum lugar do `index.html` (só como secret
      no servidor). Conferir com F12 → nenhuma chave `sk-or-...` no código da página.
- [ ] Nenhum erro no Console (F12) durante a análise.