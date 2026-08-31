import { useCallback, useEffect, useMemo, type FocusEvent } from "react";
import { FormField, Fieldset } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import formTranslations from "@shared/content/form/translations.json";

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
import { stripHtml, toPlainText } from "@/lib/strip-html";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Nav ─────────────────────────────────────────────────────────────────────
//
// O conteúdo compartilhado do form não traz bloco `nav`, então os rótulos saem
// do `ui.json`. A ordem é a mesma das outras páginas deste componente.

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
      { id: "composicoes",  label: t("nav.compositions") },
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

const IMPORT_CODE = `import { FormField, Fieldset } from "@/components/ui/form"
import { Input } from "@/components/ui/input"`;

const INTERFACE_CODE = `// <FormField> — o controle é o filho projetado.
type FormFieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  label?: React.ReactNode;       // Texto do rótulo
  description?: React.ReactNode; // Texto de apoio
  error?: React.ReactNode;       // Mensagem de erro (aria-live="polite")
  children: React.ReactNode;     // O controle: Input, Textarea, Select…
};

// <Fieldset> — os campos são os filhos projetados.
type FieldsetProps = React.ComponentProps<"fieldset"> & {
  legend?: React.ReactNode;      // Texto do <legend>
};`;

const CUSTOMIZATION_CODE = `/* Em styles.css — sobrescrever tokens do form */
:root {
  --spacing-1-5: 0.375rem;         /* gap entre label, controle, descrição e erro */
  --spacing-4: 1rem;               /* gap entre campos dentro do fieldset */
  --foreground: 222 84% 5%;        /* cor do label e da legend */
  --muted-foreground: 215 16% 47%; /* cor da descrição */
  --destructive: 0 84% 60%;        /* cor do erro */
  --font-weight-medium: 500;       /* peso do label */
}`;

// ─── Componente principal ─────────────────────────────────────────────────────

