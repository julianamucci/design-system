# Arquitetura do Projeto (Nortear — Angular · Storybook-Centric)

## Interface principal

O **Storybook** é a interface de documentação. Este pacote **não tem sandbox** `App`/`main`: as outras stacks têm um, e aqui a única entrada é o Storybook.

```bash
npm run storybook                                # porta 6010
npm run build                                    # portão de tipos (ngc --noEmit) — ver abaixo
npm run build-storybook                          # build + geração de arquivos de SEO + minificação
npm test                                         # Storybook Test (vitest browser) — play + axe
npm run lint
npm run chromatic
```

### Por que o `build` daqui não empacota nada

Este pacote não tem sandbox, não tem `index.html`, não tem `angular.json` e não publica biblioteca: o artefato é o Storybook, e ele já tem script próprio (`build-storybook`). Inventar um `vite build` aqui só produziria um alvo sem entrada. O script `build` é checagem de tipos, e só ela.

**Esta stack passou a ser o modelo.** Até 2026-09-02 as outras quatro faziam `build = <checagem de tipos> && vite build`, e a segunda metade empacotava um sandbox (`App`/`main` + `index.html`) que nenhum `vercel.json` publicava. O sandbox foi removido das quatro, e o `build` delas virou o que sempre foi aqui: só a primeira metade.

O que se perdeu com o `vite build` foi a resolução de **CSS** — nenhum dos cinco checadores de tipo abre folha de estilo. `@import` quebrado em `globals.css` só reprova no `build-storybook`.

### O portão é `ngc`, não `tsc`

`tsc --noEmit` passa neste pacote e sempre passou — porque não olha template nenhum. O `angularCompilerOptions.strictTemplates` estava declarado no `tsconfig.json` e **nada o executava**: `ngc --noEmit` é o análogo do `vue-tsc` e do `svelte-check`, e é ele que checa binding, `$event` e diretiva do template junto com o TypeScript.

Ao ser ligado pela primeira vez ele achou, em código que a suíte dava por verde: um `$event` de item de marcação recebido como `boolean` quando o primitivo emite três estados; um `$event` de aba recebido como texto quando o primitivo emite texto, número ou vazio; e quatro `<svg ndsLucideGlyph [ndsLucideGlyph]="…">` com o atributo estático repetido ao lado do binding, o que atribuía `''` a um input que espera nó de ícone.

`--noEmit` na LINHA DE COMANDO é seguro e é o uso correto; o que não pode é a flag dentro do `tsconfig.json` (§1 abaixo).

**Classe de componente usada em template precisa ser `export`ada.** O compilador gera um arquivo `*.ngtypecheck.ts` que **importa** cada peça usada no template; símbolo não exportado quebra a geração com `NG3004` e o erro sai sem linha útil. Oito ícones e utilitários internos deste pacote estavam sem `export` — nenhum é API pública, e nenhum barril os reexporta.

---

## Estrutura de Diretórios

```
nortear-design-system-angular/
├── .storybook/
│   ├── main.ts                  # @storybook/angular-vite, addons, viteFinal
│   ├── preview.ts               # providers, decorators, toolbar, storySort
│   ├── tsconfig.json            # o tsconfig que o plugin Angular usa
│   ├── manager-head.html        # GA4 (no manager, NÃO no iframe)
│   ├── preview-head.html        # sync de tema no iframe
│   └── manager.ts               # tema do shell do Storybook
│
├── src/
│   ├── components/
│   │   ├── ui/                  # primitivos + stories
│   │   │   ├── alert.ts                       # NdsAlert e as diretivas irmãs
│   │   │   ├── alert.stories.ts               # Playground + docs.page
│   │   │   ├── alert-variantes.stories.ts
│   │   │   ├── alert-estados.stories.ts
│   │   │   └── alert-composicoes.stories.ts
│   │   │
│   │   ├── docs/                # docs pages
│   │   │   ├── AlertDocs.ts                   # NdsAlertDocs (componente)
│   │   │   ├── ThemeSystemDocs.ts             # página de fundamento
│   │   │   ├── ThemeSystemDocs.mdx            # entrada MDX da mesma página
│   │   │   ├── docs-smoke.stories.ts          # contrato de conteúdo + axe de TODAS as páginas
│   │   │   └── shared/
│   │   │       ├── DocsNav.ts
│   │   │       ├── FoundationPage.ts
│   │   │       ├── LucideGlyph.ts
│   │   │       ├── Swatch.ts
│   │   │       └── sections/                  # 16 containers + DocsPageLayout
│   │   │
│   │   └── product/             # LanguageSwitcher e afins
│   │
│   ├── lib/
│   │   ├── i18n.ts                 # useTranslation (signals) + locale global
│   │   ├── analytics.ts            # track() tipado; GA4 vive no manager
│   │   ├── use-seo.ts              # applySeo() → devolve cleanup
│   │   ├── use-active-section.ts   # IntersectionObserver (onActive / onDwell)
│   │   ├── docs-tracking.ts        # observer de clique via data-track*
│   │   ├── motion.ts               # tokens de duração/easing + prefersReducedMotion()
│   │   ├── strip-html.ts           # stripHtml e toPlainText
│   │   ├── wait-for-portal.ts      # esperarPortal + a regra de âncora de foco
│   │   ├── withAutoDocsTab.ts      # bridge Angular → React para o Docs tab
│   │   ├── montarAngularEmReact.ts # o mecanismo do bridge
│   │   ├── reload-on-chunk-error.ts
│   │   └── utils.ts                # cn()
│   │
│   ├── i18n/ui.json             # textos da moldura (nav, rótulos comuns)
│   ├── styles/                  # só importa o CSS compartilhado
│   └── types/
│
├── tsconfig.json                ← LEIA a seção "noEmit" abaixo antes de editar
├── eslint.config.js             # flat config; ver "Lint" abaixo
├── vercel.json                  # igual nas cinco stacks
├── vite.config.ts
└── chromatic.config.json
```

O conteúdo das docs pages **não** mora aqui: vem de `docs/shared/content/<slug>/translations.json`, pelo alias `@shared`.

---

## Movimento reduzido é uma pergunta só

`src/lib/motion.ts` lê os tokens de `motion.css` (duração, easing, offset) e responde `prefersReducedMotion()` pelas **duas** vias que o projeto reconhece: a preferência real do sistema e o override `data-reduced-motion` que o toolbar "Motion" do Storybook escreve no `<html>`. Quem for animar em JS pergunta a ele; ninguém reescreve a checagem localmente. Já custou uma vez: a mola da página de fundamento de Motion perguntava só pela media query e continuava correndo com o toolbar em movimento reduzido.

Os consumidores são o Chart — que passa duração e liga/desliga a animação do ECharts, como nas outras stacks —, o carrossel e a página de Motion.

---

## Lint

`npm run lint` roda `eslint .` sobre a flat config da raiz do pacote. A espinha é a mesma das outras quatro stacks — `js.recommended` + `typescript-eslint` + `unused-imports` + `eslint-plugin-storybook`, com os mesmos ignores. O que é idioma daqui:

| Item | Decisão |
|---|---|
| `angular-eslint` (`tsRecommended`) | ligado |
| `processInlineTemplates` + `templateRecommended` | ligado — não há arquivo `.html` no pacote, todo template é inline, e sem o processor as regras de template não veriam nada |
| `@angular-eslint/directive-selector` | `error`, prefixo `nds`, atributo, camelCase |
| `@angular-eslint/component-selector` | **desligado**: mais da metade dos componentes usa seletor de atributo (`div[ndsAlert]`) e a regra aceita um único `style` |
| `@angular-eslint/no-output-on-prefix` | **desligado**: os nomes `on*` são outputs do `@radix-ng/primitives` re-expostos por `hostDirectives`, mais o `onSelect` próprio do command, que existe para não colidir com o evento `select` do DOM |
| `templateAccessibility` | **desligado**: acusa diretiva que injeta conteúdo e wiring em tempo de execução como se fosse elemento vazio. Acessibilidade é medida por axe sobre o DOM montado, em toda story |

As três linhas "desligado" não são atalho: cada uma foi medida contra o código existente antes de decidir. Se você for religar uma, meça de novo — o custo está anotado aqui para não ser redescoberto.

---

## Aliases

| Alias | Aponta para |
|---|---|
| `@/*` | `./src/*` |
| `@shared/*` | `../docs/shared/*` |

Os dois precisam existir em **três** lugares: `tsconfig.json`, `vite.config.ts` e o `viteFinal` do `.storybook/main.ts`. O framework Angular monta a própria config do Vite e **não herda** o `resolve.alias` do `vite.config.ts` da raiz do pacote — por isso o alias é reaplicado no `viteFinal`.

---

## Configuração de build — as três coisas que não se mexem

### 1. `noEmit: true` mata o AOT, e o sintoma é NG0303

O `tsconfig.json` deste pacote **não pode** ter `noEmit: true`.

O plugin Angular do Vite compila cada arquivo pelo emissor do compilador do Angular. Sob `noEmit` o emissor devolve vazio, o plugin trata o arquivo como fora do programa TypeScript e o Angular cai no fallback **JIT**.

