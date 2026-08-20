import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  contrastePorTema,
  cursorComputado,
  opacidadeComputada,
} from '@shared/testing/label-probe';
import { createLabel } from './label';
import { createInput } from './input';
import { labelSource, labelSourceBloco, labelSourceCom, labelSourceObrigatorio } from './label.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Label/States',
  parameters: {
    layout: 'centered',
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: labelSource },
      description: {
        component:
          'Estados do rótulo: padrão, desabilitado pelo controle irmão, desabilitado pelo bloco e obrigatório.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function bloco(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full nds-max-w-xs';
  wrapper.dataset.spacing = 'xs';
  return wrapper;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
  },
  render: () => {
    const wrapper = bloco();
    const inputId = 'estado-padrao';
    wrapper.append(
      createLabel({ text: 'Nome completo', htmlFor: inputId }),
      createInput({ id: inputId, placeholder: 'ex: João da Silva' }),
    );
    return wrapper;
  },
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

// ─── Disabled — controle irmão ────────────────────────────────────────────────
// A marca do esmaecimento vai no CONTROLE (.nds-peer). O rótulo não recebe
// classe nenhuma: quem reage é o próprio .nds-label, nas duas ordens de DOM.

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item3'],
    // A marca do esmaecimento vai no CONTROLE (`nds-peer`), e a ordem do DOM
    // faz parte da regra: sem override o snippet mostraria um par comum.
    docs: {
      source: {
        transform: labelSourceCom({
          text: 'CPF',
          htmlFor: 'cpf',
          placeholder: '000.000.000-00',
          disabled: true,
        }),
      },
    },
  },
  render: () => {
    const wrapper = bloco();
    const inputId = 'estado-disabled';
    const input = createInput({
      id: inputId,
      class: 'nds-peer',
      placeholder: '000.000.000-00',
      disabled: true,
    });
    wrapper.append(input, createLabel({ text: 'CPF', htmlFor: inputId }));
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('CPF');
    const input = canvasElement.querySelector<HTMLInputElement>('#estado-disabled')!;

    await step('O controle está desabilitado', async () => {
      await expect(input).toBeDisabled();
    });

    await step('O rótulo esmaece junto e mostra o cursor de bloqueio', async () => {
      await expect(opacidadeComputada(label)).toBeLessThan(1);
      await expect(cursorComputado(label)).toBe('not-allowed');
    });
  },
};

// ─── Disabled — bloco inteiro ─────────────────────────────────────────────────

export const DisabledViaGroup: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      source: {
        transform: labelSourceBloco({
          text: 'Documento',
          htmlFor: 'documento',
          placeholder: 'ex: 000.000.000-00',
        }),
      },
    },
  },
  render: () => {
    const wrapper = bloco();
    wrapper.dataset.disabled = 'true';
    const inputId = 'estado-grupo-disabled';
    wrapper.append(
      createLabel({ text: 'Documento', htmlFor: inputId }),
      createInput({ id: inputId, placeholder: 'ex: 000.000.000-00', disabled: true }),
    );
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Documento');

    await step('O rótulo herda o estado do bloco desabilitado', async () => {
      await expect(label.closest('[data-disabled="true"]')).toBeInTheDocument();
      await expect(opacidadeComputada(label)).toBeLessThan(1);
      await expect(getComputedStyle(label).pointerEvents).toBe('none');
    });
  },
};

// ─── Required ─────────────────────────────────────────────────────────────────

export const Required: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: {
      source: {
        transform: labelSourceObrigatorio({
          text: 'Email profissional',
          htmlFor: 'email',
          type: 'email',
          placeholder: 'ex: joao@empresa.com',
        }),
      },
    },
  },
  render: () => {
    const wrapper = bloco();
    const inputId = 'estado-required';
    const label = createLabel({ htmlFor: inputId });

    const asterisco = document.createElement('span');
    asterisco.setAttribute('aria-hidden', 'true');
    asterisco.className = 'nds-text-destructive';
    asterisco.textContent = '*';
    label.append(document.createTextNode('Email profissional'), asterisco);

    const input = createInput({
      id: inputId,
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
    });
    input.setAttribute('aria-required', 'true');

    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const marcador = canvasElement.querySelector<HTMLElement>('.nds-text-destructive')!;
    const input = canvas.getByRole('textbox');

    await step('O asterisco é visível e decorativo', async () => {
      await expect(marcador).toBeVisible();
      await expect(marcador.textContent?.trim()).toBe('*');
      await expect(marcador).toHaveAttribute('aria-hidden', 'true');
    });

    await step('A obrigatoriedade é anunciada pelo controle', async () => {
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
