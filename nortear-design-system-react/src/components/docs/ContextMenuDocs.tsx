import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import contextMenuTranslations from "@shared/content/context-menu/translations.json";
import { AREA_CLICK_DIREITO } from "@shared/primitives/context-menu-area";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: "common.high",
  medium: "common.medium",
  low: "common.low",
};

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
 * compartilhado ganha um item e ele simplesmente não existe para quem lê — sem
 * erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o nono
 * critério de acessibilidade deste componente, o do item desabilitado que
 * continua no percurso do teclado.
 *
 * Trocar 8 por 9 não resolveria: o total cravado É o defeito, e ele volta no
 * item seguinte.
 */
function stringsFromDict(
  t: (key: string, defaultValue?: string) => string,
  base: string,
  prefix = "item",
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = t(`${base}.${prefix}${i}`, "");
    if (!value) break;
    out.push(value);
  }
  return out;
}

/**
 * A mesma varredura para a lista cujo item é um OBJETO — cenário, critério
 * funcional, story de regressão visual. O primeiro campo é quem decide se o
 * item existe, e os demais acompanham.
 */
function entriesFromDict<K extends string>(
  t: (key: string, defaultValue?: string) => string,
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!t(`${base}.item${i}.${fields[0]}`, "")) break;
    out.push(
      Object.fromEntries(
        fields.map((field) => [field, t(`${base}.item${i}.${field}`, "")]),
      ) as Record<K, string>,
    );
  }
  return out;
}

/**
 * Nível WCAG e ferramenta de cada critério de acessibilidade, por índice.
 * Ficam aqui, e não no conteúdo compartilhado, porque são IDENTIFICADORES
 * (número de critério, nome do verificador) e identificador não se traduz.
 * Item novo que chegue além da lista cai no par padrão em vez de sumir.
 */
const A11Y_TEST_LEVELS = ["AA", "AA", "AA", "AA", "AA", "AA", "AA", "AA 1.4.3", "AA"];
const A11Y_TEST_HOW = [
  "axe-core",
  "getByRole('menu')",
  "getAllByRole('menuitem')",
  "getByRole('menuitemcheckbox')",
  "getByRole('menuitemradio')",
  "aria-disabled",
  "keyboard: Escape",
  "Colour Contrast Analyser",
  "keyboard: ArrowDown",
];

// A moldura tracejada é o único sinal de "clique com o botão direito aqui", e a
// mesma classe vale nas stories e nas cinco docs pages. `nds-border-default` traz
// largura e cor; `nds-border-dashed` só troca `border-style` — as duas juntas, ou
// a moldura sai sólida.
//
// O que era `style` inline (altura de 120px, largura máxima e `border-style`)
// virou classe: altura cravada num bloco de texto não cresce com a fonte do
// navegador (WCAG 1.4.4), e o `nds-p-8` entrega o mesmo quadro sem cravá-la.
// `user-select: none` já vem de `.nds-context-menu-trigger`.
const triggerAreaClass = AREA_CLICK_DIREITO;

// A MESMA área, sem a dica visual: mesmo tamanho, mesmo recheio, mesmo texto
// atenuado — só sem moldura e sem cursor. É o lado do "evite" do par 3, e ela
// existe porque a legenda daquele par contrapõe área COM dica e área SEM. Com o
// tracejado dos dois lados só o rótulo mudava, e o par não ilustrava nada.
// Vanilla é a referência: `makePlainArea` em `ContextMenuDocs.ts`.
const plainAreaClass =
  "nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground";

// ─── Nav ──────────────────────────────────────────────────────────────────────

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

// ─── Demo Components ──────────────────────────────────────────────────────────