O JIT compila o decorator — então host bindings funcionam e o componente renderiza — mas **não enxerga inputs declarados com `input()`**. Resultado: `NG0303: Can't bind to 'variant'` no console, e o componente renderizando com os valores default. Uma story que só exercita o default **passa e esconde tudo**.

- Para checar tipos, use `tsc --noEmit` na linha de comando, nunca a flag no arquivo
- Sinal de alerta no log: `"… contains Angular decorators but is not in the TypeScript program"`
- A defesa permanente é toda story de variação afirmar a classe resultante (ver `11-documentacao-componentes.md`)

O `tsconfig` apontado no `main.ts` usa caminho **absoluto**: o plugin resolve valor relativo contra a raiz do Vite, e essa raiz muda entre `storybook dev`, `storybook build` e o modo de teste.

### 2. `compodoc: false` é obrigatório

O preset do framework roda a extração de documentação com uma flag que a versão atual da ferramenta não aceita mais. A etapa falha em **todo** run, inclusive dentro do vitest.

Consequência assumida: controls e a aba API Reference saem de `argTypes` escritos à mão. Mesma decisão que a de desligar a extração automática no Svelte.

### 3. Os subcaminhos do Radix NG são pré-empacotados de uma vez

O `viteFinal` lê a lista de subcaminhos do próprio `exports` do pacote `@radix-ng/primitives` e a passa inteira para o pré-empacotamento do Vite.

Sem isso, o Vite descobre cada subcaminho no momento em que a primeira story o importa e refaz o pré-empacotamento em rodadas separadas. O subcaminho que entra tarde traz uma **segunda cópia** do núcleo do Angular, e as duas não compartilham o estado interno do compilador.

O erro que aparece é `Cannot read properties of null (reading 'firstCreatePass')` ou `NG0203` em **todas** as stories de um componente novo. Parece defeito do componente e não é. Custou tempo em três componentes antes de virar regra.

- A lista sai do `exports` do pacote, então **componente novo não exige editar nada**
- Se o cache estiver envenenado de um run anterior: apague `node_modules/.cache/storybook`

---

## Detecção de mudanças: zoneless

`provideZonelessChangeDetection()` está declarado no `preview.ts` (por `applicationConfig`, não em cada story) e no bridge do `withAutoDocsTab`, para que stories e docs pages rodem sob o mesmo modo.

O Radix NG é signals-first. **Não introduza dependência de zone** — nem `NgZone.run`, nem espera por `whenStable`.

---

## Navegação da sidebar

Configurada por `storySort` no `preview.ts`:

```ts
order: [
  'About',       [...],
  'Foundations', [...],
  'UI', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],
  '*',
]
```

Não existe lista de categorias mantida à mão, e agora é verdade: o filtro por categoria vem das `tags` do meta de cada arquivo de story, e a categoria também é a PASTA no título (`Primitives/<Categoria>/<Componente>`). As duas são conferidas uma contra a outra pela regra `story_sem_categoria` do `audit.mjs`.

Houve um `src/lib/story-tags.ts` que se dizia a fonte canônica desse mapeamento. Ninguém o importava, e ele estava desatualizado em vinte componentes — uma lista mantida à mão que ninguém mantinha. Saiu em 2026-08-31.

**Vocabulário da sidebar é inglês**, e há regra de auditoria que detecta nome em português — este stack já reintroduziu um no dia seguinte à normalização.

---

## Sistema de temas

Cinco dimensões, todas por classe no `<html>`, aplicadas por decorator no `preview.ts`:

| Dimensão | Mecanismo |
|---|---|
| Claro/escuro | decorator de tema por classe |
| Marca, densidade, fonte, escala e base tipográfica | decorator próprio que reescreve as classes do `<html>` |
| Movimento reduzido | `data-reduced-motion` no `<html>` |
| Carregamento inicial no Docs tab | script no `preview-head.html`, que lê os globals da URL |

O decorator **preserva** as classes que não são dele antes de reescrever — é o que evita apagar a classe de modo escuro ao trocar de marca.

