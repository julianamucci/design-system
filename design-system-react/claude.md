# Design System React — Guidelines

Siga estritamente as regras em `guidelines/RULES.md` antes de qualquer tarefa.

**Componentes existentes têm prioridade absoluta sobre código inline.** Antes de escrever qualquer elemento HTML (`<div>`, `<button>`, `<table>`, `<kbd>`, etc.), verifique se existe um componente em `./components/ui/` que atenda ao caso. Se existir, use-o — sem exceção.

**Arquitetura**: `guidelines/12-arquitetura-projeto.md` e `STORYBOOK-ARCHITECTURE.md` (Storybook é a interface principal — não o App.tsx).

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
