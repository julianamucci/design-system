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


## Table — mecânica desta stack

O que o Table É — contrato, decisões com data e medição, tokens e peças das cinco
stacks — está em [`docs/shared/prd/table.md`](../../docs/shared/prd/table.md). A
regra da CATEGORIA, que atravessa Table, DataTable e Pagination, está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md): qual componente
usar, acessibilidade da tabela, altura e alinhamento, estado vazio, paginar,
movimento, analytics e tom de voz, mais a tabela de quem cobra cada invariante.

**Onde o código está**: `src/components/ui/table.tsx` + stories + `TableDocs.tsx`.

O que é desta stack:

- **Oito componentes de função sobre a tag nativa**, cada um com
  `React.ComponentProps<"tag">` e `cn(className)`. Não há primitivo headless aqui,
  e não haveria o que compor: tabela é markup semântico nativo.
- **O contêiner que rola vem de DENTRO do `Table`** — ele é o único dos oito que
  renderiza dois elementos, e o único com prop própria (`regionLabel`). Nunca
  acrescente um wrapper rolável em volta do componente: o de fora rola e não entra
  na ordem de tabulação, e é o erro que a §Acessibilidade da `20-tabelas.md` chama
  de mais caro da categoria.
- **`scope` já nasce `col` no `TableHead`**, por default de parâmetro. Repetir
  `scope="col"` no markup é redundância; o que se escreve é o caso que o default
  não cobre — `scope="row"`, no cabeçalho de linha.
- **`aria-sort` é escrito na composição**, e só na coluna que de fato ordena:
  nenhuma das oito peças emite o atributo por conta própria.

---

## DataTable — mecânica desta stack

Contrato, decisões com data e medição, flags, props e peças das cinco stacks:
[`docs/shared/prd/data-table.md`](../../docs/shared/prd/data-table.md). Regra da
categoria: [`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md).

**Onde o código está**: `src/components/ui/data-table.tsx` + stories +
`DataTableDocs.tsx`.

O que é desta stack:

- **Motor `@tanstack/react-table`, major 9** — o `package.json` é quem manda —,
  com `@tanstack/react-virtual` no modo virtualizado. No 9 cada recurso é
  REGISTRADO, e daí existirem DOIS conjuntos de recursos: um com o de paginação e
  um sem. A tabela virtualizada entrega todas as linhas de propósito, porque quem
  recorta é o virtualizador.
- **Referência estável é o idioma daqui**: `columns` e `labels` em módulo ou
  `useMemo`. Objeto novo a cada render remonta as colunas e zera o estado da
  tabela.
- **Duas chaves de `labels` são FUNÇÕES**, as que dependem da linha ou da coluna:
  texto fixo ali produziria controles homônimos, e a função deixa o TS checar a
  aridade.
- **O filtro por coluna entra pelo `meta` da definição**: select recebe `filterFn`
  `"equals"`; texto usa `includesString`.
- **Para redimensionar ou reordenar, defina `size` na definição da coluna** — sem
  isso o cabeçalho usa largura automática e a alça fica imprevisível.
- **Dois callbacks de saída, e são eles que fazem o componente servir sem mandar
  nos dados**: `onCellEdit(rowIndex, columnId, value)` avisa a edição confirmada —
  o componente nunca muta `data`, quem consome atualiza o array — e
  `onTableReady(table)` entrega a instância do motor, que é por onde quem compõe
  instrumenta ordenação, filtro e edição.
- **`.nds-table-fixed` é classe da folha compartilhada**, não peça desta stack: o
  componente a escreve no `Table` quando `enableColumnResizing`,
  `enableColumnOrdering` ou `virtualized` estão ligados, para ter layout O(1) por
  coluna em dataset grande. Quem declara a regra é a folha de `data-table`.
- **O rodapé é `DataTablePagination`**, exportado à parte e vestido com o
  vocabulário `.nds-data-table-pagination*`. Ele **não** é o componente
  `Pagination`: quem monta um DataTable não compõe paginação dentro dele, porque o
  rodapé já vem.

---

## Regras transversais de Display Components

**Acessibilidade transversal** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `AvatarImage`: `alt` obrigatório em todos os casos (descritivo ou vazio para decorativo)
- `Chart`: `aria-label` no `ChartContainer` + um parágrafo visualmente oculto (`.nds-sr-only`) com o resumo dos dados
- Carousel: `aria-label` nos botões de navegação
- Movimento reduzido: sob `prefers-reduced-motion: reduce`, o Chart desliga a animação de entrada das séries e o Carousel zera a duração do deslize — o motor anima quadro a quadro em JS, e nenhuma media query alcançaria isso

**Analytics transversal** (ver `docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Carousel | `slide_change` | A cada mudança de slide |
| Avatar clicável | `button_click` ou `navigation_click` | Ao clicar |
| Chart | — | Passivo, sem eventos padrão |

Table e DataTable não entram nas duas listas acima: os dois são passivos, e o que
a categoria diz sobre acessibilidade e analytics de tabela está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md). Nesta stack, quem
quiser rastrear ordenação, filtro ou edição consome a instância por
`onTableReady`.