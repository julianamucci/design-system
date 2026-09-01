# Display Components

---

## Avatar

**Propósito**: representação visual de um usuário via foto de perfil ou iniciais como fallback.

**API e exemplos**: `src/components/ui/avatar.tsx` + stories + `AvatarDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
Avatar (size)
├── AvatarImage    (imagem — exibida quando carregada com sucesso)
└── AvatarFallback (fallback — exibido enquanto carrega ou quando falha)

AvatarGroup                (fila de avatares sobrepostos)
├── Avatar
├── Avatar
└── AvatarGroupCount       (o "+N" ao fim da fila)

AvatarBadge                (indicador de status — filho do Avatar)
```

**Tamanhos** — prop `size`, que chega ao DOM como `data-size` e é lida pelos presets da folha `.nds-avatar`:

| `size` | Diâmetro | Uso |
|---|---|---|
| `"sm"` | 24px | Compacto — listas densas |
| `"md"` (padrão) | 32px | Padrão |
| `"lg"` | 40px | Destaque |
| `"xl"` | 48px | Perfil |
| `"2xl"` | 64px | Cabeçalho de perfil |

**Por que preset, e não altura por classe**: a medida saiu da classe de altura e virou preset na folha porque o avatar é peça sem fluxo de texto — a medida é dele, e precisa responder à densidade junto com o resto do sistema. Cada preset ajusta também a tipografia das iniciais (proporcional a `--avatar-size`), o `AvatarBadge` e o `AvatarGroupCount`, coisas que uma altura solta deixaria para trás. A story `avatar-sizes.stories.tsx` afirma o `data-size` no DOM, então API e folha não podem divergir em silêncio.

**Regras**:
- Tamanho padrão `size="md"` (32px). Fora dos cinco presets, sobrescreva a var escopada `--avatar-size` (`docs/shared/guidelines/04-padroes-design-sistema.md` § Tokens de Componente) — nunca uma classe de altura, que não leva junto as iniciais, o badge nem o contador do grupo.
- `AvatarFallback` obrigatório — sem ele, falha de imagem resulta em elemento vazio.
- `delayMs={600}` no `AvatarFallback` — previne flash do fallback durante carregamento normal de rede.
- Formato circular: a folha já aplica `--radius-full`; a imagem e o fallback herdam o recorte.
- Indicador de status: elemento separado posicionado absolutamente — não é prop do Avatar.
- Geração de iniciais: primeira letra do nome + primeira letra do sobrenome. "João da Silva" → "JS" (não "JO"); nome único → 2 primeiras letras.
- Grupo de avatares sobrepostos: use `AvatarGroup`. A sobreposição e o contorno em `--background` que separa um avatar do vizinho já vêm da folha `.nds-avatar-group`; para um anel avulso fora do grupo existe `.nds-ring-background`.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
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

**Tamanho dos itens** — o slide nasce ocupando a caixa inteira (`.nds-carousel-slide`); mais de um por vez se pede com as utilitárias responsivas de base:

| Classe no `CarouselItem` | Itens visíveis |
|---|---|
| (nenhuma) | 1 — padrão |
| `.nds-basis-full` | 1, explicitamente |
| `.nds-md-basis-half` | 2, a partir de 768px |
| `.nds-lg-basis-third` | 3, a partir de 1024px |

O slide **só encolhe, nunca aumenta**: um slide maior que o próprio recorte transborda, e transbordo vira barra de rolagem nova.

**Espaçamento entre itens**: já resolvido pela folha — o track compensa com margem negativa o recuo que cada slide aplica, o que deixa o primeiro slide rente à borda. Não acrescentar recuo à mão.

**Opções do Embla** (via prop `opts`): `loop: true`, `align: "start" | "center"`.

