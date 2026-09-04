import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { tick } from 'svelte';
import { expect, fn, userEvent } from 'storybook/test';
import ComposerModelPickerStory from './ComposerModelPickerStory.svelte';
import {
  availableModels,
  everyModel,
  modelLabels,
} from './composer-model-picker.fixtures';
import { modelPickerInRailSource } from './composer-model-picker.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O seletor no lugar em que ele vive — o início do trilho —, e o teclado, que é
// o que separa um menu de uma pilha de divs clicáveis.

const meta: Meta<typeof ComposerModelPickerStory> = {
  title: 'Components/Conversational/ComposerModelPicker/Compositions',
  component: ComposerModelPickerStory,
  tags: ['conversational'],
  parameters: {
    // A lista abre PARA CIMA: no topo do quadro ela sairia da foto.
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: modelPickerInRailSource },
      description: {
        component:
          'Onde o seletor mora dentro do campo, e o percurso completo de quem escolhe pelo teclado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComposerModelPickerStory>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onValueChange = fn();

const triggerOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-model-trigger"]')!;

const panelOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-model-panel"]');

export const InRail: Story = {
  parameters: { covers: ['functional.item8', 'visual.item6'] },
  // O seletor é AUTÔNOMO: ele não é uma prop do campo. Quem consome o monta e o
  // põe no trilho, pelo mesmo espaço de qualquer outro controle.
  render: () => ({
    Component: ComposerModelPickerStory,
    props: {
      models: everyModel(),
      value: 'fast',
      open: true,
      rail: true,
      onValueChange,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const picker = root.querySelector<HTMLElement>('[data-slot="composer-model"]')!;

    await step('O seletor vive no INÍCIO do trilho', async () => {
      // O início é o que se acrescenta à mensagem; o fim é o que se faz com ela.
      // Escolher quem responde é do início.
      const start = root.querySelector<HTMLElement>('.nds-composer-rail-start')!;
      const end = root.querySelector<HTMLElement>('.nds-composer-rail-end')!;
      await expect(start.contains(picker)).toBe(true);
      await expect(end.contains(picker)).toBe(false);
    });

    await step('E a lista abre PARA CIMA, por sobre o campo', async () => {
      // O composer mora no pé da conversa: para baixo não sobra espaço, e uma
      // lista que descesse ficaria fora da tela na primeira vez que abrisse.
      const panel = panelOf(canvasElement)!;
      const trigger = triggerOf(canvasElement);
      await expect(panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        trigger.getBoundingClientRect().top,
      );
    });
  },
};

export const Keyboard: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'accessibility.item5',
      'accessibility.item6',
    ],
  },
  render: () => ({
    Component: ComposerModelPickerStory,
    props: { models: availableModels(), onValueChange },
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = triggerOf(canvasElement);
    const doc = canvasElement.ownerDocument;
    const models = availableModels();

    await step('Acionar o gatilho abre a lista e leva o foco para dentro dela', async () => {
      // Aqui não há texto em curso: a escolha é o único assunto enquanto a lista
      // está aberta, e o teclado tem de estar onde ela está.
      onValueChange.mockClear();
      await userEvent.click(trigger);
      await tick();
      const panel = panelOf(canvasElement)!;
      await expect(panel).not.toBeNull();
      await expect(doc.activeElement).toBe(panel);
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    });

    await step('A lista se anuncia com o nome dela', async () => {
      await expect(panelOf(canvasElement)!).toHaveAccessibleName(modelLabels().list);
    });

    await step('Cada opção tem pelo menos vinte e quatro pixels de alvo', async () => {
      // WCAG 2.5.8. É onde esta família mais escorrega, e uma lista estreita é
      // onde a tentação de encolher é maior.
      for (const option of [...panelOf(canvasElement)!.children]) {
        const box = option.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('As setas andam pelas opções, sem sair da lista', async () => {
      const panel = panelOf(canvasElement)!;
      const first = panel.children[0] as HTMLElement;
      const second = panel.children[1] as HTMLElement;
      await expect(first.dataset.active).toBe('true');

      await userEvent.keyboard('{ArrowDown}');
      await tick();
      await expect(second.dataset.active).toBe('true');
      await expect(first.dataset.active).toBeUndefined();
      await expect(panel.getAttribute('aria-activedescendant')).toBe(second.id);
      await expect(doc.activeElement).toBe(panel);
    });

    await step('Confirmar avisa quem consome, fecha a lista e devolve o foco', async () => {
      // O componente NÃO troca de modelo: quem sabe o que a troca custa é quem
      // monta a conversa, e é ele que decide.
      await userEvent.keyboard('{Enter}');
      await tick();
      await expect(onValueChange).toHaveBeenCalledTimes(1);
      await expect(onValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: models[1].id }),
      );
      await expect(panelOf(canvasElement)).toBeNull();
      await expect(doc.activeElement).toBe(trigger);
      await expect(trigger.textContent).toBe(models[1].label);
    });

    await step('E a tecla de escape fecha sem trocar nada, também devolvendo o foco', async () => {
      // Sem isso o foco cairia no começo da página quando a lista some, e quem
      // navega por teclado perderia o lugar.
      onValueChange.mockClear();
      await userEvent.click(trigger);
      await tick();
      await expect(panelOf(canvasElement)).not.toBeNull();
      await userEvent.keyboard('{Escape}');
      await tick();
      await expect(panelOf(canvasElement)).toBeNull();
      await expect(doc.activeElement).toBe(trigger);
      await expect(onValueChange).not.toHaveBeenCalled();
      await expect(trigger.textContent).toBe(models[1].label);
    });
  },
};

export const OutsideClick: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    Component: ComposerModelPickerStory,
    props: { models: availableModels(), outside: true, onValueChange },
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = triggerOf(canvasElement);
    const outside = canvasElement.querySelector<HTMLElement>('[data-slot="outside-target"]')!;

    await step('Acionar algo fora do seletor fecha a lista', async () => {
      // Sem isto a lista ficaria aberta por cima do que a pessoa foi fazer, e o
      // único jeito de fechá-la seria voltar ao gatilho.
      await userEvent.click(trigger);
      await tick();
      await expect(panelOf(canvasElement)).not.toBeNull();

      await userEvent.click(outside);
      await tick();
      await expect(panelOf(canvasElement)).toBeNull();
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  },
};
