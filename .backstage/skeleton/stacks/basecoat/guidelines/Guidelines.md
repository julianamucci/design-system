# Documentação do Design System — Guidelines (Basecoat)

Esta documentação está organizada em arquivos separados por escopo para facilitar a navegação e manutenção.

> **Leia primeiro**: [`STORYBOOK-ARCHITECTURE.md`](../STORYBOOK-ARCHITECTURE.md) — Storybook é a interface principal.

> **Stack**: Vanilla TypeScript + HTML/CSS + Tailwind CSS 4 + lucide (vanilla) + Zod + axe-playwright + Chromatic + Storybook 10 (`@storybook/html-vite`)

---

## Índice de Guidelines

### Compartilhadas (todas as stacks — React, Vue, Svelte, Vanilla)

Estas guidelines estão em `docs/shared/guidelines/` e se aplicam a qualquer stack do monorepo.

- **[01-acessibilidade.md](../../../docs/shared/guidelines/01-acessibilidade.md)** — Diretrizes WCAG 2.2 AA e acessibilidade
- **[02-alinhamento-botoes.md](../../../docs/shared/guidelines/02-alinhamento-botoes.md)** — Alinhamento e hierarquia visual de botões
- **[03-edicoes-parciais.md](../../../docs/shared/guidelines/03-edicoes-parciais.md)** — Preservação de conteúdo em edições parciais
- **[04-padroes-design-sistema.md](../../../docs/shared/guidelines/04-padroes-design-sistema.md)** — Implementação prática de design tokens e padrões visuais
- **[05-tom-de-voz.md](../../../docs/shared/guidelines/05-tom-de-voz.md)** — Tom de voz, personalidade, terminologia e padrões de escrita
- **[06-seo-geo.md](../../../docs/shared/guidelines/06-seo-geo.md)** — SEO e GEO: metatags, Schema.org e otimização para buscadores e IAs generativas
- **[07-analytics.md](../../../docs/shared/guidelines/07-analytics.md)** — Rastreamento de componentes: nomenclatura de eventos, payloads e analytics

### 1. Fundamentos (Basecoat — Vanilla TS)

- **[01-regras-gerais.md](./01-regras-gerais.md)** — Regras gerais obrigatórias do projeto Basecoat (funções TypeScript, DOM, lucide vanilla)
- **[02-template-caracteres-especiais.md](./02-template-caracteres-especiais.md)** — Caracteres especiais em template literals e innerHTML
- **[03-sistema-design.md](./03-sistema-design.md)** — Sistema de design, cores, tipografia e temas

### 2. Componentes por Categoria (Basecoat / Vanilla TS)

- **[04-layout-components.md](./04-layout-components.md)** — Aspect Ratio, Card, Resizable, Scroll Area, Separator, Sidebar
- **[05-navigation-components.md](./05-navigation-components.md)** — Breadcrumb, Menubar, Navigation Menu, Pagination, Stepper, Tabs
- **[06-form-components.md](./06-form-components.md)** — Button, Calendar, Checkbox, Form, Input, Label, Radio Group, Select, Slider, Switch, Textarea, Toggle
- **[07-feedback-components.md](./07-feedback-components.md)** — Alert, Alert Dialog, Badge, Progress, Skeleton, Toast
- **[08-display-components.md](./08-display-components.md)** — Avatar, Carousel, Table
- **[09-disclosure-components.md](./09-disclosure-components.md)** — Accordion, Collapsible
- **[10-overlay-components.md](./10-overlay-components.md)** — Command, Context Menu, Dialog, Drawer, Dropdown Menu, Hover Card, Popover, Sheet, Tooltip

### 3. Padrões e Práticas (Basecoat)

- **[11-documentacao-componentes.md](./11-documentacao-componentes.md)** — Template padronizado para documentação de componentes (14 seções · 4 blocos · Storybook HTML)
- **[12-arquitetura-projeto.md](./12-arquitetura-projeto.md)** — Arquitetura Storybook-centric, estrutura de diretórios, processo de adição de componentes

### 4. Arquitetura e Design Sistema (Basecoat)

- **[13-system-design.md](./13-system-design.md)** — Padrões de código TypeScript, DOM, eventos, performance e estratégia de testes

---

## Como Usar

1. Consulte as **guidelines compartilhadas** (`docs/shared/guidelines/`) para regras transversais (acessibilidade, tokens, SEO, analytics, tom de voz)
2. Consulte as **guidelines Basecoat** deste diretório para regras específicas de Vanilla TS e DOM
3. As regras são cumulativas — todas devem ser seguidas
4. Em caso de dúvida, consulte o arquivo específico do componente ou padrão

---

## Ordem de Prioridade

1. **Regras Gerais** (01) — Aplicam-se a todo o projeto Basecoat
2. **Template e Caracteres Especiais** (02) — Regras de template literals e innerHTML
3. **Sistema de Design** (03) — Base visual do projeto
4. **Componentes Específicos** (04-10) — Regras por componente
5. **Acessibilidade** (01-shared) — Sempre obrigatória
6. **Documentação** (11) — Padrão de documentação de componentes
7. **Edições Parciais** (03-shared) — Preservação de conteúdo ao editar
8. **Arquitetura** (12) — Storybook é a interface principal
9. **Design Sistema** (04-shared) — Implementação prática de tokens CSS
10. **System Design** (13) — Padrões de código, performance, segurança
11. **Tom de Voz** (05-shared) — Personalidade, terminologia e padrões de escrita
12. **SEO e GEO** (06-shared) — Metatags, Schema.org e otimização para buscadores e IAs
13. **Analytics** (07-shared) — Rastreamento de componentes: nomenclatura de eventos e payloads

---

## Manutenção

Ao adicionar novas regras:
- Se a regra se aplica a todas as stacks → adicionar em `docs/shared/guidelines/`
- Se a regra é específica do Basecoat/Vanilla TS → adicionar neste diretório
- Atualizar este `Guidelines.md` se necessário
- Manter a numeração sequencial
