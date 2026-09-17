# Design System Nortear — React

Leia primeiro o [`CLAUDE.md` da raiz](../CLAUDE.md): as convenções cross-stack (conteúdo compartilhado, `.nds-*`, SEO, analytics) e as regras de trabalho valem aqui sem alteração. Este arquivo é ponteiro — o que é operacional mora na guideline do assunto, onde quem procura pelo assunto o encontra.

**Stack**: React 19 + `@base-ui/react` (Vaul no Drawer) + `lucide-react` + CSS `.nds-*`. Porta **6006**.

**Comandos**: `npm run storybook` · `npm run build` é `tsc -b`, sem emitir nada · `npm run build-storybook` empacota, e é o único que resolve `@import` de CSS. Qual rodar para cada mudança está no `CLAUDE.md` da raiz, em "A verificação sai da MUDANÇA".

**Componentes existentes têm prioridade absoluta sobre código inline.** Antes de escrever qualquer elemento HTML (`<div>`, `<button>`, `<table>`, `<kbd>`), verifique se existe um componente em `./src/components/ui/` que atenda ao caso. Se existir, use — sem exceção.

**Onde está cada coisa**:

- o que é **desta stack** → [`guidelines/RULES.md`](guidelines/RULES.md) e a tabela abaixo
- o que vale **nas cinco** → [`../docs/shared/guidelines/`](../docs/shared/guidelines/) — o `RULES.md` aponta a de cada assunto
- o que cada **componente** É — contrato, decisões com data e medição, tokens, peças das cinco stacks → `../docs/shared/prd/<slug>.md`, onde o PRD existe

| `guidelines/` | assunto |
|---|---|
| [`RULES.md`](guidelines/RULES.md) | regras próprias desta stack — comece por aqui |
| [`01-regras-gerais.md`](guidelines/01-regras-gerais.md) | regras gerais de implementação na stack |
| [`02-jsx-caracteres-especiais.md`](guidelines/02-jsx-caracteres-especiais.md) | caracteres especiais no template |
| [`03-sistema-design.md`](guidelines/03-sistema-design.md) | o sistema de design aplicado na stack — cores, tipografia, temas |
| [`04-layout-components.md`](guidelines/04-layout-components.md) | componentes de layout |
| [`05-navigation-components.md`](guidelines/05-navigation-components.md) | componentes de navegação |
| [`06-form-components.md`](guidelines/06-form-components.md) | componentes de formulário |
| [`19-feedback.md`](../docs/shared/guidelines/19-feedback.md) | **a regra da categoria Feedback**, uma vez para as cinco stacks |
| [`20-tabelas.md`](../docs/shared/guidelines/20-tabelas.md) | **a regra da categoria Tabelas** (Table, DataTable), uma vez para as cinco stacks |
| [`21-navegacao.md`](../docs/shared/guidelines/21-navegacao.md) | **a regra da categoria Navegação** (Breadcrumb, Menubar, NavigationMenu, Pagination, Stepper, Tabs), uma vez para as cinco stacks |
| [`08-display-components.md`](guidelines/08-display-components.md) | componentes de exibição |
| [`09-disclosure-components.md`](guidelines/09-disclosure-components.md) | componentes de divulgação |
| [`11-documentacao-componentes.md`](guidelines/11-documentacao-componentes.md) | docs page e stories |
| [`12-arquitetura-projeto.md`](guidelines/12-arquitetura-projeto.md) | arquitetura, build e Storybook |
| [`13-system-design.md`](guidelines/13-system-design.md) | padrões de código |
