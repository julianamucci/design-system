# Layout Components

---

## Aspect Ratio

**Propósito**: manter proporções fixas de mídia independente do tamanho do container.

**API e exemplos**: `src/components/ui/aspect-ratio/aspect-ratio.vue` + stories + `AspectRatioDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Ratios comuns**:

| Ratio | Uso |
|-------|-----|
| `16/9` | vídeos e banners paisagem |
| `1/1` | avatares e thumbnails quadrados |
| `4/3` | imagens de produto e cards de conteúdo |
| `3/4` | imagens de retrato |

**Regras**:
- Sempre que exibir imagem, vídeo ou iframe com proporção conhecida
- Não aplicar tokens de cor diretamente no AspectRatio — estilizar o elemento filho
- Imagens dentro: usar `object-cover` para preencher sem distorcer
- `rounded-md` no elemento filho, não no container
- Usar `ImageWithFallback` (`/components/figma/ImageWithFallback`) para imagens
- Nunca usar `user-scalable=no` no viewport — impede zoom em mobile

**Acessibilidade**:
- Todo conteúdo visual dentro do AspectRatio deve ter alternativa textual
- Imagem informativa: `alt` descritivo do conteúdo, não da aparência
- Imagem decorativa: `alt=""` — leitor de tela ignora
- Vídeo: sempre incluir legendas e transcrição

**Analytics**: container passivo — não dispara eventos.

---

## Card

**Propósito**: agrupar conteúdo relacionado em um container visualmente delimitado. Não usar como decoração ou apenas para criar divisão visual (preferir `Separator` ou espaçamento).

**API e exemplos**: `src/components/ui/card/card.vue` + stories + `CardDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
Card
├── CardHeader
│   ├── CardTitle
│   └── CardDescription
├── CardContent
└── CardFooter
```

**Tokens obrigatórios** (ver `16-padroes-design-sistema.md`):

| Elemento | Token |
|----------|-------|
| Fundo | `bg-card` |
| Texto | `text-card-foreground` |
| Borda | `border-border` |
| Texto secundário (CardDescription) | `text-muted-foreground` |
| Divisor do footer | `border-t border-border` |

**Regras**:
- Quando o conteúdo forma unidade semântica — produto, perfil, artigo, métrica
- Botões dentro do Card devem ter `aria-label` contextual incluindo o identificador do card
- Card inteiramente clicável: usar `<a>` ou `role="button"` com `aria-label` descritivo no container, não apenas `cursor-pointer`
- Imagens dentro: sempre com `alt` adequado

**Acessibilidade**:
- Usar o `CardTitle` como âncora de contexto via `aria-labelledby` ou incluir o título no `aria-label` dos botões — nunca apenas "Excluir"

**UX Writing** (ver `19-tom-de-voz.md`):
- `CardTitle`: substantivo ou frase nominal, sem verbo, sem ponto final
- `CardDescription`: complemento direto do título, máximo 2 linhas, ponto final
- Labels dos botões no footer: verbos no infinitivo, máximo 3 palavras

**Analytics** (ver `21-analytics.md`):
- Rastrear o conteúdo interativo dentro do card — nunca o card em si
- Card inteiramente clicável: `data-track="card_click"` com `data-track-label` idêntico ao `CardTitle` e ao `aria-label`
- Botões dentro: `data-track="button_click"` com `data-track-label` contextual

---

## Resizable

**Propósito**: painéis redimensionáveis pelo usuário via arrasto ou teclado.

**Quando usar**: layouts onde o usuário precisa ajustar proporções — editor com preview, painel lateral com conteúdo, split view.

**API e exemplos**: `src/components/ui/resizable/resizable.vue` + stories + `ResizableDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
ResizablePanelGroup (direction)
├── ResizablePanel (defaultSize, minSize, maxSize)
├── ResizableHandle (withHandle)
└── ResizablePanel
```

**Regras**:
- Sempre definir `minSize` e `maxSize` em todos os painéis — evita colapso acidental
- Sempre definir `defaultSize` — evita layout instável no carregamento inicial

**Acessibilidade** — WCAG 2.5.7 (Dragging Movements, novo no WCAG 2.2):
- Toda ação de arrastar deve ter alternativa por teclado
- O `ResizableHandle` aceita `Arrow keys` nativamente — manter e não sobrescrever
- `aria-label` descritivo no handle explicando a função e o atalho de teclado
- O handle deve ser focável e anunciar ao leitor de tela que é um controle de redimensionamento

**Analytics**: rastrear `panel_resize` com o tamanho final apenas quando o redimensionamento é dado de produto relevante. Usar o callback `onLayout` para capturar o tamanho final após o arrasto.

---

## Scroll Area

**Propósito**: scroll interno customizado dentro de um container de altura fixa, sem rolar a página principal.

**Quando usar**: listas longas em sidebars, conteúdo em overlays, tabelas com altura fixa. Não usar quando o scroll natural da página é suficiente.

**API e exemplos**: `src/components/ui/scroll-area/scroll-area.vue` + stories + `ScrollAreaDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Sempre definir altura específica no container pai — sem isso, o ScrollArea não funciona
- `overflow-hidden` no container pai + `h-full` no ScrollArea
- Não aninhar ScrollAreas — causa scroll duplo e desorientação
- Tabelas dentro de ScrollArea: usar `overflow-x-auto` no wrapper da tabela, não outro ScrollArea

