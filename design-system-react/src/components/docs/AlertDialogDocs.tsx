import { useCallback, useEffect, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import alertDialogTranslations from "@shared/content/alert-dialog/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

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


type DestructiveDemoProps = {
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  defaultOpen?: boolean;
};

function DestructiveDemo({ triggerLabel, title, description, cancel, action, defaultOpen }: DestructiveDemoProps) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{triggerLabel}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancel}</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type NeutralDemoProps = {
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  defaultOpen?: boolean;
};

function NeutralDemo({ triggerLabel, title, description, cancel, action, defaultOpen }: NeutralDemoProps) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancel}</AlertDialogCancel>
          <AlertDialogAction>{action}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AlertDialogDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(alertDialogTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "alert-dialog",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "alert-dialog",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "alert-dialog",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const codeImportBasic = `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";`;

  const codeImportWithTrigger = `import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";`;

  const codeDestructive = `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir conta</AlertDialogTitle>
      <AlertDialogDescription>
        Todos os seus dados serão removidos permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

  const codeDefault = `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Sair da conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sair da conta</AlertDialogTitle>
      <AlertDialogDescription>
        Você precisará entrar novamente para acessar seus dados.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Sair</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

  const codeCustomizationTokens = `/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --muted-foreground: 0 0% 45.1%;
  --radius: 0.5rem;
}`;

  const interfaceCode = `// AlertDialog (Root)
interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

// AlertDialogTrigger
interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

// AlertDialogContent
interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// AlertDialogAction / AlertDialogCancel
interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}`;

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
          installNote="npx shadcn@latest add alert-dialog"
        />
      }
    >
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <DestructiveDemo
            triggerLabel={tContent("demonstration.labels.triggerLabel")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            action={tContent("demonstration.labels.action")}
          />
          <NeutralDemo
            triggerLabel={tContent("demonstration.labels.neutralTriggerLabel")}
            title={tContent("demonstration.labels.neutralTitle")}
            description={tContent("demonstration.labels.neutralDescription")}
            cancel={tContent("demonstration.labels.cancel")}
            action={tContent("demonstration.labels.neutralAction")}
          />
        </div>
      </DocsDemonstration>

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
          tContent("anatomy.item9"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

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
              element: tContent("usage.uxWriting.table.title.name"),
              rules: tContent("usage.uxWriting.table.title.format"),
              do: tContent("usage.uxWriting.table.title.good"),
              dont: tContent("usage.uxWriting.table.title.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.description.name"),
              rules: tContent("usage.uxWriting.table.description.format"),
              do: tContent("usage.uxWriting.table.description.good"),
              dont: tContent("usage.uxWriting.table.description.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.action.name"),
              rules: tContent("usage.uxWriting.table.action.format"),
              do: tContent("usage.uxWriting.table.action.good"),
              dont: tContent("usage.uxWriting.table.action.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.cancel.name"),
              rules: tContent("usage.uxWriting.table.cancel.format"),
              do: tContent("usage.uxWriting.table.cancel.good"),
              dont: tContent("usage.uxWriting.table.cancel.bad"),
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
            stripHtml(tContent("usage.dont.item3")),
            tContent("usage.dont.item4"),
          ],
        }}
      />

      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <DestructiveDemo
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
              />
            ),
            dontPreview: (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Excluir</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação irá excluir os dados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Não</AlertDialogCancel>
                    <AlertDialogAction>Sim</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ),
            doCaption: tContent("doDont.pair1.do"),
            dontCaption: tContent("doDont.pair1.dont"),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <DestructiveDemo
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
              />
            ),
            dontPreview: (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Excluir conta</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os seus dados serão removidos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ),
            doCaption: tContent("doDont.pair2.do"),
            dontCaption: tContent("doDont.pair2.dont"),
          },
        ]}
      />

      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withTrigger")}
        secondaryCode={codeImportWithTrigger}
      />

      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: "destructive",
            description: stripHtml(tContent("variants.items.destructive")),
            code: codeDestructive,
            preview: (
              <DestructiveDemo
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
              />
            ),
          },
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: (
              <NeutralDemo
                triggerLabel={tContent("demonstration.labels.neutralTriggerLabel")}
                title={tContent("demonstration.labels.neutralTitle")}
                description={tContent("demonstration.labels.neutralDescription")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.neutralAction")}
              />
            ),
          },
        ]}
      />

      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        items={[
          {
            name: tContent("variants.compositions.destructive.name"),
            description: tContent("variants.compositions.destructive.description"),
            useWhen: tContent("variants.compositions.destructive.use"),
            code: `<AlertDialog>\n  <AlertDialogTrigger asChild>\n    <Button variant="destructive">Excluir conta</Button>\n  </AlertDialogTrigger>\n  <AlertDialogContent>\n    <AlertDialogHeader>\n      <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>\n      <AlertDialogDescription>\n        Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.\n      </AlertDialogDescription>\n    </AlertDialogHeader>\n    <AlertDialogFooter>\n      <AlertDialogCancel>Cancelar</AlertDialogCancel>\n      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">\n        Excluir conta\n      </AlertDialogAction>\n    </AlertDialogFooter>\n  </AlertDialogContent>\n</AlertDialog>`,
            preview: (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Excluir conta</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ),
          },
          {
            name: tContent("variants.compositions.neutral.name"),
            description: tContent("variants.compositions.neutral.description"),
            useWhen: tContent("variants.compositions.neutral.use"),
            code: `<AlertDialog>\n  <AlertDialogTrigger asChild>\n    <Button>Publicar agora</Button>\n  </AlertDialogTrigger>\n  <AlertDialogContent>\n    <AlertDialogHeader>\n      <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>\n      <AlertDialogDescription>\n        Ao publicar, o conteúdo fica visível para todos os usuários.\n      </AlertDialogDescription>\n    </AlertDialogHeader>\n    <AlertDialogFooter>\n      <AlertDialogCancel>Voltar</AlertDialogCancel>\n      <AlertDialogAction>Publicar</AlertDialogAction>\n    </AlertDialogFooter>\n  </AlertDialogContent>\n</AlertDialog>`,
            preview: (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>Publicar agora</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao publicar, o conteúdo fica visível para todos os usuários.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction>Publicar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ),
          },
        ]}
      />

      <DocsStates
        title={tContent("states.title")}
        cols={{
          state: tContent("states.cols.state"),
          trigger: tContent("states.cols.trigger"),
          behavior: tContent("states.cols.behavior"),
        }}
        items={[
          { label: tContent("states.closed.label"),    trigger: tContent("states.closed.trigger"),    behavior: tContent("states.closed.behavior") },
          { label: tContent("states.open.label"),      trigger: stripHtml(tContent("states.open.trigger")),      behavior: tContent("states.open.behavior") },
          { label: tContent("states.confirmed.label"), trigger: stripHtml(tContent("states.confirmed.trigger")), behavior: stripHtml(tContent("states.confirmed.behavior")) },
          { label: tContent("states.cancelled.label"), trigger: stripHtml(tContent("states.cancelled.trigger")), behavior: tContent("states.cancelled.behavior") },
          { label: tContent("states.controlled.label"),trigger: stripHtml(tContent("states.controlled.trigger")),behavior: tContent("states.controlled.behavior") },
        ]}
      />

      <DocsProps
        title={tContent("props.title")}
        tables={[
          {
            title: tContent("props.rootTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "open",         type: "boolean",                  defaultValue: "—",       required: "Não", description: stripHtml(tContent("props.table.open")) },
              { name: "defaultOpen",  type: "boolean",                  defaultValue: "false",   required: "Não", description: tContent("props.table.defaultOpen") },
              { name: "onOpenChange", type: "(open: boolean) => void",  defaultValue: "—",       required: "Não", description: tContent("props.table.onOpenChange") },
              { name: "children",     type: "React.ReactNode",          defaultValue: "—",       required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.triggerTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "asChild",   type: "boolean",             defaultValue: "false", required: "Não", description: stripHtml(tContent("props.table.asChild")) },
              { name: "className", type: "string",              defaultValue: "—",     required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode",     defaultValue: "—",     required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.contentTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "className", type: "string",          defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.actionTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "onClick",   type: "(e: MouseEvent) => void", defaultValue: "—", required: "Não", description: tContent("props.table.onClick") },
              { name: "className", type: "string",                   defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode",          defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.cancelTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "onClick",   type: "(e: MouseEvent) => void", defaultValue: "—", required: "Não", description: tContent("props.table.onClick") },
              { name: "className", type: "string",                   defaultValue: "—", required: "Não", description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode",          defaultValue: "—", required: "Sim", description: tContent("props.table.children") },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--background",           value: "bg-black/80",                              description: tContent("tokens.table.overlayBg") },
          { token: "--background",           value: "bg-background",                            description: tContent("tokens.table.contentBg") },
          { token: "--foreground",           value: "text-foreground",                          description: tContent("tokens.table.contentForeground") },
          { token: "--border",               value: "border",                                   description: tContent("tokens.table.border") },
          { token: "--muted-foreground",     value: "text-muted-foreground",                    description: tContent("tokens.table.mutedForeground") },
          { token: "--destructive",          value: "bg-destructive",                           description: tContent("tokens.table.destructive") },
          { token: "--destructive-foreground", value: "text-destructive-foreground",            description: tContent("tokens.table.destructiveForeground") },
          { token: "--radius",               value: "sm:rounded-lg",                            description: tContent("tokens.table.radius") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

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
          { key: "Tab",          description: tContent("accessibility.keyboard.tab") },
          { key: "Shift+Tab",    description: tContent("accessibility.keyboard.shiftTab") },
          { key: "Enter",        description: tContent("accessibility.keyboard.enter") },
          { key: "Space",        description: tContent("accessibility.keyboard.space") },
          { key: "Escape",       description: tContent("accessibility.keyboard.escape") },
        ]}
      />

      <DocsRelated
        title={tContent("related.title")}
        items={[
          { name: "Dialog",  description: tContent("related.dialog"),  path: "?path=/docs/ui-dialog--docs" },
          { name: "Sonner",  description: tContent("related.sonner"),  path: "?path=/docs/ui-sonner--docs" },
          { name: "Alert",   description: tContent("related.alert"),   path: "?path=/docs/ui-alert--docs" },
          { name: "Button",  description: tContent("related.button"),  path: "?path=/docs/ui-button--docs" },
        ]}
      />

      <DocsNotes
        title={tContent("notes.title")}
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
        ]}
      />

      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event:   tContent("analytics.table.event"),
          trigger: tContent("analytics.table.trigger"),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          { event: tContent("analytics.table.open"),          trigger: tContent("analytics.table.openTrigger"),          payload: tContent("analytics.table.openPayload") },
          { event: tContent("analytics.table.confirm"),       trigger: tContent("analytics.table.confirmTrigger"),       payload: tContent("analytics.table.confirmPayload") },
          { event: tContent("analytics.table.close"),         trigger: tContent("analytics.table.closeTrigger"),         payload: tContent("analytics.table.closePayload") },
          { event: tContent("analytics.table.pageView"),      trigger: tContent("analytics.table.pageViewTrigger"),      payload: tContent("analytics.table.pageViewPayload") },
          { event: tContent("analytics.table.sectionViewed"), trigger: tContent("analytics.table.sectionViewedTrigger"), payload: tContent("analytics.table.sectionViewedPayload") },
          { event: tContent("analytics.table.langSwitch"),    trigger: tContent("analytics.table.langSwitchTrigger"),    payload: tContent("analytics.table.langSwitchPayload") },
        ]}
      />

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
          items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
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
          items: [1, 2, 3, 4, 5].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
