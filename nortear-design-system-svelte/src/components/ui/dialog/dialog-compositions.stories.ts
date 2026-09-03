import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import DialogProfileEditStory from './DialogProfileEditStory.svelte';
import DialogMediaPreviewStory from './DialogMediaPreviewStory.svelte';
import {
  dialogEditarPerfilSource,
  dialogPreviaDeMidiaSource,
  dialogSource,
} from './dialog.source';
import {
  open,
  cantoButtonClose,
  waitForOpen,
  waitForClosed,
  close,
  trigger,
  panel,
} from './dialog.fixtures';

const meta: Meta = {
  title: 'Primitives/Overlay/Dialog/Compositions',
  // `tags` estava aninhado dentro de `docs.description` — no lugar errado o
  // Storybook simplesmente ignora, e estas stories ficavam fora do grupo de
  // overlays.
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cada fluxo tem marcação própria e sobrescreve logo abaixo; o meta
      // garante que nenhuma story do arquivo caia no andaime.
      source: { transform: dialogSource },
      description: {
        component:
          'Composicoes reais do Dialog em fluxos de produto: edição de perfil e pré-visualização de mídia.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      source: { transform: dialogEditarPerfilSource },
      description: {
        story:
          'Edição de perfil em formulário modal — caso de uso canônico do Dialog. O rodapé fica dentro do formulário para que o envio seja um submit de verdade.',
      },
    },
  },
  render: () => ({
    Component: DialogProfileEditStory,
    props: { open: true },
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      // O valor entra na asserção junto com o rótulo: era exatamente aqui que
      // um `defaultValue` inexistente na lib deixava os campos VAZIOS enquanto
      // a story dizia mostrá-los preenchidos, e nada reprovava.
      const name = p.querySelector<HTMLInputElement>('#profile-name')!;
      await expect(name).toHaveAccessibleName('Nome completo');
      await expect(name.value).toBe('Maria Silva');

      const usuario = p.querySelector<HTMLInputElement>('#profile-username')!;
      await expect(usuario).toHaveAccessibleName('Nome de usuário');
      await expect(usuario.value).toBe('@mariasilva');
    });

    await step('O rodapé fica dentro do formulário, e o envio não é o Cancelar', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(footer.closest('form')).not.toBeNull();
      const buttons = footer.querySelectorAll<HTMLButtonElement>('button');
      await expect(buttons[0].type).toBe('button');
      await expect(buttons[buttons.length - 1].type).toBe('submit');
    });
  },
};

export const MediaPreview: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item6'],
    docs: {
      source: { transform: dialogPreviaDeMidiaSource },
      description: {
        story:
          'Pré-visualização de mídia em destaque, sem Footer. Fechamento via X, Escape ou clique no overlay.',
      },
    },
  },
  render: () => ({
    Component: DialogMediaPreviewStory,
    props: { open: true },
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('A mídia tem descrição textual', async () => {
      // O bloco carrega a informação do diálogo — sem nome acessível o conteúdo
      // inteiro desapareceria para quem usa leitor de tela.
      await expect(within(p).getByRole('img')).toHaveAccessibleName();
    });

    await step('Sem rodapé de ações, porque não há o que confirmar', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
    });

    await step('O botão de fechar é a saída, e devolve o foco ao gatilho', async () => {
      const triggerEl = trigger(canvasElement)!;
      // A devolução do foco só faz sentido se o diálogo tiver sido ABERTO pelo
      // gatilho. Esta story MONTA aberta, e nesse caminho o elemento focado
      // antes era o próprio documento — era para lá que o foco voltava, com razão.
      // Fechar e reabrir pelo gatilho estabelece a precondição do que se quer
      // provar.
      await close();
      await open(canvasElement);
      const x = cantoButtonClose(panel()!)!;
      await expect(x).toHaveAccessibleName();
      await userEvent.click(x);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(triggerEl);
      });
      // Reabre: o Chromatic fotografa o estado final, e é o painel ABERTO que o
      // axe precisa varrer — `accessibility.item6` é declarado nesta story.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};
