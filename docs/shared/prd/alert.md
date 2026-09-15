# PRD — Alert

> **Estado descrito**: 2026-09-13, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que estiver aqui é o que ela tem de encontrar, e cada divergência entre stacks
> registrada abaixo é um item dela.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **Revisado contra o código em 2026-09-15**, depois da passagem de `fix`
> (`117260014`) — base para a próxima revisão de código: a §7 registra o que
> sobrou de inconsistência entre stacks medida nesta data.

## 1. Identidade

Mensagem **estática e persistente** no fluxo da página, dentro de uma caixa de
fundo colorido suave, que fica na tela enquanto quem lê age.

Não interrompe, não flutua e não desaparece sozinho. É o único componente de
Feedback cuja presença é o próprio canal: ele não anuncia um evento que passou,
ele mantém uma condição à vista.

O que o separa dos vizinhos, em uma linha cada:

| vizinho | diferença que decide |
|---|---|
| Sonner | é temporário e dispensável; some sozinho e não espera leitura |
| AlertDialog | interrompe a página e EXIGE resposta antes de seguir |
| Badge | é inline e compacto, rótulo de estado dentro de lista ou célula |
| Tooltip | é contextual e efêmero, aparece no hover de um alvo |

A pergunta que decide entre Alert e Sonner: **a mensagem precisa continuar na
tela enquanto a pessoa age?** Se sim, é alert; se ela pode passar, é toast.

**E há uma segunda pergunta, que o `role` responde**: a mensagem SURGE em tempo
de execução, ou já estava na página quando ela carregou? É a decisão D1, e foi
ela que mais custou neste componente.

## 2. Contrato de comportamento

Cada linha é verificável. A coluna do portão diz quem reprova se ela deixar de
valer, pelo nome da chave de `docs/shared/content/alert/translations.json` que a
story declara em `parameters.covers` — e `—` é dívida declarada, não ausência de
risco.

| # | o contrato | portão |
|---|---|---|
| C1 | Cinco variantes semânticas, e todas pela PROP: `default`, `destructive`, `success`, `warning`, `info` | `testes.functional.item1`, `item2`, `item5` (stories `Default`, `Destructive`, `Success`) |
| C2 | O ícone é filho DIRETO da raiz, sem wrapper — a folha abre a coluna dele por `:has(> svg)` | `testes.functional.item3` (`Compositions/WithIcon`) |
| C3 | O título é opcional; sem ele a descrição ocupa a coluna inteira, sem quebra | `testes.functional.item4` (`States/WithoutTitle`, nas cinco — afirma ausência da peça e de qualquer heading) |
| C4 | A semântica de anúncio da raiz é escolhida por prop, com default `alert` | `testes.accessibility.item1` (`Playground` nas cinco) |
| C5 | Alerta que já está na tela no carregamento usa `note`, que NÃO é live region | `States/WithoutAnnouncement`, nas cinco |
| C6 | O ícone é decorativo: `aria-hidden="true"` sempre | `testes.accessibility.item2` (`Compositions/WithIcon`) |
| C7 | Texto corrido e título ficam em `--foreground` nas cinco variantes — o contraste não depende da variante escolhida | `testes.accessibility.item3` (`Variants/Contrast`, três temas × dois modos) |
| C8 | `dismissible` mostra um botão de fechar; acioná-lo tira o alerta da tela e dispara o callback **uma única vez** | `testes.functional.item7` (`Variants/Dismissible` e `DismissibleByKeyboard`) |
| C9 | O botão de fechar é o ÚLTIMO filho — o leitor de tela lê a mensagem antes da ação de descartá-la, e o Tab chega nele por último | asserção `lastElementChild` na play de `Dismissible`, nas cinco |
| C10 | A raiz não é focável e não tem `tabindex`; o Tab vai direto ao controle interno | asserção na play de `Compositions/WithAction` |
| C11 | Fechar duas vezes durante a saída dispara o callback uma vez só — a guarda de reentrância é medida com um segundo clique de propósito | segundo `click()` na play de `Dismissible`, nas cinco |
| C12 | Animação de DESCENDENTE não encerra a entrada nem a saída do alerta (`animationend` borbulha) | `AnimationEvent` disparado no botão, na play de `Dismissible` |
| C13 | Alerta montado em tempo de execução é anunciado pelo PAPEL da própria raiz — nenhum `aria-live` em volta dele | `testes.functional.item6` (`States/DynamicInsertion`: antes da ação não há alerta; depois dela há `role="alert"` e nenhum ancestral com `aria-live`) |
| C14 | `dismissible` e `AlertAction` convivem: a ação anda para a esquerda do X, sem sobrepor, e o texto não passa por baixo dela | `testes.functional.item8` + `testes.visual.item6` (`Compositions/WithActionAndDismiss`, pela `measureActionDismiss` da sonda; ver D10) |
| C15 | Nenhuma altura fixa: a caixa cresce com `padding-block` + `line-height` | — (inspeção da folha; nenhum portão mede ausência de `height` aqui) |
| C16 | Alerta fechado some da tela mesmo quando o nó continua no DOM — `.nds-alert[hidden]` vence o `display: grid` da raiz | play de `Dismissible` no angular, único que fecha por `hidden` (§7) |

## 3. Decisões fixadas

A tabela existe para que reverter custe uma leitura. Reverter é permitido; fazer
sem saber, não.

### D1 · A semântica de anúncio é PROP, e o default é `alert`

**Fixada em** `PATCHES.md#alert-role`.
**Estado**: `role?: 'alert' | 'status' | 'note'`, default `'alert'`, indo direto
para o atributo `role` da raiz nas cinco stacks.
**Medição**: com o `role="alert"` cravado, TODO alerta estático era live region
assertiva. O `DocsNotes` renderiza alertas, então o NVDA saltava para a seção
"Notas de Implementação" no carregamento e ficava preso ali — em 48 docs pages ×
4 stacks. A varredura da época confirmou que essa era a **única** live region das
docs pages (zero `aria-live`, zero outro papel de live region em `shared/`).
**O que cada valor faz**: `alert` interrompe e anuncia na hora; `status` anuncia
sem interromper; `note` não é live region nenhuma.
**Qual é o certo para um alerta que já está na página ao carregar**: `note`. Por
WAI-ARIA, `alert` é para mensagem urgente que **surge em tempo de execução**;
anunciar assertivamente algo que sempre esteve ali interrompe a leitura sem
motivo. O `DocsNotes` das cinco stacks usa `note`, e é o consumidor canônico.
**Para revisitar**: trocar o default é quebra de contrato — todo call site
existente mudaria de comportamento sem uma linha alterada.

