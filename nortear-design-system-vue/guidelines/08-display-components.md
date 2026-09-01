# Display Components

---

## Avatar

**Propósito**: representação visual de um usuário via foto de perfil ou iniciais como fallback.

**API e exemplos**: `src/components/ui/avatar/avatar.vue` + stories + `AvatarDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
Avatar (size)
├── AvatarImage    (imagem — exibida quando carregada com sucesso)
├── AvatarFallback (fallback — exibido enquanto carrega ou quando falha)
└── AvatarBadge    (indicador de status — opcional, posicionado pela folha)

AvatarGroup        (sobreposição de vários avatares)
├── Avatar
├── Avatar
└── AvatarGroupCount (contador +N do excedente)
```

**Tamanhos** (prop `size`, que chega ao DOM como `data-size`):

| `size` | Medida | Uso |
|--------|--------|-----|
| `sm` | 24px | listas densas, chips, células de tabela |
| `md` | 32px | **padrão** — se `size` não for informado, é este |
| `lg` | 40px | cabeçalho de card, item de lista com duas linhas |
| `xl` | 48px | destaque em painel de perfil |
| `2xl` | 64px | página de perfil, estado vazio ilustrado |

A medida saiu de utilitária de altura e virou preset da folha: `.nds-avatar[data-size]` define `--avatar-size`, e dela derivam também o corpo da tipografia das iniciais, a espessura do badge de status e o diâmetro do contador `+N` do grupo. Utilitária de tamanho quebraria essa cadeia — mudaria o círculo e deixaria iniciais e badge no tamanho antigo. A forma antiga é ativamente proibida: `avatar.source.test.ts` afirma que os construtores de snippet **não contêm** `nds-size-`.

**Regras**:
- `size` ausente vale `md` — declarar `md` explicitamente só quando o valor comunica intenção no exemplo
- `AvatarFallback` obrigatório — sem ele, falha de imagem resulta em elemento vazio
- `delay-ms="600"` no `AvatarFallback` — previne o piscar do fallback durante carregamento normal de rede
- Formato circular: a folha aplica o raio total; o recorte é de cada filho, não da raiz — é isso que deixa o badge de status aparecer fora do círculo
- Indicador de status: `AvatarBadge`, filho do Avatar. A folha o posiciona no canto e o dimensiona conforme o `data-size` do pai
- Geração de iniciais: primeira letra do primeiro nome + primeira letra do sobrenome ("João da Silva" → "JS", não "JO")
- Grupo de avatares: `AvatarGroup`. A sobreposição e o anel na cor do fundo são da folha `.nds-avatar-group` — não recriar com margem negativa e anel à mão, que descolam quando o tamanho muda

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `alt` obrigatório no `AvatarImage` — sem ele, leitores de tela anunciam a URL da imagem
- Avatar informativo: `alt="Foto de perfil de [Nome]"`
- Avatar decorativo (aparência, sem identidade): `alt=""`
- `AvatarFallback` com `aria-hidden="true"` quando o nome do usuário já está visível na interface

**Analytics**: Avatar sem ação não dispara eventos. Avatar clicável (link para perfil): `button_click` ou `navigation_click` com `label`.

---

## Carousel

**Propósito**: exibição sequencial de itens (imagens, cards) em container com navegação.

**API e exemplos**: `src/components/ui/carousel/carousel.vue` + stories + `CarouselDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> Construído sobre **Embla Carousel**. Auto-play e dots de navegação **não são nativos** — requerem plugins/implementações separadas.

**Estrutura de subcomponentes**:

```
Carousel (opts, plugins, orientation, setApi)
├── CarouselContent
│   └── CarouselItem
├── CarouselPrevious
└── CarouselNext
```

**Tamanho dos itens**: o `CarouselItem` é `.nds-carousel-slide`, e a folha o dimensiona — um slide por vez, ocupando a largura inteira do recorte. Mais de um item por vez exige encolher a base do slide, e **o design system não tem utilitária de fração de largura** para isso (ver "Utilitárias ausentes", no fim deste arquivo): até que exista, componha mais de um item DENTRO de um slide, ou trate o layout de vários por vez como caso de produto, fora do vocabulário compartilhado. Nunca cravar a fração num estilo inline: o valor sai do tema e da densidade junto.

**Espaçamento entre itens**: da folha. `.nds-carousel-slide` traz o respiro e `.nds-carousel-track` traz a compensação negativa que deixa o primeiro slide rente à borda. Não replicar o par à mão — descasar os dois desalinha o passo inteiro do carrossel.

**Opções do Embla** (via prop `opts`): `loop`, `align`, etc.

**Regras**:
- Sempre exibir `CarouselPrevious` e `CarouselNext` — exceto instrução específica
- `loop: true` para carrosséis com auto-play — evita parada abrupta no último item
- `stopOnInteraction: true` no plugin Autoplay — para ao usuário interagir
- `aria-label` obrigatório nos botões de navegação
- Dots de navegação: implementação customizada via `CarouselApi` + `setApi`

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `role="group"` e `aria-roledescription="slide"` aplicados em cada `CarouselItem` automaticamente
- `CarouselPrevious` e `CarouselNext` devem ter `aria-label` descritivo
- Touch/swipe nativo do Embla; alternativa por teclado via Arrow keys nos botões de navegação
- Movimento reduzido: a folha já para o recuo do slide vizinho sob `prefers-reduced-motion`, e o motor de rolagem respeita a preferência. Animação personalizada acrescentada por cima tem de parar sob a mesma condição — se vier de utilitária de animação avulsa, somar `.nds-motion-reduce-none`

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`): `slide_change` com `index`, `total`, `trigger` ("button" ou "swipe") — registrado no callback `on("select")` da API do Embla.

