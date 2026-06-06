# Display Components

---

## Avatar

**Propósito**: representação visual de um usuário via foto de perfil ou iniciais como fallback.

**API e exemplos**: `src/components/ui/avatar.tsx` + stories + `AvatarDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
Avatar
├── AvatarImage    (imagem — exibida quando carregada com sucesso)
└── AvatarFallback (fallback — exibido enquanto carrega ou quando falha)
```

**Tamanhos** (via `className`, não existe prop `size`):

| Classe | Uso |
|---|---|
| `h-6 w-6` | Pequeno |
| `h-8 w-8` | Médio-compacto |
| `h-10 w-10` | Padrão (aplicado internamente) |
| `h-12 w-12` | Grande |

**Regras**:
- Tamanho padrão `h-10 w-10` — aplicado internamente; não existe prop `size`.
- `AvatarFallback` obrigatório — sem ele, falha de imagem resulta em elemento vazio.
- `delayMs={600}` no `AvatarFallback` — previne flash do fallback durante carregamento normal de rede.
- Formato circular padrão: `rounded-full` já aplicado internamente.
- Indicador de status: elemento separado posicionado absolutamente — não é prop do Avatar.
- Geração de iniciais: primeira letra do nome + primeira letra do sobrenome. "João da Silva" → "JS" (não "JO"); nome único → 2 primeiras letras.
- Grupo de avatares sobrepostos: `flex -space-x-2` + `ring-2 ring-background` em cada Avatar.

**Acessibilidade** (ver `11-acessibilidade.md`):
- `alt` obrigatório no `AvatarImage` — sem ele, leitores de tela anunciam a URL.
- Avatar informativo: `alt="Foto de perfil de [Nome]"`.
- Avatar decorativo (aparência, sem identidade): `alt=""`.
- `AvatarFallback` com `aria-hidden="true"` quando o nome do usuário já está visível na interface.

**Analytics**: Avatar sem ação não dispara eventos. Avatar clicável (link para perfil): `button_click` ou `navigation_click` com `label`.

---

## Carousel

**Propósito**: exibição sequencial de itens (imagens, cards) em container com navegação.

**API e exemplos**: `src/components/ui/carousel.tsx` + stories + `CarouselDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> Construído sobre **Embla Carousel**. Auto-play e dots de navegação **não são nativos** — requerem implementações separadas (plugin `embla-carousel-autoplay` para auto-play; `CarouselApi` + `setApi` para dots).

**Estrutura de subcomponentes**:
```
Carousel (opts, plugins, orientation, setApi)
├── CarouselContent
│   ├── CarouselItem
│   └── CarouselItem
├── CarouselPrevious
└── CarouselNext
```

**Tamanho dos itens** (via `basis-*` no `CarouselItem`):

| Classe | Itens visíveis |
|---|---|
| (sem `basis`) | 1 (padrão) |
| `basis-1/2` | 2 |
| `basis-1/3` | 3 |
| `md:basis-1/2 lg:basis-1/3` | Responsivo |

**Espaçamento entre itens** (padrão Embla): `-ml-4` no `CarouselContent` + `pl-4` em cada `CarouselItem`.

**Opções do Embla** (via prop `opts`): `loop: true`, `align: "start" | "center"`.

**Regras**:
- Sempre exibir `CarouselPrevious` e `CarouselNext` — exceto instrução específica.
- `loop: true` para carrosséis com auto-play — evita parada abrupta no último item.
- `stopOnInteraction: true` no Autoplay — para ao usuário interagir.
- `aria-label` obrigatório nos botões de navegação.

**Acessibilidade** (ver `11-acessibilidade.md`):
- Aplica `role="group"` e `aria-roledescription="slide"` em cada `CarouselItem`.
- `CarouselPrevious` e `CarouselNext` precisam de `aria-label` descritivo.
- Touch/swipe nativo do Embla; alternativa por teclado via Arrow keys nos botões de navegação.
- Dots customizados: `role="tablist"` no wrapper + `role="tab"` + `aria-selected` em cada botão.
- `motion-reduce`: o Embla respeita `prefers-reduced-motion` automaticamente.

**Analytics** (ver `21-analytics.md`):
- Evento `slide_change` com `index`, `total` e `trigger` ("button" ou "swipe").
- Subscrever via `api.on("select", ...)` após receber o `CarouselApi` por `setApi`.

---

## Chart

**Propósito**: visualização de dados quantitativos via gráficos construídos com Recharts, integrados ao sistema de design via tokens de cor.

**API e exemplos**: `src/components/ui/chart.tsx` + stories + `ChartDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> Camada de componentes sobre **Recharts** — não substitui o Recharts, complementa com integração de tema e acessibilidade. `ChartContainer` e `ChartConfig` são obrigatórios; usar Recharts diretamente não aplica os tokens de cor.

