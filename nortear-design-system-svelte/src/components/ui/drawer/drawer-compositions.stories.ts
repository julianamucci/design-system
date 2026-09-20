import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, waitFor } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import {
  drawerWithConfirmSource,
  drawerWithFormSource,
  drawerSource,
} from './drawer.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/Drawer/Compositions',
  component: DrawerStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('drawer'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cada composição traz um corpo próprio e sobrescreve logo abaixo; o meta
      // garante que nenhuma story do arquivo caia no andaime.
      source: { transform: drawerSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar e confirmação reversível.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithForm: Story = {
  args: {
    // Em BAIXO, como nas outras quatro stacks. A direção não é o assunto desta
    // composição — o assunto é o formulário no corpo e o par de ações no rodapé
    // —, e abrir de um lado aqui e de outro lá tira das cinco páginas a única
    // coisa que compará-las responde.
    direction: 'bottom',
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
      source: { transform: drawerWithFormSource },
      description: {
        story:
          'Formulário curto no corpo e par de ações no rodapé. Título e descrição dizem o que está sendo editado — juntos formam o nome e a descrição acessíveis do painel.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const inside = within(panel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(panel).toHaveAccessibleName('Editar dados pessoais');
      await expect(panel).toHaveAccessibleDescription('Atualize seu nome e e-mail.');
      // Os campos são achados pelo RÓTULO: se `for`/`id` não casassem, o input
      // ficaria sem nome acessível e a busca falharia.
      await expect(inside.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(inside.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step('O rodapé escreve o secundário ANTES do primário', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      await expect(footer).not.toBeNull();
      const names = within(footer).getAllByRole('button').map((b) => b.textContent?.trim());
      // `toContain` não afirmava ordem nenhuma, e a ordem é o contrato (D1 do
      // PRD): uma só marcação serve aos dois eixos, e é a FOLHA que escolhe o
      // eixo. Invertida, o empilhamento põe o primário embaixo.
      await expect(names).toEqual(['Cancelar', 'Confirmar']);
    });

    await step('E é a folha que decide o eixo, não a marcação', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      // `column-reverse` empilhado põe o primário EM CIMA; `row` a partir de
      // 40rem o põe à direita. A mesma ordem de DOM serve aos dois — é por isso
      // que inverter a marcação para "arrumar" um eixo quebra o outro.
      const expectedAxis = window.innerWidth >= 640 ? 'row' : 'column-reverse';
      await expect(getComputedStyle(footer).flexDirection).toBe(expectedAxis);
    });

    await step('Confirmar submete o formulário do corpo', async () => {
      // `button.form` é o que denuncia o botão órfão: vem `null` quando nada o
      // liga ao `<form>`, e nada na tela denuncia. Leitura pura, sem `waitFor`.
      const confirmar = inside.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement;
      await expect(confirmar.type).toBe('submit');
      await expect(confirmar.form?.id).toBe('drawer-story-form');
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
      source: { transform: drawerWithConfirmSource },
      description: {
        story:
          'Mensagem curta e par de ações. Vale para confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const inside = within(panel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(panel).toHaveAccessibleName('Remover anexo?');
      await expect(panel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step('Cancelar continua sendo a saída de menor risco', async () => {
      const cancelar = inside.getByRole('button', { name: /Cancelar/i });
      await expect(cancelar).toHaveClass('nds-button-outline');
      const destructiveAction = inside.getByRole('button', { name: /^Remover$/i });
      await expect(destructiveAction).toBeVisible();
      // A ação que remove se ANUNCIA como destrutiva, como nas outras quatro
      // stacks: o contraste entre as duas é o que separa a saída da consequência
      // antes de a pessoa ler o rótulo.
      await expect(destructiveAction).toHaveClass('nds-button-destructive');
    });

    await step('O foco abre no cancelar, não na ação principal', async () => {
      // O ELEMENTO, não a mera presença de foco: sem a escolha explícita o foco
      // cairia no corpo rolável, que também fica dentro do painel.
      const cancelar = inside.getByRole('button', { name: /^Cancelar$/i });
      const acao = inside.getByRole('button', { name: /^Remover$/i });
      await waitFor(() => expect(cancelar).toHaveFocus());
      await expect(acao).not.toHaveFocus();
    });

    await step('Sem formulário no corpo, a ação não promete envio', async () => {
      // O rodapé é ÚNICO para as quatro variantes do andaime. O elo de envio
      // que a WithForm precisa não pode vazar para cá: `type="submit"` sem
      // `<form>` é a mesma promessa vazia, só que em outro painel.
      const acao = inside.getByRole('button', { name: /^Remover$/i }) as HTMLButtonElement;
      await expect(acao.type).toBe('button');
      await expect(acao.form).toBeNull();
    });
  },
};