export function FormDocs() {
  const { t: tNav } = useTranslation(uiTranslations);

  // O conteúdo compartilhado nomeia as duas peças pelas FACTORIES da stack de
  // referência, e só isso é sobrescrito aqui. A prosa de extensibilidade era
  // sobrescrita também, nas quatro stacks, até o texto compartilhado deixar de
  // nomear uma fábrica: contorno repetido em quatro lugares é sintoma de defeito
  // na origem, não de quatro necessidades diferentes.
  const { t: tContent, locale } = useTranslation(formTranslations, {
    "*": {
      "props.fieldTitle": "FormField",
      "props.fieldsetTitle": "Fieldset",
    },
  });

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "form",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "form",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "form",
        locale,
      });
    },
    [locale],
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const priorityLabel = (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high");
  const yes = tNav("common.yes");
  const no = tNav("common.no");

  /**
   * Os dois eventos de campo que a tabela de analytics documenta, ligados no
   * controle da demonstração.
   *
   * A saída só conta quando o campo tem valor: passar o foco por cima sem
   * digitar nada não é preenchimento abandonado, e contaria como se fosse.
   */
  const fieldTracking = (fieldName: string) => ({
    onFocus: () => {
      track("field_focus", { component: "form", field_name: fieldName, location: "docs_demo" });
    },
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.currentTarget.value.length > 0) {
        track("field_blur", { component: "form", field_name: fieldName, location: "docs_demo" });
      }
    },
  });

  // Os snippets saem dos MESMOS rótulos traduzidos que o preview mostra — se
  // fossem cravados aqui, o exemplo de código ficaria em português para quem lê
  // a página em inglês ou espanhol.
  const codeLabelOnly =
    `<FormField label="${tContent("demonstration.labels.nameLabel")}">\n` +
    `  <Input type="text" placeholder="${tContent("demonstration.labels.namePlaceholder")}" />\n` +
    `</FormField>`;

  const codeWithDescription =
    `<FormField\n` +
    `  label="${tContent("demonstration.labels.emailLabel")}"\n` +
    `  description="${tContent("demonstration.labels.emailDescription")}"\n` +
    `>\n` +
    `  <Input type="email" placeholder="${tContent("demonstration.labels.emailPlaceholder")}" />\n` +
    `</FormField>`;

  const codeFieldset =
    `<Fieldset legend="${tContent("demonstration.labels.groupLegend")}">\n` +
    `  <FormField label="${tContent("demonstration.labels.streetLabel")}">\n` +
    `    <Input type="text" placeholder="${tContent("demonstration.labels.streetPlaceholder")}" />\n` +
    `  </FormField>\n` +
    `  <FormField label="${tContent("demonstration.labels.cityLabel")}">\n` +
    `    <Input type="text" placeholder="${tContent("demonstration.labels.cityPlaceholder")}" />\n` +
    `  </FormField>\n` +
    `</Fieldset>`;

  /** O agrupamento de endereço, usado na demonstração, no par 3 e na composição. */
  const addressFieldset = (
    <Fieldset legend={tContent("demonstration.labels.groupLegend")}>
      <FormField label={tContent("demonstration.labels.streetLabel")}>
        <Input type="text" placeholder={tContent("demonstration.labels.streetPlaceholder")} />
      </FormField>
      <FormField label={tContent("demonstration.labels.cityLabel")}>
        <Input type="text" placeholder={tContent("demonstration.labels.cityPlaceholder")} />
      </FormField>
    </Fieldset>
  );

  const propsCols = {
    prop: tContent("props.table.prop"),
    type: tContent("props.table.type"),
    default: tContent("props.table.default"),
    required: tContent("props.table.required"),
    description: tContent("props.table.description"),
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="form"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")} componentSlug="form">
        <div className="nds-stack nds-w-full nds-max-w-sm">
          <FormField
            label={tContent("demonstration.labels.nameLabel")}
            description={tContent("demonstration.labels.nameDescription")}
          >
            <Input
              type="text"
              placeholder={tContent("demonstration.labels.namePlaceholder")}
              {...fieldTracking("name")}
            />
          </FormField>

          <FormField
            label={tContent("demonstration.labels.emailLabel")}
            description={tContent("demonstration.labels.emailDescription")}
          >
            <Input
              type="email"
              placeholder={tContent("demonstration.labels.emailPlaceholder")}
              {...fieldTracking("email")}
            />
          </FormField>

          <FormField
            label={tContent("demonstration.labels.passwordLabel")}
            error={tContent("demonstration.labels.passwordError")}
          >
            {/* `aria-invalid` é escrito à mão: o campo anuncia e pinta o erro,
                mas quem valida é a lib de formulário da aplicação. */}
            <Input
              type="password"
              autoComplete="new-password"
              aria-invalid
              {...fieldTracking("password")}
            />
          </FormField>

          <FormField
            label={tContent("demonstration.labels.bioLabel")}
            description={tContent("demonstration.labels.bioDescription")}
          >
            <Textarea
              rows={3}
              placeholder={tContent("demonstration.labels.bioPlaceholder")}
              {...fieldTracking("bio")}
            />
          </FormField>

          {addressFieldset}
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[1, 2, 3, 4, 5].map((i) => tContent(`anatomy.item${i}`))}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: toPlainText(tContent(`usage.scenarios.item${i}.a`)),
          })),
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.do.item${i}`)),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [1, 2, 3].map((i) => tContent(`usage.dont.item${i}`)),
        }}
      />

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
            doPreview: (
              <FormField
                label={tContent("demonstration.labels.passwordLabel")}
                description={tContent("demonstration.labels.passwordDescription")}
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={tContent("demonstration.labels.passwordPlaceholder")}
                />
              </FormField>
            ),
            // O contraexemplo é o campo SEM rótulo, com o nome dele servindo de
            // placeholder — por isso aqui entra o rótulo, e não o placeholder
            // de pontinhos.
            dontPreview: (
              <Input
                type="password"
                autoComplete="new-password"
                placeholder={tContent("demonstration.labels.passwordLabel")}
              />
            ),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
            doPreview: (
              <FormField
                label={tContent("demonstration.labels.passwordLabel")}
                error={tContent("demonstration.labels.passwordError")}
              >
                <Input type="password" autoComplete="new-password" aria-invalid />
              </FormField>
            ),
            // A mensagem genérica mora no conteúdo compartilhado justamente
            // para ser traduzida junto com a boa, em vez de ficar presa em uma
            // língua dentro do código.
            dontPreview: (
              <FormField
                label={tContent("demonstration.labels.passwordLabel")}
                error={tContent("demonstration.labels.genericError")}
              >
                <Input type="password" autoComplete="new-password" aria-invalid />
              </FormField>
            ),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doCaption: toPlainText(tContent("doDont.pair3.do")),
            dontCaption: toPlainText(tContent("doDont.pair3.dont")),
            doPreview: addressFieldset,
            // Os mesmos dois campos, empilhados sem agrupamento: na tela é
            // igual, no leitor de tela some o rótulo do grupo.
            dontPreview: (
              <div className="nds-stack nds-w-full">
                <FormField label={tContent("demonstration.labels.streetLabel")}>
                  <Input
                    type="text"
                    placeholder={tContent("demonstration.labels.streetPlaceholder")}
                  />
                </FormField>
                <FormField label={tContent("demonstration.labels.cityLabel")}>
                  <Input
                    type="text"
                    placeholder={tContent("demonstration.labels.cityPlaceholder")}
                  />
                </FormField>
              </div>
            ),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={IMPORT_CODE}
        componentSlug="form"
        language="ts"
      />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      {/* Container de composições e não o de variantes: o conteúdo traz
          "quando usar" em cada item, e só este renderiza essa linha. */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        note={tContent("variants.note")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="form"
        items={["labelOnly", "withDescription"].map((k) => ({
          name: tContent(`variants.items.${k}.name`),
          trackId: k,
          description: tContent(`variants.items.${k}.description`),
          useWhen: tContent(`variants.items.${k}.use`),
          code: k === "labelOnly" ? codeLabelOnly : codeWithDescription,
          preview:
            k === "labelOnly" ? (
              <FormField label={tContent("demonstration.labels.nameLabel")}>
                <Input
                  type="text"
                  placeholder={tContent("demonstration.labels.namePlaceholder")}
                />
              </FormField>
            ) : (
              <FormField
                label={tContent("demonstration.labels.emailLabel")}
                description={tContent("demonstration.labels.emailDescription")}
              >
                <Input
                  type="email"
                  placeholder={tContent("demonstration.labels.emailPlaceholder")}
                />
              </FormField>
            ),
        }))}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="form"
        items={[
          {
            name: tContent("variants.compositions.fieldset.name"),
            trackId: "fieldset",
            description: tContent("variants.compositions.fieldset.description"),
            useWhen: tContent("variants.compositions.fieldset.use"),
            code: codeFieldset,
            preview: addressFieldset,
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={["default", "withError", "disabled"].map((k) => ({
          label: tContent(`states.${k}.label`),
          trigger: toPlainText(tContent(`states.${k}.trigger`)),
          behavior: toPlainText(tContent(`states.${k}.behavior`)),
        }))}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.fieldTitle"),
            cols: propsCols,
            items: [
              { name: "label",       type: "React.ReactNode", defaultValue: "—", required: no,  description: toPlainText(tContent("props.table.label")) },
              { name: "children",    type: "React.ReactNode", defaultValue: "—", required: yes, description: toPlainText(tContent("props.table.input")) },
              { name: "description", type: "React.ReactNode", defaultValue: "—", required: no,  description: toPlainText(tContent("props.table.description_prop")) },
              { name: "error",       type: "React.ReactNode", defaultValue: "—", required: no,  description: toPlainText(tContent("props.table.error")) },
              { name: "className",   type: "string",          defaultValue: "—", required: no,  description: toPlainText(tContent("props.table.className")) },
            ],
          },
          {
            title: tContent("props.fieldsetTitle"),
            cols: propsCols,
            items: [
              { name: "legend",    type: "React.ReactNode", defaultValue: "—", required: no, description: toPlainText(tContent("props.table.legend")) },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: no, description: toPlainText(tContent("props.table.children")) },
              { name: "className", type: "string",          defaultValue: "—", required: no, description: toPlainText(tContent("props.table.className")) },
            ],
          },
        ]}
        interfaceCode={INTERFACE_CODE}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={stripHtml(tContent("props.extensibility"))}
      />

      {/* ── Tokens ────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--spacing-1-5",        value: ".nds-form-field",       k: "fieldGap" },
          { token: "--foreground",         value: ".nds-form-label",       k: "labelColor" },
          { token: "--font-weight-medium", value: ".nds-form-label",       k: "labelWeight" },
          { token: "--muted-foreground",   value: ".nds-form-description", k: "descriptionColor" },
          { token: "--destructive",        value: ".nds-form-error",       k: "errorColor" },
          { token: "--spacing-4",          value: ".nds-form-fieldset",    k: "fieldsetGap" },
          { token: "--foreground",         value: ".nds-form-legend",      k: "legendColor" },
        ].map(({ token, value, k }) => ({
          token,
          value,
          description: toPlainText(tContent(`tokens.table.${k}`)),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={CUSTOMIZATION_CODE}
        language="css"
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5].map((i) => tContent(`accessibility.item${i}`))}
        keyboardTitle={tNav("common.keyboard")}
        keyboardItems={[
          { key: "Tab",       description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Shift+Tab", description: toPlainText(tContent("accessibility.keyboard.shiftTab")) },
          { key: "A–Z / 0–9", description: toPlainText(tContent("accessibility.keyboard.typing")) },
          { key: "Escape",    description: toPlainText(tContent("accessibility.keyboard.escape")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="form"
        items={[
          { name: "Input",    description: toPlainText(tContent("related.input")),    path: "?path=/docs/primitives-form-input--docs" },
          { name: "Textarea", description: toPlainText(tContent("related.textarea")), path: "?path=/docs/primitives-form-textarea--docs" },
          { name: "Select",   description: toPlainText(tContent("related.select")),   path: "?path=/docs/primitives-form-select--docs" },
          { name: "Checkbox", description: toPlainText(tContent("related.checkbox")), path: "?path=/docs/primitives-form-checkbox--docs" },
          { name: "Label",    description: toPlainText(tContent("related.label")),    path: "?path=/docs/primitives-form-label--docs" },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="form"
        items={[1, 2, 3, 4, 5].map((i) => ({ title: "", content: tContent(`notes.tip${i}`) }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={["fieldFocus", "fieldBlur", "fieldError", "pageView", "sectionViewed", "langSwitch"].map((k) => ({
          event: tContent(`analytics.table.${k}`),
          trigger: toPlainText(tContent(`analytics.table.${k}Trigger`)),
          payload: toPlainText(tContent(`analytics.table.${k}Payload`)),
        }))}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
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
          // Só `toPlainText`: a célula é textNode e o item5 traz
          // `&lt;fieldset&gt;`, que sairia literal sem a decodificação.
          items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
            action: toPlainText(tContent(`testes.functional.item${i}.action`)),
            result: toPlainText(tContent(`testes.functional.item${i}.result`)),
            priority: priorityLabel(tContent(`testes.functional.item${i}.priority`)),
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
          // A lista é PLANA: cada item é um critério solto, sem a trinca
          // critério/nível/como.
          items: [1, 2, 3, 4, 5].map((i) => ({
            criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
            level: "AA",
            how: "axe-core + manual",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          description: tContent("testes.visual.description"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            story: toPlainText(tContent(`testes.visual.item${i}.story`)),
            priority: priorityLabel(tContent(`testes.visual.item${i}.priority`)),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
