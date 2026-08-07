---
description: Padrões compartilhados pelas dev-skills (react/vue/svelte/vanilla). Não invoque diretamente — leia em conjunto com a dev-<stack>.md específica.
---

# Padrões Compartilhados — Dev Skills

> Este arquivo contém regras idênticas para todas as 4 stacks. Cada `dev-<stack>.md` complementa com o que é stack-specific (sintaxe, lib upstream, hooks idiomáticos).

---

## Regra Central — Sempre use componentes reais

Stories e docs pages **NUNCA** recriam variantes com HTML/JSX/Tailwind inline. Sempre importe e use o componente real de `@/components/ui/<slug>`.

---

## Leituras obrigatórias antes de criar arquivos

Em paralelo:
1. UI primitive da stack: `nortear-design-system-<stack>/src/components/ui/<slug>.<ext>` (ou `<slug>/index.<ext>`)
2. `docs/shared/content/<slug>/translations.json` — fonte única de conteúdo
3. `.pipeline-context/<slug>.md` (se existir) — contexto preparado pelo pipeline

Para padrão de docs page, consulte `AlertDocs.<ext>` da mesma stack **só se precisar** — não leia upfront.

---

## Regras Anti-Boilerplate

- Apenas `<slug>.stories.<ext>` (story principal) carrega `tags: ['autodocs']`. Sub-stories nunca.
- Docs page injetada via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` apenas no arquivo principal.
- Sub-stories têm apenas `title`, `component`, `parameters.layout`, `parameters.docs.description.component`, `parameters.controls: { disable: true }`.
- Categorias de sub-story dependem da categoria do componente — overlays de confirmação não têm `-variantes` nem `-tamanhos`.

---

## Tokenização de Dimensões

**Proibido** classes hardcoded de altura/size em UI, stories e docs:

- ❌ `h-8`, `h-9`, `h-10`, `size-6`, `size-8`
- ✅ `h-(--height-default)`, `h-(--height-sm)`, `h-(--height-lg)`, `size-(--size-default)`

Exceções: `px-*`/`gap-*`/`py-*` (spacing), `[&_svg]:size-4` (ícones decorativos), `min-h-16` (Textarea). Tabela completa em `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

---

## Higiene de classes `.nds-*`

- **Classes compostas do type scale já trazem peso/tracking** (`nds-text-h1` → 700 + tight; `h2`–`h4` → 600). Nunca empilhar `nds-font-*`/`nds-tracking-*` redundantes no mesmo elemento.
- **`nds-text-body` já traz `color: --foreground`** — nunca combinar com `nds-text-foreground`. Classe de cor só para sobrescrever: `nds-text-muted-foreground` em subtítulos/metadados, nunca em `<p class="nds-text-body">` de corpo de texto.
- **Zero `style` inline.** Se a propriedade não existe como utility, crie a classe em `docs/shared/styles/nds/` (spacing restrito ao grid 8) e use-a.
- **Não forçar `nds-m-0`** — espaçamento vem do gap de `nds-stack`/`nds-cluster`.
- **`<h2>` de seção usa `nds-text-h2`** — nunca `nds-text-h3` em elemento `<h2>`.
- **Tabelas: renderizar `<Table>` direto** — o componente já provê `.nds-table-wrapper`. Nunca envolver em wrapper com `nds-border-*`/`nds-rounded-*` (cria caixa dupla).
- **Cards de conteúdo usam o componente Card** (`CardHeader > CardTitle + CardDescription`; campos extras em `CardContent`), nunca `div` com classes de card. `CardTitle` aceita `as` — passe `h2`–`h6` quando for heading real na hierarquia. Grid de cards em pares: `nds-grid` + `data-cols="2"` + `data-fixed`.
- **Listas simples**: `ul` com `nds-stack nds-list-none` + `data-spacing="md"`, itens com `nds-accent-start`.
- **Raio aninhado**: elemento arredondado dentro de container arredondado segue `Rᵢ = Rₑ − inset` — use os pares prontos (pai `--radius` + inset 4px → filho `--radius-sm`; inset 2px → `--radius-md`; pai `--radius-card` + 4px → `--radius`) ou `.nds-radius-nested`. Nunca repita o raio do pai nem chute valor. Contrato de tema: temas sobrescrevem só `--radius` + tokens por componente; a escala `xs–xl` nunca. Ver Elevação §Raio aninhado.
- **Motion**: micro-interações de componente são CSS-first com os tokens de `motion.css` (`--duration-*`, `--ease-*`, `--motion-offset-*`) — nunca valores literais de duração/easing. A biblioteca Motion (MIT; `motion` no React/Vanilla, `motion-v` no Vue; Svelte usa `svelte/motion`/`svelte/transition` nativos) entra APENAS para spring físico, gestos, stagger, presence e layout animation — nunca como dependência de primitivos em `ui/`. Receitas e demos: página Motion §Recursos avançados.

