import { useCallback, useEffect, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import alertTranslations from "@shared/content/alert/translations.json";

import { DocsHeader }        from "@/components/docs/shared/sections/DocsHeader";
import { DocsPageLayout }    from "@/components/docs/shared/sections/DocsPageLayout";
import { DocsDemonstration } from "@/components/docs/shared/sections/DocsDemonstration";
import { DocsAnatomy }       from "@/components/docs/shared/sections/DocsAnatomy";
import { DocsWhenToUse }     from "@/components/docs/shared/sections/DocsWhenToUse";
import { DocsDoDont }        from "@/components/docs/shared/sections/DocsDoDont";
import { DocsImport }        from "@/components/docs/shared/sections/DocsImport";
import { DocsCompositions } from "@/components/docs/shared/sections/DocsCompositions";
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

type TestGroup = keyof (typeof alertTranslations)["pt-BR"]["testes"];

/**
 * Índices dos itens de um grupo de testes, DERIVADOS do dicionário. Lista
 * literal era o que deixava a página renderizar 7 de 8 quando o conteúdo ganhava
 * item: o dicionário cresce e a página acompanha sozinha.
 */
const testItemIndexes = (group: TestGroup): number[] =>
  Object.keys(alertTranslations["pt-BR"].testes[group])
    .filter((key) => /^item\d+$/.test(key))
    .map((key) => Number(key.slice("item".length)))
    .sort((a, b) => a - b);

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

export function AlertDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(alertTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (alertTranslations as unknown as Record<
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
    componentSlug: "alert",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "alert",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "alert",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImportBasic = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`;
  const codeImportWithIcon = `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";`;

  const codeDefault = `<Alert>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeDestructive = `<Alert variant="destructive">
  <AlertCircle aria-hidden="true" />
  <AlertTitle as="h4">Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>`;

  const codeSuccess = `<Alert variant="success">
  <CheckCircle2 aria-hidden="true" />
  <AlertTitle as="h4">Perfil atualizado</AlertTitle>
  <AlertDescription>
    Suas informações foram salvas com sucesso.
  </AlertDescription>
</Alert>`;

  const codeWarning = `<Alert variant="warning">
  <TriangleAlert aria-hidden="true" />
  <AlertTitle as="h4">Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>`;

  const codeInfo = `<Alert variant="info">
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Dica</AlertTitle>
  <AlertDescription>
    Você pode fixar os filtros mais usados para acessá-los mais rápido.
  </AlertDescription>
</Alert>`;

  const codeDismissible = `<Alert dismissible onDismiss={handleDismiss} dismissLabel="Fechar alerta">
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const codeWithoutTitle = `<Alert>
  <Info aria-hidden="true" />
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>`;

  const interfaceCode = `// Alert
interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "role">,
  VariantProps<typeof alertVariants> {
  /** Semântica de anúncio da raiz. "note" não é live region. @default "alert" */
  role?: "alert" | "status" | "note";
  /** Exibe o botão de fechar no canto superior direito. */
  dismissible?: boolean;
  /** Disparado uma única vez ao acionar o botão de fechar. */
  onDismiss?: () => void;
  /** aria-label do botão de fechar. @default "Fechar alerta" */
  dismissLabel?: string;
}

// AlertTitle
interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Nível do heading — o que preserva a hierarquia da página. @default "h5" */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

// AlertDescription — renderiza <section>
interface AlertDescriptionProps extends React.HTMLAttributes<HTMLElement> {}`;

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
          <DocsDemonstration >
            {/* Cada alert da demo mostra uma capacidade diferente: sem título,
                com título, dismissible e com ação. Todos já estão na página ao
                carregar, então são `note` — `alert` interromperia o leitor de
                tela quatro vezes na abertura (guideline 19). */}
            <div className="nds-w-full nds-stack" data-spacing="sm">
              <Alert role="note">
                <Info aria-hidden="true" />
                <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
              </Alert>
              <Alert role="note" variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle as="h3">{tContent("demonstration.labels.errorTitle")}</AlertTitle>
                <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
              </Alert>
              <Alert
                role="note"
                variant="success"
                dismissible
                onDismiss={() =>
                  track("alert_dismiss", {
                    component: "alert",
                    label: "demonstration",
                    location: "docs_demo",
                  })
                }
              >
                <CheckCircle2 aria-hidden="true" />
                <AlertTitle as="h3">{tContent("demonstration.labels.successTitle")}</AlertTitle>
                <AlertDescription>{tContent("demonstration.labels.successDesc")}</AlertDescription>
              </Alert>
              <Alert role="note" variant="warning">
                <TriangleAlert aria-hidden="true" />
                <AlertTitle as="h3">{tContent("demonstration.labels.warningTitle")}</AlertTitle>
                {/* Slot AlertAction — NÃO botão inline dentro da descrição.
                    `.nds-alert-action` é a coluna à direita do texto (alert.css),
                    que é o "alinhado à direita" que o
                    conteúdo descreve. Empilhar o botão dentro da descrição o
                    joga para a linha de baixo, à esquerda: foi assim que a docs
                    page divergiu da story ComAcao, que sempre usou o slot. */}
                <AlertDescription>{tContent("demonstration.labels.warningDesc")}</AlertDescription>
                <AlertAction>
                  <Button size="sm" variant="default">
                    {tContent("demonstration.labels.warningAction")}
                  </Button>
                </AlertAction>
              </Alert>
            </div>
          </DocsDemonstration>

          {/* ── Anatomia ──────────────────────────────────────────────── */}
          <DocsAnatomy
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
                  element: tContent("usage.uxWriting.table.error.name"),
                  rules: tContent("usage.uxWriting.table.error.format"),
                  do: tContent("usage.uxWriting.table.error.good"),
                  dont: tContent("usage.uxWriting.table.error.bad"),
                },
                {
                  element: tContent("usage.uxWriting.table.warning.name"),
                  rules: tContent("usage.uxWriting.table.warning.format"),
                  do: tContent("usage.uxWriting.table.warning.good"),
                  dont: tContent("usage.uxWriting.table.warning.bad"),
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

          {/* ── Do & Don't ────────────────────────────────────────────── */}
          <DocsDoDont
            pairs={[
              {
                doLabel: tNav("common.do"),
                dontLabel: tNav("common.dont"),
                // DocsDoDont só abre o h2 da seção: o título do alerta fica em h3.
                doPreview: (
                  <Alert role="note">
                    <Info aria-hidden="true" />
                    <AlertTitle as="h3">{tContent("demonstration.labels.errorTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
                  </Alert>
                ),
                dontPreview: (
                  <Alert role="note">
                    <AlertDescription>{tContent("demonstration.labels.savedLabel")}</AlertDescription>
                  </Alert>
                ),
                doCaption: toPlainText(tContent("doDont.pair1.do")),
                dontCaption: toPlainText(tContent("doDont.pair1.dont")),
              },
              {
                doLabel: tNav("common.do"),
                dontLabel: tNav("common.dont"),
                doPreview: (
                  <Alert role="note" variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle as="h3">{tContent("demonstration.labels.errorTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
                  </Alert>
                ),
                dontPreview: (
                  <Alert role="note" variant="destructive">
                    <AlertTitle as="h3">{tContent("demonstration.labels.errorTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
                  </Alert>
                ),
                doCaption: toPlainText(tContent("doDont.pair2.do")),
                dontCaption: toPlainText(tContent("doDont.pair2.dont")),
              },
            ]}
          />

          {/* ── Importação ────────────────────────────────────────────── */}
          <DocsImport
            description={tContent("import.basic")}
            code={codeImportBasic}
            secondaryDescription={tContent("import.withIcon")}
            secondaryCode={codeImportWithIcon}
          />

          {/* ── Variantes ─────────────────────────────────────────────── */}
          <DocsCompositions
            id="variantes"
            useWhenLabel={tNav("common.useWhen")}
            componentSlug="alert"
            items={[
              {
                name: "default",
                description: tContent("variants.items.default"),
                code: codeDefault,
                preview: (
                  <Alert role="note" className="nds-w-full">
                    <Info aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.infoTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: "destructive",
                description: stripHtml(tContent("variants.items.destructive")),
                code: codeDestructive,
                preview: (
                  <Alert role="note" variant="destructive" className="nds-w-full">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.errorTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.errorDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: "success",
                description: stripHtml(tContent("variants.items.success")),
                code: codeSuccess,
                preview: (
                  <Alert role="note" variant="success" className="nds-w-full">
                    <CheckCircle2 aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.successTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.successDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: "warning",
                description: stripHtml(tContent("variants.items.warning")),
                code: codeWarning,
                preview: (
                  <Alert role="note" variant="warning" className="nds-w-full">
                    <TriangleAlert aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.warningTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.warningDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: "info",
                description: stripHtml(tContent("variants.items.info")),
                code: codeInfo,
                preview: (
                  <Alert role="note" variant="info" className="nds-w-full">
                    <Info aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.infoTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                name: tContent("variants.items.dismissible.name"),
                trackId: "dismissible",
                description: tContent("variants.items.dismissible.description"),
                useWhen: tContent("variants.items.dismissible.use"),
                code: codeDismissible,
                preview: (
                  // Alert dismissible real — fechar remove o preview e dispara a
                  // primeira emissão real de alert_dismiss (payload tipado em analytics.ts).
                  <Alert role="note" dismissible className="nds-w-full"
                    onDismiss={() =>
                      track("alert_dismiss", {
                        component: "alert",
                        label: "dismissible",
                        location: "docs_variantes",
                      })
                    }
                  >
                    <Info aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.infoTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                trackId: "withoutTitle",
                name: tContent("states.withoutTitle.label"),
                description: tContent("states.withoutTitle.behavior"),
                code: codeWithoutTitle,
                preview: (
                  <Alert role="note" className="nds-w-full">
                    <Info aria-hidden="true" />
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
            ]}
          />

          {/* ── Composições ───────────────────────────────────────────── */}
          <DocsCompositions
            useWhenLabel={tNav("common.useWhen")}
            componentSlug="alert"
            items={[
              {
                trackId: "withIcon",
                name: tContent("variants.compositions.withIcon.name"),
                description: tContent("variants.compositions.withIcon.description"),
                useWhen: tContent("variants.compositions.withIcon.use"),
                code: `<Alert>\n  <Info aria-hidden="true" />\n  <AlertTitle as="h4">Informação</AlertTitle>\n  <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>\n</Alert>`,
                preview: (
                  <Alert role="note" className="nds-w-full">
                    <Info aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.infoTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.infoDesc")}</AlertDescription>
                  </Alert>
                ),
              },
              {
                trackId: "withAction",
                name: tContent("variants.compositions.withAction.name"),
                description: tContent("variants.compositions.withAction.description"),
                useWhen: tContent("variants.compositions.withAction.use"),
                // Slot AlertAction, igual à story ComAcao. O markup anterior
                // empilhava o botão dentro da descrição e ele caía na linha de
                // baixo — divergia da story e do "alinhado à direita" do texto.
                code: `<Alert>\n  <Info aria-hidden="true" />\n  <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>\n  <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>\n  <AlertAction>\n    <Button size="sm" variant="default">Salvar agora</Button>\n  </AlertAction>\n</Alert>`,
                preview: (
                  <Alert role="note" className="nds-w-full">
                    <Info aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.sessionTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.sessionDesc")}</AlertDescription>
                    <AlertAction>
                      <Button size="sm" variant="default">{tContent("demonstration.labels.saveNow")}</Button>
                    </AlertAction>
                  </Alert>
                ),
              },
              {
                // Ação + fechar: a ação é a terceira coluna do grid e o X fica à
                // direita dela, sem prop nenhuma a mais.
                trackId: "withActionAndDismiss",
                name: tContent("variants.compositions.withActionAndDismiss.name"),
                description: tContent("variants.compositions.withActionAndDismiss.description"),
                useWhen: tContent("variants.compositions.withActionAndDismiss.use"),
                code: `<Alert dismissible onDismiss={handleDismiss}>\n  <Info aria-hidden="true" />\n  <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>\n  <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>\n  <AlertAction>\n    <Button size="sm" variant="default">Salvar agora</Button>\n  </AlertAction>\n</Alert>`,
                preview: (
                  <Alert role="note" dismissible className="nds-w-full">
                    <Info aria-hidden="true" />
                    <AlertTitle as="h4">{tContent("demonstration.labels.sessionTitle")}</AlertTitle>
                    <AlertDescription>{tContent("demonstration.labels.sessionDesc")}</AlertDescription>
                    <AlertAction>
                      <Button size="sm" variant="default">{tContent("demonstration.labels.saveNow")}</Button>
                    </AlertAction>
                  </Alert>
                ),
              },
            ]}
          />

          {/* ── Configurações (States) ────────────────────────────────── */}
          <DocsStates
            cols={{
              state: tContent("states.cols.state"),
              trigger: toPlainText(tContent("states.cols.trigger")),
              behavior: toPlainText(tContent("states.cols.behavior")),
            }}
            items={[
              {
                label: tContent("states.complete.label"),
                trigger: toPlainText(tContent("states.complete.trigger")),
                behavior: toPlainText(tContent("states.complete.behavior")),
              },
              {
                label: tContent("states.withoutTitle.label"),
                trigger: toPlainText(tContent("states.withoutTitle.trigger")),
                behavior: toPlainText(tContent("states.withoutTitle.behavior")),
              },
              {
                label: tContent("states.withoutIcon.label"),
                trigger: toPlainText(tContent("states.withoutIcon.trigger")),
                behavior: toPlainText(tContent("states.withoutIcon.behavior")),
              },
              {
                label: tContent("states.withoutAnnouncement.label"),
                trigger: toPlainText(tContent("states.withoutAnnouncement.trigger")),
                behavior: toPlainText(tContent("states.withoutAnnouncement.behavior")),
              },
              {
                label: tContent("states.dynamicInsert.label"),
                trigger: toPlainText(tContent("states.dynamicInsert.trigger")),
                behavior: toPlainText(tContent("states.dynamicInsert.behavior")),
              },
              {
                label: tContent("states.dismissed.label"),
                trigger: toPlainText(tContent("states.dismissed.trigger")),
                behavior: toPlainText(tContent("states.dismissed.behavior")),
              },
            ]}
          />

          {/* ── Propriedades ──────────────────────────────────────────── */}
          <DocsProps
            tables={[
              {
                title: tContent("props.alertTitle"),
                cols: {
                  prop: tContent("props.table.prop"),
                  type: tContent("props.table.type"),
                  default: tContent("props.table.default"),
                  required: tContent("props.table.required"),
                  description: tContent("props.table.description"),
                },
                items: [
                  {
                    name: "variant",
                    type: '"default" | "destructive" | "success" | "warning" | "info"',
                    defaultValue: '"default"',
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.variant")),
                  },
                  {
                    name: "role",
                    type: '"alert" | "status" | "note"',
                    defaultValue: '"alert"',
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.role")),
                  },
                  {
                    name: "className",
                    type: "string",
                    defaultValue: "—",
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.className")),
                  },
                  {
                    name: "children",
                    type: "React.ReactNode",
                    defaultValue: "—",
                    required: tNav("common.yes"),
                    description: tContent("props.table.children"),
                  },
                  {
                    name: "dismissible",
                    type: "boolean",
                    defaultValue: "false",
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.dismissible")),
                  },
                  {
                    name: "onDismiss",
                    type: "() => void",
                    defaultValue: "—",
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.onDismiss")),
                  },
                  {
                    name: "dismissLabel",
                    type: "string",
                    defaultValue: '"Fechar alerta"',
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.dismissLabel")),
                  },
                ],
              },
              {
                title: tContent("props.alertTitleTitle"),
                cols: {
                  prop: tContent("props.table.prop"),
                  type: tContent("props.table.type"),
                  default: tContent("props.table.default"),
                  required: tContent("props.table.required"),
                  description: tContent("props.table.description"),
                },
                items: [
                  {
                    name: "as",
                    type: '"h1" | "h2" | "h3" | "h4" | "h5" | "h6"',
                    defaultValue: '"h5"',
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.titleAs")),
                  },
                  {
                    name: "className",
                    type: "string",
                    defaultValue: "—",
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.className")),
                  },
                  {
                    name: "children",
                    type: "React.ReactNode",
                    defaultValue: "—",
                    required: tNav("common.yes"),
                    description: tContent("props.table.children"),
                  },
                ],
              },
              {
                title: tContent("props.alertDescTitle"),
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
                    required: tNav("common.no"),
                    description: toPlainText(tContent("props.table.className")),
                  },
                  {
                    name: "children",
                    type: "React.ReactNode",
                    defaultValue: "—",
                    required: tNav("common.yes"),
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
            cols={{
              token: tContent("tokens.table.token"),
              value: tContent("tokens.table.class"),
              description: tContent("tokens.table.part"),
            }}
            items={[
              { token: "--muted", value: "hsl(var(--muted))", description: tContent("tokens.table.background") },
              { token: "--foreground", value: "hsl(var(--foreground))", description: tContent("tokens.table.foreground") },
              { token: "--border", value: "hsl(var(--border))", description: tContent("tokens.table.border") },
              { token: "--destructive", value: "hsl(var(--destructive) / 0.3)", description: tContent("tokens.table.destructiveBorder") },
              { token: "--destructive", value: "hsl(var(--destructive))", description: tContent("tokens.table.destructiveText") },
              { token: "--success", value: ".nds-alert-success", description: tContent("tokens.table.success") },
              { token: "--warning", value: ".nds-alert-warning", description: tContent("tokens.table.warning") },
              { token: "--info", value: ".nds-alert-info", description: tContent("tokens.table.info") },
              { token: "--radius-alert", value: "var(--radius-alert)", description: tContent("tokens.table.radius") },
              { token: "--alert-bg", value: "hsl(var(--muted))", description: tContent("tokens.table.alertBg") },
              { token: "--alert-bg-alpha", value: "0.1", description: tContent("tokens.table.alertBgAlpha") },
              { token: "--alert-fg", value: "hsl(var(--card-foreground))", description: tContent("tokens.table.alertFg") },
              { token: "--alert-body-fg", value: "hsl(var(--foreground))", description: tContent("tokens.table.alertBodyFg") },
              { token: "--alert-border", value: "hsl(var(--border))", description: tContent("tokens.table.alertBorder") },
              { token: "--alert-border-alpha", value: "0.3", description: tContent("tokens.table.alertBorderAlpha") },
              { token: "--alert-glow", value: "hsl(var(--border))", description: tContent("tokens.table.alertGlow") },
            ]}
            customizationTitle={tContent("tokens.customizationTitle")}
            customizationCode={tContent("tokens.customizationCode")}
          />

          {/* ── Acessibilidade ────────────────────────────────────────── */}
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
            ]}
            keyboardTitle={tContent("accessibility.keyboardTitle")}
            keyboardItems={[
              { key: "Tab",   description: tContent("accessibility.keyboard.tab") },
              { key: "Enter", description: tContent("accessibility.keyboard.enter") },
              { key: "—",     description: tContent("accessibility.keyboard.noKeyboard") },
            ]}
          />

          {/* ── Relacionados ──────────────────────────────────────────── */}
          <DocsRelated
            items={[
              {
                name: "Sonner",
                description: toPlainText(tContent("related.sonner")),
                path: "?path=/docs/components-feedback-sonner--docs",
              },
              {
                name: "AlertDialog",
                description: toPlainText(tContent("related.alertDialog")),
                path: "?path=/docs/components-overlay-alertdialog--docs",
              },
              {
                name: "Badge",
                description: toPlainText(tContent("related.badge")),
                path: "?path=/docs/components-feedback-badge--docs",
              },
              {
                name: "Progress",
                description: toPlainText(tContent("related.progress")),
                path: "?path=/docs/components-feedback-progress--docs",
              },
            ]}
          />

          {/* ── Notas ─────────────────────────────────────────────────── */}
          <DocsNotes
            items={[
              { title: "", content: tContent("notes.tip1") },
              { title: "", content: tContent("notes.tip2") },
              { title: "", content: tContent("notes.tip3") },
            ]}
          />

          {/* ── Analytics ─────────────────────────────────────────────── */}
          <DocsAnalytics
            cols={{
              event: tContent("analytics.table.event"),
              trigger: toPlainText(tContent("analytics.table.trigger")),
              payload: tContent("analytics.table.payload"),
            }}
            items={[
              {
                event: tContent("analytics.table.dismiss"),
                trigger: toPlainText(tContent("analytics.table.dismissTrigger")),
                payload: tContent("analytics.table.dismissPayload"),
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
            functional={{
              title: tContent("testes.functional.title"),
              cols: {
                action: tNav("common.userAction"),
                result: tNav("common.expectedResult"),
                priority: tNav("common.priority"),
              },
              items: testItemIndexes("functional").map((i) => ({
                action: tContent(`testes.functional.item${i}.action`),
                result: tContent(`testes.functional.item${i}.result`),
                priority: tNav(priorityKeyMap[tContent(`testes.functional.item${i}.priority`)] ?? "common.medium"),
              })),
            }}
            accessibility={{
              title: tContent("testes.accessibility.title"),
              cols: {
                criterion: tNav("common.criterion"),
                level: "WCAG",
                how: tNav("common.howToVerify"),
              },
              items: testItemIndexes("accessibility").map((i) => ({
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
              items: testItemIndexes("visual").map((i) => ({
                story: tContent(`testes.visual.item${i}.story`),
                priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.medium"),
              })),
            }}
          />
    </DocsPageLayout>
  );
}
