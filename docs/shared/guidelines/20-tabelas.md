# Tabelas — as regras da categoria

Vale para os dois componentes de tabela, nas cinco stacks: **Table** (o primitivo
semântico) e **DataTable** (a tabela que se explora).

Este arquivo guarda o que ATRAVESSA os dois. O que cada um É — contrato, decisões
com data e medição, tokens, peças das cinco stacks — está no PRD dele:

| componente | PRD |
|---|---|
| Table | [table.md](../prd/table.md) |
| DataTable | [data-table.md](../prd/data-table.md) |

**O Pagination não é desta categoria.** Ele esteve aqui por um dia, em 2026-09-16,
com a justificativa de que o único consumidor dele seria o rodapé de uma tabela — e
a justificativa não tinha sido medida. O conteúdo compartilhado o classifica como
Navegação, o Storybook o agrupa em `Components/Navigation` nas cinco stacks, e o
DataTable não o usa. A regra dele está em [`21-navegacao.md`](21-navegacao.md); o
que fica aqui é a fronteira entre ele e o rodapé do DataTable (§Rodapé de página).

## Por que este arquivo existe

Até 2026-09-17 a regra da categoria vivia em **dez seções espalhadas por cinco
arquivos** — `## Table` e `## DataTable` em cada `08-display-components.md` — e
divergiam do mesmo jeito que as de overlay e de feedback divergiam antes das
unificações de 2026-09-10 e 2026-09-13. Medido:

- **26 linhas no Svelte contra 48 no Vue** para a seção `## Table`, o mesmo
  primitivo; e **49 no vanilla contra 84 no Angular** para `## DataTable`, sendo
  que o vanilla é a stack de REFERÊNCIA e entrega os quatro recursos que o
  Angular não tem. Na categoria inteira, 79 linhas no Svelte contra 130 no Vue;
- a categoria **não existe como bloco contíguo** em três dos cinco arquivos: no
  Svelte o `## Chart` fica ENTRE Table e DataTable, no vanilla entram Chart e uma
  seção de Skeleton (que é componente de feedback), no Angular há ainda um
  `## Code Block` que react e vue não têm;
- o bloco de acessibilidade do DataTable, **oito bullets, é literalmente idêntico
  em quatro cópias** — react, vue, svelte e vanilla —, frases carimbadas
  incluídas ("nome repetido em dez controles é o mesmo que nome nenhum"). Quatro
  textos iguais envelhecendo em quatro lugares é o argumento mais forte que esta
  categoria tinha para subir;
- o **Angular** afirmava que coluna numérica não pode alinhar à direita no
  cabeçalho, porque a regra de `th` teria especificidade acima da utilitária. A
  folha foi mudada EXATAMENTE por causa disso: `table.css:78` declara
  `:where(.nds-table) th`, que é (0,0,1), e o comentário de `table.css:64-77`
  registra que `nds-text-right` num `<th>` era inerte nas cinco stacks antes do
  rebaixamento. As próprias stories do Angular escrevem a classe no `<th>` em
  oito pontos, e o snippet do painel Code em mais um — e a afirmação vencida ainda
  sobrevive em dois docblocks de código daquela stack (`data-table.ts:124-129` e
  `data-table.fixtures.ts:87-89`);
- o **vanilla** publicava uma tabela de "Opts da factory" com `caption`,
  `captionHidden`, `headers` e `rows`. O primitivo é
  `createTable(extraClass?, regionLabel?)` e não tem objeto de opções nenhum; a
  legenda é outra factory. **`captionHidden` não existe em lugar nenhum do
  código** — os três únicos hits do repositório eram as três linhas da própria
  guideline;
- as **cinco** mandavam escrever `scope="col"` em todo cabeçalho sem dizer que o
  default já nasce na peça, o que faz story e docs page repetirem atributo
  redundante — e dois arquivos de teste de snippet afirmam justamente a AUSÊNCIA
  dele;
- react e vue desenhavam `div.nds-table-wrapper` como nó de quem monta, e o react
  dizia que ele "é obrigatório em telas estreitas". Nas quatro stacks de
  framework o wrapper é renderizado pelo próprio componente: seguir a instrução
  produz wrapper DUPLICADO, ou seja duas camadas roláveis — o defeito que esta
  categoria persegue;
