import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import {
  contrastePorTema,
  cursorComputado,
  opacidadeComputada,
} from '@shared/testing/label-probe';
import { NdsLabel } from './label';
import { NdsInput } from './input';

const meta: Meta = {
  title: 'UI/Label/States',
  decorators: [moduleMetadata({ imports: [NdsLabel, NdsInput] })],
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do rótulo: padrão, desabilitado pelo controle irmão, desabilitado pelo bloco e obrigatório.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
        <label ndsLabel for="estado-padrao">Nome completo</label>
        <input class="nds-input" id="estado-padrao" type="text" placeholder="ex: João da Silva" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Nome completo');

    await step('O rótulo está em opacidade cheia', async () => {
      // Efeito computado, não nome de classe.
      await expect(opacidadeComputada(label)).toBe(1);
    });

    await step('O contraste do texto passa em AA nos dois temas', async () => {
      // O axe do test-runner só vê o tema claro. 4.5 porque o rótulo é texto
      // normal: 14px em peso 500 não alcança o limite de texto grande.
      const { claro, escuro } = contrastePorTema(label);
      await expect(claro).toBeGreaterThanOrEqual(4.5);
      await expect(escuro).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item3'],
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
        <label ndsLabel for="estado-disabled">CPF</label>
        <input class="nds-input nds-peer" id="estado-disabled" type="text" placeholder="000.000.000-00" disabled />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('CPF');
    const input = canvasElement.querySelector<HTMLInputElement>('#estado-disabled')!;

    await step('O controle está desabilitado', async () => {
      await expect(input).toBeDisabled();
    });

    await step('O rótulo esmaece junto e mostra o cursor de bloqueio', async () => {
      // A marca `nds-peer` vai no CONTROLE; o rótulo não recebe classe nenhuma.
      await expect(opacidadeComputada(label)).toBeLessThan(1);
      await expect(cursorComputado(label)).toBe('not-allowed');
    });
  },
};

export const DisabledViaGroup: Story = {
  parameters: {
    covers: ['functional.item4'],
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs" data-disabled="true">
        <label ndsLabel for="estado-grupo-disabled">Documento</label>
        <input class="nds-input" id="estado-grupo-disabled" type="text" placeholder="ex: 000.000.000-00" disabled />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Documento');

    await step('O rótulo herda o estado do bloco desabilitado', async () => {
      // O estado não é input do componente, é cascata do CSS a partir do
      // ancestral. Medimos a opacidade resultante porque é o que a pessoa vê.
      await expect(label.closest('[data-disabled="true"]')).toBeInTheDocument();
      await expect(opacidadeComputada(label)).toBeLessThan(1);
      await expect(getComputedStyle(label).pointerEvents).toBe('none');
    });
  },
};

export const Required: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
        <label ndsLabel for="estado-required">
          Email profissional
          <span class="nds-text-destructive" aria-hidden="true">*</span>
        </label>
        <input class="nds-input" id="estado-required" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const marcador = canvasElement.querySelector<HTMLElement>('.nds-text-destructive')!;
    const input = canvas.getByRole('textbox');

    await step('O asterisco é visível e decorativo', async () => {
      // Marcador visual sem aria-hidden seria lido como "asterisco" no meio do
      // rótulo; quem carrega a informação para o leitor é o aria-required.
      await expect(marcador).toBeVisible();
      await expect(marcador.textContent?.trim()).toBe('*');
      await expect(marcador).toHaveAttribute('aria-hidden', 'true');
    });

    await step('A obrigatoriedade é anunciada pelo controle', async () => {
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
