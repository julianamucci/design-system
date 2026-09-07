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

## Índice

Começando pela categoria Overlay, na ordem em que a revisão serial fechou cada um.

| componente | PRD | revisão fechada em |
|---|---|---|
| Popover | [popover.md](popover.md) | 2026-09-06 |
| HoverCard | [hover-card.md](hover-card.md) | 2026-09-06 |
| Tooltip | — | 2026-09-06 |
| Sheet | — | 2026-09-06 |
| DropdownMenu | — | 2026-09-07 |

O ContextMenu está em revisão neste momento e entra quando ela fechar. Dialog,
Drawer, AlertDialog e Command ainda não passaram pela revisão serial — o PRD
deles descreveria um estado que a revisão vai mudar, e por isso esperam.
