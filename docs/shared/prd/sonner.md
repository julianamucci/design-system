# PRD — Sonner (Toast)

> **Estado descrito**: 2026-09-13, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui é o que as cinco stacks FAZEM hoje, medido arquivo por arquivo,
> e não o que elas deveriam fazer. Se uma linha divergir do código, o defeito é
> dela — corrija aqui, nunca o código para bater com o texto.

**Este é o componente mais divergente da categoria**, e o documento existe
principalmente por causa disso. Cada stack usa uma implementação de origem
diferente, o nome do componente muda de stack para stack, e a folha
compartilhada que deveria uni-las só é lida por duas das cinco. A §7 e a §8 são
as seções que carregam o produto principal.

## 1. Identidade

Notificação **temporária e não bloqueante**, disparada por uma **função** de
qualquer lugar do código, que aparece numa região fixa da tela, é anunciada ao
leitor sem interromper a leitura em curso e sai sozinha quando o prazo vence.

É o único componente do design system que não se instancia onde aparece: quem o
usa chama `toast(...)` no lugar em que a operação termina, e a região que o
desenha vive uma vez só, na raiz da aplicação. Duas peças, em dois lugares.

O que o separa dos vizinhos, em uma linha cada:

| vizinho | diferença que decide |
|---|---|
| Alert | fica no fluxo da página e **espera** — não tem prazo, e some só por decisão de quem lê |
| AlertDialog | interrompe e exige decisão; o toast não pode ser respondido |
| Dialog | é chamado para ser lido; o toast é lido se der tempo |
| Tooltip | descreve um elemento sob o ponteiro; o toast descreve um EVENTO que já aconteceu |
| Progress | mostra o andamento continuamente; o toast mostra começo e fim (`toast.promise`) |

A pergunta que decide entre Alert e Toast: **se a pessoa não vir isto, algo se
perde?** Se sim, é Alert. O toast é para o que já aconteceu e não precisa de
resposta.

### 1.1 O nome, que também diverge

Medido em 2026-09-13, nos cinco arquivos `guidelines/07-feedback-components.md`:

| stack | cabeçalho da guideline | peça no código |
|---|---|---|
| react | `## Sonner` | `Toaster` |
| vue | `## Sonner` | `Toaster` |
| svelte | `## Sonner (Toast)` | `Toaster` |
| vanilla | `## Toast` | `createSonnerToaster` + `toast` |
| angular | `## Toaster` | `NdsToaster` + `toast` |

Três nomes para um componente, em cinco documentos que ninguém lê lado a lado.
O que JÁ é igual nas cinco é o que o leitor vê no Storybook: o título da story é
`Components/Feedback/Sonner` nas cinco, e `title` no conteúdo compartilhado é
`"Sonner"`. "Sonner" é o nome da lib do React, não uma palavra do design system —
e no vanilla e no angular não há lib nenhuma para dar nome.

Isto é decisão da dona e está registrado como pendência no fim deste arquivo.

## 2. Contrato de comportamento

Cada linha é verificável. A coluna do portão diz quem reprova se ela deixar de
valer — e `—` é dívida declarada, não ausência de risco.

| # | o contrato | portão |
|---|---|---|
| C1 | `toast(mensagem)` desenha a notificação na região em vigor | play de `Playground`, nas cinco |
| C2 | A notificação sai sozinha quando o prazo vence, sem ninguém fechá-la | `testes.functional.item2` (story `AutoDismiss`) |
| C3 | Ponteiro ou foco dentro da região CONGELA o prazo de todas; sair retoma o restante | story `PauseOnHover`, nas cinco |
| C4 | Notificação nova não cobre a anterior — a pilha é coluna com espaço, medida por retângulo | story `Stacked`, nas cinco |
| C5 | `duration: Infinity` fica até alguém fechar | `testes.functional.item6` |
| C6 | `loading` nasce SEM prazo — quem o encerra é a operação | story `Loading`, nas cinco |
| C7 | `toast.promise` troca tipo e texto NO MESMO NÓ do DOM | `testes.functional.item3` e `item4` (`PromiseResolved`, `PromiseRejected`) |
| C8 | A região tem nome acessível e é alcançável a qualquer momento, não só no instante do anúncio | play de `Playground`, nas cinco |
| C9 | A notificação é MENSAGEM DE ESTADO: anunciada em `polite`, nunca `assertive` | `testes.accessibility.item1` — asserção de ausência de `assertive` nas cinco |
| C10 | O ícone é decorativo (`aria-hidden`) — o tipo e o título já dizem o estado | `testes.accessibility.item3` |
| C11 | O botão de ação é `<button>` de verdade, alcançável por `Tab` enquanto a notificação existe | `testes.functional.item5` + `accessibility.item2` |
| C12 | Acionar a ação FECHA a notificação na hora — ela existia para oferecê-la | play de `WithAction`, nas cinco |
| C13 | A posição é da REGIÃO, não da notificação | story `PositionBottomCenter` — atributo **e** geometria |
| C14 | Sem violação de axe no estado padrão | `testes.accessibility.item4` (addon-a11y) — **com duas regras desligadas no react**, ver D12 |
| C15 | `toast()` sem região montada não estoura | `testes.functional.item7` em react, vue, svelte, angular — **exceção declarada no vanilla**, ver D8 |
| C16 | O movimento para sob `prefers-reduced-motion` | — duas guardas diferentes, nenhum portão; ver §8 |
| C17 | `Escape` fecha a notificação que está com o foco dentro | — **só vale no vanilla e no angular**; ver D11 |

**C15 é o único contrato com exceção declarada**, e ela está no lugar certo:
`sonner-states.stories.ts` do vanilla usa `coversNotApplicable` com o motivo
escrito, em vez de simplesmente não citar a chave. O motivo é que ali o estado
"sem Toaster no root" **não existe** — ver D8.

**C17 é o único contrato que a maioria não cumpre**, e por isso está na tabela
com `—`: escrevê-lo como contrato geral seria afirmar o que três stacks não
fazem.

## 3. Decisões fixadas

A tabela existe para que reverter custe uma leitura. Reverter é permitido; fazer
sem saber, não.

Nenhuma destas decisões tinha casa antes deste arquivo: todas foram extraídas de
docblock, de comentário de folha, de `PATCHES.md` ou medidas no código em
2026-09-13. Onde não há data registrada na fonte, a linha diz isso.

### D1 · Cinco implementações, quatro origens — e é deliberado

**Estado**, medido em 2026-09-13:

| stack | origem | o que o design system escreve |
|---|---|---|
| react | `sonner@^2.0.7` | wrapper `Toaster` — ícones, rótulos pt-BR, quatro custom properties |
| vue | `vue-sonner@^2.0.9` (+ patch) | wrapper `Sonner.vue` — o mesmo, mais o `import 'vue-sonner/style.css'` |
| svelte | `svelte-sonner@1.2.1` (pino exato, + patch) | wrapper `sonner.svelte` — o mesmo |
| vanilla | **nenhuma** | a fila inteira, à mão, em `toast-utils.ts` (429 linhas) |
| angular | **nenhuma** | a fila inteira, à mão, em `ui/sonner.ts` (506 linhas) |

**Por que não há lib no angular**: não existe port de `sonner` para Angular, e o
`@radix-ng/primitives` — que é a lib primitiva desta stack — não tem toast. A
alternativa era não ter o componente.

**A consequência é o eixo desta página inteira**: a folha compartilhada
`docs/shared/styles/nds/sonner.css` desenha `.nds-sonner`, e **só vanilla e
angular produzem esse markup**. Nas três stacks de lib o markup é da lib
(`[data-sonner-toast]`, `[data-title]`, `[data-button]`, `[data-close-button]`) e
quem desenha é a folha da lib. Isto está escrito no docblock de
`sonner.fixtures.ts` do react e é tratado ali como divergência REGISTRADA, não a
corrigir — e está certo, porque é forma de lib. O que não está registrado em
lugar nenhum é o **tamanho** da consequência, medido abaixo em D10, em §5 e em §8.

**O único pedaço da folha compartilhada que atravessa as cinco** é a regra
`svg.nds-sonner-icon` / `.nds-sonner-icon > svg` (16×16) e a animação
`.nds-sonner-icon-spin`: os três wrappers passam essas classes para os ícones que
injetam na lib. Nada mais de `sonner.css` alcança react, vue e svelte.

### D2 · Os rótulos são pt-BR, e sobrepõem os da lib

