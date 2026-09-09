import { useCallback, useEffect, useMemo, type PointerEvent } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import drawerTranslations from "@shared/content/drawer/translations.json";

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

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
 * compartilhado ganha um item e ele simplesmente não existe para quem lê — sem
 * erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu aqui com os
 * dois últimos critérios funcionais (o arraste que dispensa e o arraste curto
 * que volta ao repouso) e com o oitavo de acessibilidade, o da WCAG 2.5.7.
 *
 * Trocar 7 por 9 não resolveria: o total cravado É o defeito, e ele volta no
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
const A11Y_TEST_LEVELS = ["AA", "4.1.2", "1.3.1", "2.1.1", "2.4.3", "1.4.3", "2.1.1", "2.5.7"];
const A11Y_TEST_HOW = [
  "axe-core",
  "DevTools a11y tree",
  "DevTools a11y tree",
  "Keyboard test",
  "Keyboard test",
  "Contrast checker",
  "Keyboard test",
  "Keyboard test",
];

// ─── Analytics dos painéis vivos ─────────────────────────────────────────────

type DrawerDirection = "bottom" | "top" | "left" | "right";

/**
 * Caminho que fechou o painel, no vocabulário do design system.
 *
 * É o mesmo conjunto fechado que `AnalyticsEvents["drawer_close"]` cobra: quatro
 * palavras, iguais nas cinco stacks. Um quinto valor aqui partiria a mesma
 * dimensão do GA4 em duas leituras.
 */
type DrawerCloseReason = "escape" | "overlay" | "close-button" | "api";

/**
 * O motivo do fechamento, guardado até o `onOpenChange` chegar.
 *
 * O primitivo desta stack avisa QUE o painel fechou (`onOpenChange` recebe um
 * booleano e nada mais), nunca POR QUÊ — e o payload de `drawer_close` promete
 * `reason`. Cada caminho que a lib anuncia por evento próprio deixa o motivo
 * anotado aqui antes de o fechamento acontecer; o que sobra é o botão de saída
 * do rodapé, que é o default.
 *
 * Uma variável para a página inteira basta: os painéis são modais, e nunca há
 * dois abertos ao mesmo tempo.
 */
let pendingCloseReason: DrawerCloseReason | null = null;

/**
 * Ouvintes para o `DrawerContent`: tecla de escape e clique no véu.
 */
const closeReasonWatch = {
  onEscapeKeyDown: () => {
    pendingCloseReason = "escape";
  },
  onPointerDownOutside: () => {
    pendingCloseReason = "overlay";
  },
};

/**
 * Ouvintes para a raiz: o arraste que dispensa o painel.
 *
 * Arrastar para fora fecha por `overlay` — para quem usa, é a mesma decisão de
 * "saí sem decidir nada" do clique no véu.
 *
 * O motivo é anotado no ARRASTE, e não na soltura, porque a lib fecha antes de
 * anunciar a soltura (`closeDrawer(); onRelease(event, false)`): anotado ali, o
 * `onOpenChange` já teria passado. Arraste curto, que volta ao repouso, é
 * anunciado com `open = true` e limpa a anotação — sem isso, o próximo
 * fechamento por botão herdaria um motivo que não é o dele.
 */
const dragWatch = {
  onDrag: () => {
    pendingCloseReason = "overlay";
  },
  onRelease: (_event: PointerEvent<HTMLDivElement>, open: boolean) => {
    if (open) pendingCloseReason = null;
  },
};

/**
 * `label` leva a DIREÇÃO, valor estável — nunca o título, que é texto traduzido
 * e partiria a mesma série em três valores no GA4.
 *
 * `location` vem de QUEM CHAMA: ele responde de ONDE saiu a interação, e um
 * `docs_demo` cravado faria a página inteira responder a mesma coisa. Painel
 * vivo em Variantes ou Composições é abertura tão real quanto a da demonstração.
 * Vocabulário em `docs/shared/guidelines/07-analytics.md`.
 */
function trackDrawer(location: string, direction: DrawerDirection, open: boolean) {
  if (open) {
    pendingCloseReason = null;
    track("drawer_open", { component: "drawer", label: direction, location });
    return;
  }
  track("drawer_close", {
    component: "drawer",
    label: direction,
    reason: pendingCloseReason ?? "close-button",
    location,
  });
  pendingCloseReason = null;
}

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

