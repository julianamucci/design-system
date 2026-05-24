import { useCallback, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import textareaTranslations from "@shared/content/textarea/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

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


// ─── Componente principal ─────────────────────────────────────────────────────

export function TextareaDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(textareaTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  const breadcrumb = useMemo(
    () => [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/form" },
      { name: tContent("title") },
    ],
    [tContent],
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "textarea",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb,
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "textarea",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "textarea",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Estados controlados para os demos ────────────────────────────────────

  const [demoDescription, setDemoDescription] = useState("");
  const [demoBio, setDemoBio] = useState("");
  const [demoFeedback, setDemoFeedback] = useState("");
  const demoMax = 500;

  // Compositions state
  const [compCounter, setCompCounter] = useState("");
  const [compForm, setCompForm] = useState("");
  const [compFormResult, setCompFormResult] = useState<string | null>(null);

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImportBasic = `import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";`;

  const codeDefault = `<div className="space-y-2">
  <Label htmlFor="bio">Biografia</Label>
  <Textarea
    id="bio"
    placeholder="Conte um pouco sobre você..."
    className="resize-y min-h-[120px]"
  />
</div>`;

  const codeWithCounter = `const [value, setValue] = useState('');
const max = 500;

<div className="space-y-2">
  <Label htmlFor="description">Descrição</Label>
  <Textarea
    id="description"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="ex: Descreva o produto..."
    className="resize-y min-h-[120px]"
    maxLength={max}
  />
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>Descreva com clareza.</span>
    <span
      aria-live="polite"
      aria-label={\`\${value.length} de \${max} caracteres usados\`}
    >
      {value.length}/{max}
    </span>
  </div>
</div>`;

  const codeNoResize = `<div className="space-y-2">
  <Label htmlFor="feedback">Feedback</Label>
  <Textarea
    id="feedback"
    placeholder="O que poderíamos melhorar?"
    className="resize-none min-h-[120px]"
  />
</div>`;

  const codeTokensCustom = `/* Em globals.css — customização do Textarea */
[data-slot="textarea"] {
  min-height: 180px;
}

[data-slot="textarea"][aria-invalid="true"]:focus-visible {
  --ring-color: hsl(var(--destructive));
}`;

  const interfaceCode = `// Textarea — estende React.ComponentProps<"textarea">
function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  // Todos os atributos HTML nativos do <textarea> são suportados.
  // Principais:
  // value?: string
  // defaultValue?: string
  // onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  // placeholder?: string
  // maxLength?: number
  // rows?: number
  // disabled?: boolean
  // readOnly?: boolean
  // className?: string  (use resize-y | resize-none | resize)
}`;

  // ─── Counter helpers (acessível) ──────────────────────────────────────────

  const counterLabel = (count: number, max: number) =>
    locale === "pt-BR"
      ? `${count} de ${max} caracteres usados`
      : locale === "es"
      ? `${count} de ${max} caracteres usados`
      : `${count} of ${max} characters used`;

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="textarea"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add textarea"
        />
      }
    >
      {/* ── Demonstração ────────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Default */}
          <div className="space-y-2">
            <Label htmlFor="demo-description">
              {tContent("demonstration.labels.descriptionLabel")}
            </Label>
            <Textarea
              id="demo-description"
              value={demoDescription}
              onChange={(e) => setDemoDescription(e.target.value)}
              placeholder={tContent("demonstration.labels.descriptionPlaceholder")}
              className="resize-y min-h-[120px]"
              maxLength={demoMax}
              aria-describedby="demo-description-help"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span id="demo-description-help">
                {tContent("demonstration.labels.descriptionHelp")}
              </span>
              <span
                aria-live="polite"
                aria-label={counterLabel(demoDescription.length, demoMax)}
              >
                {demoDescription.length}/{demoMax}
              </span>
            </div>
          </div>

          {/* Bio — sem contador */}
          <div className="space-y-2">
            <Label htmlFor="demo-bio">
              {tContent("demonstration.labels.bioLabel")}
            </Label>
            <Textarea
              id="demo-bio"
              value={demoBio}
              onChange={(e) => setDemoBio(e.target.value)}
              placeholder={tContent("demonstration.labels.bioPlaceholder")}
              className="resize-y min-h-[120px]"
            />
          </div>

          {/* Feedback — resize-none */}
          <div className="space-y-2">
            <Label htmlFor="demo-feedback">
              {tContent("demonstration.labels.feedbackLabel")}
            </Label>
            <Textarea
              id="demo-feedback"
              value={demoFeedback}
              onChange={(e) => setDemoFeedback(e.target.value)}
              placeholder={tContent("demonstration.labels.feedbackPlaceholder")}
              className="resize-none min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.noResize")}
            </p>
          </div>
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ────────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ─────────────────────────────────────────────── */}
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
            { s: tContent("usage.scenarios.item5.s"), u: tContent("usage.scenarios.item5.u"), a: tContent("usage.scenarios.item5.a") },
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
              element: tContent("usage.uxWriting.table.label.name"),
              rules: tContent("usage.uxWriting.table.label.format"),
              do: tContent("usage.uxWriting.table.label.good"),
              dont: tContent("usage.uxWriting.table.label.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.placeholder.name"),
              rules: tContent("usage.uxWriting.table.placeholder.format"),
              do: tContent("usage.uxWriting.table.placeholder.good"),
              dont: tContent("usage.uxWriting.table.placeholder.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.counter.name"),
              rules: tContent("usage.uxWriting.table.counter.format"),
              do: tContent("usage.uxWriting.table.counter.good"),
              dont: tContent("usage.uxWriting.table.counter.bad"),
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
            tContent("usage.dont.item4"),
          ],
        }}
      />

      {/* ── Do & Don't ──────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="w-full space-y-2">
                <Label htmlFor="dodont-1-do">Descrição</Label>
                <Textarea
                  id="dodont-1-do"
                  placeholder="ex: Descreva o produto..."
                  className="resize-y min-h-[100px]"
                  maxLength={500}
                  defaultValue="Camiseta de algodão, gola redonda, manga curta."
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Descreva com clareza.</span>
                  <span aria-live="polite" aria-label={counterLabel(48, 500)}>
                    48/500
                  </span>
                </div>
              </div>
            ),
            dontPreview: (
              <div className="w-full space-y-2">
                <Label htmlFor="dodont-1-dont">Descrição</Label>
                <Textarea
                  id="dodont-1-dont"
                  placeholder="ex: Descreva o produto..."
                  className="resize-y min-h-[100px]"
                  maxLength={500}
                  defaultValue="Camiseta de algodão, gola redonda, manga curta."
                />
              </div>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="w-full space-y-2">
                <Label htmlFor="dodont-2-do">Biografia</Label>
                <Textarea
                  id="dodont-2-do"
                  placeholder="Conte um pouco sobre você..."
                  className="resize-y min-h-[100px]"
                />
              </div>
            ),
            dontPreview: (
              <div className="w-full space-y-2">
                <Label htmlFor="dodont-2-dont">Biografia</Label>
                <Textarea
                  id="dodont-2-dont"
                  placeholder="Conte um pouco sobre você..."
                  className="resize min-h-[100px]"
                />
              </div>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ──────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        code={codeImportBasic}
      />

      {/* ── Variantes ───────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div className="w-full space-y-2">
                <Label htmlFor="var-default">Biografia</Label>
                <Textarea
                  id="var-default"
                  placeholder="Conte um pouco sobre você..."
                  className="resize-y min-h-[120px]"
                />
              </div>
            ),
          },
          {
            name: tContent("variants.items.withCounter"),
            description: stripHtml(tContent("variants.styles.withCounter")),
            code: codeWithCounter,
            preview: (
              <div className="w-full space-y-2">
                <Label htmlFor="var-counter">Descrição</Label>
                <Textarea
                  id="var-counter"
                  placeholder="ex: Descreva o produto..."
                  className="resize-y min-h-[120px]"
                  maxLength={500}
                  defaultValue="Camiseta de algodão, gola redonda."
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Descreva com clareza.</span>
                  <span aria-live="polite" aria-label={counterLabel(33, 500)}>
                    33/500
                  </span>
                </div>
              </div>
            ),
          },
          {
            name: tContent("variants.items.noResize"),
            description: stripHtml(tContent("variants.styles.noResize")),
            code: codeNoResize,
            preview: (
              <div className="w-full space-y-2">
                <Label htmlFor="var-noresize">Feedback</Label>
                <Textarea
                  id="var-noresize"
                  placeholder="O que poderíamos melhorar?"
                  className="resize-none min-h-[120px]"
                />
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ─────────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="textarea"
        items={[
          {
            name: tContent("variants.compositions.withLabel.name"),
            description: tContent("variants.compositions.withLabel.description"),
            useWhen: tContent("variants.compositions.withLabel.use"),
            code: `<div className="flex flex-col gap-1.5 w-full max-w-md">
  <Label htmlFor="ta-label">Descrição</Label>
  <Textarea
    id="ta-label"
    className="resize-y min-h-[120px]"
    placeholder="ex: Descreva o produto..."
  />
</div>`,
            preview: (
              <div className="flex flex-col gap-1.5 w-full max-w-md">
                <Label htmlFor="comp-ta-label">Descrição</Label>
                <Textarea
                  id="comp-ta-label"
                  className="resize-y min-h-[120px]"
                  placeholder="ex: Descreva o produto..."
                />
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withHint.name"),
            description: tContent("variants.compositions.withHint.description"),
            useWhen: tContent("variants.compositions.withHint.use"),
            code: `<div className="flex flex-col gap-1.5 w-full max-w-md">
  <Label htmlFor="ta-hint">Descrição</Label>
  <Textarea
    id="ta-hint"
    className="resize-y min-h-[120px]"
    placeholder="ex: Descreva o produto..."
  />
  <p className="text-xs text-muted-foreground">
    Descreva o produto com clareza, destacando os principais atributos.
  </p>
</div>`,
            preview: (
              <div className="flex flex-col gap-1.5 w-full max-w-md">
                <Label htmlFor="comp-ta-hint">Descrição</Label>
                <Textarea
                  id="comp-ta-hint"
                  className="resize-y min-h-[120px]"
                  placeholder="ex: Descreva o produto..."
                />
                <p className="text-xs text-muted-foreground">
                  Descreva o produto com clareza, destacando os principais atributos.
                </p>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withCounter.name"),
            description: tContent("variants.compositions.withCounter.description"),
            useWhen: tContent("variants.compositions.withCounter.use"),
            code: `const [value, setValue] = useState("");

<div className="flex flex-col gap-1.5 w-full max-w-md">
  <Label htmlFor="ta-counter">Descrição</Label>
  <Textarea
    id="ta-counter"
    className="resize-y min-h-[120px]"
    placeholder="ex: Descreva o produto..."
    maxLength={500}
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
  <div className="flex justify-between items-start gap-3 text-xs text-muted-foreground">
    <span>Descreva o produto com clareza.</span>
    <span
      className="tabular-nums shrink-0"
      aria-live="polite"
      aria-label={\`\${value.length} de 500 caracteres usados\`}
    >
      0/500
    </span>
  </div>
</div>`,
            preview: (
              <div className="flex flex-col gap-1.5 w-full max-w-md">
                <Label htmlFor="comp-ta-counter">Descrição</Label>
                <Textarea
                  id="comp-ta-counter"
                  className="resize-y min-h-[120px]"
                  placeholder="ex: Descreva o produto..."
                  maxLength={500}
                  value={compCounter}
                  onChange={(e) => setCompCounter(e.target.value)}
                />
                <div className="flex justify-between items-start gap-3 text-xs text-muted-foreground">
                  <span>Descreva o produto com clareza.</span>
                  <span
                    className="tabular-nums shrink-0"
                    aria-live="polite"
                    aria-label={counterLabel(compCounter.length, 500)}
                  >
                    {compCounter.length}/500
                  </span>
                </div>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withError.name"),
            description: tContent("variants.compositions.withError.description"),
            useWhen: tContent("variants.compositions.withError.use"),
            code: `<div className="flex flex-col gap-1.5 w-full max-w-md">
  <Label htmlFor="ta-error">Descrição</Label>
  <Textarea
    id="ta-error"
    className="resize-y min-h-[120px]"
    placeholder="ex: Descreva o produto..."
    aria-invalid="true"
    aria-describedby="ta-error-error"
  />
  <p className="text-xs text-destructive" id="ta-error-error">
    A descrição é obrigatória e deve ter pelo menos 20 caracteres.
  </p>
</div>`,
            preview: (
              <div className="flex flex-col gap-1.5 w-full max-w-md">
                <Label htmlFor="comp-ta-error">Descrição</Label>
                <Textarea
                  id="comp-ta-error"
                  className="resize-y min-h-[120px]"
                  placeholder="ex: Descreva o produto..."
                  aria-invalid="true"
                  aria-describedby="comp-ta-error-error"
                />
                <p className="text-xs text-destructive" id="comp-ta-error-error">
                  A descrição é obrigatória e deve ter pelo menos 20 caracteres.
                </p>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.inForm.name"),
            description: tContent("variants.compositions.inForm.description"),
            useWhen: tContent("variants.compositions.inForm.use"),
            code: `const [value, setValue] = useState("");

<form
  className="flex flex-col gap-4 w-full max-w-md"
  aria-label="Formulário de feedback"
  onSubmit={(e) => {
    e.preventDefault();
    // submit value
  }}
>
  <div className="flex flex-col gap-1.5">
    <Label htmlFor="ta-form">Feedback</Label>
    <Textarea
      id="ta-form"
      name="feedback"
      className="resize-y min-h-[120px]"
      placeholder="Compartilhe sua opinião..."
      maxLength={280}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <div className="flex justify-between items-start gap-3 text-xs text-muted-foreground">
      <span>Seja específico para ajudarmos melhor.</span>
      <span
        className="tabular-nums shrink-0"
        aria-live="polite"
        aria-label={\`\${value.length} de 280 caracteres usados\`}
      >
        0/280
      </span>
    </div>
  </div>
  <Button type="submit">Enviar</Button>
</form>`,
            preview: (
              <form
                className="flex flex-col gap-4 w-full max-w-md"
                aria-label="Formulário de feedback"
                onSubmit={(e) => {
                  e.preventDefault();
                  setCompFormResult(compForm.trim() ? `Enviado: "${compForm}"` : "Digite algo antes de enviar.");
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comp-ta-form">Feedback</Label>
                  <Textarea
                    id="comp-ta-form"
                    name="feedback"
                    className="resize-y min-h-[120px]"
                    placeholder="Compartilhe sua opinião..."
                    maxLength={280}
                    value={compForm}
                    onChange={(e) => setCompForm(e.target.value)}
                  />
                  <div className="flex justify-between items-start gap-3 text-xs text-muted-foreground">
                    <span>Seja específico para ajudarmos melhor.</span>
                    <span
                      className="tabular-nums shrink-0"
                      aria-live="polite"
                      aria-label={counterLabel(compForm.length, 280)}
                    >
                      {compForm.length}/280
                    </span>
                  </div>
                </div>
                <Button type="submit">Enviar</Button>
                {compFormResult && (
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {compFormResult}
                  </p>
                )}
              </form>
            ),
          },
        ]}
      />

      {/* ── Estados ─────────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.title"),
          trigger: tNav("common.userAction"),
          behavior: tNav("common.expectedResult"),
        }}
        items={[
          { label: tContent("states.items.default"),  trigger: "—",                 behavior: stripHtml(tContent("states.descriptions.default")) },
          { label: tContent("states.items.focus"),    trigger: "Tab / click",       behavior: stripHtml(tContent("states.descriptions.focus")) },
          { label: tContent("states.items.filled"),   trigger: "typing",            behavior: stripHtml(tContent("states.descriptions.filled")) },
          { label: tContent("states.items.disabled"), trigger: "disabled prop",     behavior: stripHtml(tContent("states.descriptions.disabled")) },
          { label: tContent("states.items.invalid"),  trigger: "aria-invalid",      behavior: stripHtml(tContent("states.descriptions.invalid")) },
          { label: tContent("states.items.readonly"), trigger: "readOnly prop",     behavior: stripHtml(tContent("states.descriptions.readonly")) },
        ]}
      />

      {/* ── Propriedades ────────────────────────────────────────────── */}
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
              { name: "value",        type: tContent("props.table.value.type"),        defaultValue: tContent("props.table.value.default"),        required: tContent("props.table.value.required"),        description: stripHtml(tContent("props.table.value.description")) },
              { name: "defaultValue", type: tContent("props.table.defaultValue.type"), defaultValue: tContent("props.table.defaultValue.default"), required: tContent("props.table.defaultValue.required"), description: stripHtml(tContent("props.table.defaultValue.description")) },
              { name: "onChange",     type: tContent("props.table.onChange.type"),     defaultValue: tContent("props.table.onChange.default"),     required: tContent("props.table.onChange.required"),     description: stripHtml(tContent("props.table.onChange.description")) },
              { name: "placeholder",  type: tContent("props.table.placeholder.type"),  defaultValue: tContent("props.table.placeholder.default"),  required: tContent("props.table.placeholder.required"),  description: stripHtml(tContent("props.table.placeholder.description")) },
              { name: "maxLength",    type: tContent("props.table.maxLength.type"),    defaultValue: tContent("props.table.maxLength.default"),    required: tContent("props.table.maxLength.required"),    description: stripHtml(tContent("props.table.maxLength.description")) },
              { name: "rows",         type: tContent("props.table.rows.type"),         defaultValue: tContent("props.table.rows.default"),         required: tContent("props.table.rows.required"),         description: stripHtml(tContent("props.table.rows.description")) },
              { name: "disabled",     type: tContent("props.table.disabled.type"),     defaultValue: tContent("props.table.disabled.default"),     required: tContent("props.table.disabled.required"),     description: stripHtml(tContent("props.table.disabled.description")) },
              { name: "readOnly",     type: tContent("props.table.readOnly.type"),     defaultValue: tContent("props.table.readOnly.default"),     required: tContent("props.table.readOnly.required"),     description: stripHtml(tContent("props.table.readOnly.description")) },
              { name: "className",    type: tContent("props.table.className.type"),    defaultValue: tContent("props.table.className.default"),    required: tContent("props.table.className.required"),    description: stripHtml(tContent("props.table.className.description")) },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibilityCode")}
      />

      {/* ── Tokens ──────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--input",            value: tContent("tokens.table.input.class"),            description: tContent("tokens.table.input.part") },
          { token: "—",                  value: tContent("tokens.table.background.class"),       description: tContent("tokens.table.background.part") },
          { token: "--foreground",       value: tContent("tokens.table.foreground.class"),       description: tContent("tokens.table.foreground.part") },
          { token: "--muted-foreground", value: tContent("tokens.table.mutedForeground.class"),  description: tContent("tokens.table.mutedForeground.part") },
          { token: "--ring",             value: tContent("tokens.table.ring.class"),             description: tContent("tokens.table.ring.part") },
          { token: "--destructive",      value: tContent("tokens.table.destructive.class"),      description: tContent("tokens.table.destructive.part") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeTokensCustom}
      />

      {/* ── Acessibilidade ──────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.items.item1"),
          tContent("accessibility.items.item2"),
          tContent("accessibility.items.item3"),
          tContent("accessibility.items.item4"),
          tContent("accessibility.items.item5"),
          tContent("accessibility.items.item6"),
        ]}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab",        description: tContent("accessibility.keyboard.tab") },
          { key: "Shift+Tab",  description: tContent("accessibility.keyboard.shiftTab") },
          { key: "Enter",      description: tContent("accessibility.keyboard.enter") },
          { key: "Shift+Enter",description: tContent("accessibility.keyboard.shiftEnter") },
          { key: "Esc",        description: tContent("accessibility.keyboard.esc") },
        ]}
      />

      {/* ── Relacionados ────────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: tContent("related.items.input.name"),
            description: tContent("related.items.input.description"),
            path: "?path=/docs/ui-input--docs",
          },
          {
            name: tContent("related.items.label.name"),
            description: tContent("related.items.label.description"),
            path: "?path=/docs/ui-label--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: tContent("related.items.form.description"),
            path: "?path=/docs/ui-form--docs",
          },
          {
            name: tContent("related.items.inputOTP.name"),
            description: tContent("related.items.inputOTP.description"),
            path: "?path=/docs/ui-inputotp--docs",
          },
        ]}
      />

      {/* ── Notas ───────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
        ]}
      />

      {/* ── Analytics ───────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: "field_blur",
            trigger: tContent("analytics.table.field_blur.trigger"),
            payload: tContent("analytics.table.field_blur.payload"),
          },
          {
            event: "docs_page_view",
            trigger: tNav("common.pageMount") || "Página de docs é montada",
            payload: '{ component_name: "textarea", locale, page_title }',
          },
          {
            event: "docs_section_viewed",
            trigger: tNav("common.sectionViewed") || "Seção entra no viewport",
            payload: '{ section_id, component_name: "textarea", locale }',
          },
        ]}
      />

      {/* ── Testes ──────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4].map((i) => ({
            action: stripHtml(tContent(`testes.functional.item${i}.action`)),
            result: stripHtml(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.high"),
          })),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            criterion: stripHtml(tContent(`testes.accessibility.item${i}`)),
            level: "AA",
            how: "axe-core",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
