import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor, fn } from "storybook/test";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { AccordionDocs } from "@/components/docs/AccordionDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs", "disclosure"],
  parameters: {
    docs: { page: withAutoDocsTab(AccordionDocs) },
  },
  argTypes: {
    multiple: {
      control: "boolean",
      description: "Permite múltiplos itens abertos ao mesmo tempo (base-ui).",
    },
  },
  args: {
    multiple: false,
    onValueChange: fn(),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <Accordion {...args} defaultValue={["item-1"]} className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
        <AccordionContent>
          Acesse a tela de login e clique em &ldquo;Esqueci minha senha&rdquo;. Você receberá
          um link de redefinição no email cadastrado, válido por 24 horas.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
        <AccordionContent>
          Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento
          disponível em até 12 vezes sem juros no cartão.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
        <AccordionContent>
          Você pode cancelar a qualquer momento em Configuracoes → Assinatura.
          O acesso permanece ativo até o fim do período já pago.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step("Item 1 começa aberto (defaultValue)", async () => {
      const triggers = canvas.getAllByRole("button");
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute("aria-expanded", "true"),
        { timeout: 500 }
      );
      await expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
    });

    await step("Clicar no trigger fechado abre o item", async () => {
      const triggers = canvas.getAllByRole("button");
      await userEvent.click(triggers[1]);
      await waitFor(
        () => expect(triggers[1]).toHaveAttribute("aria-expanded", "true"),
        { timeout: 500 }
      );
    });

    await step("Enter expande item focado", async () => {
      const triggers = canvas.getAllByRole("button");
      triggers[2].focus();
      await expect(triggers[2]).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(
        () => expect(triggers[2]).toHaveAttribute("aria-expanded", "true"),
        { timeout: 500 }
      );
    });

    await step("Space colapsa item focado (WCAG A — testes.accessibility.item4)", async () => {
      const triggers = canvas.getAllByRole("button");
      triggers[2].focus();
      await userEvent.keyboard(" ");
      await waitFor(
        () => expect(triggers[2]).toHaveAttribute("aria-expanded", "false"),
        { timeout: 500 }
      );
    });

    // Teste condicional: trocar item ativo fecha o anterior só vale em modo único.
    if (args.multiple === false) {
      await step("Abrir item fecha o anteriormente aberto (modo único)", async () => {
        const triggers = canvas.getAllByRole("button");
        // Item 1 segue aberto neste ponto (defaultValue), e item 2 foi aberto no step 2 mas fechou.
        // Re-abrindo item 2 deve fechar item 1.
        await userEvent.click(triggers[1]);
        await waitFor(
          () => expect(triggers[1]).toHaveAttribute("aria-expanded", "true"),
          { timeout: 500 }
        );
        await expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
      });
    }
  },
};
