# PRD — Stepper

> **Estado descrito**: 2026-09-17, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada, no
> conteúdo e na fonte compilada das quatro libs headless, e as divergências entre
> stacks estão registradas em vez de resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **Não é a primeira descrição do componente.** `## Stepper` existe nas cinco
> `05-navigation-components.md`, com as cinco cópias quase idênticas entre si —
> o que é raro nesta casa — e duas afirmações falsas que as cinco não
> compartilham (§11). O `catalogo_duplicado_com_prd` passa a reportá-las no
> minuto em que este arquivo existe.

## 1. Identidade

Fila **ordenada** das etapas de um fluxo de ordem obrigatória, em que cada etapa
é um **controle**: mostra o que ficou para trás, onde a pessoa está e o que
falta, e deixa pedir para ir a uma etapa. O componente nunca decide para onde o
fluxo vai — ele avisa qual etapa foi acionada e desenha o valor que quem consome
lhe devolve.

A pergunta que separa este componente dos vizinhos: **existe ordem obrigatória
e cada parte tem um resultado próprio?** Se as partes valem em qualquer ordem, é
Tabs; se não há partes nomeadas, só uma quantidade, é Progress.

| vizinho | diferença que decide |
|---|---|
| Tabs | as seções são independentes e trocam o painel presente na mesma tela; aqui há ORDEM, e a etapa concluída muda de forma (marca de verificação) em vez de só perder o destaque |
| Progress | é `role="progressbar"` passivo, sem foco e com denominador numérico; aqui cada etapa tem nome, é `<button>` e recebe foco — não há `aria-valuenow` em lugar nenhum |
| Breadcrumb | também marca "onde estou" com `aria-current`, mas o token é `page`, a raiz é landmark `<nav>` e os passos são destinos de uma HIERARQUIA; aqui o token é `step`, não há landmark e os passos são momentos de um FLUXO |
| Pagination | as páginas são irmãs e intercambiáveis e dá para pular para a 12; aqui a ordem carrega significado (o PRD dela registra a mesma fronteira, §1) |

### O veredito semântico, medido nas cinco

**É navegação dentro de um fluxo, desenhada como indicador — e é a mesma resposta
nas cinco stacks.** A divergência que se esperava encontrar aqui não existe no
código; ela existe entre o código e o texto que o descreve.

| o que sai no DOM | react | vue | svelte | vanilla | angular |
|---|---|---|---|---|---|
| raiz | `<ol aria-label>` | `<ol aria-label>` | `<ol aria-label>` | `<ol aria-label>` | `<ol aria-label>` |
| papel da raiz | lista (nativo) | lista | lista | lista | lista |
| landmark `<nav>` | não | não | não | não | não |
| etapa | `<li>` + `<button type="button">` | idem | idem | idem | idem |
| etapa atual | `aria-current="step"` no botão | idem | idem | idem | idem |
| concluída | marca SVG + palavra `.nds-sr-only` | idem | idem | idem | idem |
| futura | número + palavra vazia | idem | idem | idem | idem |
| clicável | sim, e só avisa | sim | sim | sim (só com `onStepSelect`) | sim |
| região viva | nenhuma | nenhuma | nenhuma | nenhuma | nenhuma |

Medido em `nortear-design-system-vanilla/src/components/ui/stepper.ts` (191–395),
`nortear-design-system-react/src/components/ui/stepper.tsx` (121–342), nos sete
SFCs de `nortear-design-system-vue/src/components/ui/stepper/`, nos sete
`.svelte` de `nortear-design-system-svelte/src/components/ui/stepper/` e em
`nortear-design-system-angular/src/components/ui/stepper.ts` (116–388).

