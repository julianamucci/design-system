# CLAUDE.md — nortear-design-system-angular

Guia para o Claude Code neste stack. Leia o `CLAUDE.md` da raiz primeiro: as
convenções cross-stack (conteúdo compartilhado, `.nds-*`, SEO, analytics)
valem aqui sem alteração.

## Estado

**Completo.** Os 47 componentes têm primitivo, stories e docs page com as 15
seções genéricas (14 ou 13 onde o conteúdo compartilhado não traz composições ou
estados), e as 16 páginas de **Foundations** alcançaram as outras quatro stacks.

Portões no fecho: `tsc` limpo, suíte com 168 arquivos e 524 testes verdes,
`docs-smoke` com as **63 páginas** passando no contrato de conteúdo e no axe, e
`node scripts/audit.mjs --all` com **24 achados** para `stack === 'angular'` —
todos `missing_section`, 12 em `icons` e 12 em `theme-colors`. São páginas de
galeria, sem as 15 seções, e o auditor não tem escape para elas: **as outras
quatro stacks carregam exatamente os mesmos 12+12**, conferido. Zero de qualquer
outra regra.

O que sobrou de aberto não é implementação: são decisões de conteúdo
compartilhado e de auditoria, registradas em `.pipeline-context/_ordem.md`.

## O que é

Angular 22 + `@radix-ng/primitives` (headless) + o CSS `.nds-*` compartilhado.
Porta **6010**.

O Radix NG 1.x segue a anatomia do Base UI (`Root`/`Trigger`/`Positioner`/
`Popup`), a mesma que o stack React usa via `@base-ui/react` — na dúvida sobre
a forma de um primitivo, o React é o parente mais próximo. Para **markup e
classes**, porém, a referência continua sendo o Vanilla.

## Comandos

```bash
npm run storybook        # 6010
npm run build-storybook
npm test                 # Storybook Test (vitest browser) — play + axe
npx tsc -p .storybook/tsconfig.json --noEmit   # checagem de tipos
```

## Armadilhas específicas deste stack

Cinco coisas já custaram tempo aqui. Nenhuma dá erro vermelho — todas falham
em silêncio.

### 1. `noEmit: true` mata o AOT (e o sintoma é NG0303)

O `tsconfig.json` deste pacote **não pode** ter `noEmit: true`. O
`@analogjs/vite-plugin-angular` compila cada arquivo pelo emissor do
`@angular/compiler-cli`; sob `noEmit` o emissor devolve vazio, o plugin trata o
arquivo como fora do programa TypeScript e o Angular cai no fallback **JIT**.

O JIT compila o decorator — então `host` bindings funcionam e o componente
renderiza — mas **não enxerga inputs declarados com `input()`**. Resultado:
`NG0303: Can't bind to 'variant'` no console e o componente renderizando com os
valores default. Uma story que só exercita o default passa e esconde tudo.

Para checar tipos use `tsc --noEmit` na linha de comando. Sinal de alerta no
log: `"… contains Angular decorators but is not in the TypeScript program"`.

**Toda story de variação precisa afirmar a classe resultante** (ver
`button-variantes.stories.ts`) — é o que impede este defeito de voltar.

### 2. `compodoc: false` é obrigatório

O preset do `@storybook/angular-vite` roda `compodoc -p tsconfig.json -e json -d .`
e o compodoc atual não aceita mais `-e`. A etapa falha em todo run, inclusive
dentro do vitest. Controls e aba API Reference saem de `argTypes` escritos à mão
— mesma decisão do `docgen: false` no Svelte.

### 3. O painel Code mostra o andaime da story, não o uso

O renderer Angular imprime no painel Code o `template` da story literalmente —
com o `@if` que alterna exemplos e com `[orientation]="orientation"` ligado ao
arg. É o que a pessoa copia, e não é o que ela deve escrever.

Toda Playground precisa de `parameters.docs.source.transform` devolvendo o uso
real a partir de `ctx.args` (ver `separator.stories.ts` e `button.stories.ts`).
**Nenhum teste alcança esse painel**: o `play` roda no canvas, não no
addon-docs. Só se vê abrindo a story.

