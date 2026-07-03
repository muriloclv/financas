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
- [ ] **Salário:** digitar `5587,22` → deve virar `R$ 5.587,22`.
- [ ] **Salário:** digitar `500` → deve virar `R$ 500,00`.
- [ ] **Demais Proventos:** digitar `1200,5` → deve virar `R$ 1.200,50`.
- [ ] **Saldo em Conta:** digitar `-300` → deve virar `-R$ 300,00` (aceita negativo).
- [ ] **Saldo em Conta:** digitar `1000` → deve virar `R$ 1.000,00`.
- [ ] Após formatar, o card **Sobra do Mês** recalcula corretamente.

### Tabelas de gastos (Gastos Fixos, Cartão, IA)
- [ ] Adicionar um item com valor `824,04` → na coluna Valor aparece `R$ 824,04`.
- [ ] Editar o valor de uma linha para `1250` → ao sair do campo vira `R$ 1.250,00`.
- [ ] O **total** da seção (badge no cabeçalho) atualiza junto e bate a soma.

### Investimentos
- [ ] Adicionar investimento com valor `500` → aparece `R$ 500,00`.
- [ ] Editar para `2192` → vira `R$ 2.192,00`.

### Cards personalizados
- [ ] Criar um novo card com valor `300` → mostra `R$ 300,00`.
- [ ] Editar o valor inline para `450,9` → vira `R$ 450,90`.

### Verificação geral
- [ ] Recarregar a página (F5) e reabrir o mês: todos os valores continuam formatados.
- [ ] Nenhum erro no Console do navegador (F12 → aba Console).

---

## ✅ Item 2 — Botão de editar parcela nas linhas

**Regra:** toda linha das tabelas **Gastos Fixos**, **Cartão** e **IA** ganha um botão ✎
(lápis) que abre um modal para editar a parcela. Investimentos **não** tem esse botão.

### Botão e modal
- [ ] Em cada linha de Gastos Fixos há 3 botões: ✎ (parcela), ✓ (pago), × (remover).
- [ ] A tabela de **Investimentos** NÃO mostra o botão ✎ (só × de remover).
- [ ] Clicar no ✎ abre o modal "Editar Parcela" mostrando o nome do item.

### Editar parcela existente
- [ ] Abrir o ✎ de um item já parcelado (ex.: 3/12): o modal vem com "Parcelado?" marcado
      e os campos preenchidos (Atual=3, De=12).
- [ ] Mudar Atual para `5` e salvar → o selo na linha vira `5/12`.

### Ativar/desativar parcelamento
- [ ] Abrir o ✎ de um item comum (sem parcela): "Parcelado?" vem desmarcado e os campos escondidos.
- [ ] Marcar "Parcelado?" → aparecem os campos Atual/De. Preencher `1` e `10`, salvar → selo vira `1/10`.
- [ ] Reabrir um item parcelado, desmarcar "Parcelado?" e salvar → o selo vira `—`.

### Validações
- [ ] Colocar Atual `8` e De `3` e salvar → total é corrigido para no mínimo o valor atual (8/8).
- [ ] Botão **Cancelar** (ou tecla Esc) fecha sem alterar nada.
- [ ] Tecla **Enter** dentro do modal salva.
- [ ] Recarregar a página: a parcela editada persiste (salva no Supabase).

---

## ✅ Item 3 — Cards "Já Pago" e "A Pagar" (Gastos Fixos)

**Regra:** nos cards do topo, além de "Total de Gastos", há 2 novos cards:
**Gastos Fixos · Já Pago** (verde) e **Gastos Fixos · A Pagar** (dourado).
- Já Pago = soma das linhas de Gastos Fixos marcadas com ✓.
- A Pagar = Total de Gastos − Já Pago.