**Quem diz outra coisa é o texto.** A folha abre com "Indicador de progresso em
etapas (wizard)" (`stepper.css`, linha 3), e o conteúdo compartilhado com
"Indicador de progresso por etapas" (`description`, nos três idiomas). O conteúdo
classifica como `Navegação`, o Storybook agrupa em `Components/Navigation` nas
cinco, e o código entrega controles. O indicador somente-leitura NÃO existe — e
isso é decisão em aberto, não omissão (D3).

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/stepper/translations.json` que a
publica e a story que a mede. O dicionário tem **286 chaves em cada um dos três
idiomas** (pt-BR, en, es — contagem idêntica, conferida em 2026-09-17). Não há
sonda compartilhada em `docs/shared/testing/`: cada stack mede com consultas
próprias, e por isso a coluna da direita diz ONDE a asserção existe.

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A raiz é `<ol>` com `data-slot="stepper"`, classe `.nds-stepper` e nome acessível; cada etapa é um `<li>` | `testes.accessibility.item2`, `accessibility.aria.list` · Playground das cinco — react, svelte, vanilla e angular buscam por papel e nome; o vue confere `ol[data-slot]` e o atributo |
| C2 | O estado da etapa é DERIVADO: número menor que o valor é `completed`, igual é `active`, maior é `inactive`, e sai em `data-state` no `<li>`; a raiz escreve `data-value` | `testes.functional.item1`, `notes.item1` · Playground das cinco — react, svelte e vanilla derivam o esperado do arg; vue e angular cravam o esperado para o valor 2 |
| C3 | `completed` na etapa vence a comparação, e `data-completed` reflete a ENTRADA, não o estado | `testes.functional.item4` · `Completed` das cinco |
| C4 | Exatamente UM elemento carrega `aria-current`, com o valor `step`, e é o gatilho da etapa atual | `testes.accessibility.item3`, `accessibility.items.item2` · Playground e `Active` das cinco |
| C5 | O gatilho é `<button type="button">` com `data-slot="stepper-trigger"` | `anatomy.item3` · só o vanilla afirma `type === 'button'` (`Inactive`); as outras quatro afirmam papel `button` |
| C6 | Na etapa concluída o número dá lugar a um SVG de marca de verificação, e o indicador fica sem texto | `testes.functional.item4`, `accessibility.items.item3` · `Completed` das cinco — o vanilla afirma a classe `.nds-icon` na marca, react e angular afirmam que o SVG tem filhos |
| C7 | O gatilho abre com `<span class="nds-sr-only" data-slot="stepper-state-label">`, preenchido com `labels.completed` ou `labels.current` e VAZIO na etapa futura | `usage.guidelines.item4`, `accessibility.items.item3` · `Active`, `Completed` e `Inactive` das cinco — a composição exata do nome ("Etapa atual" + título, nada mais) só o vanilla afirma, com âncora nas duas pontas |
| C8 | Indicador e traço levam `aria-hidden="true"` | `testes.accessibility.item4` · Playground das cinco, contando `2n − 1` peças decorativas |
| C9 | Nada no fluxo é região viva: nem `aria-live`, nem `role` de status, alerta ou log | `testes.accessibility.item6`, `doDont.pair2.dont` · Playground das cinco |
| C10 | Etapa indisponível: `data-disabled` no `<li>`, `disabled` nativo no botão, fora da ordem de tabulação | `testes.functional.item3`, `testes.accessibility.item5` · `Disabled` das cinco — por `Tab` real em react, svelte e vanilla; por `focus()` programático em vue e angular |
| C11 | Etapa indisponível não responde ao ponteiro | `states.disabled.behavior` · `Disabled` de react e angular, por `pointerEvents` computado; as outras três não afirmam |
| C12 | Acionar o gatilho de uma etapa disponível entrega o NÚMERO daquela etapa a quem consome, e o componente NÃO muda o próprio valor | `testes.functional.item2` · `Wizard` das cinco; no Playground, react e vanilla afirmam a chamada, e só o react afirma que `data-value` não mudou |
| C13 | Acionar a etapa indisponível não chama ninguém | `testes.functional.item3` · `Disabled` das cinco, com clique forçado (`pointerEventsCheck: 0`) |
| C14 | A descrição mora DENTRO do gatilho e entra no nome acessível dele, sem virar segundo alvo de foco | `variants.compositions.withDescriptions.description` · `WithDescriptions` das cinco — svelte por `toHaveAccessibleName`, react, vanilla e angular por posição e por nome, o vue só por `textContent` |
| C15 | O traço mora dentro do `<li>`, depois do gatilho, e a última etapa não tem traço | `notes.item3` · Playground das cinco, pela contagem |
| C16 | Conteúdo próprio no indicador suspende o número e a marca | `props.extensibilityCode` · **nenhuma story nas cinco** |

**Uma promessa do conteúdo não tem produtor comum**: que "a cada troca o foco vai
para o painel" (`variants.compositions.wizard.description`, `notes.item4`). Duas
stacks fazem, três não — V8.

## 3. Decisões fixadas

### D1 · A raiz é lista ordenada, e não landmark nem grupo

**Estado**: `<ol>` nas cinco, sem `role` explícito, sem `<nav>` em volta.
**Motivo, escrito nos cinco primitivos (decisão 1 do docblock)**: a ordem e a
contagem das etapas são o conteúdo, e `<ol>` as anuncia sozinho — "lista, 4
itens, item 2". Um `<div role="group">` com rótulo diria menos.
**Consequência medida na folha**: não há reset global de lista neste projeto, e
o `padding-inline-start` e o `margin-block` do agente do usuário deslocavam a
primeira etapa. A folha zera os três (`stepper.css`, 111–121), com o comentário
dizendo que o mesmo bloco existe em `.nds-breadcrumb-list`.
**O que isso contradiz**: a regra transversal das guidelines de navegação de
react e vue — "Todo componente de navegação vive dentro de um `<nav>`" — não vale
para este componente em stack nenhuma (§11).

### D2 · `aria-current="step"` no GATILHO, e não `"true"` nem no item

**Estado**: as cinco escrevem `step` no `<button>` da etapa atual e REMOVEM o
atributo das outras — "deixar o atributo para trás ao avançar daria DOIS atual na
mesma lista".
**Motivo**: `step` é o token que a WAI-ARIA define para posição num processo;
`true` diz "este é o atual" sem dizer atual do quê. É a mesma escolha que o
Pagination faz com `page`.
**Medição que torna esta decisão o ponto de ruptura com as libs**: as duas libs
que TÊM stepper fazem o contrário, e no item. `reka-ui` 2.10.4:
`"aria-current": itemState.value === "active" ? "true" : void 0`
(`dist/Stepper/StepperItem.js`, 67). `@radix-ng/primitives` 1.1.2:
`'[attr.aria-current]': 'itemState() === "active" ? true : undefined'` no
`rdxStepperItem` (`fesm2022/radix-ng-primitives-stepper.mjs`, 106).

### D3 · A etapa é SEMPRE um `<button>`, e não há forma somente-leitura

**Estado**: a folha declara UMA forma de gatilho, e ela é de controle —
`cursor: pointer`, `border: 0`, fundo transparente, anel de `:focus-visible`
(`stepper.css`, 31–50) e `pointer-events: none` no item indisponível (27–29),
regra que só existe para quem recebe ponteiro.
**O custo, dito nos primitivos de vanilla, vue e svelte (decisão 8) e nas cinco
guidelines**: um Stepper sem callback de seleção rende N paradas de tabulação que
não levam a lugar nenhum. A orientação é tratar isso como defeito de uso — ou se
liga a seleção, ou se marcam as etapas como indisponíveis.
**Onde a decisão NÃO está escrita**: react e angular param na decisão 7 do
docblock; a oitava, que é esta, não aparece nos dois primitivos.
**Quem já recusou o componente por causa disto**: a guideline 17 recusa montar a
peça `timeline` com Stepper, porque "evento de linha do tempo não tem chamada de
volta nenhuma — a fila ganharia N controles que não fazem nada"
(`17-componentes-conversacionais.md`, linha 315). A mesma guideline aceita o
Stepper na entrada `onboarding` justamente porque ali voltar é vantagem (296).

> **PENDÊNCIA · 2026-09-17** — o design system não oferece indicador de etapas
> somente-leitura, e três primitivos registram que a decisão é da dona. Enquanto
> ela não existe, as próprias docs pages das cinco stacks montam prévias de Do &
> Don't e de composição com Stepper SEM seleção ligada — o uso que o componente
> chama de defeito.
> **Fecha quando**: a dona decidir, por escrito, entre declarar uma segunda forma
> em `stepper.css` e registrar a recusa na guideline de categoria — e as prévias
> das cinco docs pages seguirem a decisão.

### D4 · O estado é derivado, nunca escrito — e no vanilla a derivação é uma chamada

**Estado**: react (`StepperItem`, 174–179), vue (`StepperItem.vue`, 32–37), svelte
(`resolveStepperState`, `stepper-context.ts` 82–90) e angular
(`NdsStepperItem.state`, 182–187) derivam por contexto, `provide`/`inject`,
getters e sinais. O vanilla não tem runtime reativo: `setStepperValue(raiz,
valor)` (`stepper.ts`, 350–395) resolve estado, `aria-current`, `disabled`,
palavra de estado e conteúdo do indicador, depois que todas as etapas existem.
**Por que a regra é a mesma nas cinco**: `completed || step < value` →
concluída; `step === value` → atual; o resto → futura. A expressão é idêntica
nos cinco arquivos.
**A consequência da forma do vanilla, e ela está declarada no primitivo**: o
item nasce `inactive` (232) e o gatilho nasce habilitado. Sem a segunda fase NÃO
há etapa atual, NÃO há `aria-current` e a etapa marcada como indisponível
continua focável. Nas outras quatro, sem valor, a etapa 1 é a atual.

### D5 · O estado chega por FORMA e por PALAVRA, e a palavra mora na raiz

**Estado**: a concluída troca o número pelo `Check` do lucide com `.nds-icon`
(1rem, `utilities.css` 167); o gatilho carrega a palavra em `.nds-sr-only`.
**Motivo (decisão 3 dos cinco primitivos)**: WCAG 1.4.1 — forma sobrevive a
daltonismo e tela monocromática; palavra chega a quem não vê a marca.
**Por que na RAIZ**: o estado de uma etapa muda quando o fluxo avança, e uma
palavra fixa por gatilho estaria errada no passo seguinte.
**Por que `.nds-icon` é obrigatória, medido no vanilla**: sem dimensão o SVG
estica até o círculo inteiro e a marca vira uma mancha do tamanho do indicador —
defeito real, corrigido no primitivo, com a guarda na `Completed` do vanilla
("esta linha é a guarda").

### D6 · Sem região viva, e o anúncio é do conteúdo que mudou

**Estado**: nenhuma das cinco escreve `aria-live` ou `role` de status (C9).
**Motivo (decisão 5)**: um indicador que se reanuncia a cada avanço atropela a
leitura do resto da tela. Quem anuncia o avanço é o painel que trocou de
conteúdo, "e é para ele que a aplicação move o foco".
**Medição que faz esta decisão divergir das libs**: a `StepperRoot` da reka
renderiza, fixa e sem prop que a desligue, uma `<div aria-live="polite"
aria-atomic="true" role="status">` com o texto `Step N of M` em inglês
(`StepperRoot.js`, 9–19 e 154). O `rdxStepperRoot` do radix-ng anuncia a mesma
frase em inglês por `RdxLiveAnnouncer` (`.mjs`, 117 e 174).
**O que NÃO está decidido**: se mover o foco é contrato do componente ou escolha
da composição. O primitivo diz que é da aplicação, o conteúdo diz que a
composição faz, e duas stacks fazem (V8).

### D7 · Indisponível é `disabled` nativo, e só isso basta aqui

**Estado**: as cinco escrevem `disabled` no `<button>` a partir do `disabled` do
item; a folha acrescenta `pointer-events: none` no `<li>` e esmaece indicador e
traço.
**Motivo (decisão 6)**: um botão focável que não leva a lugar nenhum gasta o
tempo de quem navega por teclado.
**Por que o `disabled` nativo é seguro AQUI e não é em todo componente**: não há
navegação por setas — a etapa indisponível não precisa ser alcançável para ser
anunciada. Está escrito nas cinco guidelines, e as libs são a prova do contrário:
reka e radix-ng governam as setas com `tabindex` itinerante
(`StepperTrigger.js`, 83; `.mjs`, 341).
**Diferença com o vizinho**: o Pagination em `<a>` precisa de `aria-disabled` +
`tabindex="-1"` + guarda de clique (PRD dele, D8); aqui o elemento é botão e o
navegador faz os três.

### D8 · Nenhuma das cinco usa lib headless — e a razão NÃO é a mesma

**Estado medido em `node_modules`, em 2026-09-17**:

| stack | lib · versão instalada | tem stepper? | o que a stack escreveu |
|---|---|---|---|
| react | `@base-ui/react` 1.7.0 | **não** — não há diretório `stepper` | "Não há Stepper na lib headless desta stack" — verdadeiro |
| vue | `reka-ui` 2.10.4 | **sim** — `dist/Stepper/`, sete peças | "a lib headless desta stack não chegava a esse DOM" — verdadeiro, e as quatro razões conferem com a fonte |
| svelte | `bits-ui` 2.19.0 | **não** — não há diretório em `dist/bits` | "O `bits-ui` não tem Stepper" — verdadeiro |
| angular | `@radix-ng/primitives` 1.1.2 | **sim** — `stepper/`, com `fesm2022/radix-ng-primitives-stepper.mjs` de 398 linhas | "o Radix NG não tem Stepper" — **FALSO** (`stepper.ts`, 21–22, e a guideline da stack) |

**O que as duas libs que têm stepper emitem, lido na fonte compilada** — e é
exatamente o que o Vue listou para retirar a reka:

| | reka-ui 2.10.4 | radix-ng 1.1.2 | as cinco stacks |
|---|---|---|---|
| raiz | `role="group"` + `aria-label="progress"` cravado | `role="group"` + `aria-label` ligado a `"progress"` | `<ol>` com nome de quem compõe |
| etapa atual | `aria-current="true"` no item | `aria-current` = `true` no item | `aria-current="step"` no gatilho |
| anúncio | região viva fixa, "Step N of M" | `RdxLiveAnnouncer`, "Step N of M" | nenhum |
| teclado | setas, `tabindex` itinerante | setas, `tabindex` itinerante | só Tab |
| ordem | `linear` por padrão: não deixa pular à frente | `linear` | quem consome decide |

**Consequência**: a divergência entre as cinco NÃO é de API de lib, porque nenhuma
lib participa. Tudo que difere em markup ou comportamento tem fonte de verdade,
e ela é o vanilla. O que é de framework é só a forma de expressar a mesma árvore
(§7).

> **PENDÊNCIA · 2026-09-17** — o primitivo do angular afirma que "o Radix NG não
> tem Stepper", e o `@radix-ng/primitives` 1.1.2 instalado publica um. Estreitada
> em 2026-09-17: a guideline de navegação da stack dizia o mesmo e foi corrigida na
> migração do catálogo; resta o comentário do código. A decisão de não usá-lo continua defensável — ele
> emite as mesmas quatro coisas que fizeram o vue retirar a reka —, mas a razão
> escrita é falsa, e razão falsa é a que se desfaz na primeira atualização.
> **Fecha quando**: o comentário de `nortear-design-system-angular/src/components/ui/stepper.ts`
> disser o que o `rdxStepperRoot` emite e por que não foi usado, com a versão
> medida.

### D9 · O traço mora DENTRO do item

**Estado**: as cinco anexam `stepper-separator` ao `<li>`, depois do gatilho, e
não entre os itens.
**Motivo (escrito nos cinco primitivos)**: é o que faz
`.nds-stepper-item[data-state="completed"] .nds-stepper-separator` alcançá-lo sem
regra extra — o traço herda o estado da etapa que o precede.
**Consequência de layout**: o item não cresce (`.nds-stepper-item` não declara
`flex`), então o traço fica no comprimento mínimo. O conteúdo compartilhado
ensina a esticá-lo em `tokens.customizationCode`, deixando o item crescer.

### D10 · O círculo tem dimensão fixa, e ela é relativa

**Estado**: `width` e `height` do indicador em `--spacing-8` (`stepper.css`,
57–58), com o comentário "quadrado icon-only, dimensão fixa ok".
**Motivo (decisão 7 dos cinco primitivos)**: `--spacing-8` é
`calc(var(--spacing-base) * 8)` (`tokens.css`, 198), e `--spacing-base` é `rem`
e muda com a densidade (`densities.css`, 20, 33, 48). O círculo cresce com a
fonte do navegador; título e descrição vivem FORA dele e nunca são recortados.
**O que a decisão não cobre, medido na folha**: nem o gatilho nem o indicador
declaram `font-size`. O número herda do `<button>`, e `reset.css` não redefine a
fonte de botão — então o tamanho do número é o do agente do usuário, fora da
escala tipográfica. Não medido no navegador.

### D11 · `type="button"` é forçado, e no react ele vem DEPOIS do espalhamento

**Estado**: as cinco. No react o atributo é escrito depois de `{...props}`
(`stepper.tsx`, 234–237); no svelte depois de `{...restProps}`; no angular é
atributo estático do host; no vanilla, `button.type = 'button'`.
**Motivo (escrito nas cinco)**: dentro de um `<form>` — que é o caso de todo
wizard — botão sem `type` é `submit`, e clicar numa etapa enviaria o formulário.

### D12 · O componente é sempre controlado

**Estado**: nenhuma das cinco guarda a etapa. O gatilho chama o callback com o
número (`onStepSelect`, `step-select`, `stepSelect`) e o valor só muda quando
quem consome o devolve.
**Medição**: o Playground do react clica na última etapa e afirma que
`data-value` continua o valor do arg. Não há `defaultValue` nem `v-model` em
stack nenhuma — as duas libs têm os dois.
**No vanilla, o ouvinte é delegado na raiz** e só é registrado quando
`onStepSelect` vem na criação (`stepper.ts`, 202–214); ele lê `data-step` no
momento do clique, e por isso continua certo depois de `setStepperValue` e de
etapas acrescentadas.

## 4. Anatomia

```
stepper                        <ol>, aria-label, data-value
└── stepper-item               <li>, data-step, data-state, [data-completed], [data-disabled]
    ├── stepper-trigger        <button type="button">, [aria-current="step"], [disabled]
    │   ├── stepper-state-label   <span class="nds-sr-only">, sempre presente, vazio na futura
    │   ├── stepper-indicator     <span aria-hidden>, número ou marca; [data-custom]
    │   ├── stepper-title         <span>, nome curto da etapa
    │   └── stepper-description   <span>, opcional
    └── stepper-separator      <div aria-hidden>, ausente na última etapa
