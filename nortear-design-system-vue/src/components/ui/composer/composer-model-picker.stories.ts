import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, within } from 'storybook/test';
import { ComposerModelPicker } from './index';
import { everyModel, modelLabels, useModelLabels } from './composer-model-picker.fixtures';
import { composerModelPickerSource } from './composer-model-picker.source';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import ComposerModelPickerDocs from '@/components/docs/ComposerModelPickerDocs.vue';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onChange = fn();

/**
 * Os dois eixos do seletor, num controle só.
 *
 * Qual modelo está escolhido decide o que o gatilho mostra e qual opção aparece
 * marcada; se a lista começa aberta decide o que há para fotografar. A forma de
 * cada opção — etiqueta, descrição, impedimento — mora em `Variants` e
 * `States`.
 */
type PlaygroundArgs = {
  value: string;
  open: boolean;
};

const MODEL_IDS = everyModel().map((model) => model.id);

const meta: Meta<PlaygroundArgs> = {
  title: 'Primitives/Conversational/ComposerModelPicker',
  tags: ['autodocs', 'conversational'],
  parameters: {
    // Centrado, e não com recuo: a lista abre PARA CIMA, e no topo do quadro
    // ela sairia da foto justamente no que a story existe para mostrar.
    layout: 'centered',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ComposerModelPickerDocs),
      source: { transform: composerModelPickerSource },
    },
  },
  argTypes: {
    value: {
      control: 'select',
      options: MODEL_IDS,
      description:
        'O modelo escolhido, pelo endereço dele. Decide o nome no gatilho e a opção marcada na lista.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '—' },
      },
    },
    open: {
      control: 'boolean',
      description: 'A lista começa aberta, sem ninguém acionar o gatilho.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    value: 'balanced',
    open: true,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item1', 'accessibility.item2', 'visual.item1'],
  },
  render: (args) => ({
    components: { ComposerModelPicker },
    setup() {
      // Os rótulos saem de um composable, então o render passa por um `setup`.
      return { labels: useModelLabels(), models: everyModel(), args, onChange };
    },
    // `open` é SEMENTE: quem abre e fecha depois é o próprio seletor. Para o
    // control ter efeito, mudá-lo remonta o componente — que é exatamente o que
    // semente quer dizer.
    template: `<ComposerModelPicker
      :key="String(args.open)"
      :labels="labels"
      :models="models"
      :value="args.value"
      :open="args.open"
      @change="onChange"
    />`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer-model"]')!;
    const trigger = root.querySelector<HTMLElement>('[data-slot="composer-model-trigger"]')!;
    const labels = modelLabels();
    const chosen = everyModel().find((model) => model.id === args.value)!;

    await step('O gatilho leva só o NOME do modelo escolhido', async () => {
      // Um trilho é estreito, e o nome é o que se confere de relance. A
      // descrição fica para a lista, onde se lê na hora de trocar.
      await expect(trigger.textContent).toBe(chosen.label);
      await expect(trigger.textContent).not.toContain(chosen.description);
    });

    await step('E o nome acessível diz O QUE ele escolhe', async () => {
      // "Rápido, botão" não informa nada; "Modelo: Rápido" informa.
      await expect(
        canvas.getByRole('button', { name: labels.trigger.replace('{label}', chosen.label) }),
      ).toBe(trigger);
    });

    await step('O gatilho anuncia se a lista está aberta', async () => {
      // Quem não vê a tela precisa saber disso ANTES de acionar o controle.
      await expect(trigger.getAttribute('aria-expanded')).toBe(String(args.open));
    });

    await step('E a opção correspondente aparece MARCADA na lista', async () => {
      const panel = root.querySelector<HTMLElement>('[data-slot="composer-model-panel"]');
      if (!args.open) {
        // Sem lista no documento não há o que marcar — e é o que a story
        // afirma quando o controle começa fechado.
        await expect(panel).toBeNull();
        return;
      }
      const selected = panel!.querySelector<HTMLElement>('[aria-selected="true"]')!;
      await expect(selected.dataset.modelId).toBe(args.value);
      await expect(panel!.getAttribute('aria-activedescendant')).toBe(selected.id);
    });
  },
};
