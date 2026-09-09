import { useCallback, useEffect, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import tooltipTranslations from "@shared/content/tooltip/translations.json";
// A ajuda das composições é GLIFO de texto (`?` / `i`), não ícone lucide: é o
// que o conteúdo descreve ('Ícone "?"') e o que o vanilla renderiza.
import { Save, Trash2, Share2 } from "lucide-react";

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

/**
 * `tooltip_view` de QUALQUER seção que renderize um tooltip vivo.
 *
 * O `location` vem de quem chama, e não de constante: ele existe para dizer de
 * ONDE veio o evento, e cravá-lo em `docs_demo` fazia toda a página responder a
 * mesma coisa. Vocabulário em `docs/shared/guidelines/07-analytics.md`.
 *
 * E o alcance não era só o `location`: dos 10 tooltips VIVOS desta página, só
 * os 3 da demonstração disparavam evento. Variantes e Composições renderizam o
 * componente de verdade, e um hover ali é tão real quanto na demo.
 */
const rastrearTooltip = (location: string, triggerId: string) => (open: boolean) => {
  if (!open) return;
  track("tooltip_view", { component: "tooltip", trigger_id: triggerId, location });
};
export function TooltipDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(tooltipTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (tooltipTranslations as unknown as Record<
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
    componentSlug: "tooltip",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/overlay" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "tooltip",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "tooltip",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";`;

  // Segundo bloco da seção Importação: onde o Provider é montado. Ele vai UMA
  // vez, no topo da árvore que compartilha a espera — é ele que faz percorrer
  // uma barra de ícones parecer um movimento só, e sem ele cada balão espera
  // do zero.
  const codeImportProvider = `// Uma vez, no topo da árvore que compartilha a espera.
<TooltipProvider delay={400} timeout={300}>
  {/* \`timeout\`: janela em que o vizinho abre na hora, depois de um fechar. */}
  <App />
</TooltipProvider>`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline" size="icon" aria-label="Salvar">
      <Save aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Salvar</TooltipContent>
</Tooltip>`;

  const codeWithShortcut = `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline" size="icon" aria-label="Salvar">
      <Save aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    Salvar <kbd>Ctrl</kbd>+<kbd>S</kbd>
  </TooltipContent>
</Tooltip>`;

  const interfaceCode = `// TooltipProvider (base-ui/tooltip)
interface TooltipProviderProps {
  delay?: number; // default 0 (ms)
}

// Tooltip
interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// TooltipContent
interface TooltipContentProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────────

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  const labelSave = tContent("demonstration.labels.save");
  const labelDelete = tContent("demonstration.labels.delete");
  const labelShare = tContent("demonstration.labels.share");
  const labelSaveBtn = tContent("demonstration.labels.saveButton");
  const labelDeleteBtn = tContent("demonstration.labels.deleteButton");
  const labelShareBtn = tContent("demonstration.labels.shareButton");
  const labelLongBalloonDont = tContent("demonstration.labels.longBalloonDont");
  const labelShareHint = tContent("demonstration.labels.shareHint");
  const labelLcp = tContent("demonstration.labels.lcpLabel");
  const sideLabels: Record<"top" | "right" | "bottom" | "left", string> = {
    top: tContent("demonstration.labels.sideTop"),
    right: tContent("demonstration.labels.sideRight"),
    bottom: tContent("demonstration.labels.sideBottom"),
    left: tContent("demonstration.labels.sideLeft"),
  };
  const labelApiToken = tContent("demonstration.labels.apiTokenLabel");
  const labelApiTokenHelp = tContent("demonstration.labels.apiTokenHelp");
  const labelApiTokenHint = tContent("demonstration.labels.apiTokenHint");
  const labelLcpHelp = tContent("demonstration.labels.lcpHelp");
  const labelLcpHint = tContent("demonstration.labels.lcpHint");
  const labelLcpValue = tContent("demonstration.labels.lcpValue");

  // Snippets que mostram os MESMOS rótulos dos previews — texto de exemplo sai
  // de chave também aqui, senão o código publicado descreve outra tela.
  const codeLongText = `<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">${labelShareBtn}</Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    ${labelShareHint}
  </TooltipContent>
</Tooltip>`;

  const codeFormFieldHelp = `<div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs">
  <div className="nds-cluster" data-spacing="sm">
    <label htmlFor="api-token" className="nds-text-body nds-font-medium">${labelApiToken}</label>
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="outline" size="icon-sm" aria-label="${labelApiTokenHelp}">
            ?
          </Button>
        )}
      />
      <TooltipContent side="right" className="nds-max-w-xs">
        ${labelApiTokenHint}
      </TooltipContent>
    </Tooltip>
  </div>
  <input id="api-token" type="text" className="nds-input" placeholder="sk-..." />
</div>`;

  const codeMetricDescription = `<div className="nds-stack" data-spacing="xs">
  <div className="nds-cluster" data-spacing="sm">
    <p className="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">${labelLcp}</p>
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="outline" size="icon-sm" aria-label="${labelLcpHelp}">
            i
          </Button>
        )}
      />
      <TooltipContent side="top" className="nds-max-w-xs nds-whitespace-normal">
        ${labelLcpHint}
      </TooltipContent>
    </Tooltip>
  </div>
  <p className="nds-text-h3 nds-m-0">${labelLcpValue}</p>
