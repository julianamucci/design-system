import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { ref } from 'vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './index';
import {
  defaultSourceAccordionOpen,
  accordionControladoSource,
  segundoClickSourceAccordionClose,
  accordionMultipleSource,
  accordionSingleSource,
} from './accordion.source';

const meta = {
  title: 'UI/Accordion/Variants',
  tags: ['disclosure'],
  parameters: {
    design: figmaDesign('accordion'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: accordionSingleSource } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Idempotentes: o painel Interactions reexecuta a play no MESMO DOM, então o
// estado de partida é o que a rodada anterior deixou. Um clique cego ALTERNA —
// a partir do estado errado ele inverte o resultado e a asserção seguinte falha.
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

export const Single: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" default-value="item-1" class="nds-max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
          <AccordionContent>
            Acesse a tela de login e clique em "Esqueci minha senha". Você receberá
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
    `,
  }),
  parameters: {
    covers: ['functional.item2', 'functional.item3', 'functional.item6', 'visual.item2'],
    docs: {
      description: {
        story: 'Modo single. Apenas um item aberto por vez, e clicar de novo no item aberto o fecha. Use para FAQ.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 começa aberto via defaultValue', async () => {
      const triggers = canvas.getAllByRole('button');
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'),
        { timeout: 500 }
      );
    });

    await step('Abrir o item 2 fecha automaticamente o item 1 (modo single)', async () => {
      const triggers = canvas.getAllByRole('button');
      await abrir(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger ativo fecha o item', async () => {
      const triggers = canvas.getAllByRole('button');
      await fechar(triggers[1]);
    });
  },
};

/**
 * O fechar-ao-clicar-de-novo, medido sem nenhuma configuração.
 *
 * A raiz é montada só com `type="single"` — nada mais. É esse recorte que prova
 * o contrato: o comportamento não depende de uma chave que quem consome precise
 * lembrar de ligar. Enquanto a prop `collapsible` era pública, esta story ficava
 * VERMELHA nesta stack (o reka a traz desligada por omissão) e verde nas outras
 * quatro — foi assim que a divergência foi medida.
 *
 * Sobrevive ao REPLAY: cada passo estabelece a própria precondição, e o par
 * `abrir`/`fechar` garante um clique real nesta rodada partindo de um estado
 * conhecido, em vez de alternar a partir do que a rodada anterior deixou.
 */
export const CloseOnSecondClick: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" class="nds-max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
          <AccordionContent>
            Acesse a tela de login e clique em "Esqueci minha senha".
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Quais formas de pagamento são aceitas?</AccordionTrigger>
          <AccordionContent>
            Aceitamos cartão de crédito, Pix e boleto bancário.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    covers: ['functional.item2'],
    docs: {
      // A ausência de configuração É o assunto: a raiz sai sem valor inicial e
      // sem chave nenhuma, o que a do meta esconderia.
      source: { transform: segundoClickSourceAccordionClose },
      description: {
        story: 'Modo único sem nenhuma configuração extra: clicar de novo no item aberto o fecha.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Clicar de novo no item aberto o fecha', async () => {
      const triggers = canvas.getAllByRole('button');
      await abrir(triggers[0]);  // precondição própria: garantidamente aberto
      await fechar(triggers[0]); // clique real nesta rodada + asserção de estado
    });

    await step('O painel recolhe de fato, não só o atributo', async () => {
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
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="multiple" class="nds-max-w-lg">
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
    `,
  }),
  parameters: {
    covers: ['functional.item4'],
    docs: {
      // Outro modo na raiz e outro conjunto de itens — a do meta mostraria o
      // modo único, que é o contrato oposto.
      source: { transform: accordionMultipleSource },
      description: {
        story: 'Modo multiple. Múltiplos itens podem estar abertos ao mesmo tempo. Use para especificações técnicas comparáveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Abrir dois itens — ambos permanecem expandidos (modo múltiplo)', async () => {
      const triggers = canvas.getAllByRole('button');
      await abrir(triggers[0]);
      await abrir(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar em trigger aberto fecha o item individualmente (modo múltiplo)', async () => {
      const triggers = canvas.getAllByRole('button');
      await fechar(triggers[0]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Controlled: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() {
      const value = ref<string>('item-1');
      return { value };
    },
    template: `
      <div class="nds-stack nds-w-lg" data-spacing="sm">
        <p class="nds-text-caption nds-text-muted-foreground">
          Item aberto: <code>{{ value || 'nenhum' }}</code>
        </p>
        <Accordion
          type="single"
          :model-value="value"
          @update:model-value="value = $event"
          class="nds-w-full"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1 — controlado</AccordionTrigger>
            <AccordionContent>Estado gerenciado externamente via model-value + @update:model-value.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2 — controlado</AccordionTrigger>
            <AccordionContent>Útil para sincronizar com URL ou outro estado da aplicação.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    `,
  }),
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O estado sai do componente e vira `ref` de quem consome, com indicador
      // em volta: é script e marcação que a do meta não tem.
      source: { transform: accordionControladoSource },
      description: {
        story: 'Modo controlado. model-value e @update:model-value gerenciam o estado externamente. O indicador acima mostra o item ativo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 começa aberto (valor inicial controlado)', async () => {
      const triggers = canvas.getAllByRole('button');
      await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
    });

    await step('Clicar em item 2 atualiza o estado externo', async () => {
      const triggers = canvas.getAllByRole('button');
      await abrir(triggers[1]);
    });
  },
};

export const DefaultOpen: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" default-value="item-1" class="nds-max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item aberto por padrão</AccordionTrigger>
          <AccordionContent>
            Este item inicia expandido via <code>default-value="item-1"</code>.
            Não é modo controlado — o estado interno gerencia após a montagem.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item fechado por padrão</AccordionTrigger>
          <AccordionContent>Este item inicia colapsado.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O valor inicial é o assunto, e o par de itens contrasta aberto contra
      // fechado — outra composição que a do meta não mostra.
      source: { transform: defaultSourceAccordionOpen },
      description: {
        story: 'Prop default-value abre um item na montagem sem modo controlado. Use em documentação e onboarding.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 inicia expandido via valor inicial', async () => {
      const triggers = canvas.getAllByRole('button');
      await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
