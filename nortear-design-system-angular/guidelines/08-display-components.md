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

## Table

**Propósito**: dados tabulares estáticos. Para ordenação, filtro, seleção, paginação ou edição inline, **DataTable**.

**Peças**: `div[ndsTableWrapper]`, `table[ndsTable]`, `thead[ndsTableHeader]`, `tbody[ndsTableBody]`, `tfoot[ndsTableFooter]`, `tr[ndsTableRow]`, `th[ndsTableHead]`, `td[ndsTableCell]`, `caption[ndsTableCaption]`.

**Estrutura**:

```
div[ndsTableWrapper]                 (dono da rolagem horizontal, tabindex="0")
└── table[ndsTable]
    ├── caption[ndsTableCaption]     (obrigatório; pode ser sr-only)
    ├── thead[ndsTableHeader]
    │   └── tr[ndsTableRow]
    │       └── th[ndsTableHead]     (scope, aria-sort quando ordenável)
    ├── tbody[ndsTableBody]
    │   └── tr[ndsTableRow]
    │       └── td[ndsTableCell]
    └── tfoot[ndsTableFooter]        (opcional — totais)
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsTableRow` | `selected` | `false` | Marca a linha como selecionada |
| `ndsTableHead` | `scope` | `col` | `col`, `row`, `colgroup`, `rowgroup` |
| `ndsTableHead` | `sort` | — | Direção de ordenação, vira `aria-sort` |

**Regras**:
- Legenda **obrigatória**, ainda que fora da tela: é o nome da tabela
- `scope` em todo cabeçalho — é o que liga célula a cabeçalho para quem navega por leitor
- Coluna numérica alinha à direita **na célula**, não no cabeçalho: no CSS compartilhado a regra de `th` declara alinhamento à esquerda com especificidade acima da utilitária, então escrever a classe no `<th>` não faria nada
- **Quem rola é o wrapper do primitivo**, e é ele que tem tab stop. Colocar a rolagem num container decorativo deixa as colunas de fora inalcançáveis por teclado (WCAG 2.1.1, regra `scrollable-region-focusable` do axe)
- Tabela de dados, nunca de layout — para layout, grade CSS

**Acessibilidade**:
- Legenda, `scope` e uma única camada rolável focável são os três itens não negociáveis
- Estado vazio é uma linha com mensagem — tabela vazia silenciosa não comunica nada

---

## DataTable

**Propósito**: tabela para conjunto de dados que exige interação — ordenação, busca, filtro por coluna, seleção, paginação e edição inline.

**Componente**: `div[ndsDataTable]`. **O motor é escrito em signals neste stack**, sem biblioteca de tabela headless.

> **Quatro recursos que o Vanilla tem e este stack não tem**: redimensionar coluna, reordenar coluna, fixar coluna e virtualização. Não há flag para eles aqui. Está registrado como lacuna, não como "alinhado" — a guideline do Vanilla lista essas flags porque lá elas existem.

**Estrutura**:

```
div[ndsDataTable]
├── barra de ferramentas               (quando há busca ou menu de colunas)
│   ├── campo de busca global
│   └── menu de colunas                (dropdown com itens de marcação)
├── moldura de rolagem                 (só borda e raio — NÃO é o tab stop)
│   └── div[ndsTableWrapper]           ← quem rola, e quem tem tabindex="0"
│       └── table[ndsTable]
│           ├── caption (sr-only)
│           ├── thead › tr › th        (botão de ordenar, filtro por coluna,
│           │                            checkbox de seleção total tri-state)
│           └── tbody › tr › td        (célula vira campo quando editável)
├── paginação                          (quando ligada)
└── anúncio de seleção                 (live region polida, sr-only)
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `columns` | obrigatório | Definição das colunas |
| `data` | obrigatório | As linhas. **Nunca mutado pelo componente** |
| `rowKey` | índice | Identidade estável da linha |
| `rowLabel` | — | Texto que identifica a linha no nome do controle de seleção |
| `caption` | `''` | Nome acessível da tabela |
| `enableGlobalFilter` | `true` | Campo de busca |
| `globalFilterPlaceholder` | padrão | Texto do campo de busca |
| `enableRowSelection` | `false` | Checkbox por linha |
| `enableColumnVisibility` | `true` | Menu de colunas |
| `enableColumnFilters` | `false` | Filtro por coluna no cabeçalho |
| `enablePagination` | `true` | Rodapé de paginação |
| `pageSize` | `10` | Linhas por página inicial |
| `pageSizeOptions` | `10, 20, 50, 100` | Opções do seletor |
| `emptyMessage` | padrão | Frase do estado vazio |
| `labels` | `{}` | Sobrescreve os textos do componente |

**Saídas**: edição de célula confirmada, e seleção de linhas.

**Definição de coluna**:

| Chave | Função |
|---|---|
| `id` | Identificador estável, usado em ordenação, filtro e edição |
| `header` | Rótulo do cabeçalho — substantivo curto, sem ponto final |
| `accessor` | Valor **bruto**, usado para ordenar e filtrar |
| `format` | Texto exibido |
| `sortable` | Cabeçalho ganha botão de ordenar e `aria-sort` |
| `hideable` | Coluna aparece no menu de colunas (padrão: sim) |
| `editable` | Célula vira campo ao clicar |
| `filter` | `text` ou `select`, com as opções |
| `numeric` | A **célula** alinha à direita |

**Regras**:
- **`accessor` e `format` são separados de propósito**: é o que faz "R$ 1.250,00" ordenar como 1250 e não como a string que começa com "R"
- `rowKey` é obrigatório na prática assim que houver seleção. Sem ele a identidade é a **posição**, e ordenar leva a marcação para quem ocupou o lugar
- `enableRowSelection` só quando existe ação em lote — checkbox sem ação confunde
- `data` não é mutado pelo componente: na edição inline, quem consome atualiza o array a partir da saída
- Estado vazio é uma linha com mensagem
- **O botão do menu de colunas compõe duas diretivas no mesmo elemento** (gatilho de menu mais visual de botão) e é caso conhecido de disputa de `data-slot` — em teste, procure pela classe. Ver `RULES.md` §8

**Rótulos — divergência de API registrada**:

Neste stack os textos com marcador são **templates de string** (`'Ordenar por {col}'`, `'Selecionar linha {row}'`); nas outras quatro stacks são funções. A razão é que template Angular não declara função, e quem passa esse objeto o passa de dentro de um template. É divergência de **API de framework**: registra-se, não se alinha.

**Acessibilidade**:
- HTML semântico real — tabela, cabeçalho, corpo, `th` com `scope`
- `aria-sort` no cabeçalho ordenável, refletindo ascendente, descendente ou nenhum
- Checkbox de cabeçalho é tri-state em seleção parcial
- **Cada checkbox de linha carrega o identificador daquela linha no nome.** Nome repetido em dez controles é o mesmo que nome nenhum (WCAG 4.1.2) — é o que `rowLabel` resolve
- **Uma só camada rola na horizontal**, e é a do primitivo Table. A moldura externa é decoração e não entra na ordem de tabulação
- O total selecionado é anunciado por live region polida, porque com a paginação desligada esse número não aparece em nenhum lugar da tela

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
