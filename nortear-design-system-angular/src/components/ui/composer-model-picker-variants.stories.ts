import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import type { ModelOption } from '@shared/primitives/chat-protocol';
import { NdsComposerModelPicker } from './composer-model-picker';
import {
  availableModels,
  badgedModels,
  modelLabels,
} from './composer-model-picker.fixtures';
import {
  modelPickerBadgeSource,
  modelPickerDescriptionsSource,
} from './composer-model-picker.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A FORMA da opção: o que ela carrega além do nome. Quem monta a lista decide
// isso ao declarar o modelo, e não muda durante o uso — por isso mora aqui, e
// não em `States`.

const meta: Meta = {
  title: 'Primitives/Conversational/ComposerModelPicker/Variants',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposerModelPicker] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    // A lista abre PARA CIMA: no topo do quadro ela sairia da foto.
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: modelPickerDescriptionsSource },
      description: {
        component: 'Uma story por forma de opção: só com descrição, e com a etiqueta curta.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onValueChange = fn();

const mount = (models: ModelOption[]) => ({
  props: {
    labels: modelLabels(),
    models,
    onValueChange,
  },
  template: `
    <nds-composer-model-picker
      [labels]="labels"
      [models]="models"
      [open]="true"
      (valueChange)="onValueChange($event)"
    />
  `,
});

const panelOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-model-panel"]')!;

export const Descriptions: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item2'],
  },
  render: () => mount(availableModels()),
  play: async ({ canvasElement, step }) => {
    const panel = panelOf(canvasElement);
    const models = availableModels();

    await step('A lista tem NOME PRÓPRIO e é uma lista de opções', async () => {
      // Sem nome, ela é "lista" ao lado de outras listas da tela — e o campo
      // do composer tem três.
      await expect(panel.getAttribute('role')).toBe('listbox');
      await expect(panel).toHaveAccessibleName(modelLabels().list);
      await expect(panel.children).toHaveLength(models.length);
    });

    await step('Cada opção leva o nome e a DESCRIÇÃO, nessa ordem', async () => {
      // A descrição é o que sustenta a troca: escolher entre "Rápido" e
      // "Profundo" sem saber o que cada um custa é escolher no escuro.
      for (const [index, option] of [...panel.children].entries()) {
        const model = models[index]!;
        const name = option.querySelector<HTMLElement>('.nds-composer-model-name')!;
        const description = option.querySelector<HTMLElement>(
          '.nds-composer-model-description',
        )!;
        await expect(name.textContent).toBe(model.label);
        await expect(description.textContent).toBe(model.description);
        await expect(
          name.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      }
    });

    await step('E o cursor da lista aponta uma opção, sem depender de foco visível', async () => {
      // O foco pousa na lista; quem anda é o cursor apontado. Sem ele, a seta
      // moveria um realce que ninguém anuncia.
      const pointed = panel.getAttribute('aria-activedescendant');
      await expect(pointed).toBeTruthy();
      await expect(panel.querySelector(`#${pointed}`)).not.toBeNull();
    });
  },
};

export const WithBadge: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: modelPickerBadgeSource } },
  },
  render: () => mount(badgedModels()),
  play: async ({ canvasElement, step }) => {
    const panel = panelOf(canvasElement);
    const marked = badgedModels().find((model) => model.badge)!;

    await step('A etiqueta desenha com o badge do sistema, no lugar da folha', async () => {
      const option = panel.querySelector<HTMLElement>(`[data-model-id="${marked.id}"]`)!;
      const badge = option.querySelector<HTMLElement>('.nds-composer-model-badge')!;
      await expect(badge.textContent).toBe(marked.badge);
      // Duas classes, dois papéis: o desenho vem do badge, o lugar na grade
      // vem da folha do composer.
      await expect(badge.classList.contains('nds-badge')).toBe(true);
    });

    await step('E ela é REFORÇO — a opção continua trazendo a descrição', async () => {
      // Se a condição importa para escolher, ela também está escrita: forma e
      // cor sozinhas não descrevem condição (WCAG 1.4.1).
      const option = panel.querySelector<HTMLElement>(`[data-model-id="${marked.id}"]`)!;
      await expect(option).toHaveTextContent(marked.description!);
    });
  },
};
