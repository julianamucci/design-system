import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import {
  drawerComConfirmacaoSource,
  drawerComFormularioSource,
  drawerComRolagemSource,
  drawerSource,
} from './drawer.source';

const meta: Meta = {
  title: 'UI/Drawer/Compositions',
  component: DrawerStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cada composição traz um corpo próprio e sobrescreve logo abaixo; o meta
      // garante que nenhuma story do arquivo caia no andaime.
      source: { transform: drawerSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar, confirmação reversível e corpo mais alto que o painel.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithForm: Story = {
  args: {
    direction: 'right',
    defaultOpen: true,
    variant: 'withForm',
    title: 'Editar dados pessoais',
    description: 'Atualize seu nome e e-mail.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: drawerComFormularioSource },
      description: {
        story:
          'Formulário curto no corpo e par de ações no rodapé. Título e descrição dizem o que está sendo editado — juntos formam o nome e a descrição acessíveis do painel.',
      },
    },
  },
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');
    const dentro = within(painel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(painel).toHaveAccessibleName('Editar dados pessoais');
      await expect(painel).toHaveAccessibleDescription('Atualize seu nome e e-mail.');
      // Os campos são achados pelo RÓTULO: se `for`/`id` não casassem, o input
      // ficaria sem nome acessível e a busca falharia.
      await expect(dentro.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(dentro.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step('O rodapé oferece confirmar e cancelar', async () => {
      const rodape = painel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      await expect(rodape).not.toBeNull();
      const nomes = within(rodape).getAllByRole('button').map((b) => b.textContent?.trim());
      await expect(nomes).toContain('Confirmar');
      await expect(nomes).toContain('Cancelar');
    });
  },
};

export const WithConfirmation: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    variant: 'withConfirmation',
    title: 'Remover anexo?',
    description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
    actionLabel: 'Remover',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      source: { transform: drawerComConfirmacaoSource },
      description: {
        story:
          'Mensagem curta e par de ações. Vale para confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.',
      },
    },
  },
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');
    const dentro = within(painel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(painel).toHaveAccessibleName('Remover anexo?');
      await expect(painel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step('Cancelar continua sendo a saída de menor risco', async () => {
      const cancelar = dentro.getByRole('button', { name: /Cancelar/i });
      await expect(cancelar).toHaveClass('nds-button-outline');
      await expect(dentro.getByRole('button', { name: /^Remover$/i })).toBeVisible();
    });
  },
};

export const WithScroll: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    variant: 'withScroll',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    docs: {
      source: { transform: drawerComRolagemSource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');
    const corpo = painel.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
    const rodape = painel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(corpo).not.toBeNull();
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: o mínimo automático zero de um item com
      // overflow é o que faz o corpo ceder altura em vez de esticar a caixa.
      // O painel NÃO é contêiner de rolagem, e é isso que prova o contrato.
      // Medir `scrollHeight <= clientHeight` nele não provava nada: sem
      // `overflow` declarado o computado é `visible`, e elemento visível não
      // rola por maior que seja o `scrollHeight`. Sonda no navegador com o
      // corpo já correto: painel client 719 / scroll 2157, corpo client 559 /
      // scroll 1524 — ou seja, o corpo cede altura e rola, e o número do painel
      // era só a caixa de conteúdo não recortada.
      await expect(['auto', 'scroll']).not.toContain(
        getComputedStyle(painel).overflowY,
      );
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo. É a regra scrollable-region-focusable do axe.
      await expect(corpo).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const caixaRodape = rodape.getBoundingClientRect();
      const caixaPainel = painel.getBoundingClientRect();
      await expect(caixaRodape.bottom).toBeLessThanOrEqual(caixaPainel.bottom + 1);
      await expect(caixaRodape.height).toBeGreaterThan(0);
    });
  },
};
