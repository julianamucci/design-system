import { useCallback, useEffect, useMemo } from "react";
import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import avatarTranslations from "@shared/content/avatar/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
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

// Imagem válida usada nos previews
const DEMO_IMAGE_MARIA =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";
const DEMO_IMAGE_SECOND =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces";
const DEMO_IMAGE_THIRD =
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces";

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

// ─── Componente principal ─────────────────────────────────────────────────────

export function AvatarDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(avatarTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "avatar",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "avatar",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "avatar",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";`;

  const codeImportWithIcon = `import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";`;

  const codeWithImage = `<Avatar>
  <AvatarImage
    src="https://example.com/maria.jpg"
    alt="Foto de perfil de Maria Rodrigues"
  />
  <AvatarFallback delayMs={600}>MR</AvatarFallback>
</Avatar>`;

  const codeWithInitials = `<Avatar>
  <AvatarFallback>JP</AvatarFallback>
</Avatar>`;

  const codeWithIcon = `<Avatar>
  <AvatarFallback role="img" aria-label="Usuário genérico">
    <User aria-hidden="true" className="nds-icon nds-text-muted-foreground" />
  </AvatarFallback>
</Avatar>`;

  const codeGroup = `<AvatarGroup role="group" aria-label="Participantes">
  <Avatar>
    <AvatarImage src="/maria.jpg" alt="" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
</AvatarGroup>`;

  const codeWithStatus = `<Avatar>
  <AvatarImage src="/maria.jpg" alt="" />
  <AvatarFallback>MR</AvatarFallback>
  <AvatarBadge role="img" aria-label="Online" />
</Avatar>`;

  const interfaceCode = `// Avatar
interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  children: React.ReactNode;
}

// AvatarImage
interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  src: string;
  alt: string;
  onLoadingStatusChange?: (status: "idle" | "loading" | "loaded" | "error") => void;
  className?: string;
}

// AvatarFallback
interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  delayMs?: number;
  className?: string;
  children?: React.ReactNode;
}`;

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
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div
          className="nds-cluster"
          data-justify="center"
          data-spacing="xl"
          style={{ alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <div className="nds-stack" data-spacing="xs" style={{ alignItems: "center" }}>
            <Avatar>
              <AvatarImage
                src={DEMO_IMAGE_MARIA}
                alt={tContent("demonstration.labels.withImageAlt")}
              />
              <AvatarFallback delayMs={600}>MR</AvatarFallback>
            </Avatar>
            <span className="nds-text-caption nds-text-muted-foreground">
              {tContent("demonstration.labels.withImage")}
            </span>
          </div>

          <div className="nds-stack" data-spacing="xs" style={{ alignItems: "center" }}>
            <Avatar>
              <AvatarFallback>
                {tContent("demonstration.labels.withFallbackInitials")}
              </AvatarFallback>
            </Avatar>
            <span className="nds-text-caption nds-text-muted-foreground">
              {tContent("demonstration.labels.withFallback")}
            </span>
          </div>

          <div className="nds-stack" data-spacing="xs" style={{ alignItems: "center" }}>
            <Avatar>
              <AvatarFallback role="img" aria-label={tContent("demonstration.labels.withIcon")}>
                <User aria-hidden="true" className="nds-icon nds-text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="nds-text-caption nds-text-muted-foreground">
              {tContent("demonstration.labels.withIcon")}
            </span>
          </div>

          <div className="nds-stack" data-spacing="xs" style={{ alignItems: "center" }}>
            {/* O recuo e a borda são do AvatarGroup: reproduzi-los com estilo
                inline aqui deixava a classe compartilhada sem uso. */}
            <AvatarGroup role="group" aria-label={tContent("demonstration.labels.groupTitle")}>
              <Avatar>
                <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src={DEMO_IMAGE_SECOND} alt="" />
                <AvatarFallback>JP</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>
                  <User aria-hidden="true" className="nds-icon nds-text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
            </AvatarGroup>
            <span className="nds-text-caption nds-text-muted-foreground">
              {tContent("demonstration.labels.groupTitle")}
            </span>
          </div>

          <div className="nds-stack" data-spacing="xs" style={{ alignItems: "center" }}>
            {/* role="img" e não "status": um ponto que não muda não é live
                region, e o AvatarBadge já posiciona no canto. */}
            <Avatar>
              <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
              <AvatarFallback>MR</AvatarFallback>
              <AvatarBadge role="img" aria-label={tContent("demonstration.labels.statusOnline")} />
            </Avatar>
            <span className="nds-text-caption nds-text-muted-foreground">
              {tContent("demonstration.labels.statusTitle")}
            </span>
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
          tContent("anatomy.item5"),
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
            { s: tContent("usage.scenarios.item2.s"), u: toPlainText(tContent("usage.scenarios.item2.u")), a: tContent("usage.scenarios.item2.a") },
            { s: tContent("usage.scenarios.item3.s"), u: tContent("usage.scenarios.item3.u"), a: toPlainText(tContent("usage.scenarios.item3.a")) },
            { s: tContent("usage.scenarios.item4.s"), u: tContent("usage.scenarios.item4.u"), a: toPlainText(tContent("usage.scenarios.item4.a")) },
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
              element: tContent("usage.uxWriting.table.alt.name"),
              rules: tContent("usage.uxWriting.table.alt.format"),
              do: toPlainText(tContent("usage.uxWriting.table.alt.good")),
              dont: tContent("usage.uxWriting.table.alt.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.initials.name"),
              rules: tContent("usage.uxWriting.table.initials.format"),
              do: tContent("usage.uxWriting.table.initials.good"),
              dont: tContent("usage.uxWriting.table.initials.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.status.name"),
              rules: tContent("usage.uxWriting.table.status.format"),
              do: tContent("usage.uxWriting.table.status.good"),
              dont: tContent("usage.uxWriting.table.status.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.decorative.name"),
              rules: toPlainText(tContent("usage.uxWriting.table.decorative.format")),
              do: tContent("usage.uxWriting.table.decorative.good"),
              dont: tContent("usage.uxWriting.table.decorative.bad"),
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
            stripHtml(tContent("usage.dont.item1")),
            stripHtml(tContent("usage.dont.item2")),
            tContent("usage.dont.item3"),
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
              <Avatar>
                <AvatarImage
                  src={DEMO_IMAGE_MARIA}
                  alt="Foto de perfil de Maria Rodrigues"
                />
                <AvatarFallback delayMs={600}>MR</AvatarFallback>
              </Avatar>
            ),
            dontPreview: (
              <Avatar>
                <AvatarImage
                  src="https://example.invalid/broken.jpg"
                  alt="Foto de perfil de Maria Rodrigues"
                />
              </Avatar>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Avatar>
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
            ),
            dontPreview: (
              <Avatar>
                <AvatarFallback className="nds-text-caption">mar</AvatarFallback>
              </Avatar>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withIcon")}
        secondaryCode={codeImportWithIcon}
      />

      {/* ── Variantes (composicionais) ────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: "image",
            description: stripHtml(tContent("variants.items.image")),
            code: codeWithImage,
            preview: (
              <Avatar>
                <AvatarImage
                  src={DEMO_IMAGE_MARIA}
                  alt="Foto de perfil de Maria Rodrigues"
                />
                <AvatarFallback delayMs={600}>MR</AvatarFallback>
              </Avatar>
            ),
          },
          {
            name: "initials",
            description: stripHtml(tContent("variants.items.initials")),
            code: codeWithInitials,
            preview: (
              <Avatar>
                <AvatarFallback>JP</AvatarFallback>
              </Avatar>
            ),
          },
          {
            name: "icon",
            description: stripHtml(tContent("variants.items.icon")),
            code: codeWithIcon,
            preview: (
              <Avatar>
                <AvatarFallback role="img" aria-label="Usuário genérico">
                  <User aria-hidden="true" className="nds-icon nds-text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            ),
          },
          {
            name: "group",
            description: stripHtml(tContent("variants.items.group")),
            code: codeGroup,
            preview: (
              <div style={{ display: "flex" }}>
                <Avatar style={{ boxShadow: "0 0 0 2px var(--background)" }}>
                  <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <Avatar style={{ boxShadow: "0 0 0 2px var(--background)", marginLeft: "-0.5rem" }}>
                  <AvatarImage src={DEMO_IMAGE_SECOND} alt="" />
                  <AvatarFallback>JP</AvatarFallback>
                </Avatar>
                <Avatar style={{ boxShadow: "0 0 0 2px var(--background)", marginLeft: "-0.5rem" }}>
                  <AvatarImage src={DEMO_IMAGE_THIRD} alt="" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <Avatar style={{ boxShadow: "0 0 0 2px var(--background)", marginLeft: "-0.5rem" }}>
                  <AvatarFallback>
                    <User aria-hidden="true" className="nds-icon nds-text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
            ),
          },
          {
            name: "withStatus",
            description: stripHtml(tContent("variants.items.withStatus")),
            code: codeWithStatus,
            preview: (
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar>
                  <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <span
                  role="status"
                  aria-label="online"
                  className="nds-rounded-full nds-bg-primary"
                  style={{ position: "absolute", bottom: 0, right: 0, height: "0.625rem", width: "0.625rem", boxShadow: "0 0 0 2px var(--background)" }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* ── Configurações (States) ────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          {
            label: tContent("states.loaded.label"),
            trigger: toPlainText(tContent("states.loaded.trigger")),
            behavior: toPlainText(tContent("states.loaded.behavior")),
          },
          {
            label: tContent("states.loading.label"),
            trigger: toPlainText(tContent("states.loading.trigger")),
            behavior: toPlainText(tContent("states.loading.behavior")),
          },
          {
            label: tContent("states.failed.label"),
            trigger: toPlainText(tContent("states.failed.trigger")),
            behavior: toPlainText(tContent("states.failed.behavior")),
          },
          {
            label: tContent("states.noImage.label"),
            trigger: toPlainText(tContent("states.noImage.trigger")),
            behavior: toPlainText(tContent("states.noImage.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.avatarTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.className")),
              },
              {
                name: "size",
                type: '"sm" | "md" | "lg" | "xl" | "2xl"',
                defaultValue: "md",
                required: "Não",
                description: toPlainText(tContent("props.table.size")),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.table.children"),
              },
            ],
          },
          {
            title: tContent("props.avatarImageTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "src",
                type: "string",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.table.src"),
              },
              {
                name: "alt",
                type: "string",
                defaultValue: "—",
                required: "Sim",
                description: tContent("props.table.alt"),
              },
              {
                name: "onLoadingStatusChange",
                type: '(status: "idle" | "loading" | "loaded" | "error") => void',
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.onLoadingStatusChange")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.className")),
              },
            ],
          },
          {
            title: tContent("props.avatarFallbackTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "delayMs",
                type: "number",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.delayMs"),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: toPlainText(tContent("props.table.className")),
              },
              {
                name: "children",
                type: "React.ReactNode",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.table.children"),
              },
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
          { token: "--muted",             value: ".nds-avatar-fallback",     description: tContent("tokens.table.muted") },
          { token: "--muted-foreground",  value: ".nds-avatar-fallback",     description: tContent("tokens.table.mutedForeground") },
          { token: "--background",        value: ".nds-avatar-group > .nds-avatar", description: toPlainText(tContent("tokens.table.background")) },
          { token: "--border",            value: "—",                        description: tContent("tokens.table.border") },
          { token: "--primary",           value: ".nds-avatar-badge",        description: tContent("tokens.table.primary") },
          { token: "--avatar-size",       value: "var(--spacing-8)",         description: tContent("tokens.table.avatarSize") },
          { token: "--radius-full",       value: ".nds-avatar",              description: toPlainText(tContent("tokens.table.radius")) },
          { token: "--ring",              value: "—",                        description: tContent("tokens.table.ring") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
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
        ]}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={[
          {
            key: "—",
            description:
              "O Avatar em si não é focável nem interativo — segue o fluxo de tab do container que o envolve.",
          },
          {
            key: "Tab",
            description:
              "Quando o Avatar está dentro de um <a> ou <button>, o container recebe foco e ativa o ring (--ring).",
          },
          {
            key: "Enter",
            description:
              "Ativa o container clicável (link ou botão) que envolve o Avatar.",
          },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "Badge",
            description: toPlainText(tContent("related.badge")),
            path: "?path=/docs/components-feedback-badge--docs",
          },
          {
            name: "AspectRatio",
            description: toPlainText(tContent("related.aspectRatio")),
            path: "?path=/docs/components-layout-aspectratio--docs",
          },
          {
            name: "Tooltip",
            description: toPlainText(tContent("related.tooltip")),
            path: "?path=/docs/components-overlay-tooltip--docs",
          },
          {
            name: "Card",
            description: toPlainText(tContent("related.card")),
            path: "?path=/docs/components-layout-card--docs",
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
        ]}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.profileClick"),
            trigger: toPlainText(tContent("analytics.table.profileClickTrigger")),
            payload: tContent("analytics.table.profileClickPayload"),
          },
          {
            event: tContent("analytics.table.pageView"),
            trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),
            payload: tContent("analytics.table.pageViewPayload"),
          },
          {
            event: tContent("analytics.table.sectionViewed"),
            trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")),
            payload: tContent("analytics.table.sectionViewedPayload"),
          },
          {
            event: tContent("analytics.table.langSwitch"),
            trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            action: tContent(`testes.functional.item${i}.action`),
            result: tContent(`testes.functional.item${i}.result`),
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
          items: [1, 2, 3, 4].map((i) => ({
            criterion: tContent(`testes.accessibility.item${i}.criterion`),
            level: tContent(`testes.accessibility.item${i}.level`),
            how: tContent(`testes.accessibility.item${i}.how`),
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: [1, 2, 3, 4].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
