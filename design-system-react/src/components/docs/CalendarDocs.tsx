import { useCallback, useEffect, useMemo, useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import calendarTranslations from "@shared/content/calendar/translations.json";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

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

export function CalendarDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(calendarTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "calendar",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "calendar",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "calendar",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Estados locais para as previews interativas ──────────────────────────
  const today = useMemo(() => new Date(), []);
  const [singleDate, setSingleDate] = useState<Date | undefined>(today);
  const [multipleDates, setMultipleDates] = useState<Date[] | undefined>([
    today,
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
  ]);
  const defaultRange = useMemo(
    () => ({
      from: today,
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
    }),
    [today]
  );
  const [range, setRange] = useState<{ from: Date; to?: Date } | undefined>(
    defaultRange
  );

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImportBasic = `import { Calendar } from "@/components/ui/calendar";`;

  const codeImportWithLocale = `import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "react-day-picker/locale";

<Calendar mode="single" locale={ptBR} selected={date} onSelect={setDate} />`;

  const codeSingle = `const [date, setDate] = useState<Date | undefined>(new Date());

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  locale={ptBR}
/>`;

  const codeMultiple = `const [dates, setDates] = useState<Date[] | undefined>([]);

<Calendar
  mode="multiple"
  selected={dates}
  onSelect={setDates}
  locale={ptBR}
/>`;

  const codeRange = `const [range, setRange] = useState<DateRange | undefined>();

<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  numberOfMonths={2}
  locale={ptBR}
/>`;

  const codeCaptionDropdown = `<Calendar
  mode="single"
  captionLayout="dropdown"
  locale={ptBR}
/>`;

  const codeWithWeekNumber = `<Calendar
  mode="single"
  showWeekNumber
  locale={ptBR}
/>`;

  const codeNumberOfMonths = `<Calendar
  mode="range"
  numberOfMonths={2}
  locale={ptBR}
/>`;

  const codeCustomizationTokens = `/* Em globals.css — tokens utilizados */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --radius: 0.5rem;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222 47% 11%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
}`;

  const interfaceCode = `// Calendar
interface CalendarProps extends React.ComponentProps<typeof DayPicker> {
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

// CalendarDayButton
interface CalendarDayButtonProps extends React.ComponentProps<typeof DayButton> {
  locale?: Partial<Locale>;
}`;

  // ─── Previews ─────────────────────────────────────────────────────────────

  const previewSingle = (
    <Calendar
      mode="single"
      selected={singleDate}
      onSelect={setSingleDate}
      locale={ptBR}
    />
  );

  const previewMultiple = (
    <Calendar
      mode="multiple"
      selected={multipleDates}
      onSelect={setMultipleDates}
      locale={ptBR}
    />
  );

  const previewRange = (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange as never}
      numberOfMonths={2}
      locale={ptBR}
    />
  );

  const previewCaptionDropdown = (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      selected={singleDate}
      onSelect={setSingleDate}
      locale={ptBR}
    />
  );

  const previewWithWeekNumber = (
    <Calendar
      mode="single"
      showWeekNumber
      selected={singleDate}
      onSelect={setSingleDate}
      locale={ptBR}
    />
  );

  const previewNumberOfMonths = (
    <Calendar
      mode="range"
      numberOfMonths={2}
      selected={defaultRange}
      locale={ptBR}
    />
  );

  const previewDoLocale = (
    <Calendar mode="single" selected={today} locale={ptBR} />
  );

  const previewDontLocale = <Calendar mode="single" selected={today} />;

  const previewDoDisabled = (
    <Calendar
      mode="single"
      selected={today}
      disabled={{ before: today }}
      locale={ptBR}
    />
  );

  const previewDontDisabled = (
    <Calendar mode="single" selected={today} locale={ptBR} />
  );

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add calendar"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex flex-wrap items-start justify-center gap-6">
          {previewSingle}
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={[
          tContent("anatomy.item1"),
          tContent("anatomy.item2"),
          tContent("anatomy.item3"),
          tContent("anatomy.item4"),
          tContent("anatomy.item5"),
          tContent("anatomy.item6"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: [
            tContent("usage.guidelines.item1"),
            tContent("usage.guidelines.item2"),
            tContent("usage.guidelines.item3"),
            tContent("usage.guidelines.item4"),
            tContent("usage.guidelines.item5"),
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
            { s: tContent("usage.scenarios.item6.s"), u: tContent("usage.scenarios.item6.u"), a: tContent("usage.scenarios.item6.a") },
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
              rules: stripHtml(tContent("usage.uxWriting.table.label.format")),
              do: tContent("usage.uxWriting.table.label.good"),
              dont: tContent("usage.uxWriting.table.label.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: stripHtml(tContent("usage.uxWriting.table.trigger.format")),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.disabled.name"),
              rules: stripHtml(tContent("usage.uxWriting.table.disabled.format")),
              do: stripHtml(tContent("usage.uxWriting.table.disabled.good")),
              dont: tContent("usage.uxWriting.table.disabled.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.srOnly.name"),
              rules: stripHtml(tContent("usage.uxWriting.table.srOnly.format")),
              do: tContent("usage.uxWriting.table.srOnly.good"),
              dont: tContent("usage.uxWriting.table.srOnly.bad"),
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

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: previewDoLocale,
            dontPreview: previewDontLocale,
            doCaption: stripHtml(tContent("doDont.pair1.do")),
            dontCaption: stripHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: previewDoDisabled,
            dontPreview: previewDontDisabled,
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: stripHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withLocale")}
        secondaryCode={codeImportWithLocale}
      />

      {/* ── Variantes (Modos e Layouts) ───────────────────────────── */}
      <DocsVariants
        title={tContent("variants.visualTitle")}
        items={[
          {
            name: "single",
            description: stripHtml(tContent("variants.items.single")),
            code: codeSingle,
            preview: previewSingle,
          },
          {
            name: "multiple",
            description: stripHtml(tContent("variants.items.multiple")),
            code: codeMultiple,
            preview: previewMultiple,
          },
          {
            name: "range",
            description: stripHtml(tContent("variants.items.range")),
            code: codeRange,
            preview: previewRange,
          },
          {
            name: "captionDropdown",
            description: stripHtml(tContent("variants.items.captionDropdown")),
            code: codeCaptionDropdown,
            preview: previewCaptionDropdown,
          },
          {
            name: "withWeekNumber",
            description: stripHtml(tContent("variants.items.withWeekNumber")),
            code: codeWithWeekNumber,
            preview: previewWithWeekNumber,
          },
          {
            name: "numberOfMonths",
            description: stripHtml(tContent("variants.items.numberOfMonths")),
            code: codeNumberOfMonths,
            preview: previewNumberOfMonths,
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="calendar"
        items={[
          {
            name: tContent("variants.compositions.inlineBordered.name"),
            description: tContent("variants.compositions.inlineBordered.description"),
            useWhen: tContent("variants.compositions.inlineBordered.use"),
            code: `<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  locale={ptBR}
  className="rounded-md border"
/>`,
            preview: (
              <Calendar
                mode="single"
                selected={singleDate}
                onSelect={setSingleDate}
                locale={ptBR}
                className="rounded-md border"
              />
            ),
          },
          {
            name: tContent("variants.compositions.disabledPast.name"),
            description: tContent("variants.compositions.disabledPast.description"),
            useWhen: tContent("variants.compositions.disabledPast.use"),
            code: `<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={{ before: new Date() }}
  locale={ptBR}
/>`,
            preview: (
              <Calendar
                mode="single"
                selected={singleDate}
                onSelect={setSingleDate}
                disabled={{ before: today }}
                locale={ptBR}
              />
            ),
          },
          {
            name: tContent("variants.compositions.rangeTwoMonths.name"),
            description: tContent("variants.compositions.rangeTwoMonths.description"),
            useWhen: tContent("variants.compositions.rangeTwoMonths.use"),
            code: `<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  numberOfMonths={2}
  locale={ptBR}
/>`,
            preview: (
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange as never}
                numberOfMonths={2}
                locale={ptBR}
              />
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.default.label"),
            trigger: stripHtml(tContent("states.default.trigger")),
            behavior: stripHtml(tContent("states.default.behavior")),
          },
          {
            label: tContent("states.selected.label"),
            trigger: stripHtml(tContent("states.selected.trigger")),
            behavior: stripHtml(tContent("states.selected.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: stripHtml(tContent("states.disabled.trigger")),
            behavior: stripHtml(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.today.label"),
            trigger: stripHtml(tContent("states.today.trigger")),
            behavior: stripHtml(tContent("states.today.behavior")),
          },
          {
            label: tContent("states.outside.label"),
            trigger: stripHtml(tContent("states.outside.trigger")),
            behavior: stripHtml(tContent("states.outside.behavior")),
          },
          {
            label: tContent("states.rangeMiddle.label"),
            trigger: stripHtml(tContent("states.rangeMiddle.trigger")),
            behavior: stripHtml(tContent("states.rangeMiddle.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.calendarTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "mode",            type: '"single" | "multiple" | "range"',    defaultValue: '"single"', required: "Não", description: stripHtml(tContent("props.table.mode")) },
              { name: "selected",        type: "Date | Date[] | { from, to }",        defaultValue: "—",        required: "Não", description: stripHtml(tContent("props.table.selected")) },
              { name: "onSelect",        type: "(value) => void",                     defaultValue: "—",        required: "Não", description: tContent("props.table.onSelect") },
              { name: "locale",          type: "Locale",                              defaultValue: "—",        required: "Sim", description: stripHtml(tContent("props.table.locale")) },
              { name: "disabled",        type: "Date | Date[] | Matcher | fn",        defaultValue: "—",        required: "Não", description: stripHtml(tContent("props.table.disabled")) },
              { name: "showOutsideDays", type: "boolean",                              defaultValue: "true",     required: "Não", description: tContent("props.table.showOutsideDays") },
              { name: "captionLayout",   type: '"label" | "dropdown"',                 defaultValue: '"label"',  required: "Não", description: stripHtml(tContent("props.table.captionLayout")) },
              { name: "buttonVariant",   type: "Button variant",                       defaultValue: '"ghost"',  required: "Não", description: stripHtml(tContent("props.table.buttonVariant")) },
              { name: "numberOfMonths",  type: "number",                               defaultValue: "1",        required: "Não", description: tContent("props.table.numberOfMonths") },
              { name: "className",       type: "string",                               defaultValue: "—",        required: "Não", description: tContent("props.table.className") },
              { name: "classNames",      type: "Partial<ClassNames>",                  defaultValue: "—",        required: "Não", description: stripHtml(tContent("props.table.classNames")) },
            ],
          },
          {
            title: tContent("props.dayButtonTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "day",       type: "CalendarDay",            defaultValue: "—", required: "Sim", description: stripHtml(tContent("props.table.selected")) },
              { name: "modifiers", type: "Modifiers",              defaultValue: "—", required: "Sim", description: stripHtml(tContent("props.table.buttonVariant")) },
              { name: "locale",    type: "Partial<Locale>",        defaultValue: "—", required: "Não", description: stripHtml(tContent("props.table.locale")) },
              { name: "className", type: "string",                 defaultValue: "—", required: "Não", description: tContent("props.table.className") },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
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
          { token: "--primary",            value: "bg-primary text-primary-foreground", description: tContent("tokens.table.primary") },
          { token: "--muted",              value: "bg-muted",                           description: tContent("tokens.table.muted") },
          { token: "--muted-foreground",   value: "text-muted-foreground",              description: tContent("tokens.table.mutedForeground") },
          { token: "--foreground",         value: "text-foreground",                    description: tContent("tokens.table.foreground") },
          { token: "--ring",               value: "ring-ring",                          description: tContent("tokens.table.ring") },
          { token: "--cell-radius",        value: "rounded-(--cell-radius)",            description: stripHtml(tContent("tokens.table.cellRadius")) },
          { token: "--cell-size",          value: "size-(--cell-size)",                 description: stripHtml(tContent("tokens.table.cellSize")) },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
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
          { key: "Arrow keys",           description: stripHtml(tContent("accessibility.keyboard.arrows")) },
          { key: "Page Up / Page Down",  description: stripHtml(tContent("accessibility.keyboard.pageUpDown")) },
          { key: "Home / End",           description: stripHtml(tContent("accessibility.keyboard.homeEnd")) },
          { key: "Enter / Space",        description: stripHtml(tContent("accessibility.keyboard.enter")) },
          { key: "Tab",                  description: stripHtml(tContent("accessibility.keyboard.tab")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "DatePicker",
            description: tContent("related.datePicker"),
            path: "?path=/docs/ui-popover--docs",
          },
          {
            name: "Popover",
            description: tContent("related.popover"),
            path: "?path=/docs/ui-popover--docs",
          },
          {
            name: "Form",
            description: tContent("related.form"),
            path: "?path=/docs/ui-form--docs",
          },
          {
            name: "Input",
            description: tContent("related.input"),
            path: "?path=/docs/ui-input--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.fieldChange"),
            trigger: tContent("analytics.table.fieldChangeTrigger"),
            payload: tContent("analytics.table.fieldChangePayload"),
          },
          {
            event: tContent("analytics.table.dialogOpen"),
            trigger: tContent("analytics.table.dialogOpenTrigger"),
            payload: tContent("analytics.table.dialogOpenPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: tContent("analytics.table.pageViewTrigger"),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: tContent("analytics.table.sectionViewedTrigger"),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: tContent("analytics.table.langSwitchTrigger"),
            payload: tContent("analytics.table.langSwitchPayload"),
          },
        ]}
      />

      {/* ── Testes ────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
            action: tContent(`testes.functional.item${i}.action`),
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            criterion: stripHtml(tContent(`testes.accessibility.item${i}.criterion`)),
            level: tContent(`testes.accessibility.item${i}.level`),
            how: stripHtml(tContent(`testes.accessibility.item${i}.how`)),
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

export default CalendarDocs;
