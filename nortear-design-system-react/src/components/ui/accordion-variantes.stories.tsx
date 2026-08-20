import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import {
  accordionControladoSource,
  accordionMultiploSource,
  accordionSemConfiguracaoSource,
  accordionSource,
} from "./accordion.source";

const meta: Meta = {
  title: "UI/Accordion/Variants",
  tags: ["disclosure"],
  parameters: {
    design: figmaDesign("accordion"),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: accordionSource } },
  },
};

export default meta;
type Story = StoryObj;

// Idempotentes: o painel Interactions reexecuta a play no MESMO DOM, então o
// estado de partida é o que a rodada anterior deixou. Um clique cego ALTERNA —
// a partir do estado errado ele inverte o resultado e a asserção seguinte falha.
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "true") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "true"));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "false") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "false"));
};

export const Single: Story = {
  render: () => (
    <Accordion defaultValue={["item-1"]} className="nds-max-w-lg">
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
          Aceitamos cartão de crédito, Pix e boleto bancário.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Como cancelo minha assinatura?</AccordionTrigger>
        <AccordionContent>
          Você pode cancelar a qualquer momento em Configuracoes → Assinatura.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    covers: ['functional.item2', 'functional.item3', 'functional.item6', 'visual.item2'],
    docs: {
      description: {
        story:
          "Modo single (default — sem prop multiple). Apenas um item aberto por vez. Clicar no item ativo o fecha. Use para FAQ.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Item 1 começa aberto via defaultValue", async () => {
      const triggers = canvas.getAllByRole("button");
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute("aria-expanded", "true"),
        { timeout: 500 }
      );
    });

    await step("Abrir item 2 fecha automaticamente o item 1", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[1]);
      await expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
    });

    await step("Clicar no item ativo fecha-o (modo single permite collapse)", async () => {
      const triggers = canvas.getAllByRole("button");
      await fechar(triggers[1]);
    });
  },
};

/**
 * O fechar-ao-clicar-de-novo, medido sem nenhuma configuração.
 *
 * A raiz é montada com o modo único PADRÃO — nada é passado além dos itens. É
 * esse recorte que prova o contrato: o comportamento não depende de uma chave
 * que quem consome precise lembrar de ligar. Enquanto a prop `collapsible`
 * existia, esta story ficava vermelha na stack cuja lib a trazia desligada por
 * omissão, e verde nas outras quatro — foi como a divergência foi medida.
 *
 * Sobrevive ao REPLAY: cada passo estabelece a própria precondição, e o par
 * `abrir`/`fechar` garante um clique real nesta rodada partindo de um estado
 * conhecido, em vez de alternar a partir do que a rodada anterior deixou.
 */
export const CloseOnSecondClick: Story = {
  render: () => (
    <Accordion className="nds-max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
        <AccordionContent>
          Acesse a tela de login e clique em &ldquo;Esqueci minha senha&rdquo;.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
        <AccordionContent>
          Aceitamos cartão de crédito, Pix e boleto bancário.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    covers: ['functional.item2'],
    docs: {
      // A ausência de configuração é o assunto: o snippet do meta traz
      // defaultValue e esconderia justamente o que a story prova.
      source: { transform: accordionSemConfiguracaoSource },
      description: {
        story:
          "Modo único sem nenhuma configuração extra: clicar de novo no item aberto o fecha.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Clicar de novo no item aberto o fecha", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[0]); // precondição própria: garantidamente aberto
      await fechar(triggers[0]); // clique real nesta rodada + asserção de estado
    });

    await step("O painel recolhe de fato, não só o atributo", async () => {
      // Atributo é promessa, altura é entrega. Sem esta asserção, um painel que
      // continuasse expandido com aria-expanded="false" passaria despercebido.
      // A tolerância de 1px cobre o arredondamento do grid em 0fr.
      await waitFor(() => {
        const expandidos = Array.from(
          canvasElement.querySelectorAll<HTMLElement>('[data-slot="accordion-content"]'),
        ).filter((p) => p.getBoundingClientRect().height > 1);
        expect(expandidos).toHaveLength(0);
      });
    });
  },
};

export const Multiple: Story = {
  render: () => (
    <Accordion multiple className="nds-max-w-lg">
      <AccordionItem value="especificacoes">
        <AccordionTrigger>Especificações técnicas</AccordionTrigger>
        <AccordionContent>
          CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="compatibilidade">
        <AccordionTrigger>Compatibilidade</AccordionTrigger>
        <AccordionContent>
          Windows 11, macOS 14+, Ubuntu 22.04 LTS
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="garantia">
        <AccordionTrigger>Garantia e suporte</AccordionTrigger>
        <AccordionContent>
          24 meses de garantia de fábrica. Suporte técnico 24/7.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    covers: ['functional.item4'],
    docs: {
      // O arquivo desliga os controls: sem args, o meta imprimiria modo único.
      source: { transform: accordionMultiploSource },
      description: {
        story:
          "Modo multiple. Múltiplos itens podem estar abertos ao mesmo tempo. Use para especificações técnicas comparáveis.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Abrir dois itens — ambos permanecem expandidos (modo múltiplo)", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[0]);
      await abrir(triggers[1]);
      await expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
    });

    await step("Clicar em trigger aberto fecha o item individualmente (modo múltiplo)", async () => {
      const triggers = canvas.getAllByRole("button");
      await fechar(triggers[0]);
      await expect(triggers[1]).toHaveAttribute("aria-expanded", "true");
    });
  },
};

function ControlledAccordion() {
  const [value, setValue] = useState<string[]>(["item-1"]);
  return (
    <div className="nds-stack nds-w-full nds-max-w-lg" data-spacing="sm">
      <p className="nds-text-caption nds-text-muted-foreground">
        Item aberto: <code>{value[0] || "nenhum"}</code>
      </p>
      <Accordion
        value={value}
        onValueChange={setValue}
       
      >
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
          <AccordionContent>Estado gerenciado externamente via value + onValueChange.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item 2 — controlado</AccordionTrigger>
          <AccordionContent>Útil para sincronizar com URL ou outro estado da aplicação.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledAccordion />,
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O estado externo vive no andaime da story; o snippet precisa mostrá-lo.
      source: { transform: accordionControladoSource },
      description: {
        story:
          "Modo controlado. value e onValueChange gerenciam o estado externamente. O indicador acima mostra o item ativo.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Item 1 começa aberto (value inicial controlado)", async () => {
      const triggers = canvas.getAllByRole("button");
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute("aria-expanded", "true"),
        { timeout: 500 }
      );
    });

    await step("Clicar em item 2 atualiza o estado externo", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[1]);
      await expect(canvasElement.textContent).toContain("item-2");
    });
  },
};

export const DefaultOpen: Story = {
  render: () => (
    <Accordion defaultValue={["item-1"]} className="nds-max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
        <AccordionContent>
          Este item inicia expandido via <code>defaultValue=&quot;item-1&quot;</code>.
          Não é modo controlado — o estado interno gerencia após a montagem.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Item fechado por padrão</AccordionTrigger>
        <AccordionContent>Este item inicia colapsado.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          "Prop defaultValue abre um item na montagem sem modo controlado. Use em documentação e onboarding.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Item 1 inicia expandido via defaultValue", async () => {
      const triggers = canvas.getAllByRole("button");
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute("aria-expanded", "true"),
        { timeout: 500 }
      );
      await expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
    });
  },
};
