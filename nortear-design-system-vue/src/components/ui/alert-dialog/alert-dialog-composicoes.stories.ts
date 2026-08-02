import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';

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
        component: 'Composicoes canônicas: confirmação destrutiva e neutra.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
};

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
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">Excluir conta</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive">
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();

    const action = within(dialog).getByRole('button', { name: /Excluir conta/i });
    await expect(action).toHaveClass('nds-button-destructive');

    // Guideline: Cancel sempre antes de Action no DOM.
    const labels = within(dialog)
      .getAllByRole('button')
      .map((b) => b.textContent?.trim());
    await expect(labels).toEqual(['Cancelar', 'Excluir conta']);
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
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button>Publicar agora</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao publicar, o conteúdo fica visível para todos os usuários. Você poderá editá-lo depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction>Publicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();

    const action = within(dialog).getByRole('button', { name: /^Publicar$/i });
    await expect(action).toBeVisible();
    // A severidade vem do Button: na composição neutra o Action não pode
    // herdar os tokens destrutivos.
    await expect(action).not.toHaveClass('nds-button-destructive');

    const labels = within(dialog)
      .getAllByRole('button')
      .map((b) => b.textContent?.trim());
    await expect(labels).toEqual(['Voltar', 'Publicar']);
  },
};