**Estado**: `REGION_LABEL = 'Notificações'` e `CLOSE_LABEL = 'Fechar notificação'`
nas cinco stacks, com o mesmo motivo escrito em cinco docblocks: os defaults da
lib (`"Notifications"`, `"Close toast"`) chegariam à tela em inglês.

**Onde cada um mora**, e a diferença não é arrumação:

| stack | onde |
|---|---|
| react | exportados de `ui/sonner.tsx`, junto do componente |
| vue | exportados de `ui/sonner/index.ts` (não do `.vue`) |
| svelte | arquivo próprio `ui/sonner/labels.ts` — **com o motivo escrito**: as stories precisam do valor para afirmar sobre ele, e importar de um `.svelte` arrastaria o runtime do componente para o arquivo de teste |
| vanilla | exportados de `toast-utils.ts`, reexportado por `ui/sonner.ts` |
| angular | **não são constantes** — são `input()` com default literal (`label`, `closeLabel`) |

**No angular os dois rótulos são configuráveis por atributo e no vanilla também**
(`'aria-label'` e `closeLabel` em `ToasterOptions`); nas três de lib entram por
`containerAriaLabel` e `toastOptions.closeButtonAriaLabel`.

**E nas três de lib o nome acessível da região NÃO é só o rótulo.** Medido em
2026-09-13 dentro das três libs: o nome é `` `${containerAriaLabel} ${hotkeyLabel}` ``,
e `hotkeyLabel` sai do `hotkey` default `['altKey','KeyT']` → `altKey+T`. O leitor
de tela lê **"Notificações altKey+T"**. É por isso que a play do react compara por
prefixo (`toContain`) em vez de igualdade, e é uma string técnica em inglês
chegando à tela — o que a regra de "wording em português comum" proíbe. Vanilla e
angular não têm atalho e o nome é exatamente `Notificações`.

### D3 · `toastOptions` é MESCLADO, não substituído

**Fixada** nas três stacks de lib, com o mesmo comentário nos três arquivos:
passar só `classNames`/`classes` **não pode apagar** o rótulo do botão de fechar.

**A ordem importa e está escrita**: em `ui/sonner.tsx` do react o comentário
registra que `containerAriaLabel` e `toastOptions` entram DEPOIS do spread de
`props`, porque quem consome precisa poder sobrepô-los — dois Toasters na mesma
tela exigem nomes distintos.

**No svelte a ordem é a inversa**, medido em 2026-09-13: `{...restProps}` vem
**depois** de `containerAriaLabel` e `{toastOptions}` no `<Sonner>`. Em Svelte o
último spread vence, então ali um `toastOptions` de quem consome SUBSTITUI o
mesclado — que é exatamente o que os três comentários dizem que não pode
acontecer. Está na lista de inconsistências.

### D4 · O prazo congela no ponteiro E no foco (WCAG 2.2.1)

**Estado**: nas cinco. O motivo está escrito por extenso nos dois arquivos
escritos à mão, com a mesma frase: *"uma notificação que some no meio da leitura
é conteúdo que existiu e não pôde ser consumido — e quem lê devagar, ou navega
por teclado, é justamente quem mais perde"*.

**Quem faz o quê**: nas três de lib é comportamento da lib (`onMouseEnter` /
`onFocus` no `<ol>`). No vanilla são quatro ouvintes na região
(`mouseenter`/`mouseleave`/`focusin`/`focusout`) e uma variável de módulo
`paused`; no angular são quatro host bindings e a mesma variável. A pausa é
GLOBAL nos dois: entrar em uma notificação congela a fila inteira, e isso é
correto — a pessoa está lendo a pilha, não um item.

**Detalhe que custa caro se for refeito**: o cronômetro guarda `restante` e
`retomadoEm` FORA do signal/estado reativo, com o motivo escrito nos dois
arquivos — `restante` muda a cada pausa e não tem nada a dizer ao template.

### D5 · `loading` nasce sem prazo

**Estado**: `opts.duration ?? (type === 'loading' ? Infinity : default)` nos dois
arquivos escritos à mão, com o comentário *"quem o encerra é a operação que o
originou"*. Nas três de lib é o mesmo comportamento, vindo da lib.

**E `setTimeout(fn, Infinity)` NÃO é "nunca"** — o comentário em
`toast-utils.ts` registra a medição: o delay é convertido para inteiro de 32 bits
e vira 0, então a notificação persistente sumia no quadro seguinte. O guarda
`Number.isFinite` é o que faz `duration: Infinity` valer de verdade. O angular
carrega o mesmo guarda em `startTimer`.

### D6 · `toast.promise` troca o tipo NO MESMO NÓ

**Estado**: nas cinco. O motivo está escrito nos dois arquivos à mão e vale para
as três de lib: *"trocar o nó faria o leitor de tela anunciar duas notificações
para um evento só"*.

**E `promise` não devolve nada e não repropaga a rejeição**, com o motivo escrito:
quem chamou já tem a promessa original para tratar o erro, e devolver uma
promessa que rejeita transformaria toda chamada sem `catch` numa rejeição não
tratada — ruído de console nascido da própria camada de notificação.

### D7 · Dois quadros para a entrada ser TRANSIÇÃO

**Estado**: vanilla e angular criam a notificação com `data-visible="false"` e só
no `requestAnimationFrame` seguinte a viram para `true`. O comentário registra as
duas razões: sem isso a notificação aparece seca, e os testes que medem opacidade
não teriam como distinguir "ainda entrando" de "assentada".

**Nas três de lib o atributo equivalente é `data-mounted`**, e é esse que os
fixtures esperam. **`data-visible` existe nas duas famílias com significados
DIFERENTES**, medido em 2026-09-13:

| markup | `data-visible` significa |
|---|---|
| `.nds-sonner` (vanilla, angular) | terminou a transição de entrada |
| `[data-sonner-toast]` (libs) | está dentro da janela de 3 visíveis (`index + 1 <= visibleToasts`) |

Duas semânticas com um nome só, nos mesmos cinco arquivos de story. Nenhum
portão vê isso.

### D8 · `toast()` sem região montada: dois contratos, e é decisão

**Estado**, medido em 2026-09-13:

| stacks | o que acontece |
|---|---|
| react, vue, svelte, angular | nada é desenhado, e nada estoura. A fila existe; ninguém a renderiza |
| vanilla | a fila **monta a própria região** e desenha assim mesmo |

No angular o docblock diz isto com todas as letras: *"o Toaster é quem desenha; a
fila existe mesmo sem ele, e é por isso que `toast()` sem Toaster no root não
estoura"*. No vanilla o docblock de `ensureContainer` diz o oposto e também com
motivo: *"é o contrato desta stack, e o que permite chamá-lo de um `catch` numa
tela que ainda não montou nada"*.

**A divergência é registrada, não corrigida** — e a forma está certa: a story
`WithoutToaster` do vanilla declara `coversNotApplicable` para
`functional.item7` com o motivo. O que o vanilla acrescenta é um detalhe honesto:
região criada sob demanda **sai junto com a última notificação**, e região
montada por quem consome **fica**, porque é marco de navegação alcançável com a
fila vazia.

**Consequência de acessibilidade não registrada em lugar nenhum**: no vanilla a
região viva nasce no mesmo instante do conteúdo dela. Ver §8.

### D9 · A elevação é `xl`, e o motivo é de camada

**Fixada em** 2026-09-10, em `04-padroes-design-sistema.md` §Qual degrau, por
decisão da dona. `box-shadow: var(--elevation-xl)` em `sonner.css:56`.

**O motivo escrito**: pela interação o toast não caberia com clareza em nenhum dos
dois degraus flutuantes — não prende foco, mas carrega ação. O que decide é a
pilha: `--z-toast` (1080) fica acima de `--z-modal` (1050), então o toast aparece
por cima de um diálogo aberto e é a superfície mais alta da tela.

Portão: `elevacao_fora_do_mapa`. **Ele só alcança a folha compartilhada**, ou
seja duas das cinco: a sombra das três stacks de lib é a da lib, e não lê degrau
nenhum do design system.

### D10 · 24×24 é PISO, e o piso alcança duas stacks

**Fixada** na folha compartilhada, sem data no arquivo; a medição está escrita por
extenso em `sonner.css:144-158`. Os dois botões da notificação tinham
`padding: 0`: o de ação ficava com ≈21px de altura e o de fechar com 14×14 —
abaixo dos 24×24 da WCAG 2.5.8. O comentário registra por que este é o pior lugar
possível para um alvo pequeno: *"a notificação some sozinha, então quem erra o
clique não ganha segunda chance, e 'Desfazer' costuma ser a única forma de
reverter o que acabou de acontecer"*.

