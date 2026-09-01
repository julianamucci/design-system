# Display Components (Nortear — Vanilla TypeScript)

---

## Avatar

**Propósito**: representação visual de um usuário (foto ou iniciais como fallback).

**API e exemplos**: `src/components/ui/avatar.ts` + stories + `AvatarDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
span.nds-avatar (data-size)
├── img.nds-avatar-image (quando src + onload OK)
├── span.nds-avatar-fallback (iniciais ou ícone)
└── span.nds-avatar-badge (opcional — sinal de estado no canto)
```

Em fila, os avatares vão dentro de `.nds-avatar-group`, que sobrepõe cada um ao anterior; o excedente é `.nds-avatar-group-count` (+N).

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `src` | — | URL da imagem |
| `alt` | — | Texto alternativo |
| `fallbackText` | — | Iniciais (obrigatório) |
| `size` | `md` | `sm` (24px), `md` (32px), `lg` (40px), `xl` (48px), `2xl` (64px) — sai como `data-size` |
| `delayMs` | — | Espera antes de mostrar o fallback, para a imagem rápida não fazer as iniciais piscarem |

**Regras**:
- **O tamanho é opção da fábrica, não classe.** Ele sai como `data-size` no root, e a folha `avatar.css` resolve a medida numa custom property (`--avatar-size`) que a tipografia das iniciais e o sinal de estado acompanham por cálculo. Medida escrita no call site quebra essa cadeia: o círculo muda e as iniciais não
- Cinco degraus, todos na grade de 8: 24, 32, 40, 48 e 64px. Medida fora deles vem da custom property `--avatar-size`, nunca de um número solto
- O círculo é da folha: raio `--radius-full` e recorte no filho, não no root — recorte no root cortava o sinal de estado, que é posicionado justamente fora do círculo
- Fallback obrigatório mesmo quando `src` existe — exibido se a imagem falhar (`onerror`)
- A imagem preserva proporção pelo `object-fit: cover` declarado em `.nds-avatar-image`; nada a acrescentar no call site
- O fallback lê `--muted` / `--muted-foreground` pela própria folha

**Acessibilidade**:
- `alt` descritivo na `<img>` (nome do usuário)
- Fallback decorativo: `aria-label` com nome quando apenas iniciais visíveis

---

## Table

**Propósito**: dados tabulares estáticos com linhas e colunas. Para tabelas com ordenação, filtros, paginação ou edição inline, usar **DataTable**.

**API e exemplos**: `src/components/ui/table.ts` + stories + `TableDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div.nds-table-wrapper                        (rola na horizontal, tabindex="0")
└── table.nds-table
    ├── caption (obrigatório; .nds-sr-only quando captionHidden)
    ├── thead
    │   └── tr
    │       └── th scope="col" (texto da coluna)
    └── tbody
        └── tr                               (a folha já dá o realce ao passar o ponteiro)
            └── td
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `caption` | — | Descrição da tabela (obrigatório) |
| `captionHidden` | `false` | Aplica `.nds-sr-only` no caption |
| `headers` | — | Cabeçalhos das colunas |
| `rows` | — | Array de arrays (células) |

**Regras**:
- `<caption>` obrigatório (pode ficar fora da tela via `captionHidden: true`, que aplica `.nds-sr-only`)
- `scope="col"` em todo `<th>` de coluna
- Padding por célula em `--spacing-*`; o cabeçalho não recebe altura fixa — ela é resultado do padding e da entrelinha, para a tabela crescer com a fonte do navegador (WCAG 1.4.4)
- A rolagem horizontal é do `.nds-table-wrapper`, e é ele quem tem `tabindex="0"`. Uma camada rolando por tabela — camada rolável sem foco reprova WCAG 2.1.1 (axe `scrollable-region-focusable`), e duas camadas roláveis aninhadas prendem o teclado
- Realce ao passar o ponteiro, linha selecionada, divisa entre linhas e a supressão da divisa na última já vêm de `.nds-table`. Nada disso se declara no call site
- Tokens lidos pela folha: `--muted-foreground` no cabeçalho e na legenda, `--foreground` no corpo, `--border` nas divisas, `--muted` no realce

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

**Nome da tabela e identidade da linha** (todas opcionais):

| Opção | Tipo | Função |
|---|---|---|
| `caption` | `string` | Nome acessível da grade. Vira legenda fora da tela — anunciada pelo leitor, invisível na página |
| `rowKey` | `(row, index) => string` | Identidade estável da linha. Sem ela a identidade é a POSIÇÃO, e ordenar leva a marcação para quem ocupou o lugar |
| `rowLabel` | `(row) => string` | Texto que identifica a linha no nome do controle de seleção. Sem ela o identificador sai da primeira coluna de dados, e só cai na chave da linha quando essa coluna vem vazia |

**i18n**: o factory aceita uma opção `labels` para sobrescrever todas as strings (Colunas, Linhas por página, Página, de, Primeira/Anterior/Próxima/Última página, etc.). Sem `labels`, defaults em pt-BR. As docs pages passam `t('demonstration.labels.*')` para refletir o locale ativo. Duas chaves são FUNÇÕES por dependerem da linha ou da coluna: `selectRow(linha)` — texto fixo aqui produziria dez controles homônimos — e `noFilter(coluna)`, o texto da célula sem filtro.

**Regras**:
- Defina `columns` em escopo de módulo ou memoize — recriar zera o estado da engine
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática
- Selects de filtro recebem `filterFn: 'equals'` automaticamente; texto usa `includesString`
- Tokens 8-grid obrigatórios em CSS — `--spacing-1/2/4/6/8/10/24`. Off-grid (3, 5, 7, 9) são bugs
- Estilos em `docs/shared/styles/nds/data-table.css`, alcançado por `globals.css` pelo alias `@shared/styles/nds/` — classes `.nds-data-table-*`
- `data` nunca é mutado pelo componente — para edição inline, atualize o array externamente no handler de `onCellEdit`
- Para markup rico, use `meta.renderCell` retornando `HTMLElement` (preferido) ou `string` (escape automático)
- `virtualized` e `enablePagination` são mutuamente exclusivos; virtualização desativa paginação

**Acessibilidade**:
- HTML semântico real (`<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<td>`)
- `aria-sort` no `<th>` ordenável (`ascending` / `descending` / `none`)
- `aria-label` contextual em todos os botões via `labels.sortBy(col)`, `labels.filter(col)`, etc.
- Checkbox de cabeçalho com `indeterminate` em seleção parcial (tri-state)
- Cada checkbox de linha carrega o identificador daquela linha no nome; nome repetido em dez controles é o mesmo que nome nenhum (WCAG 4.1.2)
- Uma só camada rola na horizontal, e é a do primitivo Table — a única com `tabindex="0"`. O contêiner externo é moldura e, no modo virtualizado, dono da rolagem vertical (WCAG 2.1.1, axe `scrollable-region-focusable`)
- Handle de resize: `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa
