import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createLabel } from './label';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Label/Estados',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados visuais do Label: padrão, disabled (via peer-disabled) e required (via span asterisco).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const inputId = 'estado-default-input';
    const label = createLabel({ text: 'Nome completo', htmlFor: inputId });

    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.className = 'input';
    input.placeholder = 'Digite seu nome…';

    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está visível', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toBeVisible();
    });

    await step('Label possui htmlFor correto', async () => {
      const label = canvasElement.querySelector('label');
      await expect(label?.htmlFor).toBe('estado-default-input');
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────
// Disabled state is demonstrated via the peer-disabled CSS pattern:
// Label and Input must be siblings in the DOM; when Input has `disabled`,
// the label receives `peer-disabled:opacity-50 peer-disabled:cursor-not-allowed` automatically.

export const Disabled: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const inputId = 'estado-disabled-input';

    // Input must come BEFORE the label in the DOM for peer-disabled to work
    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.className = 'input peer';
    input.placeholder = 'Campo desabilitado';
    input.disabled = true;

    const label = createLabel({
      text: 'CPF',
      htmlFor: inputId,
      className: 'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
    });

    wrapper.append(input, label);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input está desabilitado', async () => {
      const input = canvasElement.querySelector('input') as HTMLInputElement;
      await expect(input).toBeDisabled();
    });

    await step('Label está presente no DOM', async () => {
      const label = canvas.getByText('CPF');
      await expect(label).toBeInTheDocument();
    });
  },
};

// ─── Required ─────────────────────────────────────────────────────────────────
// Required state uses a <span aria-hidden="true" class="text-destructive">*</span>
// appended after the label text. The field itself carries aria-required="true".

export const Required: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const inputId = 'estado-required-input';
    const label = createLabel({ htmlFor: inputId });

    const labelText = document.createTextNode('Email profissional');
    const asterisk = document.createElement('span');
    asterisk.setAttribute('aria-hidden', 'true');
    asterisk.className = 'nds-text-destructive';
    asterisk.style.marginLeft = '0.125rem';
    asterisk.textContent = '*';

    label.append(labelText, asterisk);

    const input = document.createElement('input');
    input.type = 'email';
    input.id = inputId;
    input.className = 'input';
    input.placeholder = 'seu@email.com';
    input.setAttribute('aria-required', 'true');

    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está visível', async () => {
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