**A forma da correção é decisão**: `min-block-size`/`min-inline-size` e não
`height`/`width`, porque 24px é piso — o rótulo continua mandando na altura quando
a pessoa aumenta a fonte do navegador (guideline 12, WCAG 1.4.4).

**E o comentário diz "nas cinco stacks", mas o conserto chega em duas.** Medido
em 2026-09-13 na folha da lib: `[data-close-button]` tem `height: 20px; width: 20px`
e `[data-button]` tem `height: 24px` **fixo** — o primeiro abaixo do piso da
WCAG 2.5.8, o segundo com altura fixa, que é justamente o que a regra da casa
proíbe em interativo. Nenhuma das duas regras é nossa e nenhuma é alcançável de
onde a folha compartilhada está.

A mesma folha acrescentou `:focus-visible` aos dois botões, com o motivo escrito
(*"numa torrada isso é mais grave que de costume: ela precisa ser alcançável por
teclado enquanto está na tela"*) — e o anel também chega em duas das cinco.

### D11 · O `<li>` da lib sai da ordem de tabulação (patch)

**Fixada em** 2026-06-06. Dois patches, um por stack:

| arquivo | o que muda |
|---|---|
| `nortear-design-system-vue/patches/vue-sonner+2.0.9.patch` | `tabindex: "0"` → `"-1"` no `<li>` do toast |
| `nortear-design-system-svelte/patches/svelte-sonner+1.2.1.patch` | `tabindex={0}` → `{-1}` no `<li>` |

**Motivo, escrito em `PATCHES.md`**: o `<li>` já carrega `aria-live`/`aria-atomic`
— o canal para a tecnologia assistiva está correto —, então `tabindex=0` o torna
uma parada de Tab sem ação nenhuma, e cria `nested-interactive` com o botão de
fechar interativo dentro. **Verificação após bump**: as stories `ui-sonner-*` não
devem reportar `nested-interactive`.

**Upstream ainda aberto** em `emilkowalski/sonner` nas duas entradas.

**O react NÃO tem esse patch, e não precisa**: medido em 2026-09-13 no
`sonner@2.0.7`, o `<li>` daquela lib não recebe `tabindex`, `role="status"` nem
`aria-live` — quem carrega a região viva é o `<section>` de cima. São libs
irmãs com árvores diferentes.

**Efeito colateral do patch, que é o que sobra do C17**: com `tabindex="-1"` o
`<li>` não recebe foco, e o `Escape` das três libs não fecha notificação nenhuma.
Medido na fonte do `sonner`: o único tratamento de `Escape` é
`setExpanded(false)` quando o foco está dentro da lista — ou seja, **colapsa a
pilha**, não dispensa. Vanilla e angular implementaram o fechamento por `Escape`
à mão, com o motivo escrito nos dois: *"quem chegou até o botão de ação por
teclado precisa de uma saída que não seja o mouse — e sair pelo lado (Tab até o
fim) deixaria a notificação ocupando a tela"*.

**No angular o id vem da POSIÇÃO na lista, e isso é decisão escrita**: `data-slot`
e afins são o contrato de markup que as cinco stacks comparam, e um
`data-toast-id` só daquela stack quebraria a comparação.

### D12 · Duas regras de axe desligadas, no react e só no react

**Fixada em** 2026-04-28 (`PATCHES.md#sonner-rich-colors-contrast`).
`color-contrast` e `aria-prohibited-attr` desligadas no `meta.parameters.a11y` das
stories do react.

**Motivo escrito**: `richColors` aplica paletas semi-transparentes definidas pela
própria lib, com valores RGBA fora do controle dos tokens; e o toast da lib usa
`<div data-title aria-label>` sem papel explícito.

**Duas coisas a corrigir no registro**, medidas em 2026-09-13:

1. **O `PATCHES.md` nomeia arquivos que não existem** —
   `sonner-tipos.stories.tsx` e `sonner-composicoes.stories.tsx`. Os nomes de
   hoje são `sonner-types.stories.tsx` e `sonner-compositions.stories.tsx`, e a
   exceção **não está neles**: ela está no `meta` de `sonner.stories.tsx`, uma
   vez, e os outros três arquivos de story do react têm `meta` próprio.
2. **Vue e svelte rodam a MESMA lib de origem, com as mesmas paletas RGBA, e não
   desligam nada.** Ou a exceção é desnecessária no react, ou está faltando nas
   outras duas. Nenhuma das duas leituras está escrita.

### D13 · Os ícones são os mesmos cinco, por três caminhos

**Estado**: `success` (círculo com tique), `error` (círculo com X), `warning`
(triângulo), `info` (círculo com i), `loading` (arco que gira). O tipo `default`
**não tem ícone** nas cinco.

| stack | caminho |
|---|---|
| react | componentes `lucide-react` passados na prop `icons` do Toaster |
| vue | componentes `lucide-vue-next` em slots (`#success-icon`…) — mais um `#close-icon`, que só o vue passa |
| svelte | componentes `@lucide/svelte` em snippets |
| angular | nós do pacote `lucide` (agnóstico de framework), montados por `createElementNS` num `effect` |
| vanilla | string de SVG escrita à mão, com `DOMPurify.sanitize()` no call site |

**No angular a escolha do pacote é decisão escrita**: `lucide-angular` declara peer
`@angular/core: 13.x - 21.x` e conflita com o Angular 22. E o docblock registra
que os nós escolhidos são EXATAMENTE os que o vanilla desenha à mão — mesma
silhueta nas cinco, sem redesenhar nada.

**E o `createElementNS` tem dois motivos escritos**: cada ícone do lucide é uma
lista `[tag, attrs]` com tag variável (`path`/`circle`), e template Angular exige
tag estática; construir nós também é imune a XSS, porque não há `innerHTML` no
caminho.

**Um detalhe de histórico que a folha guarda**: o comentário de `toast-utils.ts`
registra que a rotação vive em `.nds-sonner-icon-spin`, no wrapper, e que a antiga
classe `ds-toast-spin` tinha prefixo de antes da migração `.nds-*` e não existia
em CSS nenhum — **o ícone nunca girou**.

### D14 · A docs page do vanilla desenha um espécime PARADO, e ele não é anunciado

**Fixada** em `SonnerDocs.ts` do vanilla, com o motivo escrito: os previews de
Do/Don't e de Tipos mostram a notificação parada, e não um botão que a dispara —
é uma foto do componente dentro do quadro da seção. A fila real é portalizada e
posicionada na tela inteira, e não caberia num quadro.

**E o espécime nasce sem `role="status"` e sem `aria-live`**, também com motivo
escrito: *"isto é uma ilustração dentro da página, não uma notificação que acabou
de acontecer. Anunciá-la faria o leitor de tela ler quatro avisos ao abrir a
documentação"*.

**Histórico que o comentário guarda**: a versão anterior desenhava classes de uma
era anterior à migração (`bg-green-50`, `text-green-800`) que não existem em CSS
nenhum, então o espécime mostrava um retângulo branco — a documentação divergia
do componente sem ninguém ver.

**O custo é duplicação medida**: `SonnerDocs.ts` do vanilla carrega a própria
tabela `TOAST_ICONS` com as mesmas cinco strings de SVG de `toast-utils.ts`.

### D15 · O angular esvazia a fila ao destruir a região

**Fixada** em `ngOnDestroy` de `NdsToaster`, com o motivo escrito: *"sem isto a
fila sobrevive à troca de story/rota e o próximo Toaster nasce desenhando
notificação de outra tela — com o cronômetro dela já vencido"*. `drain()` também
devolve `currentDefaultDuration` ao default do sistema.

**O vanilla tem o equivalente parcial**: região criada sob demanda é removida
quando a última notificação sai, e `defaults` volta ao do sistema. Região montada
por quem consome não tem gancho de destruição — não há `unmount`.

### D16 · O default de prazo em vigor vem da REGIÃO montada

**Estado**: nas cinco. Nos dois arquivos à mão é uma variável de módulo
(`currentDefaultDuration` no angular, `defaults.duration` no vanilla) escrita
pela região; nas três de lib é a prop `duration` do Toaster.

**No angular isto é um `effect` e não o construtor**, com o motivo escrito: ler
`this.duration()` no corpo do construtor devolveria o default declarado ali, nunca
o `[duration]` de quem consome — e o efeito ainda ganha o caso reativo, em que
mudar o control no painel passa a valer para a próxima notificação.

**É também o caminho que a suíte usa** para encurtar o relógio sem depender do
tempo real, e o comentário está nas cinco stories de `Playground`.

## 4. Anatomia

**Duas árvores, e é isso que o componente é.** A primeira é o que o design system
define; a segunda é o que três das cinco stacks entregam.

### 4.1 O markup do design system — vanilla e angular

```
toaster                          .nds-toaster · role="region" · aria-label · data-position
└── toast                        .nds-sonner · role="status" · aria-live="polite" · data-type · data-visible
    ├── toast-icon               span (ou svg no angular) · aria-hidden · ausente no tipo default
    ├── toast-content
    │   ├── toast-title          p · peso medium
    │   ├── toast-description    p · --muted-foreground · opcional
    │   └── toast-action         button · opcional · FECHA a notificação ao ser acionado
    └── toast-close              button · aria-label · só com closeButton
```

**O que é obrigatório**: a região e `.nds-sonner` com `.nds-sonner-content` e
`.nds-sonner-title`. Ícone, descrição, ação e fechar são opcionais, nessa ordem de
frequência.

**O botão de fechar fica FORA de `toast-content`**, irmão do ícone — os dois são
as colunas laterais do flex, e o conteúdo é a do meio, com `flex: 1`.

**`data-slot` existe em duas stacks**: `sonner-toaster` na região do vanilla e do
angular. A notificação individual não tem `data-slot` em stack nenhuma; o que ela
tem é `data-sonner-toast` (vazio), escrito pelas duas para casar com o seletor da
lib e permitir uma consulta única nas cinco.

### 4.2 O markup da lib — react, vue, svelte

```
section                          aria-live="polite" · aria-label="<rótulo> altKey+T" · tabindex="-1"
└── ol                           [data-sonner-toaster] · data-x-position · data-y-position · data-sonner-theme
    └── li                       [data-sonner-toast] · data-mounted · data-visible · data-type (ausente em default)
        ├── [data-icon]          > svg.nds-sonner-icon        ← o único ponto em que a folha compartilhada alcança
        ├── [data-content]
        │   ├── [data-title]
        │   └── [data-description]
        ├── [data-button]        botão de ação
        └── [data-close-button]  botão de fechar
```

**Três diferenças de estrutura, não de estilo**, medidas em 2026-09-13:

1. **A região viva é o `<section>`**, que persiste com a fila vazia; o `<ol>` só
   existe quando há notificação.
2. **No vue e no svelte o `<li>` TAMBÉM é região viva** — `role="status"`,
   `aria-live` e `aria-atomic="true"`, o que o patch de D11 confirma linha a
   linha. No react, não: só o `<section>`.
3. **A ordem da pilha é invertida**: a lib desenha a MAIS NOVA PRIMEIRO. Está
   escrito no docblock de `toastsOnScreen()` do react como divergência
   registrada. Vanilla e angular acrescentam ao fim.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/sonner.css`. **Válido em vanilla e angular** — ver
D1.

| propriedade | valor | token |
|---|---|---|
| largura máxima da região | 420px | **literal** (`26.25rem`) |
| largura da notificação | 100% da região | — |
| distância da borda da tela | 16px | `--spacing-4`, nas seis posições |
| gap entre notificações | 8px | `--spacing-2` |
| padding da notificação | 16px | `--spacing-4` |
| gap interno (ícone · conteúdo · fechar) | 12px | `--spacing-3` |
| superfície | — | `--background` |
| texto | — | `--foreground` |
| descrição | — | `--muted-foreground` |
| borda | 1px | `--border` |
| raio | — | `--radius` |
| sombra | — | `--elevation-xl` — ver D9 |
| camada | 1080 | `--z-toast` |
| tamanho de texto (título e descrição) | 14px | `--text-control` |
| peso do título | 500 | `--font-weight-medium` |
| margem do título | 0 | literal — o título é `<p>` e a margem de agente de usuário somaria |
| margem acima da descrição | 4px | `--spacing-1` |
| ícone | 16×16 | `--spacing-4` |
| deslocamento do ícone | 2px | `--spacing-0-5` — alinha com a primeira linha |
| piso dos dois botões | 24×24 | `--spacing-6` em `min-block-size`/`min-inline-size` — ver D10 |
| raio dos dois botões | — | `--radius-xs` |
| cor do botão de ação | — | `--primary` |
| margem acima do botão de ação | 8px | `--spacing-2` |
| ícone do fechar | 14×14 | **literal** (`0.875rem`) |
| anel de foco dos dois botões | halo 2px + anel 5px | `--popover` (halo) + `--ring` |
| transição de entrada e saída | 200ms | `--duration-base`, em `opacity` e `transform` |
| transição de cor do fechar | 120ms | `--duration-fast` |
| rotação do `loading` | 1s linear infinite | **literal** — nenhum degrau da escada serve a ciclo contínuo |

**Cores semânticas, sob `data-rich-colors="true"`**: fundo em `--<cor> / 0.1`,
borda em `--<cor> / 0.3`, ícone em `--<cor>` cheio, e o texto no par
`--<cor>-foreground`. Os quatro pares são `success`, `destructive` (para o tipo
`error`), `warning` e `info`.

**O comentário da folha registra por que o texto vai no par `-foreground` em vez
de `--foreground` direto**, e é decisão: neste projeto o par vale `--foreground`
e pinta a mesma cor, mas escrever o token é o ponto de extensão — um projeto
derivado redefine `--success-foreground` no tema e o toast acompanha. É a regra
do contêiner colorido, aplicada de forma extensível.

**`error` é o nome do tipo e `destructive` é o nome da cor.** Está comentado na
folha; é a única assimetria de nomenclatura entre tipo e token nesta folha.

### 5.1 Três coisas da folha que NÃO são lidas por ninguém

Medido em 2026-09-13:

| declaração | quem a escreve | quem a lê |
|---|---|---|
| `data-expand` na região | vanilla e angular escrevem | **nenhuma folha** — não há seletor `[data-expand]` em CSS nenhum do repositório |
| `data-rich-colors` na REGIÃO | vanilla e angular escrevem | **ninguém** — a folha só lê o atributo na notificação |
| `injectToastStyles()` | o snippet de importação do vanilla ensina a chamar | **no-op declarado**, com o motivo no docblock: os estilos vivem em `sonner.css` |

A primeira é a que mais custa: `expand` é um `input`/opção pública nas duas
stacks, documentado na tabela de props do angular como "mantém a pilha expandida
em vez de empilhada", e é **inerte**. Nas três de lib ele funciona, porque a folha
da lib lê `[data-expanded]`.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| entrando | `toast()` acabou de ser chamado | `data-visible="false"` → `true` no quadro seguinte (`data-mounted` nas libs); opacidade 0→1 e `translateY(8px)`→0 |
| assentada | a transição terminou | o estado que o axe e o Chromatic medem; é o que `waitForToast` espera |
| pausada | ponteiro ou foco dentro da região | nada muda de aparência — o cronômetro para. **Estado invisível**, e é por isso que a story o prova por tempo e não por atributo |
| saindo | prazo vencido, ação acionada, fechar clicado, `Escape` (2 de 5) ou `toast.dismiss()` | `data-visible="false"`; o nó sobrevive 200ms e só então sai |
| persistente | `duration: Infinity` | nenhum cronômetro é agendado; `Number.isFinite` é o guarda — ver D5 |
| fora da janela de visíveis | 4ª notificação em diante | **só nas três de lib**: `data-visible="false"`, com a semântica de D7 |
| recolorida | `richColors` ativo e tipo ≠ `default` | fundo, borda e ícone pelo par de tokens semânticos — §5 |

**Não há estado de foco na notificação.** O `<li>` sai da ordem de tabulação por
patch (D11) e o `.nds-sonner` nunca teve `tabindex`. Quem recebe foco são os dois
botões, e só.

## 7. API

### 7.1 O que é igual nas cinco

A superfície pública tem **duas** peças, e as duas têm o mesmo nome nas cinco:

| peça | forma |
|---|---|
| a região | um componente/diretiva/fábrica, montada UMA vez |
| a fila | a função `toast`, com métodos por tipo |

Os métodos de `toast`, idênticos nas cinco: `toast(msg, opts?)`,
`.success`, `.error`, `.warning`, `.info`, `.loading`, `.dismiss(id?)`,
`.promise(promessa, { loading, success, error }, opts?)`.

Opções por notificação, idênticas nas cinco: `description`, `duration`,
`action: { label, onClick }`, `closeButton`.

Opções da região, e o padrão declarado:

| opção | tipo | padrão declarado |
|---|---|---|
| `position` | um dos seis cantos | `top-right` |
| `richColors` | boolean | `false` |
| `expand` | boolean | `false` — **inerte em vanilla e angular**, ver §5.1 |
| `duration` | number | `4000` |
| `closeButton` | boolean | `false` |
| rótulo da região | string | `Notificações` |
| rótulo do fechar | string | `Fechar notificação` |

**Os seis cantos são os mesmos nas cinco**, na mesma ordem nos cinco `argTypes`:
`top-right`, `top-center`, `top-left`, `bottom-right`, `bottom-center`,
`bottom-left`.

**O padrão passou a `top-right` em 2026-09-13, por decisão da dona.** Até ali as
cinco stacks DECLARAVAM `bottom-right` — que é o padrão da biblioteca de origem —
enquanto toda story, toda docs page e a guideline do react chamavam `top-right` de
"padrão do projeto", e o conteúdo compartilhado mandava declarar a posição
explicitamente "porque o padrão da lib é outro". Duas verdades escritas ao mesmo
tempo, e a que o código executava era a que ninguém documentava. Agora o wrapper
de cada stack faz a ponte: trocar a biblioteca não muda onde o aviso aparece.

### 7.2 O conjunto de tipos — e ele É o mesmo, contra a expectativa

Medido em 2026-09-13 nas cinco: **seis tipos**, `default | success | error |
warning | info | loading`, com o mesmo nome, a mesma ordem nos `argTypes` e uma
story por tipo com o mesmo nome de export nas cinco (`Default`, `Success`,
`Error`, `Warning`, `Info`, `Loading`).

**Quem discorda são os documentos, não o código**:

- `variants.items` do conteúdo compartilhado lista **cinco** — falta `loading`;
- `seo.aiSummary` do mesmo arquivo diz **seis**, e nomeia os seis corretamente;
- a guideline do vanilla lista **quatro** (`default, success, error, warning`);
- a guideline do angular lista os **seis**, corretos.

Três contagens diferentes em três documentos e uma quarta no código. Ver §Lista
de inconsistências.

### 7.3 Divergências de forma, registradas e não "alinhadas"

Forma de API não tem fonte de verdade — cada lib tem a sua.

| stack | como difere |
|---|---|
| react | a região é `<Toaster>`; **`toast` vem do pacote `sonner`, não do design system** — o arquivo da casa exporta a REGIÃO, e nunca reexportou a função da fila. Rótulos por `containerAriaLabel` e `toastOptions.closeButtonAriaLabel`. Props extras da lib: `theme`, `icons`, `toastOptions`, `visibleToasts`, `hotkey`, `dismissible` |
| vue | igual ao react em forma; `toast` vem de `vue-sonner`. Os ícones entram por SLOT e há um `#close-icon` que só esta stack passa. **A folha da lib é importada pelo wrapper** (`import 'vue-sonner/style.css'`), com o motivo escrito: o pacote não a injeta em runtime, e sem a linha a região saía sem posicionamento, sem fundo e sem sombra |
| svelte | `toast` vem de `svelte-sonner`; os ícones entram por SNIPPET. O tema vem de `mode-watcher` (`mode.current`). Os rótulos moram num `.ts` à parte — ver D2 |
| vanilla | fábrica: `createSonnerToaster(options)` devolve o `HTMLElement` **já registrado como a região em vigor**, e `toast` vem de `@/components/ui/sonner`. Opções extras: `class`, `'aria-label'`, `closeLabel`, e o apelido **depreciado** `label`. Por notificação há duas opções que ninguém mais tem: `richColors` e `position` |
| angular | a região é `div[ndsToaster]` — seletor de ATRIBUTO em `div`, com o motivo escrito: o host é o elemento nativo, então o markup sai idêntico ao do vanilla e o CSS compartilhado casa sem wrapper. Rótulos por `input` (`label`, `closeLabel`). O ícone é um componente próprio, `svg[ndsToastIcon]`, com `kind` obrigatório |

**O apelido depreciado do vanilla tem asserção**, e isso é decisão de método: a
play do `Playground` afirma que `label` continua produzindo o atributo e que o
canônico `'aria-label'` vence quando os dois vêm — com o motivo escrito,
*"apagá-lo quebraria chamador em silêncio, e sem asserção a compatibilidade é
promessa, não contrato"*.

**O tema chega por três caminhos, e um deles não chega**:

| stack | de onde sai o tema da região |
|---|---|
| react | `useTheme()` do `next-themes` — **e não há `ThemeProvider` em nenhum lugar da stack**; medido em 2026-09-13, `next-themes` é importado em UM arquivo, `ui/sonner.tsx`. Sem provider o hook devolve o default `"system"`, que segue o sistema operacional e não a barra de temas do Storybook |
| svelte | `mode.current` do `mode-watcher` |
| vue | **nada** — o wrapper não passa `theme` |
| vanilla, angular | não há prop: quem recolore é a cascata dos tokens, e trocar a classe do documento basta |

A prova indireta está nas stories: a `DarkTheme` de react, vue e svelte passa
`theme="dark"` **explicitamente**, e a do vanilla e do angular não passa nada.

### 7.4 Peças, por stack

Extraído dos exports e dos seletores do código em 2026-09-13.

| stack | peças |
|---|---|
| react | `Toaster`, `REGION_LABEL`, `CLOSE_LABEL` (de `ui/sonner.tsx`) |
| vue | `Toaster`, `REGION_LABEL`, `CLOSE_LABEL` (de `ui/sonner/index.ts`) |
| svelte | `Toaster`, `REGION_LABEL`, `CLOSE_LABEL` (de `ui/sonner/index.ts` + `labels.ts`) |
| vanilla | `toast`, `createSonnerToaster`, `injectToastStyles` (no-op), `CLOSE_LABEL`, e os tipos `ToastType`/`ToastPosition`/`ToastOptions`/`SonnerToasterOptions` — todos reexportados de `toast-utils.ts` por `ui/sonner.ts` |
| angular | `NdsToaster` (`div[ndsToaster]`), `NdsToastIcon` (`svg[ndsToastIcon]`), `toast`, e os tipos `ToastType`/`ToastPosition`/`ToastAction`/`ToastOptions`/`ToastPromiseMessages`/`ToastIconKind` |

**O vanilla tem um SEGUNDO par de arquivos, e ele está órfão.** Medido em
2026-09-13: `ui/toast.ts` e `ui/toaster.ts` exportam `createToaster`,
`createToast`, `showToast` e `mountToaster`, e **ninguém os importa** — a única
referência é `toaster.ts` importando `toast.ts`. Nenhuma story, nenhuma docs
page, nenhum índice. O contrato deles divergiu:

- `ToastVariant = 'default' | 'destructive'` em vez dos seis tipos;
- `aria-label="Notifications"` e `"Close notification"` — em inglês, contra D2;
- `data-slot="toaster"` e `"toast"`, contra `sonner-toaster`;
- `aria-live="polite"` na REGIÃO **e** na notificação, mais `aria-atomic="true"`;
- botão de fechar **sempre** presente, sem opção;
- nenhum cronômetro pausável, nenhuma fila, nenhum `promise`.


> **Por que estas três subseções moram aqui e não na §5**: elas nomeiam custom
> properties e constantes DA LIB, que `sonner.css` não tem por que ler. Ficaram
> na §5 até 2026-09-13, e no dia em que a folha foi renomeada para o nome do
> componente o portão `prd_token_sem_lastro` deixou de ser inerte e acusou oito
> nomes de uma vez — corretamente. Token da folha fica na §5; parafuso de lib,
> aqui.

### 7.5 O que a lib usa no lugar de cada token

| assunto | folha compartilhada | folha da lib |
|---|---|---|
| largura | 420px máx, 100% | `TOAST_WIDTH = 356` |
| distância da borda | 16px (`--spacing-4`) | `VIEWPORT_OFFSET = 24px` (16px no mobile) |
| gap entre notificações | 8px (`--spacing-2`) | `GAP = 14` |
| raio | `--radius` | `--border-radius: 8px`, sobreposto por react e vue · **não** pelo svelte |
| superfície, texto, borda | `--background`/`--foreground`/`--border` | `--normal-bg`/`--normal-text`/`--normal-border` |
| sombra | `--elevation-xl` | a da lib |
| visíveis ao mesmo tempo | **sem limite** | `VISIBLE_TOASTS_AMOUNT = 3` |
| prazo default | 4000ms | `TOAST_LIFETIME = 4000` |
| tempo até desmontar | 200ms (`DURATION_OUTPUT`/`EXIT_DURATION`) | `TIME_BEFORE_UNMOUNT = 200` |

**Os dois números que já batem são os que importam para o comportamento** — 4000
e 200 — e batem porque as duas implementações à mão os escolheram para casar. O
comentário de `EXIT_DURATION` no angular diz isso: *"espelha a transição de saída
de `.nds-sonner` — remover antes cortaria o fade"*.

### 7.6 A ponte de tokens para a lib, e por que ela diverge em duas pontas

Os três wrappers passam custom properties por `style` inline na região. Medido em
2026-09-13 com `node scripts/tabela-tokens.mjs sonner`:

| custom property | react | vue | svelte |
|---|---|---|---|
| `--normal-bg` | `var(--popover)` | `var(--popover)` | `var(--color-popover)` |
| `--normal-text` | `var(--popover-foreground)` | `var(--popover-foreground)` | `var(--color-popover-foreground)` |
| `--normal-border` | `var(--border)` | `var(--border)` | `var(--color-border)` |
| `--border-radius` | `var(--radius)` | `var(--radius)` | **ausente** |

**Os dois prefixos não são estilo, são camadas diferentes.** Nesta casa
`--popover` é um TRIPLETO HSL (`24 100% 99.5%` no tema default), e só vira cor
dentro de `hsl()`. Quem embrulha é o alias do `@theme`:
`--color-popover: hsl(var(--popover))`, em `globals.css` do svelte. A folha da lib
faz `background: var(--normal-bg)` **direto**, sem `hsl()`.

Ou seja: o svelte entrega uma cor e as outras duas entregam um tripleto para uma
propriedade que espera cor. É o mesmo defeito de forma que a folha compartilhada
evita escrevendo `hsl(var(--background))` em toda parte.

**Está na lista de inconsistências e não afirmo aqui o efeito na tela**, porque
isso precisa de sonda em navegador — o que se mede sem navegador é que a forma do
valor não casa com o que a propriedade aceita, em duas das três stacks, e que a
story que teria visto (`DarkTheme`, com a asserção `backgroundColor !== rgba(0,0,0,0)`)
lê a notificação de índice 0, que é a mais nova, que é `info`, que tem cor
semântica própria por `richColors`. A asserção passa sem tocar no tipo `default`.

**E o `--border-radius` que falta no svelte é comparável e certo**: sem ele a
notificação do svelte fica com o raio 8px da lib, enquanto react e vue seguem
`--radius` — que vale 14px no tema default, 24px no warm e **0** no cold.

### 7.7 Os dois instrumentos de token são CEGOS para este slug

Medido em 2026-09-13, e é o achado mais silencioso desta página:

| instrumento | o que procura | o que existe |
|---|---|---|
| `prd_token_sem_lastro` em `scripts/audit.mjs` | `docs/shared/styles/nds/<slug>.css` | `sonner.css` — **não existe `sonner.css`** |
| `node scripts/tabela-tokens.mjs sonner` | seletores `.nds-sonner*` | `.nds-sonner*` |

O segundo diz isso na primeira linha da saída: `folha(s) com seletor .nds-sonner:
(nenhuma)`. O primeiro não diz nada: a condição `existsSync(folhaFile)` é falsa e
a regra sai pela porta do `if`.

**Consequência**: a tabela da §5 acima é a única parte deste documento sem portão
nenhum. Ela pode envelhecer em silêncio, que é exatamente o defeito que este
diretório existe para não ter. Está registrado como pendência no fim.

O que `tabela-tokens.mjs` **conseguiu** medir foi a §5.3, porque ali ele lê as
tabelas de token das docs pages: 16 linhas, 4 por stack, e **zero no angular** —
as quatro chaves `tokens.*.normal*` não resolvem naquela stack.

## 8. Acessibilidade

### 8.1 A fiação viva, que é o ponto mais divergente do componente

Medido em 2026-09-13 na fonte de cada lib e no código das duas stacks à mão:

| | react | vue | svelte | vanilla | angular |
|---|---|---|---|---|---|
| região é elemento persistente? | sim (`<section>`) | sim | sim | **não** quando criada sob demanda | sim, enquanto montada |
| `aria-live` na região | `polite` | `polite` | `polite` | **ausente** | **ausente** |
| `aria-relevant` na região | `additions text` | `additions text` | `additions text` | — | — |
| `aria-atomic` na região | `false` | `false` | `false` | — | — |
| `role`/`aria-live` na notificação | **ausentes** | **ausentes** | só `polite`, sem `role` | `status` + `polite` | `status` + `polite` |
| `aria-atomic` na notificação | — | — | `true` | **ausente** | **ausente** |
| notificação na ordem de tabulação | **SIM** (`tabIndex: 0`, sem patch) | não (patch D11) | não (patch D11) | não | não |

**Três linhas desta tabela estavam erradas, e a correção veio de reler a fonte
INSTALADA de cada lib em 2026-09-13** — não a documentação delas, que é onde a
versão anterior se apoiou:

- **vue-sonner 2.0.9 não escreve `aria-live` nem `role` na notificação.** A tabela
  dizia `status` + `polite` + `aria-atomic="true"`, e o `<li>` sai só com
  `tabindex` (do patch) e cerca de vinte `data-*`. Não há aninhamento no Vue.
- **svelte-sonner 1.2.1 não escreve `role` em lugar nenhum** — a notificação leva
  só `aria-live`, e é a ÚNICA das três libs em que a região e a notificação são
  as duas regiões vivas.
- **No react a notificação ESTÁ na ordem de tabulação**: `tabIndex: 0` no `<li>`
  (`sonner/dist/index.mjs`, no `createElement("li", …)`), sem patch. É exatamente
  o defeito que o Vue e o Svelte corrigiram com patch (D11) — torrada que some
  sozinha não deveria ser parada de teclado —, e a linha antiga afirmava o
  contrário para as cinco.

**Dois padrões de anúncio, e um aninhamento.** No react e no vue o `aria-live`
está só na região; no svelte ele está na região E na notificação dentro dela — duas regiões vivas encaixadas, que é o
caminho conhecido para o mesmo texto ser anunciado duas vezes. Nenhum documento
desta casa registra isso, e nenhum portão o vê: `aria-live` aninhado não é
violação de axe.

**E no vanilla e no angular a região não é viva — a notificação é.** O padrão
confiável é o oposto: o elemento com `aria-live` precisa existir ANTES de o
conteúdo mudar, para a tecnologia assistiva já estar observando. No vanilla é
pior que no angular, porque ali a região criada sob demanda **nasce no mesmo
instante da notificação** e é removida com ela. A story que "prova" o anúncio
(`accessibility.item1`) afirma que os atributos estão nos elementos certos, não
que o anúncio aconteceu — e o critério de teste do conteúdo compartilhado diz
isso com honestidade: *"Teste manual com NVDA/VoiceOver"*.

A maioria (3 de 5) põe a região viva no elemento persistente. Nas duas stacks à
mão, que são as que o design system controla inteiramente, ela não está lá.

### 8.2 Teclado

| tecla | o que faz | onde |
|---|---|---|
| `Tab` | leva o foco ao botão de ação e ao de fechar, enquanto a notificação existe | nas cinco |
| `Enter`/`Espaço` | aciona o botão em foco | nas cinco |
| `Escape` | fecha a notificação com o foco dentro | **vanilla e angular** |
| `Escape` | COLAPSA a pilha expandida | **react, vue, svelte** (comportamento da lib) |
| `Alt`+`T` | expande a pilha e põe o foco nela | **react, vue, svelte** (`hotkey` default da lib) |

**A notificação em si nunca é alvo de Tab**, e isso é decisão com patch (D11).

**O atalho `Alt`+`T` não é escolha desta casa** e não está documentado em lugar
nenhum — e é ele que vaza a string `altKey+T` para o nome acessível da região
(D2).

### 8.3 O que NÃO se faz, de propósito

- **nunca `assertive`, nunca `role="alert"`** no caso comum. O motivo está escrito
  no docblock do angular: *"interromper a leitura em curso para avisar que algo
  deu certo é hostil, e o critério 4.1.3 pede mensagem de estado, não alerta"*. A
  play de cada stack afirma a AUSÊNCIA de `assertive`, não só a presença de
  `polite` — que é o que impede o default da lib de mudar em silêncio;
- **não se anuncia o ícone.** `aria-hidden` nas cinco, com o motivo escrito nos
  dois arquivos à mão: anunciá-lo faria o leitor de tela ler "imagem" antes de
  cada notificação;
- **não se captura foco.** A notificação é não bloqueante, e roubar o foco de
  quem está digitando é pior que a notificação;
- **não se usa toast para erro que bloqueia nem para erro de campo.** É regra de
  conteúdo, repetida em cinco lugares (`usage`, `doDont`, `notes`, e as cinco
  guidelines), e é o que separa este componente do Alert e do FormMessage.

**Um ponto que as três libs entregam e o design system NÃO alcança**: o
`assertive` existe como caminho nas libs — `aria-live={toast.important ?
'assertive' : 'polite'}` no `<li>` do vue e do svelte. O flag `important` não é
exposto por nenhum wrapper desta casa, então o caminho está lá e ninguém o abre.
Vanilla e angular não têm equivalente.

### 8.4 Movimento reduzido

**Duas guardas diferentes, e as duas vencem.**

| markup | quem para | como |
|---|---|---|
| `.nds-sonner` | `sonner.css:231-238` | `transition: none; animation: none` em `.nds-sonner`, `.nds-sonner-close` e `.nds-sonner-icon-spin` |
| `[data-sonner-toast]` | a folha da lib | `transition: none !important; animation: none !important` em `[data-sonner-toast]`, `[data-sonner-toast] > *` e `.sonner-loading-bar` |

**A guarda da folha compartilhada vence por ORDEM, não por especificidade** — os
seletores são (0,1,0) nos dois lados, e `@media` não acrescenta especificidade. O
bloco está no FIM do arquivo, depois das declarações que desliga, que é a forma
correta e está documentada por extenso em `utilities.css`: a primeira tentativa
naquela folha acrescentou classes a um bloco de cima e ficou **inerte**.

**As transições de 200ms também parariam sozinhas**, porque saem de
`var(--duration-base)` e `motion.css` zera a escada inteira sob a preferência. A
guarda existe pela ÚNICA declaração que não sai da escada: o `1s linear infinite`
da rotação. `animation: none` e não duração zero — com `infinite`, duração zero
reinicia o ciclo sem parar.

**A guarda da lib usa `@media (prefers-reduced-motion)` sem o `: reduce`**, que
casa com qualquer valor da consulta. É mais amplo que o nosso e, na prática,
equivalente — os valores possíveis são `no-preference` e `reduce`, e
`no-preference` não casa em consulta booleana. Registrado para que uma auditoria
cross-stack não o "alinhe".

## 9. Analytics

Dois eventos, tipados nas cinco `src/lib/analytics.ts`:

| evento | quando | payload |
|---|---|---|
| `toast_demo_triggered` | quem lê a docs page aperta um gatilho da demonstração | `{ toast_type, locale }` |
| `toast_action_click` | clique no botão de ação DENTRO da notificação | `{ label, component: "toast", location }` |

**`component: "toast"`** — uma palavra, então kebab-case não se distingue; é o
único componente desta casa cujo `component` no payload **não** é o slug
(`sonner`). Registrado, não alinhado: é o nome do componente que diverge (§1.1),
e resolver aqui antes de resolver lá criaria um terceiro nome.

**`toast_demo_triggered` não tem `component`.** É o único evento de componente
desta casa sem o campo, medido em 2026-09-13 nos cinco arquivos.

### 9.1 Três divergências de payload, e uma delas fere a regra da casa

**1. O `label` do `toast_action_click` tem três valores.** Medido em 2026-09-13:

| stack | valor |
|---|---|
| react, vue, svelte | `'with-action-label'` |
| vanilla (`SonnerDocs.ts:311`) | `'with-action-label'` |
| vanilla (`SonnerDocs.ts:131`) | **`opts.actionLabel`** — o texto TRADUZIDO ("Desfazer"/"Undo"/"Deshacer") |
| angular (`SonnerDocs.ts:441`) | `'undo'`, com o comentário *"Valor estável, e não o rótulo traduzido"* |

O de `:131` é o espécime estático (D14) e é **violação direta** da regra: payload
carrega valor estável, nunca texto traduzido, porque traduzido o mesmo evento
vira três valores no GA4 e a série não junta. Está na stack de REFERÊNCIA, e no
mesmo arquivo que já faz certo trinta linhas depois. A maioria é
`'with-action-label'` (4 ocorrências contra 1 e 1).

**2. O conjunto de valores de `toast_type` tem três tamanhos.**

| stack | quantos gatilhos emitem | quais |
|---|---|---|
| react | **6** | os seis tipos |
| vue, svelte, vanilla | **10** | os seis tipos + `with-description`, `with-action`, `promise`, `persistent` |
| angular | **12** | os dez + `blocking-error` e `form-error` (os dois contraexemplos do Do/Don't) |

No react as quatro composições existem na página e disparam `toast.*` de
verdade — elas simplesmente não chamam `trackToastDemo`. A maioria é 10.

**3. O `data-track-id` dos gatilhos é `sonner:demo:<id>` nas cinco**, e este é
o campo que funciona: `docs_demo_click` sai pelo rastreador da docs page, com o
id estável. O comentário no vanilla registra que até 2026-09-10 só o react e o
svelte marcavam os botões.

### 9.2 O que a tabela de analytics do conteúdo compartilhado diz

`analytics.description` afirma: *"O toast em si não dispara evento — o evento é da
ação que o originou. Rastreie apenas o clique no botão de ação interno"*. E a
`analytics.table` lista quatro eventos: `toast_action_click`, `docs_page_view`,
`docs_section_viewed` e `language_switched`.

**`toast_demo_triggered` não está na tabela**, e dispara nas cinco. A regra da
casa cobra o sentido contrário — todo evento da tabela tem de existir tipado —,
então nada reprova um evento tipado, disparado nas cinco e ausente da tabela que
documenta a página.

### 9.3 Não há evento de fechamento, e o vocabulário de `reason` não se aplica

A pergunta foi feita e a resposta é não. O vocabulário fechado
`escape | overlay | close-button | api` é da **categoria de overlay**, e vale
para os dez componentes listados em `18-overlay.md` — Dialog, AlertDialog, Sheet,
Drawer, Popover, HoverCard, Tooltip, DropdownMenu (com ContextMenu e Menubar) e
Command. **O toast não está entre eles**, e não tem `toast_close` nenhum em stack
nenhuma.

**E se um dia tiver, três das quatro palavras não servem**: aqui não há véu para
clicar (`overlay`), o fechamento mais comum não é gesto nenhum — é o **prazo
vencendo** —, e "acionou a ação" é um desfecho que nenhuma das quatro descreve. O
vocabulário do toast, se nascer, é outro: prazo · ação · fechar · dispensa por
código. Registrado aqui para que a próxima rodada não importe as quatro palavras
por analogia.

## 10. Reconstruir do zero

Ordem: folha → fila e região da stack → ícones → rótulos pt-BR → stories →
docs page.

**A folha primeiro, e ela só serve a duas stacks.** Se a stack nova tem lib, o que
se escreve é a PONTE de tokens (§5.3) e não a folha; se não tem, `sonner.css` é o
contrato inteiro.

**Armadilha de cada stack**, todas medidas:

- **react (`sonner`)** — o `<li>` não é região viva; quem é é o `<section>` de
  cima, e é nele que a asserção de `polite` tem de ir. `toast` vem do PACOTE, não
  do arquivo da casa. A prop `theme` sai do `next-themes` e não há provider: a
  região segue o sistema operacional, não a barra de temas, e as stories passam
  `theme` à mão para compensar.
- **vue (`vue-sonner`)** — a folha da lib NÃO é injetada em runtime: sem
  `import 'vue-sonner/style.css'` a região sai como um `<ol>` cru no meio da
  página, **e nada na tela diz que faltou alguma coisa**. O `<li>` precisa do
  patch de `tabindex` (D11), e o `toastOptions` mesclado precisa vir DEPOIS do
  spread de props.
- **svelte (`svelte-sonner`)** — o patch de `tabindex` também, e o pino da versão
  é EXATO (`1.2.1`, sem `^`) porque o nome do arquivo de patch carrega a versão.
  Os tokens entram pelo alias `--color-*`, que já traz o `hsl()`; os rótulos vão
  num `.ts` à parte para as stories poderem importá-los sem arrastar o runtime.
- **angular** — sem lib: a fila inteira é de escrita própria. Três coisas que
  custaram e estão escritas no arquivo: ler `this.duration()` no construtor
  devolve o default declarado e não o do consumidor (vai num `effect`); o ícone
  precisa de `createElementNS` porque template Angular exige tag estática; e o
  `ngOnDestroy` tem de esvaziar a fila, ou a próxima região nasce desenhando
  notificação de outra tela. O seletor é atributo em `div` de propósito, para o
  markup sair igual ao do vanilla.
- **vanilla** — `setTimeout(fn, Infinity)` vira 0: sem o guarda de `isFinite` a
  notificação persistente some no quadro seguinte. A região criada sob demanda
  sai com a última notificação; a montada por quem consome fica. E há dois
  arquivos órfãos com um contrato antigo (`toast.ts`, `toaster.ts`) que não devem
  servir de modelo — ver §7.4.

**Armadilha das cinco, nas stories**: a região é `position: fixed`, e dentro do
Storybook ela vai para o canto da JANELA se o quadro da story não a prender.
Quatro das cinco prendem com `contain: layout` + `position: relative` no wrapper;
o angular não prende nada. E toda play tem de começar por `clearToasts()`, porque
a fila é global ao módulo e o painel Interactions reexecuta a função no mesmo DOM,
sem remontar.

**Armadilha de medição**: `waitForToast` espera opacidade ≥ 0,99 de propósito.
Uma notificação no meio do fade dá razão de contraste perto de 1.0 no axe, que
parece paleta ruim e é cronometragem. O comentário da story `AutoDismiss` do
vanilla registra a consequência: com `duration: 400` a janela totalmente opaca
era de ~200ms e a story reprovava sozinha sob carga; 1200ms é o valor que fecha.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, tokens, cores semânticas, movimento reduzido | `docs/shared/styles/nds/sonner.css` — **e ela é lida por vanilla e angular** |
| a fila de referência, com o motivo de cada escolha | `nortear-design-system-vanilla/src/components/ui/toast-utils.ts` |
| a mesma fila, em Angular, com os motivos de framework | `nortear-design-system-angular/src/components/ui/sonner.ts` |
| a ponte de tokens para a lib | `ui/sonner.tsx` (react), `ui/sonner/Sonner.vue` (vue), `ui/sonner/sonner.svelte` (svelte) |
| divergências intencionais sobre as libs | `PATCHES.md#sonner-rich-colors-contrast`, `#vue-sonner-toast-tabindex`, `#svelte-sonner-toast-tabindex` |
| texto das docs pages, props, critérios de teste | `docs/shared/content/sonner/translations.json` |
| degrau de elevação e o motivo | `docs/shared/guidelines/04-padroes-design-sistema.md` §Qual degrau |
| portões determinísticos | `node scripts/audit.mjs sonner --json` |
| tabela de token × folha | `node scripts/tabela-tokens.mjs sonner` — **cego para a folha deste slug**, ver §5.4 |

**As cinco guidelines `07-feedback-components.md` NÃO são fonte de verdade deste
componente a partir de hoje.** Elas guardam a regra da CATEGORIA de feedback — o
critério Alert × Toast, o tom de voz, a regra de cor não ser o único indicador. O
catálogo do componente é este arquivo.

---

**DECIDIDO em 2026-09-13 — o componente é Sonner, e a região é Toaster.** O nome
tinha três formas nas cinco guidelines (`Sonner`, `Sonner (Toast)`, `Toast`,
`Toaster`) e o payload usava uma quarta (`component: "toast"`) contra o slug
`sonner`. Pela decisão da dona:

| o que | passou a ser |
|---|---|
| folha compartilhada | `docs/shared/styles/nds/sonner.css` (era `sonner.css`) |
| classes do componente | `.nds-sonner`, `-title`, `-description`, `-content`, `-action`, `-close`, `-icon`, `-icon-spin`; keyframe `nds-sonner-spin` |
| classe da REGIÃO | `.nds-toaster`, mantida: Toaster é o nome da caixa fixa que escolhe o canto e empilha, não do aviso |
| payload | `component: "sonner"` no tipo e nos call sites das cinco |
| cabeçalho das guidelines | não existe mais seção de catálogo: a regra da categoria está em `19-feedback.md` e o catálogo aqui |

**O que isso fechou de graça**: `prd_token_sem_lastro` derivava o nome da folha do
slug e saía pelo `existsSync` sem reportar nada, e `tabela-tokens.mjs sonner`
imprimia "nenhuma" ao procurar `.nds-sonner*`. Com os três nomes iguais, os dois
instrumentos passam a medir a §5 deste arquivo.

> **PENDÊNCIA · 2026-09-13** — `node scripts/audit.mjs sonner --json` devolve
> **14 achados** (eram 16 quando este PRD nasceu; a rodada de decisões da dona
> consertou os dois `inline_style_design_value` do vue de passagem): 1
> `demonstration_labels_divergent` (angular, faltam `default`, `info`, `loading`,
> `success`, `triggerLoading`), 2 `source_sem_teste` (react e angular), 3
> `story_file_sem_transform` (os três arquivos de story do angular, 17 stories
> publicando o template da story no painel Code), 8 `inline_style_design_value`
> (react ×5, vanilla ×1 — todos `min-height` de quadro de story), 1
> `identificador_pt` (vanilla) e 1 `identificador_pt_novo` (svelte).
> **Fecha quando** `node scripts/audit.mjs sonner --json` devolver
> `{"sonner": []}` com exit 0.

**FECHADA em 2026-09-13**, no mesmo dia: a regra da categoria virou
[`19-feedback.md`](../guidelines/19-feedback.md), o catálogo do Sonner ficou aqui, e
as cópias de react, vue e svelte deixaram de existir. As três que escapavam do
regex por acidente de nome — `## Sonner (Toast)`, `## Toast`, `## Toaster` — saíram
junto, porque a migração foi por leitura e não por portão. O texto abaixo fica
porque a lacuna do regex continua valendo para o próximo componente cujo slug não
é o nome que as guidelines usam.

O que a migração encontrou, medido em 2026-09-13: o nascimento deste arquivo faz
`catalogo_duplicado_com_prd` reprovar **duas** guidelines: react e vue têm
`## Sonner` exato, que é o cabeçalho que a regra procura. Svelte
(`## Sonner (Toast)`), vanilla (`## Toast`) e angular (`## Toaster`) escapam do
regex por acidente de nome, não por estarem migradas — as três também têm
catálogo de componente, e o conteúdo delas está contradito em §7.2 e na lista
de inconsistências.
`catalogo_duplicado_com_prd` **e** as cinco seções guardarem só regra de
categoria.

**A §5 ficou sob portão em 2026-09-13**, pela renomeação acima: enquanto a folha
se chamava `sonner.css` e as classes eram `.nds-sonner*`, os dois instrumentos que
leem esta seção derivavam o nome do slug e não achavam nada — `prd_token_sem_lastro`
saía pelo `existsSync` e `tabela-tokens.mjs sonner` imprimia "(nenhuma)". Portão
que não acha o arquivo não reprova, e silêncio parecia aprovação.

**DECIDIDO em 2026-09-13 — o `aria-live` mora na NOTIFICAÇÃO.** É o que o vanilla e
o Angular já faziam, e as duas passaram a ter asserção nas duas metades: a
notificação carrega `aria-live="polite"` e a região NÃO carrega.

> **PENDÊNCIA · 2026-09-13** — no react a notificação está na ordem de tabulação
> (`tabIndex: 0` no `<li>` da `sonner@2.0.8`), e é o mesmo defeito que o Vue e o
> Svelte já corrigiram por `patch-package` (D11): torrada que desaparece sozinha
> não deveria ser parada de teclado, porque quem chega nela pelo Tab perde o foco
> quando ela sai. O react é a única stack sem diretório `patches/`, então fechar
> isto é criar a infraestrutura de patch ali — decisão da dona.
> **Fecha quando** a linha "notificação na ordem de tabulação" da tabela de §8.1
> disser "não" nas cinco, com uma asserção por stack.

> **PENDÊNCIA · 2026-09-13** — as três stacks com lib ainda não cumprem a decisão,
> porque o atributo é escrito pela biblioteca: no react ele fica na região; no vue
> e no svelte, nos dois lugares, aninhado. Nenhum dos casos é visto por portão —
> `aria-live` aninhado não é violação de axe. Vue e svelte têm infraestrutura de
> `patch-package` (e patch de sonner já aplicado); o react não tem nenhuma.
> **Fecha quando** as cinco linhas da tabela de §8.1 forem iguais e houver uma
> asserção por stack cobrando o elemento que carrega o `aria-live`.
