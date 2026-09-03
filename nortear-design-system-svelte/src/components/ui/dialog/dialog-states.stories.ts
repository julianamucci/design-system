import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, expect, waitFor, fn } from 'storybook/test';
import DialogStory from './DialogStory.svelte';
import { dialogSource } from './dialog.source';
import {
  open,
  cantoButtonClose,
  checkNameAndDescription,
  waitForOpen,
  waitForClosed,
  trigger,
  overlay,
  panel,
} from './dialog.fixtures';

const meta: Meta = {
  title: 'Primitives/Overlay/Dialog/States',
  component: DialogStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Os quatro estados saem dos mesmos args que a transform já lê: o que
      // muda entre eles é o valor inicial do estado ligado e o botão do canto.
      source: { transform: dialogSource },
      description: {
        component:
          'Cada configuração canônica do Dialog: closed, open, withCloseButtonHidden e controlled.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não renderizado.' } },
  },
  args: {
    open: false,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  // Esta story não interage com nada: é aqui que a leitura do estado de
  // MONTAGEM vale, porque nenhum replay pode ter mudado o que ela observa.
  play: async ({ canvasElement, step }) => {
    const triggerEl = trigger(canvasElement)!;

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // O portal é estrutural: fechado, nem o overlay nem o painel estão no
      // DOM. Um painel escondido por CSS continuaria na ordem de tabulação e
      // seria lido pelo leitor de tela.
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(triggerEl).toBeVisible();
    });

    await step('O gatilho anuncia que abre um diálogo, e que está recolhido', async () => {
      await expect(triggerEl).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(triggerEl).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Diálogo aberto. Captura visual no Chromatic.' } },
  },
  args: {
    open: true,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
  },
  play: async ({ step }) => {
    // `waitForOpen` e não o helper idempotente: esta story tem que provar que
    // o estado inicial MONTA aberto. Abrir por clique aqui passaria mesmo com a
    // prop sendo ignorada em silêncio.
    const p = await waitForOpen();

    await step('Monta já aberto, sem estado externo nenhum', async () => {
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('aria-modal', 'true');
      await expect(overlay()).toBeVisible();
      await checkNameAndDescription(p);
    });

    await step('E o foco já está dentro do painel', async () => {
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'showCloseButton={false} no Content. Sem X no canto — fechar apenas por Escape, overlay ou ação do Footer.',
      },
    },
  },
  args: {
    open: true,
    showCloseButton: false,
    triggerLabel: 'Convidar',
    title: 'Convidar para o time',
    description: 'Envie um convite por e-mail.',
    actionLabel: 'Enviar convite',
    cancelLabel: 'Cancelar',
  },
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem X no canto', async () => {
      await expect(cantoButtonClose(p)).toBeNull();
    });

    await step('Escape continua fechando — nunca se tira toda saída', async () => {
      // Sem o X, Escape e o Cancelar do rodapé são as saídas que restam.
      // Retirar todas de uma vez deixaria o diálogo sem fechamento acessível.
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final, e o que esta story existe
      // para mostrar é o painel SEM o X no canto.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

// Espião do modo controlado. Vive fora do `render` para que a play alcance as
// chamadas — spy criado dentro do render é inalcançável e deixa a aba Actions
// vazia. `mockClear()` no início da play zera o que a execução anterior deixou.
const spyCancelar = fn();

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: { story: 'Abertura controlada externamente via bind:open. Escape fecha mesmo controlado.' },
    },
  },
  args: {
    open: false,
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este diálogo é comandado por estado externo via bind:open.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onCancel: spyCancelar,
  },
  play: async ({ canvasElement, step }) => {
    const triggerEl = trigger(canvasElement)!;
    spyCancelar.mockClear();

    await step('Nasce fechado, porque o valor externo diz que sim', async () => {
      await expect(panel()).toBeNull();
    });

    await step('Interagir avisa o dono do estado, e o painel segue o valor', async () => {
      const p = await open(canvasElement);
      await expect(p).toBeVisible();
      await expect(triggerEl).toHaveAttribute('aria-expanded', 'true');
    });

    await step('O Cancelar do rodapé passa pelo callback do pai', async () => {
      const p = panel()!;
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await userEvent.click(buttons[0]);
      await waitForClosed();
      await expect(spyCancelar).toHaveBeenCalled();
    });

    await step('Escape também fecha, e o estado externo acompanha', async () => {
      await open(canvasElement);
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      await expect(panel()).toBeNull();
      await expect(triggerEl).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
