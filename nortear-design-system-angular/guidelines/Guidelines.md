# Documentação do Design System — Guidelines (Nortear · Angular)

Esta documentação está organizada em arquivos separados por escopo para facilitar a navegação e manutenção.

> **Stack**: Angular 22 + `@radix-ng/primitives` (headless) + CSS `.nds-*` compartilhado + `lucide` (pacote agnóstico) + Storybook 10 (`@storybook/angular-vite`) + Chromatic. Porta **6010**.

> **Referência cross-stack**: em divergência de markup, classes `.nds-*` ou comportamento, o **Vanilla** está certo e este stack se alinha a ele. O Radix NG 1.x segue a anatomia `Root`/`Trigger`/`Positioner`/`Popup`, a mesma que o stack React usa — na dúvida sobre a **forma** de um primitivo, o React é o parente mais próximo; para **markup e classes**, o Vanilla continua sendo a referência. Divergência de **API de framework** (nome de input, forma de composição, sintaxe de evento) não tem fonte de verdade: registra-se, não se "alinha".

---

## Índice de Guidelines

### Compartilhadas (todas as stacks — React, Vue, Svelte, Vanilla, Angular)

Estas guidelines estão em `docs/shared/guidelines/` e se aplicam a qualquer stack do monorepo.

- **[01-acessibilidade.md](../../docs/shared/guidelines/01-acessibilidade.md)** — Diretrizes WCAG 2.2 AA e acessibilidade
- **[02-alinhamento-botoes.md](../../docs/shared/guidelines/02-alinhamento-botoes.md)** — Alinhamento e hierarquia visual de botões
- **[03-edicoes-parciais.md](../../docs/shared/guidelines/03-edicoes-parciais.md)** — Preservação de conteúdo em edições parciais
- **[04-padroes-design-sistema.md](../../docs/shared/guidelines/04-padroes-design-sistema.md)** — Implementação prática de design tokens e padrões visuais
- **[05-tom-de-voz.md](../../docs/shared/guidelines/05-tom-de-voz.md)** — Tom de voz, personalidade, terminologia e padrões de escrita
- **[06-seo-geo.md](../../docs/shared/guidelines/06-seo-geo.md)** — SEO e GEO: metatags, Schema.org e otimização para buscadores e IAs generativas
- **[07-analytics.md](../../docs/shared/guidelines/07-analytics.md)** — Rastreamento: nomenclatura de eventos, payloads e analytics
- **[08-docs-pages-foundations.md](../../docs/shared/guidelines/08-docs-pages-foundations.md)** — Páginas de fundamentos
- **[09-seguranca-xss.md](../../docs/shared/guidelines/09-seguranca-xss.md)** — Sanitização e injeção de conteúdo
- **[10-performance.md](../../docs/shared/guidelines/10-performance.md)** — Bundle, renderização e carregamento
- **[11-consistencia-cross-stack.md](../../docs/shared/guidelines/11-consistencia-cross-stack.md)** — Divergências entre stacks
- **[12-tokenizacao-dimensoes.md](../../docs/shared/guidelines/12-tokenizacao-dimensoes.md)** — Escadas `--spacing-*` / `--size-*` e altura que não se crava
- **[13-animacao.md](../../docs/shared/guidelines/13-animacao.md)** — Tokens de duração e `prefers-reduced-motion`
- **[14-taxonomia-secoes.md](../../docs/shared/guidelines/14-taxonomia-secoes.md)** — O que entra em Variantes, Estados e Composições

### 1. Fundamentos (Angular)

- **[01-regras-gerais.md](./01-regras-gerais.md)** — Regras gerais obrigatórias (diretivas de atributo, signals, `.nds-*`, `lucide`)
- **[02-template-caracteres-especiais.md](./02-template-caracteres-especiais.md)** — Caracteres especiais em template, blocos `@`, interpolação e `[innerHTML]`
- **[03-sistema-design.md](./03-sistema-design.md)** — Sistema de design, cores, tipografia e temas

### 2. Componentes por Categoria (Angular / `@radix-ng/primitives`)

- **[04-layout-components.md](./04-layout-components.md)** — Aspect Ratio, Card, Resizable, Scroll Area, Separator, Sidebar
- **[05-navigation-components.md](./05-navigation-components.md)** — Breadcrumb, Menubar, Navigation Menu, Pagination, Tabs
- **[06-form-components.md](./06-form-components.md)** — Button, Calendar, Checkbox, Form, Input, Input Group, Input OTP, Label, Radio Group, Select, Slider, Switch, Textarea, Toggle, Toggle Group
- **[07-feedback-components.md](./07-feedback-components.md)** — Alert, Alert Dialog, Badge, Progress, Skeleton, Toaster
- **[08-display-components.md](./08-display-components.md)** — Avatar, Carousel, Chart, Code Block, Table, DataTable
- **[09-disclosure-components.md](./09-disclosure-components.md)** — Accordion, Collapsible
- **[10-overlay-components.md](./10-overlay-components.md)** — Command, Context Menu, Dialog, Drawer, Dropdown Menu, Hover Card, Popover, Sheet, Tooltip