```

Oito `data-slot`, e os oito saem nas cinco stacks. `stepper-state-label` não é
peça publicada: é criado DENTRO do gatilho pelas cinco implementações, sempre
como primeiro filho, para que a troca de estado não insira nó no meio do
conteúdo de quem compõe.

**O que é conteúdo de quem compõe**: o texto do título e da descrição, o conteúdo
próprio do indicador e a quantidade de etapas. **O que é estrutura**: a palavra
de estado, o número e a marca — escritos pelo componente.

**`data-completed` e `data-state` dizem coisas diferentes**: o primeiro é a
entrada (a etapa foi marcada), o segundo é o resultado. A folha só lê
`data-state` e `data-disabled`; `data-completed` e `data-custom` existem para
asserção e, no vanilla, para `setStepperValue` saber o que não reescrever.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/stepper.css`, 122 linhas, lida linha a linha em
2026-09-17. Instrumento: `node scripts/tabela-tokens.mjs stepper` — fecha com 0
linhas divergentes da folha e 0 tokens lidos e não listados. As cinco docs pages
publicam as mesmas 22 linhas; o instrumento só lê a forma de react, svelte e
angular, e as "17 divergências entre stacks" que ele reporta são o vue e o
vanilla escritos em tupla, não diferença de conteúdo (conferido à mão).

