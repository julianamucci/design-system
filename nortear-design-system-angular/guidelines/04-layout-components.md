# Layout Components (Nortear — Angular)

Cada seção cobre **propósito, estrutura, entradas e regras**. A API compilável vive no componente, nas stories e no `translations.json` — não aqui, porque código em guideline envelhece mais rápido que no componente que ele descreve.

---

## Aspect Ratio

**Propósito**: manter proporção fixa de mídia (imagem, vídeo, iframe) independente do tamanho do container.

**Diretiva**: `div[ndsAspectRatio]`. Sem template próprio, sem estado, sem eventos.

**Estrutura**:

```
div[ndsAspectRatio]  (aspect-ratio pelo token de proporção)
└── filho (img | video | iframe) — preenche o container
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `ratio` | `1` | Proporção largura/altura |

**Ratios canônicos**: `16/9`, `4/3`, `1`, `3/4`, `21/9`.

**Regras**:
- A proporção é do container; não definir altura no elemento
- Raio e borda vão **no filho**, nunca no container — o container recorta pela proporção, e arredondá-lo deixa o filho vazando no canto
- O filho preenche 100% e recorta preservando proporção
- Margem externa por classe da escada `--spacing-*`

**Acessibilidade**:
- Imagem informativa: `alt` descritivo. Imagem decorativa: `alt=""` mais `aria-hidden="true"`
- Vídeo e iframe: `title` obrigatório
- Sem tab stop próprio — o foco é do filho

---

## Card

**Propósito**: agrupar conteúdo relacionado em um container delimitado. Para agrupamento sem borda ou sombra, um `<div>` com tokens de espaçamento basta.

**Diretivas**: `div[ndsCard]` e as peças de dentro. Todas sem input, exceto o raiz.

**Estrutura**:

```
div[ndsCard]
├── div[ndsCardHeader]        (opcional)
│   ├── [ndsCardTitle]        (h2..h6 — o nível é o elemento)
│   ├── [ndsCardDescription]
│   └── div[ndsCardAction]    (opcional, canto superior direito)
├── div[ndsCardContent]       (opcional)
└── div[ndsCardFooter]        (opcional, borda superior)
```

**Entradas** (raiz):

| Nome | Default | Função |
|---|---|---|
| `size` | `default` | `default` ou `sm` — respiro interno |

**Regras**:
- Respiro interno vem do `size`, não de classe ad-hoc por caso
- Card clicável inteiro: o wrapper é `<a>` ou `<button>` — nunca `<div>` com handler de clique
- `ndsCardAction` é slot posicionado; botão de ação vai nele, não dentro da descrição
- Conteúdo aninhado herda os tokens — não sobrescrever cor em descendente

**Acessibilidade**:
- Botão dentro do Card precisa de `aria-label` contextual com identificador (nome do produto, do registro)
- O nível do heading do título é **o elemento** em que a diretiva foi aplicada. Escolha o que preserva a hierarquia da página; nível fixo pula degrau e falha `heading-order` no axe

---

## Scroll Area

**Propósito**: área com altura limitada e rolagem consistente entre navegadores.

**Componente**: `div[ndsScrollArea]`.

**Estrutura**:

```
div[ndsScrollArea]  (data-size resolve a altura)
└── div.nds-scroll-area-viewport  (overflow: auto, tabindex="0")
    └── conteúdo projetado
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `label` | — | Nome acessível da região rolável |
| `size` | — | Degrau da escada de altura da janela (`xs`…`xl`), escrito em `data-size` na raiz |

**Regras**:
- A altura vem da escada nomeada, nunca de um número escrito no call site. Os degraus são os tokens `--box-height-*`; uma medida fora deles vem da custom property `--box-height` no elemento
- `size` **não tem default**, e isso é decisão: sem teto não há transbordo e sem transbordo não há rolagem, então a ausência dele é o cenário de erro que a story `NoLimit` e o "não faça" do Do & Dont demonstram
- O degrau mora na **raiz**: é lá que a folha compartilhada resolve `block-size`, e o viewport é `height: 100%` por ela. Repetir a medida no viewport é declaração morta
- Rolagem é `auto`, nunca `scroll` — barra sempre visível é ruído
- Uma só camada rola: aninhar duas áreas roláveis produz captura de rolagem imprevisível

**Acessibilidade**:
- Região rolável precisa ser alcançável por teclado — é o que a regra `scrollable-region-focusable` do axe cobra (WCAG 2.1.1). É por isso que o container recebe `tabindex="0"`, e é por isso que **quem rola não pode ser um wrapper decorativo**
- Com `tabindex="0"`, o nome acessível (`label`) deixa de ser opcional: sem ele o leitor anuncia uma parada sem identidade

---

## Separator

**Propósito**: divisor visual entre seções ou itens.

**Diretiva**: `div[ndsSeparator]`. É o modelo canônico de `@Directive` neste stack — não tem template, então não cria view.

**Estrutura**:

