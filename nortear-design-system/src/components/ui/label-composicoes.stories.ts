import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createLabel } from './label';
import { createInput } from './input';
import { createCheckbox } from './checkbox';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Label/Composicoes',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes comuns do Label: com Input, com Checkbox, e com campo obrigatório.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com Input ────────────────────────────────────────────────────────────────

export const ComInput: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.width = '16rem';

    const inputId = 'comp-input-telefone';
    const label = createLabel({ text: 'Telefone', htmlFor: inputId });
    const input = createInput({ id: inputId, type: 'tel', placeholder: '(11) 99999-9999' });

    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está associado ao Input via htmlFor', async () => {
      const label = canvasElement.querySelector('label') as HTMLLabelElement;
      await expect(label?.htmlFor).toBe('comp-input-telefone');
      const input = canvas.getByRole('textbox');
      await expect(input).toBeInTheDocument();
    });
  },
};

// ─── Com Checkbox ─────────────────────────────────────────────────────────────

export const ComCheckbox: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-cluster';
    wrapper.dataset.spacing = 'sm';

    const checkboxId = 'comp-checkbox-termos';
    const checkbox = createCheckbox({ id: checkboxId });
    const label = createLabel({ text: 'Aceito os termos de uso', htmlFor: checkboxId });
    label.id = `${checkboxId}-label`;
    checkbox.setAttribute('aria-labelledby', `${checkboxId}-label`);

    wrapper.append(checkbox, label);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label do checkbox está visível', async () => {
      const label = canvas.getByText('Aceito os termos de uso');
      await expect(label).toBeVisible();
    });

    await step('Label está associado ao checkbox via htmlFor', async () => {
      const label = canvasElement.querySelector('label') as HTMLLabelElement;
      await expect(label?.htmlFor).toBe('comp-checkbox-termos');
    });
  },
};

// ─── Campo Obrigatório ────────────────────────────────────────────────────────

export const CampoObrigatorio: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.width = '16rem';

    const inputId = 'comp-required-email';
    const label = createLabel({ htmlFor: inputId });

    const labelText = document.createTextNode('Email profissional');
    const asterisk = document.createElement('span');
    asterisk.setAttribute('aria-hidden', 'true');
    asterisk.className = 'nds-text-destructive';
    asterisk.style.marginLeft = '0.125rem';
    asterisk.textContent = '*';

    label.append(labelText, asterisk);

    const input = createInput({
      id: inputId,
      type: 'email',
      placeholder: 'seu@empresa.com',
    });
    input.setAttribute('aria-required', 'true');

    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está visível com marcador required', async () => {
      const label = canvas.getByText(/Email profissional/);
      await expect(label).toBeVisible();
    });

    await step('Asterisco possui aria-hidden="true"', async () => {
      const asterisk = canvasElement.querySelector('span[aria-hidden="true"]');
      await expect(asterisk).toBeInTheDocument();
      await expect(asterisk?.getAttribute('aria-hidden')).toBe('true');
    });

    await step('Input possui aria-required="true"', async () => {
      const input = canvasElement.querySelector('input') as HTMLInputElement;
      await expect(input?.getAttribute('aria-required')).toBe('true');
    });
  },
};
