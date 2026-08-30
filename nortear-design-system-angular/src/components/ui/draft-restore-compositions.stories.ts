import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NdsComposer } from './composer';
import { NdsDraftRestore } from './draft-restore';
import {
  SAMPLE_DRAFT,
  SAMPLE_TIMESTAMP,
  composerLabels,
  draftLabels,
} from './draft-restore.fixtures';
import { draftAboveComposerSource } from './draft-restore.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A faixa é AUTÔNOMA: o campo não sabe que ela existe. Ela fica ACIMA dele, e
// não dentro — o campo desenha o que se escreve agora, e isto é uma pergunta
// sobre antes. Nenhum arquivo do campo mudou por causa dela, e é isso que estas
// stories mostram.

const meta: Meta = {
  title: 'Primitives/Conversational/DraftRestore/Compositions',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer, NdsDraftRestore] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: draftAboveComposerSource },
      description: {
        component:
          'O lugar da faixa em relação ao campo, e o que ela deliberadamente NÃO faz quando alguém responde.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

/**
 * A faixa e o campo, montados lado a lado por quem consome.
 *
 * Os dois são irmãos num invólucro, e não pai e filho: é assim que a peça se
 * usa, e é o que prova que nada precisou ser acrescentado ao campo.
 *
 * Nenhum utilitário de pilha aqui, e é de propósito: a distância até o campo já
 * é do desenho da faixa (`margin-block-end`), e uma pilha por cima somaria o gap
 * dela ao respiro que a folha já declarou.
 */
const aboveComposer = (timestamp?: string) => ({
  props: {
    draftText: draftLabels(),
    labels: composerLabels(),
    draft: SAMPLE_DRAFT,
    timestamp,
    onAction,
  },
  template: `
    <div class="nds-max-w-lg">
      <nds-draft-restore
        [labels]="draftText"
        [draft]="draft"
        [timestamp]="timestamp"
        (action)="onAction($event)"
      />
      <nds-composer [labels]="labels" />
    </div>
  `,
});

export const AboveComposer: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item5', 'visual.item5'],
  },
  render: () => aboveComposer(SAMPLE_TIMESTAMP),
  play: async ({ canvasElement, step }) => {
    const band = canvasElement.querySelector<HTMLElement>('[data-slot="composer-draft"]')!;
    const composer = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;

    await step('A faixa fica ACIMA do campo, e fora dele', async () => {
      // Dentro do campo ela seria parte do que se escreve agora. Ela é uma
      // pergunta sobre antes, e por isso é irmã do campo, não filha.
      await expect(composer.contains(band)).toBe(false);
      await expect(
        band.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('E ela não leva o foco: quem veio escrever continua no campo', async () => {
      // A faixa é alcançável por estar ANTES na ordem de leitura, e não por
      // puxar ninguém para si (decisão 4 da folha).
      await expect(band.contains(canvasElement.ownerDocument.activeElement)).toBe(false);

      const input = composer.querySelector<HTMLElement>('[data-slot="composer-input"]')!;
      input.focus();
      await expect(canvasElement.ownerDocument.activeElement).toBe(input);
    });

    await step('O campo não ganhou nada por causa dela', async () => {
      // A faixa não entra na descrição do campo: ela já se anuncia sozinha, e
      // repeti-la ali viraria ruído que se ouve a cada foco.
      const input = composer.querySelector<HTMLElement>('[data-slot="composer-input"]')!;
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      for (const id of ids) {
        await expect(band.contains(canvasElement.ownerDocument.getElementById(id))).toBe(false);
      }
    });
  },
};

export const Answering: Story = {
  parameters: {
    covers: [
      'functional.item6',
      'functional.item7',
      'accessibility.item6',
      'visual.item6',
    ],
  },
  render: () => aboveComposer(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = draftLabels();
    const band = canvasElement.querySelector<HTMLElement>('[data-slot="composer-draft"]')!;

    await step('Os controles têm pelo menos vinte e quatro pixels de alvo', async () => {
      // WCAG 2.5.8, e é onde esta família mais escorrega.
      for (const name of [labels.restore, labels.discard]) {
        const box = canvas.getByRole('button', { name }).getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('Restaurar avisa a escolha de restaurar', async () => {
      onAction.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: labels.restore }));
      await expect(onAction).toHaveBeenCalledTimes(1);
      await expect(onAction).toHaveBeenCalledWith('restore');
    });

    await step('Descartar avisa a escolha de descartar', async () => {
      onAction.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: labels.discard }));
      await expect(onAction).toHaveBeenCalledTimes(1);
      await expect(onAction).toHaveBeenCalledWith('discard');
    });

    await step('E a faixa NÃO sai da tela sozinha', async () => {
      // O design system desenha a pergunta, não a política: o que descartar
      // apaga, e quando a faixa deixa de fazer sentido, é de quem consome.
      await expect(band.isConnected).toBe(true);
      await expect(canvas.getAllByRole('button')).toHaveLength(3);
    });
  },
};
