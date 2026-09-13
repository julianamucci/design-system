# PRD — Dialog

> **Estado descrito**: 2026-09-12, conferido linha a linha contra o código das
> cinco stacks. **Revisão serial fechada em** 2026-09-10 (`1a6ca4fbb`), e as
> rodadas de CATEGORIA de 2026-09-11 e 2026-09-12 passaram por aqui depois: o
> motivo do fechamento saiu da docs page, o vanilla ganhou `open()`/`isOpen()` e
> perdeu o gatilho escondido, o rótulo do menu das docs pages foi unificado.
>
> Nesta conferência mudaram **§5** (o véu não desfoca), **§6** e **§7** (os dois
> `showCloseButton`), **§9** (`dialog_action` entra na tabela), **C3** e **D1** —
> cada linha antiga registrada no lugar, com data e medição, em vez de reescrita
> por cima.
>
> **Até 2026-09-12 este cabeçalho dizia "Estado descrito: 2026-09-07" e trazia o
> aviso "⚠ Escrito ANTES da revisão serial deste componente".** O aviso
> sobreviveu dois dias à revisão que ele anunciava, e as rodadas que
> reescreveram §7 e §9 nesse meio-tempo não o releram: cabeçalho que avisa sobre
> o futuro é a linha que ninguém volta para fechar.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Modal centralizado sobre um véu translúcido, que **interrompe a página**: toma o
foco, trava a rolagem e se anuncia como diálogo modal.

| vizinho | diferença que decide |
|---|---|
| AlertDialog | é irmão, com outra decisão de saída: clique no véu não fecha e não há botão no canto — a escolha tem de ser explícita |
| Sheet | também modal, mas encosta na borda da tela em vez de nascer no centro |
| Popover | não interrompe: fica ao lado da página |

As duas folhas — esta e a do AlertDialog — são irmãs de verdade: `alert-dialog.css`
reusa as keyframes `nds-dialog-fade-in` / `-fade-out` declaradas aqui.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | `role="dialog"` com `aria-modal="true"` | `accessibility.item1` |
| C2 | Nome e descrição saem do título e da descrição, automaticamente | `accessibility.item2` |
| C3 | O foco fica preso; o foco inicial vai ao primeiro focável | `accessibility.item3` |
| C4 | Ao fechar, o foco volta ao gatilho | `accessibility.item4` |
| C5 | `Escape` e clique no véu fecham, **sem** disparar ações do rodapé; a rolagem é restaurada | `accessibility.item5` |
| C6 | O botão de fechar tem nome acessível para leitor de tela | `accessibility.item6` |
| C7 | Corpo mais alto que o painel precisa de `tabindex="0"`, `role="group"` e `aria-label` juntos | docblock da folha — sem portão automático |

**O portão da C3 descrevia uma rota que não existe mais, e foi corrigido em
2026-09-12.** Medido naquele dia nos três idiomas: o `accessibility.item3` de
`docs/shared/content/dialog/translations.json` dizia "…na rota de rolagem, em que
o corpo inteiro rola, ele vai para o painel, que é quem recebe a rolagem" — o
painel recebendo a rolagem era exatamente o par `-overlay-scroll` +
`-content-scroll` que a D7 retirou em 2026-09-08. Hoje a chave diz o que o código
faz: quem rola é o CORPO, e é ele que entra na ordem de tabulação com papel e nome
próprios. A metade que sempre valeu é a primeira — foco preso, foco inicial no
primeiro focável.

## 3. Decisões fixadas

### D1 · A superfície é `--popover`, e o Dialog está sozinho entre QUATRO painéis modais

**Estado**: painel em `--popover` / `--popover-foreground`.

**Medição de 2026-09-09**, lendo a declaração de cada folha:

| folha | superfície do painel |
|---|---|
| `dialog.css` | `--popover` |
| `sheet.css` | `--background` |
| `alert-dialog.css` | `--background` |
| `drawer.css` | `--background` |

São **quatro**, e o Dialog é o único fora do consenso. **Nenhuma** lê `--card`.

**Esta contagem já esteve errada aqui, e o modo de errar é o que importa**: a
linha dizia "as três folhas modais" e ficou de pé depois de o Drawer entrar na
categoria, porque contava os VIZINHOS — e afirmação sobre o que os outros fazem
não passa por este arquivo quando um deles muda. É a mesma lição que a D8 do
`alert-dialog.md` escreveu sobre o desfoque, uma seção antes de esta contagem
apodrecer do mesmo jeito. A defesa aqui é a tabela: ela nomeia as quatro, então
uma quinta folha modal que apareça não cabe sem ser escrita.

**O registro é ESTE arquivo, e a guideline aponta para cá.** Desde 2026-09-10 a
regra da categoria mora uma vez só, em `docs/shared/guidelines/18-overlay.md`
§Superfície: a tabela de lá nomeia as dez classes com o par de tokens de cada
uma, diz que **nenhuma lê `--card`** e manda a divergência dos quatro painéis
modais para esta D1. Não há mais duas fontes para a mesma coisa, e o ponteiro
agora é para uma seção, não para "a guideline" sem dizer qual.

**Até 2026-09-12 este parágrafo dizia "as cinco discordam: em 2026-09-09, quatro
delas ainda afirmam `--card` para os painéis".** A medição estava certa no dia em
que foi feita e o mundo que ela descreve durou um dia: `b77b4d155` unificou as
cinco cópias de `10-overlay-components.md`, e o `--card` que quatro delas
afirmavam ficou registrado no histórico da própria guideline unificada (§Por que
este arquivo existe). O mecanismo é o mesmo da contagem de painéis acima —
**afirmação sobre o estado de OUTRO arquivo não se corrige quando aquele arquivo
muda** —, e a defesa foi a mesma: trocar a afirmação por um ponteiro para a
seção que responde.