Padrões de foundation pages (header, seções, items): `docs/shared/guidelines/08-docs-pages-foundations.md` §14.

---

## Artefatos a Criar (todas as stacks)

| Arquivo | Conteúdo |
|---------|----------|
| `<slug>.stories.<ext>` | Playground + `tags: ['autodocs']` + `withAutoDocsTab` + play functions |
| `<slug>-variantes.stories.<ext>` | Uma story por variante (sem play functions complexas) |
| `<slug>-tamanhos.stories.<ext>` | Uma story por tamanho (se aplicável) |
| `<slug>-estados.stories.<ext>` | Disabled, Loading, Error — com play functions |
| `<slug>-composicoes.stories.<ext>` | Com ícone, asChild, em formulário etc. |
| `<Slug>Docs.<ext>` | Docs page completa com todas as 16 seções |

---

## Section Containers — Use Sempre

A docs page é composta exclusivamente por section containers + componentes reais de `@/components/ui/`. **Nunca** escreva JSX/template/createElement inline replicando layout de seção.

Containers em `nortear-design-system-<stack>/src/components/docs/shared/sections/`. Se ausentes, rodar `/docs-sections --stack <stack>` antes.

Use `DocsPageLayout` para o layout de duas colunas com sidebar sticky — não monte `flex gap-16` manualmente. Previews visuais (DoDont, Variants, Demonstration) são passados como props/children.

### Do & Don't — bug comum

`DocsDoDont` recebe pares de previews. **Nunca** use `[1,2].map()` em um único grid — produz DO|DO em cima e DON'T|DON'T em baixo. O container monta dois grids separados corretamente.

---

## Docs Page — Seções Obrigatórias (16)

Toda docs page renderiza TODAS estas seções com conteúdo real de `translations.json`. **Nunca** use placeholders ("Exemplo aqui.", "Estrutura...").

1. **Header** — badges (category, type), `<LanguageSwitcher />`, h1, description
2. **Demonstração** (`id="demonstracao"`) — demos interativos com componente real
3. **Anatomia** (`id="anatomia"`) — lista numerada + bloco de estrutura. **`structureCode` SEMPRE de `t('anatomy.structureCode')` — nunca hardcoded**
4. **Quando Usar** (`id="quando-usar"`) — 4 blocos: guidelines, cenários, UX Writing, Do/Don't cards
5. **Do & Don't** (`id="do-dont"`) — via `DocsDoDont` com previews reais
6. **Importação** (`id="importacao"`) — blocos de código
7. **Variantes** (`id="variantes"`) — cards com preview + toggle de código
8. **Composições** (`id="composicoes"`) — via `DocsCompositions`; presente quando
   o `translations.json` tem `variants.compositions`
9. **Estados** (`id="estados"`) — tabela de estados
10. **Propriedades** (`id="propriedades"`) — tabelas de props completas
11. **Tokens** (`id="tokens"`) — tabela de tokens CSS + customização
12. **Acessibilidade** (`id="acessibilidade"`) — lista + cards de teclado
13. **Relacionados** (`id="relacionados"`) — grid de cards com links
14. **Notas** (`id="notas"`) — callouts. **Documentar divergências idiomáticas Vanilla aqui (notes.item1)**
15. **Analytics** (`id="analytics"`) — tabela de eventos GA4
16. **Testes** (`id="testes"`) — 3 sub-seções: funcional, acessibilidade, visual

**O que entra em Variantes, Estados e Composições** é decidido pela guideline
`docs/shared/guidelines/14-taxonomia-secoes.md` — teste de 3 perguntas, regra de
não-duplicação, armadilhas. Não invente critério: 22% das composições do repo
eram duplicata da própria seção Variantes por falta dessa regra.

---

## SEO/GEO Obrigatório