### D2 · As cinco variantes são valores da prop, nunca classe na mão

**Fixada em** `PATCHES.md#alert-five-variants`.
**Medição**: a folha já definia as cinco, e o `cva` das stacks de framework
mapeava só `default` e `destructive`. `success` e `warning` eram alcançáveis
apenas passando `className="nds-alert-success"`, e `info` não era alcançável nem
documentado — capacidade do CSS que a API não expunha.
**E a forma manual tinha saído errada em duas stacks**: Vue e Svelte montavam
Success e Warning com classes do Tailwind (`bg-success/10`, `border-success/30`),
que saíram do projeto. As duas stories renderizavam um alerta `default`, e o
Chromatic fotografava isso como baseline.
**O que fica**: variante nova no `alert.css` entra no mapa das cinco stacks no
MESMO commit. O descompasso entre folha e API foi o que criou este caso.

### D3 · O título é heading de verdade e a descrição é `<section>`

**Fixada em** `PATCHES.md#alert-title-desc-semantics`.
**Medição**: o cabeçalho do `alert.css` documentava a estrutura com
`<h5 class="nds-alert-title">` e `<section class="nds-alert-description">`, e a
folha traz `.nds-alert > h1..h6` e `.nds-alert > section` justamente para isso. O
Vanilla seguia; React, Vue e Svelte renderizavam `<div>` nos dois, perdendo a
semântica de cabeçalho e o landmark da descrição. Alinhadas ao Vanilla.
**Estado hoje**: react, vue, svelte e vanilla montam `<section>`; no Angular a
diretiva é seletor de atributo puro (`[ndsAlertDescription]`) e a tag é escolha de
quem escreve — ver §7.

### D4 · O nível do título é `h5` por default, e `as` existe para corrigi-lo

**Estado**: `as` (opção/prop nas quatro) com default `'h5'`; no Angular o nível é
o próprio ELEMENTO em que a diretiva foi aplicada, e não há default a herdar.
**Por que a capacidade existe**: `heading-order` do axe reprova salto de nível, e
o alerta não sabe de que profundidade da página foi inserido. Sob uma seção `h2`,
um `h5` pula dois degraus.
**Medido em 2026-09-13**: o `DocsNotes` das CINCO stacks pede `h3`, e nas docs
pages do Alert o título renderizado era `h3` em quatro stacks e `h4` no Angular —
o `h5` do default aparecia somente nos snippets do painel Code e nas stories.
**Decidido pela dona em 2026-09-14: o default fica `h5`, e a documentação passa a
ENSINAR o `as`.** Trocar o default seria quebra de contrato silenciosa em todo
call site; o que faltava era quem copia o snippet saber que o nível se ajusta. A
anatomia e os snippets de estrutura mostram `as="h4"` (no Angular, `<h4
ndsAlertTitle>`; no vanilla, `createAlertTitle({ text, as: 'h4' })`), e o `as` é
tipado `'h1' | … | 'h6'` em react, vue e svelte — antes o react aceitava qualquer
`ElementType` e as outras duas qualquer string.
**E, na mesma decisão, o título dentro dos cards das docs pages é `h4` nas cinco**:
Variantes e Composições abrem o card em `h3`. A demonstração e as prévias de
Do & Don't, que ficam direto sob o `h2` da seção, usam `h3`.
**A premissa do card era falsa em três stacks, medido em 2026-09-15**: o nome do
card do container `DocsVariants` (que também serve Composições) era `<h3>` no
vanilla e no angular e `<p>` em react, vue e svelte — e a docs-smoke reprovou
`h2 → h4` nas três. A dona decidiu alinhar o container ao vanilla: o nome do card
passou a `<h3>` nas cinco, e a docs-smoke inteira de react, vue e svelte fechou
verde depois da troca (98, 98 e 97 páginas), sem salto novo em outro componente.
**Para revisitar**: o default do popover foi de `h4` para `h2` em 2026-09-09
(`popover.md` D10), mas ali o painel é `role="dialog"` e o `aria-labelledby`
procura um cabeçalho; aqui não há papel que dependa do nível.

### D5 · A força da lavagem do fundo é por MODO, e a borda anda junto

**Estado**: `--alert-bg-alpha: 0.1` no claro, `0.2` no escuro (`.dark .nds-alert`);
`--alert-border-alpha: 0.3`.
**Medição**: no claro, 10% já separa a caixa da página. No escuro não separava —
sobre o Ink a lavagem sumia e o alerta parecia não ter fundo nenhum.
**Por que a borda é variável, e não fixa**: enquanto ela era `0.3` fixo e o
preenchimento variável, engrossar a lavagem apagava a borda DENTRO dela — a 0.32
de fundo contra 0.3 de borda o recorte simplesmente desaparecia.
**Consequência que amarra a D7**: engrossar a lavagem CUSTA contraste, porque ela
é da própria cor semântica — o fundo anda em direção ao texto.

### D6 · No escuro o `destructive` tem alfa próprio, por compensação de MATIZ

**Estado**: `.dark .nds-alert-destructive` sobe para `--alert-bg-alpha: 0.32` e
`--alert-border-alpha: 0.42`.
**Medição, no croma do preenchimento composto a 0.2**: `info` 39, `success` 29,
`warning` 13, `destructive` **3**. Três é cinza: `#4b484c` não tem matiz nenhum —
a página azul-esverdeada do escuro e o vermelho quente se anulam quase
exatamente. O resultado invertia a hierarquia de severidade: a variante mais
grave era a única sem cor.
**Com o alfa próprio**: croma 13 (igual ao `warning`) e peso 1.92 contra a página,
contra 1.38–1.50 das outras três — ele lidera nos dois eixos, que é o que a
severidade pede.
**Por que 0.42 na borda**: é o valor que PRESERVA a separação entre borda e
preenchimento que existe nas outras (1.23). Proporcional não serve; tem de ser
medido.
**Regra que fica**: qualquer variante QUENTE acrescentada ao escuro vai precisar
do mesmo tratamento, e a conta é a mesma — medir o croma composto e subir o alfa
até alcançar o das frias.