| propriedade | valor | token |
|---|---|---|
| raiz · distância entre etapas | 8px | `--spacing-2` |
| raiz · margem e recuo de lista | zero | **literal** `0`, mais `list-style: none` (D1) |
| item · distância entre gatilho e traço | 8px | `--spacing-2` |
| gatilho · distância entre indicador, título e descrição | 4px | `--spacing-1` |
| gatilho · padding | 4px | `--spacing-1` |
| gatilho · raio | 12px na base | `--radius-md` |
| gatilho · fundo e borda | nenhum | **literais** `transparent` e `0` |
| gatilho · família | herdada | **literal** `inherit` |
| gatilho · cor | herdada | **literal** `inherit` |
| foco · vão interno | 2px | `--background`, com o `2px` literal |
| foco · banda | 5px | `--ring`, com o `5px` literal |
| indicador · lado | 32px | `--spacing-8` (D10) |
| indicador · raio | círculo | `--radius-full` |
| indicador · fundo, futura | muted a 50% | `--muted` com alfa literal `0.5` |
| indicador · número, futura | muted-foreground a 50% | `--muted-foreground` com alfa literal `0.5` |
| indicador · fundo, atual | cheio | `--primary` |
| indicador · número, atual | — | `--primary-foreground` |
| indicador · fundo, concluída | accent a 20% | `--accent` com alfa literal `0.2` |
| indicador · marca, concluída | — | `--accent-foreground` |
| indicador · indisponível | cor cheia e opacidade 0.5 | `--muted-foreground`, com a opacidade literal |
| título · corpo | 16px | `--text-control-lg` |
| título · peso | 600 | `--font-weight-semi-bold`, com literal `600` de fallback |
| título · quebra | nunca | **literal** `white-space: nowrap` |
| descrição · corpo | 12px | `--text-control-sm` |
| descrição · cor | — | `--muted-foreground` |
| traço · espessura | 1px | **literal** |
| traço · comprimento mínimo | 32px | `--spacing-8` |
| traço · cor | — | `--border` |
| traço · concluída | accent a 20% | `--accent` com alfa literal `0.2` |
| traço · indisponível | muted com opacidade 0.5 | `--muted`, com a opacidade literal |

**Nenhuma cor literal.** As quantidades escritas à mão são força de composição
(`0.5`, `0.2`) e opacidade de indisponível (`0.5`), nunca matiz.

**Os literais, um por um**:

- `0` e `list-style: none` da raiz — o reset que a folha assume por não haver
  reset global de lista (D1);
- `transparent`, `border: 0`, `outline: 0` e os dois `inherit` do gatilho — é o
  que tira do `<button>` o cromo do navegador;
- `2px` e `5px` do anel — a mesma geometria de foco do botão e do Pagination;
- `0.5` e `0.2` — os degraus de força de futura e de concluída;
- `600` — fallback do peso;
- `nowrap` do título — decisão de não quebrar o nome da etapa, e a razão de o
  conteúdo pedir de três a seis etapas (`usage.guidelines.item2`);
- `1px` do traço — espessura de linha, sem token de hairline.

**Sem sombra, sem camada, sem movimento.** A folha não declara `box-shadow` fora
do foco, não declara `z-index`, não declara `transition` — e por isso não tem
bloco de `prefers-reduced-motion`, e não precisa. Não declara `:hover` nem
`data-orientation`: não há forma vertical.

**O que as tabelas publicadas omitem sem mentir**: as 22 linhas nomeiam o token e
não o alfa. Quem lê "fundo da etapa ainda não alcançada: `--muted`" não sabe que
o fundo é metade dele — e é o alfa que decide o contraste do número (§8).

