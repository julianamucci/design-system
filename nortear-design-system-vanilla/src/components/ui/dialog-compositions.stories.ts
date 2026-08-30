import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createDialog } from './dialog';
import { dialogWithFormSource, dialogSource, dialogSourceWith } from './dialog.source';
import { createButton } from './button';
import {
  open,
  mountOpen,
  cantoButtonClose,
  buildField,
  checkNameEDescricao,
  waitForOpen,
  waitForClosed,
  close,
  trigger,
  makeFooter,
  panel,
} from './dialog.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Primitives/Overlay/Dialog/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          'Composicoes reais do Dialog: confirmação por e-mail, edição de perfil e pré-visualização de mídia.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ConfirmEmail: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Confirmação de envio de e-mail com mensagem informativa e ação primária neutra.',
      },
    },
  },
  render: () => {
    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent =
      'Vamos enviar um link para maria@exemplo.com. Confirme o endereço antes de prosseguir.';
    return mountOpen(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Confirmar e-mail' }),
        title: 'Confirmar e-mail',
        description: 'Verifique o endereço antes de enviar o link de acesso.',
        content: body,
        footer: makeFooter('Cancelar', 'Enviar link'),
      }),
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O diálogo se anuncia com o nome e a descrição do fluxo', async () => {
      await checkNameEDescricao(p);
    });

    await step('O endereço confirmado aparece no corpo, não só no título', async () => {
      // O dado que a pessoa precisa conferir antes de decidir tem que estar na
      // tela — o título sozinho não diz para onde o link vai.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).toHaveTextContent('maria@exemplo.com');
    });

    await step('A operação é reversível, então a ação primária é neutra', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons.length).toBe(2);
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-default');
    });
  },
};

export const ProfileEdit: Story = {
  parameters: {
    // Override de story: o corpo é uma composição de campos, e é a sub-fábrica
    // que fecha o par rótulo ↔ controle que esta composição existe para mostrar.
    docs: {
      source: {
        transform: dialogWithFormSource({
          fields: [
            { label: 'Nome de exibição', value: 'Maria Souza' },
            { label: 'Função', value: 'Designer' },
          ],
        }),
      },
      description: {
        story:
          'Edição de perfil em formulário modal — caso de uso canônico do Dialog. Combina com Form.',
      },
    },
  },
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.append(
      buildField('profile-name', 'Nome de exibição', 'text', 'Maria Souza'),
      buildField('profile-role', 'Função', 'text', 'Designer'),
    );
    return mountOpen(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
        title: 'Editar perfil',
        description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
        content: form,
        footer: makeFooter('Cancelar', 'Salvar alterações'),
      }),
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      const name = p.querySelector<HTMLInputElement>('#profile-name')!;
      await expect(name).toHaveAccessibleName('Nome de exibição');
      await expect(name.value).toBe('Maria Souza');

      const funcao = p.querySelector<HTMLInputElement>('#profile-role')!;
      await expect(funcao).toHaveAccessibleName('Função');
      await expect(funcao.value).toBe('Designer');
    });

    await step('O Tab percorre os campos na ordem em que aparecem', async () => {
      const name = p.querySelector<HTMLInputElement>('#profile-name')!;
      name.focus();
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector('#profile-role'));
    });
  },
};

export const MediaPreview: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item6'],
    // Override de story: sem rodapé, porque não há o que confirmar. O snippet do
    // meta traz o par de ações, que aqui seria o contrário do que a composição
    // recomenda.
    docs: {
      source: {
        transform: dialogSourceWith({
          triggerLabel: 'Pré-visualizar',
          title: 'Capa do post',
          description: 'Pré-visualização em tamanho real.',
          bodyText: 'Pré-visualização da mídia',
          footer: [],
        }),
      },
      description: {
        story:
          'Pré-visualização de mídia com botão Close visível. Bom uso do Dialog quando a ação é apenas "ver".',
      },
    },
  },
  render: () => {
    // Classes do sistema em vez de `style.aspectRatio` / `style.display`
    // inline: valor de design cravado no elemento sai do tema e da escala.
    const wrap = document.createElement('div');
    wrap.className =
      'nds-aspect-16-9 nds-w-full nds-rounded-md nds-bg-muted nds-cluster nds-text-caption nds-text-muted-foreground';
    wrap.dataset.align = 'center';
    wrap.dataset.justify = 'center';
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', 'Pré-visualização da capa do post');
    wrap.textContent = 'Pré-visualização da mídia';

    return mountOpen(
      createDialog({
        trigger: createButton({ variant: 'outline', label: 'Pré-visualizar' }),
        title: 'Capa do post',
        description: 'Pré-visualização em tamanho real.',
        content: wrap,
      }),
    );
  },
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
      await expect(document.activeElement).toBe(triggerEl);
      // Reabre: o Chromatic fotografa o estado final, e é o painel ABERTO que o
      // axe precisa varrer — `accessibility.item6` é declarado nesta story.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};