### D7 · O título das QUATRO variantes semânticas usa `--foreground`

**Estado**: os quatro blocos `.nds-alert-<variante> .nds-alert-title` (e os
`> h1..h6`, `> strong` e `> [data-title]` correspondentes — as mesmas quatro
formas de título que a regra da raiz reconhece; até 2026-09-14 os blocos da
variante cobriam só duas, e um título em `<strong>` herdava a cor do ícone) pintam `hsl(var(--X-foreground))`, que nos três temas
e nos dois modos vale `var(--foreground)`.
**Por que o título não é elemento curto para a WCAG**: ele é 14px semibold, e
texto grande exige 18.66px em negrito — então o limite dele é **4.5:1**, não 3:1.
**Medição, dos três temas de marca nos dois modos**, não só do Default, que era o
único que alguém tinha medido:

| variante | pior caso medido | onde |
|---|---|---|
| `warning` | 2.9:1 | default/claro — o âmbar nunca chegou perto |
| `info` | 3.34:1 | warm/claro — o laranja do Warm sobre o próprio fundo suave |
| `destructive` | 3.90:1 | depois de a lavagem do escuro subir para 20% |
| `success` | 3.83:1 | idem |

O `info` passava no Default (6.16) e no Cold (4.79) e reprovava só no Warm — e
título cuja legibilidade depende do tema de marca escolhido é o mesmo defeito que
a regra do contêiner colorido proíbe por variante. `destructive` e `success`
entraram na mesma regra depois: eles mantinham a cor semântica porque CONSEGUIAM
(pior caso 4.84:1), não porque devessem, e caíram quando a D5 engrossou a lavagem
do escuro.
**O que a cor semântica ainda pinta**: o ÍCONE, que é não-textual e responde ao
piso de 3:1 — folga que as cores atuais têm de sobra nos dois modos. A variante
segue se distinguindo pelo fundo, pela borda e pelo ícone.
**Por que quatro blocos e não uma lista de seletores só**: cada um lê o par
`-foreground` da SUA cor. Neste projeto os quatro pintam a mesma cor, mas um tema
derivado pode divergi-los, e a lista única obrigaria todos a andarem juntos.
**Portão**: `Variants/Contrast` nas cinco stacks, que varre os três temas nos dois
modos e devolve a razão medida, não o nome do token.

### D8 · O gradiente da borda é acabamento NEUTRO, igual nas cinco variantes

**Estado**: um `::after` absoluto, mascarado em anel de 2px, com
`conic-gradient` de quatro tons derivados de `--alert-glow` (que é
`hsl(var(--border))` em TODAS as variantes). Gira duas voltas e freia até parar.
**Por que neutro**: acompanhar a cor semântica fazia o `destructive` girar
vermelho e o `success` verde, competindo com o significado que o ícone e o título
já carregam.
**Por que `@property`**: custom property comum é string para o motor de animação e
não interpola — o gradiente ficaria parado.
**Por que deslocamento de `l` em oklch, e não `color-mix` com branco/preto**:
misturar comprime o lado claro quando a base já é clara — na variante default
`color-mix … white 15%` e `40%` davam L 0,935 e 0,954, dois tons que ninguém
distingue. Deslocando `l`, o passo é o mesmo em qualquer variante.
**Por que não entra na anatomia**: nenhum elemento novo no DOM, nenhuma classe
nova para as stacks, `pointer-events: none`. O que gira é a PINTURA.
**Técnica de referência**: Ana Tudor, pen `qEdRXjV` — as versões anteriores moviam
um elemento pelo caminho da borda e ele saía reto nas curvas.

### D9 · Entrar e sair são animados, e a classe de entrada é TRANSITÓRIA

**Estado**: só o alerta `dismissible` entra animado, porque é o único que aparece
em tempo de execução. A entrada é `.nds-animate-in`, a saída `.nds-animate-out`,
as duas de `utilities.css`.
**A classe de entrada sai do elemento** no `animationend` do PRÓPRIO alerta ou no
timeout de segurança. **Medição que obriga isso**: se ela ficasse, um ambiente que
não avança a animação (o Chromium headless dos testes) manteria o alerta preso em
`opacity: 0`, invisível para sempre — e a folha usa fill-mode assimétrico
exatamente por isso (a entrada não tem `fill`, a saída tem `forwards`).
**Os timeouts NÃO são redundância defensiva genérica**, e as cinco stacks
escrevem o mesmo motivo no mesmo lugar: sem eles o alerta nunca sai da tela em
dois cenários reais — `prefers-reduced-motion`, onde a animação é suprimida e
`animationend` jamais dispara, e ambiente sem composição de quadros, onde ela
fica presa no primeiro quadro. Quem vencer a corrida encerra a fase, uma vez só.
**E `animationend` borbulha**: sem a guarda de `event.target`, a animação de
qualquer descendente — o botão de fechar, um ícone — encerraria a fase do alerta
antes da hora. É o C12, e a play planta o evento no botão de propósito.

### D10 · `dismissible` e `AlertAction` convivem, e a folha acomoda os dois

**Estado**: a ação é a TERCEIRA COLUNA do grid, com largura `auto`, ocupando as
linhas do título e da descrição, a `var(--spacing-3)` do texto. O botão de fechar
continua absoluto dentro da calha de `var(--spacing-10)` (40px) da raiz, e a
coluna da ação termina onde essa calha começa — os dois convivem sem regra
própria.
**Medido em 2026-09-13**: o comentário declarava a exclusividade "por design", e
nada a cobrava. As duas regras são `:has()` de especificidade igual e a do
`dismiss` vinha DEPOIS, então um alerta com os dois ficava com a calha de 40px e a
ação de 72px encostava no botão de fechar.
**Decidido pela dona em 2026-09-14: a folha acomoda os dois**, em vez de proibir.
Exclusividade que só existe em comentário é contrato que ninguém lê; a combinação
é plausível (uma sessão expirando pede "Salvar agora" E pode ser dispensada) e o
custo é uma regra de especificidade maior.
**E a primeira acomodação estava errada, medido em 2026-09-15**: somar as calhas
(72px + 40px) e deslocar a ação absoluta passou nas medidas entre botões e
reprovou na de texto. O botão "Salvar agora" em `sm` tem 108px e a calha da ação
dava 72px: título e descrição corriam 36px POR BAIXO dele — e isso valia para
todo alerta com ação desde sempre, com ou sem fechar, porque a calha fixa era um
palpite sobre o rótulo. Nenhuma story media a composição `WithAction`; a
`WithActionAndDismiss` foi a primeira a ler as caixas. A ação virou coluna `auto`
do grid, que mede o botão que estiver lá, em qualquer idioma e tamanho de fonte.
**Portão**: `Compositions/WithActionAndDismiss` nas cinco, pela
`measureActionDismiss` de `alert-probe.ts` — mede a caixa renderizada da ação, do
X e da descrição, nunca a classe (C14).

