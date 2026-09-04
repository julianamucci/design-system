import { useCallback, useEffect, useMemo } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import codeBlockTranslations from "@shared/content/code-block/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";
import { toPlainText } from "@/lib/strip-html";

const SLUG = "code-block";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * A tabela de tokens do JSON compartilhado tem duas colunas (`token` e `part`) e
 * três grupos com título próprio (`surfaceTitle`, `syntaxTitle`,
 * `inheritedTitle`). `DocsTokens` renderiza uma única tabela de três colunas e
 * um único `id="tokens"` — três seções gerariam id duplicado. O grupo vira,
 * então, a coluna do meio, e o cabeçalho dela sai de `tokens.table.group` no
 * conteúdo compartilhado, como as outras três stacks.
 */

// ─── Nav ─────────────────────────────────────────────────────────────────────

const getNavGroups = (t: (key: string) => string) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy") },
      { id: "quando-usar",  label: t("nav.usage") },
      { id: "do-dont",      label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import") },
      { id: "variantes",    label: t("nav.variants") },
      { id: "estados",      label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens",       label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related") },
      { id: "notas",          label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes",    label: t("nav.testes") },
    ],
  },
];

// ─── Snippets exibidos pelos CodeBlocks da página ────────────────────────────
// Strings literais idênticas nas 4 stacks (ver .pipeline-context/code-block.md).

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
const langMarkup = `<button class="nds-button" :disabled="loading">Salvar</button>`;
const langStyles = `.nds-card { padding: var(--spacing-4); }`;
const langData = `{ "port": 6006, "open": true }`;
const langShell = `npm run build -- --mode production`;
const langText = `Sem classificação: monoespaçado e sem cor.`;

const compositionCode = `const items = await load();
const total = items.length;
render(items, total);`;

/** Snippet JSX exibido no toggle "Ver código" de cada linguagem suportada. */
const variantSnippet = (language: string) =>
  `<CodeBlock\n  code={source}\n  language="${language}"\n  showLineNumbers={false}\n/>`;

// ─── Componente principal ────────────────────────────────────────────────────