**Enquanto a divergência existir**, o que vale é a regra estrutural: a classe do
painel resolve a superfície, e ninguém pinta fundo por fora. A revisão serial
passou (2026-09-10) sem mexer no degrau de superfície, então a decisão segue
**aberta** — e fechá-la é escolha da dona, não de rodada de conferência.

### D2 · O rodapé É a aresta de baixo do painel

**Estado**: `margin-inline` e `margin-bottom` negativos de `--spacing-4` cancelam
exatamente o padding do painel; o rodapé recebe o padding de volta e pinta
`--muted` a 50% com borda superior.
**Consequência no raio**: a aresta do rodapé e a do painel são a mesma linha —
na regra de raio aninhado (`Rᵢ = Rₑ − E`) isso é `E = 0`, e o rodapé repete o raio
do painel em vez de descontar. Não é o caso do `.nds-card-nested`, que existe para
quem está dentro **com** afastamento.
**Medição**: era `0.75rem` cravado, e divergia do painel nas **doze** combinações
de tema × modo × largura — 24px de painel contra 12 de rodapé no `default`, 28
contra 12 no `warm`, e rodapé arredondado dentro de um painel de quinas retas no
`cold`, que declara `--radius-card: 0`.

### D3 · O raio muda a 40rem, e o rodapé acompanha

**Estado**: abaixo de 40rem o painel é reto (`--radius-none`); a partir daí assume
`--radius-card`. O rodapé segue o painel no mesmo ponto de corte.
**Cuidado ao desenhar**: nenhum eixo de variante cobre isso, e frame de Figma não
expressa consulta de mídia.

### D4 · O fio de 1px é SOMBRA, não borda

**Estado**: `box-shadow: 0 0 0 1px hsl(var(--foreground) / 0.1), var(--elevation-xl)`.
**Elevação `xl` desde 2026-09-10** — era `lg`. Regra da categoria fixada pela dona: card `sm` · flutuante interativo `md` · flutuante passivo `lg` · modal e drawer `xl`.
**Consequência**: é traço de fora, sem ocupar espaço no layout. No Figma isso é
contorno externo de 1px, não borda.
**Contraste**: o Sheet usa um fio equivalente, mas **literal** — preto a 5%, sem
token. Os dois não são o mesmo valor.
**Conferido em 2026-09-12, depois da tokenização de elevação**: `aaa9ea44c` fez
16 sombras cravadas passarem a ler token e criou o degrau `--elevation-xs`, e
nenhuma das duas coisas alcança esta folha — ela já lia `--elevation-xl`, e o `xs`
é fio de relevo de controle que continua no plano da página, não superfície que
paira: folha modal nenhuma o lê. O degrau daqui continua `xl`, e o portão que o
cobra é `elevacao_fora_do_mapa`.

### D5 · Nenhum véu desfoca o fundo

**Estado**: sem `backdrop-filter`. Nenhuma folha modal tem.

**Histórico**: até 2026-09-08 este era o único overlay com
`backdrop-filter: blur(4px)`, dentro de `@supports`. A medição que o acompanhava
já dizia o suficiente contra ele — sob um véu de `--overlay / 0.8` o desfoque
quase não aparece —, e a justificativa que restava era o movimento do que está
atrás, não o contraste. Retirado por decisão de produto: custo de pintura em
toda abertura por um efeito que a própria folha declarava invisível.

**O que isso ensina sobre decisão registrada**: a linha ficou de pé por meses
com a medição que a derrubava escrita ao lado. Registrar a dúvida não é o mesmo
que resolvê-la — decisão marcada como frágil precisa de data de revisão, senão
o registro honesto vira álibi para a manter.

### D6 · Clique no véu FECHA — e é aqui que os irmãos se separam

**Estado**: fecha. No AlertDialog, não.
**Por quê**: lá a decisão é crítica e exige escolha explícita; aqui o diálogo é
um passo, não um compromisso. `Escape` fecha nos dois.

### D7 · Há UMA saída para conteúdo longo: o corpo rola

**Estado**: `-body-scroll`. O painel fica centralizado e fixo, o cabeçalho e o
rodapé param, e o corpo ganha `max-block-size: 60vh`.

**A segunda rota foi RETIRADA em 2026-09-08**. Era o par `-overlay-scroll` +
`-content-scroll`: o painel inteiro entrava no fluxo do véu, que virava grid com
`overflow-y: auto`, e a PÁGINA é que rolava. Duas razões para não existir —
um modal que rola junto com a página desfaz a própria promessa de interromper;
e duas saídas opostas para o mesmo problema obrigam cada tela a escolher entre
elas sem critério, que é como divergência entra num design system.

A remoção é do recurso, não da story: sai a prop `scroll`, saem as classes, sai
`DialogScrollContent` do Vue e o ramo do overlay no Svelte. Sistema que ainda
permite a rota errada não a proibiu — só deixou de demonstrá-la.