### D11 · O primitivo não conhece analytics; o evento é do consumidor

**Estado**: nenhuma das cinco stacks importa `@/lib/analytics` dentro de
`ui/alert*`. O `alert_dismiss` é disparado pelas docs pages, no callback de
fechamento.
**Medição**: o evento já estava tipado nos `analytics.ts` e publicado na tabela de
analytics do conteúdo compartilhado **antes de o componente ter como ser
fechado** — foi esse descompasso que produziu a variante `dismissible`
(`PATCHES.md#alert-dismissible`). Hoje as cinco docs pages emitem de verdade, nos
dois pontos: a demonstração e a variante.

## 4. Anatomia

```
alert  [role=alert|status|note]      a caixa — grid de duas colunas, três com alert-action
├── <svg>                            ÍCONE, filho DIRETO, aria-hidden
│                                    abre a coluna 1 por :has(> svg)
├── alert-title                      h1..h6 (default h5, ajuste por `as`) — coluna 2
├── alert-description                <section> — coluna 2, empilha <p> com gap
│   └── <p> | <ul>                   texto corrido, sempre --foreground
├── alert-action                     ESTRUTURA — coluna 3 (auto), linhas do título e da descrição
│   └── [botão do design system]     sm + variante preenchida
└── alert-dismiss                    o X — absoluto, mesmo canto; ÚLTIMO filho
                                     (convive com alert-action — D10)
```

**O que é obrigatório**: a raiz e a descrição. O ícone e o título são opcionais, e
a ausência de cada um é uma story (`WithoutIcon`, `WithoutTitle`).

**O ícone não pode ter wrapper**, e é a única regra estrutural que quebra em
silêncio: a coluna dele existe porque `.nds-alert:has(> svg)` casa um `<svg>`
FILHO DIRETO, e `grid-column-start: 2` no título e na descrição depende dessa
coluna. Um `<div>` no meio desliga as duas coisas sem erro nenhum.

**O `::after` do gradiente não está aqui de propósito** — ver D8.

