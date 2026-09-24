# PRD — o que cada componente É hoje

Um arquivo por componente, descrevendo o estado **atual** do código com detalhe
suficiente para reconstruí-lo do zero em qualquer das cinco stacks.

## Por que este diretório existe

O projeto nasceu com as guidelines por categoria, e elas provaram ser
insuficientes na revisão componente a componente. O sintoma não foi falta de
informação — foi informação **sem dono e sem data**: a decisão vivia num
comentário de CSS, o motivo numa mensagem de commit, o contrato numa chave de
`translations.json`, e a consequência numa story. Quem revisava lia uma parte,
corrigia com razão, e desfazia sem saber uma decisão tomada duas rodadas antes.

Três exemplos medidos, todos de setembro de 2026:

- o Popover teve o `doDont.pair1` corrigido numa passagem e a MESMA afirmação
  ficou de pé em `usage.guidelines.item2`, contradizendo a correção de cima para
  baixo na mesma página;
- o Sheet documentava um anel de foco de 2px a 50% de opacidade enquanto a folha
  desenhava halo de 2px mais anel de 5px em opacidade cheia — a página
  contradizia o arquivo que ela documenta;
- o comentário do `alert-dialog.css` dizia que Escape NÃO fechava, e o
  comportamento correto (fecha, e equivale a cancelar) estava escrito no
  conteúdo compartilhado da própria stack. Uma anotação do Figma copiou a versão
  errada e viveu assim por semanas.

O PRD não substitui nenhuma dessas fontes. Ele é o lugar onde a **decisão** mora,
com data e medição, para que reverter custe uma leitura em vez de uma rodada.

## O que entra

| seção | o que é |
|---|---|
| Identidade | a frase que separa este componente dos vizinhos |
| Contrato de comportamento | afirmações verificáveis, numeradas, com o portão que protege cada uma |
| Decisões fixadas | decisão · data · medição que a sustenta · o que teria de mudar para revisitar |
| Anatomia | árvore de `data-slot`, separando o que é estrutura do que é conteúdo arbitrário |
| Geometria e tokens | propriedade → valor → token → onde está declarado, incluindo os literais e por que são literais |
| Estados | o que muda de aparência, e o atributo que dispara |
| API | props compartilhadas, mais as divergências por stack REGISTRADAS |
| Acessibilidade | atributos, teclado, e o que deliberadamente NÃO se faz |
| Analytics | eventos e payload estável |
| Reconstruir do zero | a ordem de construção e a armadilha de cada stack |
| Onde está a verdade | mapa de arquivos e portões |

## O que NÃO entra

- **Código compilável.** Vale aqui a mesma regra das guidelines: código envelhece
  mais rápido no documento que o descreve do que no componente. Estrutura vai
  como árvore de texto; API vai como tabela.
- **O que o componente DEVERIA ser.** Este documento descreve o presente. Melhoria
  identificada vira item do `FIXES-NEEDED.md`, com dono e forma de medir.
- **Afirmação sem lastro.** Toda decisão traz a medição ou o arquivo que a
  sustenta. Decisão sem medição registrada não entra — foi exatamente assim que
  as afirmações falsas sobreviveram tanto tempo.

## Como se mantém verdadeiro

**Um PRD que contradiz o código é defeito do PRD**, e a correção é no PRD, nunca
no código "para bater com o documento". A ordem importa: o código é a verdade, o
PRD é o registro de por que ele é assim.

Ao tocar um componente que tem PRD, a rodada fecha respondendo três perguntas:

1. alguma afirmação do contrato mudou? → atualize a linha e o portão que a cobre;
2. alguma decisão fixada foi revertida? → se foi de propósito, mova a linha para
   o histórico com a nova data e a nova medição; se foi sem querer, é defeito;
3. algum valor da tabela de tokens mudou? → `node scripts/tabela-tokens.mjs <slug>`
   cruza a tabela das docs pages com as folhas, e serve para conferir esta também.

### E dois gatilhos, porque instrução sozinha não dispara

As três perguntas acima já existiam quando este diretório nasceu, e uma instrução
sem portão não é gatilho — foi essa a lição do `varra TODAS as chaves`, que
estava escrito na skill `quality` e não impediu a página do popover de se
contradizer. Então:

| gatilho | onde | o que mede |
|---|---|---|
| commit que mexe na folha, no primitivo ou no conteúdo de um componente com PRD exige o PRD no mesmo commit | `.husky/pre-commit` | **atenção**, no único momento em que quem editou tem o contexto na cabeça |
| token nomeado na tabela de geometria que a folha do componente não lê | `prd_token_sem_lastro`, em `scripts/audit.mjs` | **verdade** de uma parte factual |
| pendência aberta há mais de 45 dias, ou cuja condição de fecho já foi satisfeita | `prd_pendencia_sem_revisao` e `prd_pendencia_ja_fechada` | **envelhecimento**, e a segunda mede de verdade |

Cada um é uma metade. O hook não sabe se a edição do PRD foi correta — um espaço
em branco passa; o que ele faz é **mostrar** as pendências abertas daquele
componente no momento do commit, para a pergunta 2 deixar de ser "audite a lista"
e virar "estas aqui, o seu commit fecha alguma?". As regras de token e de
pendência medem partes factuais, não intenção.

E **nenhum deles pega o defeito que motivou o diretório**: decisão revertida com
o código e o PRD mudando juntos só aparece para quem ler a linha. O que os
gatilhos compram é que o documento seja aberto na hora certa, que as tabelas
factuais não possam derivar em silêncio, e que uma pendência não envelheça sem
alguém a reler.

### A forma da pendência

Pendência aberta num PRD tem forma fixa, e é ela que torna o resto possível:

```
> **PENDÊNCIA · 2026-09-07** — o que está aberto, em uma ou duas linhas.
> **Fecha quando**: a condição, de preferência mecânica.
```

A **data** é o que o portão de envelhecimento lê. O **`Fecha quando`** é o que
separa lembrete de medição: quando ele diz que uma regra do auditor não pode
mais reportar, o `prd_pendencia_ja_fechada` PERGUNTA — e reprova quando a
condição já foi satisfeita e a linha continua de pé.

Antes disso as pendências eram prosa livre, com cinco redações diferentes para a
mesma coisa: *"Pendência aberta, medida em"*, *"O que ainda falta é"*, *"ficam
registradas porque a revisão não as fechou"*. Nada greppável, nada printável — e
por isso o hook não tinha como MOSTRAR o que perguntava. Duas foram fechadas por
outra rodada sem ninguém apagar a linha, e uma terceira ficou apontando para um
item do `FIXES-NEEDED.md` já resolvido.

**Fechou pela metade? Estreite a linha e diga o que fechou.** Foi o que aconteceu
com a do HoverCard: das duas regras que ela citava, uma parou de reportar e a
outra não. Apagar tudo perderia o que resta; deixar como estava afirmaria um
defeito que não existe mais.

Story, fixture, snippet e teste não disparam o hook: eles mudam como o componente
é DEMONSTRADO, não o que ele é. Para mudança que de fato não altera nada do que o
PRD afirma, `PRD_SKIP=1 git commit …` pula só esse guarda — `--no-verify`
desligaria também o de teste silenciado, e não é o caminho.

## O terceiro eixo, e o inventário que o cobre

Os dois eixos descritos acima — PRD como *um componente × cinco stacks*,
guideline como *uma stack × muitos componentes* — deixam um de fora: **uma regra
× muitos componentes × cinco stacks**. É o eixo que produziu a repetição de
setembro de 2026, quando três achados voltaram como "defeito novo" duas ou três
vezes cada, por agentes diferentes, porque cada rodada consertava a instância que
via e o invariante continuava sem dono.

Esse eixo **tem** casa, e ela é `docs/shared/guidelines/`: regra que vale igual
nas cinco stacks e em muitos componentes. A de Overlay está em
[`18-overlay.md`](../guidelines/18-overlay.md), que termina na tabela dos
invariantes da categoria — onde a regra está escrita, qual portão a cobra e o
que ele não cobre. O que mantém um invariante verdadeiro nos nove componentes ao
mesmo tempo é o portão; o documento diz qual é.

O inventário nasceu neste diretório, como `invariantes-overlay.md`, e saiu dele
em 2026-09-10: esta pasta é **um arquivo por componente** — o hook de
pre-commit trata cada nome aqui como slug —, e um documento de categoria dentro
dela ficava fora do alcance de quem lê por assunto e do pacote que o Flutter
consome, que publica `guidelines/` e não `prd/`.

## Índice

A categoria Overlay — hoje oito componentes em oito PRDs — passou pela revisão
serial e, depois dela, pela pipeline `fix`. Ela tinha onze componentes em nove PRDs
até 2026-09-20, quando a família de menus migrou para Navegação: DropdownMenu,
ContextMenu e Menubar são de lá, e o PRD deles está na seção daquela categoria. As
datas de revisão continuam contando, porque o componente é o mesmo — o que mudou é
onde ele mora. As duas primeiras colunas de data são
diferentes de propósito: a primeira é quando a revisão fechou o componente, a
segunda é a última passagem que mudou o código dele e, com ele, este registro.