**Regras**:
- Sempre exibir `CarouselPrevious` e `CarouselNext` — exceto instrução específica.
- `loop: true` para carrosséis com auto-play — evita parada abrupta no último item.
- `stopOnInteraction: true` no Autoplay — para ao usuário interagir.
- `aria-label` obrigatório nos botões de navegação.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- Aplica `role="group"` e `aria-roledescription="slide"` em cada `CarouselItem`.
- `CarouselPrevious` e `CarouselNext` precisam de `aria-label` descritivo.
- Touch/swipe nativo do Embla; alternativa por teclado via Arrow keys nos botões de navegação.
- Dots customizados: `role="tablist"` no wrapper + `role="tab"` + `aria-selected` em cada botão.
- Sob `prefers-reduced-motion: reduce` o deslize passa a ser instantâneo: o motor anima quadro a quadro em JS, então a preferência é lida no próprio componente — nenhuma media query alcançaria isso.

**Analytics** (ver `docs/shared/guidelines/07-analytics.md`):
- Evento `slide_change` com `index`, `total` e `trigger` ("button" ou "swipe").
- Subscrever via `api.on("select", ...)` após receber o `CarouselApi` por `setApi`.

---

## Chart

**Propósito**: visualização de dados quantitativos — barras, linhas, área e pizza — com cores, tipografia e eixos vindos dos tokens do design system.

**API e exemplos**: `src/components/ui/chart.tsx` + stories + `ChartDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

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

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `role="img"` mais descrição no container: sem nome acessível o desenho é conteúdo perdido. A descrição diz o que o gráfico mostra, não que é um gráfico.
- A informação nunca vive só na cor (WCAG 1.4.1): a trama por série vem ligada por padrão e a legenda nomeia cada série por escrito.
- Os 3:1 de objeto gráfico (WCAG 1.4.11) vêm do CONTORNO das formas em `--foreground`, não da cor de série — as cores da paleta ficam em torno de 2:1 contra o fundo e sozinhas não sustentam o critério.
- Texto de eixo em `--muted-foreground`, com 4.5:1 contra o fundo.
- Gráfico denso ou dado crítico pede resumo textual à parte, com pico, mínimo e tendência.
- Animação respeita `prefers-reduced-motion`, pelos mesmos tokens de duração do resto do sistema.

**Analytics**: passivo — o gráfico não dispara evento por padrão. Interações específicas (dica sob o ponteiro, clique na legenda) se rastreiam via callback da lib quando forem relevantes para o produto.

---


## Table

**Propósito**: exibição de dados tabulares estruturados com semântica HTML correta. Use `Table` quando os dados são estáticos e cabem na tela; use `DataTable` quando o usuário precisa explorar, filtrar ou editar.

**API e exemplos**: `src/components/ui/table.tsx` + stories + `TableDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
div.nds-table-wrapper
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
- `.nds-table-wrapper` envolvendo a tabela — é ele que rola na horizontal quando a tabela não cabe, e é obrigatório em telas estreitas.
- `TableCaption` obrigatório — pode ficar visualmente oculto (`.nds-sr-only`) quando o contexto visual já é claro.
- `scope="col"` em todos os `TableHead` — associa cabeçalhos às células para leitores de tela.
- Estado vazio obrigatório — nunca tabela vazia sem mensagem.
- `aria-label` contextual nos botões de ação por linha — "Ações para fatura INV001".
- `TableFooter` para totais e sumários — não usar linha de body para isso.

**Ordenação, filtros, paginação**: o `Table` é apenas a camada visual (HTML semântico + estilo). Para interação rica, usar `DataTable` (`@tanstack/react-table`). Quando integrar manualmente com `@tanstack/react-table`, o `TableHead` deve receber `aria-sort` dinâmico (`"ascending"` / `"descending"` / `"none"`). Acima de 20 linhas, usar `Pagination` com `getPaginationRowModel()`.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `TableCaption` lida pelos leitores de tela antes das células — descreve o propósito da tabela.
- `scope="col"` em `TableHead` — obrigatório para mapear cabeçalhos às células.
- Botões de ação por linha: `aria-label` contextual incluindo o identificador da linha.
- Ordenação: `aria-sort="ascending"` / `"descending"` / `"none"` nos `TableHead` com ordenação ativa.

**UX Writing** (ver `docs/shared/guidelines/05-tom-de-voz.md`):
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
├── div.nds-data-table-scroll     (dono da rolagem vertical quando virtualizado)
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

**Nome da tabela e identidade da linha** (todas opcionais):

