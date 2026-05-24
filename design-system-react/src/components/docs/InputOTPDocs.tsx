import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import inputOtpTranslations from "@shared/content/input-otp/translations.json";

import { DocsHeader } from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout } from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy } from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse } from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont } from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport } from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants } from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates } from "@/components/docs/shared/sections/DocsStates";
import { DocsProps } from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens } from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated } from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes } from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics } from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes } from "@/components/docs/shared/sections/DocsTestes";

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
      { id: "anatomia", label: t("nav.anatomy") },
      { id: "quando-usar", label: t("nav.usage") },
      { id: "do-dont", label: t("nav.doDont") },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao", label: t("nav.import") },
      { id: "variantes", label: t("nav.variants") },
      { id: "composicoes", label: t("nav.compositions") },
      { id: "estados", label: t("nav.states") },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens", label: t("nav.tokens") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados", label: t("nav.related") },
      { id: "notas", label: t("nav.notes") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes", label: t("nav.testes") },
    ],
  },
];


// ─── Locale resolver para item de breadcrumb (Form/Formulário) ──────────────

function categoryUrl(): string {
  return "/components/form";
}

// ─── Demo helpers ────────────────────────────────────────────────────────────

const sixSlots = Array.from({ length: 6 });
const fourSlots = Array.from({ length: 4 });

// ─── Componente principal ────────────────────────────────────────────────────

export function InputOTPDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(inputOtpTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "input-otp",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: categoryUrl() },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "input-otp",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "input-otp",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Demo state ─────────────────────────────────────────────────────────
  const [sixValue, setSixValue] = useState("");
  const [fourValue, setFourValue] = useState("");
  const [sepValue, setSepValue] = useState("");
  const [alphaValue, setAlphaValue] = useState("");

  // ─── Code strings ───────────────────────────────────────────────────────
  const codeImport = `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeSixDigits = `<InputOTP maxLength={6} value={code} onChange={setCode} autoComplete="one-time-code" inputMode="numeric">
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`;

  const codeFourDigits = `<InputOTP maxLength={4} value={pin} onChange={setPin} inputMode="numeric">
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
</InputOTP>`;

  const codeWithSeparator = `<InputOTP maxLength={6} value={code} onChange={setCode}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`;

  const codeAlpha = `import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

<InputOTP
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
  inputMode="text"
  value={code}
  onChange={setCode}
>
  <InputOTPGroup>
    {/* 6 slots */}
  </InputOTPGroup>
</InputOTP>`;

  const interfaceCode = `// InputOTP (input-otp lib)