## 6. Estados

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Futura | número maior que o valor | círculo muted a 50%, número a 50%, palavra vazia | sim — `Inactive` das cinco |
| Atual | número igual ao valor | círculo cheio em primary, `aria-current="step"`, palavra "atual" | sim — `Active` das cinco |
| Concluída por derivação | número menor que o valor | círculo accent a 20%, marca no lugar do número, traço em accent, palavra "concluída" | sim — `Completed` de react, svelte, vanilla e angular; **não no vue**, cuja `Completed` abre no valor 1 (V14) |
| Concluída fora de ordem | `completed` na etapa | o mesmo, com `data-completed` | sim — `Completed` das cinco |
| Indisponível | `disabled` na etapa | `disabled` nativo, ponteiro barrado, indicador e traço esmaecidos | sim — `Disabled` das cinco |
| Foco por teclado | `:focus-visible` no gatilho | vão de 2px em background mais banda de 5px em ring | **sem asserção** — nenhuma story mede a sombra do foco |
| Indicador com conteúdo próprio | `data-custom` | número e marca não são escritos | **só em docs page** — nenhuma story nas cinco (C16); as cinco docs pages o usam numa prévia de Do & Don't, escrevendo o número à mão para mostrar o estado que depende só de cor |
| Sem valor aplicado (vanilla) | fábrica montada sem `setStepperValue` | todas futuras, nenhuma atual | sim, e por construção: é como o item nasce (D4) |

O conteúdo compartilhado publica QUATRO configurações em `states` (`inactive`,
`active`, `completed`, `disabled`), e as cinco docs pages renderizam as quatro.

**O título da etapa indisponível não esmaece**: a folha esmaece indicador e traço
(`stepper.css`, 74–77 e 102–105) e não escreve regra para `.nds-stepper-title`
nem `.nds-stepper-description` dentro de `[data-disabled]`.

## 7. API

O eixo compartilhado é pequeno e concorda nas cinco: um valor na raiz, rótulos de
estado na raiz, um callback de seleção na raiz, e três entradas na etapa.

| prop | peça | tipo | padrão | onde existe |
|---|---|---|---|---|
| `value` | raiz | number | `1` | react, vue, svelte, angular — no vanilla é o segundo argumento de `setStepperValue`, sem padrão (D4) |
| nome acessível | raiz | string | — | as cinco |
| `labels` | raiz | `{ completed?, current? }` | vazio | as cinco |
| seleção | raiz | callback com o número | — | as cinco, com três nomes |
| `step` | etapa | number | obrigatório | as cinco |
| `completed` | etapa | boolean | `false` | as cinco |
| `disabled` | etapa | boolean | `false` | as cinco |
| conteúdo próprio do indicador | indicador | — | — | as cinco, com quatro mecanismos |
| classe extra | todas | string | — | as cinco |

### Divergências de framework, registradas

| stack | como difere |
|---|---|
| react | Sete componentes em React puro, com dois contextos. `aria-label` é obrigatório no TIPO. `className`. O gatilho aceita `onClick` e `disabled` próprios: o `onClick` de quem compõe roda primeiro e `preventDefault` cancela a seleção; o `disabled` do gatilho VENCE o da etapa (`disabled ?? item?.disabled`, 242). Fora de uma etapa as peças renderizam sem número e sem estado, em silêncio — "isso se vê na hora, em vez de estourar a página inteira" |
| vue | Sete SFCs com `provide`/`inject`. `aria-label` NÃO é prop: cai no `<ol>` pelo repasse de atributos, e o tipo não o exige. Seleção por evento `step-select`. `class`. O item expõe `state` no slot com escopo. Conteúdo próprio do indicador entra pelo slot padrão, sem marcador. O gatilho não oferece cancelamento. Fora de contexto, `inject(…, null)` e as peças caem em futura/número 1 |
| svelte | Sete `.svelte` com `setContext`/`getContext` e getters — "guardar `value` como número congelaria o estado no primeiro quadro". `aria-label` obrigatório no tipo, `onStepSelect`, `class`, `ref` bindável. `onclick` de quem compõe roda primeiro e `defaultPrevented` cancela. Fora de contexto LANÇA erro em português ("Esta peça do Stepper precisa estar dentro de <Stepper>"). O índice exporta formas curtas (`Root`, `Item`…) e `resolveStepperState` |
| vanilla | Sete fábricas mais `setStepperValue` e `getStepperValue`. Montagem em DUAS FASES (D4). `'aria-label'` obrigatório no tipo. `class`, com `className` como apelido depreciado — quando os dois vêm, `class` vence. Conteúdo próprio do indicador pela opção `content`, que marca `data-custom`. `onStepSelect` só registra ouvinte se vier na criação |
| angular | Sete seletores de ATRIBUTO em elemento nativo (`ol[ndsStepper]`…) mais `svg[ndsStepperCheck]`, que monta a marca por `createElementNS` porque o ícone do lucide tem tag variável. `value` e `labels` são `input()`, a seleção é `output()` `stepSelect`, emitida pela RAIZ. `aria-label` é atributo nativo e não input — "um input homônimo daria dois jeitos de dizer a mesma coisa". Conteúdo próprio exige `custom` explícito, porque projeção é resolvida em compilação; sem ele, conteúdo projetado e número aparecem JUNTOS. Fora de contexto o `inject` falha com erro de injeção |

**Onde a forma NÃO é divergência**: as cinco produzem a mesma árvore de oito
`data-slot` (§4), com as mesmas tags. O número de arquivos e o nome do callback
são idioma de framework.

### Peças, por stack

| stack | peças |
|---|---|
| react | `Stepper`, `StepperItem`, `StepperTrigger`, `StepperIndicator`, `StepperTitle`, `StepperDescription`, `StepperSeparator`, tipos `StepperState`, `StepperLabels` e as sete `*Props` |
| vue | `Stepper`, `StepperItem`, `StepperTrigger`, `StepperIndicator`, `StepperTitle`, `StepperDescription`, `StepperSeparator`, tipos `StepperLabels`, `StepperState` |
| svelte | `Root`/`Stepper`, `Item`/`StepperItem`, `Trigger`/`StepperTrigger`, `Indicator`/`StepperIndicator`, `Title`/`StepperTitle`, `Description`/`StepperDescription`, `Separator`/`StepperSeparator`, `resolveStepperState`, tipos `StepperLabels`, `StepperState` |
| vanilla | `createStepper`, `createStepperItem`, `createStepperTrigger`, `createStepperIndicator`, `createStepperTitle`, `createStepperDescription`, `createStepperSeparator`, `setStepperValue`, `getStepperValue`, tipos `StepperState`, `StepperLabels` e as seis `*Options` |
| angular | `ol[ndsStepper]` (`NdsStepper`), `li[ndsStepperItem]`, `button[ndsStepperTrigger]`, `span[ndsStepperIndicator]`, `span[ndsStepperTitle]`, `span[ndsStepperDescription]`, `div[ndsStepperSeparator]`, `svg[ndsStepperCheck]`, a lista `NDS_STEPPER` e os tipos `StepperState`, `StepperLabels` |

### Inconsistências entre stacks, medidas em 2026-09-17

Nenhum dos itens abaixo é visto por portão. Os que têm portão estão na §11.

