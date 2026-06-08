import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Accordion } from './index';
import AccordionIconStory from './AccordionIconStory.svelte';
import AccordionBadgeStory from './AccordionBadgeStory.svelte';
import AccordionRichStory from './AccordionRichStory.svelte';
import AccordionFAQStory from './AccordionFAQStory.svelte';

const meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Accordion/Composicoes',
  component: Accordion,
  tags: ['disclosure'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIconeNoTrigger: Story = {
  render: () => ({ Component: AccordionIconStory }),
  parameters: {
    docs: {
      description: {
        story: 'Ícones no trigger. Adicione aria-hidden="true" no ícone — o texto do trigger já descreve o item para leitores de tela.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const ComBadgeNoTrigger: Story = {
  render: () => ({ Component: AccordionBadgeStory }),
  parameters: {
    docs: {
      description: {
        story: 'Badge no trigger para sinalizar status (Novo, Beta). O badge é decorativo — o texto do trigger deve ser autoexplicativo.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const ConteudoRico: Story = {
  render: () => ({ Component: AccordionRichStory }),
  parameters: {
    docs: {
      description: {
        story: 'AccordionContent aceita qualquer conteúdo Svelte. Use para tabelas de dados, parágrafos ou listas estruturadas.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const FAQ: Story = {
  render: () => ({ Component: AccordionFAQStory }),
  parameters: {
    docs: {
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
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