export function CodeBlockDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(codeBlockTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (codeBlockTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
    [locale],
  );

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: SLUG,
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/display" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: SLUG,
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: SLUG,
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // Rótulos acessíveis do botão copiar, traduzidos junto com a página.
  const copyLabel = tContent("demonstration.labels.copy");
  const copiedLabel = tContent("demonstration.labels.copied");
  const footerNote = tContent("demonstration.labels.footer");

  // ─── Code strings da seção Importação ─────────────────────────────────────

  const codeImportBasic = `import { CodeBlock } from "@/components/ui/code-block";`;

  const interfaceCode = `interface CodeBlockProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: string | number | Array<string | number>;
  lineKinds?: Array<"context" | "added" | "removed">;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  copyLabel?: string;
  copiedLabel?: string;
  addedLabel?: string;
  removedLabel?: string;
  regionLabel?: string;
}`;

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug={SLUG}
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")} componentSlug={SLUG}>
        <div className="nds-w-full nds-stack" data-spacing="md">
          <CodeBlock
            className="nds-w-full"
            code={demoTsx}
            language="tsx"
            title={tContent("demonstration.labels.fileName")}
            showLineNumbers
            highlightLines="3, 5-7"
            footer={footerNote}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:exemplo-tsx"
          />
          <CodeBlock
            className="nds-w-full"
            code={demoBash}
            language="bash"
            title={tContent("demonstration.labels.terminalTitle")}
            showLineNumbers={false}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:terminal"
          />
          <CodeBlock
            className="nds-w-full"
            code={demoCss}
            language="css"
            title={tContent("demonstration.labels.themeTitle")}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:tema-css"
          />
          <CodeBlock
            className="nds-w-full"
            code={demoJson}
            language="json"
            title={tContent("demonstration.labels.dataTitle")}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:package-json"
          />
          <CodeBlock
            className="nds-w-full"
            code={demoTxt}
            language="txt"
            title={tContent("demonstration.labels.plainTitle")}
            showLineNumbers={false}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            data-track="code"
            data-track-id="code-block:demonstracao:notas-txt"
          />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
          tContent("anatomy.item5"),
          tContent("anatomy.item6"),
          tContent("anatomy.item7"),
          tContent("anatomy.item8"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [
            tContent("usage.guidelines.item1"),
            tContent("usage.guidelines.item2"),
            tContent("usage.guidelines.item3"),
            tContent("usage.guidelines.item4"),
          ],
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [
            { s: tContent("usage.scenarios.item1.s"), u: tContent("usage.scenarios.item1.u"), a: tContent("usage.scenarios.item1.a") },
            { s: tContent("usage.scenarios.item2.s"), u: tContent("usage.scenarios.item2.u"), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: tContent("usage.scenarios.item3.a") },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: tContent("usage.scenarios.item4.a") },
          ],
        }}
        uxWriting={{
          title: tContent("usage.uxWriting.title"),
          cols: {
            element: tContent("usage.uxWriting.table.element"),
            rules: tContent("usage.uxWriting.table.rules"),
            do: tContent("usage.uxWriting.table.correct"),
            dont: tContent("usage.uxWriting.table.avoid"),
          },
          items: [
            {
              element: tContent("usage.uxWriting.table.headerTitle.name"),
              rules: tContent("usage.uxWriting.table.headerTitle.format"),
              do: tContent("usage.uxWriting.table.headerTitle.good"),
              dont: tContent("usage.uxWriting.table.headerTitle.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.footer.name"),
              rules: tContent("usage.uxWriting.table.footer.format"),
              do: tContent("usage.uxWriting.table.footer.good"),
              dont: tContent("usage.uxWriting.table.footer.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.copy.name"),
              rules: tContent("usage.uxWriting.table.copy.format"),
              do: tContent("usage.uxWriting.table.copy.good"),
              dont: tContent("usage.uxWriting.table.copy.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.comments.name"),
              rules: tContent("usage.uxWriting.table.comments.format"),
              do: tContent("usage.uxWriting.table.comments.good"),
              dont: tContent("usage.uxWriting.table.comments.bad"),
            },
          ],
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [
            tContent("usage.do.item1"),
            tContent("usage.do.item2"),
            tContent("usage.do.item3"),
            tContent("usage.do.item4"),
          ],
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [
            tContent("usage.dont.item1"),
            tContent("usage.dont.item2"),
            tContent("usage.dont.item3"),
          ],
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <CodeBlock
                className="nds-w-full"
                code={compositionCode}
                language="ts"
                title="lista.ts"
                highlightLines={[2]}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:do-dont:do-1"
              />
            ),
            dontPreview: (
              <CodeBlock
                className="nds-w-full"
                code={compositionCode}
                highlightLines="1-2"
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:do-dont:dont-1"
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              // A legenda fala de "um comando de uma linha": o par precisa ser
              // esse comando, sem rótulo de arquivo — não um script de 3 linhas.
              <CodeBlock
                className="nds-w-full"
                code={langShell}
                language="bash"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:do-dont:do-2"
              />
            ),
            dontPreview: (
              <CodeBlock
                className="nds-w-full"
                code={langShell}
                language="bash"
                showLineNumbers
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:do-dont:dont-2"
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withFooter")}
        secondaryCode={tContent("props.extensibilityCode")}
        componentSlug={SLUG}
      />

      {/* ── Variantes (linguagens suportadas) ─────────────────────────── */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug={SLUG}
        items={[
          {
            name: "script",
            description: tContent("variants.items.script"),
            code: variantSnippet("tsx"),
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={langScript}
                language="tsx"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:script"
              />
            ),
          },
          {
            name: "markup",
            description: tContent("variants.items.markup"),
            code: variantSnippet("vue"),
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={langMarkup}
                language="vue"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:markup"
              />
            ),
          },
          {
            name: "styles",
            description: tContent("variants.items.styles"),
            code: variantSnippet("css"),
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={langStyles}
                language="css"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:styles"
              />
            ),
          },
          {
            name: "data",
            description: tContent("variants.items.data"),
            code: variantSnippet("json"),
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={langData}
                language="json"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:data"
              />
            ),
          },
          {
            name: "shell",
            description: tContent("variants.items.shell"),
            code: variantSnippet("bash"),
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={langShell}
                language="bash"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:shell"
              />
            ),
          },
          {
            name: "text",
            description: tContent("variants.items.text"),
            code: variantSnippet("txt"),
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={langText}
                language="txt"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:text"
              />
            ),
          },
          {
            // trackId, e não `name`: o nome vem traduzido e o mesmo evento sairia
            // com um valor por idioma.
            trackId: "withTitle",
            name: tContent("variants.items.withTitle.name"),
            description: tContent("variants.items.withTitle.description"),
            useWhen: tContent("variants.items.withTitle.use"),
            code: `<CodeBlock\n  code={source}\n  language="ts"\n  title="lista.ts"\n/>`,
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={compositionCode}
                language="ts"
                title="lista.ts"
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:with-title"
              />
            ),
          },
          {
            trackId: "withoutNumbers",
            name: tContent("variants.items.withoutNumbers.name"),
            description: tContent("variants.items.withoutNumbers.description"),
            useWhen: tContent("variants.items.withoutNumbers.use"),
            code: `<CodeBlock\n  code={source}\n  language="ts"\n  showLineNumbers={false}\n/>`,
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={compositionCode}
                language="ts"
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:without-numbers"
              />
            ),
          },
          {
            trackId: "highlighted",
            name: tContent("variants.items.highlighted.name"),
            description: tContent("variants.items.highlighted.description"),
            useWhen: tContent("variants.items.highlighted.use"),
            code: `<CodeBlock\n  code={source}\n  language="ts"\n  highlightLines={[2]}\n/>`,
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={compositionCode}
                language="ts"
                highlightLines={[2]}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:highlighted"
              />
            ),
          },
          {
            trackId: "withFooter",
            name: tContent("variants.items.withFooter.name"),
            description: tContent("variants.items.withFooter.description"),
            useWhen: tContent("variants.items.withFooter.use"),
            code: `<CodeBlock\n  code={source}\n  language="ts"\n  footer="A ação de copiar leva apenas o código."\n/>`,
            preview: (
              <CodeBlock
                className="nds-w-full"
                code={compositionCode}
                language="ts"
                footer={footerNote}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                data-track="code"
                data-track-id="code-block:variantes:with-footer"
              />
            ),
          },
        ]}
      />

      {/* ── Configurações (States) ────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          { label: tContent("states.idle.label"),            trigger: toPlainText(tContent("states.idle.trigger")),            behavior: toPlainText(tContent("states.idle.behavior"))},
          { label: tContent("states.copied.label"),          trigger: toPlainText(tContent("states.copied.trigger")),          behavior: toPlainText(tContent("states.copied.behavior"))},
          { label: tContent("states.numbered.label"),        trigger: toPlainText(tContent("states.numbered.trigger")),        behavior: toPlainText(tContent("states.numbered.behavior"))},
          { label: tContent("states.unnumbered.label"),      trigger: toPlainText(tContent("states.unnumbered.trigger")),      behavior: toPlainText(tContent("states.unnumbered.behavior"))},
          { label: tContent("states.scrolling.label"),       trigger: toPlainText(tContent("states.scrolling.trigger")),       behavior: toPlainText(tContent("states.scrolling.behavior"))},
          { label: tContent("states.unknownLanguage.label"), trigger: toPlainText(tContent("states.unknownLanguage.trigger")), behavior: toPlainText(tContent("states.unknownLanguage.behavior"))},
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              "code",
              "language",
              "title",
              "showLineNumbers",
              "highlightLines",
              "lineKinds",
              "actions",
              "footer",
              "copyLabel",
              "copiedLabel",
              "addedLabel",
              "removedLabel",
              "regionLabel",
              "className",
            ].map((key) => ({
              name: tContent(`props.table.${key}.name`),
              type: tContent(`props.table.${key}.type`),
              defaultValue: tContent(`props.table.${key}.default`),
              required: tContent(`props.table.${key}.required`),
              description: tContent(`props.table.${key}.description`),
            })),
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
        extensibilityCode={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ────────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.group"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          ...[
            "bg", "border", "headerBg", "highlightBg", "highlightAccent",
            "addedBg", "addedAccent", "removedBg", "removedAccent", "maxBlockSize",
          ].map((key) => ({
            token: tContent(`tokens.table.${key}.token`),
            value: tContent("tokens.surfaceTitle"),
            description: tContent(`tokens.table.${key}.part`),
          })),
          ...[
            "comment", "string", "number", "keyword", "builtin", "function",
            "tag", "attr", "property", "operator", "punctuation", "plain",
          ].map((key) => ({
            token: tContent(`tokens.table.${key}.token`),
            value: tContent("tokens.syntaxTitle"),
            description: tContent(`tokens.table.${key}.part`),
          })),
          ...["radius", "mutedForeground", "foreground", "borderBase"].map((key) => ({
            token: tContent(`tokens.table.${key}.token`),
            value: tContent("tokens.inheritedTitle"),
            description: tContent(`tokens.table.${key}.part`),
          })),
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.item1"),
          tContent("accessibility.item2"),
          tContent("accessibility.item3"),
          tContent("accessibility.item4"),
          tContent("accessibility.item5"),
          tContent("accessibility.item6"),
        ]}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={[
          { key: "Tab",         description: tContent("accessibility.keyboard.tab") },
          { key: "Enter",       description: tContent("accessibility.keyboard.enter") },
          { key: "Space",       description: tContent("accessibility.keyboard.space") },
          { key: "Arrow Up / Arrow Down / Arrow Left / Arrow Right",     description: tContent("accessibility.keyboard.arrows") },
          { key: "Home / End",  description: tContent("accessibility.keyboard.homeEnd") },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug={SLUG}
        items={[
          { name: "Table", description: toPlainText(tContent("related.table")), path: "?path=/docs/components-tables-table--docs" },
          { name: "Alert", description: toPlainText(tContent("related.alert")), path: "?path=/docs/components-feedback-alert--docs" },
          { name: "Tabs",  description: toPlainText(tContent("related.tabs")),  path: "?path=/docs/components-navigation-tabs--docs" },
          { name: "Card",  description: toPlainText(tContent("related.card")),  path: "?path=/docs/components-layout-card--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug={SLUG}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
          { title: "", content: tContent("notes.tip5") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          { event: tContent("analytics.table.copy"),          trigger: toPlainText(tContent("analytics.table.copyTrigger")),          payload: tContent("analytics.table.copyPayload") },
          { event: tContent("analytics.table.pageView"),      trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),      payload: tContent("analytics.table.pageViewPayload") },
          { event: tContent("analytics.table.sectionViewed"), trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")), payload: tContent("analytics.table.sectionViewedPayload") },
          { event: tContent("analytics.table.langSwitch"),    trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),    payload: tContent("analytics.table.langSwitchPayload") },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          description: tContent("testes.functional.description"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: ["item1", "item2", "item3", "item4", "item5", "item6", "item7", "item8"].map((key) => ({
            action: tContent(`testes.functional.${key}.action`),
            result: tContent(`testes.functional.${key}.result`),
            priority: tNav(priorityKeyMap[tContent(`testes.functional.${key}.priority`)] ?? "common.high"),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          description: tContent("testes.accessibility.description"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: ["item1", "item2", "item3", "item4", "item5"].map((key) => ({
            criterion: tContent(`testes.accessibility.${key}.criterion`),
            level: tContent(`testes.accessibility.${key}.level`),
            how: tContent(`testes.accessibility.${key}.how`),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: ["item1", "item2", "item3", "item4", "item5"].map((key) => ({
            story: tContent(`testes.visual.${key}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.${key}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