| # | o que difere | quem faz o quê | lados |
|---|---|---|---|
| V1 | cancelar a seleção pelo clique de quem compõe | react e svelte rodam o manipulador do consumidor primeiro e respeitam `defaultPrevented`; vue, vanilla e angular não oferecem cancelamento | 2 × 3 — a referência não cancela |
| V2 | `disabled` escrito direto no gatilho | react o aceita e ele vence o da etapa; svelte o escreve depois do espalhamento, e o da etapa vence; vanilla o reescreve em `setStepperValue`; vue e angular o ligam só à etapa | 1 × 4 |
| V3 | marcador de indicador com conteúdo próprio | react, svelte, vanilla e angular escrevem `data-custom`; o vue troca o conteúdo pelo slot e não escreve nada | 4 × 1 |
| V4 | peça fora do contexto | svelte lança erro e angular falha na injeção; react e vue renderizam em silêncio sem número e sem estado | 2 × 2 (vanilla não tem contexto) |
| V5 | nome acessível exigido pelo tipo | react, svelte e vanilla exigem; vue não declara, angular é atributo nativo | 3 × 2 — é forma de framework, e fica aqui porque o vue deixa um Stepper sem nome compilar |
| V6 | etapa atual sem valor aplicado | a etapa 1 em react, vue, svelte e angular; nenhuma no vanilla até `setStepperValue` | 4 × 1, declarado no vanilla (D4) |
| V7 | decisão 8 do docblock (o gatilho é sempre botão, e o custo) | escrita em vanilla, vue e svelte; ausente em react e angular | 3 × 2 |
| V8 | foco ao painel depois da troca de etapa | vanilla e svelte movem, na story `Wizard` e na demonstração da docs page; react, vue e angular não movem em nenhuma das duas | 2 × 3 — e o conteúdo (`variants.compositions.wizard.description`, `notes.item4`) promete que move |
| V9 | painel da composição `Wizard` (story) | vanilla: `<div tabindex="-1">` com o título; svelte: `<div tabindex="-1" aria-labelledby>` com `h3` e corpo; react: `h3` "título — n/4" e dica; vue: `h3` e corpo; angular: um `<p>` com a descrição | nenhuma maioria; o conteúdo diz "dentro de um `Card`", e nenhuma das cinco usa a peça Card — três usam só a utilitária `nds-bg-card` |
| V10 | valor inicial | story `Wizard`: 1 em react, vue, vanilla e angular, 2 no svelte; demonstração da docs page: 2 em react, svelte e angular, 1 em vue e vanilla | 4 × 1 na story, 3 × 2 na página |
| V11 | painel na demonstração da docs page | react, svelte, vanilla e angular mostram o conteúdo da etapa; o vue mostra só o Stepper e os botões | 4 × 1 — sem painel, a página do vue não tem o "conteúdo que mudou" que D6 manda anunciar |
| V12 | quantas etapas nas stories de estado | quatro em react, svelte e vanilla; três em vue e angular | 3 × 2 |
| V13 | `Inactive` distinta de `Active` | vue, svelte e vanilla montam `Inactive` com valor 1; react e angular montam as duas com o MESMO valor 2 e a mesma árvore | 3 × 2 |
| V14 | `Completed` com concluída por derivação | react, svelte, vanilla e angular abrem no valor 2; o vue abre no valor 1 e só tem a concluída forçada | 4 × 1 |
| V15 | `Disabled` | svelte bloqueia DUAS etapas (3 e 4), as outras bloqueiam uma; saída da tabulação por `Tab` real em react, svelte e vanilla, por `focus()` em vue e angular; ponteiro afirmado só em react e angular | 4 × 1, 3 × 2, 2 × 3 |
| V16 | Playground | clique e callback afirmados em react e vanilla, ausentes em vue, svelte e angular; estados esperados derivados do arg em react, svelte e vanilla, cravados em vue e angular; descrição nas etapas só no vue | 2 × 3, 3 × 2, 1 × 4 |
| V17 | parâmetros dos arquivos de story | `actions: { disable: true }` nos arquivos de estado e composição em react, vue, svelte e vanilla, ausente no angular; `layout` `padded` em react e angular (3 de 3), vanilla (2 de 3), `centered` no vue (2 de 3), nenhum no svelte | 4 × 1; sem maioria no layout |
| V18 | largura da raiz nas stories | react escreve `nds-w-lg` na raiz; as outras quatro não | 1 × 4 |
| V19 | snippet do painel Code | vanilla: um gerador parametrizado (`stepperSourceWith`) servindo as oito stories, com `stepper.source.test.ts`; react 5 construtores, vue 7, svelte 6, sem teste; angular 1 construtor, só para o Playground | 1 × 4 no teste; o angular é o único com arquivos inteiros sem `transform` |
| V20 | `location` do `step_change` | `docs_demo` em react e svelte (só a demonstração dispara); `docs_demo` e `docs_composition` em vue e vanilla; `docs-demonstration`, com hífen, no angular | três vocabulários |
| V21 | notas renderizadas | react, vue, svelte e vanilla renderizam as cinco do conteúdo; o angular renderiza seis, com `notes.item6` vindo de override da própria stack | 4 × 1 |
| V22 | props do indicador na tabela | o angular lista `custom`; o vanilla fala de `data-custom` só na nota de extensibilidade; react, svelte e vue não listam | nenhuma maioria |
| V23 | texto fora do dicionário | a docs page do vanilla anexa três frases em português às descrições (`DIVERGENCE`, a nota de `className`, `extensibilityNotes`), e elas saem em português nas páginas en e es; as outras quatro não têm literal de conteúdo | 1 × 4 |
| V24 | coluna WCAG da tabela de testes de acessibilidade | react e vue: `AA`; angular: `—`; svelte e vanilla: critério por linha — e divergem no `item6` (4.1.2 no svelte, 4.1.3 no vanilla) | nenhuma maioria |

## 8. Acessibilidade

**Atributos que as cinco escrevem**: `aria-label` no `<ol>`; `aria-current="step"`
no gatilho da etapa atual; `disabled` nativo no gatilho indisponível;
`aria-hidden="true"` no indicador, no traço e no SVG da marca (no vue o
`aria-hidden` da marca vem do próprio `lucide-vue-next` 1.0.0, que o aplica
quando o ícone não recebe atributo de acessibilidade — `dist/esm/Icon.js`, 41).
Nenhuma escreve `role`, `aria-live`, `aria-describedby` ou `aria-labelledby`.

**Teclado**: Tab e Shift+Tab percorrem os gatilhos disponíveis na ordem do DOM;
Enter e Espaço acionam o gatilho (é botão nativo). Não há setas, não há
`tabindex` itinerante, não há Home/End. É o que o conteúdo publica em
`accessibility.keyboard`, e é o que torna D7 seguro.

**Nome do gatilho**: palavra de estado + título + descrição, nessa ordem. O
número do indicador fica de fora (aria-hidden). O vanilla afirma a forma exata
na `Active`; as outras quatro afirmam presença.

