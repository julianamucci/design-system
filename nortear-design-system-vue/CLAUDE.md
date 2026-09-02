# Design System Vue — Guidelines

Siga estritamente as regras em `guidelines/RULES.md` antes de qualquer tarefa.

**Componentes existentes têm prioridade absoluta sobre código inline.** Antes de escrever qualquer elemento HTML (`<div>`, `<button>`, `<table>`, `<kbd>`, etc.), verifique se existe um componente em `./components/ui/` que atenda ao caso. Se existir, use-o — sem exceção.

**Stack**: Vue 3 + Reka UI + Vee-validate + Pinia + lucide-vue-next + CSS standalone `.nds-*`.

**Arquitetura**: `guidelines/12-arquitetura-projeto.md` e `STORYBOOK-ARCHITECTURE-VUE.md`. O Storybook é a **única** interface desta stack — não existe sandbox de aplicação.

**Comandos**: `npm run storybook` (porta 6007) para desenvolver; `npm run build-storybook` para empacotar — é ele que produz `storybook-static/`, o artefato que o `vercel.json` publica, e é o único portão que compila template SFC e resolve `@import` de CSS. `npm run build` é `vue-tsc -b`: só checa tipos, não emite. Não existem `dev` nem `preview`.

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
