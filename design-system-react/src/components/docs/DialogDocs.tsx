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
import { DocsVariants }      from "@/components/docs/shared/sections/DocsVariants";
import { DocsCompositions }  from "@/components/docs/shared/sections/DocsCompositions";
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


type DemoProps = {
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  defaultOpen?: boolean;
};

function DefaultDemo({ triggerLabel, title, description, cancel, action, defaultOpen }: DemoProps) {
  return (
    <Dialog
      defaultOpen={defaultOpen}
      onOpenChange={(open) =>
        track(open ? "dialog_open" : "dialog_close", {
          component: "dialog",
          label: title,
          ...(open ? {} : { reason: "user" }),
          location: "docs:demo",
        })
      }
    >
      <DialogTrigger render={<Button variant="outline" />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{cancel}</DialogClose>
          <Button
            onClick={() =>
              track("dialog_action", {
                component: "dialog",
                action_label: action,
                location: "docs:demo",
              })
            }
          >
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormDemo({ triggerLabel, title, description, cancel, action }: DemoProps) {
  return (
    <Dialog
      onOpenChange={(open) =>
        open &&
        track("dialog_open", {
          component: "dialog",
          label: title,
          location: "docs:demo:form",
        })
      }
    >
      <DialogTrigger render={<Button variant="outline" />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            track("dialog_action", {
              component: "dialog",
              action_label: action,
              location: "docs:demo:form",
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="docs-dialog-name">Nome</Label>
            <Input id="docs-dialog-name" defaultValue="Maria Silva" />
          </div>
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
  const { t: tContent, locale } = useTranslation(dialogTranslations);

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
    aiIntent: tContent("seo.aiIntent"),
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

  const codeImportWithScroll = `// React/Svelte: scroll interno manual
<DialogContent>
  <DialogHeader>...</DialogHeader>
  <div className="max-h-[60vh] overflow-y-auto">{/* conteúdo longo */}</div>
  <DialogFooter>...</DialogFooter>
</DialogContent>`;

  const codeDefault = `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

  const codeWithForm = `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais.
      </DialogDescription>
    </DialogHeader>
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Input defaultValue="Maria Silva" />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit">Salvar alterações</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`;

  const codeNoFooter = `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Saiba mais</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sobre este recurso</DialogTitle>
      <DialogDescription>
        Visualize detalhes sem sair da tela atual.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`;

  const codeCustomCloseInFooter = `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </DialogTrigger>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    <DialogFooter showCloseButton>
      <Button>Salvar alterações</Button>
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
  className?: string;
  children: React.ReactNode;
}

// DialogFooter
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean; // default: false
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
          installNote="npx shadcn@latest add dialog"
        />
      }
    >
      <DocsDemonstration title={tContent("demonstration.title")}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <DefaultDemo
            triggerLabel={tContent("demonstration.labels.triggerLabel")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            action={tContent("demonstration.labels.action")}
          />
          <FormDemo
            triggerLabel={tContent("demonstration.labels.triggerLabel")}
            title={tContent("demonstration.labels.title")}
            description={tContent("demonstration.labels.description")}
            cancel={tContent("demonstration.labels.cancel")}
            action={tContent("demonstration.labels.action")}
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
          tContent("anatomy.item10"),
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

      <DocsDoDont
        title={tContent("doDont.title")}
        pairs={[
          {
            doLabel: tNav("common.do"),
            dontLabel: tNav("common.dont"),
            doPreview: (
              <DefaultDemo
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
              />
            ),
            dontPreview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>Atenção</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atenção</DialogTitle>
                    <DialogDescription>Aqui você pode mexer em várias coisas.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Não</DialogClose>
                    <Button>OK</Button>
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
              <DefaultDemo
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
              />
            ),
            dontPreview: (
              <Dialog>
                <DialogTrigger render={<Button variant="destructive" />}>
                  Excluir conta
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir conta</DialogTitle>
                    <DialogDescription>
                      Esta ação é permanente.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                    <Button variant="destructive">Excluir</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
            doCaption: stripHtml(tContent("doDont.pair2.do")),
            dontCaption: stripHtml(tContent("doDont.pair2.dont")),
          },
        ]}
      />

      <DocsImport
        title={tContent("import.title")}
        description={tContent("import.basic")}
        code={codeImportBasic}
        secondaryDescription={tContent("import.withScroll")}
        secondaryCode={codeImportWithScroll}
      />

      <DocsVariants
        title={tContent("variants.title")}
        items={[
          {
            name: "default",
            description: stripHtml(tContent("variants.items.default")),
            code: codeDefault,
            preview: (
              <DefaultDemo
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
              />
            ),
          },
          {
            name: "withForm",
            description: stripHtml(tContent("variants.items.withForm")),
            code: codeWithForm,
            preview: (
              <FormDemo
                triggerLabel={tContent("demonstration.labels.triggerLabel")}
                title={tContent("demonstration.labels.title")}
                description={tContent("demonstration.labels.description")}
                cancel={tContent("demonstration.labels.cancel")}
                action={tContent("demonstration.labels.action")}
              />
            ),
          },
          {
            name: "withScrollContent",
            description: stripHtml(tContent("variants.items.withScrollContent")),
            preview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>
                  Ver termos
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Termos de uso</DialogTitle>
                    <DialogDescription>
                      Leia atentamente antes de aceitar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[40vh] overflow-y-auto pr-2 text-sm text-muted-foreground space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <p key={i}>Cláusula {i + 1}. Lorem ipsum dolor sit amet.</p>
                    ))}
                  </div>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.cancel")}
                    </DialogClose>
                    <Button>Aceitar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: "noFooter",
            description: stripHtml(tContent("variants.items.noFooter")),
            code: codeNoFooter,
            preview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>
                  Saiba mais
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sobre este recurso</DialogTitle>
                    <DialogDescription>
                      Visualize detalhes sem sair da tela atual.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: "withDestructiveAction",
            description: stripHtml(tContent("variants.items.withDestructiveAction")),
            preview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>Remover</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remover item da lista</DialogTitle>
                    <DialogDescription>
                      O item será removido desta lista.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tContent("demonstration.labels.cancel")}
                    </DialogClose>
                    <Button variant="destructive">Remover item</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: "customCloseInFooter",
            description: stripHtml(tContent("variants.items.customCloseInFooter")),
            code: codeCustomCloseInFooter,
            preview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>
                  {tContent("demonstration.labels.triggerLabel")}
                </DialogTrigger>
                <DialogContent showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>{tContent("demonstration.labels.title")}</DialogTitle>
                    <DialogDescription>
                      {tContent("demonstration.labels.description")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton>
                    <Button>{tContent("demonstration.labels.action")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
        ]}
      />

      <DocsCompositions
        title={tContent("variants.compositionsTitle")}
        useWhenLabel={tNav("common.useWhen")}
        componentSlug="dialog"
        items={[
          {
            name: tContent("variants.compositions.confirmEmail.name"),
            description: tContent("variants.compositions.confirmEmail.description"),
            useWhen: tContent("variants.compositions.confirmEmail.use"),
            code: `<Dialog>
  <DialogTrigger asChild>
    <Button>Enviar link</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar e-mail</DialogTitle>
      <DialogDescription>
        Verifique o endereço antes de enviar o link de acesso.
      </DialogDescription>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">
      Vamos enviar um link para maria@exemplo.com.
    </p>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button>Enviar link</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
            preview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>Enviar link</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar e-mail</DialogTitle>
                    <DialogDescription>
                      Verifique o endereço antes de enviar o link de acesso.
                    </DialogDescription>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Vamos enviar um link para maria@exemplo.com.
                  </p>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                    <Button>Enviar link</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: tContent("variants.compositions.profileEdit.name"),
            description: tContent("variants.compositions.profileEdit.description"),
            useWhen: tContent("variants.compositions.profileEdit.use"),
            code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Editar perfil</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais.
      </DialogDescription>
    </DialogHeader>
    <form className="grid gap-3">
      <Label htmlFor="name">Nome de exibição</Label>
      <Input id="name" defaultValue="Maria Souza" />
      <Label htmlFor="role">Função</Label>
      <Input id="role" defaultValue="Designer" />
    </form>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
            preview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>Editar perfil</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar perfil</DialogTitle>
                    <DialogDescription>
                      Atualize suas informações pessoais.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="docs-comp-name">Nome de exibição</Label>
                      <Input id="docs-comp-name" defaultValue="Maria Souza" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="docs-comp-role">Função</Label>
                      <Input id="docs-comp-role" defaultValue="Designer" />
                    </div>
                  </form>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                    <Button>Salvar alterações</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ),
          },
          {
            name: tContent("variants.compositions.mediaPreview.name"),
            description: tContent("variants.compositions.mediaPreview.description"),
            useWhen: tContent("variants.compositions.mediaPreview.use"),
            code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Pré-visualizar</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Capa do post</DialogTitle>
      <DialogDescription>
        Pré-visualização em tamanho real.
      </DialogDescription>
    </DialogHeader>
    <div className="aspect-video w-full bg-muted rounded-md grid place-items-center text-xs text-muted-foreground">
      Pré-visualização da mídia
    </div>
  </DialogContent>
</Dialog>`,
            preview: (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>Pré-visualizar</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Capa do post</DialogTitle>
                    <DialogDescription>
                      Pré-visualização em tamanho real.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="aspect-video w-full bg-muted rounded-md grid place-items-center text-xs text-muted-foreground">
                    Pré-visualização da mídia
                  </div>
                </DialogContent>
              </Dialog>
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
          { label: tContent("states.closed.label"),                trigger: stripHtml(tContent("states.closed.trigger")),                behavior: tContent("states.closed.behavior") },
          { label: tContent("states.opening.label"),               trigger: tContent("states.opening.trigger"),                          behavior: stripHtml(tContent("states.opening.behavior")) },
          { label: tContent("states.open.label"),                  trigger: stripHtml(tContent("states.open.trigger")),                  behavior: tContent("states.open.behavior") },
          { label: tContent("states.closing.label"),               trigger: tContent("states.closing.trigger"),                          behavior: stripHtml(tContent("states.closing.behavior")) },
          { label: tContent("states.withCloseButtonHidden.label"), trigger: stripHtml(tContent("states.withCloseButtonHidden.trigger")), behavior: tContent("states.withCloseButtonHidden.behavior") },
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
              { name: "open",         type: "boolean",                  defaultValue: "—",     required: "Não", description: stripHtml(tContent("props.table.open")) },
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
              { name: "showCloseButton", type: "boolean",         defaultValue: "true", required: "Não", description: stripHtml(tContent("props.table.showCloseButtonContent")) },
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
              { name: "showCloseButton", type: "boolean", defaultValue: "false", required: "Não", description: stripHtml(tContent("props.table.showCloseButtonFooter")) },
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
        title={tContent("tokens.title")}
        cols={{
          token: tContent("tokens.table.token"),
          value: tContent("tokens.table.class"),
          description: tContent("tokens.table.part"),
        }}
        items={[
          { token: "--popover",            value: "bg-popover",            description: tContent("tokens.table.popover") },
          { token: "--popover-foreground", value: "text-popover-foreground", description: tContent("tokens.table.popoverForeground") },
          { token: "--foreground",         value: "ring-foreground/10",    description: tContent("tokens.table.foreground") },
          { token: "--muted",              value: "bg-muted/50",           description: tContent("tokens.table.muted") },
          { token: "--border",             value: "border-t",              description: tContent("tokens.table.border") },
          { token: "--radius",             value: "rounded-xl",            description: tContent("tokens.table.radius") },
          { token: "z-index",              value: "z-50",                  description: tContent("tokens.table.zIndex") },
          { token: "duration",             value: "duration-100",          description: tContent("tokens.table.duration") },
        ]}
        customizationTitle={tContent("tokens.customizationTitle")}
        customizationCode={codeCustomizationTokens}
      />

      <DocsAccessibility
        title={tContent("accessibility.title")}
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
        title={tContent("related.title")}
        items={[
          { name: "AlertDialog", description: stripHtml(tContent("related.alertDialog")), path: "?path=/docs/ui-alertdialog--docs" },
          { name: "Sheet",       description: tContent("related.sheet"),                  path: "?path=/docs/ui-sheet--docs" },
          { name: "Popover",     description: tContent("related.popover"),                path: "?path=/docs/ui-popover--docs" },
          { name: "Form",        description: tContent("related.form"),                   path: "?path=/docs/ui-form--docs" },
          { name: "Drawer",      description: tContent("related.drawer"),                 path: "?path=/docs/ui-drawer--docs" },
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
          { event: tContent("analytics.table.close"),         trigger: tContent("analytics.table.closeTrigger"),         payload: tContent("analytics.table.closePayload") },
          { event: tContent("analytics.table.action"),        trigger: tContent("analytics.table.actionTrigger"),        payload: tContent("analytics.table.actionPayload") },
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
          items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
