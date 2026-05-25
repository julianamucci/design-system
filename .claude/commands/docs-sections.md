---
description: Cria os 15 componentes genéricos de seção de documentação em cada stack — containers estruturais reutilizáveis que garantem layout consistente entre todas as doc pages
argument-hint: [--stack react|vue|svelte|basecoat|all]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Docs Section Components — Stub

> **Status atual**: os 15 section components já existem e estão estabilizados nas 4 stacks. Esta skill é mantida para o caso raro de precisar **recriar do zero** (nova stack, refactor de uma seção). Para mudanças pontuais, edite diretamente os arquivos em `design-system-{stack}/src/components/docs/shared/sections/`.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`--stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Os 15 Containers

| # | Nome | id da seção | Tipo |
|---|---|---|---|
| 1 | `DocsHeader` | — | Estrutural (fora do nav) |
| 2 | `DocsDemonstration` | `demonstracao` | Container + slot |
| 3 | `DocsAnatomy` | `anatomia` | Container + dados |
| 4 | `DocsWhenToUse` | `quando-usar` | Container + dados |
| 5 | `DocsDoDont` | `do-dont` | Container + slots ← crítico (2 grids separados) |
| 6 | `DocsImport` | `importacao` | Container + dados |
| 7 | `DocsVariants` | `variantes` | Container + slots |
| 8 | `DocsStates` | `estados` | Container + dados |
| 9 | `DocsProps` | `propriedades` | Container + dados |
| 10 | `DocsTokens` | `tokens` | Container + dados |
| 11 | `DocsAccessibility` | `acessibilidade` | Container + dados |
| 12 | `DocsRelated` | `relacionados` | Container + dados |
| 13 | `DocsNotes` | `notas` | Container + dados |
| 14 | `DocsAnalytics` | `analytics` | Container + dados |
| 15 | `DocsTestes` | `testes` | Container + dados |

Adicionalmente: `DocsPageLayout` (envolvendo tudo) e `DocsNav` (sidebar sticky) — contam como infraestrutura, não como seção.

---

## Localização dos Arquivos

```
design-system-react/src/components/docs/shared/sections/Docs*.tsx
design-system-vue/src/components/docs/shared/sections/Docs*.vue
design-system-svelte/src/components/docs/shared/sections/Docs*.svelte
nortear-design-system/src/components/docs/shared/sections/Docs*.ts
```

---

## Quando recriar/editar

**Edite arquivos diretamente** se:
- Mudança pontual em uma única seção (ex: adicionar prop, ajustar classe)
- Bug específico em um container existente

**Use esta skill** apenas para:
- Nova stack inteira que precisa receber os 15 containers (improvável)
- Refactor estrutural massivo (quebra de API de todos os containers)

---

## Padrão de implementação

Use `AlertDocs` como referência de como cada container é consumido:
- React: `design-system-react/src/components/docs/AlertDocs.tsx`
- Vue: `design-system-vue/src/components/docs/AlertDocs.vue`
- Svelte: `design-system-svelte/src/components/docs/AlertDocs.svelte`
- Basecoat: `nortear-design-system/src/components/docs/AlertDocs.ts`

Use os section containers existentes da stack como template para criar novos:
- `design-system-{stack}/src/components/docs/shared/sections/DocsAnatomy.{ext}` — container com dados (lista numerada + structureCode)
- `design-system-{stack}/src/components/docs/shared/sections/DocsDoDont.{ext}` — container com slots (dois grids separados, **NUNCA** loop único)

---

## Regras críticas (caso edite)

1. **DocsDoDont**: dois grids separados, um por par. **Nunca** um único grid com loop — produz layout invertido (DO|DO em cima, DON'T|DON'T em baixo).
2. **DocsPageLayout**: aceita `componentSlug` e monta `mountDocsTracking` no root (sem isso analytics não funciona).
3. **DocsNav**: `data-track="nav"` em cada link de seção; `data-track-id="<slug>:nav:<section_id>"`.
4. **DocsAnatomy**: aceita `structureCode` como prop string — a docs page consumidora passa `t('anatomy.structureCode')` (não hardcoded).
5. **Layout de duas colunas com sidebar sticky**: implementado via `DocsPageLayout` — não montar `flex gap-16` manualmente em consumidores.

---

## Commit (se recriar)

```bash
git add -A
git commit -m "skill(docs-sections): $ARGUMENTS"
```
