# Layout Components

---

## Aspect Ratio

**Propósito**: manter proporções fixas de mídia (imagem, vídeo, iframe) independente do tamanho do container. Use sempre que exibir mídia com proporção conhecida.

**API e exemplos**: `src/components/ui/aspect-ratio.tsx` + stories + `AspectRatioDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Ratios comuns**:

| Ratio | Uso |
|---|---|
| `16/9` | Vídeos e banners paisagem |
| `1/1` | Avatares e thumbnails quadrados |
| `4/3` | Imagens de produto e cards |
| `3/4` | Imagens de retrato |

**Regras**:
- Imagem dentro: `object-fit: cover` para preencher sem distorcer.
- O arredondamento vai no elemento filho, não no container — `.nds-rounded-md`.
- Não aplicar tokens de cor diretamente no AspectRatio — estilizar o filho.
- Para imagens, preferir o componente `ImageWithFallback` do projeto (`/components/figma/ImageWithFallback.tsx`).

**Acessibilidade**:
- Todo conteúdo visual dentro do AspectRatio precisa de alternativa textual.
- Imagem informativa: `alt` descritivo do conteúdo, não da aparência.
- Imagem decorativa: `alt=""` — leitor de tela ignora.
- Vídeo: sempre incluir legendas e transcrição.
- Nunca usar `user-scalable=no` no viewport — impede zoom em mobile.

**Analytics**: container passivo — não dispara eventos.

---

## Card

**Propósito**: agrupar conteúdo relacionado em um container visualmente delimitado. Use para unidades semânticas (produto, perfil, artigo, métrica). Para divisão apenas visual, prefira `Separator` ou espaçamento.

**API e exemplos**: `src/components/ui/card.tsx` + stories + `CardDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
Card
├── CardHeader
│   ├── CardTitle
│   └── CardDescription
├── CardContent
└── CardFooter
```

**Tokens** (ver `03-sistema-design.md`) — quem lê os tokens é a folha do componente. O Card não recebe classe de cor: `.nds-card` já pinta fundo, texto e borda, e repintar por fora só cria uma segunda fonte de verdade para a mesma superfície.

| Slot | Seletor que aplica | Token lido |
|---|---|---|
| Fundo | `.nds-card` | `--card` |
| Texto | `.nds-card` | `--card-foreground` |
| Borda | `.nds-card` | `--border` |
| Texto secundário (`CardDescription`) | `.nds-card-description` | `--muted-foreground` |
| Divisor do rodapé (`CardFooter`) | `.nds-card-footer` | `--border` |

**Regras**:
- Não usar como decoração ou apenas para criar divisão visual.
- Card inteiramente clicável: usar `<a>` ou `role="button"` com `aria-label` descritivo no container. Cursor de ponteiro é aparência, não affordance — sozinho não torna o card operável por teclado nem anunciável por leitor de tela.

**Acessibilidade**:
- Botões dentro do Card (Editar, Excluir, Ver mais) precisam de `aria-label` contextual incluindo o identificador do card — nunca apenas "Excluir" (ver `docs/shared/guidelines/01-acessibilidade.md` → "Premissa fundamental").
- Usar o `CardTitle` como âncora de contexto via `aria-labelledby` ou incluir o título no `aria-label` do botão.
- Imagens dentro do card: sempre com `alt` adequado.

**UX Writing** (ver `docs/shared/guidelines/05-tom-de-voz.md`):
- `CardTitle`: substantivo ou frase nominal, sem verbo, sem ponto final.
- `CardDescription`: complemento direto do título, máximo 2 linhas, ponto final.
- Labels dos botões no footer: verbos no infinitivo, máximo 3 palavras.

**Analytics** (ver `docs/shared/guidelines/07-analytics.md`):
- Rastrear o conteúdo interativo dentro do card — nunca o card em si.
- Card inteiramente clicável: `data-track="card_click"` com `data-track-label` idêntico ao `CardTitle` e ao `aria-label`.
- Botões dentro: `data-track="button_click"` com `data-track-label` contextual.

---

## Resizable

**Propósito**: painéis redimensionáveis pelo usuário via arrasto ou teclado. Use em layouts onde o usuário precisa ajustar proporções — editor com preview, painel lateral com conteúdo, split view.

**API e exemplos**: `src/components/ui/resizable.tsx` + stories + `ResizableDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
ResizablePanelGroup
├── ResizablePanel
├── ResizableHandle
└── ResizablePanel
```

**Regras**:
- Sempre definir `minSize` e `maxSize` em todos os painéis — evita colapso acidental.
- Sempre definir `defaultSize` — evita layout instável no carregamento inicial.
- `withHandle` no `ResizableHandle` quando o usuário precisa de affordance visual clara.

**Acessibilidade** — WCAG 2.5.7 (Dragging Movements, novo no WCAG 2.2):
- Toda ação de arrastar precisa de alternativa por teclado.
- O `ResizableHandle` aceita `Arrow keys` nativamente — manter e não sobrescrever.
- `aria-label` descritivo no handle explicando função e atalho de teclado.
- O handle precisa ser focável e anunciar ao leitor de tela que é controle de redimensionamento.

**Analytics**: rastrear `panel_resize` com o tamanho final apenas quando o redimensionamento é dado de produto relevante (ex.: editor com painéis). Usar o callback `onLayout` para capturar o tamanho final após o arrasto.

---

## Scroll Area

**Propósito**: scroll interno customizado dentro de um container de altura fixa, sem rolar a página principal. Use em listas longas em sidebars, conteúdo em overlays, tabelas com altura fixa. Não usar quando o scroll natural da página é suficiente.

**API e exemplos**: `src/components/ui/scroll-area.tsx` + stories + `ScrollAreaDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Sempre definir altura específica no container pai — sem isso, o ScrollArea não funciona.
- `.nds-overflow-hidden` no container pai + `.nds-h-full` no ScrollArea.
- Não aninhar ScrollAreas — causa scroll duplo e desorientação.
- Tabelas dentro de ScrollArea: a rolagem horizontal é do wrapper da tabela (`.nds-table-wrapper`), nunca de outro ScrollArea.

