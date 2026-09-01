# Design System Nortear (Angular) — Guidelines

Siga estritamente as regras em `guidelines/RULES.md` antes de qualquer tarefa. Leia o `CLAUDE.md` da raiz primeiro: as convenções cross-stack (conteúdo compartilhado, `.nds-*`, SEO, analytics) valem aqui sem alteração.

**Componentes existentes têm prioridade absoluta sobre markup inline.** Antes de escrever qualquer elemento HTML (`<div>`, `<button>`, `<table>`, `<kbd>`), verifique se existe diretiva ou componente em `./components/ui/` que atenda ao caso. Se existir, use-o — sem exceção.

**Stack**: Angular 22 + `@radix-ng/primitives` (headless) + CSS standalone `.nds-*` + `lucide` (pacote agnóstico) + `@angular/forms`. Zoneless. Porta **6010**.

**Arquitetura**: `guidelines/12-arquitetura-projeto.md` (Storybook é a interface principal; este pacote não tem sandbox).

Para detalhes de implementação de componentes:
- `guidelines/04-layout-components.md` a `guidelines/10-overlay-components.md`
- `guidelines/11-documentacao-componentes.md` (docs pages, containers de seção e stories)
- `guidelines/13-system-design.md` (signals, `hostDirectives`, projeção, ciclo de vida, eventos, testes)

**As armadilhas deste stack** — as doze que já custaram tempo, todas falhando em silêncio — estão distribuídas por assunto:
- build e configuração (`noEmit`/AOT, `compodoc`, pré-empacotamento do Radix NG) → `guidelines/12-arquitetura-projeto.md`
- código do componente (`hostDirectives`, `data-slot` disputado, projeção em `@if`, `input()` no construtor, `(click)` no `host`, diretiva faltando no `imports`) → `guidelines/13-system-design.md`
- stories e docs pages (painel Code, função em `args`) → `guidelines/11-documentacao-componentes.md`
- template (`@`, `{{`, expressão sem globais) → `guidelines/02-template-caracteres-especiais.md`

Guidelines compartilhadas (todas as stacks):
- `../docs/shared/guidelines/01-acessibilidade.md`
- `../docs/shared/guidelines/04-padroes-design-sistema.md`
- `../docs/shared/guidelines/05-tom-de-voz.md`
- `../docs/shared/guidelines/06-seo-geo.md`
- `../docs/shared/guidelines/07-analytics.md`
- `../docs/shared/guidelines/08-docs-pages-foundations.md`
- `../docs/shared/guidelines/09-seguranca-xss.md`
- `../docs/shared/guidelines/12-tokenizacao-dimensoes.md` — dimensões em token, e a **regra canônica de `style` inline com valor de design**: proibido nas cinco stacks, em primitivo, story e docs page. Portão `inline_style_design_value` do `audit.mjs`.

**Pendências**: nenhuma de implementação. As abertas são de conteúdo compartilhado e de auditoria, detalhadas em `../.pipeline-context/_ordem.md`. As lacunas de componente conhecidas (quatro recursos de DataTable, paleta de série sem variante escura, alça de Resizable desabilitada, bridge do Docs tab sem teste) estão registradas nas guidelines das respectivas categorias.
