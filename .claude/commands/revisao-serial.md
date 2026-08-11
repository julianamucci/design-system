---
description: Revisão componente a componente nas 5 stacks — serial entre componentes, paralelo dentro de cada um
argument-hint: [slug|continuar|status]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite]
---

# Revisão Serial

Orquestrador **temporário**: percorre os componentes um a um, chama `/quality`
em cada, corrige o que aparece e revalida o contrato do Angular. Some quando a
lista fechar.

## Argumentos

O usuário invocou com: **$ARGUMENTS**

- **`<slug>`** — revisa só esse componente
- **`continuar`** (padrão) — pega o próximo pendente no diário
- **`status`** — só imprime o diário, sem executar nada

---

## Por que serial entre componentes

Paralelismo de agent está liberado no projeto, e ainda assim **aqui é serial de
propósito** — não por custo, por revisabilidade:

- o diff de uma rodada é de um componente, nas 5 stacks, e cabe numa leitura;
- correção em CSS compartilhado atinge todas as stacks, e duas rodadas
  concorrentes no mesmo `docs/shared/styles/nds/` colidem;
- quando algo quebra, a rodada anterior é o suspeito único.

**Dentro do componente, paralelize**: as 5 stacks são independentes na hora de
testar, e é ali que o tempo está.

---

## Diário — `.revisao/estado.json`

Sem ele a revisão não sobrevive a uma sessão. Formato:

```jsonc
{
  "iniciado": "2026-08-11",
  "componentes": {
    "badge":  { "estado": "fechado", "rodada": "2026-08-11", "achados": 0 },
    "button": { "estado": "fechado", "rodada": "2026-08-11", "achados": 3 },
    "alert":  { "estado": "aberto",  "motivo": "decisão da dona sobre token derivado" }
  }
}
```

`estado` é `fechado`, `aberto` (espera decisão) ou ausente (não revisado).
A pasta `.revisao/` é local, não versionada.

---

## Passo 1 — Descobrir e ordenar

Intersecte os slugs das 5 stacks (mesma varredura do `pipeline`, Passo 1).
Ordene por **quantidade de achados no `audit.mjs --all`**, decrescente: começar
pelo pior dá o maior retorno por rodada, e os padrões que aparecem cedo
encurtam as rodadas seguintes.

Componentes com zero achado entram na fila mesmo assim — o auditor julga forma,
e a `/quality` julga conteúdo.

---

## Passo 2 — Por componente (serial)

### 2a. Medir antes

```bash
node scripts/audit.mjs <slug> --json
```

### 2b. Revalidar o contrato do Angular

O `contract_divergent` mede quem declara **a menos**, não quem declara errado.
Hoje são 37 em cada uma das quatro stacks antigas e **zero no Angular** — ou o
Angular está à frente, ou declarou cobertura que as stories não entregam.

Para cada item em `covers` das stories do Angular, confirme que a story
realmente exercita o item do `testes.*` que ela declara. Item declarado e não
verificado é pior que item não declarado: o auditor passa a mentir com aval.

Para cada `coversNotApplicable`, confirme que o motivo continua verdadeiro — o
primitivo pode ter ganhado a capacidade desde então.

### 2c. Chamar a `/quality`

Um `Agent` com o slug e o resultado do scan em mãos. A skill roda o processo
dela inteiro, incluindo a sonda do passo 2f1.

### 2d. Testar em bloco, 5 stacks em paralelo

Só depois de TODAS as correções do componente. Um `Agent` por stack, cada um
rodando a suíte daquele componente em **foreground** (`timeout 600000`).
Re-corrigir só o que falhar; re-rodar só o que falhou.

### 2e. Fechar

- `node scripts/audit.mjs <slug>` de novo — o que sobrou tem que ter motivo
- suítes verdes nas 5
- commit próprio, `fix(<slug>): …`, stage só dos caminhos do componente
- diário atualizado

**Nada fica pendente.** Se algo depender de decisão da dona, pergunte na hora e
marque `aberto` com o motivo — é a única forma legítima de não fechar.

---

## Regras que valem em toda rodada

- **Vanilla é a referência** em divergência de markup, classe ou comportamento.
- **Diagnosticar tudo → corrigir tudo → UM run em bloco.** Sem prova
  bidirecional por default, sem gate por página, sem re-run "para confirmar".
- **Falha intermitente nunca fecha como inexistente** — medir em par contra o
  `HEAD~1`, nunca com `git stash`.
- **Stage só dos próprios caminhos.** Outra sessão pode estar escrevendo.
- Divergência de **API de framework** não se "alinha": vira
  `coversNotApplicable` com motivo, ou override de prop no `translations.json`.

---

## Saída por rodada

```
## <slug> — rodada N de 51

| stack   | audit antes | audit depois | suíte |
|---------|-------------|--------------|-------|
| react   | 3           | 0            | 12/12 |
| …

Corrigido: <o que mudou, em uma linha cada>
Aberto:    <o que espera decisão, com a pergunta>
Commit:    <hash>
```