**Acessibilidade**:
- O ScrollArea expõe atributos de rolagem corretamente para tecnologias assistivas.
- Para scroll horizontal: adicionar `tabIndex={0}` no ScrollArea para que usuários de teclado possam focar e rolar com teclas de direção.
- Garantir que o conteúdo dentro é navegável por Tab sem que o scroll quebre o fluxo visual.
- Em mobile: preferir scroll nativo da página quando possível — ScrollArea pode dificultar gestos de swipe.

**Analytics**: container passivo — não dispara eventos. Para rastrear engajamento com conteúdo longo, usar Intersection Observer no conteúdo interno.

---

## Separator

**Propósito**: divisor visual e semântico entre grupos de conteúdo relacionado. Use para separar grupos em menus, dividir seções em formulários, delimitar áreas em layouts. Para divisão puramente visual, usar bordas CSS ou espaçamento (`my-*`, `py-*`).

**API e exemplos**: `src/components/ui/separator.tsx` + stories + `SeparatorDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Default | Função |
|---|---|---|
| `orientation` | `"horizontal"` | `"horizontal"` ou `"vertical"` (em containers flex horizontais) |
| `decorative` | — | Quando puramente visual, marque com `aria-hidden="true"` |

**Acessibilidade**:
- O componente aplica `role="separator"` e `aria-orientation` automaticamente — não sobrescrever.
- Separator semântico (divide conteúdo relacionado): manter o `role="separator"` padrão.
- Separator decorativo (apenas visual, sem significado): `aria-hidden="true"`.

**Tokens**: a folha `.nds-separator[data-orientation="horizontal"|"vertical"]` desenha a linha lendo `--border` e põe a espessura de 1px no eixo certo. Não substituir por um elemento de 1px pintado à mão, nem sobrescrever a cor com valor literal.

**Analytics**: elemento estático passivo — não dispara eventos.

---

## Sidebar

**Propósito**: navegação principal persistente da aplicação. Use em aplicações com múltiplas seções ou hierarquias de navegação. Para navegação simples com poucos itens, considerar `NavigationMenu` ou `Tabs`.

**API e exemplos**: `src/components/ui/sidebar.tsx` + stories + `SidebarDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes** (gerenciada pelo `SidebarProvider` — nunca replicar manualmente):
```
SidebarProvider
├── <nav aria-label="Navegação principal">
│   └── Sidebar
│       ├── SidebarHeader   (logo — altura igual à navbar)
│       ├── SidebarContent  (categorias, geralmente em Accordion)
│       └── SidebarFooter   (perfil, configurações)
└── SidebarInset
    ├── <header> com SidebarTrigger (visível em mobile)
    └── <main id="main-content" tabIndex={-1}>
```