### 3. Padrões e Práticas (Angular)

- **[11-documentacao-componentes.md](./11-documentacao-componentes.md)** — Docs pages: os 16 containers de seção, `TemplateRef` de preview, stories e o painel Code
- **[12-arquitetura-projeto.md](./12-arquitetura-projeto.md)** — Arquitetura Storybook-centric, estrutura de diretórios, configuração de build e processo de adição de componentes

### 4. Arquitetura e Design Sistema (Angular)

- **[13-system-design.md](./13-system-design.md)** — Signals, `hostDirectives`, projeção, ciclo de vida, eventos, performance, segurança e estratégia de testes

---

## Diferenças de escopo frente às outras quatro stacks

Registradas aqui para que ninguém procure seção que não existe:

| Assunto | Situação neste stack |
|---|---|
| `02-…-caracteres-especiais` | Cobre também os blocos `@` e a interpolação `{{ }}`, que são exclusivos do Angular. A parte de `<`/`>`/`&` é a mesma das outras |
| Componente **Stepper** | Não existe neste stack. Só o Vue o tem, e o CSS compartilhado (`nds/stepper.css`) está lá aguardando. Por isso `05-navigation-components.md` não traz a seção |
| Componente **Chart** | Mesma lib das outras stacks (`echarts`), API diferente: um componente com entradas declarativas, sem `ChartContainer` + `buildXOption`. A seção em `08-display-components.md` descreve a forma daqui |
| **DataTable** | Motor de tabela escrito em signals, sem biblioteca de tabela headless. Quatro recursos que o Vanilla tem não existem aqui — listados na própria seção |
| **Validação de formulário** | `@angular/forms`, sem biblioteca de schema. `06-form-components.md` descreve o que existe |
| `12-block-components.md` | Arquivo vazio, como nas outras quatro stacks. Mantido para o conjunto ficar comparável; não há conteúdo de blocos em nenhuma stack |

---

## Como Usar

1. Consulte as **guidelines compartilhadas** (`docs/shared/guidelines/`) para regras transversais
2. Consulte as **guidelines Angular** deste diretório para o idioma do stack
3. As regras são cumulativas — todas devem ser seguidas
4. Em caso de dúvida sobre um componente, o código dele é a fonte: estas guidelines cobrem propósito, estrutura e regras, **não** a API compilável

---

## Ordem de Prioridade

1. **Regras Gerais** (01) — aplicam-se a todo o pacote
2. **Templates e Caracteres Especiais** (02) — sintaxe obrigatória
3. **Sistema de Design** (03) — base visual
4. **Componentes Específicos** (04-10) — regras por componente
5. **Acessibilidade** (01-shared) — sempre obrigatória
6. **Documentação** (11) — padrão das docs pages e stories
7. **Edições Parciais** (03-shared) — preservação de conteúdo ao editar
8. **Arquitetura** (12) — Storybook é a interface principal
9. **Design Sistema** (04-shared) — implementação prática de tokens
10. **System Design** (13) — signals, ciclo de vida, performance, segurança
11. **Tom de Voz** (05-shared)
12. **SEO e GEO** (06-shared)
13. **Analytics** (07-shared)

---

## Manutenção

Ao adicionar novas regras:
- Se a regra se aplica a todas as stacks → `docs/shared/guidelines/`
- Se a regra é específica do Angular → este diretório
- Atualizar este `Guidelines.md` se necessário
- Manter a numeração sequencial e o **mesmo conjunto de nomes de arquivo** das outras quatro stacks: há regra de auditoria que varre `nortear-design-system-*/guidelines/`, e arquivo com nome fora do padrão fica invisível para ela

**Vocabulário morto é reprovado por auditoria.** `node scripts/audit.mjs --all --json`, regra `dead_lib_in_infra`, varre este diretório. `@radix-ng/primitives` é a lib atual deste stack e é exceção legítima — mas escreva sempre **"Radix NG"**, nunca o nome solto, que é a lib que saiu das outras quatro stacks.

**Guideline de componente (04 a 10) não carrega bloco de código.** Regra `code_in_component_guideline`: código em guideline envelhece mais rápido que no componente. Propósito, árvore ASCII, tabelas e regras — o "como" vive no componente, no `translations.json` e na docs page.