**O botão de fechar é o último filho por ordem de LEITURA, não por desenho**: ele
é `position: absolute`, então mudar a posição no DOM não muda nada na tela. No
Vanilla isso exigiu um `queueMicrotask` que o reposiciona depois dos `appendChild`
síncronos de quem compõe — sem ele o X ficava como PRIMEIRO filho, e o leitor de
tela anunciava "Fechar alerta" antes da mensagem.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/alert.css`. As 16 linhas da tabela de tokens das
cinco docs pages fecham com a folha (`node scripts/tabela-tokens.mjs alert`,
reconferido em 2026-09-15: 16 linhas por stack, zero que não fecham, zero
divergência entre stacks).

| propriedade | valor | token |
|---|---|---|
| padding lateral | 16px | `--spacing-4` |
| padding vertical | 8px | `--spacing-2` |
| gap entre linhas do grid | 2px | `--spacing-0-5` |
| coluna do ícone | 16px, com vão de 8px | `--spacing-4` e `--spacing-2`; sem ícone a coluna é `0` e o vão também |
| gap entre `<p>` da descrição | 4px | `--spacing-1` |
| coluna da ação | `auto` (a largura do botão), a 12px do texto | `--spacing-3` |
| calha do botão de fechar | 40px | `--spacing-10` |
| borda | 1px | `--alert-border` |
| raio | — | `--radius-alert` |
| superfície | — | `--alert-bg` |
| texto e ícone | — | `--alert-fg` |
| texto corrido | — | `--alert-body-fg` |
| tom do gradiente | — | `--alert-glow` |
| tamanho de texto | 14px | `--text-control`, herdado por título e descrição |
| peso do título | 600 | `--font-weight-semi-bold` |
| cor do X em repouso | — | `--muted-foreground`; no hover, `--foreground` |
| duração do gradiente | 7,2s | `calc(var(--duration-stately) * 9)` |
| ângulo do gradiente | 0→720deg | `--nds-alert-gradient-angle`, propriedade registrada |

**A indireção das vars internas é o ponto de extensão, e tem duas camadas.** A
folha declara `--alert-bg`, `--alert-fg`, `--alert-body-fg`, `--alert-border` e
`--alert-glow` no PRÓPRIO `.nds-alert`, e cada variante semântica só
RE-APONTA esses cinco:

| variante | fundo e borda | ícone e título | texto corrido |
|---|---|---|---|
| `default` | `--muted` / `--border` | `--card-foreground` | `--foreground` |
| `destructive` | `--destructive` com alfa | `--destructive` | `--destructive-foreground` |
| `success` | `--success` com alfa | `--success` | `--success-foreground` |
| `warning` | `--warning` com alfa | `--warning` | `--warning-foreground` |
| `info` | `--info` com alfa | `--info` | `--info-foreground` |

As cinco têm o MESMO conjunto de vars, e as quatro semânticas têm a mesma forma
exata: quatro linhas, sempre as mesmas quatro. O `default` é o único que não usa
alfa — ele lê `--muted`, que já é opaco.

**Título e ícone recebem a cor semântica na declaração da variante; o título a
PERDE logo depois**, num bloco por variante que o devolve para
`--X-foreground` (D7). Ou seja: `--alert-fg` é hoje a cor do ÍCONE, e o nome não
diz mais isso.

**Onde a cor semântica pinta de fato, por variante**: fundo, borda e ícone. Nunca
título nem texto corrido — nas cinco variantes, nos três temas, nos dois modos.

**Alfas, porque são o que de fato muda entre modos e variantes**:
`--alert-bg-alpha` é 0.1 no claro, 0.2 no escuro e **0.32 no `destructive`
escuro**; `--alert-border-alpha` é 0.3 e **0.42 no `destructive` escuro**. Ver D5
e D6.

**Literais, e por que são literais**: as entrelinhas (1.5 na caixa, 1.4 no título,
1.625 no parágrafo) e o `letter-spacing: -0.01em` do título não têm escala de
token nesta casa; o `padding: 2px` do anel do gradiente é a espessura do próprio
anel (cobre a borda de 1px e avança 1px para dentro, sem mudar o tamanho da caixa
nem mover o texto); o `text-underline-offset: 3px` dos links; o `translate` de
`--spacing-0-5` no ícone, que o alinha com a primeira linha do título; e o **delay
de 3s** do gradiente, que é valor de produto — nenhuma duração da escala chega
perto. O `min-height: var(--spacing-4)` do título só é alcançado por título
vazio: 14px × 1.4 já dá 19,6px.

**Sem sombra.** A folha não declara `box-shadow` em nenhuma regra: o alerta está
EM FLUXO, não é superfície flutuante, e a separação vem da lavagem e da borda.

**Sem altura em lugar nenhum** — a caixa é resultado de `padding-block` mais
`line-height`, e cresce com a fonte do navegador (C15).

## 6. Estados

O Alert quase não tem estado: ele tem CONFIGURAÇÃO. A tabela do conteúdo
compartilhado chama a coluna de "Configuração" de propósito.

| estado | quando ocorre | o que muda |
|---|---|---|
| Completo | ícone + título + descrição | a exibição padrão: ícone na coluna 1, título, descrição abaixo |
| Sem título | o título é omitido | a descrição ocupa a coluna 2 sozinha; nada desloca |
| Sem ícone | nenhum `<svg>` filho direto | a coluna 1 vai a `0` e o vão a `0` — layout de coluna única |
| Sem anúncio | `role="note"` | sai da árvore de live regions; continua visível e legível |
| Inserção dinâmica | montado depois do carregamento | é o caso legítimo de `alert` ou `status`; o papel da raiz já anuncia, sem `aria-live` em volta (C13) |
| Entrando | só no `dismissible`, na montagem | `.nds-animate-in`: opacidade 0→1 e `scale(0.95)`→1, em `--duration-spring` com `--ease-spring` |
| Saindo | o X foi acionado | `.nds-animate-out` (`--duration-base`, `--ease-exit`, `forwards`); no fim o nó sai — ver §7 para o que o Angular faz aqui |
| Fechado | a saída terminou | o alerta não está mais na tela e o callback já disparou, uma vez só |

**As durações da entrada e da saída vivem em `utilities.css`, não em
`alert.css`** — as classes são compartilhadas com qualquer componente que apareça
ou suma em runtime, e por isso não entram na tabela do §5.

**Movimento reduzido**: as duas classes param sob `prefers-reduced-motion` no
bloco de `utilities.css` que vem imediatamente depois delas, e o gradiente para
duas vezes — a duração sai de `--duration-stately`, que `motion.css` zera sob a
preferência, e o fim de `alert.css` ainda declara `animation: none` explícito.
Cinto e suspensório aqui é deliberado: o `delay` de 3s é literal e não seria
zerado pela camada de token.

## 7. API

Props compartilhadas — mesmo conceito nas cinco, e o nome só muda onde o
framework obriga:

| prop | tipo | padrão |
|---|---|---|
| `variant` | `default \| destructive \| success \| warning \| info` | `default` |
| `role` | `alert \| status \| note` | `alert` |
| `dismissible` | boolean | `false` |
| `dismissLabel` | string | `'Fechar alerta'` |
| `onDismiss` | `() => void` | — |
| `className` / `class` | string | — |
| `as` (no título) | `h1..h6` | `h5` |

**O default `'Fechar alerta'` é literal em português dentro dos cinco
primitivos** — medido em 2026-09-13, as cinco escrevem a mesma string. É o mesmo
padrão do `closeLabel` do Sheet e do Dialog (`sheet.md` §7): o rótulo é
sobrescritível, e o default não passa por i18n.

### Divergências de forma, registradas e não "alinhadas"

Forma de API não tem fonte de verdade — cada framework tem a sua.

| stack | como difere |
|---|---|
| vue | não tem `onDismiss`: o fechamento é `emit('dismiss')`, e a prop de classe se chama `class`. `role` é declarado como PROP de propósito — isso o retira de `$attrs`, então o valor do componente é o único a chegar na raiz, sem atributo duplicado |
| angular | o callback é `output` `(dismiss)`, sem o prefixo `on`, que duplicaria a sintaxe do template; `variant` e `role` são `input`; `dismissible` usa `booleanAttribute` para aceitar a forma curta `<div ndsAlert dismissible>`, como o HTML faz com `disabled` |
| angular | **o nível do título é o ELEMENTO, não uma prop** — o seletor cobre `h1[ndsAlertTitle]` … `h6[ndsAlertTitle]`, e não há default a herdar |
| angular | **a descrição não tem tag amarrada**: `[ndsAlertDescription]` é seletor de atributo puro, para que uma descrição de uma linha possa ser `<div>` sem inventar um landmark vazio. Nas outras quatro é `<section>` cravado (D3) |
| angular | **fechar não remove o nó** — um componente não remove o próprio host. O `close()` escreve `hidden` no host (atributo HTML, não CSS inline, e tira o alerta também da árvore de acessibilidade) e emite `(dismiss)`; tirar o nó do DOM é do consumidor, com um `@if`/`@for` sobre o evento. As stories de lá mostram o padrão idiomático: `@for` com `track` sobre um contador. **Medido em 2026-09-14**: `hidden` sozinho não escondia nada, porque `.nds-alert { display: grid }` vence o `display: none` do agente de usuário — o alerta ficava na tela fora da árvore de acessibilidade, e só o `@for` das stories disfarçava. A folha ganhou `.nds-alert[hidden] { display: none }` (C16), e o snippet de fechamento das docs mostra o `@if` |
| vanilla | fábricas em vez de componentes: `createAlert(options)` devolve o `HTMLElement`, e `createAlertTitle`/`createAlertDescription`/`createAlertAction` são sub-fábricas. A raiz também recebe `data-dismissible="true"`, porque o snippet da story sai do `outerHTML` e configuração só no closure congelaria a caixa de código |
| vanilla | é a única com `queueMicrotask` reposicionando o botão de fechar para o fim (§4): quem compõe faz `appendChild` DEPOIS de `createAlert()`, então sem isso o X seria o primeiro filho |
| react | `Omit<React.ComponentProps<'div'>, 'role'>` para que o `role` do componente não seja sobrescrito por fallthrough |
| react | é a única em que o callback dispara num EFEITO separado, depois do commit que devolveu `null` — nas outras quatro ele é chamado no mesmo passo que marca o alerta como fechado (no vanilla, logo depois do `el.remove()`). Em todas as cinco ele dispara uma vez só, e a story planta um segundo acionamento para provar a guarda (C11) |

### Peças, por stack

Extraído dos exports e dos seletores do código.

| stack | peças |
|---|---|
| react | `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction` |
| vue | `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction`, mais `alertVariants` e o tipo `AlertVariants` do índice |
| svelte | `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction`, mais `alertVariants` e `AlertVariant`; o índice também reexporta as formas curtas `Root`, `Title`, `Description`, `Action` |
| vanilla | `createAlert`, `createAlertTitle`, `createAlertDescription`, `createAlertAction`, `createAlertIcon`, e os tipos `AlertVariant`, `AlertRole`, `AlertIconType` |
| angular | `div[ndsAlert]`, `h1..h6[ndsAlertTitle]`, `[ndsAlertDescription]`, `div[ndsAlertAction]`, `svg[ndsAlertIcon]` |

**Duas das cinco entregam uma peça de ÍCONE, e as três de framework não.** O
Vanilla tem `createAlertIcon(type)` e o Angular tem `svg[ndsAlertIcon]` com
`kind` obrigatório — as duas montam os nós do pacote `lucide` agnóstico, com
`aria-hidden` fixo. React, Vue e Svelte usam o ícone do wrapper da própria lib de
ícones diretamente no call site, e quem escreve é responsável pelo `aria-hidden`.
No Angular a diretiva ainda escreve `data-slot="alert-icon"`; nas outras quatro o
ícone não tem `data-slot` nenhum.

**Não é divergência a corrigir, e vale dizer por quê**: nas três de framework o
ícone é um componente de terceiro que já aceita `class` e `aria-hidden`, e
embrulhá-lo criaria uma peça que só existe para repassar props. Nas duas sem
framework de componente não há wrapper de ícone para importar — o pacote publica
uma lista `[tag, attrs]`, e construir nós é o caminho (também imune a XSS: não há
`innerHTML` no caminho).

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

### Stories e snippets, alinhados em 2026-09-15

A árvore de stories é a mesma nas cinco: quatro arquivos, **dezenove** stories,
os mesmos nomes e os mesmos `covers` (`Playground`; `Default`, `Destructive`,
`Success`, `Warning`, `Info`, `Dismissible`, `DismissibleByKeyboard`,
`Contrast`; `Complete`, `WithoutTitle`, `WithoutIcon`, `WithoutAnnouncement`,
`DynamicInsertion`; `WithIcon`, `WithAction`, `AdditionalClass`, `WithoutIcon`,
`WithActionAndDismiss`). As plays carregam as mesmas asserções: o `Playground`
segue o control `role` e confere as quatro classes de variante e o ícone; a
`Dismissible` afirma o X como último filho, a guarda de reentrância e a animação
de descendente nas duas fases; a `WithoutAnnouncement` conta os papéis; a
`DynamicInsertion` volta ao estado inicial antes de medir, para sobreviver ao
replay do painel Interactions no mesmo DOM.

As cinco têm construtor de snippet por story (o vanilla, por builder
parametrizado) e `alert.source.test.ts`; nenhuma põe `.nds-icon` no ícone do
alerta nem `aria-live` em volta dele; os snippets das docs pages ensinam o nível
do título (`as="h4"`, `as: 'h4'` ou `<h4 ndsAlertTitle>`).

**O que continua diferente, e por quê**: a forma de voltar ao estado inicial na
`DynamicInsertion` é do framework — sinal de módulo no react, vue e angular,
remoção do nó no vanilla, evento que o componente de story escuta no svelte, onde
o estado só se reinicia de dentro do componente. É divergência de API, não de
contrato: as cinco afirmam as mesmas três coisas depois do reinício.

**O painel Code das STORIES não ensina o `as`, nas cinco**: os construtores de
snippet escrevem o título no default (`<AlertTitle>` em react, vue e svelte,
`createAlertTitle({ text })` no vanilla, `<h5 ndsAlertTitle>` no angular),
enquanto os snippets das docs pages mostram `h4` (D4). Não é divergência entre
stacks — as cinco fazem igual —, é a decisão da D4 alcançando uma superfície e não
a outra. Nenhum `alert.source.test.ts` cobra o nível.

### Inconsistências entre stacks, medidas em 2026-09-15

Medido depois da passagem de `fix`, contra os cinco primitivos, `alert.css`, os
quatro arquivos de story e os construtores de snippet de cada stack, as cinco
docs pages e os cinco `analytics.ts`. **O que conferiu igual nas cinco**: `role`
com default `alert` e os três valores; as cinco variantes no mapa; `dismissLabel`
`'Fechar alerta'`; `as` tipado `h1..h6` com default `h5` (o angular pelo
elemento); descrição `<section>`; a guarda de `event.target` e o timeout nas
duas fases; a entrada animada só no `dismissible`; as dezenove stories com os
mesmos nomes e `covers`; as asserções citadas no contrato (`lastElementChild`,
`AnimationEvent` plantado, segundo acionamento com `toHaveBeenCalledTimes(1)`,
ausência de `tabindex`, `measureActionDismiss`, `themeContrast`, e o `hidden`
do angular); `alert_dismiss` com `component: 'alert'`, `label`
`demonstration`/`dismissible` e `location` `docs_demo`/`docs_variantes` nas
cinco páginas, e o mesmo tipo nos cinco `analytics.ts`; `role="note"` e título
`h3` no `DocsNotes` das cinco; título `h3` na demonstração e no Do & Don't e
`h4` nos cards. `audit.mjs alert` devolve zero achados.

1. **O snippet da composição "Com ícone" sai numa linha só na docs page do
   svelte.** `AlertDocs.svelte:489` publica
   `<Alert><Info …/><AlertTitle as="h4">…</AlertTitle><AlertDescription>…</AlertDescription></Alert>`
   sem quebra; react (`AlertDocs.tsx:557`) e vue (`AlertDocs.vue:257`) publicam o
   mesmo exemplo indentado, e vanilla e angular o geram por construtor em
   `alert.source.ts`, também indentado. Maioria (4): indentado.

## 8. Acessibilidade

**Atributos.** Raiz: `role` com um dos três valores (D1) e nada mais — nenhuma das
cinco escreve `aria-live`, `aria-atomic` ou `aria-label` na raiz. Ícone:
`aria-hidden="true"`. Botão de fechar: `aria-label` vindo de `dismissLabel`.

**`alert` interrompe e `status` não** — é essa a diferença que decide, e ela é do
leitor de tela, não do CSS: `role="alert"` é live region **assertiva**, então o
leitor abandona o que estava lendo e anuncia na hora; `role="status"` é polida e
espera a vez. `role="note"` não é live region nenhuma.

**Para um alerta que já está na página ao carregar, o certo é `note`** — e essa é
a frase que o componente inteiro existe para carregar hoje, porque o contrário
custou 48 docs pages travando o NVDA na seção de notas (D1). As cinco stacks
oferecem os três valores, e o `DocsNotes` das cinco usa `note`.

**Teclado.** A raiz não é focável e não tem `tabindex` (C10). O Tab percorre
apenas os controles internos — o botão de ação, o botão de fechar, links dentro
do texto —, e o Enter os aciona. A story `DismissibleByKeyboard` das cinco mede o
caminho de teclado com o foco no X.

**Contraste.** A regra do contêiner colorido é cumprida pelo lado mais exigente:
descrição E título em `--foreground` nas cinco variantes, ícone com a cor
semântica sobre o piso de 3:1 (D7). O contraste não depende da variante escolhida
nem do tema de marca, e é isso que a `Variants/Contrast` afirma nos três temas ×
dois modos.

**Cor nunca é o único indicador** (WCAG 1.4.1): as cinco variantes existem com
ícone e texto, e a guideline de cada stack repete a regra.

**O que NÃO se faz, de propósito:**

- não se escreve `aria-live` na raiz: o papel já é a live region, e os dois juntos
  são dois contratos no mesmo elemento;
- não se dá papel nem nome ao ícone — ele repete o que o título e a descrição
  dizem;
- não se prende foco nem se rouba foco: o alerta é alcançado, não apresentado.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `alert_dismiss` | o usuário aciona o botão de fechar | `{ component: "alert", label, location }` |

**O tipo é o mesmo nas cinco** (`analytics.ts`): `component: string`,
`label: string`, `location?: string`.

**`label` é id estável, não texto traduzido** — medido nas cinco docs pages em
2026-09-13: os únicos valores emitidos são `"demonstration"` e `"dismissible"`,
os dois pontos em que a página monta um alerta de verdade que fecha. É o que a
regra da casa exige: texto traduzido partiria o mesmo evento em três séries no
GA4.

**O evento nasce no CONSUMIDOR** (D11). O primitivo não importa analytics em
nenhuma stack; quem dispara é a docs page, no callback de fechamento — `onDismiss`
em react, svelte e vanilla, `@dismiss` no vue, `(dismiss)` no angular.

**Os três eventos de docs page** (`docs_page_view`, `docs_section_viewed`,
`language_switched`) são do andaime das páginas, não do componente, e aparecem na
tabela de analytics do conteúdo por serem o que a página de fato emite.

## 10. Reconstruir do zero

Ordem: folha → primitivo → sub-peças → stories → docs page.

**Comece pela folha, e pelas cinco vars internas.** Elas são o contrato: a
variante não redeclara propriedade nenhuma, ela RE-APONTA `--alert-bg`,
`--alert-fg`, `--alert-body-fg`, `--alert-border` e `--alert-glow`. Escrever
`background-color` dentro da variante é o defeito que a camada existe para
impedir.

**Armadilha de cada stack**, todas medidas:

- **vanilla** — quem compõe faz `appendChild` DEPOIS de `createAlert()`, então o
  botão de fechar precisa do `queueMicrotask` que o devolve para o fim; sem isso
  o leitor de tela anuncia "Fechar alerta" antes da mensagem.
- **react** — `role` tem de sair de `ComponentProps<'div'>` por `Omit`, ou o
  fallthrough de quem consome sobrescreve a decisão do componente. E o
  `onDismiss` vai por ref: o efeito que o dispara depende só de `dismissed`, para
  não re-disparar quando quem consome recria a função a cada render.
- **vue** — declarar `role` como PROP é o que o retira de `$attrs`. Sem isso
  chegam dois `role` na raiz.
- **svelte** — a classe de entrada precisa estar no PRIMEIRO render, e ler o valor
  inicial de `dismissible` no `$state` exige `svelte-ignore
  state_referenced_locally`; aplicá-la depois da montagem faz o alerta piscar em
  opacidade cheia antes de voltar a zero.
- **angular** — três de uma vez. O componente **não remove o próprio host**:
  "sair da tela" é o atributo `hidden`, e tirar o nó é do consumidor. O
  `data-slot` do botão de fechar **não pode ser escrito no template**, porque o
  host binding do `NdsButton` roda depois e o sobrescreve em silêncio — a
  correção é um `afterRenderEffect` que escreve o atributo depois da primeira
  detecção. E `#botaoFechar` precisa de `read: ElementRef`: numa tag com
  componente, o `#ref` resolve para a INSTÂNCIA, não para o elemento.
