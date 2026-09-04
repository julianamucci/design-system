import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createContextDisplay } from './context-display';
import { createComposer } from './composer';
import { contextDisplayLabels, usageOf } from './context-display.fixtures';
import { composerLabels } from './composer.fixtures';
import { contextDisplayBesideFieldSource } from './context-display.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a medição mora em relação ao campo de mensagem. Ela é AUTÔNOMA: fica ao
// lado do campo, não é prop dele e não entra na descrição acessível dele.

const meta: Meta = {
  title: 'Components/Conversational/ContextDisplay/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextDisplayBesideFieldSource },
      description: {
        component:
          'A medição é autônoma: ela fica ao lado do campo, e nenhum arquivo do campo sabe que ela existe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const BesideField: Story = {
  parameters: { covers: ['functional.item8', 'visual.item6'] },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'sm';
    stack.append(
      createContextDisplay({
        usage: usageOf('warning'),
        labels: contextDisplayLabels(),
      }),
      createComposer({ labels: composerLabels() }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const block = canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;
    const composer = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const field = composer.querySelector<HTMLElement>('.nds-composer-field')!;
    const input = composer.querySelector<HTMLElement>('[data-slot="composer-input"]')!;

    await step('A medição fica FORA da moldura do campo', async () => {
      // O campo desenha o que se escreve agora; esta medição fala do que a
      // conversa inteira já gastou. Dentro da moldura, ela pareceria parte da
      // mensagem que está sendo escrita.
      await expect(field.contains(block)).toBe(false);
      await expect(composer.contains(block)).toBe(false);
    });

    await step('E ela vem ANTES do campo na ordem de leitura', async () => {
      await expect(
        block.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('Nada no campo sabe que ela existe', async () => {
      // A peça é autônoma: ela não é prop do campo e não entra na descrição
      // dele. Um número que se reescreve sozinho dentro do `aria-describedby`
      // seria relido a cada foco.
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const describers = ids.map((id) => canvasElement.ownerDocument.getElementById(id));
      await expect(describers).not.toContain(block);
      for (const el of describers) {
        await expect(el?.contains(block)).toBe(false);
      }
    });
  },
};