- o **react** mandava paginar acima de 20 linhas compondo o componente
  `Pagination`, que o DataTable não usa em stack nenhuma;
- o **Angular** dizia que redimensionar, reordenar, fixar coluna e virtualizar
  eram recursos "que o Vanilla tem e este stack não tem". React, vue e svelte
  também os têm: são quatro stacks contra uma;
- o **Svelte** não mencionava `tfoot` nem `TableFooter` na seção Table, e a peça
  existe como arquivo e é estilizada pela folha em `table.css:121-128`. É a mesma
  forma do "vanilla documentava quatro variantes e o código tem cinco";
- o **vanilla** escrevia a regra de grade como allowlist (`--spacing-1/2/4/6/8/10/24`,
  "off-grid são bugs"), o que reprova o meio-degrau legítimo `--spacing-1-5`;
- react e vue tinham uma seção "Regras transversais de Display Components" que
  **não é transversal e se contradiz**: a regra de Carousel estava escrita em três
  guidelines — o componente existe nas cinco, e vanilla e Angular simplesmente não
  tinham seção dele —, as duas cópias dão conselhos OPOSTOS sobre acessibilidade de
  Chart e sobre movimento reduzido, e a linha de analytics do DataTable remete a uma
  API que o Angular não tem. No react a tabela de analytics ainda tinha a linha
  `Table` duplicada, com a do `DataTable` no meio.

Aqui a regra fica UMA vez, e a última seção diz qual portão cobra cada uma. O que
é mecânica de uma stack só — as factories do vanilla, as diretivas de atributo do
Angular, o adapter que cada framework usa sobre o TanStack, o wrapper local do
Svelte — continua na `08-display-components.md` daquela stack. Catálogo de
componente não fica em guideline nenhuma: vai para o PRD.

---

## Qual dos dois

| Situação | Componente |
|---|---|
| Dados que cabem na tela e não precisam ser explorados | Table |
| A pessoa precisa filtrar, ordenar, selecionar ou editar | DataTable |
| Layout de duas colunas, ficha de dados, formulário | nenhum dos dois — é grade CSS |
| Rodapé de página do DataTable | o rodapé do próprio DataTable, não o Pagination |

**`<table>` é para DADOS, e o critério é o cabeçalho**: se as células não se
descrevem por uma linha ou coluna de cabeçalho, aquilo não é tabela — é layout, e
layout é grade CSS. Tabela usada como grade quebra a navegação por leitor de
tela, que anuncia coordenadas de célula para conteúdo que não tem eixo.

**O que separa Table de DataTable é quem manda no conjunto de linhas**: no Table
quem monta escreve as linhas e a ordem é a do markup; no DataTable existe um motor
que ordena, filtra e pagina, e o componente é dono do que aparece. Tabela estática
com uma coluna ordenável é Table com ordenação no call site, não DataTable.

**Seleção de linha só existe quando há ação em lote.** Checkbox que marca linhas e
não leva a lugar nenhum é controle sem propósito, e ainda entra na ordem de
tabulação de cada linha. Era a única regra de uso escrita nas cinco cópias
antigas, com a mesma redação.

---

## Acessibilidade da tabela

Esta é a seção mais fácil de errar da categoria, e a que tinha metade da regra
escrita só em código.

### O nome e o papel da região rolável andam JUNTOS

A moldura que rola na horizontal é focável — `tabindex="0"` —, porque conteúdo que
rola e não recebe foco é inalcançável por teclado (WCAG 2.1.1, e o axe acusa em
`scrollable-region-focusable`). Mas região focável sem nome não diz o que é, e a
regra completa é a que os cinco primitivos executam e nenhuma guideline dizia:

- o nome vem de `regionLabel`, prop de mesmo nome nos cinco;
- **sem nome, não se emite papel nenhum.** `aria-label` em elemento sem papel é
  atributo proibido, e o axe acusa em `aria-prohibited-attr`;
