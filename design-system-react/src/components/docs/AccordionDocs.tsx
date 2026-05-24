import { useCallback, useEffect, useMemo } from "react";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import accordionTranslations from "@shared/content/accordion/translations.json";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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
      { id: "modos",        label: t("nav.variants") },
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


export function AccordionDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(accordionTranslations);

  // Override stack-específico: @base-ui usa `multiple` (boolean), não `type` ("single"|"multiple").
  const rootItemsOverride = useMemo(() => {
    const desc = {
      "pt-BR": "Permite múltiplos itens abertos simultaneamente.",
      en: "Allows multiple items to be open simultaneously.",
      es: "Permite múltiples ítems abiertos simultáneamente.",
    } as const;
    const requiredLabel = locale === "pt-BR" ? "Não" : "No";
    const original = (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>>)[locale]?.props?.accordion?.items ?? {};
    return Object.entries(original).map(([key, v]) => {
      if (key === "type") {
        return {
          name: "multiple",
          type: "boolean",
          defaultValue: "false",
          required: requiredLabel,
          description: desc[locale as keyof typeof desc] ?? desc["pt-BR"],
        };
      }
      return {
        name: v.name,
        type: v.type,
        defaultValue: v.default,
        required: v.required,
        description: stripHtml(v.description),
      };
    }).filter((row) => row.name !== "collapsible");
  }, [locale]);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "accordion",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "accordion",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "accordion",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const handleDemoTriggerClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, label: string) => {
      const isOpening = e.currentTarget.getAttribute("data-state") === "closed";
      track(isOpening ? "accordion_expand" : "accordion_collapse", {
        component: "accordion",
        label,
        location: "docs_demonstration",
      });
    },
    []
  );

  const codeImport = `import {\n  Accordion,\n  AccordionContent,\n  AccordionItem,\n  AccordionTrigger,\n} from "@/components/ui/accordion"`;

  const codeSingle = `<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha".
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
    <AccordionContent>
      Aceitamos cartão de crédito, Pix e boleto bancário.
    </AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeMultiple = `<Accordion multiple>
  <AccordionItem value="especificacoes">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>Conteúdo das especificações.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="compatibilidade">
    <AccordionTrigger>Compatibilidade</AccordionTrigger>
    <AccordionContent>Informações de compatibilidade.</AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeControlled = `const [value, setValue] = useState<string[]>(["item-1"])

<Accordion value={value} onValueChange={setValue}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Item controlado</AccordionTrigger>
    <AccordionContent>Conteúdo controlado externamente.</AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeDefaultOpen = `<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
    <AccordionContent>Este item inicia expandido.</AccordionContent>
  </AccordionItem>
</Accordion>`;

  const codeCustomization = `/* Em globals.css — customizações do Accordion */
:root {
  --border: 214 32% 91%;
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}`;

  const interfaceCode = `// Accordion (root) — base-ui
interface AccordionRootProps {
  multiple?: boolean;                              // default: false (single)
  defaultValue?: (string | number)[];              // sempre array
  value?: (string | number)[];                     // sempre array (controlado)
  onValueChange?: (value: (string | number)[]) => void;
  disabled?: boolean;
  className?: string;
}