**Por que `max-block-size` e não `height`**: o limite é teto, então painel curto
continua do tamanho do conteúdo. E a medida é relativa à janela, logo cresce com
o zoom do navegador (WCAG 1.4.4).
**O trio obrigatório do corpo rolável**: `tabindex="0"`, `role="group"` e
`aria-label`, juntos. Caixa que rola é parada de teclado (WCAG 2.1.1), parada de
teclado precisa de papel, e nome em elemento sem papel é atributo proibido. É
`group` e não `region` porque marco aninhado num diálogo já nomeado não
acrescenta navegação — mesma decisão registrada em `sheet.css`.

### D8 · O gap do cabeçalho vem do composto, não da base

**Estado**: a folha base declara `--spacing-1-5` e o bloco composto — que é o que
as cinco stacks entregam — sobrescreve para `--spacing-2`, alinhado à esquerda.
**Consequência**: ao ler a folha, o segundo valor é o que vale.

### D9 · No rodapé, o primário é o ÚLTIMO do DOM — e é a folha que inverte

**Estado**: `.nds-dialog-footer` é `column-reverse` empilhado e `row` +
`justify-content: flex-end` a partir de 40rem. As duas leituras saem da MESMA
ordem de DOM: secundários primeiro, primário por último. Empilhado o primário
sobe ao topo; deitado ele vai para a direita.

**Por que o inverso do que parece**: escrever o primário por último é
contraintuitivo, e por isso o defeito é reincidente. Medido em 2026-09-07 nas
cinco stacks: as quatro que oferecem `showCloseButtonFooter` renderizavam o
botão DEPOIS dos filhos, o que o punha na posição do primário; e a story do
vanilla montava `[Voltar, Continuar, Fechar]`, deixando o primário no MEIO com
um `ghost` acima dele.

**O que guardava o defeito**: quatro textos afirmavam "abaixo das ações" — as
duas chaves do conteúdo compartilhado, o docblock do `NdsDialogFooter` e a
linha da tabela de API (§7). Quem conferisse pela leitura encontraria acordo
entre documento e documento; o desacordo estava com a folha, que nenhum dos
quatro cita. É o mesmo mecanismo do drawer, onde um teste verde afirmava a
inversão.

**Nenhum compilador alcança isto**, e nenhuma suíte que asserte por papel
tampouco: a ordem só existe como posição entre irmãos. O portão é ler o DOM.

### D10 · O rodapé fica DENTRO do `<form>`, e é isso que faz o Enter funcionar

**Estado**: em diálogo de formulário, o `<form>` envolve o corpo **e** o rodapé.
A ação primária é `type="submit"` e fica dentro dele.

**Por que não é detalhe de arrumação**: `type="submit"` fora do `<form>` é um
botão inerte — não submete, e o Enter num campo não dispara nada. O botão
continua clicável e com a aparência certa, então nada na tela denuncia.

**Quarta ocorrência desta classe na campanha**, e o caminho dela diz muito: no
`sheet` do Angular o botão de confirmar do perfil estava fora do form; na story
`WithForm` do `dialog` do Angular o arquivo inteiro não tinha um `<form>`
sequer; e a mesma coisa vivia em `anatomy.structureCode` de react, vue e svelte
— que é conteúdo COMPARTILHADO, a chave mais copiada que o componente tem.
Corrigido em 2026-09-07 nas quatro pontas.

**O que nenhum portão vê**: `<form>` presente e submit fora dele é HTML válido,
compila nas cinco e passa em qualquer asserção por papel ou por texto. O que
denuncia é ler `button.form` — vazio quando o botão está órfão.

### D11 · O cenário das duas composições sem consenso é o do Vanilla

**Estado**: `CustomCloseInFooter` mostra o guia — "Abrir guia" / "Próximos
passos" / rodapé de três botões `[Fechar (ghost), Voltar (outline), Continuar
(primária)]`. `NoFooter` mostra "Sobre este recurso", só título e descrição.
Ambos vivem em `demonstration.labels` do conteúdo compartilhado, nos três
idiomas.

**Por que precisou de decisão, e não de medição**: `CustomCloseInFooter`
renderizava QUATRO cenários diferentes nas cinco stacks — perfil no react,
"Próximos passos" no vanilla, "Configurações de notificação" no vue, convite ao
time no svelte —, e `NoFooter` discordava entre "Sobre este produto", "Sobre
este recurso" e "Saiba mais". Onde nem duas stacks concordam não existe maioria
a que alinhar: a regra "o vanilla é a referência" resolve divergência de markup
e comportamento, mas qual HISTÓRIA a demo conta é escolha de produto. Decidido
pela dona em 2026-09-08, a favor do vanilla.

**O que deixou isso passar tanto tempo**: `demonstration_labels_divergent` só
aponta quem foge da MAIORIA e emudecia sem ela — ver a nota da regra em
`scripts/audit.mjs`. Divergência máxima produzia zero achados. Hoje o
`demonstration_labels_sem_consenso` cobre esse caso, e ele acusava 3 dos 85
componentes: chart, dialog e table.

**Consequência para quem for montar demo nova**: rótulo de cenário nasce no
conteúdo compartilhado, nunca cravado numa stack. `demonstration.labels` tinha
SEIS chaves para uma página de dez cenários — foi essa escassez que levou cada
stack a inventar a sua.

## 4. Anatomia

```
dialog-overlay                véu, sem desfoque (D5)
dialog-content                role="dialog" · aria-modal="true" · centralizado por translate
├── dialog-header             coluna
│   ├── dialog-title
│   └── dialog-description
├── dialog-body               sem estilo próprio — quem monta a tela decide
├── dialog-footer             É a aresta de baixo do painel (D2)
└── dialog-close              absoluto, canto superior direito
```

**O corpo não tem estilo próprio**, e a folha diz isso por escrito: o consumidor
define padding e espaçamento do conteúdo.

**O botão de fechar tem duas formas**, como no Sheet: o vanilla monta
`.nds-dialog-close`, e as quatro stacks com lib compõem o botão do design system
e usam só `.nds-dialog-close-position`, com o rótulo em `.nds-sr-only`. A folha
traz as duas regras, com afastamentos diferentes — ver §5.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/dialog.css`.

