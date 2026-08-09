---
description: Dev Angular — cria stories, docs pages e exemplos para componentes Angular 22 seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Angular — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Angular 22 (standalone + signals) com `@radix-ng/primitives` e CSS standalone `.nds-*`. Crie stories, docs pages e componentes Angular.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente

---

## Leituras obrigatórias (antes de começar)

1. **`_dev-shared.md`** — padrões compartilhados das stacks. **Esta skill complementa com o que é específico de Angular.**
2. **`nortear-design-system-angular/CLAUDE.md`** — as armadilhas silenciosas do stack. Não pule.
3. UI primitive: `nortear-design-system-angular/src/components/ui/<slug>.ts`
4. `docs/shared/content/<slug>/translations.json`
5. `.pipeline-context/<slug>.md` (se existir)

---

## Stack Técnica

- **Angular 22** — standalone, signals-first, **zoneless**
- **`@radix-ng/primitives`** (headless)
- **Storybook 10** (`@storybook/angular-vite` — builder Vite, **não** o webpack do `@storybook/angular`)
- **CSS standalone `.nds-*`** (compartilhado em `docs/shared/styles/nds/`)
- **`lucide`** (pacote agnóstico, **não** `lucide-angular`: este declara peer `@angular/core: 13.x - 21.x`)

### Radix NG ↔ as outras stacks

O Radix NG 1.x adotou a anatomia do **Base UI** (`Root`/`Trigger`/`Positioner`/`Popup`/`Backdrop`), a mesma que o React usa via `@base-ui/react`. Para **forma de API**, o React é o parente mais próximo — as tabelas de props portam quase sem override. Para **markup e classes**, a referência continua sendo o **Vanilla**.

Nomes que divergem: `dropdown-menu` → `menu` · `hover-card` → `preview-card` · `radio-group` → `radio` · `command` → `autocomplete`/`combobox` · `sheet` → `dialog`.

Sem primitivo no Radix NG: `input-otp` (compor sobre `composite` + `input`), `resizable`, e **range calendar** (o roadmap lista Date Picker / Range Calendar como planejados).

---

## Três armadilhas que falham em SILÊNCIO

Nenhuma dá erro vermelho. Leia antes de debugar qualquer coisa.

### 1. `noEmit: true` derruba o AOT e o sintoma é NG0303

O `tsconfig.json` do stack **não pode** ter `noEmit: true`. O `@analogjs/vite-plugin-angular` compila cada arquivo pelo emissor do `@angular/compiler-cli`; sob `noEmit` o emissor devolve vazio, o plugin trata o arquivo como fora do programa TypeScript e o Angular cai no fallback **JIT**.

O JIT compila o decorator — `host` bindings funcionam, o componente renderiza — mas **não enxerga inputs declarados com `input()`**. Resultado: `NG0303: Can't bind to 'variant'` no console e o componente renderizando nos valores **default**.

Consequência para quem escreve story: **uma story que só exercita o valor default passa e esconde o defeito**. Por isso:

> **Toda story de variação DEVE afirmar a classe resultante de cada variante**, não só renderizar. Ver `button-variantes.stories.ts`.

Sinal no log: `"… contains Angular decorators but is not in the TypeScript program"`.

### 2. `compodoc: false` é obrigatório em `.storybook/main.ts`

O preset roda `compodoc -p tsconfig.json -e json -d .` e o compodoc atual não aceita mais `-e`; a etapa falha em todo run, inclusive dentro do vitest. Controls e aba API Reference saem de `argTypes` escritos à mão — mesma decisão do `docgen: false` no Svelte.

### 3. Expressão de template não tem globais

`String(...)`, `Object.keys(...)` e afins não existem no contexto de template (erro em runtime: `ctx.String is not a function`). Exponha um `computed` no componente.

---

## Padrões Angular-specific

### Implementando UI primitive

Seletor de **atributo** no elemento nativo, não elemento próprio — o markup fica idêntico ao do Vanilla e o CSS `.nds-*` casa sem wrapper:

```ts
@Component({
  selector: 'button[ndsButton], a[ndsButton]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [{ directive: RdxButtonDirective, inputs: ['disabled', 'type'] }],
  host: { '[class]': 'hostClass()', '[attr.data-slot]': '"button"' },
})
export class NdsButton {
  readonly variant = input<ButtonVariant>('default');
  readonly class = input<string>('');
  protected readonly hostClass = computed(() => cn(btnClass(this.variant()), this.class()));
}
```

**Regras:**
1. **`ViewEncapsulation.None` sempre.** Nenhum componente de UI declara `styles` próprios — o visual inteiro vem de `@shared/styles/nds/`, que é global. Encapsulamento só emitiria `_ngcontent-*` inútil.
2. **`hostDirectives`** aplica o primitivo do Radix NG sem exigir que o call site o importe.
3. **`data-slot` na raiz** — é por ele que story, teste e ferramenta encontram o componente sem depender de classe.
4. Classe sem prefixo `nds-` é resíduo do Tailwind (que saiu do projeto) — o audit acusa `legacy_class_in_story`.
5. Falta uma classe → crie a regra no CSS compartilhado seguindo o **Vanilla**, não outra stack.

### Render de Story

```ts
const meta: Meta<Args> = {
  title: 'UI/<Slug>',
  decorators: [moduleMetadata({ imports: [NdsSlug] })],
  parameters: { docs: { page: withAutoDocsTab(NdsSlugDocs) } },
};

export const Playground: Story = {
  render: (args) => ({
    props: { ...args },
    template: `<button ndsButton [variant]="variant" (click)="onClick($event)">{{ label }}</button>`,
  }),
};
```

