import { useCallback, useEffect, useMemo } from "react";
import { User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  <AvatarFallback aria-label="Usuário genérico">
    <User aria-hidden="true" className="h-5 w-5" />
  </AvatarFallback>
</Avatar>`;

  const codeGroup = `<div className="flex -space-x-2">
  <Avatar className="ring-2 ring-background">
    <AvatarImage src="/maria.jpg" alt="Maria Rodrigues" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <Avatar className="ring-2 ring-background">
    <AvatarFallback>JP</AvatarFallback>
  </Avatar>
  <Avatar className="ring-2 ring-background">
    <AvatarFallback>
      <User aria-hidden="true" className="h-5 w-5" />
    </AvatarFallback>
  </Avatar>
</div>`;

  const codeWithStatus = `<div className="relative inline-block">
  <Avatar>
    <AvatarImage src="/maria.jpg" alt="" />
    <AvatarFallback aria-hidden="true">MR</AvatarFallback>
  </Avatar>
  <span
    aria-label="online"
    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
  />
</div>`;

  const codeCustomizationTokens = `/* globals.css — tokens semânticos que o Avatar consome */
:root {
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --background: 0 0% 100%;
  --primary: 221 83% 53%;
  --radius: 0.5rem;
}

.dark {
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --background: 222 47% 11%;
  --primary: 217 91% 60%;
}`;

  const interfaceCode = `// Avatar
interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  className?: string;
  asChild?: boolean;
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
          installNote="npx shadcn@latest add avatar"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex flex-wrap items-end justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Avatar>
              <AvatarImage
                src={DEMO_IMAGE_MARIA}
                alt={tContent("demonstration.labels.withImageAlt")}
              />
              <AvatarFallback delayMs={600}>MR</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.withImage")}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Avatar>
              <AvatarFallback>
                {tContent("demonstration.labels.withFallbackInitials")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.withFallback")}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Avatar>
              <AvatarFallback aria-label={tContent("demonstration.labels.withIcon")}>
                <User aria-hidden="true" className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.withIcon")}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex -space-x-2">
              <Avatar className="ring-2 ring-background">
                <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
                <AvatarFallback aria-hidden="true">MR</AvatarFallback>
              </Avatar>
              <Avatar className="ring-2 ring-background">
                <AvatarImage src={DEMO_IMAGE_SECOND} alt="" />
                <AvatarFallback aria-hidden="true">JP</AvatarFallback>
              </Avatar>
              <Avatar className="ring-2 ring-background">
                <AvatarFallback aria-hidden="true">
                  <User aria-hidden="true" className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-muted-foreground">
              {tContent("demonstration.labels.groupTitle")}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="relative inline-block">
              <Avatar>
                <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
                <AvatarFallback aria-hidden="true">MR</AvatarFallback>
              </Avatar>
              <span
                aria-label={tContent("demonstration.labels.statusOnline")}
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
              />
            </div>
            <span className="text-xs text-muted-foreground">
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
              element: tContent("usage.uxWriting.table.alt.name"),
              rules: tContent("usage.uxWriting.table.alt.format"),
              do: tContent("usage.uxWriting.table.alt.good"),
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
              rules: tContent("usage.uxWriting.table.decorative.format"),
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
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
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
                <AvatarFallback className="text-xs">mar</AvatarFallback>
              </Avatar>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
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
                <AvatarFallback aria-label="Usuário genérico">
                  <User aria-hidden="true" className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ),
          },
          {
            name: "group",
            description: stripHtml(tContent("variants.items.group")),
            code: codeGroup,
            preview: (
              <div className="flex -space-x-2">
                <Avatar className="ring-2 ring-background">
                  <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
                  <AvatarFallback aria-hidden="true">MR</AvatarFallback>
                </Avatar>
                <Avatar className="ring-2 ring-background">
                  <AvatarImage src={DEMO_IMAGE_SECOND} alt="" />
                  <AvatarFallback aria-hidden="true">JP</AvatarFallback>
                </Avatar>
                <Avatar className="ring-2 ring-background">
                  <AvatarImage src={DEMO_IMAGE_THIRD} alt="" />
                  <AvatarFallback aria-hidden="true">AS</AvatarFallback>
                </Avatar>
                <Avatar className="ring-2 ring-background">
                  <AvatarFallback aria-hidden="true">
                    <User aria-hidden="true" className="h-5 w-5" />
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
              <div className="relative inline-block">
                <Avatar>
                  <AvatarImage src={DEMO_IMAGE_MARIA} alt="" />
                  <AvatarFallback aria-hidden="true">MR</AvatarFallback>
                </Avatar>
                <span
                  aria-label="online"
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
                />
              </div>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="avatar"
        items={[
          {
            name: tContent("variants.compositions.withImage.name"),
            description: tContent("variants.compositions.withImage.description"),
            useWhen: tContent("variants.compositions.withImage.use"),
            code: `<Avatar>\n  <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />\n  <AvatarFallback>MR</AvatarFallback>\n</Avatar>`,
            preview: (
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
            ),
          },
          {
            name: tContent("variants.compositions.withInitials.name"),
            description: tContent("variants.compositions.withInitials.description"),
            useWhen: tContent("variants.compositions.withInitials.use"),
            code: `<Avatar>\n  <AvatarFallback>JP</AvatarFallback>\n</Avatar>`,
            preview: (
              <Avatar>
                <AvatarFallback>JP</AvatarFallback>
              </Avatar>
            ),
          },
          {
            name: tContent("variants.compositions.withIcon.name"),
            description: tContent("variants.compositions.withIcon.description"),
            useWhen: tContent("variants.compositions.withIcon.use"),
            code: `<Avatar>\n  <AvatarFallback role="img" aria-label="Usuário genérico">\n    <User aria-hidden="true" className="h-5 w-5 text-muted-foreground" />\n  </AvatarFallback>\n</Avatar>`,
            preview: (
              <Avatar>
                <AvatarFallback role="img" aria-label="Usuário genérico">
                  <User aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            ),
          },
          {
            name: tContent("variants.compositions.group.name"),
            description: tContent("variants.compositions.group.description"),
            useWhen: tContent("variants.compositions.group.use"),
            code: `<div className="flex -space-x-2" role="group" aria-label="Participantes">\n  <Avatar className="ring-2 ring-background">\n    <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />\n    <AvatarFallback>MR</AvatarFallback>\n  </Avatar>\n  <Avatar className="ring-2 ring-background">\n    <AvatarFallback>JP</AvatarFallback>\n  </Avatar>\n  <Avatar className="ring-2 ring-background">\n    <AvatarFallback>AL</AvatarFallback>\n  </Avatar>\n  <Avatar className="ring-2 ring-background">\n    <AvatarFallback>+3</AvatarFallback>\n  </Avatar>\n</div>`,
            preview: (
              <div className="flex -space-x-2" role="group" aria-label="Participantes">
                <Avatar className="ring-2 ring-background">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <Avatar className="ring-2 ring-background">
                  <AvatarFallback>JP</AvatarFallback>
                </Avatar>
                <Avatar className="ring-2 ring-background">
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <Avatar className="ring-2 ring-background">
                  <AvatarFallback>+3</AvatarFallback>
                </Avatar>
              </div>
            ),
          },
          {
            name: tContent("variants.compositions.withStatus.name"),
            description: tContent("variants.compositions.withStatus.description"),
            useWhen: tContent("variants.compositions.withStatus.use"),
            code: `<div className="relative inline-block">\n  <Avatar>\n    <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />\n    <AvatarFallback>MR</AvatarFallback>\n  </Avatar>\n  <span role="status" aria-label="online" className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />\n</div>`,
            preview: (
              <div className="relative inline-block">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="Foto de perfil de Maria Rodrigues" />
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <span role="status" aria-label="online" className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
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
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          {
            label: tContent("states.loaded.label"),
            trigger: stripHtml(tContent("states.loaded.trigger")),
            behavior: tContent("states.loaded.behavior"),
          },
          {
            label: tContent("states.loading.label"),
            trigger: stripHtml(tContent("states.loading.trigger")),
            behavior: tContent("states.loading.behavior"),
          },
          {
            label: tContent("states.failed.label"),
            trigger: stripHtml(tContent("states.failed.trigger")),
            behavior: tContent("states.failed.behavior"),
          },
          {
            label: tContent("states.noImage.label"),
            trigger: stripHtml(tContent("states.noImage.trigger")),
            behavior: tContent("states.noImage.behavior"),
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
                description: stripHtml(tContent("props.table.className")),
              },
              {
                name: "asChild",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description:
                  "Radix slot pattern — compõe com o elemento filho ao invés de renderizar um novo.",
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
                description: stripHtml(tContent("props.table.onLoadingStatusChange")),
              },
              {
                name: "className",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: stripHtml(tContent("props.table.className")),
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
                description: stripHtml(tContent("props.table.className")),
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
          { token: "--muted",             value: "bg-muted",                 description: tContent("tokens.table.muted") },
          { token: "--muted-foreground",  value: "text-muted-foreground",    description: tContent("tokens.table.mutedForeground") },
          { token: "--background",        value: "ring-background",          description: stripHtml(tContent("tokens.table.background")) },
          { token: "--border",            value: "border",                   description: tContent("tokens.table.border") },
          { token: "--primary",           value: "bg-primary",               description: tContent("tokens.table.primary") },
          { token: "--radius",            value: "rounded-full",             description: stripHtml(tContent("tokens.table.radius")) },
          { token: "--ring",              value: "focus-visible:ring-ring",  description: tContent("tokens.table.ring") },
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
            description: tContent("related.badge"),
            path: "?path=/docs/ui-badge--docs",
          },
          {
            name: "AspectRatio",
            description: tContent("related.aspectRatio"),
            path: "?path=/docs/ui-aspectratio--docs",
          },
          {
            name: "Tooltip",
            description: tContent("related.tooltip"),
            path: "?path=/docs/ui-tooltip--docs",
          },
          {
            name: "Card",
            description: tContent("related.card"),
            path: "?path=/docs/ui-card--docs",
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
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.profileClick"),
            trigger: tContent("analytics.table.profileClickTrigger"),
            payload: tContent("analytics.table.profileClickPayload"),
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
