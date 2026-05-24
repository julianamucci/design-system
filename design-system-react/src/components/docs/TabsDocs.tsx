import { useCallback, useEffect, useMemo } from "react";
import { Settings, Shield, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import tabsTranslations from "@shared/content/tabs/translations.json";

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


// ─── Componente principal ─────────────────────────────────────────────────────

export function TabsDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(tabsTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "tabs",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    aiIntent: tContent("seo.aiIntent") as "informational" | "navigational",
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/navigation" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "tabs",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "tabs",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const handleTabChange = useCallback(
    (_next: string, label: string, index: number, total: number) => {
      track("tab_change", {
        component: "tabs",
        label,
        index,
        total,
        location: "docs_demonstration",
      });
    },
    []
  );

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";`;

  const codeDefault = `<Tabs defaultValue="overview">
  <TabsList aria-label="Seções do componente">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`;

  const codeLine = `<Tabs defaultValue="overview">
  <TabsList aria-label="Seções do componente" variant="line">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`;

  const codeVertical = `<Tabs orientation="vertical" defaultValue="overview">
  <TabsList aria-label="Seções do componente">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`;

  const interfaceCode = `// Tabs (root)
interface TabsRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";   // default "horizontal"
  activationMode?: "automatic" | "manual";   // default "automatic"
  className?: string;
}

// TabsList
interface TabsListProps {
  variant?: "default" | "line";              // default "default"
  "aria-label": string;                      // OBRIGATÓRIO
  className?: string;
}

// TabsTrigger
interface TabsTriggerProps {
  value: string;                             // OBRIGATÓRIO — vincula ao TabsContent
  disabled?: boolean;
  className?: string;
}

// TabsContent
interface TabsContentProps {
  value: string;                             // OBRIGATÓRIO — vincula ao TabsTrigger
  className?: string;
}`;

  // Props (root) extraídos da seção tokens/props do translations.json
  const propsRootItems = [
    { key: "value", name: "value" },
    { key: "defaultValue", name: "defaultValue" },
    { key: "onValueChange", name: "onValueChange" },
    { key: "orientation", name: "orientation" },
    { key: "activationMode", name: "activationMode" },
    { key: "className", name: "className" },
  ];

  const propsListItems = [
    { key: "variant", name: "variant" },
    { key: "className", name: "className" },
  ];

  // Tokens — chaves do translations.json
  const tokenItems = [
    { key: "muted", token: "--muted" },
    { key: "mutedForeground", token: "--muted-foreground" },
    { key: "background", token: "--background" },
    { key: "foreground", token: "--foreground" },
    { key: "ring", token: "--ring" },
    { key: "border", token: "--border" },
  ];

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
          installNote="npx shadcn@latest add tabs"
        />
      }
    >
      {/* ── Demonstração ──────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <Tabs
          defaultValue="overview"
          onValueChange={(next) => {
            const labels: Record<string, string> = {
              overview: tContent("demonstration.labels.overview"),
              properties: tContent("demonstration.labels.properties"),
              examples: tContent("demonstration.labels.examples"),
            };
            const order = ["overview", "properties", "examples"];
            handleTabChange(next, labels[next] ?? next, order.indexOf(next), order.length);
          }}
          className="w-full"
        >
          <TabsList aria-label={tContent("demonstration.title")}>
            <TabsTrigger value="overview">
              {tContent("demonstration.labels.overview")}
            </TabsTrigger>
            <TabsTrigger value="properties">
              {tContent("demonstration.labels.properties")}
            </TabsTrigger>
            <TabsTrigger value="examples">
              {tContent("demonstration.labels.examples")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            {tContent("demonstration.labels.overviewContent")}
          </TabsContent>
          <TabsContent value="properties">
            {tContent("demonstration.labels.propertiesContent")}
          </TabsContent>
          <TabsContent value="examples">
            {tContent("demonstration.labels.examplesContent")}
          </TabsContent>
        </Tabs>
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
          items: [1, 2, 3, 4].map((i) => tContent(`usage.guidelines.item${i}`)),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4, 5].map((i) => ({
            s: tContent(`usage.scenarios.item${i}.s`),
            u: tContent(`usage.scenarios.item${i}.u`),
            a: tContent(`usage.scenarios.item${i}.a`),
          })),
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.ariaLabel.name"),
              rules: tContent("usage.uxWriting.table.ariaLabel.format"),
              do: tContent("usage.uxWriting.table.ariaLabel.good"),
              dont: tContent("usage.uxWriting.table.ariaLabel.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.order.name"),
              rules: tContent("usage.uxWriting.table.order.format"),
              do: tContent("usage.uxWriting.table.order.good"),
              dont: tContent("usage.uxWriting.table.order.bad"),
            },
          ],
        }}
        do={{
          title: tContent("usage.do.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.do.item${i}`)),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: [1, 2, 3, 4].map((i) => tContent(`usage.dont.item${i}`)),
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
              <Tabs defaultValue="overview" className="w-full">
                <TabsList aria-label="Seções do componente">
                  <TabsTrigger value="overview">Visão geral</TabsTrigger>
                  <TabsTrigger value="properties">Propriedades</TabsTrigger>
                  <TabsTrigger value="examples">Exemplos</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  Labels descritivos curtos.
                </TabsContent>
                <TabsContent value="properties">
                  Sem ambiguidade para o leitor.
                </TabsContent>
                <TabsContent value="examples">
                  Substantivos máximo 2 palavras.
                </TabsContent>
              </Tabs>
            ),
            dontPreview: (
              <Tabs defaultValue="aba-1" className="w-full">
                <TabsList aria-label="Tabs">
                  <TabsTrigger value="aba-1">Aba 1</TabsTrigger>
                  <TabsTrigger value="aba-2">Aba 2</TabsTrigger>
                  <TabsTrigger value="aba-3">Aba 3</TabsTrigger>
                </TabsList>
                <TabsContent value="aba-1">Conteúdo da aba 1.</TabsContent>
                <TabsContent value="aba-2">Conteúdo da aba 2.</TabsContent>
                <TabsContent value="aba-3">Conteúdo da aba 3.</TabsContent>
              </Tabs>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList aria-label="Configurações da conta">
                  <TabsTrigger value="profile">
                    <User aria-hidden="true" />
                    Perfil
                  </TabsTrigger>
                  <TabsTrigger value="account">
                    <Settings aria-hidden="true" />
                    Conta
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Shield aria-hidden="true" />
                    Segurança
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile">Dados do perfil.</TabsContent>
                <TabsContent value="account">
                  Configurações da conta.
                </TabsContent>
                <TabsContent value="security">
                  Configurações de segurança.
                </TabsContent>
              </Tabs>
            ),
            dontPreview: (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList aria-label="Tabs">
                  <TabsTrigger value="profile">
                    <User aria-hidden="true" />
                    Perfil
                  </TabsTrigger>
                  <TabsTrigger value="account">
                    <Settings aria-hidden="true" />
                    Conta
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Shield aria-hidden="true" />
                    Segurança
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile">Dados do perfil.</TabsContent>
                <TabsContent value="account">
                  Configurações da conta.
                </TabsContent>
                <TabsContent value="security">
                  Configurações de segurança.
                </TabsContent>
              </Tabs>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList aria-label="Seções do componente">
                  <TabsTrigger value="overview">
                    {tContent("demonstration.labels.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="properties">
                    {tContent("demonstration.labels.properties")}
                  </TabsTrigger>
                  <TabsTrigger value="examples">
                    {tContent("demonstration.labels.examples")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  {tContent("demonstration.labels.overviewContent")}
                </TabsContent>
                <TabsContent value="properties">
                  {tContent("demonstration.labels.propertiesContent")}
                </TabsContent>
                <TabsContent value="examples">
                  {tContent("demonstration.labels.examplesContent")}
                </TabsContent>
              </Tabs>
            ),
          },
          {
            name: tContent("variants.items.line"),
            description: stripHtml(tContent("variants.styles.line")),
            code: codeLine,
            preview: (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList aria-label="Seções do componente" variant="line">
                  <TabsTrigger value="overview">
                    {tContent("demonstration.labels.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="properties">
                    {tContent("demonstration.labels.properties")}
                  </TabsTrigger>
                  <TabsTrigger value="examples">
                    {tContent("demonstration.labels.examples")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  {tContent("demonstration.labels.overviewContent")}
                </TabsContent>
                <TabsContent value="properties">
                  {tContent("demonstration.labels.propertiesContent")}
                </TabsContent>
                <TabsContent value="examples">
                  {tContent("demonstration.labels.examplesContent")}
                </TabsContent>
              </Tabs>
            ),
          },
          {
            name: tContent("variants.items.vertical"),
            description: stripHtml(tContent("variants.styles.vertical")),
            code: codeVertical,
            preview: (
              <Tabs
                orientation="vertical"
                defaultValue="overview"
                className="w-full"
              >
                <TabsList aria-label="Seções do componente">
                  <TabsTrigger value="overview">
                    {tContent("demonstration.labels.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="properties">
                    {tContent("demonstration.labels.properties")}
                  </TabsTrigger>
                  <TabsTrigger value="examples">
                    {tContent("demonstration.labels.examples")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  {tContent("demonstration.labels.overviewContent")}
                </TabsContent>
                <TabsContent value="properties">
                  {tContent("demonstration.labels.propertiesContent")}
                </TabsContent>
                <TabsContent value="examples">
                  {tContent("demonstration.labels.examplesContent")}
                </TabsContent>
              </Tabs>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="tabs"
        items={[
          {
            name: tContent("variants.compositions.iconTrigger.name"),
            description: tContent("variants.compositions.iconTrigger.description"),
            useWhen: tContent("variants.compositions.iconTrigger.use"),
            code: `<Tabs defaultValue="profile" className="w-full max-w-xl">
  <TabsList aria-label="Configurações">
    <TabsTrigger value="profile">
      <span className="flex items-center gap-2">
        <User aria-hidden="true" className="h-4 w-4" />
        Perfil
      </span>
    </TabsTrigger>
    <TabsTrigger value="account">
      <span className="flex items-center gap-2">
        <Settings aria-hidden="true" className="h-4 w-4" />
        Conta
      </span>
    </TabsTrigger>
    <TabsTrigger value="security">
      <span className="flex items-center gap-2">
        <Shield aria-hidden="true" className="h-4 w-4" />
        Segurança
      </span>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="profile">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Perfil</h3>
      <p className="text-sm text-muted-foreground">Edite suas informações públicas.</p>
    </div>
  </TabsContent>
  <TabsContent value="account">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Conta</h3>
      <p className="text-sm text-muted-foreground">Email, idioma e preferências.</p>
    </div>
  </TabsContent>
  <TabsContent value="security">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Segurança</h3>
      <p className="text-sm text-muted-foreground">Senha e autenticação em dois fatores.</p>
    </div>
  </TabsContent>
</Tabs>`,
            preview: (
              <Tabs defaultValue="profile" className="w-full max-w-xl">
                <TabsList aria-label="Configurações">
                  <TabsTrigger value="profile">
                    <span className="flex items-center gap-2">
                      <User aria-hidden="true" className="h-4 w-4" />
                      Perfil
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="account">
                    <span className="flex items-center gap-2">
                      <Settings aria-hidden="true" className="h-4 w-4" />
                      Conta
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <span className="flex items-center gap-2">
                      <Shield aria-hidden="true" className="h-4 w-4" />
                      Segurança
                    </span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Perfil</h3>
                    <p className="text-sm text-muted-foreground">Edite suas informações públicas.</p>
                  </div>
                </TabsContent>
                <TabsContent value="account">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Conta</h3>
                    <p className="text-sm text-muted-foreground">Email, idioma e preferências.</p>
                  </div>
                </TabsContent>
                <TabsContent value="security">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Segurança</h3>
                    <p className="text-sm text-muted-foreground">Senha e autenticação em dois fatores.</p>
                  </div>
                </TabsContent>
              </Tabs>
            ),
          },
          {
            name: tContent("variants.compositions.badgeTrigger.name"),
            description: tContent("variants.compositions.badgeTrigger.description"),
            useWhen: tContent("variants.compositions.badgeTrigger.use"),
            code: `<Tabs defaultValue="inbox" className="w-full max-w-xl">
  <TabsList aria-label="Caixas de mensagem">
    <TabsTrigger value="inbox">
      <span className="flex items-center gap-2">
        Caixa de entrada
        <Badge className="text-[10px] h-4">12</Badge>
      </span>
    </TabsTrigger>
    <TabsTrigger value="spam">
      <span className="flex items-center gap-2">
        Spam
        <Badge variant="destructive" className="text-[10px] h-4">3</Badge>
      </span>
    </TabsTrigger>
    <TabsTrigger value="trash">
      <span className="flex items-center gap-2">Lixeira</span>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="inbox">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Caixa de entrada</h3>
      <p className="text-sm text-muted-foreground">12 mensagens não lidas</p>
    </div>
  </TabsContent>
  <TabsContent value="spam">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Spam</h3>
      <p className="text-sm text-muted-foreground">3 marcadas como spam</p>
    </div>
  </TabsContent>
  <TabsContent value="trash">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Lixeira</h3>
      <p className="text-sm text-muted-foreground">Itens excluídos nos últimos 30 dias.</p>
    </div>
  </TabsContent>
</Tabs>`,
            preview: (
              <Tabs defaultValue="inbox" className="w-full max-w-xl">
                <TabsList aria-label="Caixas de mensagem">
                  <TabsTrigger value="inbox">
                    <span className="flex items-center gap-2">
                      Caixa de entrada
                      <Badge className="text-[10px] h-4">12</Badge>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="spam">
                    <span className="flex items-center gap-2">
                      Spam
                      <Badge variant="destructive" className="text-[10px] h-4">3</Badge>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="trash">
                    <span className="flex items-center gap-2">Lixeira</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="inbox">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Caixa de entrada</h3>
                    <p className="text-sm text-muted-foreground">12 mensagens não lidas</p>
                  </div>
                </TabsContent>
                <TabsContent value="spam">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Spam</h3>
                    <p className="text-sm text-muted-foreground">3 marcadas como spam</p>
                  </div>
                </TabsContent>
                <TabsContent value="trash">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Lixeira</h3>
                    <p className="text-sm text-muted-foreground">Itens excluídos nos últimos 30 dias.</p>
                  </div>
                </TabsContent>
              </Tabs>
            ),
          },
          {
            name: tContent("variants.compositions.vertical.name"),
            description: tContent("variants.compositions.vertical.description"),
            useWhen: tContent("variants.compositions.vertical.use"),
            code: `<Tabs defaultValue="profile" className="w-full max-w-2xl flex gap-4" orientation="vertical">
  <TabsList className="flex flex-col h-auto items-stretch shrink-0 min-w-[10rem]" aria-label="Configurações">
    <TabsTrigger value="profile">Perfil</TabsTrigger>
    <TabsTrigger value="account">Conta</TabsTrigger>
    <TabsTrigger value="security">Segurança</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Perfil</h3>
      <p className="text-sm text-muted-foreground">Edite suas informações públicas.</p>
    </div>
  </TabsContent>
  <TabsContent value="account">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Conta</h3>
      <p className="text-sm text-muted-foreground">Email, idioma e preferências.</p>
    </div>
  </TabsContent>
  <TabsContent value="security">
    <div className="p-4 rounded-md border bg-card space-y-2">
      <h3 className="text-sm font-semibold">Segurança</h3>
      <p className="text-sm text-muted-foreground">Senha e autenticação em dois fatores.</p>
    </div>
  </TabsContent>
</Tabs>`,
            preview: (
              <Tabs
                defaultValue="profile"
                className="w-full max-w-2xl flex gap-4"
                orientation="vertical"
              >
                <TabsList
                  className="flex flex-col h-auto items-stretch shrink-0 min-w-[10rem]"
                  aria-label="Configurações"
                >
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="account">Conta</TabsTrigger>
                  <TabsTrigger value="security">Segurança</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Perfil</h3>
                    <p className="text-sm text-muted-foreground">Edite suas informações públicas.</p>
                  </div>
                </TabsContent>
                <TabsContent value="account">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Conta</h3>
                    <p className="text-sm text-muted-foreground">Email, idioma e preferências.</p>
                  </div>
                </TabsContent>
                <TabsContent value="security">
                  <div className="p-4 rounded-md border bg-card space-y-2">
                    <h3 className="text-sm font-semibold">Segurança</h3>
                    <p className="text-sm text-muted-foreground">Senha e autenticação em dois fatores.</p>
                  </div>
                </TabsContent>
              </Tabs>
            ),
          },
          {
            name: tContent("variants.compositions.lineSubNav.name"),
            description: tContent("variants.compositions.lineSubNav.description"),
            useWhen: tContent("variants.compositions.lineSubNav.use"),
            code: `<Tabs defaultValue="all" className="w-full max-w-2xl" variant="line">
  <TabsList
    aria-label="Filtros de listagem"
    className="border-b rounded-none bg-transparent w-full justify-start"
  >
    <TabsTrigger value="all">Tudo</TabsTrigger>
    <TabsTrigger value="active">Ativos</TabsTrigger>
    <TabsTrigger value="archived">Arquivados</TabsTrigger>
  </TabsList>
  <TabsContent value="all">
    <div className="text-sm text-muted-foreground p-3 rounded-md border bg-card">
      Mostrando todos os itens.
    </div>
  </TabsContent>
  <TabsContent value="active">
    <div className="text-sm text-muted-foreground p-3 rounded-md border bg-card">
      Mostrando apenas ativos.
    </div>
  </TabsContent>
  <TabsContent value="archived">
    <div className="text-sm text-muted-foreground p-3 rounded-md border bg-card">
      Mostrando apenas arquivados.
    </div>
  </TabsContent>
</Tabs>`,
            preview: (
              <Tabs defaultValue="all" className="w-full max-w-2xl" variant="line">
                <TabsList
                  aria-label="Filtros de listagem"
                  className="border-b rounded-none bg-transparent w-full justify-start"
                >
                  <TabsTrigger value="all">Tudo</TabsTrigger>
                  <TabsTrigger value="active">Ativos</TabsTrigger>
                  <TabsTrigger value="archived">Arquivados</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <div className="text-sm text-muted-foreground p-3 rounded-md border bg-card">
                    Mostrando todos os itens.
                  </div>
                </TabsContent>
                <TabsContent value="active">
                  <div className="text-sm text-muted-foreground p-3 rounded-md border bg-card">
                    Mostrando apenas ativos.
                  </div>
                </TabsContent>
                <TabsContent value="archived">
                  <div className="text-sm text-muted-foreground p-3 rounded-md border bg-card">
                    Mostrando apenas arquivados.
                  </div>
                </TabsContent>
              </Tabs>
            ),
          },
        ]}
      />

      {/* ── Estados ───────────────────────────────────────────────── */}
      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.title"),
          trigger: tNav("common.userAction"),
          behavior: tNav("common.expectedResult"),
        }}
        items={[
          {
            label: tContent("states.items.default"),
            trigger: "—",
            behavior: stripHtml(tContent("states.descriptions.default")),
          },
          {
            label: tContent("states.items.active"),
            trigger: "Click / Enter / Space",
            behavior: stripHtml(tContent("states.descriptions.active")),
          },
          {
            label: tContent("states.items.hover"),
            trigger: "Mouseover",
            behavior: stripHtml(tContent("states.descriptions.hover")),
          },
          {
            label: tContent("states.items.focus"),
            trigger: "Tab",
            behavior: stripHtml(tContent("states.descriptions.focus")),
          },
          {
            label: tContent("states.items.disabled"),
            trigger: "—",
            behavior: stripHtml(tContent("states.descriptions.disabled")),
          },
        ]}
      />

      {/* ── Propriedades ──────────────────────────────────────────── */}
      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: "Tabs",
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: propsRootItems.map(({ key, name }) => ({
              name,
              type: tContent(`props.table.${key}.type`),
              defaultValue: tContent(`props.table.${key}.default`),
              required: tContent(`props.table.${key}.required`),
              description: stripHtml(tContent(`props.table.${key}.description`)),
            })),
          },
          {
            title: "TabsList",
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: propsListItems.map(({ key, name }) => ({
              name,
              type: tContent(`props.table.${key}.type`),
              defaultValue: tContent(`props.table.${key}.default`),
              required: tContent(`props.table.${key}.required`),
              description: stripHtml(tContent(`props.table.${key}.description`)),
            })),
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
        items={tokenItems.map(({ key, token }) => ({
          token,
          value: tContent(`tokens.table.${key}.class`),
          description: tContent(`tokens.table.${key}.part`),
        }))}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      {/* ── Acessibilidade ────────────────────────────────────────── */}
      <DocsAccessibility
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[1, 2, 3, 4, 5, 6].map((i) =>
          tContent(`accessibility.items.item${i}`)
        )}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        keyboardItems={[
          { key: "Tab", description: tContent("accessibility.keyboard.tab") },
          {
            key: "ArrowRight",
            description: tContent("accessibility.keyboard.arrowRight"),
          },
          {
            key: "ArrowLeft",
            description: tContent("accessibility.keyboard.arrowLeft"),
          },
          {
            key: "ArrowDown",
            description: tContent("accessibility.keyboard.arrowDown"),
          },
          {
            key: "ArrowUp",
            description: tContent("accessibility.keyboard.arrowUp"),
          },
          { key: "Home", description: tContent("accessibility.keyboard.home") },
          { key: "End", description: tContent("accessibility.keyboard.end") },
          {
            key: "Enter",
            description: stripHtml(tContent("accessibility.keyboard.enter")),
          },
          {
            key: "Space",
            description: stripHtml(tContent("accessibility.keyboard.space")),
          },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="tabs"
        items={[
          {
            name: tContent("related.items.stepper.name"),
            description: tContent("related.items.stepper.description"),
            path: "?path=/docs/ui-stepper--docs",
          },
          {
            name: tContent("related.items.accordion.name"),
            description: tContent("related.items.accordion.description"),
            path: "?path=/docs/ui-accordion--docs",
          },
          {
            name: tContent("related.items.sidebar.name"),
            description: tContent("related.items.sidebar.description"),
            path: "?path=/docs/ui-sidebar--docs",
          },
          {
            name: tContent("related.items.toggleGroup.name"),
            description: tContent("related.items.toggleGroup.description"),
            path: "?path=/docs/ui-togglegroup--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.item1") },
          { title: "", content: tContent("notes.item2") },
          { title: "", content: tContent("notes.item3") },
          { title: "", content: tContent("notes.item4") },
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
            event: "tab_change",
            trigger: tContent("analytics.table.tab_change.trigger"),
            payload: tContent("analytics.table.tab_change.payload"),
          },
          {
            event: "docs_page_view",
            trigger: "Mount do componente (1x por locale)",
            payload: `{ component_name: "tabs", locale, page_title }`,
          },
          {
            event: "docs_section_viewed",
            trigger: "Seção entra no viewport",
            payload: `{ component_name: "tabs", section_id, locale }`,
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
          items: [1, 2, 3, 4].map((i) => ({
            action: stripHtml(tContent(`testes.functional.item${i}.action`)),
            result: stripHtml(tContent(`testes.functional.item${i}.result`)),
            priority: tNav(
              priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ??
                "common.high"
            ),
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
            how: "—",
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
            priority: tNav(
              priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ??
                "common.high"
            ),
          })),
        }}
      />

    </DocsPageLayout>
  );
}