</div>`;

  return (
    // 400 ms é o mesmo atraso que o snippet da Importação publica — a página
    // demonstra o Provider que ela ensina a montar.
    <TooltipProvider delay={400}>
      <DocsPageLayout
        navGroups={navGroups}
        activeSection={activeId}
        componentSlug="tooltip"
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
          {/* O MESMO exemplo do Playground da story — guideline 08 §15. Uma
              fonte, dois lugares: a página abre mostrando exatamente o que o
              Playground exercita. A barra de três ações que morava aqui virou a
              composição `actionBar`, que é o que ela sempre foi. */}
          <div
            className="nds-cluster nds-w-full nds-min-h-30"
            data-justify="center"
            data-align="center"
            data-spacing="lg"
            style={{ contain: "layout", position: "relative" }}
          >
            <Tooltip onOpenChange={rastrearTooltip("docs_demo", "save")}>
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                    <Save aria-hidden="true" />
                  </Button>
                )}
              />
              <TooltipContent>{labelSave}</TooltipContent>
            </Tooltip>
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
                element: tContent("usage.uxWriting.table.content.name"),
                rules: tContent("usage.uxWriting.table.content.format"),
                do: tContent("usage.uxWriting.table.content.good"),
                dont: tContent("usage.uxWriting.table.content.bad"),
              },
              {
                element: tContent("usage.uxWriting.table.shortcut.name"),
                rules: tContent("usage.uxWriting.table.shortcut.format"),
                do: tContent("usage.uxWriting.table.shortcut.good"),
                dont: tContent("usage.uxWriting.table.shortcut.bad"),
              },
              {
                element: tContent("usage.uxWriting.table.icon.name"),
                // A regra de formato cita <code>aria-label</code>, e a célula
                // escreve textNode — sem toPlainText a tag apareceria literal.
                rules: toPlainText(tContent("usage.uxWriting.table.icon.format")),
                do: tContent("usage.uxWriting.table.icon.good"),
                dont: tContent("usage.uxWriting.table.icon.bad"),
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
                <div
                  className="nds-cluster nds-w-full nds-min-h-20"
                  data-justify="center"
                  data-align="center"
                  style={{ contain: "layout" }}
                >
                  <Tooltip onOpenChange={rastrearTooltip("docs_do_dont", "pair1-do")}>
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                          <Save aria-hidden="true" />
                        </Button>
                      )}
                    />
                    <TooltipContent side="bottom">{labelSave}</TooltipContent>
                  </Tooltip>
                </div>
              ),
              dontPreview: (
                <div
                  className="nds-cluster nds-w-full nds-min-h-20"
                  data-justify="center"
                  data-align="center"
                  style={{ contain: "layout" }}
                >
                {/* Anti-padrão didático: o balão no lugar do rótulo. O
                    `aria-label` fica para o axe — sem ele o botão
                    icon-only não tem nome acessível e a docs page
                    reprova —, e a lição continua no CONTEÚDO do balão,
                    que só repete o rótulo em vez de acrescentar. */}
                  <Tooltip onOpenChange={rastrearTooltip("docs_do_dont", "pair1-dont")}>
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                          <Save aria-hidden="true" />
                        </Button>
                      )}
                    />
                    <TooltipContent side="bottom">{labelSaveBtn}</TooltipContent>
                  </Tooltip>
                </div>
              ),
              doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
              dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
            },
            {
              doLabel: tNav("common.do"),
              dontLabel: tNav("common.dont"),
              doPreview: (
                <div
                  className="nds-cluster nds-w-full nds-min-h-20"
                  data-justify="center"
                  data-align="center"
                  style={{ contain: "layout" }}
                >
                  <Tooltip onOpenChange={rastrearTooltip("docs_do_dont", "pair2-do")}>
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                          <Save aria-hidden="true" />
                        </Button>
                      )}
                    />
                    {/* Texto puro: o atalho entre parênteses já vem no rótulo.
                        O `<kbd>` é assunto da variante `withShortcut`. */}
                    <TooltipContent side="bottom">{labelSave}</TooltipContent>
                  </Tooltip>
                </div>
              ),
              dontPreview: (
                <div
                  className="nds-cluster nds-w-full nds-min-h-20"
                  data-justify="center"
                  data-align="center"
                  style={{ contain: "layout" }}
                >
                  {/* Vivo de propósito: a lição é o TAMANHO do balão, e só
                      renderizado ele mostra o que o texto longo faz. */}
                  <Tooltip onOpenChange={rastrearTooltip("docs_do_dont", "pair2-dont")}>
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                          <Save aria-hidden="true" />
                        </Button>
                      )}
                    />
                    
                    <TooltipContent side="bottom" className="nds-max-w-xs">
                      {labelLongBalloonDont}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ),
              doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
              dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
            },
          ]}
        />
        <DocsImport
          title={tContent("import.title")}
          code={codeImport}
          secondaryCode={codeImportProvider}
          componentSlug="tooltip"
        />

        {/* ── Variantes ─────────────────────────────────────────────── */}
        <DocsCompositions
          id="variantes"
          title={tContent("variants.title")}
          useWhenLabel={tNav("common.useWhen")}
          componentSlug="tooltip"
          items={[
            {
              trackId: "default",
              name: tContent("variants.items.default"),
              description: stripHtml(tContent("variants.styles.default")),
              code: codeDefault,
              preview: (
                <Tooltip onOpenChange={rastrearTooltip("docs_variantes", "default")}>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                        <Save aria-hidden="true" />
                      </Button>
                    )}
                  />
                  <TooltipContent>{labelSaveBtn}</TooltipContent>
                </Tooltip>
              ),
            },
            {
              trackId: "withShortcut",
              name: tContent("variants.items.withShortcut"),
              description: stripHtml(tContent("variants.styles.withShortcut")),
              code: codeWithShortcut,
              preview: (
                <Tooltip onOpenChange={rastrearTooltip("docs_variantes", "withShortcut")}>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                        <Save aria-hidden="true" />
                      </Button>
                    )}
                  />
                  <TooltipContent>
                    <span>{labelSaveBtn}</span>
                    <kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>
                    <kbd className="nds-kbd" data-slot="kbd">S</kbd>
                  </TooltipContent>
                </Tooltip>
              ),
            },
            {
              trackId: "longText",
              name: tContent("variants.items.longText"),
              description: stripHtml(tContent("variants.styles.longText")),
              code: codeLongText,
              preview: (
                <Tooltip onOpenChange={rastrearTooltip("docs_variantes", "longText")}>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="outline">
                        {labelShareBtn}
                      </Button>
                    )}
                  />
                  <TooltipContent side="bottom">{labelShareHint}</TooltipContent>
                </Tooltip>
              ),
            },
            {
              trackId: "positioningSides",
              name: tContent("variants.items.positioningSides.name"),
              description: tContent("variants.items.positioningSides.description"),
              useWhen: tContent("variants.items.positioningSides.use"),
              code: `const sideLabels = { top: "${sideLabels.top}", right: "${sideLabels.right}", bottom: "${sideLabels.bottom}", left: "${sideLabels.left}" };