- com nome, o papel é `role="group"` e **não `region`**: `region` com nome vira
  marco de página, e uma tela de relatório empilha várias tabelas — seriam vários
  marcos concorrendo na navegação por landmarks.

Os três fatos moram em `nortear-design-system-vanilla/src/components/ui/table.ts:13-47`
e em quatro docblocks gêmeos. Documentar a região focável sem o nome e sem o papel
é publicar exatamente o defeito que o axe reprova.

### Legenda, escopo e identidade

- **Legenda obrigatória**, podendo ser apenas para leitor de tela. Ela é lida
  ANTES das células por ordem de DOM, e é RENDERIZADA embaixo:
  `table.css:31` declara `caption-side: bottom`, com espaçamento e cor em
  `table.css:38-42`. Quem lê só a ordem do DOM supõe legenda no topo.
- **`scope` já nasce na peça**, com default `col`. Escrever `scope="col"` no
  markup é redundância, e dois arquivos de teste de snippet afirmam a ausência do
  atributo de propósito. O que precisa ser escrito é o caso que o default não
  cobre: `scope="row"` quando a primeira célula da linha é cabeçalho dela.
- **A identidade da linha é chave, nunca posição.** Sem chave estável, ordenar
  leva a marcação de seleção para quem passou a ocupar o lugar.
- **O nome do controle de seleção carrega o identificador da linha** (WCAG 4.1.2):
  nome repetido em dez controles é o mesmo que nome nenhum.
- **A mesma regra vale para o botão de ação por linha**: "Ações para fatura
  INV-001", nunca "Ações" repetido em cada linha. O ícone sozinho não nomeia, e o
  leitor de tela que navega por botões ouviria dez vezes a mesma palavra sem saber
  de qual linha.
- **O checkbox de cabeçalho é tri-state**, e o total selecionado é anunciado por
  região viva polida — implementado nas cinco stacks, documentado em uma até
  esta unificação.
- **Ordenação se anuncia por `aria-sort`** no cabeçalho, com `ascending`,
  `descending` ou `none`.
- **Célula cujo texto é identificador leva `lang`** quando o idioma dele difere do
  da página (WCAG 3.1.2) — código de produto, sigla, nome próprio estrangeiro.

### Uma só camada rola, e é a do primitivo

`.nds-table-wrapper` é dono do `overflow-x` (`table.css:23-27`). O
`.nds-data-table-scroll` do DataTable **moldura e não rola na horizontal**
(`data-table.css:133-138`): ele carrega borda, raio e, no modo virtualizado, a
rolagem VERTICAL. O comentário de `data-table.css:120-132` registra por quê — havia
dois contêineres roláveis aninhados, em duas stacks o interno era neutralizado por
uma classe criada para isso, e sobrava rolando um elemento que não está na ordem de
tabulação.

Consequência prática, e é o erro mais caro da categoria: **nunca acrescente um
wrapper próprio em volta do componente.** Nas quatro stacks de framework o wrapper
já vem de dentro.

---

## Altura, densidade e alinhamento

**Nenhuma altura cravada em linha, célula, filtro ou campo de edição.** A altura é
resultado de `padding-block` mais entrelinha, e onde há medida ela é PISO:

| onde | o que a folha declara |
|---|---|
| cabeçalho do Table | `min-block-size: --spacing-10` (`table.css:83`) |
| cabeçalho do DataTable | `min-block-size: --spacing-10` (`data-table.css:150`) |
| campo de edição em linha | sem `height`; padding mais entrelinha (`data-table.css:275-287`) |

Altura cravada recorta o rótulo quando a pessoa aumenta a fonte do navegador
(WCAG 1.4.4, Resize Text 200%). É a mesma regra do `CLAUDE.md` para peça
interativa, e aqui ela vale para a linha inteira.

**Não existe densidade de tabela neste design system.** Não há `data-density` nos
tokens nem nas folhas `.nds-*`; o que responde à densidade é a escada
`--spacing-*` e `--size-*`, pelos modos da coleção de dimensão. Tabela mais
compacta se obtém pelo tema, não por atributo do componente.

