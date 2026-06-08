import type { Meta, StoryObj } from "@storybook/react";
import { Slash } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "UI/Breadcrumb/Composicoes",
  tags: ["navigation"],
  component: Breadcrumb,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes canônicas do Breadcrumb: default, com ellipsis, separador customizado e responsivo com DropdownMenu.",
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onNavigate: fn(),
  } as never,
  render: (args) => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              (args as { onNavigate?: (e: unknown) => void }).onNavigate?.({
                event: "navigation_click",
                label: "Início",
              });
            }}
          >
            Início
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              (args as { onNavigate?: (e: unknown) => void }).onNavigate?.({
                event: "navigation_click",
                label: "Componentes",
              });
            }}
          >
            Componentes
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Composição padrão com 3 níveis e separador ChevronRight automático. Último item usa BreadcrumbPage.",
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onNavigate = (args as { onNavigate: ReturnType<typeof fn> }).onNavigate;
    const links = canvas.getAllByRole("link");

    await step("F3: clicar dispara navigation_click", async () => {
      await userEvent.click(links[0]);
      await expect(onNavigate).toHaveBeenCalled();
    });

    await step("F6: Tab foca links em ordem e Enter ativa link focado", async () => {
      links[0].blur();
      onNavigate.mockClear();
      await userEvent.tab();
      await expect(links[0]).toHaveFocus();
      await userEvent.tab();
      await expect(links[1]).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(onNavigate).toHaveBeenCalled();
    });

    await step("A5: focus ring visível — link aceita foco programático", async () => {
      links[0].focus();
      await expect(links[0]).toHaveFocus();
    });
  },
};

export const WithEllipsis: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Início</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Composição com BreadcrumbEllipsis para colapsar níveis intermediários quando a hierarquia excede 4 níveis.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
    await expect(canvas.getAllByRole("link").length).toBeGreaterThanOrEqual(2);
  },
};

export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Início</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Composição com separador customizado via children de BreadcrumbSeparator — substitui o ChevronRight padrão.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
  },
};

export const Responsive: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Início</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1"
              aria-label="Expandir níveis ocultos"
            >
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Documentação</DropdownMenuItem>
              <DropdownMenuItem>Guia</DropdownMenuItem>
              <DropdownMenuItem>Componentes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Composição responsiva: BreadcrumbEllipsis envolvido em DropdownMenu para expor níveis ocultos em mobile.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /expandir níveis ocultos/i })).toBeInTheDocument();
  },
};