export function DrawerDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(drawerTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (drawerTranslations as unknown as Record<
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
    componentSlug: "drawer",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: tContent("category"), item: "/components/disclosure" },
      { name: tContent("title") },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "drawer",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "drawer",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";`;

  const structureCode = tContent("anatomy.structureCode");

  const interfaceCode = `// Drawer (vaul)
interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: "bottom" | "top" | "left" | "right";
  modal?: boolean;
  dismissible?: boolean;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────────

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  // ─── Exemplo por direção — uma fonte só para a prévia e para o snippet ─────
  //
  // As duas superfícies leem as MESMAS chaves: o rótulo curto nomeia o painel,
  // o rótulo longo da demonstração o descreve, e a saída do rodapé usa o verbo
  // de cancelamento que o próprio UX writing desta página prescreve. Enquanto
  // cada superfície tinha o seu texto, o snippet ensinava um painel que a
  // prévia não mostrava.
  const directions: Array<"bottom" | "top" | "left" | "right"> = [
    "bottom",
    "right",
    "left",
    "top",
  ];

  // As chaves de rótulo ficam ESCRITAS por extenso, e não montadas em template:
  // o guarda de divergência da demonstração procura `demonstration.labels.<dir>`
  // no texto do arquivo, e a chave interpolada o deixava cego — a página não
  // entrava sequer na comparação entre as cinco stacks.
  const directionLabelKeys = {
    bottom: "demonstration.labels.bottom",
    top: "demonstration.labels.top",
    left: "demonstration.labels.left",
    right: "demonstration.labels.right",
  } as const;

  const directionExample = (dir: (typeof directions)[number]) => ({
    title: tContent(`variants.items.${dir}`),
    description: tContent(directionLabelKeys[dir]),
    // Falta chave própria para o corpo do painel de exemplo (o `sheet` tem
    // `demonstration.labels.body`); até ela existir, o corpo empresta a
    // descrição do componente em vez de cravar literal em pt-BR.
    body: tContent("description"),
    close: tContent("usage.uxWriting.table.close.good"),
  });

  const directionCode = (dir: (typeof directions)[number]) => {
    const ex = directionExample(dir);
    return `<Drawer direction="${dir}">
  <DrawerTrigger asChild>
    <Button variant="outline">${ex.title}</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>${ex.title}</DrawerTitle>
      <DrawerDescription>${ex.description}</DrawerDescription>
    </DrawerHeader>
    <DrawerBody className="nds-text-body nds-text-muted-foreground">
      ${ex.body}
    </DrawerBody>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">${ex.close}</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;
  };

  // `location` é PARÂMETRO, e não constante: a mesma prévia é montada na
  // demonstração, no par de Do & Don't e nas quatro variantes.
  const directionPreview = (dir: (typeof directions)[number], location: string) => {
    const ex = directionExample(dir);
    return (
      <Drawer
        direction={dir}
        onOpenChange={(open) => trackDrawer(location, dir, open)}
        {...dragWatch}
      >
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="nds-w-full">
            {ex.title}
          </Button>
        </DrawerTrigger>
        <DrawerContent {...closeReasonWatch}>
          <DrawerHeader>
            <DrawerTitle>{ex.title}</DrawerTitle>
            <DrawerDescription>{ex.description}</DrawerDescription>
          </DrawerHeader>
          {/* O corpo é o `DrawerBody`, e não uma `div` com utilitários de
              espaçamento: é ele que traz `data-slot`, o `tabIndex` que deixa a
              região rolável alcançável por teclado e a área que de fato rola. */}
          <DrawerBody className="nds-text-body nds-text-muted-foreground">
            {ex.body}
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">{ex.close}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="drawer"
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
          className="nds-cluster nds-w-full"
          data-justify="center"
          data-spacing="md"
          style={{ contain: "layout", flexWrap: "wrap" }}
        >
          {directions.map((dir) => (
            <div
              key={dir}
              className="nds-stack"
              data-spacing="xs"
              style={{ contain: "layout", position: "relative" }}
            >
              <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {DOMPurify.sanitize(tContent(directionLabelKeys[dir]))}
              </p>
              {directionPreview(dir, "docs_demo")}
            </div>
          ))}
        </div>
      </DocsDemonstration>

      {/* ── Anatomia ──────────────────────────────────────────────── */}
      <DocsAnatomy
        title={tContent("anatomy.title")}
        items={stringsFromDict(tContent, "anatomy")}
        structureCode={structureCode}
        structureLabel={tContent("anatomy.structureLabel")}
      />

      {/* ── Quando Usar ───────────────────────────────────────────── */}
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.close.name"),
              rules: tContent("usage.uxWriting.table.close.format"),
              do: tContent("usage.uxWriting.table.close.good"),
              dont: tContent("usage.uxWriting.table.close.bad"),
            },
          ],
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

      {/* ── Do & Don't ────────────────────────────────────────────── */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Drawer onOpenChange={(open) => trackDrawer("docs_do_dont", "bottom", open)} {...dragWatch}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm">
                    {tContent("usage.uxWriting.table.trigger.good")}
                  </Button>
                </DrawerTrigger>
                <DrawerContent {...closeReasonWatch}>
                  <DrawerHeader>
                    <DrawerTitle>{tContent("usage.uxWriting.table.title.good")}</DrawerTitle>
                    <DrawerDescription>
                      {tContent("usage.uxWriting.table.description.good")}
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">
                        {tContent("usage.uxWriting.table.close.good")}
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
            // O anti-exemplo MANTÉM o nome acessível: um painel realmente sem
            // `DrawerTitle` reprovaria o axe da própria docs page, e o conteúdo
            // compartilhado (`usage.guidelines.item3`) diz que o título oculto é
            // a forma CORRETA. A lição fica no corpo do painel — o que se evita
            // é o painel sem título nenhum, não o título visualmente oculto.
            dontPreview: (
              <Drawer onOpenChange={(open) => trackDrawer("docs_do_dont", "bottom", open)} {...dragWatch}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm">
                    {tContent("usage.uxWriting.table.trigger.good")}
                  </Button>
                </DrawerTrigger>
                <DrawerContent {...closeReasonWatch}>
                  <DrawerHeader>
                    <DrawerTitle className="nds-sr-only">
                      {tContent("usage.uxWriting.table.title.good")}
                    </DrawerTitle>
                    <DrawerDescription className="nds-sr-only">
                      {tContent("usage.uxWriting.table.description.good")}
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerBody className="nds-text-body nds-text-muted-foreground">
                    {toPlainText(tContent("doDont.pair1.dont"))}
                  </DrawerBody>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">
                        {tContent("usage.uxWriting.table.close.good")}
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: directionPreview("bottom", "docs_do_dont"),
            // Aninhar de verdade quebraria o foco preso da própria docs page —
            // que é exatamente o que a legenda condena. O painel é um só, e o
            // que ele explica no corpo é o motivo de não haver um segundo.
            dontPreview: (
              <Drawer onOpenChange={(open) => trackDrawer("docs_do_dont", "bottom", open)} {...dragWatch}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm">
                    {tContent("usage.uxWriting.table.trigger.good")}
                  </Button>
                </DrawerTrigger>
                <DrawerContent {...closeReasonWatch}>
                  <DrawerHeader>
                    <DrawerTitle>{tContent("usage.uxWriting.table.title.good")}</DrawerTitle>
                    <DrawerDescription>
                      {tContent("usage.uxWriting.table.description.good")}
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerBody className="nds-text-body nds-text-muted-foreground">
                    {toPlainText(tContent("doDont.pair2.dont"))}
                  </DrawerBody>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">
                        {tContent("usage.uxWriting.table.close.good")}
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair2.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      {/* ── Importação ────────────────────────────────────────────── */}
      <DocsImport title={tContent("import.title")} code={codeImport} />

      {/* ── Variantes ─────────────────────────────────────────────── */}
      <DocsCompositions
        id="variantes"
        title={tContent("variants.title")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="drawer"
        items={[
          {
            trackId: "bottom",
            name: tContent("variants.items.bottom"),
            description: stripHtml(tContent("variants.styles.bottom")),
            code: directionCode("bottom"),
            preview: directionPreview("bottom", "docs_variantes"),
          },
          {
            trackId: "top",
            name: tContent("variants.items.top"),
            description: stripHtml(tContent("variants.styles.top")),
            code: directionCode("top"),
            preview: directionPreview("top", "docs_variantes"),
          },
          {
            trackId: "left",
            name: tContent("variants.items.left"),
            description: stripHtml(tContent("variants.styles.left")),
            code: directionCode("left"),
            preview: directionPreview("left", "docs_variantes"),
          },
          {
            trackId: "right",
            name: tContent("variants.items.right"),
            description: stripHtml(tContent("variants.styles.right")),
            code: directionCode("right"),
            preview: directionPreview("right", "docs_variantes"),
          },
          {
            trackId: "withScroll",
            name: tContent("variants.items.withScroll.name"),
            description: tContent("variants.items.withScroll.description"),
            useWhen: tContent("variants.items.withScroll.use"),
            code: `<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Ler termos</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Termos de uso</DrawerTitle>
      <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
    </DrawerHeader>
    <DrawerBody
      className="nds-stack nds-text-body nds-text-muted-foreground"
      data-spacing="sm"
      aria-label="Termos de uso"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <p key={i}>
          {i + 1}. Termos longos, para o corpo do painel passar da altura visível e rolar sozinho.
        </p>
      ))}
    </DrawerBody>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
      <Button>Aceitar termos</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
            preview: (
              <Drawer onOpenChange={(open) => trackDrawer("docs_variantes", "bottom", open)} {...dragWatch}>
                <DrawerTrigger asChild>
                  <Button variant="outline">Ler termos</Button>
                </DrawerTrigger>
                <DrawerContent {...closeReasonWatch}>
                  <DrawerHeader>
                    <DrawerTitle>Termos de uso</DrawerTitle>
                    <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
                  </DrawerHeader>
                  <DrawerBody
                    className="nds-stack nds-text-body nds-text-muted-foreground"
                    data-spacing="sm"
                    aria-label="Termos de uso"
                  >
                    {/* O corpo longo é EXEMPLO, e sai de `demonstration.labels.scrollBody`
                        — não de `variants.items.withScroll.use`, que responde "quando usar
                        esta variante" e, repetida doze vezes, faria o painel exibir a
                        própria recomendação como se fosse o termo a ler. */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <p key={i}>
                        {i + 1}. {tContent("demonstration.labels.scrollBody")}
                      </p>
                    ))}
                  </DrawerBody>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">{tContent("demonstration.labels.cancel")}</Button>
                    </DrawerClose>
                    <Button>Aceitar termos</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
          },
        ]}
      />

      {/* ── Composições ───────────────────────────────────────────── */}
      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="drawer"
        items={[
          {
            trackId: "withForm",
            // Mesmo formulário da stack de referência: "Salvar alterações" no
            // rodapé e os valores de exemplo dela. Esta stack tinha "Confirmar",
            // outra descrição e outro nome no campo — a mesma composição contava
            // uma história diferente aqui.
            name: tContent("variants.compositions.withForm.name"),
            description: tContent("variants.compositions.withForm.description"),
            useWhen: tContent("variants.compositions.withForm.use"),
            code: `<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados.</DrawerDescription>
    </DrawerHeader>
    <DrawerBody>
      <form
        id="drawer-form"
        className="nds-grid"
        data-spacing="sm"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="nds-grid" data-spacing="xs">
          <Label htmlFor="drawer-name">Nome</Label>
          <Input id="drawer-name" defaultValue="Maria Souza" />
        </div>
        <div className="nds-grid" data-spacing="xs">
          <Label htmlFor="drawer-email">E-mail</Label>
          <Input id="drawer-email" type="email" defaultValue="maria@exemplo.com" />
        </div>
      </form>
    </DrawerBody>
    {/* O rodapé é irmão do corpo: é o par id ↔ form que religa a ação primária
        ao formulário. Sem ele o Enter num campo não dispara nada. */}
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
      <Button type="submit" form="drawer-form">
        Salvar alterações
      </Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
            preview: (
              <Drawer onOpenChange={(open) => trackDrawer("docs_composicoes", "bottom", open)} {...dragWatch}>
                <DrawerTrigger asChild>
                  <Button variant="outline">{tContent("demonstration.labels.trigger")}</Button>
                </DrawerTrigger>
                <DrawerContent {...closeReasonWatch}>
                  <DrawerHeader>
                    <DrawerTitle>{tContent("demonstration.labels.title")}</DrawerTitle>
                    <DrawerDescription>
                      {tContent("demonstration.labels.description")}
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerBody>
                    <form
                      id="docs-drawer-form"
                      className="nds-grid"
                      data-spacing="sm"
                      onSubmit={(event) => event.preventDefault()}
                    >
                      <div className="nds-grid" data-spacing="xs">
                        <Label htmlFor="docs-drawer-name">
                          {tContent("demonstration.labels.fieldName")}
                        </Label>
                        {/* O valor é DADO de exemplo, não rótulo: fica literal. */}
                        <Input id="docs-drawer-name" defaultValue="Maria Souza" />
                      </div>
                      <div className="nds-grid" data-spacing="xs">
                        <Label htmlFor="docs-drawer-email">
                          {tContent("demonstration.labels.fieldEmail")}
                        </Label>
                        <Input id="docs-drawer-email" type="email" defaultValue="maria@exemplo.com" />
                      </div>
                    </form>
                  </DrawerBody>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">{tContent("demonstration.labels.cancel")}</Button>
                    </DrawerClose>
                    <Button type="submit" form="docs-drawer-form">
                      {tContent("demonstration.labels.confirm")}
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ),
          },
          {
            trackId: "withConfirmation",
            name: tContent("variants.compositions.withConfirmation.name"),
            description: tContent("variants.compositions.withConfirmation.description"),
            useWhen: tContent("variants.compositions.withConfirmation.use"),
            // Os rótulos saem de `demonstration.labels`: gatilho, título e ação
            // destrutiva são o mesmo verbo (`destroy`), e o aviso é
            // `destroyMessage`. É o conjunto que as cinco docs pages leem — o
            // guarda `demonstration_labels_divergent` compara exatamente as
            // chaves usadas AQUI, e antes desta rodada a página cravava o texto
            // em português. A story `WithConfirmation` segue com "Remover
            // anexo": é ela a superfície testada, e o texto dela é o que o
            // `drawer.source.ts` publica no painel Code.
            code: `<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Excluir</Button>
  </DrawerTrigger>
  <DrawerContent
    onOpenAutoFocus={(event) => {
      // A decisão É a tela: o foco vai para a saída segura, e não para o
      // primeiro tabbable. O Enter por reflexo não pode cair no que consuma.
      const panelEl = event.target as HTMLElement | null;
      const safeExit = panelEl?.querySelector<HTMLElement>('[data-slot="drawer-close"]');
      // Sem saída marcada no rodapé não há alvo, e aí o padrão do primitivo
      // é melhor que um diálogo open sem foco nenhum dentro.
      if (!safeExit) return;
      event.preventDefault();
      safeExit.focus();
    }}
  >
    <DrawerHeader>
      <DrawerTitle>Excluir</DrawerTitle>
      <DrawerDescription>
        Você pode desfazer esta ação nos próximos 30 dias.
      </DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
      <Button variant="destructive">Excluir</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
            preview: (
              <Drawer onOpenChange={(open) => trackDrawer("docs_composicoes", "bottom", open)} {...dragWatch}>
                <DrawerTrigger asChild>
                  <Button variant="outline">{tContent("demonstration.labels.destroy")}</Button>
                </DrawerTrigger>
                <DrawerContent
                  {...closeReasonWatch}
                  onOpenAutoFocus={(event) => {
                    // A decisão É a tela: o foco vai para a saída segura, e não
                    // para o primeiro tabbável. O Enter por reflexo não pode
                    // cair no botão que consuma.
                    const panelEl = event.target as HTMLElement | null;
                    const safeExit = panelEl?.querySelector<HTMLElement>('[data-slot="drawer-close"]');
                    // Sem saída marcada no rodapé não há alvo, e aí o padrão do primitivo
                    // é melhor que um diálogo open sem foco nenhum dentro.
                    if (!safeExit) return;
                    event.preventDefault();
                    safeExit.focus();
                  }}
                >
                  <DrawerHeader>
                    <DrawerTitle>{tContent("demonstration.labels.destroy")}</DrawerTitle>
                    <DrawerDescription>
                      {tContent("demonstration.labels.destroyMessage")}
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">{tContent("demonstration.labels.cancel")}</Button>
                    </DrawerClose>
                    <Button variant="destructive">
                      {tContent("demonstration.labels.destroy")}
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
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
            label: tContent("states.controlled.label"),
            trigger: toPlainText(tContent("states.controlled.trigger")),
            behavior: toPlainText(tContent("states.controlled.behavior")),
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
                name: "open",
                type: tContent("props.table.open.type"),
                defaultValue: tContent("props.table.open.default"),
                required: tContent("props.table.open.required"),
                description: DOMPurify.sanitize(tContent("props.table.open.description")),
              },
              {
                name: "onOpenChange",
                type: tContent("props.table.onOpenChange.type"),
                defaultValue: tContent("props.table.onOpenChange.default"),
                required: tContent("props.table.onOpenChange.required"),
                description: DOMPurify.sanitize(tContent("props.table.onOpenChange.description")),
              },
              {
                name: "defaultOpen",
                type: tContent("props.table.defaultOpen.type"),
                defaultValue: tContent("props.table.defaultOpen.default"),
                required: tContent("props.table.defaultOpen.required"),
                description: DOMPurify.sanitize(tContent("props.table.defaultOpen.description")),
              },
              {
                name: "direction",
                type: tContent("props.table.direction.type"),
                defaultValue: tContent("props.table.direction.default"),
                required: tContent("props.table.direction.required"),
                description: DOMPurify.sanitize(tContent("props.table.direction.description")),
              },
              {
                name: "modal",
                type: tContent("props.table.modal.type"),
                defaultValue: tContent("props.table.modal.default"),
                required: tContent("props.table.modal.required"),
                description: DOMPurify.sanitize(tContent("props.table.modal.description")),
              },
              {
                name: "dismissible",
                type: tContent("props.table.dismissible.type"),
                defaultValue: tContent("props.table.dismissible.default"),
                required: tContent("props.table.dismissible.required"),
                description: DOMPurify.sanitize(tContent("props.table.dismissible.description")),
              },
            ],
          },
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
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
        items={[
          {
            token: "--background",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "--foreground",
            value: tContent("tokens.table.foreground.class"),
            description: tContent("tokens.table.foreground.part"),
          },
          {
            token: "--border",
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
          },
          {
            token: "--overlay",
            value: tContent("tokens.table.overlay.class"),
            description: tContent("tokens.table.overlay.part"),
          },
          {
            token: "--muted",
            value: tContent("tokens.table.handle.class"),
            description: tContent("tokens.table.handle.part"),
          },
          {
            token: "--radius-xl",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
          },
          {
            token: "--drawer-width",
            value: tContent("tokens.table.width.class"),
            description: tContent("tokens.table.width.part"),
          },
          {
            token: "--drawer-max-width",
            value: tContent("tokens.table.maxWidth.class"),
            description: tContent("tokens.table.maxWidth.part"),
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
        items={stringsFromDict(tContent, "accessibility.items")}
        keyboardTitle={tContent("accessibility.keyboard.title")}
        // Sem linha de "Swipe": a tabela é de teclado, e arrastar é gesto de
        // ponteiro. O que se sabe sobre o arraste (nunca é o único caminho)
        // está em `accessibility.items.item5`, que é onde a WCAG 2.5.7 mora.
        keyboardItems={[
          { key: "Tab / Shift+Tab", description: toPlainText(tContent("accessibility.keyboard.tab")) },
          { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Enter / Space", description: toPlainText(tContent("accessibility.keyboard.enter")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="drawer"
        items={[
          {
            name: tContent("related.items.sheet.name"),
            description: toPlainText(tContent("related.items.sheet.description")),
            path: "?path=/docs/components-overlay-sheet--docs",
          },
          {
            name: tContent("related.items.dialog.name"),
            description: toPlainText(tContent("related.items.dialog.description")),
            path: "?path=/docs/components-overlay-dialog--docs",
          },
          {
            name: tContent("related.items.alertDialog.name"),
            description: toPlainText(tContent("related.items.alertDialog.description")),
            path: "?path=/docs/components-overlay-alertdialog--docs",
          },
          {
            name: tContent("related.items.sidebar.name"),
            description: toPlainText(tContent("related.items.sidebar.description")),
            path: "?path=/docs/components-layout-sidebar--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="drawer"
        items={stringsFromDict(tContent, "notes").map((content) => ({ title: "", content }))}
      />

      {/* ── Analytics ─────────────────────────────────────────────── */}
      <DocsAnalytics
        title={tContent("analytics.title")}
        cols={analyticsCols}
        items={[
          // Duas linhas, e não uma: os payloads são DIFERENTES — só o
          // fechamento leva `reason`. Anunciado junto, o `reason` sumia da
          // tabela enquanto o evento o carregava.
          {
            event: "drawer_open",
            trigger: toPlainText(tContent("states.open.trigger")),
            payload: "component, label, location",
          },
          {
            event: "drawer_close",
            trigger: toPlainText(tContent("accessibility.keyboard.escape")),
            payload: "component, label, reason, location",
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
          items: entriesFromDict(tContent, "testes.functional", ["action", "result", "priority"]).map(
            (entry) => ({
              ...entry,
              priority: tNav(priorityKeyMap[entry.priority] ?? "common.high"),
            }),
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
          items: entriesFromDict(tContent, "testes.visual", ["story", "priority"]).map((entry) => ({
            story: entry.story,
            priority: tNav(priorityKeyMap[entry.priority] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}

export default DrawerDocs;