---

## Chart

**Propósito**: visualização de dados quantitativos — barras, linhas, área e pizza — com cores, tipografia e eixos vindos dos tokens do design system.

**API e exemplos**: `src/components/ui/chart/ChartContainer.vue + index.ts` + stories + `ChartDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

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


## Table

**Propósito**: exibição de dados tabulares estruturados com semântica HTML correta.

**API e exemplos**: `src/components/ui/table/table.vue` + stories + `TableDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
div.nds-table-wrapper
└── Table
    ├── TableCaption   (descrição da tabela — lida por leitores de tela)
    ├── TableHeader
    │   └── TableRow
    │       └── TableHead (th — cabeçalho de coluna, scope="col")
    ├── TableBody
    │   └── TableRow
    │       └── TableCell (td)
    └── TableFooter
        └── TableRow
            └── TableCell (totais, sumários)
```

**Regras**:
- `.nds-table-wrapper` envolvendo a tabela — rolagem horizontal em telas estreitas é obrigatória, e é a folha do wrapper que a define
- `TableCaption` obrigatório — pode ser visualmente oculto (`.nds-sr-only`) quando o contexto visual já é claro; oculto para os olhos, presente para o leitor de tela
- `scope="col"` em todos os `TableHead` — associa cabeçalhos às células para leitores de tela
- Estado vazio obrigatório — nunca tabela vazia sem mensagem
- `aria-label` contextual nos botões de ação por linha — "Ações para fatura INV001"
- `TableFooter` para totais e sumários — não usar linha de body para isso
- Para ordenação, filtragem, seleção, paginação e edição: usar **DataTable** (próxima seção) — `Table` é apenas a camada visual semântica

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `TableCaption` lida pelos leitores de tela antes das células — descreve o propósito da tabela
- `scope="col"` em `TableHead` — obrigatório para mapear cabeçalhos às células
- Botões de ação por linha: `aria-label` contextual incluindo o identificador da linha
- Ordenação: `aria-sort="ascending"` / `"descending"` / `"none"` nos `TableHead` com ordenação ativa
- Tabela dentro de `.nds-table-wrapper`: `tabindex="0"` no wrapper, para que quem usa teclado possa focá-lo e rolar na horizontal com as setas (WCAG 2.1.1; axe `scrollable-region-focusable`). Uma só camada rola e recebe o `tabindex` — duas produzem parada dupla no Tab

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Cabeçalhos de coluna: substantivos curtos, sem ponto final, capitalização na primeira palavra
- Estado vazio: "Nenhum [item] encontrado." — tom encorajador quando há CTA disponível
- Botão de ação: `aria-label` contextual — "Editar fatura INV001", não apenas "Editar"

**Analytics**: a tabela em si não dispara eventos. Ações dentro da tabela seguem os eventos do componente correspondente (`button_click`, `navigation_click`).

---

## DataTable

**Propósito**: tabela avançada para datasets que exigem interação — ordenação, filtros, seleção, paginação, redimensionamento, reordenação, fixação, edição inline e virtualização. Construída sobre **`@tanstack/vue-table` v8** (headless) + **`@tanstack/vue-virtual`**, encapsulando a engine numa camada visual que reusa o primitivo `Table` do design system.

> Use `Table` quando os dados são estáticos e cabem na tela. Use `DataTable` quando o usuário precisa explorar, filtrar ou editar.

**API e exemplos**: `src/components/ui/data-table/data-table.vue` + stories + `DataTableDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
DataTable
├── Toolbar (GlobalFilter + DropdownMenu de visibilidade/pin)
├── Container rolável (assume a rolagem vertical quando virtualizado)
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

**Eventos**:

| Evento | Payload | Quando |
|---|---|---|
| `@cell-edit` | `(rowIndex, columnId, value)` | Edição inline confirmada (`Enter` ou blur) |
| `@table-ready` | `(table: Table<TData>)` | Após mount; expõe instância para ações em lote, export, etc. |