**O que deliberadamente NÃO se faz**:

- não se anuncia o avanço por região viva (D6) — é a diferença mais visível para
  as libs, e o conteúdo a publica como Do & Don't (`doDont.pair2`);
- não se usa `aria-current="true"` nem se põe o atributo no `<li>` (D2);
- não se deixa etapa sem destino focável (D3, D7);
- não se lê o número do indicador: a lista já diz "item 2 de 4";
- não se esconde o estado só na cor (D5).

**Contraste — calculado, não medido no navegador.** A aritmética abaixo compõe os
alfas da folha sobre `--background` com os valores HSL de `default.css`,
`cold.css` e `warm.css`, nos dois modos; nenhuma story das cinco mede contraste
do Stepper, e não há sonda em `docs/shared/testing/`.

| tema · modo | número da futura | número da atual | marca da concluída | traço neutro | traço concluído |
|---|---|---|---|---|---|
| default · claro | **2.03** | 5.98 | 9.96 | 1.28 | 1.33 |
| default · escuro | **2.57** | 5.65 | 9.10 | 1.98 | 1.44 |
| cold · claro | **2.04** | 4.91 | 7.72 | 1.29 | 1.15 |
| cold · escuro | **2.97** | 9.64 | 11.64 | 1.22 | 1.24 |
| warm · claro | **2.00** | 5.42 | 10.72 | 1.28 | 1.12 |
| warm · escuro | **3.01** | 5.45 | 11.68 | 1.23 | 1.27 |

O número da etapa futura fica entre **2.00:1 e 3.01:1** nos seis — abaixo de 4.5:1
de texto e, em quatro dos seis, abaixo até de 3:1. A causa é a dupla meia-força:
`--muted-foreground` a 50% sobre `--muted` a 50%. Ele é `aria-hidden`, mas é
texto visível que informa a posição, e o `aria-hidden` não o tira de WCAG 1.4.3.
O alcance do axe sobre texto `aria-hidden` não foi medido aqui.

O traço concluído "acompanha a cor" (`states.completed.behavior`), mas em três dos
seis modos ele é MENOS visível que o traço neutro. É desenho, e 1.4.11 não o
cobra; fica registrado porque o conteúdo o apresenta como sinal de estado.

> **PENDÊNCIA · 2026-09-17** — o número da etapa futura calcula entre 2.00:1 e
> 3.01:1 nos três temas e nos dois modos, e nenhuma story mede. O tamanho do
> número também não é declarado pela folha (D10).
> **Fecha quando**: uma asserção de contraste do indicador da etapa futura
> existir nas cinco stacks e passar, ou a dona registrar por escrito que o número
> é decorativo, com a razão.

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `step_change` | as cinco docs pages, na demonstração; vue e vanilla também na composição de fluxo completo | `{ component: "stepper", step, total, location }` |
| `docs_page_view` | as cinco docs pages | `{ component_name: "stepper", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "stepper", locale }` |

**O componente não dispara nada.** Nenhum dos cinco primitivos importa `track`.

**`step_change` está tipado igual nas cinco** `src/lib/analytics.ts`:
`component: 'stepper'`, `step: number`, `total?: number`, `location?: string`. O
conteúdo publica a mesma forma (`analytics.table.step_change.payload`). O payload
leva número, nunca o título traduzido — está escrito nos cinco call sites.

**O que não concorda é o `location`** (V20), e o auditor vê três das cinco
ocorrências (§11). O react e o svelte estão na lista de dívida DECLARADA de
`docs/shared/primitives/location-so-da-demo-divida.json`: as prévias de
composição e de Do & Don't não rastreiam, e todo evento sai como `docs_demo`.

**As guidelines de react e vue afirmam outro payload.** A tabela "Analytics
transversal" das duas diz, para o Stepper, `step`, `total_steps`, `direction`.
Nenhuma das cinco `analytics.ts` tem `total_steps` nem `direction`, e nenhum call
site os envia. As seções `## Stepper` das cinco guidelines dizem o certo
("o número da etapa e o total").

## 10. Reconstruir do zero

Ordem: folha → árvore de `data-slot` → derivação de estado → gatilho → stories →
docs page.

- **Raiz `<ol>` com o reset de lista na própria folha** (D1). Sem ele, a primeira
  etapa entra deslocada.
- **A derivação é uma expressão só**, e `completed` vence (D4). Escreva-a num
  lugar e desça por contexto; no vanilla, numa chamada explícita depois da
  montagem.
- **`aria-current="step"` no gatilho, e REMOVIDO das outras** a cada mudança (D2).
- **Palavra de estado como primeiro filho do gatilho, sempre presente** (D5, C7).
  Inserir o nó só quando há palavra muda a árvore no meio do conteúdo de quem
  compõe.
- **`type="button"` depois de qualquer espalhamento** (D11).
- **`.nds-icon` na marca**, ou ela estica até o círculo (D5).
- **Traço dentro do `<li>`**, depois do gatilho (D9).
- **Sem região viva, e o componente não guarda valor** (D6, D12).
- **Não reaproveite o stepper da lib** em vue ou angular sem reler D8: os dois
  cravam papel, nome em inglês, `aria-current="true"` e anúncio fixo.
- **Armadilha por stack**:
  - **react** — o `disabled` do gatilho vence o da etapa (V2); fora de contexto
    nada quebra e nada avisa;
  - **vue** — `aria-label` não é prop e o tipo não o cobra; o slot do indicador
    não marca `data-custom` (V3);
  - **svelte** — os contextos precisam de getters, senão o estado congela no
    primeiro quadro; `restProps` antes dos atributos do componente, para que o
    componente vença;
  - **vanilla** — esquecer `setStepperValue` deixa o fluxo sem etapa atual e com
    etapa bloqueada focável; `onStepSelect` depois da criação não registra
    ouvinte;
  - **angular** — `data-slot` por host binding; `custom` explícito no indicador,
    ou conteúdo projetado e número saem juntos; a razão escrita para não usar o
    radix-ng está errada (D8).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, estados, reset de lista | `docs/shared/styles/nds/stepper.css` (122 linhas) |
| texto, props, tokens, critérios de teste | `docs/shared/content/stepper/translations.json` (286 chaves × 3 idiomas) |
| referência de markup e comportamento | `nortear-design-system-vanilla/src/components/ui/stepper.ts` |
| andaime de story | `stepper.fixtures.ts` em react, vanilla e angular; `StepperStory.svelte` e `StepperWizardStory.svelte` no svelte; o vue repete as constantes nos três arquivos |
| evento e payload | `src/lib/analytics.ts` das cinco |
| dívida declarada de `location` | `docs/shared/primitives/location-so-da-demo-divida.json` |
| regra de CATEGORIA (navegação) | `nortear-design-system-<stack>/guidelines/05-navigation-components.md` — não há guideline de navegação em `docs/shared/guidelines/` |
| portões determinísticos | `node scripts/audit.mjs stepper --json` |
| instrumento de tokens | `node scripts/tabela-tokens.mjs stepper` |