### 4. O contexto de template não tem globais

`String(...)`, `Object.keys(...)` e afins não existem numa expressão de
template Angular (erro em runtime: `ctx.String is not a function`). Exponha um
`computed` no componente.

### 5. Função em `args` sem `argTypes` não chega ao template

O renderer Angular do Storybook só repassa em `props` o que tem entrada em
`argTypes`. Uma função declarada apenas em `args` — um `fn()` de espião, por
exemplo — **não** chega ao template, e o `(click)="onClick($event)"` fica
ligado a nada.

Não há erro: o botão simplesmente não responde, e o teste falha com
"expected onClick to be called at least once" apontando para o componente, que
está correto. Custou uma sonda para descobrir que nem o clique chegava.

```ts
argTypes: {
  onClick: { control: false, table: { disable: true } },
},
args: { onClick: fn() },
```

### 6. Subcaminho do Radix NG não pré-empacotado duplica o `@angular/core`

Já resolvida no `.storybook/main.ts`, mas vale saber reconhecer: se voltar a
aparecer `Cannot read properties of null (reading 'firstCreatePass')` ou
`NG0203` em **todas** as stories de um componente novo, não é o componente.

O Vite descobria cada subcaminho de `@radix-ng/primitives` no momento em que a
primeira story o importava e refazia o optimize em rodadas separadas; o
subcaminho que entrava tarde trazia uma segunda cópia do `@angular/core`, e as
duas não compartilham o estado interno do compilador. O `viteFinal` agora
pré-empacota todos os subcaminhos de uma vez, lendo a lista do `exports` do
próprio pacote — componente novo não exige editar nada.

Se o cache já estiver envenenado de um run anterior, apague
`node_modules/.cache/storybook`.

Custou tempo em `switch`, `toggle` e `slider` antes de virar regra.

### 7. Input de host directive aninhada é exposto junto

`hostDirectives: [{ directive: X, inputs: [...] }]` restringe o que **X** expõe.
Não alcança o que as host directives DE X expõem: essas continuam ligáveis no
elemento, mesmo fora da sua lista.

Foi o que aconteceu no `slider`. O `RdxSliderRoot` tem o `RdxControlValueAccessor`
como host directive, e o acessor recebia o `[value]` escrito no elemento mesmo
sem `value` na lista. Como o primitivo decide se é intervalo por
`Array.isArray(value)`, `[50]` virava uma faixa de 50% a 50% — preenchimento de
largura zero, sem erro nenhum, e a alça no lugar certo disfarçando.

Antes de compor, olhe as host directives do primitivo, não só os inputs dele.

### 8. Duas `<ng-content>` em ramos de `@if` engolem o conteúdo

Um componente com dois destinos de projeção padrão — um em cada ramo de um
`@if` — não entrega o conteúdo a **nenhum** dos dois. A projeção é resolvida em
tempo de compilação, antes de existir ramo ativo.

Não há erro: o componente renderiza vazio, com os wrappers no lugar. Custou uma
sonda de `outerHTML` no `sidebar` para achar.

A saída é uma `<ng-content>` só, guardada num `<ng-template>` e instanciada onde
faz falta. O `<ng-container>` não deixa elemento no DOM:

```html
<ng-template #conteudo><ng-content /></ng-template>

@if (semRecolhimento()) {
  <ng-container [ngTemplateOutlet]="conteudo" />
} @else {
  <div class="wrapper"><ng-container [ngTemplateOutlet]="conteudo" /></div>
}
```

### 9. `input()` no construtor devolve o default, não o valor ligado

Ler `this.meuInput()` no construtor dá o valor declarado no componente — o
binding de quem consome ainda não foi aplicado. Inicialização que dependa de
input vai em `ngOnInit`.

No `sidebar` isso fez `[defaultOpen]="false"` ser ignorado: a barra nascia
aberta, sem erro, só com o estado errado.

