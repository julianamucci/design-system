import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import DialogConfirmEmailStory from './DialogConfirmEmailStory.svelte';
import DialogProfileEditStory from './DialogProfileEditStory.svelte';
import DialogMediaPreviewStory from './DialogMediaPreviewStory.svelte';
import {
  abrir,
  botaoFecharDoCanto,
  conferirNomeEDescricao,
  esperarAberto,
  esperarFechado,
  fechar,
  gatilho,
  painel,
} from './dialog.fixtures';

const meta: Meta = {
  title: 'UI/Dialog/Compositions',
  // `tags` estava aninhado dentro de `docs.description` — no lugar errado o
  // Storybook simplesmente ignora, e estas stories ficavam fora do grupo de
  // overlays.
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Dialog em fluxos de produto: confirmar email, edição de perfil e pré-visualização de mídia.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ConfirmEmail: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Dialog usado para confirmar troca de email. Title nomeia a ação, Description orienta o usuário, Footer com Cancelar + Enviar confirmação.',
      },
    },
  },
  render: () => ({
    Component: DialogConfirmEmailStory,
    props: { open: true },
  }),
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step('O diálogo se anuncia com o nome e a descrição do fluxo', async () => {
      await conferirNomeEDescricao(p);
    });

    await step('O campo do fluxo está rotulado', async () => {
      const email = p.querySelector<HTMLInputElement>('#confirm-new-email')!;
      await expect(email).toHaveAccessibleName('Novo email');
      await expect(email.type).toBe('email');
    });

    await step('A operação é reversível, então a ação primária é neutra', async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>('button');
      await expect(botoes[botoes.length - 1]).toHaveClass('nds-button-default');
    });
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
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
    const p = await esperarAberto();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      // O valor entra na asserção junto com o rótulo: era exatamente aqui que
      // um `defaultValue` inexistente na lib deixava os campos VAZIOS enquanto
      // a story dizia mostrá-los preenchidos, e nada reprovava.
      const nome = p.querySelector<HTMLInputElement>('#profile-name')!;
      await expect(nome).toHaveAccessibleName('Nome completo');
      await expect(nome.value).toBe('Maria Silva');

      const usuario = p.querySelector<HTMLInputElement>('#profile-username')!;
      await expect(usuario).toHaveAccessibleName('Nome de usuário');
      await expect(usuario.value).toBe('@mariasilva');
    });

    await step('O rodapé fica dentro do formulário, e o envio não é o Cancelar', async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(rodape.closest('form')).not.toBeNull();
      const botoes = rodape.querySelectorAll<HTMLButtonElement>('button');
      await expect(botoes[0].type).toBe('button');
      await expect(botoes[botoes.length - 1].type).toBe('submit');
    });
  },
};

export const MediaPreview: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item6'],
    docs: {
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
    const p = await esperarAberto();

    await step('A mídia tem descrição textual', async () => {
      // O bloco carrega a informação do diálogo — sem nome acessível o conteúdo
      // inteiro desapareceria para quem usa leitor de tela.
      await expect(within(p).getByRole('img')).toHaveAccessibleName();
    });

    await step('Sem rodapé de ações, porque não há o que confirmar', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
    });

    await step('O botão de fechar é a saída, e devolve o foco ao gatilho', async () => {
      const trigger = gatilho(canvasElement)!;
      // A devolução do foco só faz sentido se o diálogo tiver sido ABERTO pelo
      // gatilho. Esta story MONTA aberta, e nesse caminho o elemento focado
      // antes era o próprio documento — era para lá que o foco voltava, com razão.
      // Fechar e reabrir pelo gatilho estabelece a precondição do que se quer
      // provar.
      await fechar();
      await abrir(canvasElement);
      const x = botaoFecharDoCanto(painel()!)!;
      await expect(x).toHaveAccessibleName();
      await userEvent.click(x);
      await esperarFechado();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
      // Reabre: o Chromatic fotografa o estado final, e é o painel ABERTO que o
      // axe precisa varrer — `accessibility.item6` é declarado nesta story.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};