**Regras obrigatórias do projeto**:
- `<nav aria-label="Navegação principal">` envolvendo o `<Sidebar>` — obrigatório.
- Altura do `SidebarHeader` igual à altura da navbar.
- Ícones apenas no primeiro nível de menu, salvo instrução específica.
- Collapsible obrigatório em categorias com subitens.
- 280px fixo em desktop (push mode), overlay em mobile — gerenciados pelo SidebarProvider.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md` → "Estrutura acessível da SPA"):
- Item ativo: `aria-current="page"` — anuncia ao leitor de tela qual seção está selecionada.
- Botão de toggle: `aria-expanded` + `aria-label` contextual ("Expandir navegação principal" / "Recolher navegação principal").
- Itens com ícone na sidebar colapsada: `aria-label` com o nome da seção — ícone sozinho não é acessível.
- Skip link na aplicação aponta para `#main-content`, pulando a sidebar.

**UX Writing** (ver `docs/shared/guidelines/05-tom-de-voz.md`):
- Labels de menu: substantivos ou frases nominais curtas, sem verbo, sem ponto final. Ex.: "Componentes", "Design Tokens", "Visão geral".
- `aria-label` do toggle: contextual e descritivo — não apenas "Menu".
- Tooltips de ícones no modo colapsado: nome exato da seção.

**Docs page — previews de Sidebar usam `contain: layout` obrigatoriamente**:

O componente `Sidebar` usa `position: fixed` com o `inset` vertical zerado, o que faz o painel escapar de qualquer container e se sobrepor ao layout da docs page. Para conter a sidebar dentro do preview, o elemento que envolve o preview declara `contain: layout`.

**Por que `contain: layout`**: a spec CSS Containment Level 2 garante que elementos `position: fixed` dentro de um container com `contain: layout` sejam posicionados relativamente àquele container, não ao viewport. `overflow: hidden` sozinho **não** é suficiente — fixed ignora overflow. Não existe utilitária `.nds-*` para containment; `contain` é propriedade mecânica e não valor de design, então declará-la no atributo `style` do wrapper não fere a regra de tokenização.

**Analytics** (ver `docs/shared/guidelines/07-analytics.md`):
- Clique em item de menu: `navigation_click` com `label` (nome da seção) e `destination` (path).
- O handler de navegação deve disparar `page_view` — ver `docs/shared/guidelines/01-acessibilidade.md` → "Anúncio de mudança de página".
- Não rastrear duplamente: `navigation_click` + `page_view` são eventos distintos com propósitos distintos.

**SEO** (ver `docs/shared/guidelines/06-seo-geo.md`):
- A estrutura `<nav aria-label="Navegação principal">` é lida por crawlers e reforça a arquitetura de informação do produto.
- Os itens de menu refletem a hierarquia de conteúdo — manter nomes consistentes com os títulos das páginas que representam.

---

## Regras transversais de Layout Components

**Tokens** (todos os componentes):
- Nunca valor literal de cor — sempre as custom properties do tema
- A superfície é escolhida pela folha do componente entre `--card`, `--muted` e `--background`, conforme a hierarquia visual. As utilitárias de cor de `colors.css` existem para composição pontual — não para repintar um componente que já tem folha
- `--border` em todas as bordas
- Texto: `--foreground` no corpo, `--card-foreground` dentro do card, `--muted-foreground` no secundário

**Acessibilidade transversal**:
- Componentes de container (Card, ScrollArea, AspectRatio) não são interativos por si — a interatividade e os `aria-label` estão no conteúdo dentro deles
- Ordem do DOM sempre reflete a ordem visual — nunca reordenar pela propriedade `order` nem invertendo a direção do flex (ver `03-sistema-design.md`)
- `aria-label` de qualquer elemento interativo dentro de um container de layout deve incluir o contexto que o container fornece visualmente

**Analytics transversal**:
- Containers passivos (AspectRatio, ScrollArea, Separator): sem eventos
- Card: rastrear o conteúdo interativo, não o container
- Sidebar: `navigation_click` em cada item + `page_view` a cada troca de seção
