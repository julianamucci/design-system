import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createDialog } from './dialog';
import { dialogWithFormSource, dialogSource, dialogSourceWith } from './dialog.source';
import { createButton } from './button';
import {
  t,
  open,
  mountOpen,
  cantoButtonClose,
  buildField,
  waitForOpen,
  waitForClosed,
  close,
  trigger,
  panel,
} from './dialog.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Dialog/Compositions',
  parameters: {
    design: figmaDesign('dialog'),
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          'Composicoes reais do Dialog: edição de perfil e pré-visualização de mídia.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

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
    form.addEventListener('submit', (e) => e.preventDefault());
    form.append(
      buildField('profile-name', 'Nome de exibição', 'text', 'Maria Souza'),
      buildField('profile-role', 'Função', 'text', 'Designer'),
    );

    // O rodapé fica DENTRO do `<form>` (PRD D10), e a primária é
    // `type: 'submit'`. É a mesma forma da story `WithForm` e da docs page desta
    // stack — e o motivo é o oposto do submit órfão: aqui o formulário existia e
    // NENHUM botão o submetia. Com dois campos o navegador não faz o envio
    // implícito, então o Enter num campo não disparava nada, em silêncio. A
    // opção `footer` da fábrica não serve porque anexa o rodapé como IRMÃO do
    // corpo, fora do formulário.
    const footerEl = document.createElement('div');
    footerEl.className = 'nds-dialog-footer';
    footerEl.dataset.slot = 'dialog-footer';
    footerEl.append(
      createButton({ variant: 'outline', label: t('demonstration.labels.cancel') }),
      createButton({ label: t('demonstration.labels.action'), type: 'submit' }),
    );
    form.appendChild(footerEl);

    return mountOpen(
      createDialog({
        trigger: createButton({
          variant: 'outline',
          label: t('demonstration.labels.triggerLabel'),
        }),
        title: t('demonstration.labels.title'),
        description: t('demonstration.labels.description'),
        content: form,
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

    await step('A primária é submit DENTRO do form, com o rodapé junto (D10)', async () => {
      // A asserção é a RELAÇÃO de contenção, e não a presença do atributo: era
      // o rodapé irmão do corpo que deixava o formulário sem NENHUMA forma de
      // submeter — dois campos, sem envio implícito, e o Enter num campo não
      // disparava nada. `button.form` é a leitura que denuncia o órfão.
      const form = p.querySelector<HTMLFormElement>('form')!;
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(form.contains(footer)).toBe(true);

      const submit = footer.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      await expect(submit).toHaveAccessibleName(t('demonstration.labels.action'));
      await expect(submit.form).toBe(form);
      // Dentro de um form o padrão do HTML para `<button>` é `submit`: o
      // Cancelar precisa dizer `type="button"`, e é o que a fábrica já dá.
      const cancelar = footer.querySelector<HTMLButtonElement>('button:not([type="submit"])')!;
      await expect(cancelar.type).toBe('button');
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