`useSeoEffect`/`applySeo` deve passar **todos** os campos:

- `title`: `tContent('seo.title')`
- `description`: `tContent('seo.description')`
- `locale`: reativo
- `componentSlug`: `'<slug>'`
- `aiSummary`: `tContent('seo.aiSummary')`
- `aiEntities`: `tContent('seo.aiEntities')`
- `breadcrumb`: `[{name:'Components',item:'/components'}, {name:tContent('category'),item:'/components/<categoria>'}, {name:tContent('title')}]`

**`breadcrumb` usa `tContent('category')` dinâmico — NUNCA hardcode 'Form'/'Navigation'/etc.**

---

## Analytics Obrigatório na Docs Page

- `track('docs_page_view', { component_name, locale, page_title })` no mount, reativo ao locale
- IntersectionObserver chamando `track('docs_section_viewed', { section_id, component_name, locale })` em cada seção

---

## Controls e aba "API Reference" da Playground

As duas superfícies saem do mesmo `argTypes` do `meta`. O painel **Controls**
mostra o que tem control; a aba **API Reference** mostra a tabela inteira, com
Type e Default. Declarar duas ou três props deixa a aba praticamente vazia — foi
assim que o Accordion do Svelte ficou com **uma linha só**.

**Declare a API real da lib desta stack, não a tabela compartilhada.** O
`translations.json` descreve props em nomenclatura Radix/shadcn (`asChild`,
`forceMount`, `className`) que nenhuma das libs atuais usa. Leia a interface da
lib (`node_modules/<lib>/**/types.d.ts` ou o `.d.ts` do componente) e transcreva
o que ela expõe de verdade.

**Regras:**
- Uma entrada em `argTypes` para **cada** prop pública da raiz — inclusive as que
  não têm control.
- `table: { type: { summary }, defaultValue: { summary } }` em todas: sem isso as
  colunas Type e Default da aba saem vazias.
- Control só nas props que o `render` de fato encaminha. Prop que o render fixa
  depois do spread (`defaultValue`, `className`) ou que o wrapper da story não
  recebe vai com `control: false` — documentação, não controle morto.
- **Prop documental aparece no painel Controls como linha com `-`, e isso é o
  esperado.** Não tente escondê-la: o `withAutoDocsTab` monta `<Controls />`, que
  é o **mesmo bloco** do painel — as duas superfícies leem
  `parameters.controls.{include,exclude}`, então excluir do painel apaga da aba
  API Reference junto. `table: { disable: true }` tem o mesmo efeito.
  (`parameters.docs.argTypes.{include,exclude}` só vale para o bloco
  `<ArgTypes />`, que não é o que a aba usa.) Em Svelte e Vanilla, onde o
  `argTypes` é a única fonte da aba, apagar é perda de documentação real.
- `args` com valor inicial para **toda** prop que tem control; sem isso o control
  aparece vazio.
- Nada em `args` sem entrada correspondente em `argTypes` — a prop fica fora da
  tabela (foi o caso do `onValueChange: fn()` no React).
- **Props de montagem** (`defaultOpen`, `initialValue`): `key` derivado do arg
  para forçar re-mount quando o control muda.
- **`disabled`**: passar explicitamente ao filho interativo (Trigger/Button), não
  só ao root — root frequentemente não propaga visual de disabled.
- Componentes sem props visuais: expor props de comportamento (`loop`,
  `shouldFilter`, `filter`).
- Sem props controláveis: `parameters.controls: { disable: true }` com justificativa.

### Snippet "Show code" — tem que acompanhar os controls

Trocar um control precisa mudar a caixa de código. Quando a stack não gera isso
sozinha, declare `parameters.docs.source.transform` na Playground — ele recebe
`(codeGerado, storyContext)` e monta o snippet a partir de `storyContext.args`.

**Nunca use `docs.source.code` com string fixa.** Além de não reagir aos
controls, um `code` definido faz o `skipSourceRender` do renderer devolver `true`
e o gerador dinâmico nem chega a rodar.

Antes de fechar a Playground, troque um control e confirme que o snippet mudou.
Se não mudou, o snippet está mentindo sobre o que a story renderiza.

---

## Play Functions

```ts
import { fn, userEvent, within, expect } from 'storybook/test';

play: async ({ canvasElement, step, args }) => {
  const canvas = within(canvasElement);
  await step('clique dispara callback', async () => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  });
};
```