**Coluna numérica alinha à direita na CÉLULA e também no CABEÇALHO.** Depois do
rebaixamento de `table.css:78` para especificidade de elemento, a utilitária
`.nds-text-right` vale nos dois. E coluna cujo dígito troca — contador, valor,
data — pede `.nds-tabular-nums`, senão a coluna "dança" a cada atualização.

Até 2026-09-22 **nenhuma das cinco stacks cumpria a metade do cabeçalho**, e a
regra acima já estava escrita. Ao ligá-la, apareceu a segunda metade, que é o
que faltava dizer aqui:

> **No cabeçalho ORDENÁVEL, alinhar o texto não alinha nada.** Ali o conteúdo
> do `<th>` não é texto solto: é um BOTÃO, e o botão é item de flex que
> preenche a linha. `text-align` não move item de flex, então o rótulo e a
> seta continuam empacotados no início. A folha do DataTable resolve com
> `justify-content: flex-end` no botão, condicionado à mesma classe.

Isso importa mais do que parece, porque é a forma de defeito que esta casa mais
paga: a classe fica escrita no markup, com o prefixo certo, e **não pinta**. Não
há compilador, suíte ou axe que reprove — a folha é válida e o cabeçalho
aparece. Duas agentes bateram nela no mesmo dia, cada uma na sua stack, e as
duas propuseram o remédio no elemento errado (o invólucro, que já preenchia).
Se você for alinhar cabeçalho em componente novo, **olhe antes se o conteúdo do
`<th>` é texto ou é item de flex** — a resposta muda o remédio.

---

## Estado vazio

**Vazio nunca é silencioso**, e nunca é uma tabela sem linhas: é uma linha com
mensagem, ocupando a largura inteira por `colspan`.

A altura é reservada pela folha, não pelo call site: `.nds-table-empty` declara
`block-size: var(--spacing-24)` (`table.css:114-118`). O comentário registra que a
classe nasceu para substituir `style="height:6rem"` no React — valor de design em
`style` inline, proibido aqui — e `h-24` no Svelte, classe que não existia. Em
célula de tabela `block-size` se comporta como mínimo, então a linha cresce se a
mensagem tiver duas linhas.

**Há duas classes para um conceito, e elas divergem**: a paralela do DataTable,
`.nds-data-table-empty` (`data-table.css:290-294`), usa `height` em vez de
`block-size`. Está registrado como aberto abaixo.

---

## Rodapé de página

**Dois vocabulários, e eles não se compõem.** O rodapé do DataTable é
`.nds-data-table-pagination*` (`data-table.css:296-342`); o componente Pagination é
`.nds-pagination*`. Nenhum arquivo `data-table*` de nenhuma stack referencia
`nds-pagination`. Quem monta um DataTable NÃO compõe o Pagination dentro dele: o
rodapé já vem.

A regra do componente Pagination — alinhamento da faixa, desabilitar prev/next,
página atual, rótulo em tela estreita, `page_change` — está em
[`21-navegacao.md`](21-navegacao.md) §Paginar.

---

## Movimento e elevação em tabela

**Movimento**: nenhuma das duas folhas da categoria declara transição nem animação.
Quando a primeira for acrescentada, a guarda de `prefers-reduced-motion` vem junto.

**Elevação**: os dois componentes vivem no plano da página e **nenhum lê
`var(--elevation-*)`**. A única sombra de superfície da categoria é a do menu de
colunas do DataTable, e ela é literal — está registrada como aberta abaixo, porque
a exceção que a isenta descreve outra coisa.

---

## Analytics de tabela

O vocabulário do payload — `component` em kebab-case, valor estável e nunca texto
traduzido, `location` no formato `docs_<section-id>` — é regra de todos os eventos,
em [`07-analytics.md`](07-analytics.md).

**Table e DataTable são passivos.** Nenhum dos dois dispara evento próprio:
ordenação, filtro e seleção são instrumentados por quem compõe, que é quem sabe o
que a tabela mostra. O evento do rodapé de página, quando houver, é do Pagination
ou de quem controla a paginação — ver [`21-navegacao.md`](21-navegacao.md).

---

## Tom de voz em tabela

