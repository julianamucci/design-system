import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/Label/States',
  decorators: [moduleMetadata({ imports: [NdsLabel] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Obrigatorio: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="email-obrigatorio">
          Email profissional
          <span class="nds-text-destructive" aria-hidden="true">*</span>
        </label>
        <input class="nds-input" id="email-obrigatorio" type="email" aria-required="true" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O asterisco é decorativo — a obrigatoriedade vem do ARIA', async () => {
      // Marcador visual sem aria-hidden seria lido como "asterisco" no meio do
      // rótulo; quem carrega a informação para o leitor é o aria-required.
      const marcador = canvasElement.querySelector<HTMLElement>('.nds-text-destructive')!;
      await expect(marcador).toHaveAttribute('aria-hidden', 'true');
      const input = canvasElement.querySelector<HTMLInputElement>('input')!;
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item4'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm" data-disabled="true">
        <label ndsLabel for="cpf-desabilitado">CPF</label>
        <input class="nds-input" id="cpf-desabilitado" type="text" disabled />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O rótulo herda o estado do grupo desabilitado', async () => {
      // O CSS do .nds-label reage a um ancestral com data-disabled — o estado
      // não é input do componente, é cascata. Medimos a opacidade resultante
      // porque é isso que a pessoa vê.
      const label = canvasElement.querySelector<HTMLLabelElement>('label.nds-label')!;
      const opacidade = Number(getComputedStyle(label).opacity);
      await expect(opacidade).toBeLessThan(1);
    });

    await step('O controle associado está desabilitado', async () => {
      const input = canvasElement.querySelector<HTMLInputElement>('input')!;
      await expect(input).toBeDisabled();
    });
  },
};

export const WithInput: Story = {
  parameters: { covers: ['visual.item1', 'visual.item2', 'visual.item3', 'visual.item4'] },
  render: () => ({
    template: `
      <div class="nds-grid nds-w-full" data-spacing="lg" data-min="14rem">
        <div class="nds-stack" data-spacing="sm">
          <label ndsLabel for="par-default">Nome completo</label>
          <input class="nds-input" id="par-default" type="text" />
        </div>
        <div class="nds-stack" data-spacing="sm">
          <label ndsLabel for="par-required">
            Email profissional
            <span class="nds-text-destructive" aria-hidden="true">*</span>
          </label>
          <input class="nds-input" id="par-required" type="email" aria-required="true" />
        </div>
        <div class="nds-stack" data-spacing="sm" data-disabled="true">
          <label ndsLabel for="par-disabled">CPF</label>
          <input class="nds-input" id="par-disabled" type="text" disabled />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Os três pares rótulo+controle estão associados', async () => {
      // Uma story só, cobrindo os quatro critérios visuais, porque o que a
      // regressão visual compara é o conjunto lado a lado — separar em três
      // stories mostraria três imagens que nunca se comparam entre si.
      const labels = [...canvasElement.querySelectorAll<HTMLLabelElement>('label.nds-label')];
      await expect(labels).toHaveLength(3);
      for (const label of labels) {
        const alvo = canvasElement.querySelector(`#${label.htmlFor}`);
        await expect(alvo).toBeTruthy();
      }
    });

    await step('Só o par desabilitado esmaece o rótulo', async () => {
      const labels = [...canvasElement.querySelectorAll<HTMLLabelElement>('label.nds-label')];
      const opacidades = labels.map((l) => Number(getComputedStyle(l).opacity));
      await expect(opacidades[0]).toBe(1);
      await expect(opacidades[1]).toBe(1);
      await expect(opacidades[2]).toBeLessThan(1);
    });
  },
};