| propriedade | valor | token |
|---|---|---|
| véu | 80% de opacidade, **sem desfoque** | `--overlay` — ver D5 |
| superfície | — | `--popover` — ver D1 |
| texto | — | `--popover-foreground` |
| largura | `100% − 32px`, teto de 512px | `--spacing-8` na folga; teto **literal** (`32rem`) |
| padding | 16px | `--spacing-4` |
| gap do painel | 16px | `--spacing-4` |
| raio | reto abaixo de 40rem, depois card | `--radius-none` e `--radius-card` — ver D3 |
| fio + elevação | 1px a 10% + xl | `--foreground` e `--elevation-xl` — ver D4 |
| gap do cabeçalho | 6px na base, 8px no composto | `--spacing-1-5` e `--spacing-2` — ver D8 |
| título | 16px, peso médio, entrelinha 1 | `--text-control-lg`, `--font-weight-medium`, cor `--foreground` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| rodapé | fundo a 50%, borda superior, padding 16px, gap 8px | `--muted`, `--border`, `--spacing-4`, `--spacing-2` |
| botão de fechar (forma do vanilla) | canto a 16px, raio `--radius-xs`, padding `--spacing-1`, opacidade 0.7 | `--spacing-4` no canto |
| botão de fechar (forma composta) | só posicionamento: canto a 8px | `--spacing-2` — `.nds-dialog-close-position` |
| anel de foco do fechar | halo 2px + anel 5px | `--background` e `--ring` |
| corpo rolável | teto de 60vh, respiro lateral | `--spacing-2` |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**Até 2026-09-12 a linha do véu dizia "80% de opacidade, desfoque de 4px".** O
`backdrop-filter` saiu em 2026-09-08 e a D5 deste mesmo arquivo registrou a saída
no dia — a tabela ficou quatro dias contradizendo a D5, que está duas seções
acima dela. Medido em 2026-09-12: nenhuma das quatro folhas modais
(`dialog.css`, `sheet.css`, `alert-dialog.css`, `drawer.css`) declara
`backdrop-filter`. Duas linhas sobre o mesmo valor no mesmo arquivo é uma linha
que ninguém relê; a tabela agora só aponta para a D5.

**O canto do botão de fechar tem DOIS valores, e é a mesma diferença de forma
que o Sheet registra na §4 dele**: o vanilla monta `.nds-dialog-close`, afastado
16px, e as quatro stacks com lib compõem o botão do design system usando só
`.nds-dialog-close-position`, afastado 8px. Medido em 2026-09-12 na folha;
**até essa data esta tabela tinha uma linha só, "canto a 16px"**, que descrevia a
forma de uma stack como se fosse das cinco. Por que os dois números diferem não
está escrito em lugar nenhum da folha — o botão composto traz padding próprio, e
o afastamento menor é compatível com compensá-lo, mas isso é leitura, não
medição: se a diferença óptica importa, ela se mede em tela, e não aqui.

**Animação**: entrada com fade e zoom (`--duration-base`, `--ease-entrance`),
saída mais rápida (`--duration-fast`, `--ease-exit`). Sob
`prefers-reduced-motion` as duas somem.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial, ou `open=false` | só o gatilho na tela; o painel não está no DOM — não é painel escondido |
| Opening | de fechado para aberto | `data-state="open"`: o véu aparece e o painel cresce a partir de 95% |
| Open | gatilho, ou `open=true` | véu semitransparente, foco preso, rolagem da página travada |
| Closing | de aberto para fechado | `data-state="closed"`: o painel encolhe e o véu some, em `--duration-fast` |
| WithCloseButtonHidden | o `showCloseButton` do Content desligado | sem X no canto; a saída fica sendo Escape, clique no véu ou ação do rodapé |

**Entrada e saída são estados SEPARADOS**, e não um `Transitioning` só — foi o
conteúdo compartilhado que os separou, e eles não são simétricos: a entrada usa
`--duration-base` com `--ease-entrance`, a saída `--duration-fast` com
`--ease-exit`. Sob `prefers-reduced-motion` as duas somem.

O foco dentro do painel não é estado do Dialog: o anel é do elemento focado, e
no botão de fechar ele tem as duas camadas descritas na §5.

## 7. API

| prop | o que faz |
|---|---|
| `open` | estado controlado |
| `defaultOpen` | estado inicial não controlado |
| `onOpenChange` | callback com o novo estado |
| `showCloseButton` **do Content** | exibe o X no canto do painel — padrão `true` |
| `showCloseButton` **do Footer** | exibe um botão de fechar dentro do rodapé, como ação TERCIÁRIA — variante `ghost`, primeiro no DOM (D9). Padrão `false` |
| `closeLabel` | rótulo do botão de fechar, prop das DUAS peças: no Content é o nome de leitor de tela do X, no Footer é o texto visível. Padrão `'Fechar'` em cada uma |
| `className` | classes `.nds-*` adicionais |

