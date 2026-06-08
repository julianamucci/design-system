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

const meta = {
  title: "UI/Breadcrumb/Estados",
  tags: ["navigation"],
  component: Breadcrumb,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes estruturais do Breadcrumb: simples, com ellipsis, separador customizado e link customizado via render.",
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
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
          <BreadcrumbPage>Componentes</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  parameters: {
    docs: {
      description: {
        story: "Composição básica com 2 níveis — link inicial + BreadcrumbPage.",
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onNavigate = (args as { onNavigate: ReturnType<typeof fn> }).onNavigate;
    const link = canvas.getByRole("link", { name: "Início" });

    await step("F3: clicar no BreadcrumbLink dispara navigation_click", async () => {
      await userEvent.click(link);
      await expect(onNavigate).toHaveBeenCalled();
    });

    await step("F6: Tab foca o link e Enter ativa o handler", async () => {
      link.blur();
      onNavigate.mockClear();
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(onNavigate).toHaveBeenCalled();
    });

    await step("A5: focus ring visível — link aceita foco programático", async () => {
      link.focus();
      await expect(link).toHaveFocus();
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
          "Ellipsis colapsando níveis intermediários — inclui MoreHorizontalIcon e texto sr-only \"More\".",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
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
          "Separador customizado via children de BreadcrumbSeparator — mantém aria-hidden automaticamente.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
  },
};

export const AsChildLink: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={(props) => (
              <a
                {...props}
                data-router-link="true"
                href="#"
              >
                Início
              </a>
            )}
          />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            render={(props) => (
              <a
                {...props}
                data-router-link="true"
                href="#"
              >
                Componentes
              </a>
            )}
          />
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
          "Link customizado via prop render (useRender do base-ui) — permite integração com routers como Next.js Link ou React Router Link.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("navigation")).toBeInTheDocument();
    await expect(canvas.getAllByRole("link").length).toBeGreaterThanOrEqual(2);
  },
};
