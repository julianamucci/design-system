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

Os dois são metades. O hook não sabe se a edição do PRD foi correta — um espaço
em branco passa. A regra não sabe que uma decisão mudou — ela só sabe que um
token sumiu da folha. E **nenhum dos dois pega o defeito que motivou o
diretório**: decisão revertida com o código e o PRD mudando juntos só aparece
para quem ler a linha. O que os gatilhos compram é que o documento seja aberto na
hora certa e que as tabelas factuais não possam derivar em silêncio.

Story, fixture, snippet e teste não disparam o hook: eles mudam como o componente
é DEMONSTRADO, não o que ele é. Para mudança que de fato não altera nada do que o
PRD afirma, `PRD_SKIP=1 git commit …` pula só esse guarda — `--no-verify`
desligaria também o de teste silenciado, e não é o caminho.

## Índice

Começando pela categoria Overlay, na ordem em que a revisão serial fechou cada um.

| componente | PRD | revisão fechada em |
|---|---|---|
| Popover | [popover.md](popover.md) | 2026-09-06 |
| HoverCard | [hover-card.md](hover-card.md) | 2026-09-06 |
| Tooltip | [tooltip.md](tooltip.md) | 2026-09-06 |
| Sheet | [sheet.md](sheet.md) | 2026-09-06 |
| DropdownMenu | [dropdown-menu.md](dropdown-menu.md) | 2026-09-07 |
| Drawer | [drawer.md](drawer.md) | 2026-09-07 |

O ContextMenu **não terá PRD próprio**: ele não tem folha, e o componente inteiro
é montado com as classes do DropdownMenu — está registrado como decisão D9 lá.

### Escritos ANTES da revisão serial

| componente | PRD |
|---|---|
| Dialog | [dialog.md](dialog.md) |
| AlertDialog | [alert-dialog.md](alert-dialog.md) |
| Command | [command.md](command.md) |

Estes três descrevem o estado atual de componentes que a revisão ainda vai
atravessar, e o cabeçalho de cada um diz isso. A diferença não é de rigor — as
decisões são medidas do mesmo jeito — e sim de expectativa: aqui é normal que uma
linha mude, e a forma de mudar é a mesma de sempre, movendo-a para o histórico
com a nova data e a nova medição.

Com o Drawer, a categoria Overlay inteira tem registro: os seis revisados acima e
os três de pré-revisão aqui.