**Acessibilidade**:
- O ScrollArea expõe atributos de rolagem corretamente para tecnologias assistivas
- Para scroll horizontal: adicionar `tabIndex={0}` para que usuários de teclado possam focar e rolar com teclas de direção
- Garantir que o conteúdo dentro é navegável por Tab sem que o scroll quebre o fluxo visual
- Em mobile: preferir scroll nativo da página quando possível — ScrollArea pode dificultar gestos de swipe

**Analytics**: container passivo — não dispara eventos. Para rastrear engajamento com conteúdo longo, usar Intersection Observer no conteúdo interno.

---

## Separator

**Propósito**: divisor visual e semântico entre grupos de conteúdo relacionado.

**Quando usar**: separar grupos de itens em menus, dividir seções em formulários, delimitar áreas em layouts. Não usar apenas como decoração — para divisão puramente visual, usar bordas CSS ou espaçamento (`my-*`, `py-*`).

**API e exemplos**: `src/components/ui/separator/separator.vue` + stories + `SeparatorDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props**:

| Prop | Default | Função |
|------|---------|--------|
| `orientation` | `horizontal` | `horizontal` ou `vertical` |

**Regras**:
- O Separator aplica `role="separator"` e `aria-orientation` automaticamente — não sobrescrever
- Separator semântico (divide conteúdo relacionado): manter o `role="separator"` padrão
- Separator decorativo (apenas visual, sem significado): adicionar `aria-hidden="true"`

**Tokens**: o componente aplica `bg-border` automaticamente via CSS do tema. Não sobrescrever com valores hardcoded.

**Analytics**: elemento estático passivo — não dispara eventos.

---

## Sidebar

**Propósito**: navegação principal persistente da aplicação.

**Quando usar**: aplicações com múltiplas seções ou hierarquias de navegação. Para navegação simples com poucos itens, considerar `NavigationMenu` ou `Tabs`.

**API e exemplos**: `src/components/ui/sidebar/sidebar.vue` + stories + `SidebarDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes** (gerenciada pelo `SidebarProvider` — nunca replicar manualmente):

```
SidebarProvider (no root da aplicação)
├── nav[aria-label="Navegação principal"]
│   └── Sidebar
│       ├── SidebarHeader  (logo — altura igual à navbar)
│       ├── SidebarContent (categorias / Accordion)
│       └── SidebarFooter
└── SidebarInset
    ├── SidebarTrigger     (toggle — visível em mobile)
    └── main#main-content
```

**Regras obrigatórias do projeto**:
- `<nav aria-label="Navegação principal">` envolvendo o `<Sidebar>` — obrigatório
- Altura do `SidebarHeader` igual à altura da navbar
- Ícones apenas no primeiro nível de menu, salvo instrução específica
- Collapsible obrigatório em categorias com subitens
- 280px fixo em desktop (push mode), overlay em mobile — gerenciados pelo SidebarProvider

**Acessibilidade** (ver `11-acessibilidade.md` → "Estrutura acessível da SPA"):
- Item ativo: `aria-current="page"` — anuncia ao leitor de tela qual seção está selecionada
- Botão de toggle: `aria-expanded` + `aria-label` contextual ("Expandir navegação principal" / "Recolher navegação principal")
- Itens com ícone na sidebar colapsada: `aria-label` com o nome da seção — ícone sozinho não é acessível
- Skip link na aplicação aponta para `#main-content`, pulando a sidebar

**UX Writing** (ver `19-tom-de-voz.md`):
- Labels de menu: substantivos ou frases nominais curtas, sem verbo, sem ponto final. Ex: "Componentes", "Design Tokens", "Visão geral"
- `aria-label` do toggle: contextual e descritivo — não apenas "Menu"
- Tooltips de ícones no modo colapsado: nome exato da seção

**Analytics** (ver `21-analytics.md`):
- Clique em item de menu: `navigation_click` com `label` (nome da seção) e `destination` (path)
- A função de navegação deve disparar `page_view` internamente — ver `11-acessibilidade.md` → "Anúncio de mudança de página"
- Não rastrear duplamente: `navigation_click` + `page_view` são eventos distintos com propósitos distintos

**SEO** (ver `20-seo-geo.md`):
- A estrutura `<nav aria-label="Navegação principal">` é lida por crawlers e reforça a arquitetura de informação
- Os itens de menu refletem a hierarquia de conteúdo — manter nomes consistentes com os títulos das páginas que representam

---

## Regras transversais de Layout Components

**Tokens** (todos os componentes):
- Nunca valores hardcoded de cor — sempre variáveis CSS do sistema
- `bg-card`, `bg-muted`, `bg-background` conforme hierarquia visual
- `border-border` em todas as bordas
- `text-foreground`, `text-card-foreground`, `text-muted-foreground`

**Acessibilidade transversal**:
- Componentes de container (Card, ScrollArea, AspectRatio) não são interativos por si — a interatividade e os `aria-label` estão no conteúdo dentro deles
- Ordem do DOM sempre reflete a ordem visual — nunca usar `order-*` ou `flex-row-reverse` (ver `16-padroes-design-sistema.md`)
- `aria-label` de qualquer elemento interativo dentro de um container de layout deve incluir o contexto que o container fornece visualmente

**Analytics transversal**:
- Containers passivos (AspectRatio, ScrollArea, Separator): sem eventos
- Card: rastrear o conteúdo interativo, não o container
- Sidebar: `navigation_click` em cada item + `page_view` a cada troca de seção
