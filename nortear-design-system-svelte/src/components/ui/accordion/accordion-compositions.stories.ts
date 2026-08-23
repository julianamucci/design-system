import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Accordion } from './index';
import AccordionIconStory from './AccordionIconStory.svelte';
import AccordionBadgeStory from './AccordionBadgeStory.svelte';
import AccordionRichStory from './AccordionRichStory.svelte';
import AccordionFAQStory from './AccordionFAQStory.svelte';
import {
  accordionWithBadgeSource,
  accordionWithIconSource,
  accordionContentRichSource,
  accordionFaqSource,
  accordionSource,
} from './accordion.source';

const meta: Meta = {
  parameters: {
    design: figmaDesign('accordionTrigger'),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada composição sobrescreve
      // com a própria marcação logo abaixo.
      source: { transform: accordionSource },
    },
  },
  title: 'UI/Accordion/Compositions',
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

export const WithIconInTrigger: Story = {
  render: () => ({ Component: AccordionIconStory }),
  parameters: {
    covers: ['functional.item1', 'visual.item4'],
    docs: {
      source: { transform: accordionWithIconSource },
      description: {
        story: 'Ícones no trigger. Adicione aria-hidden="true" no ícone — o texto do trigger já descreve o item para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger é acessível pelo texto, não pelo ícone', async () => {
      // Busca pelo nome acessível: se o ícone vazasse para a árvore de
      // acessibilidade, o nome não seria exatamente o rótulo e isto falharia.
      const trigger = canvas.getByRole('button', { name: /^informação$/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Clicar no trigger abre o item correspondente', async () => {
      const trigger = canvas.getByRole('button', { name: /^informação$/i });
      await open(trigger);
    });
  },
};

export const WithBadgeInTrigger: Story = {
  render: () => ({ Component: AccordionBadgeStory }),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: accordionWithBadgeSource },
      description: {
        story: 'Badge no trigger para sinalizar status (Novo, Beta). O badge é decorativo — o texto do trigger deve ser autoexplicativo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger contém label e badge visíveis', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.textContent).toContain('Novo');
    });

    await step('Clicar abre o item correspondente', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await open(trigger);
    });
  },
};

export const RichContent: Story = {
  render: () => ({ Component: AccordionRichStory }),
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      source: { transform: accordionContentRichSource },
      description: {
        story: 'AccordionContent aceita qualquer conteúdo Svelte. Use para tabelas de dados, parágrafos ou listas estruturadas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Abrir o item renderiza o conteúdo rico (especificações)', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[0]);
      await expect(canvasElement.textContent).toContain('Intel Core i7-12700');
    });

    await step('Modo múltiplo: segundo item abre sem fechar o primeiro', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const FAQ: Story = {
  render: () => ({ Component: AccordionFAQStory }),
  parameters: {
    covers: ['functional.item1', 'functional.item3'],
    docs: {
      source: { transform: accordionFaqSource },
      description: {
        story: 'Padrão FAQ canônico. Perguntas interrogativas completas no trigger. Respostas objetivas em 2–3 linhas no content.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Todos os triggers estão fechados por padrão', async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Clicar no primeiro abre apenas ele', async () => {
      await open(triggers[0]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