- Step descriptions em **português**
- `fn()` nos args para callbacks testáveis
- `userEvent` (não `fireEvent`)
- `pointerEventsCheck: 0` ao clicar em elemento disabled

**Sub-stories (variantes/estados/composicoes) também precisam de play function** (mesmo simples — verifica role, classes, atributos). Sem play em sub-story = violação `substory_no_play` no audit.

### Esperar overlay, foco e nó

- **`data-state="closed"` não significa overlay liberado.** Durante a animação
  de saída ele ainda segura `pointer-events`, e o clique seguinte falha. Espere
  pela condição que o próximo passo precisa: `getComputedStyle(x).pointerEvents
  !== 'none'`.
- **Re-consulte o nó antes de focar ou ler atributo.** A renderização substitui
  o elemento; focar um nó destacado não faz nada — o foco fica no `body` e a
  tecla não chega. Ler o atributo do nó antigo devolve o valor de antes.
- **Demo que existe para mostrar algo precisa mostrar** — scrollbar com
  `type="hover"` só aparece sob o ponteiro: a story não prova nada e o Chromatic
  fotografa vazio.

### Wrapper de story: um caminho só

Ramo "controlado" e "não controlado" com o mesmo markup é duplicação, e a
metade menos exercitada apodrece sem ninguém notar. Um caminho, com o estado
inicial vindo do bindable.

---

## Regras Críticas de Renderização

### Blocos de código — nunca `<pre>`

```tsx
// ✅ CORRETO — .nds-code-block já traz fundo, borda, mono e overflow-x
<div className="nds-code-block">{`...`}</div>

// ❌ ERRADO
<pre><code>...</code></pre>
```

Dentro de um card que já tem fundo próprio, use `.nds-code-block-embedded` (mesma tipografia, sem bg/borda). Exceção: diagramas ASCII em `anatomy.structureCode` podem usar `<pre>` com `.nds-whitespace-pre`.

### Tabelas — wrapper obrigatório

```tsx
// ✅ wrapper do próprio componente — ver o cabeçalho de nds/table.css
<div className="nds-table-wrapper">
  <table className="nds-table">...</table>
</div>
```

Primeira coluna da tabela de estados: peso semibold simples, nunca badge/pill.

### HTML dinâmico — sempre sanitizar

Todo conteúdo de `translations.json` renderizado como HTML passa por `DOMPurify.sanitize()` **no próprio call site**, com `import DOMPurify from 'dompurify'` no mesmo arquivo:
- React: `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t(...)) }}`
- Vue: `v-html="DOMPurify.sanitize(t(...))"`
- Svelte: `{@html DOMPurify.sanitize(t(...))}`
- Vanilla: `el.innerHTML = DOMPurify.sanitize(t(...))` — ou `createElement` + `textContent` quando não houver HTML a preservar

**Nunca crie um wrapper local** (`sanitize-html.ts`): ele esconde o sanitizador do SAST, que passa a reportar o fluxo inteiro como XSS. Já existiu neste projeto e foi removido por isso — ver guideline `09-seguranca-xss.md`.

**Vanilla: NUNCA `innerHTML` com string interpolada de fonte dinâmica sem sanitize. Preferir `createElement` + `textContent`.**

### Landmarks repetidos em demos — aria-label por instância

Docs pages montam o mesmo componente N vezes. Se o componente É um landmark
(`<nav>` do breadcrumb/pagination/navigation-menu, `role="region"` do
carousel, `<main>` do SidebarInset) ou um singleton (`<Toaster>` do sonner),
instâncias repetidas violam `landmark-unique`/`landmark-no-duplicate-main` no
axe da fumaça (`docs-smoke`). Regras (lote 2026-08-01):

- **Singleton (Toaster)**: UM mount por página, no nível do layout; demos
  disparam nele.
- **Landmark repetido**: cada instância recebe `aria-label` = a string
  traduzida que **já intitula visivelmente o bloco** (`t('demonstration.title')`,
  `stripHtml(t('doDont.pairN.do|dont'))`, o `name` da variante). Nunca
  inventar string nem hardcodar pt-BR. O label vai no elemento landmark do
  componente, não em wrapper.
- **`<main>` em demo**: só a Demonstração mantém o elemento real; os demais
  previews usam `<div>` com as mesmas classes (pixel-idêntico).
