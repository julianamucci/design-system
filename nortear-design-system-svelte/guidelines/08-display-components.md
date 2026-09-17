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

## Table — a mecânica desta stack (Svelte 5)

O que o componente É — contrato, anatomia completa, tokens, estados e peças das
cinco stacks — está em
[`docs/shared/prd/table.md`](../../docs/shared/prd/table.md). A regra da categoria
— quando é tabela e quando é grade CSS, acessibilidade da tabela, altura,
alinhamento e estado vazio — está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md).

Vá à anatomia do PRD para a árvore inteira: a que estava aqui não mencionava o
`tfoot`, e a peça existe (`table-footer.svelte`) e é estilizada pela folha.

Desta stack, e só daqui — oito componentes com `ref` bindável, `class` e
`restProps`, com o índice exportando as formas curtas (`Root`, `Body`, `Head`…) ao
lado das longas:

- **`table.svelte` renderiza o par contêiner + `<table>`**, e o contêiner leva um
  `svelte-ignore` de `a11y_no_noninteractive_tabindex`: a regra do compilador só
  aceita papel de widget, e nem `region` nem `group` a dispensam. O contêiner é a
  ÚNICA camada que rola, e quem o monta é o componente — não o envolva noutro.
- **`scope` nasce `col` na própria peça de cabeçalho**, com o motivo escrito lá.
  Por isso ele **não se escreve no markup**: `table.source.test.ts` cobra a
  AUSÊNCIA do atributo no snippet do painel Code, porque repetir o default
  ensinaria que a acessibilidade depende de alguém lembrar. O que se escreve é o
  caso que o default não cobre, `scope="row"`.

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


## DataTable — a mecânica desta stack (Svelte 5)

O que o componente É — contrato, as flags e seus padrões, anatomia, tokens,
estados, API e peças das cinco stacks — está em
[`docs/shared/prd/data-table.md`](../../docs/shared/prd/data-table.md). A regra da
categoria — acessibilidade da tabela, uma só camada rolável, altura, estado vazio
e a fronteira entre este rodapé e o componente Pagination — está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md).

**O motor, e é nele que esta stack difere das outras quatro**: não há adaptador.
O `@tanstack/svelte-table` não é usado — é incompatível com Svelte 5 —, e o
componente consome `@tanstack/table-core` (hoje `^9.1.2`, não v8) direto por
`constructTable`, com a tabela em `$state.raw` construída num `$effect.pre`. O
virtualizador é o `@tanstack/svelte-virtual`, e ele precisa de um contador de
medições próprio porque o store do adaptador reemite sempre o MESMO objeto, e
`$derived` nunca invalidaria.

**Dois módulos que só existem aqui**, cada um por um motivo de linguagem:

| arquivo | por que está fora do `.svelte` |
|---|---|
| `data-table-features.ts` | o índice importa o componente e o componente precisa do conjunto de recursos — juntos fechariam ciclo de import. E `createRecursos(comPaginacao)` nasce por INSTÂNCIA: as ligações de reatividade guardam estado, e um conjunto compartilhado misturaria as assinaturas de todas as tabelas da página |
| `data-table-labels.ts` | arquivo de componente não exporta tipo — quem consome precisa de `DataTableLabels` para montar o objeto parcial |

**O `ColumnMeta` é próprio desta stack**: `filter`, `editable`, `format`,
`badgeVariant` e `cellClass`. Os três últimos existem por causa de um limite do
wrapper local — **o `cell` Snippet ainda não é suportado** —, então markup rico
sai por `badgeVariant`, que embrulha a célula num `<Badge>`, ou por `cellClass`,
que acrescenta classes `.nds-*` no `<td>`.

**Duas formas de zerar a tabela sem querer**, as duas de reatividade: defina
`columns` no top-level do `<script>` ou em `$derived`, porque recriar o array a
cada update zera o estado do motor; e mantenha `labels` numa referência estável,
porque objeto novo a cada render remonta as colunas.
