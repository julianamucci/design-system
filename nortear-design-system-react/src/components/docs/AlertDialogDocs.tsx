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
import { DocsStates }        from "@/components/docs/shared/sections/DocsStates";
import { DocsProps }         from "@/components/docs/shared/sections/DocsProps";
import { DocsTokens }        from "@/components/docs/shared/sections/DocsTokens";
import { DocsAccessibility } from "@/components/docs/shared/sections/DocsAccessibility";
import { DocsRelated }       from "@/components/docs/shared/sections/DocsRelated";
import { DocsNotes }         from "@/components/docs/shared/sections/DocsNotes";
import { DocsAnalytics }     from "@/components/docs/shared/sections/DocsAnalytics";
import { DocsTestes }        from "@/components/docs/shared/sections/DocsTestes";
import { markConfirmation } from "@/components/ui/dialog-close-reason";
import { alertDialogCloseReason } from "@/components/ui/alert-dialog-close-reason";
import { stripHtml, toPlainText } from "@/lib/strip-html";

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

/**
 * `location` responde DE ONDE VEIO o clique, e por isso chega por prop, vinda
 * da seção que monta o preview — nunca constante no topo do arquivo. As quatro
 * chamadas desta página mandavam `docs_demo`, inclusive as de Variantes e de
 * Do & Don't, que renderizam componente vivo tanto quanto a Demonstração. O
 * vocabulário é `docs_<section-id>` (`docs/shared/guidelines/07-analytics.md`).
 */
type DocsLocation = "docs_demo" | "docs_variantes" | "docs_do_dont";

// Os previews renderizam SEMPRE o gatilho fechado: o AlertDialog vive num
// portal com overlay modal, e um preview aberto cobriria a página no load.
type AlertDialogDemoProps = {
  /**
   * Id ESTÁVEL do cenário, que vai no `trigger_id` do payload. O título chega
   * traduzido, e texto traduzido parte um evento em três valores no GA4 (um por
   * idioma).
   */
  triggerId: string;
  location: DocsLocation;
  /** Variante do Button no gatilho. */
  triggerVariant: "destructive" | "outline";
  /** Variante do Button na ação; sem ela, a padrão do Button. */
  actionVariant?: "destructive";
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
};

