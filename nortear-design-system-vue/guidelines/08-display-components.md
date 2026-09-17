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


## Table — mecânica desta stack

O que o componente É — contrato, decisões com data e medição, tokens e peças das
cinco stacks — está em [`docs/shared/prd/table.md`](../../docs/shared/prd/table.md).
A regra da CATEGORIA, que atravessa Table, DataTable e Pagination, está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md): acessibilidade da
tabela, legenda, estado vazio, altura e alinhamento, rolagem, tom de voz e
analytics.

**API e exemplos**: `src/components/ui/table/table.vue` + stories + `TableDocs.vue` (renderizada na aba Docs do Storybook).

O que é desta stack:

| o quê | como é aqui |
|---|---|
| forma das peças | nove SFCs, cada uma com `class` mais `<slot />`, sem `Primitive` da reka-ui — a tag é literal no template, porque trocar a tag mudaria a semântica |
| `scope` do cabeçalho | `withDefaults` no `TableHead`, com `col` de padrão. **Não se escreve `scope="col"` no markup**: o default já nasce na peça, e o teste do painel Code afirma a AUSÊNCIA do atributo de propósito. O que se escreve é o caso que o default não cobre, `scope="row"` |
| contêiner que rola | renderizado pelo PRÓPRIO componente, junto com a `<table>`. **Nunca envolver o componente num wrapper próprio** — seriam duas camadas roláveis, e só uma está na ordem de tabulação; o teste do painel Code afirma que o snippet da tabela larga não configura rolagem nenhuma |
| `TableEmpty` | peça publicada só nesta stack, a nona. É escolha de CONTRATO, não de marcação, e está registrada como divergência de forma no PRD — que é onde ela se descreve |

---

## DataTable — mecânica desta stack

Contrato, decisões com data e medição, tokens e peças das cinco stacks:
[`docs/shared/prd/data-table.md`](../../docs/shared/prd/data-table.md). Regra da
categoria: [`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md) — e é lá
que está a fronteira entre o rodapé deste componente e o componente Pagination,
que não se compõem em stack nenhuma.

**API e exemplos**: `src/components/ui/data-table/data-table.vue` + stories + `DataTableDocs.vue` (renderizada na aba Docs do Storybook).

**O motor desta stack**: `@tanstack/vue-table`, mais `@tanstack/vue-virtual` para a
virtualização. A versão instalada é a **9**, e nela cada recurso é REGISTRADO em
vez de vir ligado — é o que explica existirem dois conjuntos de recursos, um com
paginação e outro sem, e o estado de paginação sair de um átomo. Documento que
disser "v8" está vencido.

**Como a reatividade chega ao motor**: o estado entra em `useTable` por GETTERS, e
não por valor. Daí a regra prática desta stack, que vale para os dois objetos:
`columns` e `labels` moram em REFERÊNCIA ESTÁVEL — módulo ou `computed` —, porque
objeto novo a cada render remonta as colunas e zera o estado da tabela.

**Eventos**:

| Evento | Payload | Quando |
|---|---|---|
| `@cell-edit` | `(rowIndex, columnId, value)` | Edição em linha confirmada — Enter ou saída do campo. Escape descarta e NÃO emite |
| `@table-ready` | a instância da tabela | Depois da montagem. É por ela que se instrumenta ordenação, filtro e edição no call site, porque o componente é passivo em analytics |

**Duas mecânicas do motor que valem aqui**: para redimensionar ou reordenar,
defina o tamanho inicial na definição da coluna, senão o cabeçalho usa largura
automática e a alça fica imprevisível; e filtro de seleção recebe `equals`
automaticamente, enquanto filtro de texto casa por `includesString`.

O componente **nunca muta a lista que recebe**: a edição avisa, e quem consome
atualiza a `ref` no tratador de `@cell-edit`. É o que permite `data` vir de um
recorte de servidor.

---

## Regras transversais de Display Components

**Acessibilidade transversal** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- `AvatarImage`: `alt` obrigatório em todos os casos (descritivo ou vazio para decorativo)
- `Chart`: `role="img"` mais descrição no container; para gráfico denso ou dado crítico, resumo textual à parte — pode ficar visualmente oculto com `.nds-sr-only`
- Carousel: `aria-label` nos botões de navegação
- Movimento reduzido: as folhas `.nds-*` já param sob `prefers-reduced-motion`, e o Chart anima pelos mesmos tokens de duração do resto do sistema. Animação personalizada acrescentada por cima tem de parar sob a mesma condição — se vier de utilitária de animação avulsa, somar `.nds-motion-reduce-none`

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Carousel | `slide_change` | A cada mudança de slide |
| Avatar clicável | `button_click` ou `navigation_click` | Ao clicar |
| Chart | — | Passivo, sem eventos padrão |

---

## Utilitárias ausentes

Lacunas medidas no vocabulário `.nds-*`, registradas aqui para que ninguém as preencha com valor cravado à mão. Enquanto a utilitária não existir, a saída é recompor com o que existe — nunca um estilo inline, que passa por cima da folha e leva o tema, a densidade e a escala tipográfica junto.

| O que falta | Onde aparece | Contorno enquanto não existe |
|---|---|---|
| Fração de largura para o slide (meia, um terço) | Carousel, "mais de um item por vez" | Compor vários itens dentro de um slide, ou tratar o layout como caso de produto |