interface InputOTPProps {
  maxLength: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  pattern?: string | RegExp; // default REGEXP_ONLY_DIGITS
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;     // recomendado: "one-time-code"
  inputMode?: "numeric" | "text";
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────
  const stateCols = {
    state: locale === "en" ? "State" : "Estado",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    behavior:
      locale === "en"
        ? "Behavior"
        : locale === "es"
        ? "Comportamiento"
        : "Comportamento",
  };

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="input-otp"
      header={
        <DocsHeader
          title={tContent("title")}
          description={tContent("description")}
          category={tContent("category")}
          type={tContent("type")}
          installNote="npx shadcn@latest add input-otp"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* 6 dígitos */}
          <div className="space-y-2">
            <label htmlFor="demo-six" className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.sixDigits"))}
            </label>
            <InputOTP
              id="demo-six"
              maxLength={6}
              value={sixValue}
              onChange={setSixValue}
              autoComplete="one-time-code"
              inputMode="numeric"
              aria-label={stripHtml(tContent("demonstration.labels.sixDigits"))}
            >
              <InputOTPGroup>
                {sixSlots.map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* 4 dígitos */}
          <div className="space-y-2">
            <label htmlFor="demo-four" className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.fourDigits"))}
            </label>
            <InputOTP
              id="demo-four"
              maxLength={4}
              value={fourValue}
              onChange={setFourValue}
              autoComplete="one-time-code"
              inputMode="numeric"
              aria-label={stripHtml(tContent("demonstration.labels.fourDigits"))}
            >
              <InputOTPGroup>
                {fourSlots.map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Com Separator */}
          <div className="space-y-2">
            <label htmlFor="demo-sep" className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.withSeparator"))}
            </label>
            <InputOTP
              id="demo-sep"
              maxLength={6}
              value={sepValue}
              onChange={setSepValue}
              autoComplete="one-time-code"
              inputMode="numeric"
              aria-label={stripHtml(tContent("demonstration.labels.withSeparator"))}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Alfanumérico */}
          <div className="space-y-2">
            <label htmlFor="demo-alpha" className="text-xs font-medium text-muted-foreground">
              {sanitizeHtml(tContent("demonstration.labels.alphanumeric"))}
            </label>
            <InputOTP
              id="demo-alpha"
              maxLength={6}
              value={alphaValue}
              onChange={setAlphaValue}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              autoComplete="one-time-code"
              inputMode="text"
              aria-label={stripHtml(tContent("demonstration.labels.alphanumeric"))}
            >
              <InputOTPGroup>
                {sixSlots.map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
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
        ]}
        structureCode={structureCode}
        structureLabel={tContent("anatomy.structureLabel")}
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
              element: tContent("usage.uxWriting.table.helpText.name"),
              rules: tContent("usage.uxWriting.table.helpText.format"),
              do: tContent("usage.uxWriting.table.helpText.good"),
              dont: tContent("usage.uxWriting.table.helpText.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.errorText.name"),
              rules: tContent("usage.uxWriting.table.errorText.format"),
              do: tContent("usage.uxWriting.table.errorText.good"),
              dont: tContent("usage.uxWriting.table.errorText.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.resend.name"),
              rules: tContent("usage.uxWriting.table.resend.format"),
              do: tContent("usage.uxWriting.table.resend.good"),
              dont: tContent("usage.uxWriting.table.resend.bad"),
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
            doPreview: (
              <div className="text-xs font-mono text-muted-foreground">
                autoComplete="one-time-code"
              </div>
            ),
            dontPreview: (
              <div className="text-xs font-mono text-muted-foreground italic">
                {/* sem autoComplete */}
                (sem autoComplete)
              </div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair1.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div className="text-xs font-medium">Código de verificação</div>
            ),
            dontPreview: (
              <div className="text-xs italic text-muted-foreground">(sem label)</div>
            ),
            doCaption: sanitizeHtml(tContent("doDont.pair2.do")),
            dontCaption: sanitizeHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        componentSlug="input-otp"
        items={[
          {
            name: tContent("variants.items.sixDigits"),
            description: stripHtml(tContent("variants.styles.sixDigits")),
            code: codeSixDigits,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                maxLength=6 · inputMode=numeric
              </div>
            ),
          },
          {
            name: tContent("variants.items.fourDigits"),
            description: stripHtml(tContent("variants.styles.fourDigits")),
            code: codeFourDigits,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                maxLength=4 · inputMode=numeric
              </div>
            ),
          },
          {
            name: tContent("variants.items.withSeparator"),
            description: stripHtml(tContent("variants.styles.withSeparator")),
            code: codeWithSeparator,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                3 + Separator + 3
              </div>
            ),
          },
          {
            name: tContent("variants.items.alphanumeric"),
            description: stripHtml(tContent("variants.styles.alphanumeric")),
            code: codeAlpha,
            preview: (
              <div className="text-xs font-mono text-muted-foreground">
                pattern=DIGITS_AND_CHARS · inputMode=text
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="input-otp"
        items={[
          {
            name: tContent("variants.compositions.withLabel.name"),
            description: tContent("variants.compositions.withLabel.description"),
            useWhen: tContent("variants.compositions.withLabel.use"),
            code: `<div className="flex flex-col gap-2">
  <Label htmlFor="otp-code">Código de verificação</Label>
  <InputOTP id="otp-code" maxLength={6} autoComplete="one-time-code" inputMode="numeric">
    <InputOTPGroup>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
      <InputOTPSlot index={2} />
      <InputOTPSlot index={3} />
      <InputOTPSlot index={4} />
      <InputOTPSlot index={5} />
    </InputOTPGroup>
  </InputOTP>
</div>`,
            preview: (
              <div className="flex flex-col gap-2">
                <Label htmlFor="comp-label-otp">Código de verificação</Label>
                <InputOTP id="comp-label-otp" maxLength={6} autoComplete="one-time-code" inputMode="numeric" aria-label="Código de verificação">
                  <InputOTPGroup>
                    {sixSlots.map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withHelpText.name"),
            description: tContent("variants.compositions.withHelpText.description"),
            useWhen: tContent("variants.compositions.withHelpText.use"),
            code: `<div className="flex flex-col gap-2">
  <Label htmlFor="otp-help">Código de verificação</Label>
  <InputOTP id="otp-help" maxLength={6} aria-describedby="otp-help-text"
    autoComplete="one-time-code" inputMode="numeric">
    <InputOTPGroup>{/* 6 slots */}</InputOTPGroup>
  </InputOTP>
  <p id="otp-help-text" className="text-xs text-muted-foreground">
    Enviamos por SMS, expira em 5 min.
  </p>
</div>`,
            preview: (
              <div className="flex flex-col gap-2">
                <Label htmlFor="comp-help-otp">Código de verificação</Label>
                <InputOTP
                  id="comp-help-otp"
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  aria-describedby="comp-help-otp-text"
                  aria-label="Código de verificação"
                >
                  <InputOTPGroup>
                    {sixSlots.map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <p id="comp-help-otp-text" className="text-xs text-muted-foreground">
                  Enviamos por SMS, expira em 5 min.
                </p>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withErrorMessage.name"),
            description: tContent("variants.compositions.withErrorMessage.description"),
            useWhen: tContent("variants.compositions.withErrorMessage.use"),
            code: `<div className="flex flex-col gap-2">
  <Label htmlFor="otp-err">Código de verificação</Label>
  <InputOTP id="otp-err" maxLength={6} aria-invalid="true"
    aria-describedby="otp-err-text" autoComplete="one-time-code" inputMode="numeric">
    <InputOTPGroup>{/* 6 slots */}</InputOTPGroup>
  </InputOTP>
  <p id="otp-err-text" className="text-xs text-destructive">
    Código incorreto. Verifique e tente novamente.
  </p>
</div>`,
            preview: (
              <div className="flex flex-col gap-2">
                <Label htmlFor="comp-err-otp">Código de verificação</Label>
                <InputOTP
                  id="comp-err-otp"
                  maxLength={6}
                  defaultValue="123"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  aria-invalid="true"
                  aria-describedby="comp-err-otp-text"
                  aria-label="Código de verificação"
                >
                  <InputOTPGroup>
                    {sixSlots.map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <p id="comp-err-otp-text" className="text-xs text-destructive">
                  Código incorreto. Verifique e tente novamente.
                </p>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withResendButton.name"),
            description: tContent("variants.compositions.withResendButton.description"),
            useWhen: tContent("variants.compositions.withResendButton.use"),
            code: `<div className="flex flex-col gap-3">
  <Label htmlFor="otp-resend">Código de verificação</Label>
  <InputOTP id="otp-resend" maxLength={6} autoComplete="one-time-code" inputMode="numeric">
    <InputOTPGroup>{/* 6 slots */}</InputOTPGroup>
  </InputOTP>
  <div className="flex items-center justify-between gap-3">
    <p className="text-xs text-muted-foreground">Não recebeu?</p>
    <Button variant="link" size="sm">Reenviar código</Button>
  </div>
</div>`,
            preview: (
              <div className="flex flex-col gap-3">
                <Label htmlFor="comp-resend-otp">Código de verificação</Label>
                <InputOTP
                  id="comp-resend-otp"
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  aria-label="Código de verificação"
                >
                  <InputOTPGroup>
                    {sixSlots.map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">Não recebeu?</p>
                  <Button variant="link" size="sm">Reenviar código</Button>
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={stateCols}
        items={[
          {
            label: tContent("states.items.empty"),
            trigger: 'value=""',
            behavior: stripHtml(tContent("states.descriptions.empty")),
          },
          {
            label: tContent("states.items.filling"),
            trigger: 'value="123"',
            behavior: stripHtml(tContent("states.descriptions.filling")),
          },
          {
            label: tContent("states.items.complete"),
            trigger: 'value.length === maxLength',
            behavior: stripHtml(tContent("states.descriptions.complete")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "disabled",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
          },
          {
            label: tContent("states.items.error"),
            trigger: 'aria-invalid="true"',
            behavior: stripHtml(tContent("states.descriptions.error")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
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
              {
                name: "maxLength",
                type: tContent("props.table.maxLength.type"),
                defaultValue: tContent("props.table.maxLength.default"),
                required: tContent("props.table.maxLength.required"),
                description: sanitizeHtml(tContent("props.table.maxLength.description")),
              },
              {
                name: "value",
                type: tContent("props.table.value.type"),
                defaultValue: tContent("props.table.value.default"),
                required: tContent("props.table.value.required"),
                description: sanitizeHtml(tContent("props.table.value.description")),
              },
              {
                name: "onChange",
                type: tContent("props.table.onChange.type"),
                defaultValue: tContent("props.table.onChange.default"),
                required: tContent("props.table.onChange.required"),
                description: sanitizeHtml(tContent("props.table.onChange.description")),
              },
              {
                name: "onComplete",
                type: tContent("props.table.onComplete.type"),
                defaultValue: tContent("props.table.onComplete.default"),
                required: tContent("props.table.onComplete.required"),
                description: sanitizeHtml(tContent("props.table.onComplete.description")),
              },
              {
                name: "pattern",
                type: tContent("props.table.pattern.type"),
                defaultValue: tContent("props.table.pattern.default"),
                required: tContent("props.table.pattern.required"),
                description: sanitizeHtml(tContent("props.table.pattern.description")),
              },
              {
                name: "disabled",
                type: tContent("props.table.disabled.type"),
                defaultValue: tContent("props.table.disabled.default"),
                required: tContent("props.table.disabled.required"),
                description: sanitizeHtml(tContent("props.table.disabled.description")),
              },
              {
                name: "autoFocus",
                type: tContent("props.table.autoFocus.type"),
                defaultValue: tContent("props.table.autoFocus.default"),
                required: tContent("props.table.autoFocus.required"),
                description: sanitizeHtml(tContent("props.table.autoFocus.description")),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibilityCode")}
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
          {
            token: "size",
            value: tContent("tokens.table.slotSize.class"),
            description: tContent("tokens.table.slotSize.part"),
          },
          {
            token: "--input",
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
          },
          {
            token: "--ring",
            value: tContent("tokens.table.active.class"),
            description: tContent("tokens.table.active.part"),
          },
          {
            token: "--destructive",
            value: tContent("tokens.table.invalid.class"),
            description: tContent("tokens.table.invalid.part"),
          },
          {
            token: "opacity",
            value: tContent("tokens.table.disabled.class"),
            description: tContent("tokens.table.disabled.part"),
          },
          {
            token: "animation",
            value: tContent("tokens.table.caret.class"),
            description: tContent("tokens.table.caret.part"),
          },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
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
          { key: "Tab", description: stripHtml(tContent("accessibility.keyboard.tab")) },
          { key: "Arrows", description: stripHtml(tContent("accessibility.keyboard.arrows")) },
          { key: "Backspace", description: stripHtml(tContent("accessibility.keyboard.backspace")) },
          { key: "Ctrl+V", description: stripHtml(tContent("accessibility.keyboard.paste")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="input-otp"
        items={[
          {
            name: tContent("related.items.input.name"),
            description: tContent("related.items.input.description"),
            path: "?path=/docs/ui-input--docs",
          },
          {
            name: tContent("related.items.form.name"),
            description: tContent("related.items.form.description"),
            path: "?path=/docs/ui-form--docs",
          },
          {
            name: tContent("related.items.label.name"),
            description: tContent("related.items.label.description"),
            path: "?path=/docs/ui-label--docs",
          },
          {
            name: tContent("related.items.button.name"),
            description: tContent("related.items.button.description"),
            path: "?path=/docs/ui-button--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="input-otp"
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
          { title: "", content: tContent("notes.item5") },
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={analyticsCols}
        items={[
          {
            event: "otp_complete / otp_paste / otp_resend",
            trigger: sanitizeHtml(tContent("analytics.description")),
            payload: "component, location, length",
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
          items: [
            {
              action: tContent("testes.functional.item1.action"),
              result: tContent("testes.functional.item1.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item1.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item2.action"),
              result: tContent("testes.functional.item2.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item2.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item3.action"),
              result: tContent("testes.functional.item3.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item3.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item4.action"),
              result: tContent("testes.functional.item4.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item5.action"),
              result: tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.high"),
            },
          ],
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: [
            { criterion: tContent("testes.accessibility.item1"), level: "AA", how: "axe-core" },
            { criterion: tContent("testes.accessibility.item2"), level: "1.3.5", how: "DevTools attribute" },
            { criterion: tContent("testes.accessibility.item3"), level: "3.3.2", how: "Manual review" },
            { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
            { criterion: tContent("testes.accessibility.item5"), level: "4.1.2", how: "DevTools attribute" },
            { criterion: tContent("testes.accessibility.item6"), level: "1.4.3", how: "Contrast checker" },
          ],
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [
            { story: tContent("testes.visual.item1.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item2.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default InputOTPDocs;