### Testes
- [ ] Com nenhum item pago: Já Pago = `R$ 0,00` e A Pagar = igual ao Total de Gastos.
- [ ] Marcar ✓ em um item de `R$ 500,00` → Já Pago sobe `R$ 500,00` e A Pagar desce `R$ 500,00`.
- [ ] Marcar todos os itens como pagos → Já Pago = Total e A Pagar = `R$ 0,00`.
- [ ] Desmarcar um item → os valores voltam corretamente.
- [ ] Editar o valor de um item já pago → Já Pago e A Pagar recalculam.
- [ ] Marcar ✓ em itens de **Cartão** ou **IA** NÃO afeta esses cards (são só de Gastos Fixos).
- [ ] Recarregar a página: os valores continuam corretos.

---

## ✅ Item 4 — Menu lateral com abas (novo layout)

**Regra:** há um menu à esquerda com: Gastos Fixos, Contas parceladas e fixas no cartão,
Gastos com IA, Investimentos. A área principal mostra só a aba ativa. Os cards de resumo
ficam sempre no topo. O gráfico fica na aba Gastos Fixos.

### Navegação
- [ ] Ao entrar, a aba **Gastos Fixos** já vem selecionada (destacada em dourado).
- [ ] Clicar em cada item do menu troca o conteúdo mostrado, e só um fica ativo por vez.
- [ ] Os **cards de resumo** (Total, Já Pago, A Pagar, Salário, Proventos, Sobra, Saldo)
      continuam visíveis em **todas** as abas.
- [ ] O **gráfico Comparativo Mensal** aparece só na aba **Gastos Fixos** (abaixo da tabela)
      e é desenhado com a largura correta ao abrir essa aba.
- [ ] A aba do cartão mostra o título "Contas parceladas e fixas no cartão".

### Cálculo (não mudou)
- [ ] Só os **Gastos Fixos** influenciam a Sobra do Mês. Cartão, IA e Investimentos
      continuam consultivos (não entram na conta final).

### Responsivo (celular / tela estreita < 860px)
- [ ] Aparece o botão **☰** no topo à esquerda.
- [ ] Clicar no ☰ abre o menu lateral por cima, com um fundo escurecido (overlay).
- [ ] Clicar num item do menu ou no fundo escuro fecha o menu.
- [ ] No desktop (tela larga) o menu fica fixo à esquerda, sem o botão ☰.

### Verificação geral
- [ ] Trocar de mês (setas do topo) funciona normalmente em qualquer aba.
- [ ] Nenhum erro no Console (F12).

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
- [ ] Abrir a aba **Faturas de Cartão de Crédito** no menu.
- [ ] Preencher "Cartão" (ex.: Nubank), escolher um **PDF** e clicar **Enviar fatura**.
- [ ] Aparece "Enviando…" e depois "✓ Fatura enviada!"; a fatura surge na tabela abaixo.
- [ ] Repetir com uma **imagem** (JPG/PNG) → também deve funcionar.
- [ ] Tentar enviar sem escolher arquivo → mensagem "Selecione um arquivo."
- [ ] Tentar enviar um arquivo não permitido (ex.: .txt) → mensagem "Tipo não permitido."

### Organização por mês + cartão
- [ ] A lista mostra Cartão, nome do Arquivo e data/hora do envio.
- [ ] Trocar para outro mês (setas do topo) → a lista mostra as faturas daquele mês
      (faturas de meses diferentes não se misturam).
- [ ] Enviar 2 cartões diferentes no mesmo mês → ambos aparecem na lista.

### Abrir e remover
- [ ] Clicar no botão **↗** de uma fatura → abre o arquivo numa nova aba do navegador.
- [ ] Clicar no **×** → pede confirmação e, ao confirmar, remove da lista (e do Storage).
- [ ] Recarregar a página: as faturas enviadas continuam lá.

### Observação (fase futura)
- A **IA que lê a fatura** ainda NÃO foi implementada — faremos isso depois, definindo
  juntos o que ela deve filtrar (iFood, combustível, mercado, etc.).