<div className="nds-grid nds-w-full" data-cols="4" data-spacing="xl" style={{ placeItems: "center" }}>
  {(["top", "right", "bottom", "left"] as const).map((side) => (
    <Tooltip key={side}>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="outline">{sideLabels[side]}</Button>
        )}
      />
      <TooltipContent side={side}>Tooltip {sideLabels[side]}</TooltipContent>
    </Tooltip>
  ))}
</div>`,
              preview: (
                <div className="nds-grid nds-w-full nds-min-h-40" data-cols="4" data-spacing="xl" style={{ contain: "layout", placeItems: "center" }}>
                  {(["top", "right", "bottom", "left"] as const).map((side) => (
                    <Tooltip key={side} onOpenChange={rastrearTooltip("docs_variantes", `positioningSides-${side}`)}>
                      <TooltipTrigger
                        render={(props) => (
                          <Button {...props} variant="outline">
                            {sideLabels[side]}
                          </Button>
                        )}
                      />
                      <TooltipContent side={side}>Tooltip {sideLabels[side]}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ),
            },
          ]}
        />

        {/* ── Composições ───────────────────────────────────────────── */}
        <DocsCompositions
          title={tContent("variants.compositionsTitle")}
          useWhenLabel={tNav("common.useWhen")}
          componentSlug="tooltip"
          items={[
            {
              trackId: "iconButtonWithShortcut",
              name: tContent("variants.compositions.iconButtonWithShortcut.name"),
              description: tContent("variants.compositions.iconButtonWithShortcut.description"),
              useWhen: tContent("variants.compositions.iconButtonWithShortcut.use"),
              code: `<Tooltip>
  <TooltipTrigger
    render={(props) => (
      <Button {...props} variant="outline" size="icon" aria-label="Salvar">
        <Save aria-hidden="true" />
      </Button>
    )}
  />
  <TooltipContent side="bottom">
    <span>Salvar</span>
    <kbd>Ctrl</kbd>
    <kbd>S</kbd>
  </TooltipContent>
