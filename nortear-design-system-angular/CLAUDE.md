# CLAUDE.md — nortear-design-system-angular

Guia para o Claude Code neste stack. Leia o `CLAUDE.md` da raiz primeiro: as
convenções cross-stack (conteúdo compartilhado, `.nds-*`, SEO, analytics)
valem aqui sem alteração.

## Estado

**Spike validado, não é o stack completo.** Existe um componente ponta a ponta
(`button`) com stories, docs page de 16 seções e as 15 seções genéricas
portadas. Os outros 47 componentes ainda não existem.

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

Três coisas custaram tempo no spike. Nenhuma dá erro vermelho — todas falham
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

### 3. O contexto de template não tem globais

`String(...)`, `Object.keys(...)` e afins não existem numa expressão de
template Angular (erro em runtime: `ctx.String is not a function`). Exponha um
`computed` no componente.

## Convenções deste stack

- **Componentes com seletor de atributo** (`button[ndsButton]`, `span[ndsBadge]`):
  o host é o elemento nativo, então o markup fica idêntico ao do Vanilla e o CSS
  `.nds-*` casa sem wrapper.
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
- **`DOMPurify.sanitize()` vai no próprio binding `[innerHTML]`**, com
  `protected readonly DOMPurify = DOMPurify` expondo o módulo ao template.
  O `[innerHTML]` do Angular já passa pelo DomSanitizer do framework — a
  exigência não é redundância defensiva, é a guideline 09: Qwiet/CodeQL só
  reconhecem o sanitizador de taint quando a chamada está no call site. Um
  `computed` `safe*` esconderia a chamada e viraria falso positivo permanente
  de XSS. `node scripts/audit.mjs <slug> --category security` é o portão.

## Pendências conhecidas

- As 101 chaves `*Code` já têm variante `angular` (cobertura 101/0), mas **46
  delas descrevem componentes que ainda não existem neste stack** — foram
  escritas a partir dos seletores reais do `@radix-ng/primitives` e valem como
  contrato a cumprir, não como registro do que está implementado. Ao criar um
  componente, confira o snippet contra o que você implementou e corrija o
  conteúdo compartilhado se divergir.
- `node scripts/audit.mjs button` acusa **9 `contract_divergent`**: critérios de
  teste cobertos nas outras quatro e não aqui. Não é ruído — o stack tem duas
  stories (Playground, Variantes) contra as cinco das outras. Fecha sozinho
  quando as stories de tamanhos/estados/composições existirem.
- Os 46 componentes restantes não existem — só o `button` está implementado.
- O bridge `withAutoDocsTab` (React → Angular) não é coberto por teste: o
  `docs-smoke` renderiza a docs page direto, como nas outras stacks. A aba
  "Documentação" foi verificada em navegador manualmente no spike.
