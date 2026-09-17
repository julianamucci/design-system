# Display Components (Nortear — Angular)

---

## Avatar

**Propósito**: representar uma pessoa ou entidade — foto, iniciais ou ícone como recuo.

**Peças**: `span[ndsAvatar]`, `img[ndsAvatarImage]`, `span[ndsAvatarFallback]`, `span[ndsAvatarBadge]`, `div[ndsAvatarGroup]`, `div[ndsAvatarGroupCount]`, `svg[ndsAvatarIcon]`.

**Estrutura**:

```
span[ndsAvatar]                    (circular, recorta o conteúdo)
├── img[ndsAvatarImage]            (quando há foto)
├── span[ndsAvatarFallback]        (iniciais — irmão obrigatório da imagem)
│   └── svg[ndsAvatarIcon]         (quando não há nem foto nem iniciais)
└── span[ndsAvatarBadge]           (opcional — status no canto)

div[ndsAvatarGroup]                (pilha sobreposta)
├── span[ndsAvatar] × n
└── div[ndsAvatarGroupCount]       ("+3")
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsAvatar` | `size` | `md` | `sm`, `md`, `lg`, `xl`, `2xl` |
| `ndsAvatarIcon` | `class` | — | Exceção de SVG: `className` em SVG não aceita binding de classe |

**Regras**:
- **O recuo é obrigatório mesmo quando há foto**: se a imagem falha, sem irmão de recuo o container fica vazio e nada indica de quem era
- Iniciais canônicas: duas letras maiúsculas — primeira do nome e primeira do sobrenome
- Tamanho é do token, e é dimensão de elemento sem texto — aqui valor fixo é legítimo
- A imagem recorta preservando proporção
- O badge de status é irmão posicionado, não um elemento dentro da imagem

**Acessibilidade**:
- Quando o avatar é a **única** pista de identidade, a imagem tem `alt` com o nome
- Quando o nome está visível ao lado, a imagem é decorativa e o recuo também — repetir o nome faz o leitor dizer duas vezes
- Badge de status precisa de nome acessível: um ponto verde não diz "online"
- Grupo é grupo rotulado; o contador diz quantos ficaram de fora
- Contraste das iniciais contra o fundo do recuo em 4.5:1

---

## Table — a mecânica desta stack