**São duas props com o MESMO nome, em peças diferentes — e até 2026-09-12 esta
tabela as chamava de `showCloseButtonContent` e `showCloseButtonFooter`, que não
são props de stack nenhuma.** Medido nas cinco em 2026-09-12: react, vue, svelte
e angular declaram `showCloseButton` no Content (padrão `true`) e outro
`showCloseButton` no Footer (padrão `false`); o vanilla tem um só, em
`DialogOptions`, porque ali o rodapé é a opção `footer`, que recebe os botões
**já montados** por quem compõe — não há peça de rodapé para pendurar um botão
de fechar próprio (D9). Os dois nomes longos existem, e é daí que a confusão
vinha: são as CHAVES do conteúdo compartilhado
(`props.table.showCloseButtonContent` e `.showCloseButtonFooter` em
`docs/shared/content/dialog/translations.json`), que precisam ser distintas
porque a tabela da docs page é plana e as duas linhas moram na mesma lista. Chave
de conteúdo vestida de nome de prop leva quem lê a escrever uma prop que nenhuma
stack aceita — e `tsc` não reprova o que ninguém escreveu ainda.

`closeLabel` existia só no Angular e foi levado a react, vue e svelte em
2026-09-07, com o mesmo default (`'Fechar'`), de modo que nenhum call site
existente muda. Antes disso o literal ficava cravado DENTRO do primitivo, e quem
consumisse em outro idioma tinha de reescrever o componente.

**O vanilla ficou de fora naquela passagem, e foi fechado em 2026-09-08.** Ele
cravava `'Fechar'` em dois pontos — o `aria-label` do botão e o `.nds-sr-only`
dentro dele —, exatamente o defeito que a regularização existia para corrigir,
sobrevivendo na stack que é a referência de contrato da casa.

**Por que passou**: a §7 afirmava "regularizado nas cinco" quando eram quatro. O
commit que fez o trabalho tocou react, vue e svelte, e o texto contou o Angular
(que já tinha) sem conferir o vanilla (que não). Afirmação de cobertura escrita
a partir do que a passagem FEZ, e não do que ela DEIXOU — some quem nunca entrou
na lista. É a mesma forma do `source-snippets.test.ts`, que encolheu em silêncio
quando 28 exports saíram da varredura.

**Conferidos junto, e os três estão certos**: o `sheet.ts` do vanilla já tinha
`closeLabel`; o `drawer` não gera botão de fechar em stack nenhuma — delega a
quem compõe, por `data-slot="drawer-close"` —, e o `alert-dialog` não tem botão
de canto por decisão (D2 do PRD dele).

Os dois `showCloseButton` são independentes: o do Content é o X do canto, o do
Footer é uma ação no rodapé. Ligar um não liga o outro, e nada impede os dois
ligados ao mesmo tempo — é a composição que decide.

