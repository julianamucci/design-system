import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";
import { AccordionDocs } from "@/components/docs/AccordionDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(AccordionDocs) },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
      description: "Modo de operação — single abre um item por vez, multiple permite vários",
    },
    collapsible: {
      control: "boolean",
      description: "Permite fechar o item ativo (apenas type=single)",
    },
  },
  args: {
    type: "single",
    collapsible: true,
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Accordion {...args} className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>O que é um design system?</AccordionTrigger>
        <AccordionContent>
          Um design system é um conjunto de padrões reutilizáveis, componentes e diretrizes
          que garantem consistência visual e funcional em produtos digitais.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Quando usar o Accordion?</AccordionTrigger>
        <AccordionContent>
          Use o Accordion quando quiser apresentar conteúdo progressivamente,
          reduzindo a carga cognitiva em telas com muita informação.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Como customizar o estilo?</AccordionTrigger>
        <AccordionContent>
          Use a prop <code>className</code> em qualquer subcomponente ou ajuste
          os tokens CSS do tema para personalizar cores, bordas e espaçamentos.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole("button");
    const first = triggers[0];
    const second = triggers[1];

    // Critério 1 — Clicar trigger fechado → item abre (aria-expanded=true)
    await step("Clicar no primeiro trigger abre o item", async () => {
      await expect(first).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(first);
      await expect(first).toHaveAttribute("aria-expanded", "true");
    });

    // Critério 2 — Modo single: abrir segundo fecha o primeiro
    await step("Modo single: abrir segundo item fecha o primeiro", async () => {
      await userEvent.click(second);
      await expect(second).toHaveAttribute("aria-expanded", "true");
      await expect(first).toHaveAttribute("aria-expanded", "false");
    });

    // Critério 3 — Clicar item aberto com collapsible fecha
    await step("Clicar item aberto (collapsible) fecha o item", async () => {
      await userEvent.click(second);
      await expect(second).toHaveAttribute("aria-expanded", "false");
    });

    // Critério 4 — Foco via teclado
    await step("Trigger recebe foco corretamente", async () => {
      first.focus();
      await expect(first).toHaveFocus();
    });

    // Critério 5 — Enter expande item com foco
    await step("Pressionar Enter expande o item focado", async () => {
      first.focus();
      await userEvent.keyboard("{Enter}");
      await expect(first).toHaveAttribute("aria-expanded", "true");
    });

    // Critério 6 — Space expande/colapsa item com foco
    await step("Pressionar Space colapsa o item focado", async () => {
      first.focus();
      await userEvent.keyboard(" ");
      await expect(first).toHaveAttribute("aria-expanded", "false");
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Cobre os 6 critérios de teste documentados: abertura, modo single (fecha anterior), collapsible, foco, Enter e Space. Veja a aba **Interactions** para acompanhar a execução.",
      },
    },
  },
};
