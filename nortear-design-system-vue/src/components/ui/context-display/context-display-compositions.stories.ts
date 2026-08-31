import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ContextDisplay } from './index';
import { Composer } from '@/components/ui/composer';
import { useComposerLabels } from '@/components/ui/composer/composer.fixtures';
import { useContextDisplayLabels, usageOf } from './context-display.fixtures';
import { contextDisplayBesideFieldSource } from './context-display.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a medição mora em relação ao campo de mensagem. Ela é AUTÔNOMA: fica ao
// lado do campo, não é prop dele e não entra na descrição acessível dele.

const meta: Meta = {
  title: 'Primitives/Conversational/ContextDisplay/Compositions',
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
  render: () => ({
    components: { ContextDisplay, Composer },
    setup() {
      return {
        usage: usageOf('warning'),
        labels: useContextDisplayLabels(),
        composerLabels: useComposerLabels(),
      };
    },
    // Os dois são IRMÃOS num invólucro, e não pai e filho: é assim que a peça
    // se usa, e é o que prova que nada precisou ser acrescentado ao campo.
    template: `<div class="nds-stack nds-max-w-lg" data-spacing="sm">
      <ContextDisplay
        :usage="usage"
        :labels="labels"
      />
      <Composer :labels="composerLabels" />
    </div>`,
  }),
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
      for (const element of describers) {
        await expect(element?.contains(block)).toBe(false);
      }
    });
  },
};