// Um só construtor para os seis previews: o que muda entre eles é o texto e as
// variantes do Button — o componente, a fiação de eventos e as duas saídas do
// rodapé (C7) são sempre os mesmos.
function AlertDialogDemo({
  triggerId,
  location,
  triggerVariant,
  actionVariant,
  triggerLabel,
  title,
  description,
  cancel,
  action,
}: AlertDialogDemoProps) {
  return (
    <AlertDialog
      onOpenChange={(open, details) =>
        track(open ? "dialog_open" : "dialog_close", {
          component: "alert-dialog",
          trigger_id: triggerId,
          // Escape chega aqui como `escape-key` e sai `escape`; o Cancelar,
          // como `close-button`; a ação, como `api` pela marca abaixo. O
          // mapeador é o do ALERT dialog — três palavras, sem `overlay`,
          // porque o clique no véu não fecha este painel (D1).
          ...(open ? {} : { reason: alertDialogCloseReason(details?.reason) }),
          location,
        })
      }
    >
      <AlertDialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerLabel}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            onClick={() => {
              // A marca vem ANTES do fechamento: sem ela a lib entrega o mesmo
              // motivo do Cancelar, e a confirmação viraria `close-button`.
              markConfirmation()
              track("dialog_confirm", {
                component: "alert-dialog",
                trigger_id: triggerId,
                location,
              })
            }}
          >
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AlertDialogDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(alertDialogTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (alertDialogTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      )
        .filter(([key]) => key !== "title")
        .map(([, value]) => value),
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

  // Os dois conjuntos de `demonstration.labels`: a confirmação destrutiva e a
  // neutra. Todo preview vivo da página sai de um deles — ou, no "não faça" do
  // par 1, de `doDont.pair1.dontExample`, que é o texto que o par existe para
  // reprovar.
  const destructiveLabels = {
    triggerLabel: tContent("demonstration.labels.triggerLabel"),
    title: tContent("demonstration.labels.title"),
    description: tContent("demonstration.labels.description"),
    cancel: tContent("demonstration.labels.cancel"),
    action: tContent("demonstration.labels.action"),
  };
  const neutralLabels = {
    triggerLabel: tContent("demonstration.labels.neutralTriggerLabel"),
    title: tContent("demonstration.labels.neutralTitle"),
    description: tContent("demonstration.labels.neutralDescription"),
    cancel: tContent("demonstration.labels.cancel"),
    action: tContent("demonstration.labels.neutralAction"),
  };

  // Coluna "Obrigatório" das tabelas de props: rótulo de interface, então vem
  // do dicionário da página e segue o idioma — literal aqui ficava em português
  // nos três.
  const yes = tNav("common.yes");
  const no = tNav("common.no");

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

  // O código de cada card de Variantes sai do MESMO conjunto de rótulos que o
  // preview ao lado renderiza, no idioma corrente: texto cravado aqui ficava em
  // português nos três idiomas e se afastava do preview a cada revisão do
  // conteúdo compartilhado.
  const variantCode = (
    labels: typeof destructiveLabels,
    triggerVariant: "destructive" | "outline",
    actionVariant?: "destructive",
  ) => `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="${triggerVariant}">${labels.triggerLabel}</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>${labels.title}</AlertDialogTitle>
      <AlertDialogDescription>
        ${labels.description}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>${labels.cancel}</AlertDialogCancel>
      <AlertDialogAction${actionVariant ? ` variant="${actionVariant}"` : ""}>${labels.action}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

  const codeDestructive = variantCode(destructiveLabels, "destructive", "destructive");
  const codeDefault = variantCode(neutralLabels, "outline");

  // A assinatura que o componente de fato expõe: o callback de mudança recebe
  // também os detalhes do evento, a ação e o cancelar herdam `variant`/`size`
  // do Button, o título troca de nível por `render`, e a mídia é peça própria.
  const interfaceCode = `import type { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import type { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

// AlertDialog (Root)
interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    eventDetails: AlertDialogPrimitive.Root.ChangeEventDetails,
  ) => void;
  children: React.ReactNode;
}

// AlertDialogTrigger
interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  render?: React.ReactElement;
}

// AlertDialogContent
interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// AlertDialogHeader / AlertDialogFooter / AlertDialogMedia
interface AlertDialogSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

// AlertDialogTitle
interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  render?: React.ReactElement; // <h3 />, <h4 />…
}

// AlertDialogDescription
interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

// AlertDialogAction
interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

