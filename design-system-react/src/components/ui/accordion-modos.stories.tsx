import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

const meta = {
  title: "UI/Accordion/Modos",
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { value: "item-1", trigger: "Primeiro painel", content: "Conteúdo do primeiro painel. Pode incluir texto, listas, formulários ou qualquer elemento React." },
  { value: "item-2", trigger: "Segundo painel", content: "Conteúdo do segundo painel. Independente do modo, cada item mantém o seu estado individualmente." },
  { value: "item-3", trigger: "Terceiro painel", content: "Conteúdo do terceiro painel. Use className para personalizar o estilo de cada item individualmente." },
];

export const Single: Story = {
  name: "Single (padrão)",
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      {items.map(({ value, trigger, content }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{trigger}</AccordionTrigger>
          <AccordionContent>{content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Modo single com collapsible — apenas um item pode estar aberto por vez. Clicar no item aberto o fecha. Use para FAQs e listas de informações onde o usuário não precisa comparar conteúdo.",
      },
    },
  },
};

export const SingleNoCollapsible: Story = {
  name: "Single sem collapsible",
  render: () => (
    <Accordion type="single" defaultValue="item-1" className="w-full max-w-lg">
      {items.map(({ value, trigger, content }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{trigger}</AccordionTrigger>
          <AccordionContent>{content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Modo single sem collapsible — sempre há um item aberto. Útil quando o conteúdo principal deve estar sempre visível e apenas o painel ativo muda.",
      },
    },
  },
};

export const Multiple: Story = {
  name: "Multiple",
  render: () => (
    <Accordion type="multiple" className="w-full max-w-lg">
      {items.map(({ value, trigger, content }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{trigger}</AccordionTrigger>
          <AccordionContent>{content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Modo multiple — vários itens podem estar abertos ao mesmo tempo. Use quando o usuário precisa comparar informações de diferentes painéis simultaneamente.",
      },
    },
  },
};

function ControlledAccordion() {
  const [value, setValue] = useState<string>("");
  return (
    <div className="w-full max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        Item ativo: <code className="bg-muted px-1 rounded text-xs">{value || "nenhum"}</code>
      </p>
      <Accordion type="single" collapsible value={value} onValueChange={setValue}>
        {items.map(({ value: v, trigger, content }) => (
          <AccordionItem key={v} value={v}>
            <AccordionTrigger>{trigger}</AccordionTrigger>
            <AccordionContent>{content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export const Controlled: Story = {
  name: "Controlado",
  render: () => <ControlledAccordion />,
  parameters: {
    docs: {
      description: {
        story:
          "Modo controlado — o estado é gerenciado externamente via value + onValueChange. Use quando o accordion precisa sincronizar com outras partes da interface (ex: roteamento, URL params).",
      },
    },
  },
};
