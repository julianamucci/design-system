import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Accordion } from './index';
import AccordionStory from './AccordionStory.svelte';
import AccordionControlledStory from './AccordionControlledStory.svelte';
import {
  accordionControlledSource,
  segundoClickAccordionFechaSource,
  accordionMultiploSource,
  accordionSource,
} from './accordion.source';

const meta: Meta = {
  parameters: {
    design: figmaDesign('accordion'),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada modo que muda a
      // marcação sobrescreve com a própria composição logo abaixo.
      source: { transform: accordionSource },
    },
  },
  title: 'UI/Accordion/Variants',
  component: Accordion,
  tags: ['disclosure'],
};

export default meta;
type Story = StoryObj;

// Idempotentes: o painel Interactions reexecuta a play no MESMO DOM, então o
// estado de partida é o que a rodada anterior deixou. Um clique cego ALTERNA —
// a partir do estado errado ele inverte o resultado e a asserção seguinte falha.
const open = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const close = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

const FAQ_ITEMS = [
  { value: 'item-1', q: 'Como faço para redefinir minha senha?', a: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'item-2', q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos cartão de crédito, Pix e boleto bancário.' },
  { value: 'item-3', q: 'Como cancelo minha assinatura?', a: 'Você pode cancelar a qualquer momento em Configuracoes → Assinatura.' },
];

const DEFAULT_OPEN_ITEMS = [
  { value: 'item-1', q: 'Item aberto por padrão',  a: 'Este item inicia expandido via valor inicial. Não é modo controlado — o estado interno gerencia após a montagem.' },
  { value: 'item-2', q: 'Item fechado por padrão', a: 'Este item inicia colapsado.' },
];

const SPEC_ITEMS = [
  { value: 'especificacoes', q: 'Especificações técnicas', a: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe' },
  { value: 'compatibilidade', q: 'Compatibilidade', a: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS' },
  { value: 'garantia', q: 'Garantia e suporte', a: '24 meses de garantia de fábrica. Suporte técnico 24/7.' },
];

export const Single: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', defaultValue: 'item-1', items: FAQ_ITEMS },
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
      await open(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger ativo fecha o item', async () => {
      const triggers = canvas.getAllByRole('button');
      await close(triggers[1]);
    });
  },
};

/**
 * O fechar-ao-clicar-de-novo, medido sem nenhuma configuração.
 *
 * A raiz é montada só com o modo único — sem valor inicial e sem nenhuma chave
 * extra. É esse recorte que prova o contrato: o comportamento não depende de uma
 * configuração que quem consome precise lembrar de ligar. Enquanto a prop
 * `collapsible` existia na tabela compartilhada, esta story ficava vermelha na
 * stack cuja lib a trazia desligada por omissão — foi como a divergência foi
 * medida.
 *
 * Sobrevive ao REPLAY: cada passo estabelece a própria precondição, e o par
 * `open`/`close` garante um clique real nesta rodada partindo de um estado
 * conhecido, em vez de alternar a partir do que a rodada anterior deixou.
 */
export const CloseOnSecondClick: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', items: FAQ_ITEMS.slice(0, 2) },
  }),
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: { transform: segundoClickAccordionFechaSource },
      description: {
        story: 'Modo único sem nenhuma configuração extra: clicar de novo no item aberto o fecha.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Clicar de novo no item aberto o fecha', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[0]);  // precondição própria: garantidamente aberto
      await close(triggers[0]); // clique real nesta rodada + asserção de estado
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
    Component: AccordionStory,
    props: { type: 'multiple', items: SPEC_ITEMS },
  }),
  parameters: {
    covers: ['functional.item4'],
    docs: {
      source: { transform: accordionMultiploSource },
      description: {
        story: 'Modo multiple. Múltiplos itens podem estar abertos ao mesmo tempo. Use para especificações técnicas comparáveis.',
      },
    },
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Abrir dois itens — ambos permanecem expandidos (modo múltiplo)', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[0]);
      await open(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar em trigger aberto fecha o item individualmente (modo múltiplo)', async () => {
      const triggers = canvas.getAllByRole('button');
      await close(triggers[0]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

// Wrapper sem props: o Args generico nao e atribuivel a Record<string, never>.
export const Controlled: StoryObj<Record<string, never>> = {
  render: () => ({ Component: AccordionControlledStory }),
  parameters: {
    covers: ['functional.item6'],
    docs: {
      source: { transform: accordionControlledSource },
      description: {
        story: 'Modo controlado. value e onValueChange gerenciam o estado externamente. O indicador acima mostra o item ativo.',
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
      await open(triggers[1]);
    });
  },
};

export const DefaultOpen: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', defaultValue: 'item-1', items: DEFAULT_OPEN_ITEMS },
  }),
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story: 'Prop defaultValue abre um item na montagem sem modo controlado. Use em documentação e onboarding.',
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