**Não há Figma.** `docs/shared/figma/design-links.ts` não tem entrada para
stepper e o arquivo do Figma não tem página dele (conferido em 2026-09-17).
Nenhuma story das cinco declara `design`. Não há o que conferir contra o código.

**Nenhuma folha de stack declara regra sobre `.nds-stepper*`.** A folha
compartilhada é a única fonte de geometria. Fora do componente, `.nds-stepper`
aparece só em comentários — `resposta-estruturada.css` e o `flow-graph` de vue,
svelte e vanilla medem `.nds-stepper-separator` como "o único conector do design
system", linha entre etapas ADJACENTES de fila linear, e por isso insuficiente
para grafo — e na guideline 17 (D3).

### O `audit.mjs` antes e depois deste arquivo

Medido em 2026-09-17, ANTES deste arquivo existir:
`node scripts/audit.mjs stepper --json` devolve **14 achados**.

| regra | severidade | stacks | o que diz |
|---|---|---|---|
| `location_fora_do_vocabulario` | medium | vue (1), vanilla (2), angular (1) | `docs_composition` em vue e vanilla, `docs-demonstration` no angular (V20) |
| `source_sem_teste` | medium | react, vue, svelte, angular | `stepper.source.ts` sem teste (V19) |
| `seo_description_longo` | medium | shared (3) | `seo.description` com 159 (pt-BR), 167 (en) e 164 (es) caracteres, contra o limite de 155 |
| `story_file_sem_transform` | medium | angular (2) | `stepper-compositions` 2 de 2 e `stepper-states` 4 de 4 stories publicam o template no painel Code (V19) |
| `demonstration_labels_divergent` | medium | vanilla | diz que faltam as oito chaves de etapa e de dica — **falso positivo**: a página do vanilla as lê por chave montada (`` `demonstration.labels.${key}` `` e `${key}Hint`, `StepperDocs.ts` 103–104), que a regra não enxerga |

**Com este arquivo escrito, a contagem é 19**, medida logo depois de salvá-lo: os
14 de cima mais os cinco `catalogo_duplicado_com_prd`, um por stack. As regras
que este documento poderia acender sozinho não acenderam — `prd_token_sem_lastro`
não reporta nenhum dos 17 tokens da §5, e nenhuma pendência cai em
`prd_pendencia_ja_fechada`.

> **PENDÊNCIA · 2026-09-17** — os 14 achados anteriores ao PRD estão abertos, e
> um deles é falso positivo da própria regra (`demonstration_labels_divergent`
> não lê chave montada em template).
> **Fecha quando**: `node scripts/audit.mjs stepper --json` devolver lista vazia.

### O catálogo em guideline, nas cinco — e o que ele afirma contra o código

`## Stepper` está nas cinco `05-navigation-components.md`: react linha 188, vue
183, svelte 106, vanilla 90, angular 86. As cinco cópias são a mesma seção com a
mecânica da stack trocada — o que é mais do que o Pagination tinha —, e o que o
código contradiz é pouco e concentrado:

- **angular**: "o Radix NG não tem Stepper" — tem, na versão instalada (D8);
- **vanilla**: a tabela diz que `value` de `setStepperValue` tem padrão `1`; a
  função não tem padrão, e sem ela nenhuma etapa é a atual (D4, V6). O `1` é o
  que `getStepperValue` devolve quando não há valor;
- **react, vue, svelte, vanilla**: `labels` com padrão `{}`; o conteúdo publica
  `—` e só o angular documenta `{}` no `argTypes`. A diferença é de redação, o
  comportamento é o mesmo;
- **react e vue, na seção transversal** (fora de `## Stepper`, e por isso não
  migra com ela): "Todo componente de navegação vive dentro de um `<nav>`" — o
  Stepper não vive em stack nenhuma (D1); o payload `total_steps`, `direction`
  não existe (§9); e o anel de foco seria `.nds-focus-ring`, quando a folha do
  Stepper desenha o próprio (`stepper.css`, 48–50);
- **as cinco**: "a única composição do catálogo que usa stepper (`onboarding`)"
  — a entrada existe na tabela da guideline 17 (linha 296), mas `onboarding` não
  tem implementação em stack nenhuma (a busca por `onboarding` nas cinco `src/`
  só acha outros componentes).

> **FECHADA · 2026-09-17** — as cinco `05-navigation-components.md` tinham seção
> `## Stepper`, e passou a haver PRD. Eram duas fontes para a mesma coisa, e a
> segunda já errava em duas stacks (a lib do angular, o padrão do vanilla).
> **Fecha quando**: `catalogo_duplicado_com_prd` não reportar stepper.
> **Como fechou (2026-09-17)**: as cinco seções viraram ponteiro para este PRD e
> para `docs/shared/guidelines/21-navegacao.md`, com a mecânica de cada stack. A
> guideline do angular passou a dizer que o Radix NG TEM stepper e por que não é
> usado; a do vanilla deixou de dar padrão a `setStepperValue`.

### O que a folha e o conteúdo afirmam, e o código contradiz

1. `stepper.css`, linha 3: "Indicador de progresso em etapas (wizard)". O código
   das cinco entrega controles (§1). O mesmo vale para `description` do conteúdo.
2. `stepper.css`, linhas 17–18: "Tokens: `--primary`, `--primary-foreground`,
   `--accent`, `--muted`, `--muted-foreground`, `--radius`, `--spacing-*`". A folha
   lê `--radius-md` e `--radius-full`, e não `--radius`; e lê seis tokens que o
   docblock não lista — `--background`, `--ring`, `--border`, `--accent-foreground`,
   `--text-control-lg`/`--text-control-sm` e `--font-weight-semi-bold`.
3. `stepper.css`, linhas 6–15: o exemplo de markup do docblock não tem
   `type="button"`, nem a palavra de estado, nem `aria-hidden` no indicador e no
   traço — descreve a classe, não o componente.
4. `variants.compositions.wizard.description`: "dentro de um `Card`" e "a cada
   troca o foco vai para o painel". Nenhuma stack usa a peça Card; duas movem o
   foco (V8, V9).
5. `notes.item4`: "é para ele que a aplicação move o foco" — é orientação, e três
   das cinco demonstrações não a seguem (V8); a do vue nem tem painel (V11).
6. `accessibility.items.item7` e `notes.item5`: o círculo "cresce junto com o
   texto até 200%". Vale para o círculo (`rem`); o número dentro dele não tem
   tamanho declarado (D10).

> **PENDÊNCIA · 2026-09-17** — a composição de fluxo completo move o foco para o
> painel em duas stacks e não nas outras três, e o conteúdo compartilhado promete
> que move; a demonstração do vue não tem painel.
> **Fecha quando**: a `Wizard` das cinco afirmar o foco no painel depois de
> selecionar uma etapa — ou o conteúdo deixar de prometer e a decisão de que
> mover o foco é da aplicação ficar escrita.
