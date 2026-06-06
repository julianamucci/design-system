import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import { BreadcrumbDocs } from "@/components/docs/BreadcrumbDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs", "navigation"],
  parameters: {
    docs: { page: withAutoDocsTab(BreadcrumbDocs) },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Início</BreadcrumbLink>
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("nav com aria-label=\"breadcrumb\" está presente", async () => {
      const nav = canvas.getByRole("navigation", { name: "breadcrumb" });
      await expect(nav).toBeInTheDocument();
      await expect(nav).toHaveAttribute("data-slot", "breadcrumb");
    });

    await step("BreadcrumbList renderiza como <ol>", async () => {
      const list = canvasElement.querySelector('[data-slot="breadcrumb-list"]');
      await expect(list).toBeInTheDocument();
      await expect(list?.tagName).toBe("OL");
    });

    await step("Links navegáveis são renderizados", async () => {
      const homeLink = canvas.getByRole("link", { name: "Início" });
      const componentsLink = canvas.getByRole("link", { name: "Componentes" });
      await expect(homeLink).toHaveAttribute("href", "#");
      await expect(componentsLink).toHaveAttribute("href", "#");
    });

    await step("Último item é BreadcrumbPage com aria-current=\"page\"", async () => {
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]');
      await expect(page).toBeInTheDocument();
      await expect(page).toHaveAttribute("aria-current", "page");
      await expect(page).toHaveAttribute("aria-disabled", "true");
      await expect(page).toHaveTextContent("Breadcrumb");
    });

    await step("BreadcrumbPage não é um link", async () => {
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]');
      const hasAnchor = page?.querySelector("a");
      await expect(hasAnchor).toBeNull();
    });

    await step("Separadores têm aria-hidden=\"true\"", async () => {
      const separators = canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]');
      await expect(separators.length).toBeGreaterThan(0);
      separators.forEach((sep) => {
        expect(sep).toHaveAttribute("aria-hidden", "true");
        expect(sep).toHaveAttribute("role", "presentation");
      });
    });
  },
};