> **Ponto aberto, medido e não resolvido.** Nas stacks React, Vue e Svelte há uma armadilha conhecida: aplicar as classes só por decorator com efeito nunca reverte para o default, porque aqueles renderers pulam a re-renderização do decorator quando a toolbar volta ao valor inicial. A saída lá foi assinar o canal de globals (`GLOBALS_UPDATED` e `SET_GLOBALS`) em **escopo de módulo**, guardado por verificação de `document`.
>
> Este stack **não tem** essa assinatura — nem o Vanilla tem. Nos dois, o decorator reescreve `html.className` inteiro a cada execução, o que faria o retorno ao default se resolver sozinho **se** o decorator rodar. Se ele roda no retorno ao default sob o renderer Angular não foi verificado: exige abrir a toolbar e voltar ao valor inicial em cada uma das cinco dimensões, e isso não é coberto por teste em nenhuma stack.
>
> Fica registrado como ponto a medir, não como "não se aplica". Se o retorno ao default falhar aqui, a correção é a mesma das outras três — assinatura em escopo de módulo — e não um remendo no decorator.

Para adicionar um tema:
1. Definir o CSS em `docs/shared/themes/novo-tema.css` (HSL sem vírgulas)
2. Importar em `docs/shared/themes/index.css`
3. Registrar no toolbar do `preview.ts` **e** no conjunto de classes que o decorator remove
4. Registrar no script de sync do `preview-head.html`
5. Atualizar `docs/shared/themes/theme-config.ts`

---

## Analytics e SEO

GA4 vive em `manager-head.html` — **no manager, não no iframe** — com envio automático de página desligado. As docs pages rodam no iframe e `track()` encaminha os eventos para o `gtag` do documento de cima. No iframe, tudo seria registrado como uma única página.

**O repositório é público**: `manager-head.html` não pode carregar um identificador de medição real num commit.

`applySeo` detecta o iframe e escreve as meta tags no documento pai. Ver `11-documentacao-componentes.md` §3.

---

## Adicionar novo componente

**1.** Criar o primitivo em `src/components/ui/<slug>.ts` — diretiva de atributo quando possível, `@Directive` quando não há template, `ViewEncapsulation.None`, `data-slot` no host.

**2.** Verificar se as classes `.nds-*` existem em `docs/shared/styles/nds/`. Se faltar regra, criar **no compartilhado**, seguindo o Vanilla. Portão: `node scripts/audit.mjs <slug>`, regra `unknown_class_reference`.

**3.** Criar a docs page `src/components/docs/<Slug>Docs.ts`, consumindo `docs/shared/content/<slug>/translations.json`. Seguir `11-documentacao-componentes.md`.

**4.** Criar a story principal `<slug>.stories.ts` com `withAutoDocsTab`, `source.transform`, `argTypes` à mão e as `tags`.

**5.** Criar os arquivos de variação que **se aplicam** — não crie os que não se aplicam.

**6.** Acrescentar o export ao `docs-smoke.stories.ts`.

**7.** Rodar, na ordem: `npx tsc -p .storybook/tsconfig.json --noEmit`, `npm test`, `node scripts/audit.mjs <slug> --json`.

---

## Adicionar página de fundamento

O padrão é um par: o componente (`MinhaPaginaDocs.ts`) e a entrada MDX (`MinhaPaginaDocs.mdx`) que o monta sob `Foundations/`. Ver `../../docs/shared/guidelines/08-docs-pages-foundations.md`.

Páginas de galeria (ícones, cores de tema) **não** têm as 15 seções, e o auditor não tem escape para elas: as cinco stacks carregam o mesmo achado de `missing_section` nessas páginas. É conhecido e igual em todas.

---

## Troubleshooting

| Sintoma | Causa provável | Onde olhar |
|---|---|---|
| `NG0303: Can't bind to '<input>'` e componente nos defaults | `noEmit` no tsconfig → fallback JIT | esta página, §1 |
| `firstCreatePass` de `null`, ou `NG0203`, em todas as stories de um componente novo | segunda cópia do núcleo do Angular pelo pré-empacotamento | esta página, §3; apagar `node_modules/.cache/storybook` |
| Preview vazio, página renderizando inteira, teste verde | diretiva de `@angular/common` faltando no `imports` — `NG0303` no console e nada mais | `13-system-design.md` |
| `ctx.String is not a function` | global usado em expressão de template | `02-template-caracteres-especiais.md` §5 |
| Callback de story nunca chamado | função em `args` sem entrada em `argTypes` | `11-documentacao-componentes.md` |
| Painel Code mostrando `@if` e bindings de arg | falta `docs.source.transform` | `11-documentacao-componentes.md` |
| Elemento perdeu o `data-slot` esperado | duas diretivas no mesmo host | `RULES.md` §8 |
| Violação de contraste no axe com razão perto de 1.0 | overlay lido em pleno fade | `esperarPortal`; nunca desligar o portão de a11y |
| Tema não aplica no Docs tab | script de sync não leu os globals da URL | `preview-head.html` |
| Etapa de extração de documentação falhando no run | `compodoc` reativado | esta página, §2 |
