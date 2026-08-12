# Display Components (Nortear — Vanilla TypeScript)

---

## Avatar

**Propósito**: representação visual de um usuário (foto ou iniciais como fallback).

**API e exemplos**: `src/components/ui/avatar.ts` + stories + `AvatarDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
span wrapper (relative, rounded-full, overflow-hidden)
├── img (quando src + onload OK)
└── fallback (span com iniciais, bg-muted)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `src` | — | URL da imagem |
| `alt` | — | Texto alternativo |
| `fallback` | — | Iniciais (obrigatório) |
| `size` | `default` | `sm` (24px), `default` (40px), `lg` (64px) |

**Regras**:
- Sempre `rounded-full` + `overflow-hidden`
- Tamanhos múltiplos de 8 (8-grid): 24, 40, 64
- Fallback obrigatório mesmo quando `src` existe — exibido se a imagem falhar (`onerror`)
- Imagem em `object-cover` para preservar proporção
- Tokens: `bg-muted text-muted-foreground` no fallback

**Acessibilidade**:
- `alt` descritivo na `<img>` (nome do usuário)
- Fallback decorativo: `aria-label` com nome quando apenas iniciais visíveis

---

## Table

**Propósito**: dados tabulares estáticos com linhas e colunas. Para tabelas com ordenação, filtros, paginação ou edição inline, usar **DataTable**.

**API e exemplos**: `src/components/ui/table.ts` + stories + `TableDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div wrapper (overflow-auto)
└── table
    ├── caption (obrigatório, sr-only se captionHidden)
    ├── thead
    │   └── tr
    │       └── th scope="col" (texto da coluna)
    └── tbody
        └── tr (hover:bg-muted/50, border-b)
            └── td
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `caption` | — | Descrição da tabela (obrigatório) |
| `captionHidden` | `false` | Aplica `sr-only` no caption |
| `headers` | — | Cabeçalhos das colunas |
| `rows` | — | Array de arrays (células) |

**Regras**:
- `<caption>` obrigatório (pode ser `sr-only` via `captionHidden: true`)
- `scope="col"` em todo `<th>` de coluna
- Padding em `--spacing-2` por célula; cabeçalho com altura em `--spacing-10`
- Wrapper com `overflow-auto` para responsividade horizontal
- Última linha sem border-bottom (`[&_tr:last-child]:border-0`)
- Tokens: `text-muted-foreground` no cabeçalho; corpo em `text-foreground`

**Acessibilidade**:
- `<caption>` obrigatório
- `scope="col"` em headers de coluna; `scope="row"` se houver headers de linha
- Para tabelas de layout, prefira CSS Grid — `<table>` é apenas para dados

---

## Skeleton

Ver `07-feedback-components.md`.

---

## Chart

**Propósito**: visualização de dados quantitativos — barras, linhas, área e pizza — com cores, tipografia e eixos vindos dos tokens do design system.

**API e exemplos**: `src/components/ui/chart.ts` + stories + `ChartDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> Camada sobre **Apache ECharts**. O container registra o tema do design system a partir dos tokens do `<html>` e o reaplica quando a classe muda — trocar marca, modo escuro, densidade ou fonte recolore o gráfico sem recarregar. Chamar a lib direto pula esse registro e o desenho sai com a paleta padrão dela. A factory recebe as opções e devolve o elemento pronto para anexar; a montagem do desenho é deferida até o elemento estar conectado ao documento.

**Estrutura**:

```
container (data-slot="chart", class .nds-chart, role="img", descrição)
├── frase de estado vazio (.nds-chart-empty)   ← quando não há série com dado
└── desenho da lib (svg por padrão, canvas opcional)
    ├── eixos e grade
    ├── formas de dado (barra, traçado, área, fatia) com trama sobreposta
    └── legenda
```

**Entradas**: tipo, dados (forma simples ou multi-série), eixo de categorias, altura, renderer, título, legenda, frase de estado vazio e descrição do gráfico.

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

**Acessibilidade** (ver `11-acessibilidade.md`):
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

**Stack**: factory `createDataTable<TData>(opts)` em `src/components/ui/data-table.ts` sobre **`@tanstack/table-core`** v8 (engine headless) + **`@tanstack/virtual-core`**. Renderiza HTML semântico via DOM nativo reusando o factory `createTable` do design system para preservar tokens 8-grid e a11y.

**API e exemplos**: `src/components/ui/data-table.ts` + stories + `DataTableDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Flags principais** (todas opcionais): `enableGlobalFilter` (default `true`), `enableColumnVisibility` (default `true`), `enableColumnFilters`, `enableRowSelection`, `enableColumnResizing`, `enableColumnOrdering`, `enableColumnPinning`, `enablePagination` (default `true`), `virtualized` (desliga paginação).

**`ColumnMeta` (Nortear)**:

| Chave | Tipo | Função |
|---|---|---|
| `filter` | `{ type: 'text' \| 'select'; options?: string[] }` | Input/select por coluna |
| `editable` | `boolean` | Marca a coluna como editável inline |
| `renderCell` | `(ctx) => HTMLElement \| string` | DOM nativo para markup rico (badges, ícones, links). Sem JSX/snippets na stack vanilla |
| `cellClass` | `string` | Classes extras no `<td>` |

**i18n**: o factory aceita uma opção `labels` para sobrescrever todas as strings (Colunas, Linhas por página, Página, de, Primeira/Anterior/Próxima/Última página, etc.). Sem `labels`, defaults em pt-BR. As docs pages passam `t('demonstration.labels.*')` para refletir o locale ativo.

**Regras**:
- Defina `columns` em escopo de módulo ou memoize — recriar zera o estado da engine
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática
- Selects de filtro recebem `filterFn: 'equals'` automaticamente; texto usa `includesString`
- Tokens 8-grid obrigatórios em CSS — `--spacing-1/2/4/6/8/10/24`. Off-grid (3, 5, 7, 9) são bugs
- Estilos em `src/styles/components/data-table.css` registrado em `globals.css` — classes `.nds-data-table-*`
- `data` nunca é mutado pelo componente — para edição inline, atualize o array externamente no handler de `onCellEdit`
- Para markup rico, use `meta.renderCell` retornando `HTMLElement` (preferido) ou `string` (escape automático)
- `virtualized` e `enablePagination` são mutuamente exclusivos; virtualização desativa paginação

**Acessibilidade**:
- HTML semântico real (`<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<td>`)
- `aria-sort` no `<th>` ordenável (`ascending` / `descending` / `none`)
- `aria-label` contextual em todos os botões via `labels.sortBy(col)`, `labels.filter(col)`, etc.
- Checkbox de cabeçalho com `indeterminate` em seleção parcial (tri-state)
- Handle de resize: `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa
