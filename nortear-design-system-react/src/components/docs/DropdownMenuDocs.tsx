import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import DOMPurify from 'dompurify';
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import dropdownMenuTranslations from "@shared/content/dropdown-menu/translations.json";

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
 * Contar à mão (`[1, 2, 3].map(...)`, ou uma linha por índice) trava a lista no
 * tamanho de hoje: o conteúdo compartilhado ganha um item e ele simplesmente
 * não existe para quem lê — sem erro, sem aviso, nos três idiomas de uma vez.
 * Foi o que aconteceu com o sétimo critério de acessibilidade deste componente.
 */
function stringsFromDict(
  t: (key: string, defaultValue?: string) => string,
  base: string,
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = t(`${base}.item${i}`, "");
    if (!value) break;
    out.push(value);
  }
  return out;
}

/**
 * Nível WCAG e ferramenta de cada critério de acessibilidade, por índice.
 * Ficam aqui, e não no conteúdo compartilhado, porque são IDENTIFICADORES
 * (número de critério, nome do verificador) e identificador não se traduz.
 * Item novo que chegue além da lista cai no par padrão em vez de sumir.
 */
const A11Y_TEST_LEVELS = ["AA", "4.1.2", "4.1.2", "1.3.1", "2.4.3", "1.4.3", "4.1.2"];
const A11Y_TEST_HOW = [
  "axe-core",
  "DevTools a11y tree",
  "DevTools a11y tree",
  "DevTools a11y tree",
  "Keyboard test",
  "Contrast checker",
  "Keyboard test",
];

/**
 * A demonstração é produto: quem abre um menu aqui dispara o mesmo evento que o
 * componente dispararia num app. O payload leva o IDENTIFICADOR do menu e do
 * item, nunca o rótulo traduzido — texto localizado partiria o mesmo evento em
 * um por idioma no GA4.
 *
 * `location` é a SEÇÃO onde o elemento está. Estes dois handlers atendem apenas
 * a demonstração, e é por isso que o valor é fixo dentro deles; preview vivo de
 * outra seção pede o `docs_<section-id>` daquela seção.
 */
function trackMenuOpenChange(menu: string, isOpen: boolean): void {
  track(isOpen ? "dropdown_menu_open" : "dropdown_menu_close", {
    component: "dropdown-menu",
    label: menu,
    location: "docs_demo",
  });
}

