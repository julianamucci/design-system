import type { Meta, StoryObj } from "@storybook/react-vite";
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
  // A aba "API Reference" combina o docgen com estes argTypes. Declarar a API
  // real evita que a tabela saia com uma linha só. Props sem control são
  // documentação: o `render` do Playground as fixa depois do spread, então
  // control ativo aqui viraria controle morto.
  argTypes: {
    multiple: {
      control: "boolean",
      description: "Permite múltiplos itens abertos ao mesmo tempo.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Desabilita todos os itens de uma vez.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description: "Eixo de navegação por teclado.",
      table: { type: { summary: "'vertical' | 'horizontal'" }, defaultValue: { summary: "'vertical'" } },
    },
    keepMounted: {
      control: "boolean",
      description: "Mantém os painéis montados quando fechados.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    value: {
      control: false,
      description: "Item(ns) aberto(s) no modo controlado.",
      table: { type: { summary: "string | string[]" } },
    },
    defaultValue: {
      control: false,
      description: "Item(ns) aberto(s) inicialmente. O Playground fixa ['item-1'].",
      table: { type: { summary: "string | string[]" } },
    },
    onValueChange: {
      control: false,
      description: "Callback disparado quando o valor muda.",
      table: { type: { summary: "(value, eventDetails) => void" } },
    },
    render: {
      control: false,
      description:
        "Elemento que substitui o container. Nesta stack a composição no filho é render — não existe asChild.",
      table: { type: { summary: "ReactElement" } },
    },
    className: {
      control: false,
      description: "Classes adicionais no elemento raiz.",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    multiple: false,
    disabled: false,
    orientation: "vertical",
    keepMounted: false,
    onValueChange: fn(),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <Accordion {...args} defaultValue={["item-1"]} className="nds-max-w-lg">
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

    await step("Conteúdo aberto fica de fato visível, com altura real", async () => {
      // aria-expanded sozinho não prova que o painel apareceu: já houve
      // regressão em que o trigger reportava aberto e o conteúdo ficava
      // colapsado (altura vinda de custom property defasada da lib).
      // waitFor: a entrada tem fade (opacity 0 → 1), então a asserção precisa
      // esperar a animação assentar em vez de medir no meio dela.
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>(
          '[data-slot="accordion-content"]:not([hidden]):not([data-state="closed"]):not([data-closed])',
        );
        if (!el || getComputedStyle(el).opacity !== '1') {
          throw new Error('painel aberto ainda não assentou');
        }
        return el;
      });
      await expect(panel).toBeVisible();
      await expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);
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

    await step("Setas movem o foco entre triggers (com loop) e Home/End vão às pontas", async () => {
      // O base-ui não traz navegação por setas no Accordion — o wrapper supre.
      // Sem isso as setas caem no scroll da página, divergindo das outras stacks.
      const triggers = canvas.getAllByRole("button");
      triggers[0].focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(triggers[1]).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}");
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}");
      await expect(triggers[triggers.length - 1]).toHaveFocus();
      await userEvent.keyboard("{Home}");
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard("{End}");
      await expect(triggers[triggers.length - 1]).toHaveFocus();
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
