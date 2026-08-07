import { figmaDesign } from "@shared/figma/design-links";
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
    design: figmaDesign("accordion"),
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
      control: false,
      description:
        "Mantém os painéis montados quando fechados. Sempre ativo neste design system: o painel usa hidden=\"until-found\" para o Ctrl+F do navegador achar e abrir o item fechado, e isso exige o painel montado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
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
    onValueChange: fn(),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item3',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: ({ onValueChange, ...args }) => (
    <Accordion
      {...args}
      // Só o valor chega ao spy. O segundo argumento do base-ui é o
      // eventDetails, que carrega o evento nativo — a aba Actions serializa o
      // payload, event.view é o Window do iframe, e a serialização estoura
      // SecurityError, poluindo a play com "unhandled error".
      onValueChange={(value) => onValueChange?.(value)}
      defaultValue={["item-1"]}
      className="nds-max-w-lg"
    >
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

    // Idempotentes de propósito: clicam SÓ se o estado atual já não for o
    // desejado. Um clique cego ALTERNA — a partir do estado errado ele inverte
    // o resultado e a asserção seguinte falha. É o que fazia este Playground
    // passar no vitest (montagem limpa) e falhar no painel Interactions, onde
    // o replay reaproveita o componente já mexido.
    const abrir = async (t: HTMLElement) => {
      if (t.getAttribute("aria-expanded") !== "true") await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "true"));
    };
    const fechar = async (t: HTMLElement) => {
      if (t.getAttribute("aria-expanded") !== "false") await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "false"));
    };

    await step("A raiz registra o modo recebido", async () => {
      const root = canvasElement.querySelector('[data-slot="accordion"]');
      await expect(root).toHaveAttribute("data-type", args.multiple ? "multiple" : "single");
    });

    // O painel Interactions reexecuta a play no MESMO DOM: o estado inicial da
    // segunda rodada é o que a primeira deixou. Por isso o passo leva ao estado
    // que quer provar em vez de assumir o de montagem — e o defaultValue, que só
    // vale na montagem, é provado pela story DefaultOpen, com DOM limpo.
    await step("Modo único mantém um item aberto por vez", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[0]);
      await expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
      await expect(triggers[2]).toHaveAttribute("aria-expanded", "false");
    });

    await step("Clicar no trigger fechado abre o item", async () => {
      const triggers = canvas.getAllByRole("button");
      // fecha antes de abrir: garante que o clique aconteça de verdade nesta
      // rodada — é ele que popula a aba Actions.
      await fechar(triggers[1]);
      await abrir(triggers[1]);
      await expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
      await expect(args.onValueChange).toHaveBeenCalled();
    });

    await step("Conteúdo aberto fica de fato visível, com altura real", async () => {
      // aria-expanded sozinho não prova que o painel apareceu: já houve
      // regressão em que o trigger reportava aberto e o conteúdo ficava
      // colapsado (altura vinda de custom property defasada da lib).
      // waitFor: a abertura anima a ALTURA (0fr → 1fr) por --duration-panel, e
      // medir no meio dela dá altura parcial — zero, no primeiro quadro.
      // (Antes esperava opacity: 1; o fade saiu quando o padding passou a
      // colapsar junto, senão o painel travava num piso de 16px.)
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>(
          '[data-slot="accordion-content"]:not([hidden]):not([data-state="closed"]):not([data-closed])',
        );
        if (!el || el.getBoundingClientRect().height === 0) {
          throw new Error('painel aberto ainda não assentou');
        }
        return el;
      });
      await expect(panel).toBeVisible();
      await expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step("Enter expande item focado", async () => {
      const triggers = canvas.getAllByRole("button");
      await fechar(triggers[2]);
      triggers[2].focus();
      await expect(triggers[2]).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(triggers[2]).toHaveAttribute("aria-expanded", "true"));
    });

    await step("Space colapsa item focado (WCAG A — testes.accessibility.item4)", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[2]);
      triggers[2].focus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(triggers[2]).toHaveAttribute("aria-expanded", "false"));
    });

    await step("Trigger aponta para o painel por aria-controls, e o painel NAO e landmark", async () => {
      // Documentado em accessibility.aria.* como automático — esta asserção é o
      // que impede a docs page de afirmar o que a lib não faz.
      // Medido com o item ABERTO: o aria-controls só existe enquanto o painel
      // existe, e apontar para id ausente seria ARIA inválido.
      const trigger = canvas.getAllByRole("button")[0];
      // Leva ao estado desejado em vez de assumir o que o passo anterior deixou:
      // um clique cego alterna, e alternar a partir do estado errado inverte o
      // resultado. Foi assim que este passo passou no vitest e falhou no painel
      // Interactions, onde o replay não remonta o componente.
      await abrir(trigger);
      const contentId = trigger.getAttribute("aria-controls");
      await expect(contentId).toBeTruthy();
      const panel = canvasElement.querySelector(`#${CSS.escape(contentId!)}`);
      // Sem role="region": o painel fica sempre montado por causa do
      // until-found, e um landmark por item proliferaria — medido na docs
      // page, 41 paineis viraram 41 landmarks (axe landmark-unique).
      await expect(panel).not.toHaveAttribute("role");
      await expect(trigger.id).toBeTruthy();
    });

    await step("Painel fechado continua no DOM, achável pelo Ctrl+F", async () => {
      // `hidden="until-found"` esconde por content-visibility, não por display —
      // é o que deixa a busca do navegador achar a resposta e abrir o item.
      // O display computado entra na asserção de propósito: uma regra de autor
      // com `display: none` anula o recurso sem quebrar nada visível.
      const trigger = canvas.getAllByRole("button")[0];
      await abrir(trigger);      // parte de aberto, seja qual for o estado herdado
      await fechar(trigger);
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]');
        if (!el || el.getAttribute("hidden") === null) throw new Error("painel ainda fechando");
        return el;
      });
      await expect(panel.getAttribute("hidden")).toBe("until-found");
      await expect(getComputedStyle(panel).display).not.toBe("none");
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

    await step("Tab e Shift+Tab movem o foco entre triggers", async () => {
      // Documentado em accessibility.keyboard.tab/shiftTab; o conteúdo dos itens
      // não tem elementos focáveis, então Tab vai direto ao próximo trigger.
      const triggers = canvas.getAllByRole("button");
      triggers[0].focus();
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(triggers[0]).toHaveFocus();
    });

    // Teste condicional: trocar item ativo fecha o anterior só vale em modo único.
    if (args.multiple === false) {
      await step("Abrir item fecha o anteriormente aberto (modo único)", async () => {
        const triggers = canvas.getAllByRole("button");
        // Parte de um aberto conhecido e abre OUTRO: é a exclusividade que os
        // passos anteriores não provam, porque lá o anterior era sempre o item 1.
        await abrir(triggers[1]);
        await abrir(triggers[2]);
        await expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
        await expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
      });
    }
  },
};