- **todas** — `animationend` borbulha. Sem a guarda de `event.target` a animação
  de um descendente encerra a fase do alerta antes da hora, e o timeout de
  segurança é o que garante que o nó sempre sai (D9).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, variantes, alfas, gradiente | `docs/shared/styles/nds/alert.css` |
| entrada e saída (classes compartilhadas) | `docs/shared/styles/nds/utilities.css` |
| texto das docs pages, props, critérios de teste | `docs/shared/content/alert/translations.json` |
| sonda de contraste nos três temas × dois modos (`themeContrast`, `themeReprovas`) e da geometria ação + fechar (`measureActionDismiss`) | `docs/shared/testing/alert-probe.ts` |
| divergências intencionais sobre libs e patches de API | `PATCHES.md` — `#alert-five-variants`, `#alert-title-desc-semantics`, `#alert-dismissible`, `#alert-role` |
| desenho e anotações de Dev Mode | Figma: conjunto `194-16`, docs `196-85`, spec do gradiente `197-85` |
| portões determinísticos | `node scripts/audit.mjs alert --json` |
| tabela de tokens × folha, nos dois sentidos | `node scripts/tabela-tokens.mjs alert` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo |

**Linha de base do auditor, medida em 2026-09-15**: `node scripts/audit.mjs alert
--json` devolve **zero achados**. Em 2026-09-13 eram 18 — 4 do Angular sobre
snippet, 9 de `identificador_pt` e 5 que o nascimento deste documento ligou —, e
as duas pendências abaixo fecharam na passagem de `fix` de 2026-09-14/15.

