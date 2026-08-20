import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  contrastePorTema,
  cursorComputado,
  opacidadeComputada,
} from '@shared/testing/label-probe';
import { Label } from './index';
import { Input } from '@/components/ui/input';
import {
  labelDesabilitadoPeloGrupoSource,
  labelDesabilitadoSource,
  labelObrigatorioSource,
  labelPadraoSource,
} from './label.source';

const meta = {
  title: 'UI/Label/States',
  component: Label,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: labelPadraoSource },
      description: {
        component:
          'Estados do rótulo: padrão, desabilitado pelo controle irmão, desabilitado pelo bloco e obrigatório.',
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
  },
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="nds-stack nds-w-cap-xs" data-spacing="xs">
        <Label for="estado-padrao">Nome completo</Label>
        <Input id="estado-padrao" type="text" placeholder="ex: João da Silva" />
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
    // O `nds-peer` no controle é o mecanismo inteiro do estado, e ele não
    // existe na marcação do `meta`.
    docs: { source: { transform: labelDesabilitadoSource } },
  },
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="nds-stack nds-w-cap-xs" data-spacing="xs">
        <Label for="estado-disabled">CPF</Label>
        <Input id="estado-disabled" type="text" class="nds-peer" placeholder="000.000.000-00" disabled />
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
      await expect(opacidadeComputada(label)).toBeLessThan(1);
      await expect(cursorComputado(label)).toBe('not-allowed');
    });
  },
};

export const DisabledViaGroup: Story = {
  parameters: {
    covers: ['functional.item4'],
    // Aqui quem desliga é o `data-disabled` do CONTÊINER: outro caminho, outra
    // marcação.
    docs: { source: { transform: labelDesabilitadoPeloGrupoSource } },
  },
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="nds-stack nds-w-cap-xs" data-spacing="xs" data-disabled="true">
        <Label for="estado-grupo-disabled">Documento</Label>
        <Input id="estado-grupo-disabled" type="text" placeholder="ex: 000.000.000-00" disabled />
      </div>
    `,
  }),
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

export const Required: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    // O asterisco dentro do rótulo e o `aria-required` no controle são um par,
    // e nenhum dos dois está no `meta`.
    docs: { source: { transform: labelObrigatorioSource } },
  },
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="nds-stack nds-w-cap-xs" data-spacing="xs">
        <Label for="estado-required">
          Email profissional
          <span class="nds-text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input id="estado-required" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
      </div>
    `,
  }),
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
