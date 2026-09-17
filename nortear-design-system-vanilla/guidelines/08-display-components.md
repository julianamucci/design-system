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

## Table — as fábricas desta stack

O contrato do componente — peças, `data-slot`, estados, geometria e acessibilidade
— está em [`docs/shared/prd/table.md`](../../docs/shared/prd/table.md). A regra que atravessa a
categoria — qual componente escolher, uma só camada rolando, altura como piso,
estado vazio, alinhamento de coluna numérica, legenda e escopo — está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md). Aqui fica só o que é
desta stack: as sete fábricas e a forma de compor à mão.

**As fábricas, com a assinatura real de cada uma**. Não há objeto de opções em
lugar nenhum: quem monta cria os elementos e os anexa.

| Fábrica | Assinatura | Devolve |
|---|---|---|
| `createTable` | `(extraClass?, regionLabel?)` | **o par** `{ wrapper, table }` |
| `createTableHeader` | `(extraClass?)` | `<thead>` |
| `createTableBody` | `(extraClass?)` | `<tbody>` |
| `createTableFooter` | `(extraClass?)` | `<tfoot>` |
| `createTableRow` | `(extraClass?)` | `<tr>` |
| `createTableHead` | `(text, extraClass?, scope = 'col')` | `<th>` |
| `createTableCell` | `(text, extraClass?, lang?)` | `<td>` |
| `createTableCaption` | `(text, extraClass?)` | `<caption>` |

`createTable` devolver o PAR é a decisão de forma desta stack: o `wrapper` é o nó
que se anexa à página e a `table` é o nó que recebe as seções, e é isso que torna
impossível esquecer o contêiner. `regionLabel` é o segundo parâmetro posicional, e
não uma opção nomeada.

`lang` em `createTableCell` existe só aqui, para célula cujo texto é identificador
em outro idioma; nas outras stacks é atributo nativo escrito no markup.

**A composição à mão, em texto**: o `wrapper` recebe a `table`; a `table` recebe,
nesta ordem, a legenda, o cabeçalho, o corpo e o rodapé; o cabeçalho recebe uma
linha com um `createTableHead` por coluna; cada linha do corpo recebe um
`createTableCell` por célula.

**Editar `table.ts` alcança mais do que as tabelas de dados**: `DocsProps.ts` e
`DocsTokens.ts` montam as tabelas de propriedades e de tokens com estas mesmas
fábricas, então a mudança chega a todas as docs pages desta stack.

---

## Skeleton — componente de Feedback

Ele mora em
[`docs/shared/prd/skeleton.md`](../../docs/shared/prd/skeleton.md) — contrato,
tokens e peças das cinco stacks. A regra da categoria está em
[`19-feedback.md`](../../docs/shared/guidelines/19-feedback.md).

Aparece aqui porque quem procura "placeholder de conteúdo" pensa em exibição: ele
reserva a FORMA do que vem, e é decoração para o leitor de tela (`aria-hidden`
fixo nas cinco) — quem anuncia a espera é a região que vai receber o conteúdo.

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


## DataTable — a fábrica desta stack

O contrato do componente — as flags e seus padrões, a anatomia, os estados, a
geometria, os rótulos e a acessibilidade — está em
[`docs/shared/prd/data-table.md`](../../docs/shared/prd/data-table.md). A regra da categoria está
em [`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md), inclusive a
fronteira que mais se erra: o rodapé de paginação já vem de dentro, e não se compõe
o componente Pagination aqui. Aqui fica só a mecânica desta stack.

**A fábrica e o motor, sem adaptador**: `createDataTable<TData>(options)`, em
`src/components/ui/data-table.ts`, sobre `@tanstack/table-core` (`^9.1.2`) mais
`@tanstack/virtual-core`. Não há adaptador de framework: o construtor agnóstico do
core exige que alguém forneça as ligações de reatividade, e aqui usam-se as que ele
próprio publica para uso vanilla. Como essas ligações guardam estado por instância,
o conjunto de recursos nasce A CADA tabela — nunca como constante de módulo.

**Devolve elemento destruível**, e é a única stack com ciclo de vida explícito: o
menu de colunas pendura ouvinte de clique no `document`, e a fábrica solta o
anterior antes de pendurar o seu.

**Veste o primitivo desta stack**: importa `createTable`, `createTableHeader`,
`createTableBody`, `createTableRow` e `createTableCaption` de `./table` — daí vêm o
contêiner que rola, a legenda e os tokens. As células e os `<th>` são montados aqui.

**O `meta` da coluna — os campos que o tipo desta stack realmente lê**:

| Chave | Tipo | Função |
|---|---|---|
| `filter` | `{ type: 'text' \| 'select'; options?: string[]; placeholder?: string }` | campo ou select de filtro por coluna |
| `editable` | `boolean` | marca a coluna como editável na célula |
| `headerLabel` | `string` | rótulo da coluna para os nomes acessíveis, quando o cabeçalho não é texto |
| `renderCell` | `(ctx: { value, row, rowIndex }) => HTMLElement \| string` | markup rico sem JSX |

`renderCell` é a forma de montar badge, ícone ou link nesta stack, que não tem JSX
nem snippet de template: devolvendo `HTMLElement` o nó é anexado à célula;
devolvendo `string` o valor vai para `textContent`, ou seja **com escape
automático**.

**A folha e o alias**: `docs/shared/styles/nds/data-table.css`, com as classes
`.nds-data-table-*`. Ela é alcançada pelo `globals.css` desta stack, que faz
`@import "@shared/styles/nds/index.css"`; o alias `@shared` aponta para
`docs/shared` e está declarado nos dois lugares que precisam concordar —
`vite.config.ts` e `tsconfig.json`.
