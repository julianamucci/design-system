# Documentação de Componentes (Nortear — Angular)

## Princípio fundamental: use os containers de seção

Toda docs page **deve** usar os componentes de `src/components/docs/shared/sections/`. Cada seção é um componente `Nds Docs Xxx` que encapsula layout, card, headings, grids e semântica. A docs page é apenas o **orquestrador**: ela declara os dados e os `<ng-template>` de preview, e os containers montam o resto.

```ts
import {
  NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
  NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
  NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
  NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';
```

**NUNCA** reimplemente o HTML de uma seção no consumidor. Se precisar de layout novo, estenda o container — não duplique no consumo.

---

## O que é próprio deste stack

### 1. Preview é `TemplateRef`, não factory nem slot

`NdsDocsDoDont`, `NdsDocsVariants` e `NdsDocsCompositions` recebem **`TemplateRef`** e instanciam com `ngTemplateOutlet`. A docs page declara `<ng-template #x>` com componentes reais e bindings de verdade.

```html
<ng-template #tplVarDefault>
  <div ndsAlert>
    <svg ndsAlertIcon kind="info"></svg>
    <h4 ndsAlertTitle>{{ t('demonstration.labels.infoTitle') }}</h4>
    <section ndsAlertDescription>{{ t('demonstration.labels.infoDesc') }}</section>
  </div>
</ng-template>
```

Montar DOM à mão — o caminho do Vanilla — perderia change detection: o preview não reagiria à troca de idioma nem à troca de tema.

**Nível de heading dentro do preview importa.** O card da seção já abre um heading com o nome da variante, então o título dentro do preview vem um nível abaixo. Nível fixo pula degrau e falha `heading-order` no axe. Escolha olhando a seção que hospeda o preview.

### 2. i18n é signal, não subscribe

`useTranslation()` devolve `t` e `dict`. Um `computed` que lê `dict()` se refaz sozinho na troca de idioma:

```ts
protected readonly variantItems = computed(() => {
  dict();                                    // declara a dependência
  return [...];
});
```

Não existe o `subscribe` mais rebuild manual do Vanilla, nem store externa. Chamar `dict()` na primeira linha do `computed` é o que declara a dependência quando o corpo só usa `t()`.

### 3. SEO e analytics num `effect`, com cleanup

```ts
constructor() {
  effect((onCleanup) => {
    dict();
    const locale = getLocale();
    const cleanup = applySeo({ title: t('seo.title'), description: t('seo.description'), locale, componentSlug: 'alert' });
    track('docs_page_view', { component_name: 'alert', locale, page_title: `${t('title')} · Design System` });
    onCleanup(cleanup);
  });
}
```

`applySeo` devolve a função de limpeza das meta tags — sem `onCleanup`, trocar de página deixa meta tag da página anterior no documento pai.

`seo.title` no `translations.json` **não** carrega `· Design System`: `applySeo` acrescenta.

### 4. Observer de seção ativa no `ngAfterViewInit`

O observer precisa das seções já no DOM. `onActive` atualiza o destaque do nav na hora; `onDwell` dispara `docs_section_viewed` só depois de 2s contínuos de visibilidade, o que suprime os falsos positivos do scroll programático de um clique no nav.

Desconectar no `ngOnDestroy`.

### 5. Snippets de código são constantes de módulo

Trecho que a pessoa copia é **markup de template Angular**, e vive numa constante `const CODE_X = \`…\`` fora da classe — não dentro do template, onde `{{` e `@` seriam interpretados pelo parser.

O import fica separado do uso: quem já tem o componente importado só quer o trecho de baixo.

### 6. Bridge para o Docs tab

`parameters.docs.page` do Storybook espera React. `withAutoDocsTab` em `src/lib/` monta o componente Angular da docs page dentro de um container React, sob `provideZonelessChangeDetection()`.

```ts
parameters: {
  docs: { page: withAutoDocsTab(NdsAlertDocs) },
},
```

**Lacuna registrada**: o bridge não é coberto por teste. O `docs-smoke` renderiza a docs page direto, como nas outras stacks; a aba foi verificada em navegador manualmente.

### 7. Layout da página

`NdsDocsPageLayout` é a casca: header projetado, nav lateral e `<main>`. Dois slots de projeção (`[docsHeader]` e `[docsMain]`), porque no Angular o conteúdo é declarado no template — não appendado depois, como no Vanilla.

O `<main>` recebe tab stop programático (para o link "ir para o conteúdo") sem entrar na ordem de tabulação, e é rotulado pelo `<h1>` do header.

Passar `componentSlug` ao layout habilita o tracking automático via atributos `data-track*`.

---

## Sanitização

Conteúdo do `translations.json` que traz marcação inline vai por `[innerHTML]`, com `DOMPurify.sanitize()` **no próprio binding**:

```html
<div [innerHTML]="DOMPurify.sanitize(t('anatomy.item1'))"></div>
```

Nunca um `computed` `safe*`. Ver `02-template-caracteres-especiais.md` §6 e a guideline 09 compartilhada.

Os containers já sanitizam os props de texto que aceitam HTML. No consumidor, sanitize só quando montar `[innerHTML]` direto.

Destino que escreve texto (tabela de testes, tabela de props, tokens, estados, linhas de teclado) usa `toPlainText`; destino que renderiza HTML usa `stripHtml`. Trocar as duas quebra de formas opostas — ver `02-template-caracteres-especiais.md` §7.

