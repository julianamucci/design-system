import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createLabel } from './label';
import { createInput } from './input';
import { createCheckbox } from './checkbox';
import { bloco } from './label.fixtures';
import {
  labelSource,
  labelSourceCaixa,
  labelSourceCom,
  labelSourceObrigatorio,
} from './label.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Label/Compositions',
  parameters: {
    layout: 'centered',
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: labelSource },
      description: {
        component:
          'Composições do rótulo com outros elementos de formulário: campo de texto, caixa de seleção e campo obrigatório.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com campo de texto ───────────────────────────────────────────────────────

export const WithInput: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: labelSourceCom({
          text: 'Telefone',
          htmlFor: 'telefone',
          type: 'tel',
          placeholder: '(11) 99999-9999',
        }),
      },
    },
  },
  render: () => {
    const wrapper = bloco();
    const inputId = 'comp-input';
    wrapper.append(
      createLabel({ text: 'Telefone', htmlFor: inputId }),
      createInput({ id: inputId, type: 'tel', placeholder: '(11) 99999-9999' }),
    );
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Telefone');
    const input = canvasElement.querySelector<HTMLInputElement>('#comp-input')!;

    await step('O campo é alcançável pelo texto do rótulo', async () => {
      await expect(canvas.getByLabelText('Telefone')).toBe(input);
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      input.blur();
      await expect(input).not.toHaveFocus();
      await userEvent.click(label);
      await expect(input).toHaveFocus();
    });
  },
};

// ─── Com caixa de seleção ─────────────────────────────────────────────────────

export const WithCheckbox: Story = {
  // Outra fábrica no par: sem override o painel mostraria `createInput` embaixo
  // de uma caixa de seleção.
  parameters: {
    docs: {
      source: {
        transform: labelSourceCaixa({
          text: 'Concordo com os termos de uso',
          htmlFor: 'termos',
        }),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-cluster';
    wrapper.dataset.spacing = 'sm';

    const checkboxId = 'comp-checkbox';
    const checkbox = createCheckbox({ id: checkboxId });
    const label = createLabel({ text: 'Concordo com os termos de uso', htmlFor: checkboxId });

    // Só `for`/`id`. A caixa é um <button>, que é controle rotulável do HTML, e
    // por isso a associação nativa basta — nem `aria-labelledby` de reserva, nem
    // ouvinte de clique reenviando o evento à mão.
    wrapper.append(checkbox, label);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector<HTMLLabelElement>('label[data-slot="label"]')!;
    const checkbox = canvas.getByRole('checkbox');

    await step('A caixa recebe o nome acessível do rótulo', async () => {
      await expect(checkbox).toHaveAccessibleName('Concordo com os termos de uso');
    });

    // A asserção anterior conferia `label.htmlFor` e `getElementById`, e passou
    // anos verde sobre um par que não funcionava: a caixa era um <div>, que
    // `label[for]` não alcança. O que prova a associação é o EFEITO.
    await step('Clicar no texto do rótulo foca a caixa E alterna o estado', async () => {
      // Par idempotente: o painel Interactions reexecuta no mesmo DOM.
      if (checkbox.getAttribute('aria-checked') === 'true') await userEvent.click(label);
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
      (checkbox as HTMLElement).blur();
      await expect(checkbox).not.toHaveFocus();
      await userEvent.click(label);
      await expect(checkbox).toHaveFocus();
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

// ─── Campo obrigatório ────────────────────────────────────────────────────────

export const RequiredField: Story = {
  parameters: {
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
    const inputId = 'comp-required';
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
    const input = canvas.getByRole('textbox');
    const marcador = canvasElement.querySelector<HTMLElement>('.nds-text-destructive')!;

    await step('O asterisco é decorativo', async () => {
      await expect(marcador).toHaveAttribute('aria-hidden', 'true');
      await expect(marcador.textContent?.trim()).toBe('*');
    });

    await step('O nome acessível do campo não carrega o asterisco', async () => {
      // É o que `aria-hidden` no marcador compra: o leitor anuncia o rótulo, e
      // a obrigatoriedade vem do `aria-required`, não de um "asterisco" falado.
      await expect(input).toHaveAccessibleName('Email profissional');
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
