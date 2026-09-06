import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import {
  sheetBottomPanelSource,
  sheetFiltersSource,
  sheetNavigationSource,
  sheetProfileEditSource,
  sheetSource,
} from "./sheet.source";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { useTranslation } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";

const meta = {
  title: "Components/Overlay/Sheet/Compositions",
  tags: ["overlay"],
  component: Sheet,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          "Composições reais do Sheet em fluxos de produto: filtros avançados, navegação " +
          "secundária, edição de perfil e painel inferior.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="nds-min-h-80" style={{ contain: "layout" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Lista do conteúdo compartilhado. `t()` devolve o valor cru e o achatamento
 * preserva o array inteiro; a checagem existe porque chave ausente volta como o
 * próprio caminho, e um `.map` sobre string renderizaria letra por letra.
 */
function listFromContent(t: (key: string) => string, key: string): string[] {
  const value = t(key) as unknown;
  return Array.isArray(value) ? (value as string[]) : [];
}

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
      // Formulário dentro do SheetBody — sub-composição que o snippet do meta,
      // só com cabeçalho e rodapé, esconderia.
      source: { transform: sheetFiltersSource },
      description: {
        story:
          "Sheet à direita com filtros avançados em formulário. O título nomeia a ação, a " +
          "descrição orienta o uso e o rodapé traz Cancelar + ação primária.",
      },
    },
  },
  render: () => {
    // Todo texto do preview sai do conteúdo compartilhado: cravado aqui, ele
    // divergia da docs page sem que nada acusasse — foi assim que esta story
    // acumulou um terceiro campo que o conteúdo nunca definiu.
    const { t } = useTranslation(sheetTranslations);
    return (
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.trigger")}
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{t("demonstration.labels.title")}</SheetTitle>
            <SheetDescription>{t("demonstration.labels.description")}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            {/* `nds-stack` com `sm` fora e `xs` no par rótulo ↔ campo: é o ritmo
                do Vanilla, referência de markup da casa, e o mesmo que o snippet
                ao lado ensina. */}
            <form
              className="nds-stack"
              data-spacing="sm"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className="nds-stack" data-spacing="xs">
                <Label htmlFor="filter-category">
                  {t("variants.compositions.advancedFilters.fieldCategory")}
                </Label>
                <Input
                  id="filter-category"
                  defaultValue={t("variants.compositions.advancedFilters.categoryValue")}
                />
              </div>
              <div className="nds-stack" data-spacing="xs">
                <Label htmlFor="filter-min">
                  {t("variants.compositions.advancedFilters.fieldMinPrice")}
                </Label>
                <Input id="filter-min" type="number" defaultValue="100" />
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </SheetClose>
            <Button>{t("demonstration.labels.apply")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAccessibleName();

    // Os DOIS campos do conteúdo compartilhado. A contagem é a asserção: o
    // rótulo vem do idioma corrente e mudaria a cada seleção, mas quantos
    // campos a composição tem não muda com o idioma.
    const fields = [...panel.querySelectorAll("input")];
    await expect(fields).toHaveLength(2);
    for (const field of fields) await expect(field).toHaveAccessibleName();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      // Painel à esquerda, com nav no corpo e SEM rodapé: a ausência de
      // confirmação faz parte do que a story ensina.
      source: { transform: sheetNavigationSource },
      description: {
        story:
          "Sheet à esquerda como menu de navegação secundária — itens clicáveis dentro do " +
          "painel, sem rodapé.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    const sections = listFromContent(t, "variants.compositions.secondaryNavigation.items");
    return (
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("variants.compositions.secondaryNavigation.trigger")}
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>
              {t("variants.compositions.secondaryNavigation.panelTitle")}
            </SheetTitle>
            <SheetDescription>
              {t("variants.compositions.secondaryNavigation.panelDescription")}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            {/* Destinos são LINKS, não botões `ghost`: quem navega por marcos
                espera links dentro de um `<nav>`, e o nome do marco vem do
                conteúdo compartilhado — a página já tem outra navegação, e dois
                marcos sem nome distinto ficam indistinguíveis. */}
            <nav
              className="nds-stack"
              data-spacing="xs"
              aria-label={t("variants.compositions.secondaryNavigation.navLabel")}
            >
              {sections.map((label) => (
                <a
                  key={label}
                  href="#"
                  className="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent"
                >
                  {label}
                </a>
              ))}
            </nav>
          </SheetBody>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "left");
    const nav = within(panel).getByRole("navigation");
    await expect(nav).toBeVisible();
    // O marco leva nome próprio, e o nome sai do conteúdo — por isso a asserção
    // é a EXISTÊNCIA do nome, e não o texto, que muda com o idioma.
    await expect(nav).toHaveAccessibleName();
    // As CINCO seções que o conteúdo compartilhado descreve: com quatro, a
    // story documentava uma composição que não existe.
    const links = within(nav).getAllByRole("link");
    await expect(links).toHaveLength(5);
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      // Form no corpo e o par descartar ↔ confirmar no rodapé — a confirmação é
      // o ENVIO do formulário, e é isso que o snippet do meta esconderia.
      source: { transform: sheetProfileEditSource },
      description: {
        story:
          "Sheet à direita para editar poucos campos relacionados sem tirar a pessoa da " +
          "listagem. Passando de um punhado de campos, a edição merece página própria.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    return (
      // Sem `side`: direita é o padrão do componente, e é o que o snippet ao
      // lado ensina — repeti-lo aqui faria preview e painel Code divergirem.
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("variants.compositions.profileEdit.trigger")}
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("variants.compositions.profileEdit.panelTitle")}</SheetTitle>
            <SheetDescription>
              {t("variants.compositions.profileEdit.panelDescription")}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <form
              id="profile-form"
              className="nds-stack"
              data-spacing="sm"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className="nds-stack" data-spacing="xs">
                <Label htmlFor="profile-name">
                  {t("variants.compositions.profileEdit.fieldName")}
                </Label>
                <Input
                  id="profile-name"
                  defaultValue={t("variants.compositions.profileEdit.fieldNameValue")}
                />
              </div>
              <div className="nds-stack" data-spacing="xs">
                <Label htmlFor="profile-handle">
                  {t("variants.compositions.profileEdit.fieldHandle")}
                </Label>
                <Input
                  id="profile-handle"
                  defaultValue={t("variants.compositions.profileEdit.fieldHandleValue")}
                />
              </div>
              <div className="nds-stack" data-spacing="xs">
                <Label htmlFor="profile-bio">
                  {t("variants.compositions.profileEdit.fieldBio")}
                </Label>
                <Input
                  id="profile-bio"
                  defaultValue={t("variants.compositions.profileEdit.fieldBioValue")}
                />
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </SheetClose>
            <Button type="submit" form="profile-form">
              {t("variants.compositions.profileEdit.submit")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "right");
    await expect(panel).toHaveAccessibleName();

    // Cada campo se nomeia pelo próprio rótulo. A asserção é pelo nome
    // ACESSÍVEL e não pelo texto: o rótulo vem do conteúdo compartilhado e
    // muda com o idioma, mas o par `htmlFor` ↔ `id` tem de valer nos três.
    const fields = within(panel).getAllByRole("textbox");
    await expect(fields).toHaveLength(3);
    for (const field of fields) await expect(field).toHaveAccessibleName();

    // O rodapé mora FORA do corpo rolável, então o botão de confirmar não está
    // dentro do formulário: só o atributo `form` o liga, e sem ele o envio
    // nunca acontece — nem pelo clique, nem pelo Enter no campo.
    const form = panel.querySelector<HTMLFormElement>("form");
    await expect(form).not.toBeNull();
    const submit = panel.querySelector<HTMLButtonElement>('button[type="submit"]');
    await expect(submit).not.toBeNull();
    await expect(submit).toHaveAttribute("form", form!.id);
  },
};