function DemonstracaoPreview({ tContent }: { tContent: (key: string) => string }) {
  // O `label` do payload é IDENTIFICADOR, nunca o rótulo traduzido: texto
  // localizado partiria o mesmo evento em um valor por idioma no GA4 —
  // "Editar", "Edit" e "Editar" chegariam como três ações diferentes.
  const trackItemClick = (label: string) => () =>
    track("menu_item_click", {
      label,
      menu: "demo",
      location: "docs_demo",
    });

  return (
    <ContextMenu
      onOpenChange={(open) =>
        open &&
        track("menu_open", {
          component: "context_menu",
          menu: "demo",
          location: "docs_demo",
        })
      }
    >
      <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
        {tContent("demonstration.labels.triggerLabel")}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem onClick={trackItemClick("edit")}>
            {tContent("demonstration.labels.edit")}
            <ContextMenuShortcut>{tContent("demonstration.labels.editShortcut")}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={trackItemClick("duplicate")}>
            {tContent("demonstration.labels.duplicate")}
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{tContent("demonstration.labels.share")}</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={trackItemClick("share-email")}>
                {tContent("demonstration.labels.shareEmail")}
              </ContextMenuItem>
              <ContextMenuItem onClick={trackItemClick("share-link")}>
                {tContent("demonstration.labels.shareLink")}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={trackItemClick("delete")}>
          {tContent("demonstration.labels.delete")}
          <ContextMenuShortcut>{tContent("demonstration.labels.deleteShortcut")}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function CheckboxDemo({ tContent }: { tContent: (key: string) => string }) {
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);

  return (
    <ContextMenu>
      <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
        {tContent("demonstration.labels.triggerLabel")}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
            Mostrar grade
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
            Mostrar réguas
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function RadioDemo({ tContent }: { tContent: (key: string) => string }) {
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
      <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
        {tContent("demonstration.labels.triggerLabel")}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
            <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ContextMenuDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(contextMenuTranslations);

  // A prioridade chega do conteúdo como identificador ("high", "medium"); quem
  // a traduz é o dicionário de navegação. Item novo sem prioridade declarada cai
  // no par padrão em vez de imprimir a chave crua.
  const priorityLabel = useCallback(
    (raw: string) => tNav(priorityKeyMap[raw] ?? "common.high"),
    [tNav],
  );

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = useMemo(
    () =>
      Object.values(
        (contextMenuTranslations as unknown as Record<
          string,
          { accessibility?: { screenReader?: Record<string, string> } }
        >)[locale]?.accessibility?.screenReader ?? {},
      ),
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
    componentSlug: "context-menu",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "context_menu",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "context_menu",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ─────────────────────────────────────────────────────────

  const codeImportBasic = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";`;

  const codeImportWithSub = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";`;

  const codeVariantDefault = `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

  const codeVariantDestructive = `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`;

  const codeVariantLabel = `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel>Grupo de ações</ContextMenuLabel>
      <ContextMenuItem inset>Editar</ContextMenuItem>
      <ContextMenuItem inset>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`;

  const codeCustomizationTokens = `/* Em globals.css — personalizar tokens do menu */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
}

.dark {
  --popover: 224 71% 4%;
  --popover-foreground: 215 20.2% 65.1%;
}`;

  const interfaceCode = `// ContextMenuItem
interface ContextMenuItemProps extends ContextMenuPrimitive.Item.Props {
  inset?: boolean;
  variant?: "default" | "destructive";
}

// ContextMenuContent
interface ContextMenuContentProps extends ContextMenuPrimitive.Popup.Props {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

// ContextMenuCheckboxItem
interface ContextMenuCheckboxItemProps
  extends ContextMenuPrimitive.CheckboxItem.Props {
  inset?: boolean;
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
      {/* ── Demonstração ───────────────────────────────────────────── */}
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="nds-cluster nds-p-8 nds-min-h-50" data-align="center" data-justify="center">
          <DemonstracaoPreview tContent={tContent} />
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ───────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={stringsFromDict(tContent, "anatomy")}
        structureLabel={tContent("anatomy.structureLabel")}
        structureCode={tContent("anatomy.structureCode")}
      />

      {/* ── Quando Usar ────────────────────────────────────────────── */}
      <DocsWhenToUse
        title={tContent("usage.title")}
        guidelines={{
          title: tContent("usage.guidelines.title"),
          items: stringsFromDict(tContent, "usage.guidelines"),
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: entriesFromDict(tContent, "usage.scenarios", ["s", "u", "a"]),
        }}
        do={{
          title: tContent("usage.do.title"),
          items: stringsFromDict(tContent, "usage.do"),
        }}
        dont={{
          title: tContent("usage.dont.title"),
          items: stringsFromDict(tContent, "usage.dont"),
        }}
      />

      {/* ── Do & Don't ─────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // A legenda promete "as mesmas ações também via botão visível": o
            // lado do faça DESENHA esse botão, e o lado do evite mostra a mesma
            // área sem ele. Um par cujos dois lados são iguais não ensina nada —
            // era o caso aqui, com os dois previews idênticos e o botão só na
            // frase.
            doPreview: (
              <div className="nds-stack" data-spacing="sm" data-align="center">
                <ContextMenu>
                  <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                    {tContent("demonstration.labels.triggerLabel")}
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>{tContent("demonstration.labels.edit")}</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="destructive">
                      {tContent("demonstration.labels.delete")}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                {/* A MESMA ação do menu, alcançável sem o botão direito. */}
                <Button variant="outline" size="sm">
                  {tContent("demonstration.labels.edit")}
                </Button>
              </div>
            ),
            dontPreview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  {tContent("demonstration.labels.triggerLabel")}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>{tContent("demonstration.labels.edit")}</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">
                    {tContent("demonstration.labels.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            doCaption: toPlainText(tContent("doDont.pair1.do")),
            dontCaption: toPlainText(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // Todo rótulo sai do conteúdo compartilhado. O par desenhava sete
            // literais em português — "Item destrutivo separado", "Opções",
            // "Ação profunda" e afins — que ficam em português para quem lê a
            // página em inglês ou espanhol, sem erro e sem aviso.
            doPreview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  {tContent("demonstration.labels.triggerLabel")}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>{tContent("demonstration.labels.edit")}</ContextMenuItem>
                  <ContextMenuItem>{tContent("demonstration.labels.duplicate")}</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">
                    {tContent("demonstration.labels.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            // Submenu dentro de submenu — o anti-padrão que `notes.tip3` nomeia.
            dontPreview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  {tContent("demonstration.labels.triggerLabel")}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>
                      {tContent("demonstration.labels.share")}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          {tContent("demonstration.labels.shareLink")}
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          <ContextMenuItem>
                            {tContent("demonstration.labels.shareEmail")}
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            ),
            doCaption: toPlainText(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // As duas metades da legenda falam de DICA VISUAL, e é o contorno
            // que faz a diferença: à esquerda a moldura tracejada da constante
            // compartilhada mais a linha que diz o gesto; à direita a mesma
            // área SEM moldura e sem aviso — o menu existe e ninguém tem como
            // saber. Com o tracejado dos dois lados só o rótulo mudava, e o par
            // não ilustrava a legenda que carrega.
            //
            // Os dois rótulos saem do conteúdo compartilhado.
            doPreview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  {tContent("demonstration.labels.triggerLabel")}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>{tContent("demonstration.labels.edit")}</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">
                    {tContent("demonstration.labels.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            dontPreview: (
              <ContextMenu>
                <ContextMenuTrigger className={plainAreaClass} data-align="center" data-justify="center">
                  {tContent("demonstration.labels.areaNoHint")}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>{tContent("demonstration.labels.edit")}</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">
                    {tContent("demonstration.labels.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
            doCaption: toPlainText(tContent("doDont.pair3.do")),
            dontCaption: toPlainText(tContent("doDont.pair3.dont")),
          },
        ]}
      />

      {/* ── Importação ─────────────────────────────────────────────── */}
      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withSub")}
        secondaryCode={codeImportWithSub}
        componentSlug="context-menu"
      />

      {/* ── Variantes ──────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="context-menu"
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeVariantDefault,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuItem>Duplicar</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            name: "destructive",
            description: stripHtml(tContent("variants.items.destructive")),
            code: codeVariantDestructive,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            name: "Label + Inset",
            description: stripHtml(tContent("variants.items.label")),
            code: codeVariantLabel,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuGroup>
                    <ContextMenuLabel>Grupo de ações</ContextMenuLabel>
                    <ContextMenuItem inset>Editar</ContextMenuItem>
                    <ContextMenuItem inset>Duplicar</ContextMenuItem>
                  </ContextMenuGroup>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            trackId: "withCheckbox",
            name: tContent("variants.items.withCheckbox.name"),
            description: tContent("variants.items.withCheckbox.description"),
            useWhen: tContent("variants.items.withCheckbox.use"),
            code: `const [showGrid, setShowGrid] = useState(true);
const [showRulers, setShowRulers] = useState(false);

<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Visualização</ContextMenuLabel>
      <ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
        Mostrar grade
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
        Mostrar réguas
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`,
            preview: <CheckboxDemo tContent={tContent} />,
          },
          {
            trackId: "withRadio",
            name: tContent("variants.items.withRadio.name"),
            description: tContent("variants.items.withRadio.description"),
            useWhen: tContent("variants.items.withRadio.use"),
            code: `const [zoom, setZoom] = useState("100");

<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Zoom</ContextMenuLabel>
      <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
        <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
        <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
        <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`,
            preview: <RadioDemo tContent={tContent} />,
          },
          {
            trackId: "withSubmenu",
            name: tContent("variants.items.withSubmenu.name"),
            description: tContent("variants.items.withSubmenu.description"),
            useWhen: tContent("variants.items.withSubmenu.use"),
            code: `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por e-mail</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>`,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Editar</ContextMenuItem>
                  <ContextMenuItem>Duplicar</ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem>Por e-mail</ContextMenuItem>
                      <ContextMenuItem>Por link</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
          {
            trackId: "withShortcuts",
            name: tContent("variants.items.withShortcuts.name"),
            description: tContent("variants.items.withShortcuts.description"),
            useWhen: tContent("variants.items.withShortcuts.use"),
            code: `<ContextMenu>
  <ContextMenuTrigger>Área de clique direito</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Duplicar
      <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>Delete</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
            preview: (
              <ContextMenu>
                <ContextMenuTrigger className={triggerAreaClass} data-align="center" data-justify="center">
                  Right-click aqui
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>
                    Editar
                    <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    Duplicar
                    <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">
                    Excluir
                    <ContextMenuShortcut>Delete</ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
        ]}
      />

      {/* ── Estados ────────────────────────────────────────────────── */}
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
            label: tContent("states.focused.label"),
            trigger: toPlainText(tContent("states.focused.trigger")),
            behavior: toPlainText(tContent("states.focused.behavior")),
          },
          {
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.checked.label"),
            trigger: toPlainText(tContent("states.checked.trigger")),
            behavior: toPlainText(tContent("states.checked.behavior")),
          },
          {
            label: tContent("states.subOpen.label"),
            trigger: toPlainText(tContent("states.subOpen.trigger")),
            behavior: toPlainText(tContent("states.subOpen.behavior")),
          },
        ]}
      />

      {/* ── Propriedades ───────────────────────────────────────────── */}
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
              {
                name: "onOpenChange",
                type: "(open: boolean) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onOpenChange"),
              },
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
              {
                name: "align",
                type: '"start" | "center" | "end"',
                defaultValue: '"start"',
                required: "Não",
                description: stripHtml(tContent("props.items.align")),
              },
              {
                name: "alignOffset",
                type: "number",
                defaultValue: "4",
                required: "Não",
                description: stripHtml(tContent("props.items.alignOffset")),
              },
              {
                name: "side",
                type: '"top" | "right" | "bottom" | "left"',
                defaultValue: '"right"',
                required: "Não",
                description: stripHtml(tContent("props.items.side")),
              },
              {
                name: "sideOffset",
                type: "number",
                defaultValue: "0",
                required: "Não",
                description: stripHtml(tContent("props.items.sideOffset")),
              },
            ],
          },
          {
            title: tContent("props.itemTitle"),
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
                type: '"default" | "destructive"',
                defaultValue: '"default"',
                required: "Não",
                description: stripHtml(tContent("props.items.variant")),
              },
              {
                name: "inset",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: stripHtml(tContent("props.items.inset")),
              },
              {
                name: "disabled",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.items.disabled"),
              },
              {
                name: "onSelect",
                type: "(event: Event) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onSelect"),
              },
            ],
          },
          {
            title: tContent("props.checkboxItemTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "checked",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: tContent("props.items.checked"),
              },
              {
                name: "onCheckedChange",
                type: "(checked: boolean) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onCheckedChange"),
              },
              {
                name: "inset",
                type: "boolean",
                defaultValue: "false",
                required: "Não",
                description: stripHtml(tContent("props.items.inset")),
              },
            ],
          },
          {
            title: tContent("props.radioGroupTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              {
                name: "value",
                type: "string",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.value"),
              },
              {
                name: "onValueChange",
                type: "(value: string) => void",
                defaultValue: "—",
                required: "Não",
                description: tContent("props.items.onValueChange"),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={tContent("props.extensibility")}
      />

      {/* ── Tokens ─────────────────────────────────────────────────── */}
      <DocsTokens
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        // A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do
        // Tailwind — vocabulário morto desde a migração. Cada linha aponta agora
        // o seletor que o CSS realmente usa, e cada token foi medido no
        // navegador: só `--elevation-md` muda a sombra (`--shadow` e
        // `--shadow-md` não movem nada), o separador é `--muted` e não
        // `--border`, e o raio do item é `--radius-sm`, não `--radius`.
        items={[
          { token: "--popover",            value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.popoverBg") },
          { token: "--popover-foreground", value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.popoverFg") },
          { token: "--accent",             value: ".nds-dropdown-menu-item",       description: tContent("tokens.table.accentBg") },
          { token: "--accent-foreground",  value: ".nds-dropdown-menu-item",       description: tContent("tokens.table.accentFg") },
          { token: "--destructive",        value: '[data-variant="destructive"]',  description: tContent("tokens.table.destructive") },
          { token: "--destructive",        value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: tContent("tokens.table.destructiveFocus") },
          { token: "--muted-foreground",   value: ".nds-dropdown-menu-shortcut",   description: tContent("tokens.table.mutedFg") },
          { token: "--muted-foreground",   value: ".nds-dropdown-menu-label",      description: tContent("tokens.table.mutedFgLabel") },
          { token: "--muted",              value: ".nds-dropdown-menu-separator",  description: tContent("tokens.table.border") },
          { token: "--border",             value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.popupBorder") },
          { token: "--elevation-md",       value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.shadow") },
          { token: "--radius",             value: ".nds-dropdown-menu-content",    description: tContent("tokens.table.radius") },
          { token: "--radius-sm",          value: ".nds-dropdown-menu-item",       description: tContent("tokens.table.radiusItem") },
          { token: "--z-popover",          value: ".nds-dropdown-menu-positioner", description: tContent("tokens.table.zIndex") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      {/* ── Acessibilidade ─────────────────────────────────────────── */}
      <DocsAccessibility
        screenReaderTitle={tNav("common.screenReader")}
        screenReaderItems={screenReaderItems}
        title={tContent("accessibility.title")}
        summary={tContent("accessibility.summary")}
        items={[
          tContent("accessibility.warning"),
          tContent("accessibility.aria.roleMenu"),
          tContent("accessibility.aria.roleMenuItem"),
          tContent("accessibility.aria.roleMenuitemCheckbox"),
          tContent("accessibility.aria.roleMenuitemRadio"),
          tContent("accessibility.aria.ariaChecked"),
          tContent("accessibility.aria.ariaDisabled"),
          tContent("accessibility.aria.ariaHaspopup"),
          tContent("accessibility.aria.ariaExpanded"),
          tContent("accessibility.screenReader.alternative"),
        ]}
        keyboardTitle={tContent("accessibility.title")}
        keyboardItems={[
          { key: "Right-click / Menu / Shift+F10", description: tContent("accessibility.keyboard.rightClick") },
          { key: "Arrow Down",  description: tContent("accessibility.keyboard.arrowDown") },
          { key: "Arrow Up",    description: tContent("accessibility.keyboard.arrowUp") },
          { key: "Arrow Right", description: tContent("accessibility.keyboard.arrowRight") },
          { key: "Arrow Left",  description: tContent("accessibility.keyboard.arrowLeft") },
          { key: "Home / End",  description: tContent("accessibility.keyboard.homeEnd") },
          { key: "A–Z",         description: tContent("accessibility.keyboard.typeahead") },
          { key: "Enter",       description: tContent("accessibility.keyboard.enter") },
          { key: "Space",       description: tContent("accessibility.keyboard.space") },
          { key: "Esc",         description: tContent("accessibility.keyboard.escape") },
          { key: "Tab",         description: tContent("accessibility.keyboard.tab") },
        ]}
      />

      {/* ── Relacionados ───────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        items={[
          {
            name: "DropdownMenu",
            description: toPlainText(tContent("related.dropdownMenu")),
            path: "?path=/docs/components-overlay-dropdownmenu--docs",
          },
          {
            name: "Menubar",
            description: toPlainText(tContent("related.menubar")),
            path: "?path=/docs/components-navigation-menubar--docs",
          },
          {
            name: "Dialog",
            description: toPlainText(tContent("related.dialog")),
            path: "?path=/docs/components-overlay-dialog--docs",
          },
          {
            name: "AlertDialog",
            description: toPlainText(tContent("related.alertDialog")),
            path: "?path=/docs/components-overlay-alertdialog--docs",
          },
          {
            name: "Tooltip",
            description: toPlainText(tContent("related.tooltip")),
            path: "?path=/docs/components-overlay-tooltip--docs",
          },
        ]}
      />

      {/* ── Notas ──────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        items={stringsFromDict(tContent, "notes", "tip").map((content) => ({
          title: "",
          content,
        }))}
      />

      {/* ── Analytics ──────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={{
          event: tContent("analytics.table.event"),
          trigger: toPlainText(tContent("analytics.table.trigger")),
          payload: tContent("analytics.table.payload"),
        }}
        items={[
          {
            event: tContent("analytics.table.menuOpen"),
            trigger: toPlainText(tContent("analytics.table.menuOpenTrigger")),
            payload: tContent("analytics.table.menuOpenPayload"),
          },
          {
            event: tContent("analytics.table.itemClick"),
            trigger: toPlainText(tContent("analytics.table.itemClickTrigger")),
            payload: tContent("analytics.table.itemClickPayload"),
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

      {/* ── Testes ─────────────────────────────────────────────────── */}
      <DocsTestes
        title={tContent("testes.title")}
        functional={{
          title: tContent("testes.functional.title"),
          cols: {
            action: tNav("common.userAction"),
            result: tNav("common.expectedResult"),
            priority: tNav("common.priority"),
          },
          items: entriesFromDict(tContent, "testes.functional", ["action", "result", "priority"]).map(
            (entry) => ({ ...entry, priority: priorityLabel(entry.priority) }),
          ),
        }}
        accessibility={{
          title: tContent("testes.accessibility.title"),
          cols: {
            criterion: tNav("common.criterion"),
            level: "WCAG",
            how: tNav("common.howToVerify"),
          },
          items: stringsFromDict(tContent, "testes.accessibility").map((criterion, i) => ({
            criterion,
            level: A11Y_TEST_LEVELS[i] ?? "AA",
            how: A11Y_TEST_HOW[i] ?? "axe-core",
          })),
        }}
        visual={{
          title: tContent("testes.visual.title"),
          cols: {
            story: tNav("common.storyState"),
            priority: tNav("common.priority"),
          },
          items: entriesFromDict(tContent, "testes.visual", ["story", "priority"]).map(
            (entry) => ({ ...entry, priority: priorityLabel(entry.priority) }),
          ),
        }}
      />
    </DocsPageLayout>
  );
}