function trackMenuItemSelect(menu: string, item: string): () => void {
  return () =>
    track("dropdown_menu_item_select", {
      component: "dropdown-menu",
      label: item,
      menu,
      location: "docs_demo",
    });
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

export function DropdownMenuDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(dropdownMenuTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  // O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
  const screenReaderItems = useMemo(
    () =>
      Object.entries(
        (dropdownMenuTranslations as unknown as Record<
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
    componentSlug: "dropdown-menu",
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
      component_name: "dropdown-menu",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "dropdown-menu",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  // Estado para demos interativas.
  //
  // Os valores iniciais são os da story e os do snippet do painel Code: Nome
  // marcado, E-mail e Função não, e a aparência em "Claro". O e-mail nascia
  // marcado e o tema nascia em "Sistema" — a prévia dizia uma coisa e o código
  // logo abaixo dela dizia outra, que é a deriva medida no vanilla.
  const [showName, setShowName] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [theme, setTheme] = useState("light");

  // ─── Code strings ───────────────────────────────────────────────────────────

  const codeImport = `import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";`;

  const structureCode = tContent("anatomy.structureCode");

  const codeDefault = `<DropdownMenuItem>Perfil</DropdownMenuItem>`;

  const codeDestructive = `<DropdownMenuItem variant="destructive">
  Excluir conta
</DropdownMenuItem>`;

  const interfaceCode = `// DropdownMenu (base-ui/menu)
interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

interface DropdownMenuContentProps {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

interface DropdownMenuItemProps {
  variant?: "default" | "destructive";
  inset?: boolean;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
}`;

  // ─── Locale-aware column labels ─────────────────────────────────────────────

  const analyticsCols = {
    event: locale === "en" ? "Event" : locale === "es" ? "Evento" : "Evento",
    trigger: locale === "en" ? "Trigger" : locale === "es" ? "Disparo" : "Disparo",
    payload: "Payload",
  };

  return (
    <DocsPageLayout
      navGroups={navGroups}
      activeSection={activeId}
      componentSlug="dropdown-menu"
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
        <div className="nds-grid nds-w-full" data-spacing="md" style={{ "--grid-min": "9rem" } as CSSProperties}>
          {/* Basic */}
          <div
            className="nds-stack nds-min-h-20"
            data-spacing="sm"
            style={{ contain: "layout", position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.basic"))}
            </p>
            <DropdownMenu onOpenChange={(open) => trackMenuOpenChange("acoes", open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Conta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Conta</DropdownMenuLabel>
                  <DropdownMenuItem onClick={trackMenuItemSelect("acoes", "perfil")}>
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={trackMenuItemSelect("acoes", "configuracoes")}>
                    Configurações
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={trackMenuItemSelect("acoes", "sair")}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Checkbox */}
          <div
            className="nds-stack nds-min-h-20"
            data-spacing="sm"
            style={{ contain: "layout", position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withCheckbox"))}
            </p>
            <DropdownMenu onOpenChange={(open) => trackMenuOpenChange("colunas", open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* O rótulo diz DE QUE lista são as marcações; sem ele o menu
                    abre com três palavras soltas. As outras stacks o trazem. */}
                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={showName}
                  onCheckedChange={setShowName}
                >
                  Nome
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showEmail}
                  onCheckedChange={setShowEmail}
                >
                  E-mail
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showRole}
                  onCheckedChange={setShowRole}
                >
                  Função
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Radio */}
          <div
            className="nds-stack nds-min-h-20"
            data-spacing="sm"
            style={{ contain: "layout", position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withRadio"))}
            </p>
            <DropdownMenu onOpenChange={(open) => trackMenuOpenChange("tema", open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Tema
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuLabel>Aparência</DropdownMenuLabel>
                  <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Submenu */}
          <div
            className="nds-stack nds-min-h-20"
            data-spacing="sm"
            style={{ contain: "layout", position: "relative" }}
          >
            <p className="nds-text-caption nds-font-medium nds-text-muted-foreground">
              {DOMPurify.sanitize(tContent("demonstration.labels.withSubmenu"))}
            </p>
            <DropdownMenu onOpenChange={(open) => trackMenuOpenChange("submenu", open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="nds-w-full">
                  Ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={trackMenuItemSelect("submenu", "renomear")}>
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={trackMenuItemSelect("submenu", "pdf")}>
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={trackMenuItemSelect("submenu", "csv")}>
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
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
          tContent("anatomy.item6"),
          tContent("anatomy.item7"),
          tContent("anatomy.item8"),
          tContent("anatomy.item9"),
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
              element: tContent("usage.uxWriting.table.trigger.name"),
              rules: tContent("usage.uxWriting.table.trigger.format"),
              do: tContent("usage.uxWriting.table.trigger.good"),
              dont: tContent("usage.uxWriting.table.trigger.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.label.name"),
              rules: tContent("usage.uxWriting.table.label.format"),
              do: tContent("usage.uxWriting.table.label.good"),
              dont: tContent("usage.uxWriting.table.label.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.item.name"),
              rules: tContent("usage.uxWriting.table.item.format"),
              do: tContent("usage.uxWriting.table.item.good"),
              dont: tContent("usage.uxWriting.table.item.bad"),
            },
            {
              element: tContent("usage.uxWriting.table.destructive.name"),
              rules: tContent("usage.uxWriting.table.destructive.format"),
              do: tContent("usage.uxWriting.table.destructive.good"),
              dont: tContent("usage.uxWriting.table.destructive.bad"),
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
      {/*
        Os quatro previews instanciam o DropdownMenu de verdade (guideline 08
        §15). Antes eram imitações em texto: o "Do" desenhava um separador com
        `border-top` em `style` inline, e o "Don't" era a própria legenda
        repetida em itálico — quem lia via a frase, nunca o defeito.

        Dentro de um par, só o DEFEITO muda de um lado para o outro. O rótulo do
        gatilho acompanha o que o menu passou a listar ("Tudo" para a lista
        plana), e nunca vira um segundo erro: um gatilho mal escrito no lado
        errado ensinaria a lição da tabela de UX Writing no lugar desta.

        Os menus nascem FECHADOS. Menu que se abre sozinho ao carregar a página é
        justamente o que não se deve copiar, e abrir quatro de uma vez empilharia
        painéis por cima do texto da seção.
      */}
      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Conta</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Conta</DropdownMenuLabel>
                      <DropdownMenuItem>Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Configurações</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Equipe</DropdownMenuLabel>
                      <DropdownMenuItem>Convidar</DropdownMenuItem>
                      <DropdownMenuItem>Membros</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
            dontPreview: (
              // Dez itens planos, que é o número da legenda: com seis a lista
              // ainda parece curta, e o "vira lista de scroll" não aparece.
              <div style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Tudo</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuItem>Perfil</DropdownMenuItem>
                    <DropdownMenuItem>Configurações</DropdownMenuItem>
                    <DropdownMenuItem>Convidar</DropdownMenuItem>
                    <DropdownMenuItem>Membros</DropdownMenuItem>
                    <DropdownMenuItem>Faturas</DropdownMenuItem>
                    <DropdownMenuItem>Assinatura</DropdownMenuItem>
                    <DropdownMenuItem>Notificações</DropdownMenuItem>
                    <DropdownMenuItem>Integrações</DropdownMenuItem>
                    <DropdownMenuItem>Suporte</DropdownMenuItem>
                    <DropdownMenuItem>Sair</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
            doCaption: DOMPurify.sanitize(tContent("doDont.pair1.do")),
            dontCaption: DOMPurify.sanitize(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <div style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Ações</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
            dontPreview: (
              // O mesmo menu sem a marcação: a única diferença para o lado de cá
              // é o `variant`, que é exatamente o que a legenda cobra.
              <div style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Ações</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Excluir conta</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
        componentSlug="dropdown-menu"
        items={[
          {
            trackId: "default",
            name: tContent("variants.items.default"),
            description: stripHtml(tContent("variants.styles.default")),
            code: codeDefault,
            preview: (
              <div className="nds-text-caption nds-font-mono nds-text-muted-foreground">
                variant=&quot;default&quot;
              </div>
            ),
          },
          {
            trackId: "destructive",
            name: tContent("variants.items.destructive"),
            description: stripHtml(tContent("variants.styles.destructive")),
            code: codeDestructive,
            preview: (
              <div className="nds-text-caption nds-font-mono nds-text-destructive">
                variant=&quot;destructive&quot;
              </div>
            ),
          },
          {
            trackId: "withLabel",
            name: tContent("variants.items.withLabel.name"),
            description: tContent("variants.items.withLabel.description"),
            useWhen: tContent("variants.items.withLabel.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Conta</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuLabel>Conta</DropdownMenuLabel>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuLabel>Suporte</DropdownMenuLabel>
      <DropdownMenuItem>Documentação</DropdownMenuItem>
      <DropdownMenuItem>Sair</DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div className="nds-min-h-60" style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Conta</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Conta</DropdownMenuLabel>
                      <DropdownMenuItem>Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Configurações</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Suporte</DropdownMenuLabel>
                      <DropdownMenuItem>Documentação</DropdownMenuItem>
                      <DropdownMenuItem>Sair</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
          {
            trackId: "withCheckboxItems",
            name: tContent("variants.items.withCheckboxItems.name"),
            description: tContent("variants.items.withCheckboxItems.description"),
            useWhen: tContent("variants.items.withCheckboxItems.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Colunas</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
      <DropdownMenuCheckboxItem checked={showName} onCheckedChange={setShowName}>
        Nome
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={showEmail} onCheckedChange={setShowEmail}>
        E-mail
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={showRole} onCheckedChange={setShowRole}>
        Função
      </DropdownMenuCheckboxItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div className="nds-min-h-50" style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Colunas</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={showName}
                        onCheckedChange={setShowName}
                      >
                        Nome
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={showEmail}
                        onCheckedChange={setShowEmail}
                      >
                        E-mail
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={showRole}
                        onCheckedChange={setShowRole}
                      >
                        Função
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
          {
            trackId: "withRadioGroup",
            name: tContent("variants.items.withRadioGroup.name"),
            description: tContent("variants.items.withRadioGroup.description"),
            useWhen: tContent("variants.items.withRadioGroup.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Tema</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      <DropdownMenuLabel>Aparência</DropdownMenuLabel>
      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div className="nds-min-h-50" style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Tema</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                      <DropdownMenuLabel>Aparência</DropdownMenuLabel>
                      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          },
          {
            trackId: "withShortcuts",
            name: tContent("variants.items.withShortcuts.name"),
            description: tContent("variants.items.withShortcuts.description"),
            useWhen: tContent("variants.items.withShortcuts.use"),
            code: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Editar</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      Desfazer <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Copiar <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Colar <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
            preview: (
              <div className="nds-min-h-60" style={{ contain: "layout" }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Editar</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start">
                    {/* Três itens e um separador — o mesmo conjunto da story
                        `WithShortcuts` e do snippet do painel Code. A ficha
                        trazia um quarto item ("Refazer") que não existia em
                        nenhuma das duas outras superfícies. */}
                    <DropdownMenuItem>
                      Desfazer <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Copiar <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Colar <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            label: tContent("states.disabled.label"),
            trigger: toPlainText(tContent("states.disabled.trigger")),
            behavior: toPlainText(tContent("states.disabled.behavior")),
          },
          {
            label: tContent("states.checked.label"),
            trigger: toPlainText(tContent("states.checked.trigger")),
            behavior: toPlainText(tContent("states.checked.behavior")),
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
                name: "modal",
                type: tContent("props.table.modal.type"),
                defaultValue: tContent("props.table.modal.default"),
                required: tContent("props.table.modal.required"),
                description: DOMPurify.sanitize(tContent("props.table.modal.description")),
              },
              {
                name: "side",
                type: tContent("props.table.side.type"),
                defaultValue: tContent("props.table.side.default"),
                required: tContent("props.table.side.required"),
                description: DOMPurify.sanitize(tContent("props.table.side.description")),
              },
              {
                name: "align",
                type: tContent("props.table.align.type"),
                defaultValue: tContent("props.table.align.default"),
                required: tContent("props.table.align.required"),
                description: DOMPurify.sanitize(tContent("props.table.align.description")),
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
            token: "--popover",
            value: tContent("tokens.table.background.class"),
            description: tContent("tokens.table.background.part"),
          },
          {
            token: "--popover-foreground",
            value: tContent("tokens.table.foreground.class"),
            description: tContent("tokens.table.foreground.part"),
          },
          {
            token: "--border",
            value: tContent("tokens.table.border.class"),
            description: tContent("tokens.table.border.part"),
          },
          {
            token: "--elevation-md",
            value: tContent("tokens.table.shadow.class"),
            description: tContent("tokens.table.shadow.part"),
          },
          {
            token: "--radius",
            value: tContent("tokens.table.rounded.class"),
            description: tContent("tokens.table.rounded.part"),
          },
          {
            token: "--accent",
            value: tContent("tokens.table.itemHover.class"),
            description: tContent("tokens.table.itemHover.part"),
          },
          {
            token: "--destructive",
            value: tContent("tokens.table.destructive.class"),
            description: tContent("tokens.table.destructive.part"),
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
          { key: "Arrow Up / Arrow Down / Arrow Left / Arrow Right", description: toPlainText(tContent("accessibility.keyboard.arrows")) },
          { key: "Enter / Space", description: toPlainText(tContent("accessibility.keyboard.enter")) },
          { key: "Esc", description: toPlainText(tContent("accessibility.keyboard.escape")) },
          { key: "Home / End", description: toPlainText(tContent("accessibility.keyboard.homeEnd")) },
          { key: "A–Z", description: toPlainText(tContent("accessibility.keyboard.typeahead")) },
        ]}
      />

      {/* ── Relacionados ──────────────────────────────────────────── */}
      <DocsRelated
        title={tContent("related.title")}
        componentSlug="dropdown-menu"
        items={[
          {
            name: tContent("related.items.contextMenu.name"),
            description: toPlainText(tContent("related.items.contextMenu.description")),
            path: "?path=/docs/components-overlay-contextmenu--docs",
          },
          {
            name: tContent("related.items.menubar.name"),
            description: toPlainText(tContent("related.items.menubar.description")),
            path: "?path=/docs/components-navigation-menubar--docs",
          },
          {
            name: tContent("related.items.command.name"),
            description: toPlainText(tContent("related.items.command.description")),
            path: "?path=/docs/components-overlay-command--docs",
          },
          {
            name: tContent("related.items.popover.name"),
            description: toPlainText(tContent("related.items.popover.description")),
            path: "?path=/docs/components-overlay-popover--docs",
          },
          {
            name: tContent("related.items.select.name"),
            description: toPlainText(tContent("related.items.select.description")),
            path: "?path=/docs/components-form-select--docs",
          },
        ]}
      />

      {/* ── Notas ─────────────────────────────────────────────────── */}
      <DocsNotes
        title={tContent("notes.title")}
        componentSlug="dropdown-menu"
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
        cols={analyticsCols}
        items={[
          { event: "dropdown_menu_open",        trigger: "onOpenChange(true)",  payload: "component, label, location" },
          { event: "dropdown_menu_close",       trigger: "onOpenChange(false)", payload: "component, label, location" },
          { event: "dropdown_menu_item_select", trigger: "onClick no Item",     payload: "component, label, menu, location" },
          { event: "—",                         trigger: toPlainText(tContent("analytics.description")), payload: "—" },
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
              priority: tNav(priorityKeyMap[tContent("testes.functional.item4.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item5.action"),
              result: tContent("testes.functional.item5.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item5.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item6.action"),
              result: tContent("testes.functional.item6.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item6.priority")] ?? "common.high"),
            },
            {
              action: tContent("testes.functional.item7.action"),
              result: tContent("testes.functional.item7.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item7.priority")] ?? "common.medium"),
            },
            {
              action: tContent("testes.functional.item8.action"),
              result: tContent("testes.functional.item8.result"),
              priority: tNav(priorityKeyMap[tContent("testes.functional.item8.priority")] ?? "common.high"),
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
          items: [
            { story: tContent("testes.visual.item1.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item1.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item2.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item2.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item3.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item3.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item4.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item4.priority")] ?? "common.high") },
            { story: tContent("testes.visual.item5.story"), priority: tNav(priorityKeyMap[tContent("testes.visual.item5.priority")] ?? "common.medium") },
          ],
        }}
      />
    </DocsPageLayout>
  );
}

export default DropdownMenuDocs;
