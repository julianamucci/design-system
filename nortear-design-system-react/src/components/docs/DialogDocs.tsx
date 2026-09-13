import { useCallback, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { useActiveSection } from "@/lib/use-active-section";
import uiTranslations from "@/i18n/ui.json";
import dialogTranslations from "@shared/content/dialog/translations.json";

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
import { dialogCloseReason }    from "@/components/ui/dialog-close-reason";
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

/**
 * `location` responde DE ONDE VEIO o clique, e por isso é prop e não constante.
 *
 * As quatro chamadas desta página mandavam `docs_demo` — inclusive as de
 * Variantes, que renderizam componente vivo tanto quanto a Demonstração. O
 * parâmetro existe para cruzar com o `section_id` do `docs_section_viewed` e
 * com o meio do `data-track-id`, e respondendo sempre a mesma coisa ele não
 * cruzava com nada. O vocabulário é `docs_<section-id>`
 * (`docs/shared/guidelines/07-analytics.md`).
 */
type DocsLocation = "docs_demo" | "docs_variantes" | "docs_do_dont" | "docs_composicoes";

/**
 * Id ESTÁVEL de cada prévia viva, no vocabulário do vanilla (`demoId` em
 * `DialogDocs.ts` de lá) — nunca o texto do gatilho, que chega traduzido e
 * partiria o evento em três valores no GA4.
 *
 * O campo é `trigger_id`, e o tipo do evento o EXIGE e proíbe `label`
 * (`prd/dialog.md` §9). Até 2026-09-10 esta página mandava o id no campo
 * `label` — o nome que o AlertDialog e o Sheet também usavam até a dona
 * unificar os três, e o Drawer, em `trigger_id` no mesmo dia (regra em
 * `docs/shared/guidelines/18-overlay.md` §Analytics) —, e só dos dois lados
 * "do" do Do & Don't, com ids de par (`do-dont-pair1`) que não diziam o lado. A lista é fechada
 * para que um id fora do vocabulário das outras stacks reprove no build, e não
 * no relatório.
 *
 * Cobre as DEZ prévias da página, como o vanilla (`dialogTracking`). Até
 * 2026-09-10 o "sem rodapé", o "fechar próprio" e as duas composições abriam
 * sem rastro, porque o vanilla não lhes dava id — e o id do "fechar próprio"
 * de lá era `scroll-content`, trocado com o da prévia de rolagem.
 */
type DialogTriggerId =
  | "default"
  | "basic"
  | "with-form"
  | "scroll-content"
  | "no-footer"
  | "destructive"
  | "custom-close-in-footer"
  | "confirm-email"
  | "profile-edit"
  | "media-preview"
  | "do-dont-pair1-do"
  | "do-dont-pair1-dont"
  | "do-dont-pair2-do"
  | "do-dont-pair2-dont";

/** Id estável da ação primária, para o `action_label` — o mesmo do vanilla. */
type DialogActionId = "save" | "ok" | "delete" | "remove" | "continue" | "confirm-email";

/**
 * O `onOpenChange` que rastreia abrir e fechar de UMA prévia.
 *
 * Duas chamadas, e não uma com o nome do evento no ternário: o payload de cada
 * evento é outro tipo — o fechamento exige `reason` —, e a união só confere o
 * campo quando o nome é literal.
 */
function trackOpenChange(triggerId: DialogTriggerId, location: DocsLocation) {
  return (open: boolean, details?: { reason?: string }) => {
    if (open) {
      track("dialog_open", { component: "dialog", trigger_id: triggerId, location });
      return;
    }
    track("dialog_close", {
      component: "dialog",
      trigger_id: triggerId,
      reason: dialogCloseReason(details?.reason),
      location,
    });
  };
}

/** Clique na ação primária do rodapé, pelo id estável da ação. */
function trackAction(actionId: DialogActionId, location: DocsLocation) {
  track("dialog_action", { component: "dialog", action_label: actionId, location });
}

type DemoProps = {
  triggerId: DialogTriggerId;
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  location: DocsLocation;
  /**
   * Nota do corpo do painel — a chave `demonstration.labels.footerNote` do
   * conteúdo compartilhado, que existia nos três idiomas e não tinha
   * consumidor nesta stack.
   *
   * Opcional de propósito: no vanilla e no angular ela aparece SÓ na
   * Demonstração, e as prévias de Variantes trazem o corpo que o snippet ao
   * lado mostra. Passá-la também ali faria a prévia divergir do código
   * publicado, que é o defeito dominante desta campanha.
   */
  footerNote?: string;
  /**
   * Nome do botão de fechar. O primitivo tem um default cravado em português
   * (`closeLabel = "Fechar"`), então sem passar nada o X do canto continuava
   * dizendo "Fechar" para quem abre a página em inglês ou espanhol — o único
   * pedaço do painel que não seguia o idioma escolhido.
   */
  closeLabel: string;
  defaultOpen?: boolean;
};

/** O formulário da demonstração acrescenta dois campos rotulados e um valor de exemplo. */
type FormDemoProps = DemoProps & {
  fieldName: string;
  fieldEmail: string;
  sampleName: string;
};

function DefaultDemo({ triggerId, triggerLabel, title, description, cancel, action, location, footerNote, closeLabel, defaultOpen }: DemoProps) {
  return (
    <Dialog
      defaultOpen={defaultOpen}
      // Identificador do CENÁRIO, não o título. `title` chega traduzido, e texto
      // traduzido em payload parte um evento em três valores no GA4 — a
      // agregação some. Quem diz a seção é `location`; `trigger_id` diz qual
      // prévia. O `i18n_text_in_payload` não via este ponto porque o texto
      // chegava por prop: o portão lê a chamada de tradução DENTRO do payload,
      // e a indireção o cega.
      onOpenChange={trackOpenChange(triggerId, location)}
    >
      <DialogTrigger render={<Button variant="outline" />}>{triggerLabel}</DialogTrigger>
      <DialogContent closeLabel={closeLabel}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {footerNote && (
          <div
            data-slot="dialog-body"
            className="nds-dialog-body nds-text-body nds-text-muted-foreground"
          >
            {footerNote}
          </div>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{cancel}</DialogClose>
          {/* Mesma razão do `trigger_id`: `action` chega traduzido por prop. */}
          <Button onClick={() => trackAction("save", location)}>{action}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormDemo({ triggerId, triggerLabel, title, description, cancel, action, location, footerNote, closeLabel, fieldName, fieldEmail, sampleName }: FormDemoProps) {
  return (
    // Ver a nota em `DefaultDemo`: cenário, não título traduzido.
    <Dialog onOpenChange={trackOpenChange(triggerId, location)}>
      <DialogTrigger render={<Button variant="outline" />}>{triggerLabel}</DialogTrigger>
      <DialogContent closeLabel={closeLabel}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="nds-stack"
          data-spacing="sm"
          onSubmit={(e) => {
            e.preventDefault();
            // Mesma razão do `trigger_id`: `action` chega traduzido por prop.
            trackAction("save", location);
          }}
        >
          <div className="nds-stack" data-spacing="xs">
            <Label htmlFor="docs-dialog-name">{fieldName}</Label>
            <Input id="docs-dialog-name" defaultValue={sampleName} />
          </div>
          <div className="nds-stack" data-spacing="xs">
            <Label htmlFor="docs-dialog-email">{fieldEmail}</Label>
            <Input id="docs-dialog-email" type="email" />
          </div>
          {footerNote && (
            <p className="nds-text-caption nds-text-muted-foreground">{footerNote}</p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {cancel}
            </DialogClose>
            <Button type="submit">{action}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DialogDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  /*
   * `props.table.closeLabel` não existe no conteúdo compartilhado: a prop nasce
   * de um literal em português que estava CRAVADO no primitivo, e enquanto as
   * cinco stacks não a expuserem ela não é contrato de todas. Override é
   * exatamente o mecanismo previsto para isso — e vale por ser descrição de
   * prop, nunca snippet: `*Code` em override fica preso a uma stack.
   */
  const { t: tContent, locale } = useTranslation(dialogTranslations, {
    "pt-BR": {
      "props.table.closeLabel":
        "Nome do botão de fechar. No Content vai como texto para leitor de tela; no Footer é o rótulo visível.",
    },
    en: {
      "props.table.closeLabel":
        "Name of the close button. On Content it is screen-reader text; on Footer it is the visible label.",
    },
    es: {
      "props.table.closeLabel":
        "Nombre del botón de cerrar. En Content es texto para lector de pantalla; en Footer es la etiqueta visible.",
    },
  });

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(
    () => navGroups.flatMap((g) => g.sections.map((s) => s.id)),
    [navGroups]
  );

  useSeoEffect({
    title: tContent("seo.title"),
    description: tContent("seo.description"),
    locale,
    componentSlug: "dialog",
    aiSummary: tContent("seo.aiSummary"),
    aiEntities: tContent("seo.aiEntities"),
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: "Overlay", item: "/components/overlay" },
      { name: "Dialog" },
    ],
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "dialog",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "dialog",
        locale,
      });
    },
    [locale]
  );

  const activeId = useActiveSection(allIds, handleSectionChange);

  const codeImportBasic = `import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";`;

  // O snippet anterior nomeava outra stack — cada página é lida sozinha — e
  // ensinava um `max-height` inline, que vence a folha e sai do tema, da
  // densidade e do zoom. O teto, o overflow e a folga da barra vêm todos da
  // classe compartilhada.
  const codeImportWithScroll = `<DialogContent>
  <DialogHeader>...</DialogHeader>
  <div
    className="nds-dialog-body nds-dialog-body-scroll"
    tabIndex={0}
    role="group"
    aria-label="Termos de uso"
  >
    {/* conteúdo longo */}
  </div>
  <DialogFooter>...</DialogFooter>
</DialogContent>`;

  const codeDefault = `<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Editar perfil</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

  const codeWithForm = `<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Editar perfil</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
      </DialogDescription>
    </DialogHeader>
    <form className="nds-stack" data-spacing="sm" onSubmit={onSubmit}>
      <div className="nds-stack" data-spacing="xs">
        <Label htmlFor="dialog-name">Nome</Label>
        <Input id="dialog-name" defaultValue="Maria Silva" />
      </div>
      <div className="nds-stack" data-spacing="xs">
        <Label htmlFor="dialog-email">E-mail</Label>
        <Input id="dialog-email" type="email" />
      </div>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit">Salvar alterações</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`;

  const codeNoFooter = `<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Sobre este recurso</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sobre este recurso</DialogTitle>
      <DialogDescription>
        Detalhes técnicos exibidos para fins informativos. Sem ações.
      </DialogDescription>
    </DialogHeader>
    <div
      data-slot="dialog-body"
      className="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
      data-spacing="sm"
    >
      O fechamento ocorre via X, Escape ou clique no overlay.
    </div>
  </DialogContent>
</Dialog>`;

  const codeCustomCloseInFooter = `<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Abrir guia</DialogTrigger>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>Próximos passos</DialogTitle>
      <DialogDescription>
        Continue o fluxo ou volte ao início.
      </DialogDescription>
    </DialogHeader>
    <div
      data-slot="dialog-body"
      className="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
      data-spacing="sm"
    >
      O guia continua disponível no menu de ajuda.
    </div>
    {/* Secundários primeiro, primária por último: o rodapé empilha ao
        contrário no estreito e alinha à direita no largo. O fechar sai do
        próprio rodapé, em ghost — a variante da ação terciária. */}
    <DialogFooter showCloseButton>
      <Button variant="outline">Voltar</Button>
      <Button>Continuar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

  const codeCustomizationTokens = `/* globals.css */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --foreground: 0 0% 3.9%;
  --muted: 0 0% 96.1%;
  --border: 0 0% 89.8%;
  --radius: 0.75rem;
}`;

  const interfaceCode = `// Dialog (Root)
interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

// DialogContent
interface DialogContentProps extends DialogPrimitive.Popup.Props {
  showCloseButton?: boolean; // default: true
  closeLabel?: string;       // default: "Fechar"
  className?: string;
  children: React.ReactNode;
}

// DialogFooter — secundários primeiro, primário por ÚLTIMO no DOM
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean; // default: false
  closeLabel?: string;       // default: "Fechar"
}

// DialogTitle / DialogDescription
interface DialogTitleProps extends DialogPrimitive.Title.Props {}
interface DialogDescriptionProps extends DialogPrimitive.Description.Props {}`;

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
        <div className="nds-cluster" data-justify="center" data-spacing="md" style={{ flexWrap: "wrap" }}>
          <DefaultDemo
            triggerId="default"
            location="docs_demo"
            footerNote={tContent("demonstration.labels.footerNote")}
            triggerLabel={tContent("demonstration.labels.triggerLabel")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            action={tContent("demonstration.labels.action")}
            closeLabel={tContent("demonstration.labels.close")}
          />
          {/*
            O vanilla mostra UM painel na Demonstração; este segundo é o mesmo
            exemplo da variante com formulário, e por isso leva o id dela —
            `location` é quem separa as duas séries.
          */}
          <FormDemo
            triggerId="with-form"
            location="docs_demo"
            footerNote={tContent("demonstration.labels.footerNote")}
            triggerLabel={tContent("demonstration.labels.triggerLabel")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            action={tContent("demonstration.labels.action")}
            closeLabel={tContent("demonstration.labels.close")}
            fieldName={tContent("demonstration.labels.fieldName")}
            fieldEmail={tContent("demonstration.labels.fieldEmail")}
            sampleName={tContent("demonstration.labels.samplePersonName")}
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
            tContent("usage.guidelines.item6"),
          ],
        }}
        scenarios={{
          title: tContent("usage.scenarios.title"),
          cols: {
            scenario: tContent("usage.scenarios.cols.scenario"),
            use: tContent("usage.scenarios.cols.use"),
            alternative: tContent("usage.scenarios.cols.alternative"),
          },
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
            {
              element: tContent("usage.uxWriting.table.srOnly.name"),
              rules: tContent("usage.uxWriting.table.srOnly.format"),
              do: tContent("usage.uxWriting.table.srOnly.good"),
              dont: tContent("usage.uxWriting.table.srOnly.bad"),
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
            stripHtml(tContent("usage.dont.item4")),
          ],
        }}
      />

      {/*
        Os quatro previews INSTANCIAM o componente, e é isso que a guideline 08
        §15 cobra: toda seção com exemplo traz componente vivo. Os dois lados
        "do" chamavam `<DefaultDemo>`, um wrapper local — o Dialog renderizava,
        mas o par ficava assimétrico (um lado componente, o outro em linha) e o
        leitor comparava duas construções diferentes em vez de dois conteúdos
        diferentes. As outras stacks montam os quatro em linha; esta agora
        também.
      */}
      <DocsDoDont
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            // Os QUATRO lados rastreiam, com o id de cada um: o contraexemplo
            // é componente vivo como o exemplo, e quem abre o lado errado para
            // ver o defeito é tão leitor quanto quem abre o certo.
            doPreview: (
              <Dialog onOpenChange={trackOpenChange("do-dont-pair1-do", "docs_do_dont")}>
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.triggerLabel")}
                </DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.title")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.description")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.cancel")}
                    </DialogClose>
                    <Button onClick={() => trackAction("save", "docs_do_dont")}>
                      {tContent("demonstration.labels.action")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
            dontPreview: (
              <Dialog onOpenChange={trackOpenChange("do-dont-pair1-dont", "docs_do_dont")}>
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.vagueTitle")}
                </DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.vagueTitle")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.vagueDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  {/*
                    "Não" e "OK" continuam literais: o par vago é o defeito que
                    este lado existe para mostrar, e não há chave para eles no
                    conteúdo compartilhado.
                  */}
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Não</DialogClose>
                    <Button onClick={() => trackAction("ok", "docs_do_dont")}>OK</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
            doCaption: stripHtml(tContent("doDont.pair1.do")),
            dontCaption: stripHtml(tContent("doDont.pair1.dont")),
          },
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <Dialog onOpenChange={trackOpenChange("do-dont-pair2-do", "docs_do_dont")}>
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.triggerLabel")}
                </DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.title")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.description")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.cancel")}
                    </DialogClose>
                    <Button onClick={() => trackAction("save", "docs_do_dont")}>
                      {tContent("demonstration.labels.action")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
            dontPreview: (
              <Dialog onOpenChange={trackOpenChange("do-dont-pair2-dont", "docs_do_dont")}>
                <DialogTrigger render={<Button variant="destructive" />}>
                  {tContent("demonstration.labels.destructiveTitle")}
                </DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.destructiveTitle")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.destructiveDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  {/* "Excluir" segue literal — não há chave de ação destrutiva
                      no conteúdo compartilhado. */}
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.cancel")}
                    </DialogClose>
                    <Button variant="destructive" onClick={() => trackAction("delete", "docs_do_dont")}>
                      Excluir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: toPlainText(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      <DocsImport
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withScroll")}
        secondaryCode={codeImportWithScroll}
      />

      <DocsCompositions
        id="variantes"
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="dialog"
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: (
              <DefaultDemo
                triggerId="basic"
                location="docs_variantes"
                title={tContent("demonstration.labels.title")}
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
                closeLabel={tContent("demonstration.labels.close")}
              />
            ),
          },
          {
            name: "withForm",
            description: stripHtml(tContent("variants.items.withForm")),
            code: codeWithForm,
            preview: (
              <FormDemo
                triggerId="with-form"
                location="docs_variantes"
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
                closeLabel={tContent("demonstration.labels.close")}
                fieldName={tContent("demonstration.labels.fieldName")}
                fieldEmail={tContent("demonstration.labels.fieldEmail")}
                sampleName={tContent("demonstration.labels.samplePersonName")}
              />
            ),
          },
          {
            name: "withScrollContent",
            description: stripHtml(tContent("variants.items.withScrollContent")),
            preview: (
              // `scroll-content` é o id que o vanilla declara para esta
              // variante. A ação "Aceitar" fica sem `dialog_action`: o vanilla
              // não a rastreia, e o vocabulário de ações não tem id para ela.
              <Dialog onOpenChange={trackOpenChange("scroll-content", "docs_variantes")}>
                {/* "Ver termos" segue literal: não há chave de gatilho para o
                    cenário de termos no conteúdo compartilhado. */}
                <DialogTrigger render={<Button variant="outline" />}>
                  Ver termos
                </DialogTrigger>
                <DialogContent
                  className="nds-max-w-md"
                  closeLabel={tContent("demonstration.labels.close")}
                >
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.termsTitle")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.termsDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  {/*
                    O teto e a rolagem saem de `.nds-dialog-body-scroll`, e não
                    de um `max-height` inline: inline vence a folha, então o
                    valor cravado saía do tema, da densidade e do zoom. A classe
                    já traz `max-block-size`, `overflow-y` e a folga lateral
                    que o `nds-pr-2` remontava à mão.

                    `tabindex="0"` porque a caixa rola (WCAG 2.1.1), e o papel
                    só entra acompanhado de nome — `group` e não `region`,
                    porque marco aninhado num diálogo já nomeado não acrescenta
                    navegação. O nome descreve O QUE rola, não que rola.
                  */}
                  <div
                    data-slot="dialog-body"
                    tabIndex={0}
                    role="group"
                    aria-label={tContent("demonstration.labels.termsTitle")}
                    className="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
                    data-spacing="sm"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <p key={i}>Cláusula {i + 1}. Lorem ipsum dolor sit amet.</p>
                    ))}
                  </div>
                  {/*
                    "Recusar", e não "Cancelar": o par de um documento que se
                    aceita é aceitar/recusar. É o rótulo que vanilla — a
                    referência cross-stack — usa nesta mesma variante, e a
                    divergência só apareceu quando a outra prévia que consumia
                    a chave saiu daqui.
                  */}
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.decline")}
                    </DialogClose>
                    <Button>{tContent("demonstration.labels.accept")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: "noFooter",
            description: stripHtml(tContent("variants.items.noFooter")),
            code: codeNoFooter,
            // Sem ação a rastrear — não há rodapé —, mas abrir e fechar contam:
            // é aqui que o `reason` diz por onde o leitor sai de um painel sem
            // botão próprio.
            preview: (
              <Dialog onOpenChange={trackOpenChange("no-footer", "docs_variantes")}>
                {/* O gatilho REPETE o título: não há ação a nomear depois. */}
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.aboutTitle")}
                </DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>
                      {tContent("demonstration.labels.aboutTitle")}
                    </DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.aboutDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    data-slot="dialog-body"
                    className="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
                    data-spacing="sm"
                  >
                    {tContent("demonstration.labels.aboutBody")}
                  </div>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: "withDestructiveAction",
            description: stripHtml(tContent("variants.items.withDestructiveAction")),
            preview: (
              <Dialog onOpenChange={trackOpenChange("destructive", "docs_variantes")}>
                {/* "Remover" (gatilho) não tem chave — só a ação do rodapé tem. */}
                <DialogTrigger render={<Button variant="outline" />}>Remover</DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.removeItemTitle")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.removeItemDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.cancel")}
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => trackAction("remove", "docs_variantes")}
                    >
                      {tContent("demonstration.labels.removeItemAction")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: "customCloseInFooter",
            description: stripHtml(tContent("variants.items.customCloseInFooter")),
            code: codeCustomCloseInFooter,
            // `custom-close-in-footer`, o id que o vanilla corrigiu em
            // 2026-09-10 — antes ele mandava `scroll-content` daqui, o id da
            // prévia de rolagem. O "Fechar" do rodapé chega ao `reason` como
            // `close-button`, pela mesma dedução dos outros painéis.
            preview: (
              <Dialog onOpenChange={trackOpenChange("custom-close-in-footer", "docs_variantes")}>
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.guideTrigger")}
                </DialogTrigger>
                <DialogContent showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>
                      {tContent("demonstration.labels.guideTitle")}
                    </DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.guideDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    data-slot="dialog-body"
                    className="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
                    data-spacing="sm"
                  >
                    {tContent("demonstration.labels.guideBody")}
                  </div>
                  {/*
                   * O "Fechar" é a ação de MENOR ênfase das três, então abre a
                   * lista; a primária a fecha. O rodapé empilha ao contrário no
                   * estreito e alinha à direita no largo — das duas leituras sai
                   * "Continuar" em cima e à direita.
                   *
                   * O fechar vem do `showCloseButton` do próprio Footer, que o
                   * emite antes dos filhos e em `ghost` — a variante da ação
                   * terciária pela tabela da guideline 06.
                   */}
                  <DialogFooter
                    showCloseButton
                    closeLabel={tContent("demonstration.labels.close")}
                  >
                    <Button variant="outline">
                      {tContent("demonstration.labels.back")}
                    </Button>
                    <Button onClick={() => trackAction("continue", "docs_variantes")}>
                      {tContent("demonstration.labels.continueAction")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            trackId: "confirmEmail",
            name: tContent("variants.items.confirmEmail.name"),
            description: tContent("variants.items.confirmEmail.description"),
            useWhen: tContent("variants.items.confirmEmail.use"),
            code: `<Dialog>
  <DialogTrigger render={<Button />}>Enviar link</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar e-mail</DialogTitle>
      <DialogDescription>
        Verifique o endereço antes de enviar o link de acesso.
      </DialogDescription>
    </DialogHeader>
    <p className="nds-text-body">
      Vamos enviar um link para maria@exemplo.com.
    </p>
    <DialogFooter>
      <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
      <Button>Enviar link</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
            preview: (
              <Dialog onOpenChange={trackOpenChange("confirm-email", "docs_variantes")}>
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.confirmEmailAction")}
                </DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.confirmEmailTitle")}</DialogTitle>
                    {/* Descrição e corpo seguem literais: o conteúdo
                        compartilhado tem título e ação deste cenário, não o
                        texto de orientação nem o endereço de exemplo. */}
                    <DialogDescription>
                      Verifique o endereço antes de enviar o link de acesso.
                    </DialogDescription>
                  </DialogHeader>
                  <p className="nds-text-body">
                    Vamos enviar um link para maria@exemplo.com.
                  </p>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.cancel")}
                    </DialogClose>
                    <Button onClick={() => trackAction("confirm-email", "docs_variantes")}>
                      {tContent("demonstration.labels.confirmEmailAction")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
        ]}
      />

      {/*
        As duas composições rastreiam abrir e fechar com `location:
        "docs_composicoes"`, como no vanilla. Nenhuma manda `dialog_action`: a
        de mídia não tem rodapé, e o "Salvar" do perfil também não é rastreado
        lá.
      */}
      <DocsCompositions
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="dialog"
        items={[
          {
            trackId: "profileEdit",
            name: tContent("variants.compositions.profileEdit.name"),
            description: tContent("variants.compositions.profileEdit.description"),
            useWhen: tContent("variants.compositions.profileEdit.use"),
            code: `<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Editar perfil</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais.
      </DialogDescription>
    </DialogHeader>
    <form className="nds-grid" data-spacing="md" onSubmit={(e) => e.preventDefault()}>
      <div className="nds-stack" data-spacing="sm">
        <Label htmlFor="profile-name">Nome completo</Label>
        <Input id="profile-name" defaultValue="Maria Silva" />
      </div>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit">Salvar alterações</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`,
            preview: (
              <Dialog onOpenChange={trackOpenChange("profile-edit", "docs_composicoes")}>
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.triggerLabel")}
                </DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.title")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.description")}
                    </DialogDescription>
                  </DialogHeader>
                  {/*
                    O rodapé fica DENTRO do form: é o que faz o Enter em
                    qualquer campo disparar a ação primária, e é o que separa
                    esta composição de um painel com dois botões soltos.
                  */}
                  <form
                    className="nds-grid"
                    data-spacing="md"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="nds-stack" data-spacing="sm">
                      <Label htmlFor="profile-name">
                        {tContent("demonstration.labels.fieldFullName")}
                      </Label>
                      <Input
                        id="profile-name"
                        defaultValue={tContent("demonstration.labels.samplePersonName")}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose render={<Button type="button" variant="outline" />}>
                        {tContent("demonstration.labels.cancel")}
                      </DialogClose>
                      <Button type="submit">{tContent("demonstration.labels.action")}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            trackId: "mediaPreview",
            name: tContent("variants.compositions.mediaPreview.name"),
            description: tContent("variants.compositions.mediaPreview.description"),
            useWhen: tContent("variants.compositions.mediaPreview.use"),
            code: `<Dialog>
  <DialogTrigger render={<Button variant="outline" />}>Pré-visualizar</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Capa do post</DialogTitle>
      <DialogDescription>
        Pré-visualização em tamanho real.
      </DialogDescription>
    </DialogHeader>
    <div className="nds-w-full nds-bg-muted nds-rounded-md nds-text-caption nds-text-muted-foreground" style={{ aspectRatio: '16/9', display: 'grid', placeItems: 'center' }}>
      Pré-visualização da mídia
    </div>
  </DialogContent>
</Dialog>`,
            preview: (
              <Dialog onOpenChange={trackOpenChange("media-preview", "docs_composicoes")}>
                {/* Cenário de mídia sem chave no conteúdo compartilhado:
                    gatilho, título e descrição seguem literais. */}
                <DialogTrigger render={<Button variant="outline" />}>Pré-visualizar</DialogTrigger>
                <DialogContent closeLabel={tContent("demonstration.labels.close")}>
                  <DialogHeader>
                    <DialogTitle>Capa do post</DialogTitle>
                    <DialogDescription>
                      Pré-visualização em tamanho real.
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    className="nds-w-full nds-bg-muted nds-rounded-md nds-text-caption nds-text-muted-foreground"
                    style={{ aspectRatio: "16/9", display: "grid", placeItems: "center" }}
                  >
                    Pré-visualização da mídia
                  </div>
                </DialogContent>
              </Dialog>
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
          { label: tContent("states.closed.label"),                trigger: toPlainText(tContent("states.closed.trigger")),                behavior: toPlainText(tContent("states.closed.behavior"))},
          { label: tContent("states.opening.label"),               trigger: toPlainText(tContent("states.opening.trigger")),                          behavior: toPlainText(tContent("states.opening.behavior")) },
          { label: tContent("states.open.label"),                  trigger: toPlainText(tContent("states.open.trigger")),                  behavior: toPlainText(tContent("states.open.behavior"))},
          { label: tContent("states.closing.label"),               trigger: toPlainText(tContent("states.closing.trigger")),                          behavior: toPlainText(tContent("states.closing.behavior")) },
          { label: tContent("states.withCloseButtonHidden.label"), trigger: toPlainText(tContent("states.withCloseButtonHidden.trigger")), behavior: toPlainText(tContent("states.withCloseButtonHidden.behavior"))},
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
              { name: "open",         type: "boolean",                  defaultValue: "—",     required: "Não", description: toPlainText(tContent("props.table.open")) },
              { name: "defaultOpen",  type: "boolean",                  defaultValue: "false", required: "Não", description: tContent("props.table.defaultOpen") },
              { name: "onOpenChange", type: "(open: boolean) => void",  defaultValue: "—",     required: "Não", description: tContent("props.table.onOpenChange") },
              { name: "children",     type: "React.ReactNode",          defaultValue: "—",     required: "Sim", description: tContent("props.table.children") },
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
              { name: "showCloseButton", type: "boolean",         defaultValue: "true", required: "Não", description: toPlainText(tContent("props.table.showCloseButtonContent")) },
              { name: "closeLabel",      type: "string",          defaultValue: '"Fechar"', required: "Não", description: tContent("props.table.closeLabel") },
              { name: "className",       type: "string",          defaultValue: "—",    required: "Não", description: tContent("props.table.className") },
              { name: "children",        type: "React.ReactNode", defaultValue: "—",    required: "Sim", description: tContent("props.table.children") },
            ],
          },
          {
            title: tContent("props.footerTitle"),
            cols: {
              prop: tContent("props.table.prop"),
              type: tContent("props.table.type"),
              default: tContent("props.table.default"),
              required: tContent("props.table.required"),
              description: tContent("props.table.description"),
            },
            items: [
              { name: "showCloseButton", type: "boolean", defaultValue: "false", required: "Não", description: toPlainText(tContent("props.table.showCloseButtonFooter")) },
              { name: "closeLabel",      type: "string", defaultValue: '"Fechar"', required: "Não", description: tContent("props.table.closeLabel") },
              { name: "className",       type: "string", defaultValue: "—",    required: "Não", description: tContent("props.table.className") },
            ],
          },
          {
            title: tContent("props.titleDescriptionTitle"),
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
        ]}
        interfaceCode={interfaceCode}
        extensibilityTitle={tContent("props.extensibilityTitle")}
        extensibilityNotes={stripHtml(tContent("props.extensibility"))}
      />

      <DocsTokens
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--popover",            value: ".nds-dialog-content",   description: tContent("tokens.table.popover") },
          { token: "--popover-foreground", value: ".nds-dialog-content",   description: tContent("tokens.table.popoverForeground") },
          { token: "--foreground",         value: ".nds-dialog-content",   description: tContent("tokens.table.foreground") },
          { token: "--muted",              value: ".nds-dialog-footer",    description: tContent("tokens.table.muted") },
          { token: "--border",             value: ".nds-dialog-footer",    description: tContent("tokens.table.border") },
          { token: "--radius-card",        value: ".nds-dialog-content",   description: tContent("tokens.table.radius") },
          { token: "--overlay",            value: ".nds-dialog-overlay",   description: tContent("tokens.table.overlay") },
          { token: "--z-modal",            value: ".nds-dialog-content",   description: tContent("tokens.table.zIndex") },
          { token: "--duration-base",      value: ".nds-dialog-content",   description: tContent("tokens.table.duration") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      <DocsAccessibility
        summary={stripHtml(tContent("accessibility.summary"))}
        items={[
          stripHtml(tContent("accessibility.item1")),
          stripHtml(tContent("accessibility.item2")),
          stripHtml(tContent("accessibility.item3")),
          stripHtml(tContent("accessibility.item4")),
          stripHtml(tContent("accessibility.item5")),
          stripHtml(tContent("accessibility.item6")),
        ]}
        keyboardTitle={tContent("accessibility.keyboardTitle")}
        keyboardItems={[
          { key: "Escape",    description: tContent("keyboard.escape") },
          { key: "Tab",       description: tContent("keyboard.tab") },
          { key: "Shift+Tab", description: tContent("keyboard.shiftTab") },
          { key: "Enter",     description: tContent("keyboard.enter") },
        ]}
      />

      <DocsRelated
        items={[
          { name: "AlertDialog", description: toPlainText(tContent("related.alertDialog")), path: "?path=/docs/components-overlay-alertdialog--docs" },
          { name: "Sheet",       description: toPlainText(tContent("related.sheet")),                  path: "?path=/docs/components-overlay-sheet--docs" },
          { name: "Popover",     description: toPlainText(tContent("related.popover")),                path: "?path=/docs/components-overlay-popover--docs" },
          { name: "Form",        description: toPlainText(tContent("related.form")),                   path: "?path=/docs/components-form-form--docs" },
          { name: "Drawer",      description: toPlainText(tContent("related.drawer")),                 path: "?path=/docs/components-overlay-drawer--docs" },
        ]}
      />

      <DocsNotes
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
          { event: tContent("analytics.table.close"),         trigger: toPlainText(tContent("analytics.table.closeTrigger")),         payload: tContent("analytics.table.closePayload") },
          { event: tContent("analytics.table.action"),        trigger: toPlainText(tContent("analytics.table.actionTrigger")),        payload: tContent("analytics.table.actionPayload") },
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
          // Cinco: `testes.visual.item6` descrevia a variante WithScrollingOverlay,
          // rota retirada em 2026-09-08. A chave ainda existe no conteúdo
          // compartilhado, que não é desta stack — por isso a lista para no cinco
          // em vez de contar o que o JSON tem.
          items: [1, 2, 3, 4, 5].map((i) => ({
            story: tContent(`testes.visual.item${i}.story`),
            priority: tNav(priorityKeyMap[tContent(`testes.visual.item${i}.priority`)] ?? "common.high"),
          })),
        }}
      />
    </DocsPageLayout>
  );
}