// AlertDialogCancel
interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonProps["variant"]; // "outline"
  size?: ButtonProps["size"]; // "default"
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
      <DocsDemonstration >
        <div className="nds-cluster" data-spacing="md" data-justify="center">
          <AlertDialogDemo
            triggerId="destructive"
            location="docs_demo"
            triggerVariant="destructive"
            actionVariant="destructive"
            {...destructiveLabels}
          />
          <AlertDialogDemo
            triggerId="neutral"
            location="docs_demo"
            triggerVariant="outline"
            {...neutralLabels}
          />
        </div>
      </DocsDemonstration>

      <DocsAnatomy
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
          tContent("anatomy.item10"),
        ]}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      <DocsWhenToUse
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
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <AlertDialogDemo
                triggerId="pair1-do"
                location="docs_do_dont"
                triggerVariant="destructive"
                actionVariant="destructive"
                {...destructiveLabels}
              />
            ),
            // O par 1 é sobre ESCRITA: o "não faça" muda só o texto — título em
            // pergunta e botões genéricos —, com o mesmo gatilho e as mesmas
            // variantes do "faça", para que a comparação ensine uma coisa só.
            dontPreview: (
              <AlertDialogDemo
                triggerId="pair1-dont"
                title={tContent("doDont.pair1.dontExample.title")}
                location="docs_do_dont"
                triggerVariant="destructive"
                actionVariant="destructive"
                triggerLabel={destructiveLabels.triggerLabel}
                description={tContent("doDont.pair1.dontExample.description")}
                cancel={tContent("doDont.pair1.dontExample.cancel")}
                action={tContent("doDont.pair1.dontExample.action")}
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <AlertDialogDemo
                triggerId="pair2-do"
                location="docs_do_dont"
                triggerVariant="destructive"
                actionVariant="destructive"
                {...destructiveLabels}
              />
            ),
            // O par 2 é sobre SEVERIDADE: mesmo texto, mesmo Cancelar (C7), e a
            // ação na variante padrão sob um gatilho destrutivo.
            dontPreview: (
              <AlertDialogDemo
                triggerId="pair2-dont"
                location="docs_do_dont"
                triggerVariant="destructive"
                {...destructiveLabels}
              />
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      <DocsImport componentSlug="alert-dialog"
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withTrigger")}
        secondaryCode={codeImportWithTrigger}
      />

      <DocsVariants componentSlug="alert-dialog"
        note={tContent("variants.note")}
        items={[
          {
            name: "destructive",
            description: stripHtml(tContent("variants.items.destructive")),
            code: codeDestructive,
            preview: (
              <AlertDialogDemo
                triggerId="destructive"
                location="docs_variantes"
                triggerVariant="destructive"
                actionVariant="destructive"
                {...destructiveLabels}
              />
            ),
          },
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: (
              <AlertDialogDemo
                triggerId="neutral"
                location="docs_variantes"
                triggerVariant="outline"
                {...neutralLabels}
              />
            ),
          },
        ]}
      />

      <DocsStates
        cols={{
          state: tContent("states.cols.state"),
          trigger: toPlainText(tContent("states.cols.trigger")),
          behavior: toPlainText(tContent("states.cols.behavior")),
        }}
        items={[
          { label: tContent("states.closed.label"),    trigger: toPlainText(tContent("states.closed.trigger")),    behavior: toPlainText(tContent("states.closed.behavior"))},
          { label: tContent("states.open.label"),      trigger: toPlainText(tContent("states.open.trigger")),      behavior: toPlainText(tContent("states.open.behavior"))},
          { label: tContent("states.confirmed.label"), trigger: toPlainText(tContent("states.confirmed.trigger")), behavior: toPlainText(tContent("states.confirmed.behavior")) },
          { label: tContent("states.cancelled.label"), trigger: toPlainText(tContent("states.cancelled.trigger")), behavior: toPlainText(tContent("states.cancelled.behavior"))},
          { label: tContent("states.controlled.label"),trigger: toPlainText(tContent("states.controlled.trigger")),behavior: toPlainText(tContent("states.controlled.behavior"))},
        ]}
      />

      <DocsProps
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
              { name: "open",         type: "boolean",                  defaultValue: "—",       required: no,    description: toPlainText(tContent("props.table.open")) },
              { name: "defaultOpen",  type: "boolean",                  defaultValue: "false",   required: no,    description: tContent("props.table.defaultOpen") },
              { name: "onOpenChange", type: "(open: boolean, eventDetails) => void", defaultValue: "—",       required: no,    description: tContent("props.table.onOpenChange") },
              { name: "children",     type: "React.ReactNode",          defaultValue: "—",       required: yes,   description: tContent("props.table.children") },
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
              { name: "asChild",   type: "boolean",             defaultValue: "false", required: no,    description: toPlainText(tContent("props.table.asChild")) },
              { name: "className", type: "string",              defaultValue: "—",     required: no,    description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode",     defaultValue: "—",     required: yes,   description: tContent("props.table.children") },
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
              { name: "className", type: "string",          defaultValue: "—", required: no,    description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode", defaultValue: "—", required: yes,   description: tContent("props.table.children") },
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
              { name: "onClick",   type: "(e: MouseEvent) => void", defaultValue: "—", required: no,    description: tContent("props.table.onClick") },
              { name: "className", type: "string",                   defaultValue: "—", required: no,    description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode",          defaultValue: "—", required: yes,   description: tContent("props.table.children") },
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
              { name: "onClick",   type: "(e: MouseEvent) => void", defaultValue: "—", required: no,    description: tContent("props.table.onClick") },
              { name: "className", type: "string",                   defaultValue: "—", required: no,    description: tContent("props.table.className") },
              { name: "children",  type: "React.ReactNode",          defaultValue: "—", required: yes,   description: tContent("props.table.children") },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      <DocsTokens
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          // O véu lê `--overlay`, o token de cor da camada; o alfa de 0.8 é do uso.
          { token: "--overlay",                        value: ".nds-alert-dialog-overlay",     description: tContent("tokens.table.overlayBg") },
          { token: "--background",             value: ".nds-alert-dialog-content",     description: tContent("tokens.table.contentBg") },
          { token: "--foreground",             value: ".nds-alert-dialog-content",     description: tContent("tokens.table.contentForeground") },
          { token: "--border",                 value: ".nds-alert-dialog-content",     description: tContent("tokens.table.border") },
          { token: "--radius-card",            value: ".nds-alert-dialog-content",     description: tContent("tokens.table.radius") },
          { token: "--elevation-xl",           value: ".nds-alert-dialog-content",     description: tContent("tokens.table.elevation") },
          { token: "--spacing-6",              value: ".nds-alert-dialog-content",     description: tContent("tokens.table.padding") },
          { token: "--muted-foreground",       value: ".nds-alert-dialog-description", description: tContent("tokens.table.mutedForeground") },
          { token: "--muted",                  value: ".nds-alert-dialog-media",       description: tContent("tokens.table.mediaBg") },
          { token: "--radius-md",              value: ".nds-alert-dialog-media",       description: tContent("tokens.table.mediaRadius") },
          // A ação herda o tom do Button: o tom destrutivo vem da variante, não deste CSS.
          // `--destructive-foreground` não tem linha porque não tem leitor: a variante
          // destrutiva é soft (fundo suave com o rótulo na PRÓPRIA cor semântica), e
          // nenhuma regra de button.css lê o par `-foreground`. Ver button.css:16-18.
          { token: "--destructive",            value: ".nds-button-destructive",       description: tContent("tokens.table.destructive") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={tContent("tokens.customizationCode")}
      />

      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
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

      <DocsRelated componentSlug="alert-dialog"
        items={[
          { name: "Dialog",  description: toPlainText(tContent("related.dialog")),  path: "?path=/docs/components-overlay-dialog--docs" },
          { name: "Sonner",  description: toPlainText(tContent("related.sonner")),  path: "?path=/docs/components-feedback-sonner--docs" },
          { name: "Alert",   description: toPlainText(tContent("related.alert")),   path: "?path=/docs/components-feedback-alert--docs" },
          { name: "Button",  description: toPlainText(tContent("related.button")),  path: "?path=/docs/components-form-button--docs" },
        ]}
      />

      <DocsNotes componentSlug="alert-dialog"
        items={[
          { title: "", content: tContent("notes.tip1") },
          { title: "", content: tContent("notes.tip2") },
          { title: "", content: tContent("notes.tip3") },
          { title: "", content: tContent("notes.tip4") },
        ]}
      />

      <DocsAnalytics
        cols={{
          event:   tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          { event: tContent("analytics.table.open"),          trigger: toPlainText(tContent("analytics.table.openTrigger")),          payload: tContent("analytics.table.openPayload") },
          { event: tContent("analytics.table.confirm"),       trigger: toPlainText(tContent("analytics.table.confirmTrigger")),       payload: tContent("analytics.table.confirmPayload") },
          { event: tContent("analytics.table.close"),         trigger: toPlainText(tContent("analytics.table.closeTrigger")),         payload: tContent("analytics.table.closePayload") },
          { event: tContent("analytics.table.pageView"),      trigger: toPlainText(tContent("analytics.table.pageViewTrigger")),      payload: tContent("analytics.table.pageViewPayload") },
          { event: tContent("analytics.table.sectionViewed"), trigger: toPlainText(tContent("analytics.table.sectionViewedTrigger")), payload: tContent("analytics.table.sectionViewedPayload") },
          { event: tContent("analytics.table.langSwitch"),    trigger: toPlainText(tContent("analytics.table.langSwitchTrigger")),    payload: tContent("analytics.table.langSwitchPayload") },
        ]}
      />

      <DocsTestes
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
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