**A terceira coluna é a do modelo de Feedback, aplicado depois.** Em 2026-09-15
os nove foram relidos contra o código das cinco stacks e ganharam, ao fim da §7,
a lista numerada **Inconsistências entre stacks, medidas em 2026-09-15** — o que
diverge, onde, qual lado é maioria e o que a referência faz. Com o `audit.mjs`
verde nos onze slugs, essa lista é a base da próxima revisão de código: nenhum
item dela é visto por portão.

| componente | PRD | revisão serial | última pipeline `fix` | relido contra o código |
|---|---|---|---|---|
| Popover | [popover.md](popover.md) | 2026-09-06 | 2026-09-12 | 2026-09-15 |
| HoverCard | [hover-card.md](hover-card.md) | 2026-09-06 | 2026-09-10 | 2026-09-15 |
| Tooltip | [tooltip.md](tooltip.md) | 2026-09-06 | 2026-09-12 | 2026-09-15 |
| Sheet | [sheet.md](sheet.md) | 2026-09-06 | 2026-09-11 | 2026-09-15 |
| Drawer | [drawer.md](drawer.md) | 2026-09-07 | 2026-09-11 | 2026-09-15 |
| Dialog | [dialog.md](dialog.md) | 2026-09-10 | 2026-09-11 | 2026-09-15 |
| AlertDialog | [alert-dialog.md](alert-dialog.md) | 2026-09-10 | 2026-09-12 | 2026-09-15 |
| Command | [command.md](command.md) | 2026-09-10 | 2026-09-10 | 2026-09-15 |

### Feedback — escritos ANTES da revisão de código

Esta categoria inverteu a ordem, por decisão da dona: os cinco PRDs nasceram do
CÓDIGO em 2026-09-13, e é a revisão de código que vai usá-los como base, em vez de
o contrário. Cada um traz a divergência entre as cinco stacks medida, arquivo a
arquivo, e o que precisa de decisão está na §"O que está aberto" da
[`19-feedback.md`](../guidelines/19-feedback.md).

| componente | PRD | escrito em |
|---|---|---|
| Alert | [alert.md](alert.md) | 2026-09-13 |
| Badge | [badge.md](badge.md) | 2026-09-13 |
| Progress | [progress.md](progress.md) | 2026-09-13 |
| Skeleton | [skeleton.md](skeleton.md) | 2026-09-13 |
| Sonner | [sonner.md](sonner.md) | 2026-09-13 |

**A diferença de ordem é deliberada, e vale registrar por quê**: na categoria
Overlay o PRD nasceu DEPOIS da revisão serial, e duas vezes o documento saiu
descrevendo o vizinho — porque quem revisava tinha o código fresco e o registro
por escrever. Aqui o documento vem primeiro e a revisão tem contra o que ser
conferida.

### Tabelas — escritos ANTES da revisão de código

Mesma ordem invertida da Feedback, por decisão da dona: os dois nasceram do CÓDIGO
em 2026-09-16, e a revisão vai usá-los como base. Cada um fecha a §7 com a lista
numerada de inconsistências entre as cinco stacks, e o que precisa de decisão está
na §"O que está aberto" da [`20-tabelas.md`](../guidelines/20-tabelas.md).

| componente | PRD | escrito em | inconsistências medidas | pendências abertas |
|---|---|---|---|---|
| Table | [table.md](table.md) | 2026-09-16 | 19 | 2 |
| DataTable | [data-table.md](data-table.md) | 2026-09-16 | 28 | 12 |

**O Pagination foi escrito nesta rodada e NÃO é desta categoria.** Ele entrou em
Tabelas em 2026-09-16 com a justificativa de que seu único consumidor seria o
rodapé de uma tabela, e a justificativa não tinha sido medida. Medido em
2026-09-17: o conteúdo compartilhado o classifica como Navegação, o Storybook o
agrupa em `Components/Navigation` nas cinco stacks, o catálogo dele morava nas
`05-navigation-components.md`, e o DataTable não o usava — o rodapé dele era
outra peça, com outro vocabulário de classe.

**Em 2026-09-23 essa última razão caiu**: o rodapé do DataTable passou a COMPOR
o Pagination nas cinco stacks. A categoria não mudou, e é isso que vale guardar —
ela se sustentava nas outras três razões sozinha. "Só um componente o usa" nunca
foi critério de categoria; se fosse, a categoria mudaria a cada consumidor novo.

