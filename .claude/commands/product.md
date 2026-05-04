---
description: Sincroniza guidelines com a fonte de verdade — código existente (padrão) ou translations.json gerado pelo ux-writer (--from-content)
argument-hint: <component-slug> [--from-content] [--dry-run]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Sync Guidelines

Você é um auditor de documentação técnica. Garante que as guidelines reflitam a fonte de verdade e que as dev-skills tenham regras atualizadas antes de criar código.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug ou `all`
- **`--from-content`** (opcional) — usa `translations.json` como fonte (fluxo pré-código: ux-writer → product → dev)
- **`--from-code`** (padrão) — usa docs pages implementadas como fonte (fluxo pós-código)
- **`--dry-run`** (opcional) — relata discrepâncias sem corrigir

---

## Dois Modos

### `--from-code` (padrão)

**Quando**: componente tem docs pages implementadas. Código é fonte de verdade.
Fluxo: `*Docs.*` existentes → comparar com guidelines → atualizar guidelines.

### `--from-content`

**Quando**: ux-writer acabou de gerar `translations.json` e guidelines precisam absorver decisões antes do dev.
Fluxo no pipeline: `/ux-writer` → `/product --from-content` → `/dev-{stack}`.

Modo `--from-content` NÃO altera padrões visuais (classes/tipografia/cores) — esses vêm do código via `--from-code`.

---

## Fontes de Verdade

### Modo `--from-code`
1. `design-system-{react,vue,svelte,basecoat}/src/components/docs/{Slug}Docs.*` — implementações
2. `docs/shared/content/{slug}/translations.json` — chaves e locales
3. **Guideline de categoria** (tabela abaixo)

### Modo `--from-content`
1. `docs/shared/content/{slug}/translations.json` — fonte primária
2. `design-system-react/src/components/ui/{slug}.tsx` — extrair variantes/props/sizes
3. **Guideline de categoria** (obrigatório)
4. `docs/shared/guidelines/08-docs-pages-foundations.md` — referência estrutural

### Tabela de categorias

| Categoria | Arquivo |
|---|---|
| Layout | `design-system-react/guidelines/04-layout-components.md` |
| Navegação | `design-system-react/guidelines/05-navigation-components.md` |
| Formulário | `design-system-react/guidelines/06-form-components.md` |
| Feedback | `design-system-react/guidelines/07-feedback-components.md` |
| Display | `design-system-react/guidelines/08-display-components.md` |
| Disclosure | `design-system-react/guidelines/09-disclosure-components.md` |
| Overlay | `design-system-react/guidelines/10-overlay-components.md` |

### Guidelines a atualizar

**Compartilhadas**: `docs/shared/guidelines/{08-docs-pages,01-acessibilidade,05-tom-de-voz,06-seo-geo,07-analytics,09-seguranca-xss,10-performance,11-consistencia-cross-stack}.md`

**Por stack**: `design-system-{react,vue,svelte,basecoat}/guidelines/11-documentacao-componentes.md`

---

## Playbook detalhado

`docs/shared/skill-refs/product-checklists.md` contém:
- Passos 1.1–1.9 do modo `--from-content` (inventário JSON, validação contra guideline de categoria)
- Passos 1.1–1.6 do modo `--from-code` (extração de tipografia, hierarquia HTML, tabelas, badges, navegação)
- Tabelas de output (gaps, discrepâncias, validação i18n)

**Consulte se precisar do detalhe granular**. Para casos típicos, siga o fluxo resumido abaixo.

---

## Fluxo Resumido

### `--from-content`
1. Inventário do JSON (seções, variantes, sizes, props, tokens, testes, SEO, nav)
2. Validar contra guideline de categoria (variantes/estados/props/regras-API/UX writing)
3. Ler guidelines existentes (foco em `11-documentacao-componentes.md` por stack)
4. Tabela de gaps
5. Atualizar guidelines (se não `--dry-run`):
   - `08-docs-pages-foundations.md` (apenas padrão estrutural NOVO)
   - `11-documentacao-componentes.md` por stack (seções, chaves, contagens)
   - `01-acessibilidade.md` (critérios WCAG novos)
   - `06-seo-geo.md` (formato divergente)

### `--from-code`
1. Extrair padrões do código das 4 docs pages (tipografia, HTML, tabelas, badges, navegação)
2. Ler guidelines existentes
3. Tabela de discrepâncias guideline ↔ código
4. Atualizar guidelines (código é fonte de verdade)

---

## Output esperado

Ver `docs/shared/skill-refs/product-checklists.md` (seção "Padrões de Output").

Resumo final:
```
### Gaps detectados: X
### Guidelines atualizadas: Y
### Score: X/10
```

---

## Commit

```bash
git add -A
git commit -m "skill(product): $ARGUMENTS"
```

Modo `--dry-run`: **não commitar**.
