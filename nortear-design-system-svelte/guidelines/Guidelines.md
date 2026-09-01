# Design System Svelte — Guidelines

Stack: **Svelte 5 + Bits UI + lucide-svelte + Zod + Storybook 10**

> **Leia primeiro**: [`RULES.md`](./RULES.md) — as regras que valem em toda interação, e
> [`12-arquitetura-projeto.md`](./12-arquitetura-projeto.md) — Storybook é a interface principal.

---

## Índice de Guidelines

### Compartilhadas (todas as stacks)

Em `docs/shared/guidelines/` — valem para todas as stacks do design system:

- **[01-acessibilidade.md](../../docs/shared/guidelines/01-acessibilidade.md)** — WCAG 2.2 AA
- **[02-alinhamento-botoes.md](../../docs/shared/guidelines/02-alinhamento-botoes.md)** — Hierarquia visual de botões
- **[03-edicoes-parciais.md](../../docs/shared/guidelines/03-edicoes-parciais.md)** — Preservação de conteúdo em edições parciais
- **[04-padroes-design-sistema.md](../../docs/shared/guidelines/04-padroes-design-sistema.md)** — Design tokens e padrões visuais
- **[05-tom-de-voz.md](../../docs/shared/guidelines/05-tom-de-voz.md)** — Tom de voz e terminologia
- **[06-seo-geo.md](../../docs/shared/guidelines/06-seo-geo.md)** — SEO e GEO (Storybook iframe + useSeoEffect)
- **[07-analytics.md](../../docs/shared/guidelines/07-analytics.md)** — Nomenclatura de eventos e payloads
- **[08-docs-pages-foundations.md](../../docs/shared/guidelines/08-docs-pages-foundations.md)** — Fundamentos das docs pages
- **[09-seguranca-xss.md](../../docs/shared/guidelines/09-seguranca-xss.md)** — Sanitização no call site, sem wrapper
- **[10-performance.md](../../docs/shared/guidelines/10-performance.md)** — Bundle, renderização e carregamento
- **[11-consistencia-cross-stack.md](../../docs/shared/guidelines/11-consistencia-cross-stack.md)** — Divergências entre stacks
- **[12-tokenizacao-dimensoes.md](../../docs/shared/guidelines/12-tokenizacao-dimensoes.md)** — Dimensões por token, nunca por estilo inline
- **[13-animacao.md](../../docs/shared/guidelines/13-animacao.md)** — Durações, curvas e movimento reduzido
- **[14-taxonomia-secoes.md](../../docs/shared/guidelines/14-taxonomia-secoes.md)** — As seções canônicas de uma docs page
- **[15-nova-stack.md](../../docs/shared/guidelines/15-nova-stack.md)** — Como nasce uma stack
- **[16-novo-tema.md](../../docs/shared/guidelines/16-novo-tema.md)** — Como nasce um tema de marca
- **[17-componentes-conversacionais.md](../../docs/shared/guidelines/17-componentes-conversacionais.md)** — Família de componentes conversacionais

### 1. Fundamentos (Svelte)

- **[01-regras-gerais.md](./01-regras-gerais.md)** — Regras gerais Svelte 5: runes, Bits UI, lucide-svelte
- **[02-template-caracteres-especiais.md](./02-template-caracteres-especiais.md)** — Caracteres especiais em templates Svelte
- **[03-sistema-design.md](./03-sistema-design.md)** — Tokens CSS e design system no projeto Svelte

### 2. Componentes por Categoria (Bits UI)

- **[04-layout-components.md](./04-layout-components.md)** — Aspect Ratio, Card, Resizable, Scroll Area, Separator, Sidebar
- **[05-navigation-components.md](./05-navigation-components.md)** — Breadcrumb, Menubar, Navigation Menu, Pagination, Stepper, Tabs
- **[06-form-components.md](./06-form-components.md)** — Button, Calendar, Checkbox, Form, Input, Select, Slider, Switch, Textarea
- **[07-feedback-components.md](./07-feedback-components.md)** — Alert, Alert Dialog, Badge, Progress, Skeleton, Sonner
- **[08-display-components.md](./08-display-components.md)** — Avatar, Carousel, Chart, Table
- **[09-disclosure-components.md](./09-disclosure-components.md)** — Accordion, Collapsible
- **[10-overlay-components.md](./10-overlay-components.md)** — Command, Dialog, Drawer, Dropdown Menu, Popover, Sheet, Tooltip

### 3. Padrões e Práticas (Svelte)

- **[11-documentacao-componentes.md](./11-documentacao-componentes.md)** — Template de ComponentDocs Svelte + stories
- **[12-arquitetura-projeto.md](./12-arquitetura-projeto.md)** — Arquitetura Storybook-centric Svelte
- **[13-system-design.md](./13-system-design.md)** — Padrões Svelte 5: runes, stores, $effect, $derived
- **[RULES.md](./RULES.md)** — As regras permanentes do projeto, em resumo

---

## Ordem de Prioridade

1. **Regras Gerais** (01) — runes Svelte 5, Bits UI, lucide-svelte
2. **Caracteres Especiais** (02) — templates Svelte
3. **Sistema de Design** (03)
4. **Componentes** (04–10) — API Bits UI
5. **Acessibilidade** (01-shared) — sempre obrigatória
6. **Documentação** (11) — ComponentDocs + stories Svelte
7. **Edições Parciais** (03-shared)
8. **Arquitetura** (12) — Storybook como interface principal
9. **Design Sistema** (04-shared) — tokens CSS
10. **System Design** (13) — runes, stores, performance
11. **Tom de Voz** (05-shared)
12. **SEO/GEO** (06-shared)
13. **Analytics** (07-shared)

---

## Manutenção

Ao adicionar novas regras:
- Se a regra se aplica a todas as stacks → adicionar em `docs/shared/guidelines/`
- Se a regra é específica do Svelte/Bits UI → adicionar neste diretório
- Atualizar este `Guidelines.md` se necessário

Os primitivos do Bits UI trazem estilos próprios em alguns pontos (espaçamento,
tipografia). Onde eles divergirem do design system, o ajuste vai para a folha
`.nds-*` do componente — nunca para um estilo escrito no template ou na story.
Estilo escrito por fora vence a folha, e a declaração deixa de acompanhar tema,
densidade e escala tipográfica.