</Tooltip>`,
              preview: (
                <Tooltip onOpenChange={rastrearTooltip("docs_composicoes", "iconButtonWithShortcut")}>
                  <TooltipTrigger
                    render={(props) => (
                      <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                        <Save aria-hidden="true" />
                      </Button>
                    )}
                  />
                  <TooltipContent>
                    <span>{labelSaveBtn}</span>
                    <kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>
                    <kbd className="nds-kbd" data-slot="kbd">S</kbd>
                  </TooltipContent>
                </Tooltip>
              ),
            },
            {
              trackId: "actionBar",
              name: tContent("variants.compositions.actionBar.name"),
              description: tContent("variants.compositions.actionBar.description"),
              useWhen: tContent("variants.compositions.actionBar.use"),
              code: `<TooltipProvider delay={400} skipDelay={200}>
  <div className="nds-cluster" data-spacing="lg">
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <Button {...props} variant="outline" size="icon" aria-label="Salvar">
            <Save aria-hidden="true" />
          </Button>
        )}
      />
      <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
    </Tooltip>
    {/* … um Tooltip por ação, cada botão com o seu aria-label */}
  </div>
</TooltipProvider>`,
              preview: (
                <div className="nds-cluster" data-justify="center" data-align="center" data-spacing="lg">
                  <Tooltip onOpenChange={rastrearTooltip("docs_composicoes", "actionBar-save")}>
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} variant="outline" size="icon" aria-label={labelSaveBtn}>
                          <Save aria-hidden="true" />
                        </Button>
                      )}
                    />
                    <TooltipContent>{labelSave}</TooltipContent>
                  </Tooltip>
                  <Tooltip onOpenChange={rastrearTooltip("docs_composicoes", "actionBar-delete")}>
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} variant="outline" size="icon" aria-label={labelDeleteBtn}>
                          <Trash2 aria-hidden="true" />
                        </Button>
                      )}
                    />
                    <TooltipContent>{labelDelete}</TooltipContent>
                  </Tooltip>
                  <Tooltip onOpenChange={rastrearTooltip("docs_composicoes", "actionBar-share")}>
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} variant="outline" size="icon" aria-label={labelShareBtn}>
                          <Share2 aria-hidden="true" />
                        </Button>
                      )}
                    />
                    <TooltipContent>{labelShare}</TooltipContent>
                  </Tooltip>
                </div>
              ),
            },
            {
              trackId: "formFieldHelp",
              name: tContent("variants.compositions.formFieldHelp.name"),
              description: tContent("variants.compositions.formFieldHelp.description"),
              useWhen: tContent("variants.compositions.formFieldHelp.use"),
              code: codeFormFieldHelp,
              preview: (
                <div className="nds-stack nds-w-full nds-max-w-sm" data-spacing="xs" style={{ alignItems: "flex-start" }}>
                  <div className="nds-cluster" data-spacing="sm">
                    <label htmlFor="api-token-react-comp" className="nds-text-body nds-font-medium">
                      {labelApiToken}
                    </label>
                    <Tooltip onOpenChange={rastrearTooltip("docs_composicoes", "formFieldHelp")}>
                      <TooltipTrigger
                        render={(props) => (
                          <Button
                            {...props}
                            variant="outline"
                            size="icon-sm"
                            aria-label={labelApiTokenHelp}
                          >
                            ?
                          </Button>
                        )}
                      />
                      <TooltipContent side="right" className="nds-max-w-xs">
                        {labelApiTokenHint}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    id="api-token-react-comp"
                    type="text"
                    className="nds-input"
                    placeholder="sk-..."
                  />
                </div>
              ),
            },
            {
              trackId: "metricDescription",
              name: tContent("variants.compositions.metricDescription.name"),
              description: tContent("variants.compositions.metricDescription.description"),
              useWhen: tContent("variants.compositions.metricDescription.use"),
              code: codeMetricDescription,
              preview: (
                <div className="nds-stack" data-spacing="xs" style={{ alignItems: 'flex-start' }}>
                  <div className="nds-cluster" data-spacing="sm">
                    <p className="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">{labelLcp}</p>
                    <Tooltip onOpenChange={rastrearTooltip("docs_composicoes", "metricDescription")}>
                      <TooltipTrigger
                        render={(props) => (
                          <Button
                            {...props}
                            variant="outline"
                            size="icon-sm"
                            aria-label={labelLcpHelp}
                          >
                            i
                          </Button>
                        )}
                      />
                      <TooltipContent side="top" className="nds-max-w-xs nds-whitespace-normal">
                        {labelLcpHint}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="nds-text-h3 nds-m-0">{labelLcpValue}</p>
                </div>
              ),
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
          items={[
            {
              label: tContent("states.closed.label"),
              trigger: toPlainText(tContent("states.closed.trigger")),
              behavior: toPlainText(tContent("states.closed.behavior")),
            },
            {
              label: tContent("states.open.label"),
              trigger: toPlainText(tContent("states.open.trigger")),
              behavior: toPlainText(tContent("states.open.behavior")),
            },
            {
              label: tContent("states.hover.label"),
              trigger: toPlainText(tContent("states.hover.trigger")),
              behavior: toPlainText(tContent("states.hover.behavior")),
            },
            {
              label: tContent("states.focus.label"),
              trigger: toPlainText(tContent("states.focus.trigger")),
              behavior: toPlainText(tContent("states.focus.behavior")),
            },
            {
              label: tContent("states.delayed.label"),
              trigger: toPlainText(tContent("states.delayed.trigger")),
              behavior: toPlainText(tContent("states.delayed.behavior")),
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
                  name: "delay",
                  type: tContent("props.table.delay.type"),
                  defaultValue: tContent("props.table.delay.default"),
                  required: tContent("props.table.delay.required"),
                  description: toPlainText(tContent("props.table.delay.description")),
                },
                {
                  name: "open",
                  type: tContent("props.table.open.type"),
                  defaultValue: tContent("props.table.open.default"),
                  required: tContent("props.table.open.required"),
                  description: toPlainText(tContent("props.table.open.description")),
                },
                {
                  name: "defaultOpen",
                  type: tContent("props.table.defaultOpen.type"),
                  defaultValue: tContent("props.table.defaultOpen.default"),
                  required: tContent("props.table.defaultOpen.required"),
                  description: toPlainText(tContent("props.table.defaultOpen.description")),
                },
                {
                  name: "onOpenChange",
                  type: tContent("props.table.onOpenChange.type"),
                  defaultValue: tContent("props.table.onOpenChange.default"),
                  required: tContent("props.table.onOpenChange.required"),
                  description: toPlainText(tContent("props.table.onOpenChange.description")),
                },
                {
                  name: "side",
                  type: tContent("props.table.side.type"),
                  defaultValue: tContent("props.table.side.default"),
                  required: tContent("props.table.side.required"),
                  description: toPlainText(tContent("props.table.side.description")),
                },
                {
                  name: "align",
                  type: tContent("props.table.align.type"),
                  defaultValue: tContent("props.table.align.default"),
                  required: tContent("props.table.align.required"),
                  description: toPlainText(tContent("props.table.align.description")),
                },
                {
                  name: "sideOffset",
                  type: tContent("props.table.sideOffset.type"),
                  defaultValue: tContent("props.table.sideOffset.default"),
                  required: tContent("props.table.sideOffset.required"),
                  description: toPlainText(tContent("props.table.sideOffset.description")),
                },
                {
                  name: "className",
                  type: tContent("props.table.className.type"),
                  defaultValue: tContent("props.table.className.default"),
                  required: tContent("props.table.className.required"),
                  description: toPlainText(tContent("props.table.className.description")),
                },
              ],
            },
          ]}
          interfaceCode={interfaceCode}
          extensibilityTitle={tContent("props.extensibilityTitle")}
          // `extensibilityCode` e não `extensibilityNotes`: a fenda de notas
          // passa por `DOMPurify.sanitize()` + `innerHTML`, onde
          // `<TooltipProvider>` e `<Button>` são tags desconhecidas e somem,
          // e as quebras de linha colapsam. Snippet vai para o CodeBlock.
          extensibilityCode={tContent("props.extensibilityCode")}
        />

        {/* ── Tokens ────────────────────────────────────────────────── */}
        <DocsTokens
          title={tContent("tokens.title")}
          cols={{
            token: tContent("tokens.table.token"),
            value: tContent("tokens.table.class"),
            description: tContent("tokens.table.part"),
          }}
          // Os tokens são os que a folha compartilhada realmente usa
          // (docs/shared/styles/nds/tooltip.css). A tabela documentava
          // --foreground/--background/--radius, que o Tooltip não toca.
          items={[
            {
              token: "--primary",
              value: tContent("tokens.table.foreground.class"),
              description: tContent("tokens.table.foreground.part"),
            },
            {
              token: "--primary-foreground",
              value: tContent("tokens.table.background.class"),
              description: tContent("tokens.table.background.part"),
            },
            {
              token: "--primary",
              value: tContent("tokens.table.fill.class"),
              description: tContent("tokens.table.fill.part"),
            },
            {
              token: "--radius-sm",
              value: tContent("tokens.table.radius.class"),
              description: tContent("tokens.table.radius.part"),
            },
            {
              token: "--z-tooltip",
              value: tContent("tokens.table.zIndex.class"),
              description: tContent("tokens.table.zIndex.part"),
            },
          ]}
          customizationTitle={tContent("tokens.customizationTitle")}
          customizationCode={tContent("tokens.customizationCode")}
        />

        {/* ── Acessibilidade ────────────────────────────────────────── */}
        <DocsAccessibility
          screenReaderTitle={tNav("common.screenReader")}
          screenReaderItems={screenReaderItems}
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
            { key: "Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
            { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
            { key: "Shift+Tab", description: toPlainText(tContent("accessibility.keyboard.shiftTab")) },
          ]}
        />

        {/* ── Relacionados ──────────────────────────────────────────── */}
        <DocsRelated
          title={tContent("related.title")}
          componentSlug="tooltip"
          items={[
            {
              name: tContent("related.items.popover.name"),
              description: toPlainText(tContent("related.items.popover.description")),
              path: "?path=/docs/components-overlay-popover--docs",
            },
            {
              name: tContent("related.items.hoverCard.name"),
              description: toPlainText(tContent("related.items.hoverCard.description")),
              path: "?path=/docs/components-overlay-hovercard--docs",
            },
            {
              name: tContent("related.items.button.name"),
              description: toPlainText(tContent("related.items.button.description")),
              path: "?path=/docs/components-form-button--docs",
            },
          ]}
        />

        {/* ── Notas ─────────────────────────────────────────────────── */}
        <DocsNotes
          title={tContent("notes.title")}
          componentSlug="tooltip"
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
          cols={analyticsCols}
          items={[
            {
              event: "tooltip_view",
              trigger: toPlainText(tContent("analytics.table.tooltip_view.trigger")),
              payload: DOMPurify.sanitize(tContent("analytics.table.tooltip_view.payload")),
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
                priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.medium"),
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
              { criterion: tContent("testes.accessibility.item2"), level: "1.4.3", how: "Contrast checker" },
              { criterion: tContent("testes.accessibility.item3"), level: "4.1.2", how: "DevTools a11y tree" },
              { criterion: tContent("testes.accessibility.item4"), level: "4.1.2", how: "DevTools a11y tree" },
              { criterion: tContent("testes.accessibility.item5"), level: "1.1.1", how: "Manual review" },
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
              { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.medium") },
              { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.medium") },
            ],
          }}
        />
      </DocsPageLayout>
    </TooltipProvider>
  );
}

export default TooltipDocs;