---

## Stories — as quatro armadilhas do renderer Angular

Nenhuma dá erro vermelho. Todas falham em silêncio.

### O painel Code mostra o andaime da story, não o uso

O renderer Angular imprime no painel Code o `template` da story **literalmente** — com o `@if` que alterna exemplos e com os bindings ligados aos args. É o que a pessoa copia, e não é o que ela deve escrever.

Toda Playground precisa de `parameters.docs.source.transform` devolvendo o uso real a partir de `ctx.args`:

```ts
parameters: {
  docs: { source: { transform: playgroundSource } },
}
```

Só o que **difere do default** entra no snippet — documentação que repete valor padrão ensina ruído.

**Nenhum teste alcança esse painel**: o `play` roda no canvas, não no addon-docs. Só se vê abrindo a story.

### Função em `args` sem entrada em `argTypes` não chega ao template

O renderer só repassa em `props` o que tem entrada em `argTypes`. Uma função declarada apenas em `args` — um espião, por exemplo — **não** chega ao template, e o `(click)` fica ligado a nada.

Não há erro: o botão simplesmente não responde, e o teste falha com "esperava o callback ter sido chamado" apontando para o componente, que está correto.

```ts
argTypes: {
  onClick: { control: false, table: { disable: true } },
},
args: { onClick: fn() },
```

### Controls e a aba API Reference saem de `argTypes` escritos à mão

Não há extração automática de documentação neste stack (ver `12-arquitetura-projeto.md`, `compodoc: false`). Toda entrada de `argTypes` — inclusive as que não têm control, como `class` e `type` — é escrita à mão. Se não estiver ali, não aparece na aba.

### Toda story de variação precisa afirmar a classe resultante

É o que impede o defeito de JIT silencioso de voltar: sob JIT, o componente renderiza com os valores default e uma story que só exercita o default **passa e esconde tudo**. Afirmar a classe da variante é a prova de que o input chegou.

---

## Convenções de story

| Item | Regra |
|---|---|
| Título | `UI/NomeDoComponente` na principal; `UI/NomeDoComponente/Variants` (e `Sizes`, `Compositions`, `States`, `Types`, `Modes`) nas demais |
| Vocabulário | **Nome de story e de export em inglês** — a sidebar é vocabulário único em inglês e há regra de auditoria para isso |
| Nome de arquivo | Em português: `-variantes`, `-tamanhos`, `-composicoes`, `-estados`, `-tipos`, `-modos`, `-configuracoes` |
| `tags` | `['autodocs', '<categoria>']` só na principal; as de variação não levam `autodocs` |
| Imports do componente | Por `decorators: [moduleMetadata({ imports: [...] })]` |
| Docs page | `parameters.docs.page: withAutoDocsTab(NdsXDocs)` só na principal |
| Story sem `argTypes` | `parameters.controls.disable: true` — sem isso o painel Controls fica vazio |
| Overlay aberto ao fim | espere o portal assentar (`esperarPortal`) e desligue a regra da âncora de foco naquela story |

Story que omite uma seção **omite porque não se aplica** — não crie `-tamanhos` para componente sem tamanho, nem `-variantes` para componente sem variante. Seção vazia é pior que seção ausente.

---

## Proibições

- ❌ **NUNCA** reimplemente o HTML de uma seção — use o container
- ❌ **NUNCA** monte DOM à mão num preview — use `<ng-template>`
- ❌ **NUNCA** itere pares Do/Don't num grid único — o container faz o split
- ❌ **NUNCA** recrie variante com div e classe manual — use o componente real
- ❌ **NUNCA** use `[innerHTML]` com string não sanitizada
- ❌ **NUNCA** ponha um snippet `*Code` num override de `useTranslation` — ele fica preso neste stack e invisível para o conteúdo compartilhado. Override é para nome de prop e rótulo. Portão: `node scripts/audit-translation-literals.mjs --only soltos`
- ❌ **NUNCA** cite outra stack pelo nome no texto das notas — cada docs page é consumida isoladamente
- ❌ **NUNCA** chame `gtag()` direto — use `track()`

## Checklist final

- [ ] Todos os containers importados de `docs/shared/sections`
- [ ] Nenhum HTML de seção inline no consumidor
- [ ] `NdsDocsHeader` com categoria, tipo e nota de instalação
- [ ] Previews em `<ng-template>`, com componentes reais e bindings
- [ ] Nível de heading dos previews coerente com a seção que os hospeda
- [ ] `computed` de conteúdo lendo `dict()`
- [ ] `applySeo` num `effect`, com `onCleanup`
- [ ] `track('docs_page_view')` no mesmo `effect`
- [ ] Observer de seção no `ngAfterViewInit`, desconectado no `ngOnDestroy`
- [ ] `componentSlug` passado ao layout
- [ ] `DOMPurify.sanitize()` em todo `[innerHTML]`, no call site
- [ ] `stripHtml` versus `toPlainText` conforme o destino
- [ ] Story principal com `withAutoDocsTab` e `source.transform`
- [ ] Toda função em `args` com entrada em `argTypes`
- [ ] Story de variação afirmando a classe resultante
- [ ] Export novo acrescentado ao `docs-smoke.stories.ts`