- Paginação interna de mês do Calendar **não é landmark**: o wrapper renderiza
  `<div class="nds-calendar-nav*">` (canon vanilla), não `<nav>`.

---

## Containment para Portais (overlays)

Componentes que renderizam Content em portal (Dialog, DropdownMenu, Popover, Tooltip, HoverCard, Sheet, Drawer, Sonner): **sempre** envolver previews em wrapper com `contain: layout` para confinar fixed positioning ao container do Storybook.

- React: `style={{ contain: 'layout' }}` no wrapper
- Vue/Svelte: `style="contain: layout"`
- Vanilla: `wrapper.style.contain = 'layout'`

Ver `PATCHES.md#sidebar` para racional CSS Containment.

---

## Semântica de anúncio e landmarks

Erros desta família não falham teste nem axe — só aparecem com leitor de tela.

- **Live region só para runtime.** `role="alert"`/`aria-live` interrompem a
  leitura no carregamento. Conteúdo já presente quando a página abre usa role
  não-live (`note`). Componente que fixa `role` sem escape hatch é bug: quem
  renderiza estático não tem saída.
- **Toda docs page precisa de `<main tabindex="-1" aria-labelledby="<id do h1>">`.**
  Sem landmark nomeado o "ir para o conteúdo" não tem destino. Vale também
  para páginas de layout próprio (foundations, catálogos) — verifique TODOS os
  caminhos de render, não só o principal.
- **`<main>` aninhado é inválido**: demo que renderiza `main` (SidebarInset e
  similares) usa `div` dentro da docs page; o snippet continua ensinando o
  componente real.
- **Navegação interna move o FOCO, não só o scroll.** `scrollIntoView` sozinho
  deixa o foco no menu: o leitor não continua a leitura e o Tab volta para o
  próximo item. Sempre `tabindex="-1"` no alvo + `focus({ preventScroll: true })`.
- **Role custom não herda nome do conteúdo.** `role="radio|switch|checkbox|combobox"`
  em `span`/`div` exige `aria-label` — `<label for>` não nomeia elemento
  não-rotulável.
- **Ids de componente repetível precisam de escopo por instância.** Duas
  instâncias com os mesmos ids fazem `aria-labelledby` resolver para o primeiro
  do documento: nomes acessíveis errados e `landmark-unique` no axe.

---

## Snippet nunca vira DOM

Código de exemplo renderizado como HTML (`innerHTML`, `dangerouslySetInnerHTML`,
`v-html`, `{@html}`) cria elementos REAIS: um `<Textarea/>` de snippet vira um
`<textarea>` sem rótulo dentro da página (o parser é case-insensitive).

- Snippet vai por CodeBlock / `extensibilityCode` — nunca por prop de notas.
- Tag literal em prosa (`<select>`, `<option>`) precisa de escape `&lt;`.

---

## CSS que não aplica

- **Classe sem prefixo `nds-` não existe** — `max-h-[50vh]`, `inset-0`,
  `h-full`, `text-primary-foreground`, `w-56`, `overflow-y-auto`. São inertes, e
  o efeito não é cosmético: sem altura máxima o scroll nunca acontece (e a regra
  de acessibilidade da região rolável nunca é avaliada), e um `text-*` morto
  deixou um botão com contraste **1.1:1**. Classe morta esconde defeito real.
- **Nunca asserte classe morta na story.** A asserção passa a existir sem
  proteger nada, e some junto com o bug. Asserte o comportamento — transbordo,
  contraste, atributo ARIA — não o nome da classe.
- **Token de cor exige `hsl()`**: os tokens são triplets. `color: var(--x)` é
  declaração inválida e cai silenciosamente.
- **Classe utilitária não vence classe de componente**: mesma especificidade, e
  `button.css` é importado depois de `colors.css`. Cor em botão vem da
  variante, não de `nds-bg-*`.
- **Antes de usar um token, confirme que existe** — `--color-destructive` e
  afins não existem; `unknown_token_reference` do audit cobre parte disso.

---

## Animação

- **Classe de animação de entrada é TRANSITÓRIA** — remova no `animationend`
  com timeout de segurança. Classe permanente prende o elemento no estado
  inicial se a animação não completar (aba em background, tab oculta).
- **Nunca dependa só de `animationend`** para remover nó: com
  `prefers-reduced-motion` o evento não dispara. Timeout é obrigatório, e sem
  animação ativa remova na hora.
