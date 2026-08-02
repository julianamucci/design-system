import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';

const meta = {
  title: 'UI/AlertDialog/Composicoes',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes canônicas: confirmação destrutiva, confirmação neutra, descrição longa e layout responsivo.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Action e trigger usam a variante destructive do Button. Use para ações irreversíveis.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerVariant: 'destructive',
      triggerLabel: 'Excluir conta',
      title: 'Excluir sua conta?',
      description:
        'Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir conta',
      tone: 'destructive',
    },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();
    // Ambos trigger e action têm o mesmo texto; escolher o que está dentro do dialog.
    const actions = await body.findAllByRole('button', { name: /Excluir conta/i });
    const action = actions.find((el) => dialog.contains(el));
    await expect(action).toBeDefined();
    await expect(action!).toHaveClass('nds-button-destructive');
  },
};

export const Neutra: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Action com tokens padrão do Button. Use para confirmações não destrutivas (publicar, enviar, arquivar).',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerVariant: 'default',
      triggerLabel: 'Publicar agora',
      title: 'Publicar este conteúdo?',
      description:
        'Ao publicar, o conteúdo fica visível para todos os usuários. Você poderá editá-lo depois.',
      cancelLabel: 'Voltar',
      actionLabel: 'Publicar',
      tone: 'default',
    },
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();
    const action = await body.findByRole('button', { name: /^Publicar$/i });
    await expect(action).toBeVisible();
    // O ponto da variante neutra: a confirmação NÃO herda a severidade destrutiva.
    await expect(action).not.toHaveClass('nds-button-destructive');
    await expect(dialog).toHaveAccessibleName(/Publicar este conteúdo/i);
  },
};

// testes.visual.item4 — descrição longa (mais de uma linha) sem quebrar o painel.
export const DescricaoLonga: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Descrição com duas frases completas. O painel cresce em altura e a descrição continua sendo a fonte do aria-describedby.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerVariant: 'destructive',
      triggerLabel: 'Excluir conta',
      title: 'Excluir conta',
      description:
        'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
    },
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Descrição longa continua ligada por aria-describedby', async () => {
      const dialog = await body.findByRole('alertdialog');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      );
      await expect(description).not.toBeNull();
      await expect(dialog).toHaveAttribute('aria-describedby', description!.id);
      await expect(dialog).toHaveAccessibleDescription(/nenhuma cópia de segurança/i);
    });

    await step('Descrição ocupa mais de uma linha sem estourar o painel', async () => {
      const dialog = await body.findByRole('alertdialog');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      )!;
      const lineHeight = parseFloat(getComputedStyle(description).lineHeight);
      await expect(description.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
      await expect(description.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    });
  },
};

// testes.visual.item5 — layout responsivo. O empilhamento dos botões vem de
// `flex-direction: column-reverse` abaixo de 40rem (nds/alert-dialog.css), então
// a captura precisa acontecer numa viewport estreita: daí os viewports do
// Chromatic. A play verifica a ordem no DOM, que é o que produz o empilhamento
// (Cancel primeiro no DOM, visualmente abaixo do Action em mobile).
export const Responsivo: Story = {
  parameters: {
    chromatic: { viewports: [375, 1024] },
    docs: {
      description: {
        story:
          'Abaixo de 40rem o footer empilha os botões em column-reverse e o header centraliza. Acima disso os botões ficam lado a lado, alinhados à direita.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerVariant: 'destructive',
      triggerLabel: 'Excluir conta',
      title: 'Excluir conta',
      description:
        'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
    },
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Footer segue a ordem Cancel → Action no DOM', async () => {
      const dialog = await body.findByRole('alertdialog');
      const footer = dialog.querySelector<HTMLElement>('[data-slot="alert-dialog-footer"]');
      await expect(footer).not.toBeNull();
      await expect(footer).toHaveClass('nds-alert-dialog-footer');
      const labels = Array.from(footer!.querySelectorAll('button')).map((b) =>
        b.textContent?.trim(),
      );
      await expect(labels).toEqual(['Cancelar', 'Excluir']);
    });

    await step('Painel respeita a margem lateral em qualquer largura', async () => {
      const dialog = await body.findByRole('alertdialog');
      const rect = dialog.getBoundingClientRect();
      await expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
      await expect(rect.left).toBeGreaterThanOrEqual(0);
    });
  },
};