**E o vanilla ganhou `open()`/`isOpen()` em 2026-09-12** (`efdf144cd`), com
`trigger` passando a ser OPCIONAL: `DialogElement` é
`DestroyableElement & { open(), close(), isOpen() }`. O que isso aposentou foi o
gatilho escondido — `<button>` com `.nds-sr-only`, `tabindex="-1"` e
`aria-hidden="true"`, clicado por código só para a fábrica ter um alvo —, que
estava na story `Controlled` deste componente e no snippet que o painel Code
publica. O registro por extenso, com o `toggle()` que ficou fora de propósito e a
guarda de reentrância, está na §7 do [`sheet.md`](sheet.md), que é onde a mesma
passagem foi medida. Portão: `gatilho_escondido_clicado`.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` |
| vue | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogTitle`, `DialogTrigger` |
| svelte | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` |
| vanilla | `createDialog` (devolve `DialogElement = DestroyableElement & { open(), close(), isOpen() }`; `trigger` é opcional) |
| angular | `button[ndsDialogClose]`, `button[ndsDialogTrigger]`, `div[ndsDialogBody]`, `div[ndsDialogContent]`, `div[ndsDialogFooter]`, `div[ndsDialogHeader]`, `div[ndsDialogOverlay]`, `div[ndsDialog]`, `h1[ndsDialogTitle]` … `h6[ndsDialogTitle]` (os seis), `ng-template[ndsDialogPortal]`, `p[ndsDialogDescription]` |

O índice do svelte também reexporta as formas curtas — `Close`, `Content`, `Description`, `Footer`, `Header`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

**A peça que diz por que o painel fechou também é do componente**, e desde
2026-09-12 as cinco a têm ao lado do primitivo, exportada pelo mesmo índice das
peças. Antes disso, três stacks deduziam o motivo DENTRO da docs page, onde a
dedução não tinha teste e cada página fazia à sua maneira:

| stack | peça | forma |
|---|---|---|
| react | `ui/dialog-close-reason.ts` | traduz — a base-ui publica o motivo em `eventDetails.reason` |
| angular | `ui/dialog-close-reason.ts` | traduz — o radix-ng publica `RdxDialogOpenChangeReason`, que tem oito palavras contra as nossas quatro |
| vanilla | a própria fábrica, em `onClose(reason)` | sabe de primeira mão: é ela que fecha |
| vue | `ui/dialog/dialog.close-reason.ts` | OBSERVA o gesto: a reka-ui não publica motivo |
| svelte | `ui/dialog/close-reason.ts` | observa o gesto: a bits-ui também não publica |

Quem marca a CONFIRMAÇÃO continua sendo a página — é ela que sabe que a pessoa
decidiu —, e a marca vence o motivo da lib, porque a ação e o cancelar são as
duas partes de fechar e a lib entrega a mesma palavra para as duas. O que saiu da
página foi a tradução. Portão: `motivo_sintetizado_na_docs_page`.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável nas cinco, cada uma de um
jeito** — medido na fonte de cada lib, não na documentação delas:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `render` (`BaseUIComponentProps<'h2'>`) | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | snippet `child` + prop `level` | `div` com `aria-level="2"` |
| angular | seletor por elemento, nos SEIS níveis | o que quem escreve usar |
| vanilla | opção `titleLevel` da fábrica | `2` |

As cinco aceitam qualquer nível desde 2026-09-08, e chegaram lá por caminhos
diferentes. O Angular oferecia só `h2` e `h3` e ganhou os seis por decisão da
dona; o vanilla não oferecia nenhum — `createElement('h2')` cravado — e ganhou
`titleLevel`.

**O nome da opção é relativo ao ESCOPO da fábrica, e isso NÃO é divergência** —
já foi relatado como tal três vezes. Fábrica que monta só o título usa `level`
(`createPopoverTitle`, `createCardTitle`); fábrica que monta o componente
inteiro usa `titleLevel` (`createDialog`, `createSheet`, `createDrawer`,
`createAlertDialog`), porque `createCardTitle({ titleLevel })` leria "title
title level". A regra vale fora do vanilla: no Svelte o wrapper de story usa
`titleLevel` e o snippet emite `level`, que é a prop do bits.

**O DEFAULT, esse era divergência, e fechou em 2026-09-09**: o
`createPopoverTitle` defaultava `h4` e passou a `2`, alinhando com estas quatro
fábricas e com o que as outras stacks anunciavam. O `createCardTitle` não tem
default de nível — sem `level` ele monta `div`, igual a react, vue e svelte no
card. Citar as duas como precedente de FORMA, que era o que esta linha fazia,
dizia menos do que parecia: o precedente é do nome, nunca do valor.

**A linha do svelte estava ERRADA até 2026-09-09, e foi a story que a corrigiu**:
`level` sozinho não troca a tag. O título daquela lib renderiza
`<div role="heading">` e o `level` só alimenta o `aria-level` — e como o mesmo
componente serve os quatro painéis, não há atalho por slug. Quem entrega o
cabeçalho de verdade é o snippet `child`, que é a delegação de elemento daquela
lib, irmã do `render`, do `as` e do `asChild`. Os dois andam juntos: sem
`level`, um `h3` escrito pelo `child` sairia com `aria-level="2"`, e a tag
brigaria com o ARIA. A afirmação antiga — "as cinco aceitam qualquer nível pelo
mecanismo da própria lib" — era verdadeira só no sentido do ARIA, e ninguém
tinha medido porque nenhuma superfície exercitava a capacidade.

**Por que isso importa**: `heading-order` do axe reprova salto de nível, e o
painel não sabe de que profundidade da página foi aberto — um diálogo disparado
de dentro de uma seção já em `h3` precisa sair em `h4`.

**A story existe desde 2026-09-09**: `HeadingH3`, no arquivo de variantes das
cinco stacks, com o painel aberto na montagem e o título pedido em `h3`. Ela
afirma as duas metades, e a segunda é a que dá valor à primeira — o elemento
renderizado é o pedido (`tagName`), e o `aria-labelledby` do painel continua
resolvendo NELE, com o nome acessível saindo do seu texto. Os dois defeitos que
ela existe para pegar foram plantados e reprovaram nas cinco: trocar a tag
mantendo o vínculo, e manter a tag rompendo o vínculo.

## 8. Acessibilidade

**Atributos**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e
`aria-describedby` automáticos a partir do título e da descrição.

**Teclado**: Tab e Shift+Tab circulam dentro do painel; Escape fecha sem executar
ação do rodapé; ao fechar, o foco volta ao gatilho.

**O que NÃO se faz:**

- não se dispara ação do rodapé no Escape nem no clique do véu — fechar não é
  confirmar;
- não se deixa o corpo rolável sem o trio de atributos (D7).

**Movimento reduzido** — a §5 e a §6 dizem que a entrada e a saída somem, e é verdade. Quem o para é a camada de TOKEN: a folha
declara duração só por `var(--duration-*)`, e `docs/shared/tokens/motion.css`
zera a escada inteira sob a preferência. O mecanismo está por extenso em
`hover-card.md` §8.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | abre por gatilho ou estado controlado | `{ component: "dialog", trigger_id, location }` |
| `dialog_close` | fecha | `{ component: "dialog", trigger_id, location, reason }` |
| `dialog_action` | clique na ação primária do rodapé | `{ component: "dialog", action_label, location }` |

**Até 2026-09-12 esta tabela tinha duas linhas, e o componente disparava três.**
Medido nas cinco em 2026-09-12: `dialog_action` está tipado em todas as cinco
`analytics.ts` e é disparado pelas cinco docs pages (`DialogDocs.*`), e a tabela
`analytics.table` do conteúdo compartilhado o documenta desde 2026-04-29
(`2c9115827`, a primeira gravação do conteúdo deste slug) — evento que
existe no tipo, no call site e no conteúdo, e faltava só no documento que se
propõe a descrever o componente. Nenhum portão via: o `event_not_typed` do
`audit.mjs` cobra o caminho contrário — evento disparado que a `analytics.ts` não
declara — e a tabela deste arquivo não é lida por regra nenhuma. Falta de linha
em PRD é ausência, e ausência não tem quem a acuse.

**Ele é o ÚNICO dos três que não leva `trigger_id`**, e a diferença é de
pergunta: `dialog_open` e `dialog_close` respondem "qual painel", e o
`action_label` responde "qual ação foi confirmada" — id estável, nunca texto
traduzido (`save`, `ok`, `delete`, `remove`, `continue`, `confirm-email` nas
prévias da página). Vale saber, porque **o Sheet chama o dele de
`dialog_confirm`** e manda
`{ component: "sheet", trigger_id, action, location }` — dois nomes de evento e
dois formatos para a mesma pergunta de produto, em componentes que
deliberadamente COMPARTILHAM `dialog_open` e `dialog_close`. Os dois eventos estão
tipados nas cinco stacks, e cada componente dispara só o seu: nenhuma docs page
de Dialog manda `dialog_confirm`, nenhuma de Sheet manda `dialog_action`.
Unificar é decisão da dona — está registrado aqui e na §9 do
[`sheet.md`](sheet.md), não consertado por conta própria.

O Sheet e o AlertDialog emitem os MESMOS eventos, com `component: "sheet"` e
`component: "alert-dialog"` — as peças respondem à mesma pergunta de produto, e
separar as séries esconderia isso. **O campo de quem abriu é `trigger_id` nos
três** (e no `drawer_*`), por decisão da dona em 2026-09-10: até ali o
AlertDialog, o Sheet e o Drawer mandavam o mesmo id estável sob `label`, e esta
linha defendia a divisão dizendo que o lado do Sheet "não é identificador de
gatilho". É: nas demonstrações cada gatilho abre um lado, e o lado é o id dele.
Regra da categoria em `18-overlay.md` §Analytics.

**`reason` é obrigatório, com as quatro palavras da família** — `escape`,
`overlay`, `close-button` e `api`, as mesmas do `drawer_close` e do
`popover_close` (`18-overlay.md` §Analytics). `api` é "fechou por decisão de
dentro": a ação que confirma, ou o fechamento por código.

Até 2026-09-10 este evento dizia `action` onde o drawer e o popover diziam
`api`, e nem era um tipo só: o React aceitava seis palavras (`action`, `user` e
`unknown` além das três comuns), React, Vue e Svelte deixavam o campo opcional,
e o Dialog e o AlertDialog do Vue e do Svelte não mandavam motivo nenhum — a lib
deles não publica, e a docs page não o deduzia. A dona decidiu por `api`, e as
cinco passaram a mandar o campo nos três componentes que usam este evento. Onde
a lib não publica motivo, a docs page o anota pelos eventos de `Escape` e de
clique fora do conteúdo, e marca a confirmação ANTES de o painel fechar — a ação
e o cancelar são partes de fechar da lib, e sem a marca "confirmou" chegaria ao
relatório como "apertou o botão de fechar". Portão: `reason_vocabulario_divergente`.

**Desmontar não é fechar** (2026-09-12). Sair da página com o painel aberto —
troca de story, desmonte de docs page, troca de idioma, que refaz as seções —
tirava o painel chamando o mesmo caminho de fechamento, e o relatório recebia um
`dialog_close` com `api`: a MESMA palavra de quem confirmou a ação, portanto
indistinguível dela no GA4. Valia para o Dialog e para o AlertDialog do vanilla;
o Sheet e o Drawer já desmontavam calados. Hoje o desmonte remove o painel e
avisa só `onOpenChange(false)`, que descreve estado e não gesto. Portão:
`desmonte_emite_fechamento`, que resolve um salto de chamada — nenhum desses
callbacks de limpeza contém a palavra `onClose`, todos chamam uma função local,
e por isso a primeira versão do portão, que procurava a palavra, achava zero com
três fábricas defeituosas.

**MUDANÇA DE CONTRATO, 2026-09-12: o "Fechar" próprio do rodapé relata
`close-button`, e não mais `overlay`.** A variante `customCloseInFooter` da docs
page do vanilla montava um botão de fechar que, ao ser clicado, subia até o
painel, achava o véu irmão e CLICAVA nele. Fechava, mas relatava um gesto de véu
para um clique que foi de botão, e na série do GA4 aquela dispensa contava junto
com quem clicou fora do painel para sair. O botão passa a levar
`data-slot="dialog-close"` — o caminho que a própria página ENSINA no snippet ao
lado, e que a delegação do painel escuta desde 2026-09-11. Mesma raiz que o
clique falso no véu das duas paletas de comando, retirado no mesmo dia: aquelas
não escutavam `onClose`, então nenhum evento mudou de valor ali.

**Desde 2026-09-10 quem cobra o campo é o TIPO.** Nas cinco `analytics.ts`,
`dialog_open`, `dialog_close` e `dialog_confirm` exigem `trigger_id` e proíbem
`label` (`label?: never`), e `location` é obrigatório no abrir e no fechar — o
`dialog_confirm` entra nessa lista porque é da FAMÍLIA (quem o dispara é o Sheet,
ver acima), e o `dialog_action`, que é o terceiro evento deste componente, está
fora dela: nas cinco ele é `{ component: string; action_label: string;
location?: string }` — sem `trigger_id`, sem a guarda `label?: never` e com o
`component` aberto em `string` em vez da união de três palavras. Medido em
2026-09-12; o aperto é decisão da dona, e as cinco declarações mudam juntas. O
primeiro desenho foi uma união discriminada pelo `component` — `dialog` com
`trigger_id`, `alert-dialog` e `sheet` com `label` —, e ela durou o mesmo dia:
com a unificação não há mais o que discriminar. Até ali os dois campos eram
opcionais, e um dia depois da decisão abaixo o
Dialog de quatro stacks ainda mandava `label` — no Angular com os valores
`par1_do`/`par2_dont`. Nenhum portão via: o tipo aceitava tudo. Plantada a
união, o `npm run build` reprovou exatamente esses pontos, e mais um
`component` alargado para `string` no AlertDialog do vanilla.

**Os ids da página, iguais nas cinco** — um por prévia, e toda prévia viva rastreia:

| prévia | `trigger_id` | `location` |
|---|---|---|
| demonstração | `default` | `docs_demo` |
| Do & Don't, par 1 e par 2 | `do-dont-pair1-do` · `do-dont-pair1-dont` · `do-dont-pair2-do` · `do-dont-pair2-dont` | `docs_do_dont` |
| Variantes | `basic` · `with-form` · `scroll-content` · `no-footer` · `destructive` · `custom-close-in-footer` · `confirm-email` | `docs_variantes` |
| Composições | `profile-edit` · `media-preview` | `docs_composicoes` |

Até 2026-09-10 metade disso não existia: a prévia de rolagem, a sem rodapé e
as duas composições abriam sem deixar rastro no vanilla, e a de fechar próprio
mandava `scroll-content` — o nome da de rolagem. Três stacks copiaram a troca, a
quarta pôs o id no lugar certo e deixou a outra muda. A série `scroll-content`
anterior a essa data é a do guia com "Fechar" próprio, não a de rolagem.

**O campo passou de `label` a `trigger_id` em 2026-09-09**, por decisão da dona,
e junto foi um defeito de dados que o nome escondia. No vanilla o payload mandava
`label: opts.triggerLabel`, e `triggerLabel` vinha de
`t('demonstration.labels.triggerLabel')`: **texto traduzido**, em cinco pontos —
o mesmo evento virava três valores no GA4, um por idioma, e a série não juntava.

O `i18n_text_in_payload` não pegava porque lê a chamada de tradução DENTRO do
payload e é cego a indireção de uma variável; o ponto cego já estava documentado
no `audit.mjs`, e este foi o caso que mostrou o que ele custa. A correção deu à
factory um `demoId` estável por demo (`default`, `basic`, `destructive`,
`with-form`, `do-dont-pair1-do`…) e um `actionId` para o `action_label`. Medida a
extensão do mesmo defeito nas cinco stacks: 8 pontos, em 2 arquivos — este e o
`CardDocs.tsx` do React, corrigido junto.

## 10. Reconstruir do zero

Ordem: folha → primitivo → cabeçalho, corpo e rodapé → botão de fechar → stories
→ docs page.

- **O rodapé precisa das margens negativas** (D2). Sem elas ele não é a aresta do
  painel, e o raio passa a ser outro problema.
- **O raio muda por consulta de mídia** (D3), então cabeçalho e rodapé são
  sub-componentes com eixo de layout, e o raio não é coberto por eixo nenhum.
- **As keyframes moram nesta folha** e o AlertDialog as consome — mover ou
  renomear quebra o irmão.
- **`translate`, nunca `transform`** para centralizar: as duas propriedades
  COMPÕEM em vez de uma vencer, e é isso que o `command` explora para reposicionar
  a paleta.
- **No vanilla, o ícone de fechar é montado nó a nó** (`createElementNS`), e não
  por `innerHTML` com a string do SVG: é a regra de XSS da casa
  (`09-seguranca-xss.md`, portão que varre `.innerHTML =` no vanilla), e o que
  a protege é o dia em que o ícone vier do conteúdo em vez de um literal. Nas
  outras quatro o ícone vem do `lucide`, e a pergunta não se coloca.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, rodapé, raio, rolagem | `docs/shared/styles/nds/dialog.css` |
| texto, props, critérios de teste | `docs/shared/content/dialog/translations.json` |
| regras globais da família | `docs/shared/guidelines/18-overlay.md` |
| desenho e anotações | Figma, página `Dialog` (componente `692:53`) |
| portões determinísticos | `node scripts/audit.mjs dialog --json` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 57 chaves `nav` saíram do conteúdo em 2026-09-12.** O menu deste slug
dizia "Estados" no react, no vanilla e no angular e "Configurações" no vue e no
svelte, que liam o conteúdo — cinco rótulos divergentes contando `nav.usage`
nos dois idiomas estrangeiros. O título da seção continua vindo do conteúdo.

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas — e desde a mesma
data o TÍTULO da seção é a mesma frase, derivada do mesmo lugar. A linha abaixo
registra por quê. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

**As 48 chaves de título de seção saíram do conteúdo em 2026-09-12**, e
**21 delas diziam palavra diferente da do item de menu que salta para a
seção** — "Quando e Como Usar" contra "Quando Usar", "Design Tokens" contra
"Tokens", "Componentes Relacionados" contra "Relacionados". Aqui isso inclui "Configurações" no lugar de "Estados" e "Composições Disponíveis" numa seção cujo menu dizia outra palavra. O `h2` agora
nasce do id que a própria seção declara, então divergir deixou de ser possível
em vez de passar a ser proibido. Portões: `titulo_de_secao_no_conteudo`,
`titulo_de_secao_pedido_ao_conteudo` e `titulo_passado_ao_container` — o
terceiro existe porque no Angular um `[title]` esquecido **não** reprova no
`ngc` (é atributo global do HTML) e viraria tooltip silencioso no cabeçalho.


