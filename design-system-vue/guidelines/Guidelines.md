# Documentação Shadcn/UI - Guidelines do Projeto

Esta documentação está organizada em arquivos separados por escopo para facilitar a navegação e manutenção.

## Índice de Guidelines

### 1. Fundamentos
- **[01-regras-gerais.md](./01-regras-gerais.md)** - Regras gerais obrigatórias do projeto
- **[02-jsx-caracteres-especiais.md](./02-jsx-caracteres-especiais.md)** - Regras para caracteres especiais em JSX
- **[03-sistema-design.md](./03-sistema-design.md)** - Sistema de design, cores, tipografia e temas

### 2. Componentes por Categoria
- **[04-layout-components.md](./04-layout-components.md)** - Aspect Ratio, Card, Resizable, Scroll Area, Separator, Sidebar
- **[05-navigation-components.md](./05-navigation-components.md)** - Breadcrumb, Menubar, Navigation Menu, Pagination, Stepper, Tabs
- **[06-form-components.md](./06-form-components.md)** - Button, Calendar, Checkbox, Form, Input, Label, Radio Group, Select, Slider, Switch, Textarea, Toggle
- **[07-feedback-components.md](./07-feedback-components.md)** - Alert, Alert Dialog, Badge, Progress, Skeleton, Sonner
- **[08-display-components.md](./08-display-components.md)** - Avatar, Carousel, Chart, Table
- **[09-disclosure-components.md](./09-disclosure-components.md)** - Accordion, Collapsible
- **[10-overlay-components.md](./10-overlay-components.md)** - Command, Context Menu, Dialog, Drawer, Dropdown Menu, Hover Card, Popover, Sheet, Tooltip

### 3. Padrões e Práticas
- **[11-acessibilidade.md](./11-acessibilidade.md)** - Diretrizes WCAG 2.1 AA e acessibilidade
- **[12-documentacao-componentes.md](./12-documentacao-componentes.md)** - Template padronizado para documentação de componentes (15 seções · 4 blocos: Visão Geral, Referência Técnica, Contexto e Qualidade)
- **[14-edicoes-parciais.md](./14-edicoes-parciais.md)** - Preservação de conteúdo em edições parciais

### 4. Arquitetura e Design Sistema
- **[15-arquitetura-projeto.md](./15-arquitetura-projeto.md)** - Estrutura do projeto, roteamento, componentes principais
- **[16-padroes-design-sistema.md](./16-padroes-design-sistema.md)** - Implementação prática de design tokens e padrões visuais
- **[17-system-design.md](./17-system-design.md)** - Arquitetura de software, decisões técnicas, performance e escalabilidade
- **[18-categoria-showcase.md](./18-categoria-showcase.md)** - Estrutura e instruções para páginas Showcase de categorias

### 5. Conteúdo e Linguagem
- **[19-tom-de-voz.md](./19-tom-de-voz.md)** - Tom de voz, personalidade, terminologia e padrões de escrita para interfaces
- **[20-seo-geo.md](./20-seo-geo.md)** - SEO e GEO: metatags, Schema.org e otimização para buscadores e IAs generativas
- **[21-analytics.md](./21-analytics.md)** - Rastreamento de componentes: nomenclatura de eventos, payloads e implementação de analytics

## Como Usar

1. Consulte o **Guidelines.md** (este arquivo) para navegar entre os tópicos
2. Cada arquivo contém regras específicas de seu escopo
3. As regras são cumulativas - todas devem ser seguidas
4. Em caso de dúvida, consulte o arquivo específico do componente ou padrão

## Ordem de Prioridade

1. **Regras Gerais** (01) - Aplicam-se a todo o projeto
2. **JSX e Caracteres Especiais** (02) - Regras de sintaxe obrigatórias
3. **Sistema de Design** (03) - Base visual do projeto
4. **Componentes Específicos** (04-10) - Regras por componente
5. **Acessibilidade** (11) - Sempre obrigatória
6. **Documentação** (12) - Padrão de documentação
7. **Edições Parciais** (14) - Preservação de conteúdo ao editar
8. **Arquitetura** (15) - Estrutura e organização do projeto
9. **Design Sistema** (16) - Implementação prática de tokens
10. **System Design** (17) - Arquitetura de software, decisões técnicas, performance e escalabilidade
11. **Categoria Showcase** (18) - Estrutura de páginas Showcase por categoria
12. **Tom de Voz** (19) - Personalidade, terminologia e padrões de escrita para interfaces
13. **SEO e GEO** (20) - Metatags, Schema.org e otimização para buscadores e IAs generativas
14. **Analytics** (21) - Rastreamento de componentes: nomenclatura de eventos e payloads

## Manutenção

Ao adicionar novas regras:
- Identifique o escopo correto
- Adicione ao arquivo apropriado
- Atualize este Guidelines.md se necessário
- Mantenha a numeração sequencial

 Some of the base components you are using may have styling(eg. gap/typography) baked in as defaults.
So make sure you explicitly set any styling information from the guidelines in the generated react to override the defaults.