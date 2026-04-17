import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

const meta = {
  title: "UI/Accordion/Estados",
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ItemDisabled: Story = {
  name: "Item desabilitado",
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Item habilitado</AccordionTrigger>
        <AccordionContent>Este item funciona normalmente.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger>Item desabilitado</AccordionTrigger>
        <AccordionContent>Este conteúdo não é acessível.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Outro item habilitado</AccordionTrigger>
        <AccordionContent>Este item também funciona normalmente.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole("button");
    const enabledTrigger = triggers[0];
    const disabledTrigger = triggers[1];

    // Critério a11y — trigger disabled tem aria-disabled
    await step("Trigger desabilitado tem atributo disabled no DOM", async () => {
      await expect(disabledTrigger).toBeDisabled();
    });

    // Critério funcional — clicar em disabled não muda estado
    await step("Clicar em trigger disabled não expande o item", async () => {
      await userEvent.click(disabledTrigger, { pointerEventsCheck: 0 });
      await expect(disabledTrigger).toHaveAttribute("aria-expanded", "false");
    });

    // Confirma que item habilitado ainda funciona
    await step("Item habilitado ainda abre normalmente", async () => {
      await userEvent.click(enabledTrigger);
      await expect(enabledTrigger).toHaveAttribute("aria-expanded", "true");
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Item com prop disabled no AccordionItem — o trigger fica com opacidade reduzida e cursor not-allowed. O conteúdo não pode ser expandido nem por teclado.",
      },
    },
  },
};

export const DefaultOpen: Story = {
  name: "Aberto por padrão (defaultValue)",
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Aberto por padrão</AccordionTrigger>
        <AccordionContent>
          Este item começa expandido via <code>defaultValue="item-1"</code>.
          Útil para guiar o usuário ao conteúdo principal da lista.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Fechado por padrão</AccordionTrigger>
        <AccordionContent>Este item começa fechado normalmente.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole("button");

    await step("Primeiro item começa com aria-expanded=true", async () => {
      await expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
    });

    await step("Segundo item começa com aria-expanded=false", async () => {
      await expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Usa defaultValue para abrir um item na renderização inicial sem tornar o componente controlado. Bom para FAQs onde a primeira pergunta deve estar respondida visualmente.",
      },
    },
  },
};
