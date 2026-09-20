# Design System Nortear — Angular

Leia primeiro o [`CLAUDE.md` da raiz](../CLAUDE.md): as convenções cross-stack (conteúdo compartilhado, `.nds-*`, SEO, analytics) e as regras de trabalho valem aqui sem alteração. Este arquivo é ponteiro — o que é operacional mora na guideline do assunto, onde quem procura pelo assunto o encontra.

**Stack**: Angular 22 + `@radix-ng/primitives` (headless) + `lucide` (pacote agnóstico) + `@angular/forms` + CSS `.nds-*`. Zoneless. Porta **6010**.

**Comandos**: `npm run storybook` · `npm run build` é `ngc --noEmit` — o único portão que type-checa template e host binding, sem emitir nada · `npm run build-storybook` empacota, e é o único que resolve `@import` de CSS. Qual rodar para cada mudança está no `CLAUDE.md` da raiz, em "A verificação sai da MUDANÇA".

**Componentes existentes têm prioridade absoluta sobre código inline.** Antes de escrever qualquer elemento HTML (`<div>`, `<button>`, `<table>`, `<kbd>`), verifique se existe diretiva ou componente em `./src/components/ui/` que atenda ao caso. Se existir, use — sem exceção.

**Onde está cada coisa**:

- o que é **desta stack** → [`guidelines/RULES.md`](guidelines/RULES.md) e a tabela abaixo
- o que vale **nas cinco** → [`../docs/shared/guidelines/`](../docs/shared/guidelines/) — o `RULES.md` aponta a de cada assunto
- o que cada **componente** É — contrato, decisões com data e medição, tokens, peças das cinco stacks → `../docs/shared/prd/<slug>.md`, onde o PRD existe

**As armadilhas desta stack** — catorze que já custaram tempo, todas falhando em silêncio — estão distribuídas por assunto:

- build e configuração (`noEmit`/AOT, `compodoc`, pré-empacotamento do Radix NG) → `guidelines/12-arquitetura-projeto.md`
- código do componente (`hostDirectives`, `data-slot` disputado, projeção em `@if`, `input()` no construtor, `(click)` no `host`, diretiva faltando no `imports`) → `guidelines/13-system-design.md`
- stories e docs pages (painel Code, função em `args`) → `guidelines/11-documentacao-componentes.md`
- template (`@`, `{{`, expressão sem globais) → `guidelines/02-template-caracteres-especiais.md`

| `guidelines/` | assunto |
|---|---|
| [`RULES.md`](guidelines/RULES.md) | regras próprias desta stack — comece por aqui |
| [`01-regras-gerais.md`](guidelines/01-regras-gerais.md) | regras gerais de implementação na stack |
| [`02-template-caracteres-especiais.md`](guidelines/02-template-caracteres-especiais.md) | caracteres especiais no template |
| [`03-sistema-design.md`](guidelines/03-sistema-design.md) | o sistema de design aplicado na stack — cores, tipografia, temas |
| [`04-layout-components.md`](guidelines/04-layout-components.md) | componentes de layout |
| [`05-navigation-components.md`](guidelines/05-navigation-components.md) | componentes de navegação |
| [`06-form-components.md`](guidelines/06-form-components.md) | componentes de formulário |
| [`07-feedback-components.md`](guidelines/07-feedback-components.md) | a mecânica de feedback DESTA stack — a regra da categoria está na 19 |
| [`19-feedback.md`](../docs/shared/guidelines/19-feedback.md) | **a regra da categoria Feedback**, uma vez para as cinco stacks |
| [`20-tabelas.md`](../docs/shared/guidelines/20-tabelas.md) | **a regra da categoria Tabelas** (Table, DataTable), uma vez para as cinco stacks |
| [`21-navegacao.md`](../docs/shared/guidelines/21-navegacao.md) | **a regra da categoria Navegação** (Breadcrumb, ContextMenu, DropdownMenu, Menubar, NavigationMenu, Pagination, Stepper, Tabs), uma vez para as cinco stacks |
| [`08-display-components.md`](guidelines/08-display-components.md) | componentes de exibição |
| [`09-disclosure-components.md`](guidelines/09-disclosure-components.md) | componentes de divulgação |
| [`10-overlay-components.md`](guidelines/10-overlay-components.md) | a MECÂNICA de overlay desta stack; as regras da categoria estão na `18-overlay.md` compartilhada |
| [`11-documentacao-componentes.md`](guidelines/11-documentacao-componentes.md) | docs page e stories |
| [`12-arquitetura-projeto.md`](guidelines/12-arquitetura-projeto.md) | arquitetura, build e Storybook |
| [`13-system-design.md`](guidelines/13-system-design.md) | padrões de código |