O que o componente É — contrato, decisões com data e medição, tokens e peças das
cinco stacks — está em
[`docs/shared/prd/table.md`](../../docs/shared/prd/table.md). A regra da
CATEGORIA — qual componente usar, acessibilidade da tabela, altura e alinhamento,
estado vazio, analytics e tom de voz — está em
[`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md), uma vez só para as
cinco stacks. Aqui fica o que é desta stack e não tem equivalente nas outras
quatro.

**As nove peças são diretiva de ATRIBUTO**, sem `@Component`, sem template
próprio e sem projeção: `div[ndsTableWrapper]`, `table[ndsTable]`,
`thead[ndsTableHeader]`, `tbody[ndsTableBody]`, `tfoot[ndsTableFooter]`,
`tr[ndsTableRow]`, `th[ndsTableHead]`, `td[ndsTableCell]`,
`caption[ndsTableCaption]`.

**O wrapper é escrito por quem usa, e só aqui.** Diretiva de atributo tem o
`<table>` como host e não pode criar um pai, então o `div[ndsTableWrapper]`
aparece no template de quem compõe; nas outras quatro stacks ele vem de dentro do
componente. O DOM final é o mesmo nas cinco — a diferença é de API, e está
registrada no PRD.

**Inputs desta stack**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsTableRow` | `selected` | `false` | Marca a linha como selecionada |
| `ndsTableHead` | `scope` | `col` | `col`, `row`, `colgroup`, `rowgroup` |
| `ndsTableHead` | `sort` | — | Direção de ordenação, vira `aria-sort` |

`sort` existe só nesta stack; nas outras quatro o `aria-sort` é escrito no markup
da composição. `colspan`, `rowspan` e `lang` não viram input — são atributos
nativos.

---

## DataTable — a mecânica desta stack

Contrato, decisões com data e medição, tokens e peças das cinco stacks:
[`docs/shared/prd/data-table.md`](../../docs/shared/prd/data-table.md). Regra da
categoria: [`20-tabelas.md`](../../docs/shared/guidelines/20-tabelas.md). Aqui
fica o que é desta stack e não tem equivalente nas outras quatro.

**Componente**: `div[ndsDataTable]` — seletor de atributo, zoneless, `OnPush`.

**O motor é escrito em signals, sem lib de tabela headless**, e esta é a única das
cinco stacks sem TanStack. O estado são signals e a derivação é uma cadeia de
`computed` (bruto → filtrado → ordenado → paginado) que o template lê direto. Não
é preferência: o adaptador `@tanstack/angular-table` publica o estado dele por um
`computed` próprio que espera ser lido dentro de um ciclo de detecção, o que
sobreporia um segundo modelo de reatividade ao que o resto desta stack usa.

**Quatro recursos não existem aqui, e o placar é de QUATRO stacks contra uma**:
redimensionar coluna, reordenar por arrasto, fixar coluna e virtualizar. React,
vue, svelte e vanilla entregam os quatro; aqui não há flag para eles. O motivo
declarado é o mesmo nos quatro: os quatro dependem de geometria em pixel escrita
no próprio elemento (a largura arrastada, o `left` da coluna fixada, a altura das
linhas fantasma do virtualizador), e valor de design em `style` inline não é
escrito nesta stack — inline vence a folha e tira o componente do tema, da
densidade e da escala tipográfica. Enquanto não houver forma de expressar largura
arrastada como classe ou token, entregar meia funcionalidade seria pior que não
entregar. Os itens do contrato de teste que ficam sem story por isso estão
declarados em `coversNotApplicable`, nomeados um a um; a medição está no PRD, §3.

**Os rótulos são templates de string, e não funções** (`'Ordenar por {col}'`,
`'Selecionar linha {row}'`), onde as outras quatro passam funções. A razão é de
framework: template Angular não declara função, e quem passa esse objeto o passa
de dentro de um template. É divergência de **API de framework** — registra-se, não
se alinha. Pela mesma régua, os rótulos de fixar e redimensionar não existem aqui:
rótulo sem controle é promessa de recurso inexistente.

**O botão do menu de colunas compõe duas diretivas no mesmo elemento** (gatilho de
menu mais visual de botão), e as duas ligam `data-slot` por host binding: uma
sobrescreve a outra, sem ordem garantida e sem erro. Em teste, procure pela classe
`.nds-*`, nunca pelo `data-slot`. Ver [`RULES.md`](RULES.md) §4.

---

## Chart

**Propósito**: visualizar dado quantitativo — barra, linha, área e pizza — com cor, tipografia e eixos vindos dos tokens.

**Componente**: `div[ndsChart]`.

> **O motor é o mesmo das outras quatro stacks: Apache ECharts, com o renderizador SVG.** Foi SVG desenhado à mão até a migração, e o motivo era circunstancial — não havia `echarts` nas dependências daqui. O que diverge, e continua divergindo, é a **forma da API**: lá é `ChartContainer` + `buildXOption` com um objeto de configuração único; aqui é um componente só, com entradas declarativas. Divergência de API de framework se registra, não se alinha.
>
> O renderizador é o SVG, e não o de tela, porque cada forma precisa continuar sendo nó do DOM: é assim que as stories medem contraste e trama em vez de afirmá-los.

**Estrutura**:

```
div[ndsChart]
├── frase de estado vazio           (quando nenhuma série tem dado)
├── div[data-slot=chart-canvas]     (role="img" + nome acessível VÃO AQUI)
│   └── svg                         (desenhado pela lib)
│       ├── eixos e grade
│       ├── formas de dado          (barra, traçado, área, fatia), cada uma em
│       │                             duas camadas: cor e trama, com contorno
│       │                             em --foreground
│       └── legenda
└── table                           (alternativa textual — sr-only por padrão)
    ├── caption                     (a descrição do gráfico)
    ├── th por série
    └── th scope="row" por categoria
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `type` | `bar` | `bar`, `line`, `area`, `pie` |
| `label` | **obrigatório** | Nome acessível do desenho e legenda da tabela |
| `data` | — | Conjunto simples de uma série |
| `xAxis` + `series` | — | Forma multi-série |
| `chartTitle` | `''` | Título visível |
| `showLegend` | automático | Força mostrar ou esconder a legenda |
| `showData` | `false` | Torna a tabela de dados visível para todo mundo |
| `compact` | `false` | Versão reduzida, para uso embutido |
| `categoryLabel` / `valueLabel` / `shareLabel` | padrões | Cabeçalhos da tabela de dados |
| `emptyLabel` | padrão | Frase do estado vazio |

**Tokens de cor**:

| Token | Uso |
|---|---|
| `--chart-1` … `--chart-5` | séries, na ordem em que aparecem |
| `--foreground` | contorno das formas e texto do título |
| `--muted-foreground` | texto de eixo e de legenda |
| `--border` | linhas de grade e de eixo |
| `--background` | traço da trama (`decal`) sobreposta a cada série |
| `--card` | fundo da dica sob o ponteiro |
| `--primary` | indicador de posição no eixo |

**Regras**:
- Altura nasce da proporção (`.nds-chart-canvas` no elemento do desenho, proporção por `--ratio`) aplicada à largura do container, com piso no CSS. Não cravar altura
- **Nenhum tamanho de fonte escolhido à mão**: a lib exige número em pixel, então o número é MEDIDO — sai da fonte raiz resolvida, e o tema é relido quando ela muda. Aumentar a fonte do navegador aumenta o rótulo de eixo junto (WCAG 1.4.4)
- **A trama (`aria.decal`) exige o módulo `AriaComponent` registrado**: sem ele o bloco `aria` é ignorado em silêncio e a trama nunca é desenhada
- Legenda aparece quando há mais de uma série; com uma só ela some, porque não há o que comparar
- Estado vazio é frase completa com orientação para a próxima ação, nunca "Sem dados."
- Tipo não coberto (dispersão, radar, mapa de calor) **não se documenta**: prometer desenho que não sai é pior que omitir
- Nenhuma informação existe só na dica sob o ponteiro — o mesmo par categoria/valor está na tabela, alcançável sem ponteiro

**Acessibilidade** — as quatro decisões deste componente:
1. **Alternativa textual equivalente sempre presente.** O componente emite uma tabela de verdade com os mesmos números, com legenda e cabeçalho por série e por categoria. Fora da tela por padrão; visível com `showData`. Um desenho mudo é conteúdo perdido — a tabela **é** o conteúdo
2. **`role="img"` e o nome acessível vão no elemento do DESENHO, não no container.** Isso diverge do texto do conteúdo compartilhado, e a divergência é deliberada: `role="img"` poda a subárvore da árvore de acessibilidade, então no container a tabela de dados ficaria escondida junto e a alternativa textual sumiria. É também por isso que a lib monta num elemento interno, e não no bloco `.nds-chart`
3. **A informação não vive na cor** (WCAG 1.4.1). Cada série recebe uma trama sobreposta ao preenchimento (`aria.decal`), e em linha também um símbolo de ponto e um desenho de traço próprios. Retirando toda a cor, o gráfico continua legível. A legenda nomeia cada série por escrito
4. **Contraste de objeto gráfico** (WCAG 1.4.11) vem do **contorno** das formas em `--foreground`, não da cor de série: no tema Default as cinco cores ficam entre 2.07 e 13.23 no claro e entre 1.00 e 6.41 no escuro — o `--chart-5` do escuro **é** o fundo, com contraste 1.00. Sem contorno, essa série some. O contorno vem do tema, em `src/lib/echarts-theme.ts`

- Gráfico denso ou dado crítico pede resumo textual à parte, com pico, mínimo e tendência
- **Lacuna registrada**: `--chart-1` a `--chart-5` não têm variante escura em nenhum tema — o próprio tema padrão diz isso. A recoloração no modo escuro hoje alcança o texto dos eixos, que tem variante; a paleta de série é decisão de design pendente

**Analytics**: passivo — o gráfico não dispara evento por padrão.

---

## Code Block

**Propósito**: exibir trecho de código com numeração de linha, realce de faixa e botão de copiar. É a peça que as docs pages usam em toda seção com código.

**Componente**: `nds-code-block`.

**Estrutura**:

```
nds-code-block
├── cabeçalho              (título e botão de copiar)
├── pre › code
│   ├── numeração de linha (opcional)
│   └── linhas realçadas   (faixas declaradas)
└── rodapé                 (opcional)
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `code` | obrigatório | O texto do trecho |
| `language` | — | Linguagem, para o realce |
| `title` | `''` | Título do bloco (caminho de arquivo, por exemplo) |
| `showLineNumbers` | `true` | Numeração |
| `highlightLines` | — | Faixas de linha a destacar |
| `footer` | `''` | Nota abaixo do bloco |
| `copyLabel` / `copiedLabel` | padrões | Rótulos do botão de copiar |

**Regras**:
- O código entra por input, como **texto** — nunca por marcação montada à mão
- Numeração é o default: linha citada em prosa precisa de número para ser encontrada
- Realce de faixa é para apontar a linha do assunto; realçar tudo não aponta nada
- Rótulo de copiado é estado temporário do botão, não um segundo botão

**Acessibilidade**:
- O bloco é rolável na horizontal e por isso alcançável por teclado
- O botão de copiar tem nome acessível e anuncia a confirmação
- Numeração de linha é decorativa e não entra na leitura do código