O PRD dele está na seção de Navegação. O que fica aqui é a fronteira entre o que
é do rodapé e o que é do componente, registrada na
[`20-tabelas.md`](../guidelines/20-tabelas.md).

**Estes nasceram com o auditor VERMELHO, e isso é diferente das categorias
anteriores.** Cada PRD acendeu, ao nascer, cinco `catalogo_duplicado_com_prd` — um
por stack —, e a migração do catálogo do mesmo dia os zerou. O que sobra no
auditor era anterior aos PRDs e está descrito neles: table 22 achados, data-table
18, medidos em 2026-09-17 depois da migração.

**Nenhuma das inconsistências medidas é vista por portão** — é a mesma leitura das
outras categorias, e aqui ela foi conferida contra o auditor achado a achado: o
auditor toca umas poucas pela borda, e nenhuma das 47 listadas nos dois documentos
sai de uma regra.

### Navegação — escritos ANTES da revisão de código

Mesma ordem: os PRDs nasceram do CÓDIGO em 2026-09-17, e a revisão vai usá-los como
base. O que precisa de decisão está na §"O que está aberto" da
[`21-navegacao.md`](../guidelines/21-navegacao.md).

| componente | PRD | escrito em | inconsistências medidas | pendências abertas |
|---|---|---|---|---|
| Breadcrumb | [breadcrumb.md](breadcrumb.md) | 2026-09-17 | 28 | 7 |
| NavigationMenu | [navigation-menu.md](navigation-menu.md) | 2026-09-17 | 26 | 4 |
| Pagination | [pagination.md](pagination.md) | 2026-09-16 | 24 | 4 |
| Stepper | [stepper.md](stepper.md) | 2026-09-17 | 24 | 6 |
| Tabs | [tabs.md](tabs.md) | 2026-09-17 | 30 | 8 |
| DropdownMenu, ContextMenu, Menubar | [dropdown-menu.md](dropdown-menu.md) — PRD da FAMÍLIA de menus | 2026-09-07 | 24, medidas em 2026-09-15 | 4 |

**A família de menus entrou nesta categoria em 2026-09-20, por decisão da dona**, e a
linha dela não é como as outras cinco: o PRD nasceu na rodada de Overlay, em
2026-09-07, já passou por revisão serial e por várias passagens `fix` — a última em
2026-09-19, que mediu a estrutura de DOM dos três membros. As inconsistências dele
estão na §7 com a data de 2026-09-15, e as quatro pendências abertas são as da
estrutura de lista, abertas com a decisão de categoria.

**O que a migração fecha, e o que ela abre.** Fecha os itens 1 e 30 da
§"O que está aberto" da [`21-navegacao.md`](../guidelines/21-navegacao.md) — em que
categoria o Menubar mora, e se a categoria monta lista. Abre o conserto do markup: 13
das 15 implementações montam `<div>` onde a regra agora pede `<ul>`/`<li>`, e o
`catalogo_duplicado_com_prd` continua sem ver seção de Menubar ou de ContextMenu nas
guidelines de stack, porque exige um PRD com o nome do componente e não lê
`prd-familia`. As quatro seções `## Menubar` que existem são legítimas: são mecânica
de stack, declarada no título.

**Linha de base do auditor, antes dos PRDs de navegação**, medida em 2026-09-17:
navigation-menu 38 achados, pagination 21, tabs 18, stepper 14, breadcrumb 7 e
menubar 1. O NavigationMenu concentra quase 40% da categoria, e dez dos achados
dele são eventos anunciados no conteúdo e não tipados em stack nenhuma.

**Três membros da família de menus dividem um PRD.** O ContextMenu e o Menubar
não têm PRD próprio: os dois são montados com as peças do DropdownMenu, e o que
os separa está registrado como decisão lá (D9). O cabeçalho do arquivo declara a
família em `<!-- prd-familia: context-menu menubar -->`, e um portão cobra o PRD
quando o código de qualquer um dos três muda.

**Até 2026-09-12 esta seção tinha duas tabelas**, e a segunda dizia que Dialog,
AlertDialog e Command eram "escritos ANTES da revisão serial". Os três já foram
revisados em 2026-09-10; a tabela de pré-revisão sobreviveu dois dias à própria
condição, que é exatamente o envelhecimento que os portões de pendência deste
diretório existem para pegar — e que nenhum deles vê num índice.