```
div[ndsSeparator]  (role="separator" quando semântico; aria-hidden quando decorativo)
└── (sem filhos)
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `orientation` | `horizontal` | `horizontal` ou `vertical` |
| `decorative` | `true` | `true` aplica `aria-hidden`; `false` mantém a semântica de separador |
| `emphasis` | `default` | `default` ou `strong` |

**Regras**:
- O default é **decorativo**. Divisor que só organiza visualmente não deve ser anunciado; marcar `decorative="false"` é decisão consciente, para quando o divisor separa grupos com significado
- Cor sempre pelo token de borda — nunca cor literal
- Vertical precisa de altura vinda do pai (esticar no eixo transversal); não cravar altura na diretiva

**Acessibilidade**:
- Semântico: `role="separator"` com orientação
- Decorativo: `aria-hidden="true"` — e então não conta como parada de leitura

---

## Resizable

**Propósito**: painéis com divisória arrastável, para quem consome ajustar a proporção da área de trabalho.

**Peças**: `div[ndsResizable]` (grupo), `div[ndsResizablePanel]`, `div[ndsResizableHandle]`. O estado do grupo mora num serviço provido pelo grupo.

**Estrutura**:

```
div[ndsResizable]                     (direção do eixo)
├── div[ndsResizablePanel]
├── div[ndsResizableHandle]           (role="separator", aria-orientation)
└── div[ndsResizablePanel]
```

**Entradas do grupo**:

| Nome | Default | Função |
|---|---|---|
| `direction` | `horizontal` | Eixo do arraste |
| `autoSaveId` | — | Chave para persistir a proporção entre sessões |

**Saída do grupo**: proporção dos painéis, emitida a cada mudança confirmada.

**Entradas do painel**:

| Nome | Default | Função |
|---|---|---|
| `defaultSize` | — | Proporção inicial; sem valor, o espaço se divide igualmente |
| `minSize` | `10` | Piso em porcentagem |
| `maxSize` | `100` | Teto em porcentagem |

**Entradas da alça**:

| Nome | Default | Função |
|---|---|---|
| `withHandle` | `false` | Mostra a marca visível de arraste |
| `disabled` | `false` | Trava a divisória |

**Regras**:
- `minSize` é obrigatório na prática: sem piso, um painel colapsa a zero e o conteúdo dele fica inalcançável
- A alça é a única peça focável do conjunto
- Persistência é opcional e explícita (`autoSaveId`) — não há persistência implícita

**Acessibilidade**:
- Alça com `role="separator"` e orientação
- Teclado: setas movem a divisória em passos; a alça precisa ser alcançável por Tab
- **Lacuna registrada**: não há regra visual para alça desabilitada neste stack — o conteúdo compartilhado pede "sem cursor de resize", e o estado hoje é verificado por comportamento, não por aparência. Resolver no CSS compartilhado, seguindo o Vanilla

---

## Sidebar

**Propósito**: navegação lateral persistente, colapsável, com comportamento próprio em telas estreitas.

**Peças**: `div[ndsSidebarProvider]` (estado), `div[ndsSidebar]` (a barra), mais as diretivas de estrutura e de menu.

**Estrutura**:

```
div[ndsSidebarProvider]                 (dono do estado aberto/fechado)
├── div[ndsSidebar]
│   ├── div[ndsSidebarHeader]
│   ├── div[ndsSidebarContent]
│   │   └── div[ndsSidebarGroup]
│   │       ├── div[ndsSidebarGroupLabel]
│   │       ├── button[ndsSidebarGroupAction]      (opcional)
│   │       └── div[ndsSidebarGroupContent]
│   │           └── ul[ndsSidebarMenu]
│   │               └── li[ndsSidebarMenuItem]
│   │                   ├── button|a[ndsSidebarMenuButton]
│   │                   ├── button[ndsSidebarMenuAction]     (opcional)
│   │                   ├── span[ndsSidebarMenuBadge]        (opcional)
│   │                   └── ul[ndsSidebarMenuSub]            (opcional)
│   │                       └── li[ndsSidebarMenuSubItem]
│   │                           └── a|button[ndsSidebarMenuSubButton]
│   ├── div[ndsSidebarSeparator]
│   └── div[ndsSidebarFooter]
├── button[ndsSidebarRail]              (borda arrastável/clicável)
└── main[ndsSidebarInset]               (conteúdo da página)
```

**Entradas do provider**:

| Nome | Default | Função |
|---|---|---|
| `defaultOpen` | `true` | Estado inicial |
| `open` | — | Estado de duas vias, para controle externo |

**Entradas da barra**:

| Nome | Default | Função |
|---|---|---|
| `side` | `left` | `left` ou `right` |
| `variant` | `sidebar` | `sidebar`, `floating` ou `inset` |
| `collapsible` | `offcanvas` | `offcanvas`, `icon` ou `none` |
| `mobileTitle` | rótulo padrão | Título do painel em tela estreita |
| `mobileDescription` | rótulo padrão | Descrição do painel em tela estreita |

**Entradas do botão de menu**:

| Nome | Default | Função |
|---|---|---|
| `variant` | `default` | `default` ou `outline` |
| `size` | `default` | `default`, `sm` ou `lg` |
| `active` | `false` | Marca o item da rota atual |

**Regras**:
- Em tela estreita a barra vira **painel modal**, não uma barra estreitada: recebe título e descrição próprios, trava a rolagem de fundo e devolve o foco ao gatilho ao fechar
- `active` marca o item da rota atual, e o marcador tem de ser mais que cor
- O esqueleto de menu (`ndsSidebarMenuSkeleton`) tem rótulo de carregamento próprio, para o leitor não anunciar uma lista vazia
- `ndsSidebarInset` é `<main>`: um por página
- **Compor `ndsSidebarMenuButton` com `ndsTooltipTrigger` no mesmo botão é caso conhecido de disputa de `data-slot`** — em teste, procure pela classe. Ver `RULES.md` §8

**Acessibilidade**:
- O gatilho tem nome acessível próprio e reflete o estado da barra
- Escape fecha o painel em tela estreita e devolve o foco ao gatilho — o painel não pode comer o Escape de um overlay aberto dentro dele
- Lista de navegação é `<ul>`/`<li>` de verdade, não `<div>` com aparência de lista
- `ndsSidebarRail` é botão com nome acessível; alça sem nome é parada muda no Tab