### 10. `(click)` no `host` corre DEPOIS do `(click)` de quem consome

Um listener declarado em `host: { '(click)': '...' }` é registrado depois do
`(click)` que o consumidor escreve no mesmo elemento. `stopImmediatePropagation()`
a partir dele não alcança ninguém — o handler de quem usa já disparou.

Apareceu no `pagination`: o link desabilitado continuava chamando o callback da
página. Para barrar de verdade, registre no construtor com
`addEventListener(..., { capture: true })` e leia o estado na hora do clique.

### 11. Duas diretivas no mesmo elemento disputam `data-slot`

`data-slot` é ligado por host binding em quase todo componente deste stack. Com
duas diretivas no mesmo host — `<button ndsSidebarMenuButton ndsTooltipTrigger>`,
`<button ndsDialogClose ndsButton>`, `<input ndsInput ndsInputGroupInput>` — as
duas escrevem o mesmo atributo e uma sobrescreve a outra, sem ordem garantida.

Custa caro porque `data-slot` é o contrato de markup que as cinco stacks
compartilham e que a auditoria compara: o elemento perde a identidade que os
testes e o CSS usam para achá-lo, sem erro nenhum.

Quando compor for inevitável, a peça que se compõe **não** liga `data-slot`
(foi a saída no `NdsDialogClose`) ou traz a classe base junto para dispensar a
outra diretiva (foi a saída no `NdsInputGroupInput`). Em teste, procure pela
classe `.nds-*`, não pelo `data-slot`.

## Convenções deste stack

- **Componentes com seletor de atributo** (`button[ndsButton]`, `span[ndsBadge]`):
  o host é o elemento nativo, então o markup fica idêntico ao do Vanilla e o CSS
  `.nds-*` casa sem wrapper.
- **`@Directive` quando não há template.** Se o componente só aplica atributos e
  classes a um elemento que já existe — sem `<ng-content>`, sem markup próprio —
  use `@Directive`. Um `@Component` com `template: ''` cria view e ciclo de
  detecção para renderizar nada. `NdsSeparator` é o modelo. Componentes que
  projetam conteúdo (`NdsButton`, `NdsCard`, `NdsBadge`) seguem `@Component`.
- **Nunca criar um input `class`.** O Angular já mescla o `class` que o
  consumidor escreve no elemento com o que o componente declara — tanto com
  `host: { class: '...' }` estático quanto com host binding `[class]` dinâmico.
  Verificado em teste (`separator-composicoes` e `button-variantes` afirmam a
  coexistência das duas classes). Um input `class` + `cn()` é hábito de
  `className` do React, onde a prop sobrescreve; aqui só duplica o framework.
  - Classe fixa → `host: { class: 'nds-x' }`, sem `computed`.
  - Classe que depende de input (variante, tamanho) → `host: { '[class]': 'hostClass()' }`
    com o `computed` montando **só** as classes do próprio componente.
  - **Exceção: SVG.** `NdsButtonIcon` usa `[attr.class]` porque `className` em
    SVG é `SVGAnimatedString` e não aceita binding de classe — ali o atributo
    sobrescreve, então o input de classe é necessário.
- **`ViewEncapsulation.None` em todo componente de UI.** Nenhum declara `styles`
  próprios — o visual inteiro vem de `@shared/styles/nds/`, que é global.
  Encapsulamento só emitiria atributos `_ngcontent-*` inúteis.
- **Preview de docs é `TemplateRef`, não factory.** `DocsDoDont` e `DocsVariants`
  recebem `TemplateRef` e instanciam com `ngTemplateOutlet`; a docs page declara
  `<ng-template #x>` com componentes reais e bindings. Montar DOM à mão perderia
  change detection.
- **i18n é signal, não subscribe.** `useTranslation()` devolve `t`/`dict`; um
  `computed` que lê `dict()` re-renderiza sozinho na troca de idioma. Não existe
  o `subscribe` + rebuild manual do Vanilla.