**FECHADA em 2026-09-13, no mesmo dia**: a regra da categoria virou
[`19-feedback.md`](../guidelines/19-feedback.md), o catálogo do Alert ficou aqui, e
as cópias de react, vue e svelte deixaram de existir — nada nelas era daquela
stack. O vanilla e o Angular mantêm um arquivo curto só com a mecânica própria
(fábrica que devolve elemento; diretiva por atributo). O texto da pendência fica
abaixo porque ele nomeia o que cada cópia afirmava de errado, e é isso que explica
por que cinco cópias não sobrevivem:

O que a migração encontrou, medido em 2026-09-13: o nascimento deste PRD liga
`catalogo_duplicado_com_prd` nas CINCO stacks: `## Alert` continua em
`nortear-design-system-<stack>/guidelines/07-feedback-components.md`, e agora há
duas fontes para o mesmo componente. A regra de CATEGORIA daqueles arquivos
fica; o catálogo do Alert vem para cá. As cinco cópias já divergem entre si — a
do vanilla lista QUATRO variantes (falta `info`), a do svelte afirma que o
`role="alert"` é "aplicado automaticamente pelo Bits UI" (aquele primitivo não
usa lib nenhuma), react e vue não documentam a prop `role` e mandam pôr
`aria-live` no contêiner pai, e a do angular diz "fechar remove o alert" onde o
próprio primitivo escreve que não remove.