**Estrutura mínima**:
```
ChartContainer (config, aria-label)
└── BarChart / LineChart / AreaChart / PieChart (accessibilityLayer)
    ├── CartesianGrid
    ├── XAxis / YAxis
    ├── ChartTooltip (content={<ChartTooltipContent />})
    ├── ChartLegend (content={<ChartLegendContent />})
    └── Bar / Line / Area / Pie (fill="var(--color-[key])")
```

**`ChartConfig`** — objeto de configuração de cores e labels, desacoplado dos dados. Cada chave mapeia para `{ label, color: "var(--chart-N)" }`.

**Tokens de cor** (definidos no projeto — ver `16-padroes-design-sistema.md`):

| Token | Uso |
|-------|-----|
| `var(--chart-1)` | Primeira série de dados |
| `var(--chart-2)` | Segunda série |
| `var(--chart-3)` | Terceira série |
| `var(--chart-4)` | Quarta série |
| `var(--chart-5)` | Quinta série |

> As variáveis `var(--color-[key])` dentro do gráfico são **geradas automaticamente** pelo `ChartContainer` a partir do `ChartConfig`. Não usar os tokens `--chart-*` diretamente dentro do SVG — usar `var(--color-desktop)`, `var(--color-mobile)` etc.

**Regras**:
- `ChartContainer` obrigatório — sem ele os tokens de cor não funcionam.
- `ChartConfig` obrigatório — define labels e mapeia chaves de dados para cores do tema.
- `accessibilityLayer` obrigatório no componente Recharts raiz (BarChart, LineChart, etc.) — ativa navegação por teclado.
- `ChartTooltip` com `ChartTooltipContent` e `ChartLegend` com `ChartLegendContent` — usam o estilo do design system.
- Legends sempre visíveis para gráficos com múltiplas séries.

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` no `ChartContainer` descrevendo o gráfico.
- `<p className="sr-only">` com resumo textual dos dados principais — obrigatório para gráficos complexos.
- `accessibilityLayer` no componente Recharts ativa navegação por Arrow keys.
- **Daltonismo**: nunca diferenciar séries apenas por cor — usar também padrões visuais (tracejado, pontilhado em linhas) ou `ChartLegend` com labels claros.
- `motion-reduce`: animações do Recharts podem ser desativadas via `isAnimationActive={false}` nos elementos de dados (detectar via `matchMedia("(prefers-reduced-motion: reduce)")`).

**Analytics**: gráfico em si não dispara eventos padrão. Interações específicas (hover de tooltip, clique em legenda) podem ser rastreadas via callbacks do Recharts quando relevante para o produto.

---

## Table

**Propósito**: exibição de dados tabulares estruturados com semântica HTML correta. Use `Table` quando os dados são estáticos e cabem na tela; use `DataTable` quando o usuário precisa explorar, filtrar ou editar.

**API e exemplos**: `src/components/ui/table.tsx` + stories + `TableDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
<div className="overflow-x-auto">
└── Table
    ├── TableCaption    (descrição da tabela — lida por leitores de tela)
    ├── TableHeader
    │   └── TableRow
    │       └── TableHead (th — cabeçalho de coluna, scope="col")
    ├── TableBody
    │   └── TableRow
    │       └── TableCell (td — célula de dados)
    └── TableFooter
        └── TableRow
            └── TableCell (totais, sumários)
```

**Regras**:
- `<div className="overflow-x-auto">` envolvendo a tabela — scroll horizontal em mobile obrigatório.
- `TableCaption` obrigatório — pode ser `sr-only` quando o contexto visual já é claro.
- `scope="col"` em todos os `TableHead` — associa cabeçalhos às células para leitores de tela.
- Estado vazio obrigatório — nunca tabela vazia sem mensagem.
- `aria-label` contextual nos botões de ação por linha — "Ações para fatura INV001".
- `TableFooter` para totais e sumários — não usar linha de body para isso.

**Ordenação, filtros, paginação**: o `Table` é apenas a camada visual (HTML semântico + estilo). Para interação rica, usar `DataTable` (`@tanstack/react-table`). Quando integrar manualmente com `@tanstack/react-table`, o `TableHead` deve receber `aria-sort` dinâmico (`"ascending"` / `"descending"` / `"none"`). Acima de 20 linhas, usar `Pagination` com `getPaginationRowModel()`.

**Acessibilidade** (ver `11-acessibilidade.md`):
- `TableCaption` lida pelos leitores de tela antes das células — descreve o propósito da tabela.
- `scope="col"` em `TableHead` — obrigatório para mapear cabeçalhos às células.
- Botões de ação por linha: `aria-label` contextual incluindo o identificador da linha.
- Ordenação: `aria-sort="ascending"` / `"descending"` / `"none"` nos `TableHead` com ordenação ativa.

**UX Writing** (ver `19-tom-de-voz.md`):
- Cabeçalhos de coluna: substantivos curtos, sem ponto final, capitalização na primeira palavra.
- Estado vazio: "Nenhum [item] encontrado." — tom encorajador quando há CTA disponível.
- Botão de ação: `aria-label` contextual — "Editar fatura INV001", não apenas "Editar".

**Analytics**: a tabela em si não dispara eventos. Ações dentro da tabela (botões, ordenação) seguem os eventos do componente correspondente (`button_click`, `navigation_click`).

---

## DataTable

**Propósito**: tabela avançada para datasets que exigem interação — ordenação, filtros, seleção, paginação, redimensionamento, reordenação, fixação, edição inline e virtualização. Construída sobre **`@tanstack/react-table` v8** (headless) + **`@tanstack/react-virtual`**, encapsulando a engine numa camada visual que reusa o primitivo `Table` do design system.

> Use `Table` quando os dados são estáticos e cabem na tela. Use `DataTable` quando o usuário precisa explorar, filtrar ou editar.

**API e exemplos**: `src/components/ui/data-table.tsx` + stories + `DataTableDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
DataTable
├── Toolbar (GlobalFilter + DropdownMenu de visibilidade/pin)
├── Container rolável (overflow-y quando virtualizado)
│   └── Table (primitive)
│       ├── TableHeader (row de cabeçalhos + row de filtros opcional)
│       └── TableBody (linhas reais + padding rows quando virtualizado)
└── DataTablePagination (rodapé)
```

**Flags (cada recurso é opcional)**:

| Flag | Default | Função |
|---|---|---|
| `enableGlobalFilter` | `true` | Filtro de busca livre na toolbar |
| `enableColumnVisibility` | `true` | Menu "Colunas" na toolbar |
| `enableColumnFilters` | `false` | 2ª linha do header com input/select por coluna |
| `enableRowSelection` | `false` | Checkbox por linha + tri-state no cabeçalho |
| `enableColumnResizing` | `false` | Handle lateral em cada cabeçalho |
| `enableColumnOrdering` | `false` | Drag handle no cabeçalho para reordenar |
| `enableColumnPinning` | `false` | Pin esquerda/direita via menu de colunas |
| `enablePagination` | `true` | Rodapé com contagem + nav (≠ `virtualized`) |
| `virtualized` | `false` | TanStack Virtual; desliga paginação |

**`ColumnMeta` (extensões da column def)**:

| Chave | Tipo | Função |
|---|---|---|
| `filter` | `{ type: 'text' \| 'select'; options?: string[] }` | Renderiza input/select na row de filtros (`includesString` ou `equals`) |
| `editable` | `boolean` | Marca a coluna como editável inline |

**Regras**:
- Defina `columns` numa referência estável (módulo ou `useMemo`) — recriar a cada render zera o estado da tabela.
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde.
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática e o handle fica imprevisível.
- Selects de filtro recebem `filterFn: "equals"` automaticamente; texto usa `includesString`.
- O componente aplica `table-fixed` ao usar `enableColumnResizing`, `enableColumnOrdering` ou `virtualized` — força layout O(1) por coluna e evita travamento em datasets grandes.
- `data` nunca é mutado pelo componente — para edição inline, atualize o array externamente via `onCellEdit`.
- `virtualized` e `enablePagination` são mutuamente exclusivos; ativar virtualização desliga paginação automaticamente.

**Acessibilidade** (ver `11-acessibilidade.md`):
- Tabela semântica via primitive `Table` — `<th>`, `<tr>`, `<td>` reais
- `aria-sort="ascending|descending|none"` no `<th>` ordenável — anunciado pelo leitor de tela
- `aria-label` contextual obrigatório nos botões: "Ordenar por <em>coluna</em>", "Filtrar <em>coluna</em>", "Selecionar linha", "Próxima página"
- Checkbox de cabeçalho usa `indeterminate` quando há seleção parcial (tri-state)
- Handle de resize tem `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa

**Analytics**: passivo por padrão. Para rastrear interações (sort, filter, edit confirmado), consuma a instância via `onTableReady` e instrumentaliza no caller.

---

## Regras transversais de Display Components

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- `AvatarImage`: `alt` obrigatório em todos os casos (descritivo ou vazio para decorativo)
- `Chart`: `aria-label` no `ChartContainer` + `<p className="sr-only">` com resumo dos dados
- `Table`: `TableCaption` obrigatório + `scope="col"` nos cabeçalhos
- Carousel: `aria-label` nos botões de navegação
- `motion-reduce`: Chart via `isAnimationActive={false}`, Carousel via comportamento nativo do Embla

**Analytics transversal** (ver `21-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Carousel | `slide_change` | A cada mudança de slide |
| Avatar clicável | `button_click` ou `navigation_click` | Ao clicar |
| Chart | — | Passivo, sem eventos padrão |
| Table | — | Passivo; ações internas rastreadas pelos componentes de ação |
| DataTable | — | Passivo; rastreio de sort/filter/edit feito no caller via `onTableReady` |
| Table | — | Passivo; ações internas rastreadas pelos componentes de ação |