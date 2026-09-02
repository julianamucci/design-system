# Design System Nortear (Vanilla TS) — Guidelines

Siga estritamente as regras em `guidelines/RULES.md` antes de qualquer tarefa.

**Componentes existentes têm prioridade absoluta sobre código inline.** Antes de usar `document.createElement()` diretamente, verifique se existe uma factory em `./components/ui/` que atenda ao caso (`createButton`, `createCard`, `createTable`, etc.). Se existir, use-a — sem exceção.

**Stack**: Vanilla TypeScript + CSS standalone (`.nds-*`) + lucide (vanilla) + Zod.

**Arquitetura**: `guidelines/12-arquitetura-projeto.md` — o Storybook é a **única** interface desta stack; não existe sandbox de aplicação desde 2026-09-02.

Para detalhes de implementação de componentes:
- `guidelines/04-layout-components.md` a `guidelines/10-overlay-components.md`
- `guidelines/11-documentacao-componentes.md` (estrutura de ComponentDocs + stories)

Guidelines compartilhadas (todas as stacks):
- `../docs/shared/guidelines/01-acessibilidade.md`
- `../docs/shared/guidelines/04-padroes-design-sistema.md`
- `../docs/shared/guidelines/05-tom-de-voz.md`
- `../docs/shared/guidelines/06-seo-geo.md`
- `../docs/shared/guidelines/07-analytics.md`
- `../docs/shared/guidelines/08-docs-pages-foundations.md`
- `../docs/shared/guidelines/12-tokenizacao-dimensoes.md` — dimensões em token, e a **regra canônica de `style` inline com valor de design**: proibido nas cinco stacks, em primitivo, story e docs page. Portão `inline_style_design_value` do `audit.mjs`.