A regra é de [`05-tom-de-voz.md`](05-tom-de-voz.md); o que a categoria acrescenta é
onde cada forma cai:

| onde | forma |
|---|---|
| cabeçalho de coluna | substantivo curto, sem ponto final |
| mensagem de vazio | título diz o que não existe, descrição diz o que fazer — a regra de estado vazio de [`05-tom-de-voz.md`](05-tom-de-voz.md), aplicada à linha |
| nome do controle de seleção | inclui o identificador da linha |

---

## Invariantes — quem cobra cada regra

A regra que atravessa componentes e stacks não se mantém verdadeira por instrução:
o que a mantém é um **portão**. Esta tabela diz qual, e o que ele não cobre —
metade coberta que se anuncia inteira é o defeito que ela existe para evitar.

| invariante | onde a regra está | portão | o que o portão NÃO cobre |
|---|---|---|---|
| Catálogo de componente mora no PRD, não na guideline | aqui, §Por que este arquivo existe | `catalogo_duplicado_com_prd` — **acendeu dez achados no instante em que os dois PRDs nasceram, cinco por componente, e zerou com a migração do mesmo dia** | ele exige que o PRD EXISTA para cobrar, então a categoria ficou invisível até os PRDs nascerem; e o regex é `^## <Título>$` exato, nível 2 — `## Table — dados tabulares`, `## Tabelas` ou `### Table` escapam. Também não varre `docs/shared/guidelines/`: um catálogo dentro DESTE arquivo não é visto por ninguém |
| A regra de categoria não volta a ser copiada por stack | aqui | `guideline_de_stack_repete_categoria` | o mapa dele não tem entrada para esta categoria (§O que está aberto). Compara TÍTULOS: prosa copiada sem título escapa, e título legitimamente de stack pode abrigar a categoria inteira |
| Uma só camada rola, e ela é focável e nomeada | aqui, §Acessibilidade da tabela | nenhum | `tabindex`, nome e papel da região não são conferidos por portão; são medidos por story e pelo axe do addon |
| Nenhuma altura cravada em linha ou célula | aqui, §Altura, densidade e alinhamento | nenhum | conferido por story, nas cinco |
| Nenhum valor de design em `style` inline | [`12-tokenizacao-dimensoes.md`](12-tokenizacao-dimensoes.md) | `inline_style_design_value` | — |
| Token citado no PRD existe na folha | [`docs/shared/prd/README.md`](../prd/README.md) | `prd_token_sem_lastro` | lê SÓ a seção `## <n>. Geometria` do PRD; o sentido inverso (folha lê token que o PRD não cita) é exclusão declarada |
| Elevação por tipo de superfície | [`04-padroes-design-sistema.md`](04-padroes-design-sistema.md) §Qual degrau | `elevacao_fora_do_mapa` · `sombra_cravada` | nenhum dos dois slugs está classificado no mapa, e folha que não LÊ `var(--elevation-*)` sai pela porta do `continue`. E o `sombra_cravada` isenta o ARQUIVO inteiro, não a declaração: uma vez listada a folha, sombra literal nova nela passa calada |
| Vocabulário do payload | [`07-analytics.md`](07-analytics.md) | `i18n_text_in_payload` · `component_nao_kebab` · `location_fora_do_vocabulario` · `campo_de_payload_morto` | evento anunciado em guideline e não tipado: nada vê |
| Guideline de componente não carrega código de implementação | [`CLAUDE.md`](../../../CLAUDE.md) §Conventions | `auditGuidelineCode` | vale para os arquivos 04 a 10 de cada stack e libera snippet nas compartilhadas — então as árvores de estrutura que subirem para cá não são reprovadas, e é por isso que elas precisam ser ÁRVORE DE TEXTO e não bloco de código |

### O que está aberto

Cada item aqui tem medição no PRD do componente e espera decisão. Nenhum é defeito
de texto: os dois PRDs descrevem o que o código faz hoje.