| Prop | Tipo | Função |
|---|---|---|
| `caption` | `string` | Nome acessível da grade. Vira legenda fora da tela — anunciada pelo leitor, invisível na página |
| `rowKey` | `(row, index) => string` | Identidade estável da linha. Sem ela a identidade é a POSIÇÃO, e ordenar leva a marcação para quem ocupou o lugar |
| `rowLabel` | `(row) => string` | Texto que identifica a linha no nome do controle de seleção. Sem ela o identificador sai da primeira coluna de dados, e só cai na chave da linha quando essa coluna vem vazia |
| `labels` | `Partial<DataTableLabels>` | Textos da interface. Só as chaves informadas mudam; o resto fica no padrão pt-BR |

**i18n**: `labels` cobre rótulos de controle, contagens e navegação. Duas chaves são FUNÇÕES por dependerem da linha ou da coluna: `selectRow(linha)` — texto fixo aqui produziria dez controles homônimos — e `noFilter(coluna)`, o texto da célula sem filtro. Mantenha `labels` numa referência estável (módulo ou `useMemo`): objeto novo a cada render remonta as colunas.

**Regras**:
- Defina `columns` numa referência estável (módulo ou `useMemo`) — recriar a cada render zera o estado da tabela.
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde.
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática e o handle fica imprevisível.
- Selects de filtro recebem `filterFn: "equals"` automaticamente; texto usa `includesString`.
- O componente aplica `.nds-table-fixed` (`table-layout: fixed`) ao usar `enableColumnResizing`, `enableColumnOrdering` ou `virtualized` — força layout O(1) por coluna e evita travamento em datasets grandes.
- `data` nunca é mutado pelo componente — para edição inline, atualize o array externamente via `onCellEdit`.
- `virtualized` e `enablePagination` são mutuamente exclusivos; ativar virtualização desliga paginação automaticamente.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- Tabela semântica via primitive `Table` — `<th>`, `<tr>`, `<td>` reais
- `aria-sort="ascending|descending|none"` no `<th>` ordenável — anunciado pelo leitor de tela
- `aria-label` contextual obrigatório nos botões: "Ordenar por <em>coluna</em>", "Filtrar <em>coluna</em>", "Selecionar linha", "Próxima página"
- Checkbox de cabeçalho usa `indeterminate` quando há seleção parcial (tri-state)
- Cada checkbox de linha carrega o identificador daquela linha no nome; nome repetido em dez controles é o mesmo que nome nenhum (WCAG 4.1.2)
- Uma só camada rola na horizontal, e é a do primitivo Table — a única com tabindex zero. O contêiner externo é moldura e, no modo virtualizado, dono da rolagem vertical (WCAG 2.1.1, axe scrollable-region-focusable)
- Handle de resize tem `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa

**Analytics**: passivo por padrão. Para rastrear interações (sort, filter, edit confirmado), consuma a instância via `onTableReady` e instrumentaliza no caller.

---

## Regras transversais de Display Components

**Acessibilidade transversal** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `AvatarImage`: `alt` obrigatório em todos os casos (descritivo ou vazio para decorativo)
- `Chart`: `aria-label` no `ChartContainer` + um parágrafo visualmente oculto (`.nds-sr-only`) com o resumo dos dados
- `Table`: `TableCaption` obrigatório + `scope="col"` nos cabeçalhos
- Carousel: `aria-label` nos botões de navegação
- Movimento reduzido: sob `prefers-reduced-motion: reduce`, o Chart desliga a animação de entrada das séries e o Carousel zera a duração do deslize — o motor anima quadro a quadro em JS, e nenhuma media query alcançaria isso

**Analytics transversal** (ver `docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Carousel | `slide_change` | A cada mudança de slide |
| Avatar clicável | `button_click` ou `navigation_click` | Ao clicar |
| Chart | — | Passivo, sem eventos padrão |
| Table | — | Passivo; ações internas rastreadas pelos componentes de ação |
| DataTable | — | Passivo; rastreio de sort/filter/edit feito no caller via `onTableReady` |
| Table | — | Passivo; ações internas rastreadas pelos componentes de ação |