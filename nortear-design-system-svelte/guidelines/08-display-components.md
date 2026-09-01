# Display Components

---

## Avatar

**Propósito**: representação visual de um usuário ou entidade (foto, iniciais, ícone).

**API e exemplos**: `src/components/ui/avatar/avatar.svelte` + stories + `AvatarDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Avatar (size)
├── AvatarImage (src, alt)
└── AvatarFallback (iniciais ou aria-label)
```

**Tamanhos** — presets da prop `size`:

| `size` | Diâmetro |
|---|---|
| `sm` | 24px |
| `md` (padrão) | 32px |
| `lg` | 40px |
| `xl` | 48px |
| `2xl` | 64px |

**Regras**:
- `AvatarImage`: `alt` obrigatório e descritivo
- `AvatarFallback`: iniciais do nome ou `aria-label` descritivo
- Tamanho: **sempre** pela prop `size` — nunca por classe utilitária de altura e largura. O preset não muda só o diâmetro: a folha deriva dele o corpo das iniciais, o tamanho do selo de status e o recuo do grupo empilhado. Fixar altura por fora acerta o círculo e deixa esses três para trás, e o desalinhamento só aparece na composição.
- Fallback é obrigatório sempre que houver `AvatarImage`

---

## Carousel

**Propósito**: galeria horizontal de itens com navegação por slides.

**API e exemplos**: `src/components/ui/carousel/carousel.svelte` + stories + `CarouselDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Carousel (aria-label)
├── CarouselContent
│   └── CarouselItem
├── CarouselPrevious (aria-label)
└── CarouselNext (aria-label)
```

**Regras**:
- Quantos itens cabem por vez é decisão da folha do slide, não do template — o dimensionamento é do componente

**Acessibilidade**:
- `aria-label` descritivo no `<Carousel>`
- `aria-label` nos botões de navegação
- Animação personalizada tem de parar sob `prefers-reduced-motion` — as folhas do sistema já param a sua

---

## Table

**Propósito**: dados tabulares com linhas e colunas — apresentação estática, sem interação. Para datasets interativos, usar **DataTable**.

**API e exemplos**: `src/components/ui/table/table.svelte` + stories + `TableDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Table
├── TableCaption (fora da tela se necessário, sempre presente)
├── TableHeader
│   └── TableRow
│       └── TableHead (scope="col")
└── TableBody
    └── TableRow
        └── TableCell
```

**Acessibilidade obrigatória**:
- `TableCaption` em toda tabela — pode ficar fora da tela (`.nds-sr-only`), anunciada pelo leitor e invisível na página, mas nunca ausente
- `scope="col"` em todo `TableHead` de coluna
- `scope="row"` em `TableHead` de linha (quando aplicável)

---

## Chart

**Propósito**: visualização de dados quantitativos — barras, linhas, área e pizza — com cores, tipografia e eixos vindos dos tokens do design system.

**API e exemplos**: `src/components/ui/chart/chart-container.svelte + index.ts` + stories + `ChartDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> Camada sobre **Apache ECharts**. O container registra o tema do design system a partir dos tokens do `<html>` e o reaplica quando a classe muda — trocar marca, modo escuro, densidade ou fonte recolore o gráfico sem recarregar. Chamar a lib direto pula esse registro e o desenho sai com a paleta padrão dela. O container recebe um objeto de configuração único e devolve o desenho; os construtores auxiliares montam esse objeto para os quatro tipos cobertos.

**Estrutura**:

```
container (data-slot="chart", class .nds-chart, role="img", descrição)
├── frase de estado vazio (.nds-chart-empty)   ← quando não há série com dado
└── desenho da lib (svg por padrão, canvas opcional)
    ├── eixos e grade
    ├── formas de dado (barra, traçado, área, fatia) com trama sobreposta
    └── legenda
```

**Entradas**: objeto de configuração, renderer, altura, frase de estado vazio e descrição do gráfico.

**Tokens de cor**:

| Token | Uso |
|---|---|
| `--chart-1` … `--chart-5` | séries de dados, na ordem em que aparecem |
| `--foreground` | contorno das formas de dado e texto do título |
| `--muted-foreground` | texto de eixo e de legenda |
| `--border` | linhas de grade e de eixo |
| `--card` | fundo da dica sob o ponteiro |

**Regras**:
- Altura é entrada do componente, não classe utilitária — o design system não tem utility de altura para gráfico, e sem valor vale o piso de `.nds-chart`.
- A cor de uma série só se sobrescreve no próprio item de série; a paleta global se muda no tema.
- Legenda visível sempre que houver mais de uma série; com uma só ela some, porque não há o que comparar.
- Estado vazio é frase completa com orientação para a próxima ação, nunca "Sem dados.".
- Renderer `svg` para relatório, impressão e exportação; `canvas` só para dataset grande ou animação pesada.
- Para tipos não cobertos (dispersão, radar, mapa de calor), registre o módulo extra da lib antes de usar.

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `role="img"` mais descrição no container: sem nome acessível o desenho é conteúdo perdido. A descrição diz o que o gráfico mostra, não que é um gráfico.
- A informação nunca vive só na cor (WCAG 1.4.1): a trama por série vem ligada por padrão e a legenda nomeia cada série por escrito.
- Os 3:1 de objeto gráfico (WCAG 1.4.11) vêm do CONTORNO das formas em `--foreground`, não da cor de série — as cores da paleta ficam em torno de 2:1 contra o fundo e sozinhas não sustentam o critério.
- Texto de eixo em `--muted-foreground`, com 4.5:1 contra o fundo.
- Gráfico denso ou dado crítico pede resumo textual à parte, com pico, mínimo e tendência.
- Animação respeita `prefers-reduced-motion`, pelos mesmos tokens de duração do resto do sistema.

**Analytics**: passivo — o gráfico não dispara evento por padrão. Interações específicas (dica sob o ponteiro, clique na legenda) se rastreiam via callback da lib quando forem relevantes para o produto.

---


## DataTable

**Propósito**: tabela avançada para datasets que exigem interação — ordenação, filtros, seleção, paginação, redimensionamento, reordenação, fixação, edição inline e virtualização.

**Stack**: construída sobre **`@tanstack/table-core`** (engine headless v8) + **`@tanstack/svelte-virtual`**. Não usa o adapter `@tanstack/svelte-table` (incompatível com Svelte 5); um wrapper local em `data-table.svelte` consome `createTable` direto e expõe state via runes (`$state`).

**API e exemplos**: `src/components/ui/data-table/data-table.svelte` + stories + `DataTableDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Flags principais**: `enableGlobalFilter` (default `true`), `enableColumnVisibility` (default `true`), `enableColumnFilters`, `enableRowSelection`, `enableColumnResizing`, `enableColumnOrdering`, `enableColumnPinning`, `enablePagination` (default `true`), `virtualized` (desliga paginação).

**`ColumnMeta` (Svelte-only)**:

| Chave | Tipo | Função |
|---|---|---|
| `filter` | `{ type: 'text' \| 'select'; options?: string[] }` | Input/select por coluna |
| `editable` | `boolean` | Marca a coluna como editável inline |
| `format` | `(value, row) => string` | Formata o texto da célula (sem JSX/snippet) |
| `badgeVariant` | `(value, row) => 'default' \| 'destructive' \| 'warning' \| 'success' \| 'info'` | Envolve a célula em `<Badge>` com a variant retornada — substituto do `cell` renderer das outras stacks |
| `cellClass` | `string` | Classes `.nds-*` extras no `<td>` |


**Nome da tabela e identidade da linha** (todas opcionais):

| Prop | Tipo | Função |
|---|---|---|
| `caption` | `string` | Nome acessível da grade. Vira legenda fora da tela — anunciada pelo leitor, invisível na página |
| `rowKey` | `(row, index) => string` | Identidade estável da linha. Sem ela a identidade é a POSIÇÃO, e ordenar leva a marcação para quem ocupou o lugar |
| `rowLabel` | `(row) => string` | Texto que identifica a linha no nome do controle de seleção. Sem ela o identificador sai da primeira coluna de dados, e só cai na chave da linha quando essa coluna vem vazia |
| `labels` | `Partial<DataTableLabels>` | Textos da interface. Só as chaves informadas mudam; o resto fica no padrão pt-BR |

**i18n**: `labels` cobre rótulos de controle, contagens e navegação. Duas chaves são FUNÇÕES por dependerem da linha ou da coluna: `selectRow(linha)` — texto fixo aqui produziria dez controles homônimos — e `noFilter(coluna)`, o texto da célula sem filtro. Mantenha `labels` numa referência estável (top-level do `<script>`): objeto novo a cada render remonta as colunas.

**Regras**:
- Defina `columns` no top-level do `<script>` ou em `$derived` — recriar em cada update zera o estado da tabela
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática
- Selects de filtro recebem `filterFn: 'equals'` automaticamente; texto usa `includesString`
- Passa a `table-layout: fixed` em `enableColumnResizing`, `enableColumnOrdering` ou `virtualized` — evita travamento em datasets grandes
- `data` nunca é mutado pelo componente — para edição inline, atualize o `$state` externamente no `onCellEdit`
- `virtualized` e `enablePagination` são mutuamente exclusivos; virtualização desativa paginação
- Para markup rico (ícones, links), use `meta.badgeVariant` ou `meta.cellClass`. `cell` Snippet ainda não é suportado pelo wrapper local

**Acessibilidade**:
- Tabela semântica via `<Table>` primitive — `<th>`, `<tr>`, `<td>` reais
- `aria-sort` no `<th>` ordenável (`ascending` / `descending` / `none`)
- `aria-label` contextual obrigatório nos botões: "Ordenar por <em>coluna</em>", "Filtrar <em>coluna</em>", "Selecionar linha", "Próxima página"
- Checkbox de cabeçalho usa `indeterminate` em seleção parcial (tri-state)
- Cada checkbox de linha carrega o identificador daquela linha no nome; nome repetido em dez controles é o mesmo que nome nenhum (WCAG 4.1.2)
- Uma só camada rola na horizontal, e é a do primitivo Table — a única com tabindex zero. O contêiner externo é moldura e, no modo virtualizado, dono da rolagem vertical (WCAG 2.1.1, axe scrollable-region-focusable)
- Handle de resize: `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa

**Analytics**: passivo por padrão. Para rastrear interações, consuma a instância via `onTableReady` e instrumentaliza no caller.
