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
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Abrir filtros</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filtros avançados</SheetTitle>
          <SheetDescription>
            Refine os resultados por categoria, preço e disponibilidade.
          </SheetDescription>
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
              <Label htmlFor="filter-category">Categoria</Label>
              <Input id="filter-category" defaultValue="Eletrônicos" />
            </div>
            <div className="nds-stack" data-spacing="xs">
              <Label htmlFor="filter-min">Preço mínimo</Label>
              <Input id="filter-min" type="number" defaultValue="100" />
            </div>
            <div className="nds-stack" data-spacing="xs">
              <Label htmlFor="filter-max">Preço máximo</Label>
              <Input id="filter-max" type="number" defaultValue="2000" />
            </div>
          </form>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </SheetClose>
          <Button>Aplicar filtros</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
    const field = within(panel).getByLabelText(/Categoria/i);
    await expect(field).toBeVisible();
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
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Abrir menu</SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navegação</SheetTitle>
          <SheetDescription>Acesse as seções principais do aplicativo.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <nav className="nds-stack" data-spacing="xs" aria-label="Seções">
            {["Dashboard", "Projetos", "Equipe", "Configurações"].map((label) => (
              <Button key={label} variant="ghost">
                {label}
              </Button>
            ))}
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "left");
    const nav = within(panel).getByRole("navigation");
    await expect(nav).toBeVisible();
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
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Abrir ações</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Ações rápidas</SheetTitle>
          <SheetDescription>
            Escolha uma das ações disponíveis para este item.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="nds-cluster" data-spacing="md">
            <Button variant="outline">Compartilhar</Button>
            <Button variant="outline">Duplicar</Button>
            <Button variant="destructive">Excluir</Button>
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Fechar</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "bottom");
    await expect(panel).toHaveAccessibleName(/Ações rápidas/i);
  },
};