export const BottomPanel: Story = {
  parameters: {
    docs: {
      // Direção inferior mais a fileira de ações no corpo — nenhum control
      // descreve isso neste arquivo.
      source: { transform: sheetBottomPanelSource },
      description: {
        story:
          "Sheet inferior — o mesmo desenho do Drawer mobile, sem o gesto de arrastar. " +
          "Quando o gesto importa, o componente é o Drawer.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(sheetTranslations);
    const actions = listFromContent(t, "variants.compositions.bottomPanel.actions");
    return (
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>
          {t("variants.compositions.bottomPanel.trigger")}
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("variants.compositions.bottomPanel.panelTitle")}</SheetTitle>
            <SheetDescription>
              {t("variants.compositions.bottomPanel.panelDescription")}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div className="nds-cluster" data-spacing="md">
              {/* A destrutiva é a ÚLTIMA, e a única com a variante que a
                  anuncia: três botões destrutivos lado a lado tirariam o peso
                  justamente de quem precisa dele. */}
              {actions.map((label, index) => (
                <Button
                  key={label}
                  variant={index === actions.length - 1 ? "destructive" : "outline"}
                >
                  {label}
                </Button>
              ))}
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>
              {t("variants.compositions.bottomPanel.close")}
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "bottom");
    await expect(panel).toHaveAccessibleName();
    // As TRÊS ações do conteúdo, no corpo — o rodapé fica fora dele e traz só
    // a saída, que é o que separa esta composição da que confirma.
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]');
    await expect(body).not.toBeNull();
    await expect(within(body!).getAllByRole("button")).toHaveLength(3);
  },
};