1. **A exceção de sombra literal do `data-table` descreve uma sombra que não
   existe.** `SOMBRA_CRAVADA_DECLARADA` isenta a folha dizendo que é "sombra de
   rolagem do cabeçalho fixo (`0 8px 24px -4px`)", e a única `box-shadow` do
   arquivo é essa mesma, no `.nds-data-table-columns-menu` — um painel suspenso.
   Não há cabeçalho fixo na folha: `position: sticky` não é declarado em lugar
   nenhum, e `sticky` só aparece num comentário sobre coluna fixada, que define
   apenas fundo opaco. Pelo mapa, painel flutuante interativo lê `--elevation-md`.
   A declaração já diz "aguarda decisão da dona sobre virar token próprio" — a
   decisão agora tem duas partes: o degrau, e corrigir a premissa.
2. **Duas classes para o estado vazio, com propriedades diferentes**:
   `.nds-table-empty` usa `block-size` e `.nds-data-table-empty` usa `height`,
   para o mesmo conceito. O comentário do primitivo explica por que `block-size` é
   o correto em célula.
3. **A categoria não existe no arquivo do Figma.** As 22 páginas do
   `XXAmIFVBKHClzx7YdUSkEb` não incluem Table nem DataTable, e
   `docs/shared/figma/design-links.ts` não tem entrada para nenhum dos dois slugs.
4. **A afirmação vencida de especificidade sobrevive em código do Angular**, em
   dois docblocks (`data-table.ts:124-129` e `data-table.fixtures.ts:87-89`), e
   contradiz as stories da própria stack.
5. **`guideline_de_stack_repete_categoria` não cobre a categoria Feedback.** O
   mapa dele tem só a entrada de overlay, e os cinco `07-feedback-components.md`
   existem. Não é assunto desta categoria, mas foi medido aqui e não deve se
   perder: acrescentar a entrada torna um portão vermelho para outra categoria, e
   isso é decisão da dona.
6. **Duas paginações.** O rodapé do DataTable (`.nds-data-table-pagination*`) e o
   componente Pagination (`.nds-pagination*`) têm markup, semântica e vocabulário
   de classe diferentes, e não se compõem em stack nenhuma. Decidir se o rodapé
   passa a instanciar o componente — os dois PRDs chegaram nesta mesma pergunta por
   caminhos independentes.
7. **A folha diz "TanStack Table v8"; o instalado é `^9.1.2`.** Quatro
   guidelines de stack diziam o mesmo, e as quatro passaram a dizer 9 com a
   migração do catálogo, em 2026-09-17 — sobra o docblock de `data-table.css`,
   que é folha e portanto da revisão de código. E o angular não usa TanStack
   nenhum — motor em signals, zero dependências `@tanstack` —, enquanto o conteúdo
   compartilhado promete `ColumnDef` e `accessorKey` para quem lê a página daquela
   stack.
8. **`regionLabel` está fiado nas cinco e exercido em zero.** Nenhuma story,
   docs page ou snippet passa a prop, então a região rolável focável nunca recebe
   nome nem papel em exemplo publicado — e o axe não cobra a ausência. O nome é
   do CONTEÚDO, então o design system não pode escolhê-lo: decidir se os exemplos
   passam um nome de amostra ou se fica escrito que não se nomeia em exemplo.
9. **`tr:has([aria-expanded="true"])` não tem produtor em stack nenhuma**, nem no
   DataTable. Ou nasce a linha expansível, ou a regra sai da folha.
10. **`TableEmpty` é peça publicada só no vue**, e a referência é uma das quatro
    sem ela. É escolha de contrato, não de markup, então não há fonte de verdade
    automática.
11. **A entrada desta categoria no `guideline_de_stack_repete_categoria` não foi
    feita.** Com o Pagination fora, a categoria mora num arquivo só por stack, a
    `08`, e o formato do mapa — um `deStack` por guideline — comporta a entrada.
    O que falta é a autorização: alterar o mapa é alterar portão, o que pede prova
    com defeito replantado e comparação regra a regra contra o HEAD, ou seja
    varredura `--all`, que é decisão da dona. Os cabeçalhos deste arquivo já levam
    "de tabela" ou "dos dois" para que a entrada, quando vier, não reprove as seções
    de Avatar, Chart e Carousel que moram no mesmo `08`.
