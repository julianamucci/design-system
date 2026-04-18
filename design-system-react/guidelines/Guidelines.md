# Documentação do Design System — Guidelines

Esta documentação está organizada em arquivos separados por escopo para facilitar a navegação e manutenção.

> **Leia primeiro**: [`STORYBOOK-ARCHITECTURE.md`](../STORYBOOK-ARCHITECTURE.md) — referência completa de arquitetura Storybook (Storybook é a interface principal; consulte antes de qualquer tarefa de documentação ou stories).

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

### 1. Fundamentos (React)

- **[01-regras-gerais.md](./01-regras-gerais.md)** - Regras gerais obrigatórias do projeto React (Radix UI, Shadcn/UI, lucide-react)
- **[02-jsx-caracteres-especiais.md](./02-jsx-caracteres-especiais.md)** - Regras para caracteres especiais em JSX
- **[03-sistema-design.md](./03-sistema-design.md)** - Sistema de design, cores, tipografia e temas

### 2. Componentes por Categoria (React / Shadcn/UI)

- **[04-layout-components.md](./04-layout-components.md)** - Aspect Ratio, Card, Resizable, Scroll Area, Separator, Sidebar
- **[05-navigation-components.md](./05-navigation-components.md)** - Breadcrumb, Menubar, Navigation Menu, Pagination, Stepper, Tabs
- **[06-form-components.md](./06-form-components.md)** - Button, Calendar, Checkbox, Form, Input, Label, Radio Group, Select, Slider, Switch, Textarea, Toggle
- **[07-feedback-components.md](./07-feedback-components.md)** - Alert, Alert Dialog, Badge, Progress, Skeleton, Sonner
- **[08-display-components.md](./08-display-components.md)** - Avatar, Carousel, Chart, Table
- **[09-disclosure-components.md](./09-disclosure-components.md)** - Accordion, Collapsible
- **[10-overlay-components.md](./10-overlay-components.md)** - Command, Context Menu, Dialog, Drawer, Dropdown Menu, Hover Card, Popover, Sheet, Tooltip

### 3. Padrões e Práticas (React)

- **[11-documentacao-componentes.md](./11-documentacao-componentes.md)** - Template padronizado para documentação de componentes (14 seções · 4 blocos: Visão Geral, Referência Técnica, Contexto e Qualidade)
- **[12-arquitetura-projeto.md](./12-arquitetura-projeto.md)** - Arquitetura Storybook-centric, estrutura de diretórios, processo de adição de componentes

### 4. Arquitetura e Design Sistema (React)

- **[13-system-design.md](./13-system-design.md)** - Padrões de código, performance, segurança e estratégia de testes

---

## Como Usar

1. Consulte [`STORYBOOK-ARCHITECTURE.md`](../STORYBOOK-ARCHITECTURE.md) antes de qualquer tarefa de stories ou documentação
2. Consulte as **guidelines compartilhadas** (`docs/shared/guidelines/`) para regras transversais (acessibilidade, tokens, SEO, analytics, tom de voz)
3. Consulte as **guidelines React** deste diretório para regras específicas de componentes Shadcn/UI e arquitetura React
4. As regras são cumulativas — todas devem ser seguidas
5. Em caso de dúvida, consulte o arquivo específico do componente ou padrão

---

## Ordem de Prioridade

1. **Regras Gerais** (01) — Aplicam-se a todo o projeto React
2. **JSX e Caracteres Especiais** (02) — Regras de sintaxe obrigatórias
3. **Sistema de Design** (03) — Base visual do projeto
4. **Componentes Específicos** (04-10) — Regras por componente
5. **Acessibilidade** (11-shared) — Sempre obrigatória
6. **Documentação** (11) — Padrão de documentação de componentes
7. **Edições Parciais** (03-shared) — Preservação de conteúdo ao editar
8. **STORYBOOK-ARCHITECTURE.md + Arquitetura** (12) — Storybook é a interface principal; consulte `STORYBOOK-ARCHITECTURE.md` primeiro, depois `12-arquitetura-projeto.md`
9. **Design Sistema** (04-shared) — Implementação prática de tokens CSS
10. **System Design** (13) — Padrões de código, performance, segurança
11. **Tom de Voz** (05-shared) — Personalidade, terminologia e padrões de escrita
12. **SEO e GEO** (06-shared) — Metatags, Schema.org e otimização para buscadores e IAs
13. **Analytics** (07-shared) — Rastreamento de componentes: nomenclatura de eventos e payloads

---

## Manutenção

Ao adicionar novas regras:
- Se a regra se aplica a todas as stacks → adicionar em `docs/shared/guidelines/`
- Se a regra é específica do React/Shadcn/UI → adicionar neste diretório
- Atualizar este `Guidelines.md` se necessário
- Manter a numeração sequencial

Some of the base components you are using may have styling (eg. gap/typography) baked in as defaults.
So make sure you explicitly set any styling information from the guidelines in the generated react to override the defaults.