- Imports vêm de **`@storybook/angular-vite`**, não de `@storybook/angular` (este não está instalado).
- `moduleMetadata({ imports: [...] })` no `meta.decorators` — sem isso o template não reconhece o seletor e você cai no NG0303 do item 1.
- Valor computado no `render` (ex.: `isIcon`) vai em `props`, não em expressão do template.

### API Reference sai só de `argTypes`

Com `compodoc: false` não há introspecção. Toda prop precisa estar em `argTypes` — inclusive as sem control (`control: false` + `table.type.summary`). Ver as regras gerais em `_dev-shared.md`.

### Preview de docs é `TemplateRef`, não factory

`DocsDoDont` e `DocsVariants` recebem `TemplateRef` e instanciam com `ngTemplateOutlet`. A docs page declara os previews como `<ng-template #x>` com componentes reais e bindings:

```ts
// no template da docs page
<ng-template #tplVarDefault>
  <button ndsButton variant="default">{{ t('variants.items.default') }}</button>
</ng-template>

// na classe
private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
protected readonly variantItems = computed(() => {
  dict();
  return [{ name: t('variants.items.default'), description: '…', trackId: 'default', preview: this.tplVarDefault() }];
});
```

Montar DOM à mão aqui perderia change detection e os inputs do componente.

### i18n é signal — não existe `subscribe`

`useTranslation()` devolve `{ t, dict, locale, getLocale }`. Um `computed` que **lê `dict()`** re-renderiza sozinho na troca de idioma:

```ts
const { t, dict } = useTranslation(componentTranslations);

protected readonly anatomyItems = computed(() => {
  dict();  // <- amarra o computed ao signal de locale; `t` sozinho é função comum
  return [t('anatomy.item1'), t('anatomy.item2')];
});
```

Esquecer o `dict()` é o defeito clássico: a página monta certa e **congela** no idioma inicial.

### `DOMPurify.sanitize()` no próprio binding `[innerHTML]`

```ts
// no template
<li [innerHTML]="DOMPurify.sanitize(item)"></li>

// na classe — leva o módulo ao escopo do template
protected readonly DOMPurify = DOMPurify;
```

O `[innerHTML]` do Angular **já** passa pelo DomSanitizer do framework. A exigência não é redundância defensiva: Qwiet/CodeQL só reconhecem o sanitizador de taint quando a chamada está no call site. Um `computed` `safe*` esconde a chamada e vira falso positivo permanente de XSS. Não crie `sanitize-html.ts` — já existiu e foi removido. Ver `09-seguranca-xss.md`. Portão: `node scripts/audit.mjs <slug> --category security`.

### Conteúdo em `itemN`, não em array

O conteúdo compartilhado numera linhas de tabela como `item1`, `item2`… e `t()` só devolve folha. Percorra até a primeira lacuna em vez de repetir `[1,2,3,4,5,6]` na docs page (que envelhece quando o ux-writer acrescenta linha) — ver `itemsFromDict` em `ButtonDocs.ts`.

Célula de tabela é interpolação (textNode): conteúdo com `<code>` precisa de `toPlainText()`, senão a tag aparece literal. O audit acusa `markup_in_text_surface`.

---

## Imports da Docs Page

```ts
import { ChangeDetectionStrategy, Component, computed, effect, viewChild, TemplateRef, signal, ViewEncapsulation } from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import componentTranslations from '@shared/content/<slug>/translations.json';
import uiTranslations from '@/i18n/ui.json';

// Section containers (15) — de @/components/docs/shared/sections
import { NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, /* … */ } from '@/components/docs/shared/sections';
```

Esqueleto: ver `nortear-design-system-angular/src/components/docs/ButtonDocs.ts` — é a referência do stack (SEO em `effect`, observador de seção em `ngAfterViewInit`, cleanup em `ngOnDestroy`).

> **`structureCode` SEMPRE de `t('anatomy.structureCode')`** — não hardcode.
> A variante `angular` da chave frequentemente **não existe** e cai em fallback para o React (JSX numa doc Angular). Confira com `node scripts/audit-translation-literals.mjs --only cobertura` e escreva a variante no `translations.json` compartilhado — **nunca** num override de `useTranslation`.

---

## Documentação de Divergências Idiomáticas

Onde o Radix NG não tem primitivo (ou tem menos superfície que bits-ui/reka-ui), aplicam-se as **3 camadas obrigatórias** (ver `_dev-shared.md`):

1. `translations.notes.item1` — descrever a divergência
2. DocsProps notes inline — para cada prop não suportada
3. Story afetada (se omitida): `parameters.docs.description.component` com nota explícita

**Nunca cite outro stack pelo nome** no texto: cada docs page é consumida isoladamente.

---

## Verificação antes de fechar

```bash
cd nortear-design-system-angular
npx tsc -p .storybook/tsconfig.json --noEmit   # templates entram no build, não no tsc
npm test                                        # play + axe + contrato de docs
cd .. && node scripts/audit.mjs <slug>
```

O `tsc` **não** checa template Angular — erro de template só aparece em `npm run build-storybook` ou no `npm test`. Não feche um componente só com typecheck verde.

---

## Audit + Commit

Veja `_dev-shared.md` (Audit Inline + Commit). Mensagem: `skill(dev-angular): $ARGUMENTS`.