- `animationend` borbulha: `if (event.target !== el) return`.
- **Altura só anima até o piso do conteúdo**: padding do filho impede o
  colapso chegar a zero — anime o padding junto.
- Duração e easing saem de token. Curva de spring de referência se traduz por
  ajuste numérico, não a olho.

---

## Trigger asChild + Button

Componentes com Trigger (DropdownMenuTrigger, DialogTrigger, etc.) devem usar `asChild` (React/Vue) ou `child` snippet (Svelte) com `<Button>` para evitar `<button><button>` aninhado (NestedInteractive ARIA violation).

**A prop precisa ser CONSUMIDA.** Declarar `asChild` no tipo e repassar tudo ao
primitivo faz a lib renderizar o próprio botão em volta do nosso — e `asChild`
vaza como atributo no DOM. No bits-ui `asChild` não existe: use o snippet
`child`.

```tsx
// ✅ CORRETO
<DropdownMenuTrigger asChild>
  <Button>Abrir</Button>
</DropdownMenuTrigger>

// ❌ ERRADO — gera <button><button>
<DropdownMenuTrigger>
  <Button>Abrir</Button>
</DropdownMenuTrigger>
```

---

## Documentação de Divergências Idiomáticas (Vanilla)

Quando a factory custom Vanilla **não suporta** uma feature da lib upstream (submenu, CheckboxItem, RadioItem, props específicas), documentar em **3 camadas**:

1. `translations.notes.item1` — descrever divergência
2. DocsProps notes inline — para cada prop não suportada
3. Story afetada (se omitida): nota explícita em `parameters.docs.description.component`

Ver `navigation-menu` e `menubar` como referências exemplares.

---

## Audit Inline — antes de commitar

```bash
node scripts/audit.mjs <slug> --category security,performance,analytics,quality --json
npm run lint            # da SUA stack — errors derrubam o CI, warnings não
```

O lint não é opcional e não é substituído pelo typecheck: `svelte-check` não vê
regras de eslint, e foi assim que 3 stories commitadas por 3 lotes diferentes
chegaram ao CI com o mesmo error (`no-useless-escape`) — os lotes de react/vue/
vanilla rodavam eslint, o de svelte só rodava svelte-check.

Para cada violação da sua stack, corrija ANTES do commit. Se não puder corrigir (exige mudar UI primitive), inclua no commit message:
```
ciência: <rule> em <file> — <motivo>
```

---

## Checklist Final

- [ ] `min-w-0` no container de conteúdo (sem ele tabelas e code blocks transbordam)
- [ ] `DOMPurify.sanitize()` no call site de todo HTML dinâmico
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>` (exceto ASCII diagrams)
- [ ] `useSeoEffect`/`applySeo` COMPLETO com aiSummary/aiEntities/breadcrumb
- [ ] `breadcrumb` usa `tContent('category')` — NUNCA hardcode
- [ ] `track('docs_page_view')` reativo ao locale
- [ ] `<LanguageSwitcher />` no header
- [ ] Todas as 16 seções com conteúdo real (sem placeholders)
- [ ] `structureCode` lê de `t('anatomy.structureCode')` — NÃO hardcoded
- [ ] Sub-stories têm play function + `controls.disable: true`
- [ ] Stories declaram `covers` com os ids de `testes.*` que verificam (e
      `coversNotApplicable` com motivo, quando o item não se aplica à stack)
- [ ] Wrappers com `contain: layout` em previews que abrem portal
- [ ] Trigger sempre `asChild` + `Button`, e a prop é consumida pelo wrapper
- [ ] `<main tabindex="-1" aria-labelledby>` na docs page — inclusive nos
      layouts próprios
- [ ] Nav interna move o foco para a seção, não só rola
- [ ] Nenhum conteúdo estático dentro de live region
- [ ] Snippet só por CodeBlock; tag literal em prosa escapada
- [ ] Cor de token com `hsl()`; nenhum token inventado
- [ ] Audit inline limpo antes do commit
- [ ] Nenhum `console.log` ou `TODO` nos arquivos entregues

---

## Commit de Rastreabilidade

```bash
git add -A
git commit -m "skill(dev-<stack>): $ARGUMENTS"
```

Se nenhum arquivo foi criado/modificado, não fazer commit.