// AccordionItem
interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;         // obrigatório
  disabled?: boolean;
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
          installNote="npx shadcn@latest add accordion"
        />
      }
    >
          {/* ── Demonstração ──────────────────────────────────────────── */}
          <DocsDemonstration title={tContent("demonstration.title")}>
            <Accordion defaultValue={["item-1"]} className="w-full">
              {([1, 2, 3, 4] as const).map((i) => {
                const label = tContent(`demonstration.labels.q${i}`);
                return (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger
                    onClick={(e) => handleDemoTriggerClick(e, label)}
                  >
                    {label}
                  </AccordionTrigger>
                  <AccordionContent>
                    {tContent(`demonstration.labels.a${i}`)}
                  </AccordionContent>
                </AccordionItem>
                );
              })}
            </Accordion>
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
              items: [1, 2, 3, 4, 5].map((i) => tContent(`usage.guidelines.item${i}`)),
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
                  element: tContent("usage.uxWriting.table.triggerDoc.name"),
                  rules: tContent("usage.uxWriting.table.triggerDoc.format"),
                  do: tContent("usage.uxWriting.table.triggerDoc.good"),
                  dont: tContent("usage.uxWriting.table.triggerDoc.bad"),
                },
                {
                  element: tContent("usage.uxWriting.table.content.name"),
                  rules: tContent("usage.uxWriting.table.content.format"),
                  do: tContent("usage.uxWriting.table.content.good"),
                  dont: tContent("usage.uxWriting.table.content.bad"),
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
            title={tContent("doDont.title") || "Do & Don't"}
            pairs={[
              {
                doLabel: tNav("common.do"),
                dontLabel: tNav("common.dont"),
                doPreview: (
                  <Accordion className="w-full">
                    <AccordionItem value="do-1">
                      <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
                      <AccordionContent>Clique em "Esqueci minha senha" na tela de login.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
                dontPreview: (
                  <Accordion className="w-full">
                    <AccordionItem value="dont-1">
                      <AccordionTrigger>Senha</AccordionTrigger>
                      <AccordionContent>Ver mais informações.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
                doCaption: tContent("doDont.pair1.do"),
                dontCaption: tContent("doDont.pair1.dont"),
              },
              {
                doLabel: tNav("common.do"),
                dontLabel: tNav("common.dont"),
                doPreview: (
                  <Accordion multiple className="w-full">
                    <AccordionItem value="spec">
                      <AccordionTrigger>Especificações técnicas</AccordionTrigger>
                      <AccordionContent>CPU: Intel i7, RAM: 16GB</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="compat">
                      <AccordionTrigger>Compatibilidade</AccordionTrigger>
                      <AccordionContent>Windows 11, macOS 14+</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
                dontPreview: (
                  <Accordion className="w-full">
                    <AccordionItem value="single-only">
                      <AccordionTrigger>Mostrar informações</AccordionTrigger>
                      <AccordionContent>Use Collapsible para uma única seção.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
                doCaption: tContent("doDont.pair2.do"),
                dontCaption: tContent("doDont.pair2.dont"),
              },
            ]}
          />

          {/* ── Importação ────────────────────────────────────────────── */}
          <DocsImport
            title={tContent("import.title")}
            description={tContent("import.note")}
            code={codeImport}
          />

          {/* ── Modos de Operação ─────────────────────────────────────── */}
          <DocsVariants
            id="modos"
            title={tContent("variants.title")}
            items={[
              {
                name: "single",
                description: stripHtml(tContent("variants.single.description")),
                code: codeSingle,
                preview: (
                  <Accordion defaultValue={["item-1"]} className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>{tContent("demonstration.labels.q1")}</AccordionTrigger>
                      <AccordionContent>{tContent("demonstration.labels.a1")}</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>{tContent("demonstration.labels.q2")}</AccordionTrigger>
                      <AccordionContent>{tContent("demonstration.labels.a2")}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
              {
                name: "multiple",
                description: stripHtml(tContent("variants.multiple.description")),
                code: codeMultiple,
                preview: (
                  <Accordion multiple className="w-full">
                    <AccordionItem value="spec">
                      <AccordionTrigger>Especificações técnicas</AccordionTrigger>
                      <AccordionContent>CPU: Intel i7, RAM: 16GB, SSD: 512GB</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="compat">
                      <AccordionTrigger>Compatibilidade</AccordionTrigger>
                      <AccordionContent>Windows 11, macOS 14+, Ubuntu 22.04</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
              {
                name: "controlled",
                description: stripHtml(tContent("variants.controlled.description")),
                code: codeControlled,
                preview: (
                  <Accordion defaultValue={["item-1"]} className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Item controlado</AccordionTrigger>
                      <AccordionContent>Estado gerenciado via value + onValueChange.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
              {
                name: "defaultOpen",
                description: stripHtml(tContent("variants.defaultOpen.description")),
                code: codeDefaultOpen,
                preview: (
                  <Accordion defaultValue={["item-1"]} className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
                      <AccordionContent>Este item inicia expandido via defaultValue.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Item fechado por padrão</AccordionTrigger>
                      <AccordionContent>Este item inicia colapsado.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
            ]}
          />

          {/* ── Composições ───────────────────────────────────────────── */}
          <DocsCompositions
            title={tContent("variants.compositionsTitle")}
            useWhenLabel={tNav("common.useWhen")}
            componentSlug="accordion"
            items={[
              {
                name: tContent("variants.compositions.iconTrigger.name"),
                description: tContent("variants.compositions.iconTrigger.description"),
                useWhen: tContent("variants.compositions.iconTrigger.use"),
                code: `<Accordion type="single" collapsible className="w-full max-w-lg">
  <AccordionItem value="info">
    <AccordionTrigger>
      <span className="flex items-center gap-2">
        <Info aria-hidden="true" className="h-4 w-4" />
        Informação
      </span>
    </AccordionTrigger>
    <AccordionContent>Ícones facilitam a identificação rápida do tipo de conteúdo.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="warning">
    <AccordionTrigger>
      <span className="flex items-center gap-2">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
        Aviso
      </span>
    </AccordionTrigger>
    <AccordionContent>Sinalize categorias distintas com ícones semânticos.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="success">
    <AccordionTrigger>
      <span className="flex items-center gap-2">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        Confirmação
      </span>
    </AccordionTrigger>
    <AccordionContent>Use ícones consistentes entre itens do mesmo accordion.</AccordionContent>
  </AccordionItem>
</Accordion>`,
                preview: (
                  <Accordion className="w-full max-w-lg">
                    <AccordionItem value="info">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <Info aria-hidden="true" className="h-4 w-4" />
                          Informação
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>Ícones facilitam a identificação rápida do tipo de conteúdo.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="warning">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                          Aviso
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>Sinalize categorias distintas com ícones semânticos.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="success">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                          Confirmação
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>Use ícones consistentes entre itens do mesmo accordion.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
              {
                name: tContent("variants.compositions.badgeTrigger.name"),
                description: tContent("variants.compositions.badgeTrigger.description"),
                useWhen: tContent("variants.compositions.badgeTrigger.use"),
                code: `<Accordion type="single" collapsible className="w-full max-w-lg">
  <AccordionItem value="novo">
    <AccordionTrigger>
      <span className="flex items-center gap-2">
        Novidades da versão 3.0
        <Badge variant="default" className="text-[10px] h-4">Novo</Badge>
      </span>
    </AccordionTrigger>
    <AccordionContent>Confira o que mudou nesta release.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="beta">
    <AccordionTrigger>
      <span className="flex items-center gap-2">
        Funcionalidades em beta
        <Badge variant="secondary" className="text-[10px] h-4">Beta</Badge>
      </span>
    </AccordionTrigger>
    <AccordionContent>Recursos em testes — sujeitos a mudanças.</AccordionContent>
  </AccordionItem>
</Accordion>`,
                preview: (
                  <Accordion className="w-full max-w-lg">
                    <AccordionItem value="novo">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          Novidades da versão 3.0
                          <Badge variant="default" className="text-[10px] h-4">Novo</Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>Confira o que mudou nesta release.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="beta">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          Funcionalidades em beta
                          <Badge variant="secondary" className="text-[10px] h-4">Beta</Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>Recursos em testes — sujeitos a mudanças.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
              {
                name: tContent("variants.compositions.richContent.name"),
                description: tContent("variants.compositions.richContent.description"),
                useWhen: tContent("variants.compositions.richContent.use"),
                code: `<Accordion type="multiple" className="w-full max-w-lg">
  <AccordionItem value="layout">
    <AccordionTrigger>Layout e Espaçamento</AccordionTrigger>
    <AccordionContent>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="font-medium">Propriedade</div>
        <div className="font-medium">Valor</div>
        <div>Gutter</div><div>24px</div>
        <div>Margem mobile</div><div>16px</div>
        <div>Colunas</div><div>12</div>
      </div>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="tipografia">
    <AccordionTrigger>Tipografia</AccordionTrigger>
    <AccordionContent>
      <ul className="list-disc pl-5 text-sm space-y-1">
        <li>text-xs — 12px</li>
        <li>text-sm — 14px</li>
        <li>text-base — 16px</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
                preview: (
                  <Accordion multiple className="w-full max-w-lg">
                    <AccordionItem value="layout">
                      <AccordionTrigger>Layout e Espaçamento</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Propriedade</div>
                          <div className="font-medium">Valor</div>
                          <div>Gutter</div><div>24px</div>
                          <div>Margem mobile</div><div>16px</div>
                          <div>Colunas</div><div>12</div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="tipografia">
                      <AccordionTrigger>Tipografia</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          <li>text-xs — 12px</li>
                          <li>text-sm — 14px</li>
                          <li>text-base — 16px</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
              {
                name: tContent("variants.compositions.faq.name"),
                description: tContent("variants.compositions.faq.description"),
                useWhen: tContent("variants.compositions.faq.use"),
                code: `<h2 className="text-base font-semibold">Perguntas frequentes</h2>
<Accordion type="single" collapsible className="w-full max-w-lg">
  <AccordionItem value="senha">
    <AccordionTrigger>Como redefinir minha senha?</AccordionTrigger>
    <AccordionContent>Acesse a tela de login e clique em "Esqueci minha senha".</AccordionContent>
  </AccordionItem>
  <AccordionItem value="pagamento">
    <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
    <AccordionContent>Cartão de crédito, Pix e boleto bancário.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="cancelamento">
    <AccordionTrigger>Como cancelar minha assinatura?</AccordionTrigger>
    <AccordionContent>Acesse Configurações > Assinatura > Cancelar.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="dados">
    <AccordionTrigger>Como excluir meus dados?</AccordionTrigger>
    <AccordionContent>Envie uma solicitação para privacidade@empresa.com.</AccordionContent>
  </AccordionItem>
</Accordion>`,
                preview: (
                  <div className="space-y-3 w-full max-w-lg">
                    <h2 className="text-base font-semibold">Perguntas frequentes</h2>
                    <Accordion className="w-full max-w-lg">
                      <AccordionItem value="senha">
                        <AccordionTrigger>Como redefinir minha senha?</AccordionTrigger>
                        <AccordionContent>Acesse a tela de login e clique em "Esqueci minha senha".</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="pagamento">
                        <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
                        <AccordionContent>Cartão de crédito, Pix e boleto bancário.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="cancelamento">
                        <AccordionTrigger>Como cancelar minha assinatura?</AccordionTrigger>
                        <AccordionContent>Acesse Configurações &gt; Assinatura &gt; Cancelar.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="dados">
                        <AccordionTrigger>Como excluir meus dados?</AccordionTrigger>
                        <AccordionContent>Envie uma solicitação para privacidade@empresa.com.</AccordionContent>
                      </AccordionItem>
                    </Accordion>
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
              trigger: tContent("states.cols.trigger"),
              behavior: tContent("states.cols.behavior"),
            }}
            items={[
              {
                label: tContent("states.closed.label"),
                trigger: "—",
                behavior: tContent("states.closed.description"),
              },
              {
                label: tContent("states.open.label"),
                trigger: "Click / Enter / Space",
                behavior: tContent("states.open.description"),
              },
              {
                label: tContent("states.disabled.label"),
                trigger: "—",
                behavior: stripHtml(tContent("states.disabled.description")),
              },
              {
                label: tContent("states.focused.label"),
                trigger: "Tab",
                behavior: tContent("states.focused.description"),
              },
            ]}
          />

          {/* ── Propriedades ──────────────────────────────────────────── */}
          <DocsProps
            title={tContent("props.title")}
            tables={[
              {
                title: tContent("props.accordion.title"),
                cols: {
                  prop: tContent("props.accordion.prop"),
                  type: tContent("props.accordion.type"),
                  default: tContent("props.accordion.default"),
                  required: tContent("props.accordion.required"),
                  description: tContent("props.accordion.description"),
                },
                items: rootItemsOverride,
              },
              {
                title: tContent("props.item.title"),
                cols: {
                  prop: tContent("props.accordion.prop"),
                  type: tContent("props.accordion.type"),
                  default: tContent("props.accordion.default"),
                  required: tContent("props.accordion.required"),
                  description: tContent("props.accordion.description"),
                },
                items: Object.entries(
                  (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>>)[locale]?.props?.item?.items ?? {}
                ).map(([, v]) => ({
                  name: v.name,
                  type: v.type,
                  defaultValue: v.default,
                  required: v.required,
                  description: stripHtml(v.description),
                })),
              },
              {
                title: tContent("props.trigger.title"),
                cols: {
                  prop: tContent("props.accordion.prop"),
                  type: tContent("props.accordion.type"),
                  default: tContent("props.accordion.default"),
                  required: tContent("props.accordion.required"),
                  description: tContent("props.accordion.description"),
                },
                items: Object.entries(
                  (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>>)[locale]?.props?.trigger?.items ?? {}
                ).map(([, v]) => ({
                  name: v.name,
                  type: v.type,
                  defaultValue: v.default,
                  required: v.required,
                  description: stripHtml(v.description),
                })),
              },
              {
                title: tContent("props.content.title"),
                cols: {
                  prop: tContent("props.accordion.prop"),
                  type: tContent("props.accordion.type"),
                  default: tContent("props.accordion.default"),
                  required: tContent("props.accordion.required"),
                  description: tContent("props.accordion.description"),
                },
                items: Object.entries(
                  (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>>)[locale]?.props?.content?.items ?? {}
                ).map(([, v]) => ({
                  name: v.name,
                  type: v.type,
                  defaultValue: v.default,
                  required: v.required,
                  description: stripHtml(v.description),
                })),
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
            items={Object.entries(
              (accordionTranslations as unknown as Record<string, Record<string, Record<string, Record<string, { token: string; class: string; part: string }>>>>)[locale]?.tokens?.items ?? {}
            ).map(([, v]) => ({
              token: v.token,
              value: v.class,
              description: v.part,
            }))}
            customizationTitle={tContent("tokens.customizationTitle")}
            customizationCode={codeCustomization}
          />

          {/* ── Acessibilidade ────────────────────────────────────────── */}
          <DocsAccessibility
            title={tContent("accessibility.title")}
            summary={tContent("accessibility.summary")}
            items={[
              tContent("accessibility.aria.ariaExpanded"),
              tContent("accessibility.aria.ariaControls"),
              tContent("accessibility.aria.role"),
              tContent("accessibility.aria.ariaLabelledBy"),
            ]}
            keyboardTitle={tContent("accessibility.keyboardTitle")}
            keyboardItems={[
              { key: "Tab",        description: tContent("accessibility.keyboard.tab") },
              { key: "Shift+Tab",  description: tContent("accessibility.keyboard.shiftTab") },
              { key: "Enter",      description: tContent("accessibility.keyboard.enter") },
              { key: "Space",      description: tContent("accessibility.keyboard.space") },
              { key: "Arrow Down", description: tContent("accessibility.keyboard.arrowDown") },
              { key: "Arrow Up",   description: tContent("accessibility.keyboard.arrowUp") },
            ]}
          />

          {/* ── Relacionados ──────────────────────────────────────────── */}
          <DocsRelated
            title={tContent("related.title")}
            items={[
              {
                name: "Collapsible",
                description: stripHtml(tContent("related.collapsible.description")),
                path: "?path=/docs/ui-collapsible--docs",
              },
              {
                name: "Tabs",
                description: tContent("related.tabs.description"),
                path: "?path=/docs/ui-tabs--docs",
              },
              {
                name: "Sidebar",
                description: tContent("related.sidebar.description"),
                path: "?path=/docs/ui-sidebar--docs",
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
              { title: "", content: tContent("notes.item5") },
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
                event: tContent("analytics.events.expand.event"),
                trigger: tContent("analytics.events.expand.trigger"),
                payload: tContent("analytics.events.expand.payload"),
              },
              {
                event: tContent("analytics.events.collapse.event"),
                trigger: tContent("analytics.events.collapse.trigger"),
                payload: tContent("analytics.events.collapse.payload"),
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
                criterion: stripHtml(tContent(`testes.accessibility.item${i}.criterion`)),
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
