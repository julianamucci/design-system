<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { CodeBlock } from '@/components/ui/code-block';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import codeBlockTranslations from '@shared/content/code-block/translations.json';
  import { toPlainText } from '@/lib/strip-html';

  /** Interface real desta stack — a seção de props documenta o contrato de tipos,
      não um exemplo de uso. */
  const INTERFACE_CODE = `export interface CodeBlockProps
  extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: string | number | Array<string | number>;
  footer?: string | Snippet;
  copyLabel?: string;
  copiedLabel?: string;
  class?: string;
}`;

  // ─── Overrides desta stack ───────────────────────────────────────────────────
  // O translations.json é compartilhado e descreve a API em React: `className` e
  // `ReactNode`, com os snippets de estrutura/extensibilidade em JSX. Aqui a prop
  // é `class` e o footer aceita `string | Snippet`.

  const structureCodePtBr = `<script lang="ts">
  import { CodeBlock } from "@/components/ui/code-block";

  const source = "const total = items.length;";
<\/script>

<!-- Raiz: borda, superfície, recorte e as regiões de header, código e rodapé -->
<CodeBlock
  title="exemplo.svelte"
  language="svelte"
  code={source}
  showLineNumbers
  highlightLines={[3, "5-7"]}
  footer="Requer Node 20+"
/>`;

  const structureCodeEn = `<script lang="ts">
  import { CodeBlock } from "@/components/ui/code-block";

  const source = "const total = items.length;";
<\/script>

<!-- Root: border, surface, clipping and the header, code and footer regions -->
<CodeBlock
  title="example.svelte"
  language="svelte"
  code={source}
  showLineNumbers
  highlightLines={[3, "5-7"]}
  footer="Requires Node 20+"
/>`;

  const structureCodeEs = `<script lang="ts">
  import { CodeBlock } from "@/components/ui/code-block";

  const source = "const total = items.length;";
<\/script>

<!-- Raíz: borde, superficie, recorte y las regiones de header, código y pie -->
<CodeBlock
  title="ejemplo.svelte"
  language="svelte"
  code={source}
  showLineNumbers
  highlightLines={[3, "5-7"]}
  footer="Requiere Node 20+"
/>`;

  const extensibilityCodePtBr = `{#snippet nota()}
  <span>Requer Node 20 ou superior.</span>
{/snippet}

<CodeBlock
  code={source}
  language="bash"
  title="terminal"
  showLineNumbers={false}
  class="instalacao"
  footer={nota}
/>`;

  const extensibilityCodeEn = `{#snippet note()}
  <span>Requires Node 20 or later.</span>
{/snippet}

<CodeBlock
  code={source}
  language="bash"
  title="terminal"
  showLineNumbers={false}
  class="install-snippet"
  footer={note}
/>`;

  const extensibilityCodeEs = `{#snippet nota()}
  <span>Requiere Node 20 o superior.</span>
{/snippet}

<CodeBlock
  code={source}
  language="bash"
  title="terminal"
  showLineNumbers={false}
  class="instalacion"
  footer={nota}
/>`;


  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(codeBlockTranslations, {
    '*': {
      'props.table.className.name': 'class',
      'props.table.footer.type': 'string | Snippet',
    },
    'pt-BR': {
      'anatomy.structureCode': structureCodePtBr,
      'props.extensibilityCode': extensibilityCodePtBr,
    },
    en: {
      'anatomy.structureCode': structureCodeEn,
      'props.extensibilityCode': extensibilityCodeEn,
    },
    es: {
      'anatomy.structureCode': structureCodeEs,
      'props.extensibilityCode': extensibilityCodeEs,
    },
  });

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (codeBlockTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    ),
  );

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'code-block',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/display' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'code-block',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────

  const NAV_GROUPS = $derived.by(() => {
    // Todos os rótulos do nav vêm do ui.json: o heading da seção continua
    // sendo "Configurações" (states.title do componente), mas o nav é global.
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')       },
        { id: 'variantes',    label: tNav('nav.variants')     },
        { id: 'estados',      label: tNav('nav.states')       },
        { id: 'propriedades', label: tNav('nav.props')        },
        { id: 'tokens',       label: tNav('nav.tokens')       },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'code-block', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Rótulos da ação de copiar (o primitivo tem defaults em pt-BR) ───────────

  const copyLabel = $derived($tStore('demonstration.labels.copy'));
  const copiedLabel = $derived($tStore('demonstration.labels.copied'));

  // ─── Códigos exibidos nos exemplos ───────────────────────────────────────────

  const demoTsx = `import { CodeBlock } from "@/components/ui/code-block";

const snippet = \`npm install\`;

export function Exemplo() {
  return <CodeBlock code={snippet} language="bash" />;
}`;

  const demoBash = `# instala e sobe o Storybook
npm install
npm run storybook`;

  const demoCss = `.nds-code-block-root {
  --code-block-bg: var(--muted);
  --code-token-keyword: var(--primary);
}`;

  const demoJson = `{
  "name": "nortear-design-system",
  "private": true,
  "version": "1.0.0"
}`;

  const demoTxt = `Valor não reconhecido cai em texto simples.
O bloco continua rolando e copiando normalmente.`;

  const langScript = `const total = items.length; // soma`;
  const langMarkup = `<button class="nds-btn" :disabled="loading">Salvar</button>`;
  const langStyles = `.nds-card { padding: var(--spacing-4); }`;
  const langData = `{ "port": 6006, "open": true }`;
  const langShell = `npm run build -- --mode production`;
  const langText = `Sem classificação: monoespaçado e sem cor.`;

  const compositionCode = `const items = await load();
const total = items.length;
render(items, total);`;

  const codeImportBasic = `import { CodeBlock } from "@/components/ui/code-block";`;
  const codeImportWithFooter = `<CodeBlock
  code={source}
  language="bash"
  title="terminal"
  showLineNumbers={false}
  footer="Requer Node 20 ou superior."
/>`;

  // ─── Tabelas montadas a partir de objetos do translations.json ───────────────
  // props.table.* e tokens.table.* são objetos, não strings: as chaves de topo
  // (prop/type/default/required/description e token/part) são os cabeçalhos.

  const PROP_KEYS = [
    'code', 'language', 'title', 'showLineNumbers', 'highlightLines',
    'footer', 'copyLabel', 'copiedLabel', 'className',
  ];

  const propItems = $derived(
    PROP_KEYS.map((key) => ({
      name: $tStore(`props.table.${key}.name`),
      type: $tStore(`props.table.${key}.type`),
      defaultValue: $tStore(`props.table.${key}.default`),
      required: $tStore(`props.table.${key}.required`),
      description: $tStore(`props.table.${key}.description`),
    })),
  );

  const TOKEN_GROUPS: { titleKey: string; keys: string[] }[] = [
    { titleKey: 'tokens.surfaceTitle', keys: ['bg', 'border', 'headerBg', 'highlightBg', 'highlightAccent', 'maxBlockSize'] },
    { titleKey: 'tokens.syntaxTitle', keys: ['comment', 'string', 'number', 'keyword', 'builtin', 'function', 'tag', 'attr', 'property', 'operator', 'punctuation', 'plain'] },
    { titleKey: 'tokens.inheritedTitle', keys: ['radius', 'mutedForeground', 'foreground', 'borderBase'] },
  ];

  const tokenItems = $derived(
    TOKEN_GROUPS.flatMap((group) =>
      group.keys.map((key) => ({
        token: $tStore(`tokens.table.${key}.token`),
        value: $tStore(group.titleKey),
        description: $tStore(`tokens.table.${key}.part`),
      })),
    ),
  );

  // Snippet declarado no topo do markup: o svelte2tsx tipa a referência com o
  // `SnippetReturn` do próprio shim, que não é o `SnippetReturn` do svelte usado
  // nos containers — daí o "two different types with this name". O cast é só de
  // tipo; em runtime a referência já é o snippet certo.
  const asSnippet = (s: unknown) => s as Snippet;

  const priorityKeyMap: Record<string, string> = { high: 'common.high', medium: 'common.medium', low: 'common.low' };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }
</script>


<!-- ── Previews: snippets declarados antes de serem passados como prop ───────── -->

{#snippet doPair1()}
  <CodeBlock
    class="nds-w-full"
    title="lista.ts"
    language="ts"
    code={compositionCode}
    highlightLines={[2]}
    {copyLabel}
    {copiedLabel}
    data-track="code"
    data-track-id="code-block:do-dont:do-1"
  />
{/snippet}
{#snippet dontPair1()}
  <CodeBlock
    class="nds-w-full"
    code={compositionCode}
    highlightLines="1-2"
    {copyLabel}
    {copiedLabel}
    data-track="code"
    data-track-id="code-block:do-dont:dont-1"
  />
{/snippet}
{#snippet doPair2()}
  <CodeBlock
    class="nds-w-full"
    language="bash"
    code={langShell}
    showLineNumbers={false}
    {copyLabel}
    {copiedLabel}
    data-track="code"
    data-track-id="code-block:do-dont:do-2"
  />
{/snippet}
{#snippet dontPair2()}
  <CodeBlock
    class="nds-w-full"
    language="bash"
    code={langShell}
    showLineNumbers
    {copyLabel}
    {copiedLabel}
    data-track="code"
    data-track-id="code-block:do-dont:dont-2"
  />
{/snippet}

{#snippet langScriptPreview()}
  <CodeBlock class="nds-w-full" language="tsx" code={langScript} showLineNumbers={false} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:script" />
{/snippet}
{#snippet langMarkupPreview()}
  <CodeBlock class="nds-w-full" language="vue" code={langMarkup} showLineNumbers={false} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:markup" />
{/snippet}
{#snippet langStylesPreview()}
  <CodeBlock class="nds-w-full" language="css" code={langStyles} showLineNumbers={false} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:styles" />
{/snippet}
{#snippet langDataPreview()}
  <CodeBlock class="nds-w-full" language="json" code={langData} showLineNumbers={false} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:data" />
{/snippet}
{#snippet langShellPreview()}
  <CodeBlock class="nds-w-full" language="bash" code={langShell} showLineNumbers={false} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:shell" />
{/snippet}
{#snippet langTextPreview()}
  <CodeBlock class="nds-w-full" language="txt" code={langText} showLineNumbers={false} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:text" />
{/snippet}

{#snippet variantWithTitle()}
  <CodeBlock class="nds-w-full" title="lista.ts" language="ts" code={compositionCode} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:with-title" />
{/snippet}
{#snippet variantWithoutNumbers()}
  <CodeBlock class="nds-w-full" language="ts" code={compositionCode} showLineNumbers={false} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:without-numbers" />
{/snippet}
{#snippet variantHighlighted()}
  <CodeBlock class="nds-w-full" language="ts" code={compositionCode} highlightLines={[2]} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:highlighted" />
{/snippet}
{#snippet variantWithFooter()}
  <CodeBlock class="nds-w-full" language="ts" code={compositionCode} footer={$tStore('demonstration.labels.footer')} {copyLabel} {copiedLabel} data-track="code" data-track-id="code-block:variantes:with-footer" />
{/snippet}

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="code-block">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
    />
  {/snippet}


      <!-- ── Demonstração ───────────────────────────────────────────── -->
      <DocsDemonstration title={$tStore('demonstration.title')} componentSlug="code-block">
        <div class="nds-w-full nds-stack" data-spacing="md">
          <CodeBlock
            class="nds-w-full"
            title={$tStore('demonstration.labels.fileName')}
            language="tsx"
            code={demoTsx}
            showLineNumbers
            highlightLines="3, 5-7"
            footer={$tStore('demonstration.labels.footer')}
            {copyLabel}
            {copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:exemplo-tsx"
          />
          <CodeBlock
            class="nds-w-full"
            title={$tStore('demonstration.labels.terminalTitle')}
            language="bash"
            code={demoBash}
            showLineNumbers={false}
            {copyLabel}
            {copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:terminal"
          />
          <CodeBlock
            class="nds-w-full"
            title={$tStore('demonstration.labels.themeTitle')}
            language="css"
            code={demoCss}
            {copyLabel}
            {copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:tema-css"
          />
          <CodeBlock
            class="nds-w-full"
            title={$tStore('demonstration.labels.dataTitle')}
            language="json"
            code={demoJson}
            {copyLabel}
            {copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:package-json"
          />
          <CodeBlock
            class="nds-w-full"
            title={$tStore('demonstration.labels.plainTitle')}
            language="txt"
            code={demoTxt}
            showLineNumbers={false}
            {copyLabel}
            {copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:notas-txt"
          />
        </div>
      </DocsDemonstration>

      <!-- ── Anatomia ───────────────────────────────────────────────── -->
      <DocsAnatomy
        title={$tStore('anatomy.title')}
        items={[
          $tStore('anatomy.item1'),
          $tStore('anatomy.item2'),
          $tStore('anatomy.item3'),
          $tStore('anatomy.item4'),
          $tStore('anatomy.item5'),
          $tStore('anatomy.item6'),
          $tStore('anatomy.item7'),
          $tStore('anatomy.item8'),
        ]}
        structureLabel={$tStore('anatomy.structureLabel')}
        structureCode={$tStore('anatomy.structureCode')}
      />

      <!-- ── Quando Usar ────────────────────────────────────────────── -->
      <DocsWhenToUse
        title={$tStore('usage.title')}
        guidelines={{
          title: $tStore('usage.guidelines.title'),
          items: [
            $tStore('usage.guidelines.item1'),
            $tStore('usage.guidelines.item2'),
            $tStore('usage.guidelines.item3'),
            $tStore('usage.guidelines.item4'),
          ],
        }}
        scenarios={{
          title: $tStore('usage.scenarios.title'),
          cols: {
            scenario: $tStore('usage.scenarios.cols.scenario'),
            use: $tStore('usage.scenarios.cols.use'),
            alternative: $tStore('usage.scenarios.cols.alternative'),
          },
          items: [
            { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
            { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
            { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
            { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
          ],
        }}
        uxWriting={{
          title: $tStore('usage.uxWriting.title'),
          cols: {
            element: $tStore('usage.uxWriting.table.element'),
            rules: $tStore('usage.uxWriting.table.rules'),
            do: $tStore('usage.uxWriting.table.correct'),
            dont: $tStore('usage.uxWriting.table.avoid'),
          },
          items: [
            { element: $tStore('usage.uxWriting.table.headerTitle.name'), rules: $tStore('usage.uxWriting.table.headerTitle.format'), do: $tStore('usage.uxWriting.table.headerTitle.good'), dont: $tStore('usage.uxWriting.table.headerTitle.bad') },
            { element: $tStore('usage.uxWriting.table.footer.name'),      rules: $tStore('usage.uxWriting.table.footer.format'),      do: $tStore('usage.uxWriting.table.footer.good'),      dont: $tStore('usage.uxWriting.table.footer.bad') },
            { element: $tStore('usage.uxWriting.table.copy.name'),        rules: $tStore('usage.uxWriting.table.copy.format'),        do: $tStore('usage.uxWriting.table.copy.good'),        dont: $tStore('usage.uxWriting.table.copy.bad') },
            { element: $tStore('usage.uxWriting.table.comments.name'),    rules: $tStore('usage.uxWriting.table.comments.format'),    do: $tStore('usage.uxWriting.table.comments.good'),    dont: $tStore('usage.uxWriting.table.comments.bad') },
          ],
        }}
        do={{
          title: $tStore('usage.do.title'),
          items: [
            $tStore('usage.do.item1'),
            $tStore('usage.do.item2'),
            $tStore('usage.do.item3'),
            $tStore('usage.do.item4'),
          ],
        }}
        dont={{
          title: $tStore('usage.dont.title'),
          items: [
            $tStore('usage.dont.item1'),
            $tStore('usage.dont.item2'),
            $tStore('usage.dont.item3'),
          ],
        }}
      />

      <!-- ── Do & Don't ─────────────────────────────────────────────── -->
      <DocsDoDont
        title={$tStore('doDont.title')}
        pairs={[
          {
            doLabel: $tNavStore('common.do'),
            dontLabel: $tNavStore('common.dont'),
            doCaption: $tStore('doDont.pair1.do'),
            dontCaption: $tStore('doDont.pair1.dont'),
            doPreview: asSnippet(doPair1),
            dontPreview: asSnippet(dontPair1),
          },
          {
            doLabel: $tNavStore('common.do'),
            dontLabel: $tNavStore('common.dont'),
            doCaption: $tStore('doDont.pair2.do'),
            dontCaption: $tStore('doDont.pair2.dont'),
            doPreview: asSnippet(doPair2),
            dontPreview: asSnippet(dontPair2),
          },
        ]}
      />

      <!-- ── Importação ─────────────────────────────────────────────── -->
      <DocsImport
        title={$tStore('import.title')}
        description={$tStore('import.basic')}
        code={codeImportBasic}
        secondaryDescription={$tStore('import.withFooter')}
        secondaryCode={codeImportWithFooter}
        componentSlug="code-block"
      />

      <!-- ── Variantes (linguagens suportadas) ──────────────────────── -->
      <DocsCompositions
        id="variantes"
        title={$tStore('variants.title')}
        note={$tStore('variants.note')}
        useWhenLabel={$tNavStore('common.useWhen')}
        componentSlug="code-block"
        items={[
          { name: 'script', description: $tStore('variants.items.script'), code: '<CodeBlock code={source} language="tsx" showLineNumbers={false} />',  preview: asSnippet(langScriptPreview) },
          { name: 'markup', description: $tStore('variants.items.markup'), code: '<CodeBlock code={source} language="vue" showLineNumbers={false} />',  preview: asSnippet(langMarkupPreview) },
          { name: 'styles', description: $tStore('variants.items.styles'), code: '<CodeBlock code={source} language="css" showLineNumbers={false} />',  preview: asSnippet(langStylesPreview) },
          { name: 'data',   description: $tStore('variants.items.data'),   code: '<CodeBlock code={source} language="json" showLineNumbers={false} />', preview: asSnippet(langDataPreview)   },
          { name: 'shell',  description: $tStore('variants.items.shell'),  code: '<CodeBlock code={source} language="bash" showLineNumbers={false} />', preview: asSnippet(langShellPreview)  },
          { name: 'text',   description: $tStore('variants.items.text'),   code: '<CodeBlock code={source} language="txt" showLineNumbers={false} />',  preview: asSnippet(langTextPreview)   },
          {
            name: $tStore('variants.items.withTitle.name'),
            description: $tStore('variants.items.withTitle.description'),
            useWhen: $tStore('variants.items.withTitle.use'),
            trackId: 'with-title',
            code: '<CodeBlock code={source} language="ts" title="lista.ts" />',
            preview: asSnippet(variantWithTitle),
          },
          {
            name: $tStore('variants.items.withoutNumbers.name'),
            description: $tStore('variants.items.withoutNumbers.description'),
            useWhen: $tStore('variants.items.withoutNumbers.use'),
            trackId: 'without-numbers',
            code: '<CodeBlock code={source} language="ts" showLineNumbers={false} />',
            preview: asSnippet(variantWithoutNumbers),
          },
          {
            name: $tStore('variants.items.highlighted.name'),
            description: $tStore('variants.items.highlighted.description'),
            useWhen: $tStore('variants.items.highlighted.use'),
            trackId: 'highlighted',
            code: '<CodeBlock code={source} language="ts" highlightLines={[2]} />',
            preview: asSnippet(variantHighlighted),
          },
          {
            name: $tStore('variants.items.withFooter.name'),
            description: $tStore('variants.items.withFooter.description'),
            useWhen: $tStore('variants.items.withFooter.use'),
            trackId: 'with-footer',
            code: '<CodeBlock code={source} language="ts" footer="A ação de copiar leva apenas o código." />',
            preview: asSnippet(variantWithFooter),
          },
        ]}
      />

      <!-- ── Configurações (estados) ────────────────────────────────── -->
      <DocsStates
        title={$tStore('states.title')}
        cols={{
          state: $tStore('states.cols.state'),
          trigger: toPlainText($tStore('states.cols.trigger')),
          behavior: toPlainText($tStore('states.cols.behavior')),
        }}
        items={[
          { label: $tStore('states.idle.label'),            trigger: toPlainText($tStore('states.idle.trigger')),            behavior: toPlainText($tStore('states.idle.behavior'))},
          { label: $tStore('states.copied.label'),          trigger: toPlainText($tStore('states.copied.trigger')),          behavior: toPlainText($tStore('states.copied.behavior'))},
          { label: $tStore('states.numbered.label'),        trigger: toPlainText($tStore('states.numbered.trigger')),        behavior: toPlainText($tStore('states.numbered.behavior'))},
          { label: $tStore('states.unnumbered.label'),      trigger: toPlainText($tStore('states.unnumbered.trigger')),      behavior: toPlainText($tStore('states.unnumbered.behavior'))},
          { label: $tStore('states.scrolling.label'),       trigger: toPlainText($tStore('states.scrolling.trigger')),       behavior: toPlainText($tStore('states.scrolling.behavior'))},
          { label: $tStore('states.unknownLanguage.label'), trigger: toPlainText($tStore('states.unknownLanguage.trigger')), behavior: toPlainText($tStore('states.unknownLanguage.behavior'))},
        ]}
      />

      <!-- ── Propriedades ───────────────────────────────────────────── -->
      <DocsProps
        title={$tStore('props.title')}
        tables={[
          {
            cols: {
              prop: $tStore('props.table.prop'),
              type: $tStore('props.table.type'),
              default: $tStore('props.table.default'),
              required: $tStore('props.table.required'),
              description: $tStore('props.table.description'),
            },
            items: propItems,
          },
        ]}
        interfaceCode={INTERFACE_CODE}
        extensibilityTitle={$tStore('props.extensibilityTitle')}
        extensibilityNotes={$tStore('props.extensibility')}
        extensibilityCode={$tStore('props.extensibilityCode')}
      />

      <!-- ── Tokens ─────────────────────────────────────────────────── -->
      <DocsTokens
        title={$tStore('tokens.title')}
        cols={{
          token: $tStore('tokens.table.token'),
          value: $tStore('tokens.table.group'),
          description: $tStore('tokens.table.part'),
        }}
        items={tokenItems}
        customizationTitle={$tStore('tokens.customizationTitle')}
        customizationCode={$tStore('tokens.customizationCode')}
      />

      <!-- ── Acessibilidade ─────────────────────────────────────────── -->
      <DocsAccessibility
        screenReaderTitle={$tNavStore('common.screenReader')}
        screenReaderItems={screenReaderItems}
        title={$tStore('accessibility.title')}
        summary={$tStore('accessibility.summary')}
        items={[
          $tStore('accessibility.item1'),
          $tStore('accessibility.item2'),
          $tStore('accessibility.item3'),
          $tStore('accessibility.item4'),
          $tStore('accessibility.item5'),
          $tStore('accessibility.item6'),
        ]}
        keyboardTitle={$tStore('accessibility.keyboardTitle')}
        keyboardItems={[
          { key: 'Tab',         description: $tStore('accessibility.keyboard.tab')      },
          { key: 'Enter',       description: $tStore('accessibility.keyboard.enter')    },
          { key: 'Space',       description: $tStore('accessibility.keyboard.space')    },
          { key: 'Arrow Up / Arrow Down / Arrow Left / Arrow Right',     description: $tStore('accessibility.keyboard.arrows')   },
          { key: 'Home / End',  description: $tStore('accessibility.keyboard.homeEnd')  },
        ]}
      />

      <!-- ── Relacionados ───────────────────────────────────────────── -->
      <DocsRelated
        title={$tStore('related.title')}
        componentSlug="code-block"
        items={[
          { name: 'Table', description: $tStore('related.table'), path: '?path=/docs/ui-table--docs' },
          { name: 'Alert', description: $tStore('related.alert'), path: '?path=/docs/ui-alert--docs' },
          { name: 'Tabs',  description: $tStore('related.tabs'),  path: '?path=/docs/ui-tabs--docs'  },
          { name: 'Card',  description: $tStore('related.card'),  path: '?path=/docs/ui-card--docs'  },
        ]}
      />

      <!-- ── Notas ──────────────────────────────────────────────────── -->
      <DocsNotes
        title={$tStore('notes.title')}
        componentSlug="code-block"
        items={[
          { title: '', content: $tStore('notes.tip1') },
          { title: '', content: $tStore('notes.tip2') },
          { title: '', content: $tStore('notes.tip3') },
          { title: '', content: $tStore('notes.tip4') },
          { title: '', content: $tStore('notes.tip5') },
        ]}
      />

      <!-- ── Analytics ──────────────────────────────────────────────── -->
      <DocsAnalytics
        title={$tStore('analytics.title')}
        cols={{
          event: $tStore('analytics.table.event'),
          trigger: toPlainText($tStore('analytics.table.trigger')),
          payload: $tStore('analytics.table.payload'),
        }}
        items={[
          { event: $tStore('analytics.table.copy'),          trigger: toPlainText($tStore('analytics.table.copyTrigger')),          payload: $tStore('analytics.table.copyPayload')          },
          { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
          { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
          { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
        ]}
      />

      <!-- ── Testes ─────────────────────────────────────────────────── -->
      <DocsTestes
        title={$tStore('testes.title')}
        functional={{
          title: $tStore('testes.functional.title'),
          description: $tStore('testes.functional.description'),
          cols: {
            action: $tNavStore('common.userAction'),
            result: $tNavStore('common.expectedResult'),
            priority: $tNavStore('common.priority'),
          },
          items: [
            { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item7.action'), result: $tStore('testes.functional.item7.result'), priority: localPriority($tStore('testes.functional.item7.priority'), $tNavStore) },
            { action: $tStore('testes.functional.item8.action'), result: $tStore('testes.functional.item8.result'), priority: localPriority($tStore('testes.functional.item8.priority'), $tNavStore) },
          ],
        }}
        accessibility={{
          title: $tStore('testes.accessibility.title'),
          description: $tStore('testes.accessibility.description'),
          cols: {
            criterion: $tNavStore('common.criterion'),
            level: 'WCAG',
            how: $tNavStore('common.howToVerify'),
          },
          items: [
            { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
            { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
            { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
            { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
            { criterion: $tStore('testes.accessibility.item5.criterion'), level: $tStore('testes.accessibility.item5.level'), how: $tStore('testes.accessibility.item5.how') },
          ],
        }}
        visual={{
          title: $tStore('testes.visual.title'),
          description: $tStore('testes.visual.description'),
          cols: {
            story: $tNavStore('common.storyState'),
            priority: $tNavStore('common.priority'),
          },
          items: [
            { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
            { story: $tStore('testes.visual.item5.story'), priority: localPriority($tStore('testes.visual.item5.priority'), $tNavStore) },
          ],
        }}
      />
</DocsPageLayout>