> **FECHADA · 2026-09-15** — o Angular publica o template da story no painel
> Code em **17 das 18 stories**: `alert.source.ts` de lá tem UM construtor
> (`alertPlaygroundSource`), contra 18 no vue, 13 no react, 13 no svelte e 7 no
> vanilla (onde um builder parametrizado serve todas). `audit.mjs` reprova os três
> arquivos por `story_file_sem_transform` e o módulo por `source_sem_teste` — a
> stack é a única sem `alert.source.test.ts`. É a mesma forma que o hover-card
> fechou em 2026-09-09 e o popover em 2026-09-13.
> **Fecha quando** as 17 stories tiverem construtor (ou exceção declarada com a
> premissa cobrada por caso), o `alert.source.test.ts` existir, e `audit.mjs`
> deixar de reportar `story_file_sem_transform` e `source_sem_teste` neste slug.
> **Como fechou**: `alert.source.ts` do Angular ganhou um construtor por story
> (e dois de template para a docs page), as dezenove stories têm `transform`, e o
> `alert.source.test.ts` novo cobra que todo exemplo de fechamento mostra o `@if`
> sobre o `(dismiss)` — o componente não remove o nó —, sem `@for` e sem
> `aria-live`. O auditor não reporta mais nenhuma das duas regras.

> **FECHADA · 2026-09-15** — nove achados de `identificador_pt` neste slug, em
> quatro stacks: `padrao` (react ×2, vanilla, angular), `novo` (react, vue,
> svelte, vanilla) e `com` (vanilla). São nomes que a campanha de tradução de
> identificadores não pôde varrer, e a lista de motivos está em
> `docs/shared/primitives/identificadores-pt.ts`.
> **Fecha quando** `node scripts/audit.mjs alert --json` deixar de reportar
> `identificador_pt` neste slug.
> **Como fechou**: `padrao`/`nota` viraram `defaultAlert`/`noteAlert` nas stories e
> `defaultBlock`/`noteBlock` no source do react; `novo` virou `freshAlert`; `com`
> virou `withDismiss`. Na mesma rodada os exports e os componentes de story com
> nome em português saíram também (`alertSucessoSource` → `alertSuccessSource`,
> `AlertDismissivelStory` → `AlertDismissibleStory` e afins), embora nenhum
> portão os cobrasse.

> **PENDÊNCIA · 2026-09-15** — seis exportações de `docs/shared/testing/alert-probe.ts`
> não são usadas em lugar nenhum do repositório: `measureAlert`, `measureAlertIn`,
> `contrastNosDoisThemes`, `backgroundCamadas`, `themeResumir` e
> `measureSemantica`. As stories do Alert importam só `themeContrast`,
> `themeReprovas` e `measureActionDismiss`; as outras seis sondas que leem o
> arquivo usam `contraste`, `backgroundEffective`, `darkLigarTheme`,
> `describeFailures`, `documentByTheme` e `superficieDoApp`. A "semântica"
> que a sonda anunciava não é medida por ela: quem cobre papel e estrutura são as
> plays (`WithoutAnnouncement`, `DynamicInsertion`, `Playground`).
> **Fecha quando**: as seis saem do arquivo, ou uma story das cinco stacks passa a
> usá-las.

> **PENDÊNCIA · 2026-09-15** — o painel Code das stories mostra o título no nível
> default nas cinco stacks, e o snippet "Com ícone" da docs page do svelte sai numa
> linha só (§7, inconsistência 1).
> **Fecha quando**: os construtores de snippet das cinco escrevem o nível do título
> como as docs pages (`as="h4"`, `as: 'h4'` ou `<h4 ndsAlertTitle>`) com asserção
> no `alert.source.test.ts`, e `AlertDocs.svelte` publica o snippet indentado.
