# Fixes Pendentes — Pipeline full dialog — 2026-04-29

## Críticos (P0)

### Infraestrutura SEO+GEO (afeta TODAS as docs pages, não só dialog)

- [ ] **`use-seo.ts` ignora `seo.aiSummary`, `seo.aiEntities`, `seo.aiIntent`** — `use-seo.ts:114-128` (todas as 4 stacks). O ux-writer escreve esse conteúdo no `translations.json`, mas o hook só lê `title` e `description` (e injeta `description` como `ai:summary`). Conteúdo GEO morto. **Fix**: estender `use-seo.ts` para injetar `<meta name="ai:summary">`, `<meta name="ai:entities">`, `<meta name="ai:intent">`. Skill: `/seo-geo` (ou ajuste de infra).

- [ ] **JSON-LD ausente nas docs pages** — `use-seo.ts:150-173` só gera `BreadcrumbList` quando `breadcrumb` é passado, e nenhuma DialogDocs passa. Sem `TechArticle`/`SoftwareSourceCode`. **Fix**: passar `breadcrumb={[{name:'Components', item:...}, {name:'Overlay', item:...}, {name:'Dialog'}]}` em `DialogDocs.tsx:214` e equivalentes Vue/Svelte/Basecoat. Considerar JSON-LD `TechArticle` global. Skill: `/seo-geo`.

- [ ] **`seo.title` com sufixo duplicado** — `translations.json:8,355,702` traz `"Dialog — Overlay · Design System"` e o hook adiciona "· Design System" novamente → `<title>` final: `Dialog — Overlay · Design System · Design System`. **Fix**: remover sufixo dos 3 idiomas no translations.json (ou do hook). Skill: `/ux-writer` ou `/seo-geo`.

## Médios (P1)

### Cross-stack — divergências de implementação

- [ ] **Basecoat overlay sem `isolate` nem animação `data-[state]`** — `design-system-basecoat/src/components/ui/dialog.ts:84-85`. React/Vue/Svelte usam `fixed inset-0 isolate z-50 ... data-open:animate-in fade-in-0 data-closed:animate-out fade-out-0 duration-100`; Basecoat só aplica classes estáticas. **Fix**: adicionar `isolate` + classes de animação. Skill: `/cross-stack`.

- [ ] **Basecoat DialogTitle com tipografia divergente** — `dialog.ts:115` usa `text-lg font-semibold leading-none tracking-tight`; outras stacks usam `text-base leading-none font-medium`. **Fix**: alinhar para `text-base leading-none font-medium`. Skill: `/cross-stack`.

- [ ] **Basecoat DialogFooter sem tokens de fundo/borda** — `dialog.ts:138` usa `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`; React/Vue/Svelte usam `-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end`. **Fix**: alinhar classes do footer. Skill: `/cross-stack`.

- [ ] **Svelte composições com naming divergente** — `design-system-svelte/src/components/ui/dialog/dialog-composicoes.stories.ts:23,49,74` exporta `ProfileEdit`, `LongContent`, `InfoOnly`. React/Vue/Basecoat exportam `ConfirmEmail`, `ProfileEdit`, `MediaPreview`. **Fix**: renomear/reescrever para paridade Chromatic. Skill: `/dev-svelte` ou `/cross-stack`.

- [ ] **Estado `Controlled` só em Vue/Svelte** — `dialog-estados.stories.ts:157` (Vue) e `:92` (Svelte) têm 4 stories; React (`dialog-estados.stories.tsx`) e Basecoat (`dialog-estados.stories.ts`) têm 3 (faltam Controlled). **Fix**: decidir 3 ou 4 e alinhar. Skill: `/cross-stack`.

## Baixos (P2)

- [ ] **`seo.aiEntities` incompleta** — falta `lucide` e `tailwind-css` (citados no contexto). `translations.json:11,357,703`. Skill: `/ux-writer`.

- [ ] **Svelte variantes possivelmente enxutas demais** — `design-system-svelte/src/components/ui/dialog/dialog-variantes.stories.ts` tem 138 linhas vs Vue 267 / React 298 / Basecoat 204. Auditar se as 6 stories cobrem os mesmos casos visuais. Skill: `/cross-stack`.

- [ ] **Cobertura de play functions desigual** — todas as 4 stacks têm `play:`, mas tamanhos variam. Verificar paridade dos 7 casos funcionais (trigger open, Escape, overlay click, close-button, focus trap, focus return, controlled). Skill: `/quality`.

---

*11 violações em 1 componente (dialog).*
*3 críticas são de infraestrutura compartilhada (afetam todas as docs pages, não só dialog).*

**Aplicar?**
- [1] críticos (3)
- [2] críticos+médios (8)
- [3] todos (11)
- [4] nenhum