- **Zoneless.** `provideZonelessChangeDetection()` no `preview.ts` e no bridge do
  `withAutoDocsTab`. O Radix NG é signals-first; não introduza dependência de zone.
- **Ícones vêm do pacote `lucide`** (agnóstico), não de `lucide-angular` — este
  declara peer `@angular/core: 13.x - 21.x` e conflita com o Angular 22.
- **Nunca invente classe `.nds-*`.** Prefixo certo não quer dizer que a regra
  existe: `nds-skeleton-line` e `nds-p-3` têm cara de válidas e não pintam nada.
  Confira em `docs/shared/styles/nds/` antes de usar; se faltar a regra, crie no
  CSS compartilhado seguindo o Vanilla. Portão: `node scripts/audit.mjs <slug>`,
  regra `unknown_class_reference`.
- **Nunca escreva CSS inline.** Sem `style="…"`, sem `[style]`. Medida que falta
  vira regra no CSS compartilhado, com token da escada `--spacing-*` (o grid de
  8px) ou `--size-*`. E **altura não se crava**: nasce de `padding-block` mais
  tipografia, para o bloco crescer junto quando a pessoa aumenta a fonte do
  navegador (guideline 12, WCAG 1.4.4). Quando a variação é escolha de quem usa
  — forma e largura de um esqueleto, por exemplo — exponha `data-*`, como
  `data-spacing` e `data-size` já fazem no resto do sistema.
- **`DOMPurify.sanitize()` vai no próprio binding `[innerHTML]`**, com
  `protected readonly DOMPurify = DOMPurify` expondo o módulo ao template.
  O `[innerHTML]` do Angular já passa pelo DomSanitizer do framework — a
  exigência não é redundância defensiva, é a guideline 09: Qwiet/CodeQL só
  reconhecem o sanitizador de taint quando a chamada está no call site. Um
  `computed` `safe*` esconderia a chamada e viraria falso positivo permanente
  de XSS. `node scripts/audit.mjs <slug> --category security` é o portão.

### 12. Diretiva de `@angular/common` faltando no `imports` não dá erro

`[ngTemplateOutlet]` num `<ng-container>` sem `NgTemplateOutlet` no `imports`
vira binding para propriedade inexistente: **NG0303 no console e nada mais**. A
página renderiza inteira, o `tsc` passa (ele não valida template Angular) e o
teste fica verde — o que some é só o que aquele outlet ia instanciar.

Custou dez setas de expansão invisíveis na `CollapsibleDocs`, achadas lendo o
log de uma rodada que tinha passado. Vale para `NgClass`, `NgStyle`, `NgIf` e
companhia. Quando um preview aparecer vazio sem motivo, procure NG0303 no log
antes de procurar no CSS.

## Pendências conhecidas

Nenhuma de implementação. As abertas são de conteúdo compartilhado e de
auditoria, e estão detalhadas em `.pipeline-context/_ordem.md`:

- **`sonner.states` não vira seção.** O nó só tem `title` e `items`, os dois
  engolidos pelo `SECTION_HEADERS` do `audit.mjs` — então `hasKeys` dá falso e
  renderizar a seção é cobrado como `section_without_content`. É o achado que as
  outras quatro stacks carregam hoje. Consertar a regra do auditor ou aceitar o
  achado nas cinco é decisão de quem mantém.
- **`--chart-1` a `--chart-5` não têm variante escura** em lugar nenhum
  (`:root` e as três marcas, e o `themes/default.css` diz isso explicitamente).
  `--chart-5` é `210 71% 23%` sobre fundo escuro. A `chart-estados` afirma o
  recolorir pelo texto dos eixos, que tem variante; a paleta em si é decisão de
  design pendente.
- **`resizable` não tem regra para `[data-disabled]` no punho**, e o conteúdo
  pede "sem cursor de resize". O estado é testado por comportamento.
- O bridge `withAutoDocsTab` (React → Angular) não é coberto por teste: o
  `docs-smoke` renderiza a docs page direto, como nas outras stacks. A aba
  "Documentação" foi verificada em navegador manualmente no spike.