**Nome da tabela e identidade da linha** (todas opcionais):

| Prop | Tipo | Função |
|---|---|---|
| `caption` | `string` | Nome acessível da grade. Vira legenda fora da tela — anunciada pelo leitor, invisível na página |
| `rowKey` | `(row, index) => string` | Identidade estável da linha. Sem ela a identidade é a POSIÇÃO, e ordenar leva a marcação para quem ocupou o lugar |
| `rowLabel` | `(row) => string` | Texto que identifica a linha no nome do controle de seleção. Sem ela o identificador sai da primeira coluna de dados, e só cai na chave da linha quando essa coluna vem vazia |
| `labels` | `Partial<DataTableLabels>` | Textos da interface. Só as chaves informadas mudam; o resto fica no padrão pt-BR |

**i18n**: `labels` cobre rótulos de controle, contagens e navegação. Duas chaves são FUNÇÕES por dependerem da linha ou da coluna: `selectRow(linha)` — texto fixo aqui produziria dez controles homônimos — e `noFilter(coluna)`, o texto da célula sem filtro. Mantenha `labels` numa referência estável (módulo ou `computed`): objeto novo a cada render remonta as colunas.

**Regras**:
- Defina `columns` numa referência estável (módulo ou `computed`) — recriar a cada render zera o estado da tabela.
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde.
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática e o handle fica imprevisível.
- Selects de filtro recebem `filterFn: "equals"` automaticamente; texto usa `includesString`.
- O componente aplica `table-fixed` ao usar `enableColumnResizing`, `enableColumnOrdering` ou `virtualized` — força layout O(1) por coluna e evita travamento em datasets grandes.
- `data` nunca é mutado pelo componente — para edição inline, atualize a `ref` externamente no handler de `@cell-edit`.
- `virtualized` e `enablePagination` são mutuamente exclusivos; ativar virtualização desliga paginação automaticamente.

**Acessibilidade** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- Tabela semântica via primitive `Table` — `<th>`, `<tr>`, `<td>` reais
- `aria-sort="ascending|descending|none"` no `<th>` ordenável — anunciado pelo leitor de tela
- `aria-label` contextual obrigatório nos botões: "Ordenar por <em>coluna</em>", "Filtrar <em>coluna</em>", "Selecionar linha", "Próxima página"
- Checkbox de cabeçalho usa `indeterminate` quando há seleção parcial (tri-state)
- Cada checkbox de linha carrega o identificador daquela linha no nome; nome repetido em dez controles é o mesmo que nome nenhum (WCAG 4.1.2)
- Uma só camada rola na horizontal, e é a do primitivo Table — a única com tabindex zero. O contêiner externo é moldura e, no modo virtualizado, dono da rolagem vertical (WCAG 2.1.1, axe scrollable-region-focusable)
- Handle de resize tem `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa

**Analytics**: passivo por padrão. Para rastrear interações (sort, filter, edit confirmado), consuma a instância via `@table-ready` e instrumentaliza no caller.

---

## Regras transversais de Display Components

**Acessibilidade transversal** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `AvatarImage`: `alt` obrigatório em todos os casos (descritivo ou vazio para decorativo)
- `Chart`: `role="img"` mais descrição no container; para gráfico denso ou dado crítico, resumo textual à parte — pode ficar visualmente oculto com `.nds-sr-only`
- `Table`: `TableCaption` obrigatório + `scope="col"` nos cabeçalhos
- Carousel: `aria-label` nos botões de navegação
- Movimento reduzido: as folhas `.nds-*` já param sob `prefers-reduced-motion`, e o Chart anima pelos mesmos tokens de duração do resto do sistema. Animação personalizada acrescentada por cima tem de parar sob a mesma condição — se vier de utilitária de animação avulsa, somar `.nds-motion-reduce-none`

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Carousel | `slide_change` | A cada mudança de slide |
| Avatar clicável | `button_click` ou `navigation_click` | Ao clicar |
| Chart | — | Passivo, sem eventos padrão |
| Table | — | Passivo; ações internas rastreadas pelos componentes de ação |
| DataTable | — | Passivo; rastreio de sort/filter/edit feito no caller via `@table-ready` |

---

## Utilitárias ausentes

Lacunas medidas no vocabulário `.nds-*`, registradas aqui para que ninguém as preencha com valor cravado à mão. Enquanto a utilitária não existir, a saída é recompor com o que existe — nunca um estilo inline, que passa por cima da folha e leva o tema, a densidade e a escala tipográfica junto.

| O que falta | Onde aparece | Contorno enquanto não existe |
|---|---|---|
| Fração de largura para o slide (meia, um terço) | Carousel, "mais de um item por vez" | Compor vários itens dentro de um slide, ou tratar o layout como caso de produto |
