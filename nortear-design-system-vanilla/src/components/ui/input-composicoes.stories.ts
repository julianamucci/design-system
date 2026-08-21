import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, userEvent, expect } from 'storybook/test';
import { createInput } from './input';
import { inputSource, inputSourceCom, inputSourcePrefixo } from './input.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Input/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: inputSource },
      description: {
        component:
          'Composicoes do Input com rótulo externo, texto de apoio e mensagem de erro. ' +
          'A composição com prefixo e sufixo é do InputGroup, que esta stack ainda não expõe como fábrica — ' +
          'o CSS compartilhado existe e a docs page monta a marcação à mão.',
      },
    },
    // Os três itens do InputGroup ficam DECLARADOS como não aplicáveis em vez
    // de omitidos: não existe `createInputGroup` aqui, então o comportamento de
    // clicar no addon e o foco no grupo não são entregues por esta stack.
    // Medido na sonda desta rodada: o `.nds-input` é idêntico às outras quatro,
    // a lacuna é só a fábrica do grupo.
    coversNotApplicable: {
      'functional.item7': 'a stack não expõe fábrica de InputGroup — só o CSS compartilhado',
      'functional.item8': 'sem fábrica de InputGroup não há handler que leve o foco do addon ao campo',
      'visual.item4': 'sem fábrica de InputGroup não há story dos três alinhamentos para o Chromatic',
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createFormField(opts: {
  labelText: string;
  labelFor: string;
  inputEl: HTMLInputElement;
  hintText?: string;
  errorText?: string;
}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-sm';
  wrapper.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = opts.labelFor;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = opts.labelText;

  opts.inputEl.id = opts.labelFor;

  wrapper.appendChild(label);
  wrapper.appendChild(opts.inputEl);

  const descritores: string[] = [];

  if (opts.hintText) {
    const hint = document.createElement('p');
    hint.className = 'nds-text-caption nds-text-muted-foreground';
    hint.id = `${opts.labelFor}-hint`;
    hint.textContent = opts.hintText;
    descritores.push(hint.id);
    wrapper.appendChild(hint);
  }

  if (opts.errorText) {
    const error = document.createElement('p');
    error.className = 'nds-text-caption nds-text-destructive';
    error.id = `${opts.labelFor}-error`;
    error.textContent = opts.errorText;
    descritores.push(error.id);
    wrapper.appendChild(error);
  }

  // Hint visível sem `aria-describedby` não chega ao leitor de tela — o texto
  // de apoio ficava fora da leitura antes desta rodada.
  if (descritores.length) {
    opts.inputEl.setAttribute('aria-describedby', descritores.join(' '));
  }

  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () =>
    createFormField({
      labelText: 'Nome completo',
      labelFor: 'input-nome',
      inputEl: createInput({ type: 'text', placeholder: 'ex: João da Silva' }),
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está visível', async () => {
      await expect(canvas.getByText('Nome completo')).toBeVisible();
    });

    await step('Input alcançável pelo rótulo', async () => {
      await expect(canvas.getByLabelText('Nome completo')).toBeVisible();
    });

    await step('Clicar no rótulo leva o foco ao campo', async () => {
      // É o que a seção Composições promete e nenhuma stack verificava: o par
      // `for`/`id` existir não garante que o clique chegue ao campo.
      await userEvent.click(canvas.getByText('Nome completo'));
      await expect(canvas.getByLabelText('Nome completo')).toHaveFocus();
    });

    await step('Digitar no campo associado ao rótulo funciona', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await userEvent.clear(input);
      await userEvent.type(input, 'Maria Silva');
      await expect(input).toHaveValue('Maria Silva');
    });
  },
};

export const WithSupportText: Story = {
  // O texto de apoio só chega ao leitor de tela pelo `aria-describedby`, que é
  // marcação em volta do campo — nada disso aparece na chamada da fábrica.
  parameters: {
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'email',
          id: 'email',
          label: 'Email',
          placeholder: 'ex: joao@empresa.com',
          ajuda: 'Usaremos este email para envio de notificações.',
        }),
      },
    },
  },
  render: () =>
    createFormField({
      labelText: 'Email',
      labelFor: 'input-email-hint',
      inputEl: createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' }),
      hintText: 'Usaremos este email para envio de notificações.',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Rótulo, campo e texto de apoio estão visíveis', async () => {
      await expect(canvas.getByLabelText('Email')).toBeVisible();
      await expect(canvas.getByText('Usaremos este email para envio de notificações.')).toBeVisible();
    });

    await step('O texto de apoio é lido junto com o campo', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-describedby', 'input-email-hint-hint');
      await expect(canvasElement.ownerDocument.getElementById('input-email-hint-hint')).not.toBeNull();
    });
  },
};

export const ErrorMessage: Story = {
  parameters: {
    docs: {
      source: {
        transform: inputSourceCom({
          type: 'email',
          id: 'email',
          label: 'Email',
          placeholder: 'ex: joao@empresa.com',
          ariaInvalid: true,
          mensagem: 'Email inválido. Use o formato nome@dominio.com',
        }),
      },
    },
  },
  render: () => {
    const input = createInput({ type: 'email', placeholder: 'ex: joao@empresa.com' });
    input.setAttribute('aria-invalid', 'true');
    return createFormField({
      labelText: 'Email',
      labelFor: 'input-email-error',
      inputEl: input,
      errorText: 'Email inválido. Use o formato nome@dominio.com',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Email');

    await step('Campo marcado como inválido', async () => {
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para a mensagem que existe', async () => {
      await expect(input).toHaveAttribute('aria-describedby', 'input-email-error-error');
      await expect(canvasElement.ownerDocument.getElementById('input-email-error-error')).not.toBeNull();
    });

    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/Email inválido/)).toBeVisible();
    });
  },
};

/**
 * Prefixo pelo CSS compartilhado do InputGroup.
 *
 * A versão anterior atribuía três classes mortas à propriedade `className` do
 * campo, o que SUBSTITUÍA a classe base: o campo saía sem `.nds-input` — sem
 * respiro, sem tipografia, sem raio, sem borda — e nenhuma das três existia em
 * folha nenhuma. A play só checava o texto do prefixo, então o campo cru passou.
 */
export const WithTextPrefix: Story = {
  // Forma diferente de snippet: a moldura é do grupo, e o campo entra nu dentro
  // dele. Um snippet de campo solto não ensinaria nada disso.
  parameters: {
    docs: {
      source: {
        transform: inputSourcePrefixo({
          id: 'input-url',
          label: 'URL do site',
          type: 'url',
          placeholder: 'meusite.com',
          prefixo: 'https://',
        }),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-sm';
    wrapper.dataset.spacing = 'xs';

    const label = document.createElement('label');
    label.htmlFor = 'input-url';
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'URL do site';

    const row = document.createElement('div');
    row.className = 'nds-input-group';
    row.setAttribute('role', 'group');

    const prefix = document.createElement('span');
    prefix.className = 'nds-input-group-addon';
    prefix.dataset.align = 'inline-start';
    prefix.textContent = 'https://';

    const input = createInput({ type: 'url', id: 'input-url', placeholder: 'meusite.com' });
    // classList.add, nunca atribuição direta: substituir apaga a classe base.
    input.classList.add('nds-input-group-control');
    input.dataset.slot = 'input-group-control';

    row.append(prefix, input);
    wrapper.append(label, row);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Prefixo e campo rotulado estão visíveis', async () => {
      await expect(canvas.getByText('https://')).toBeVisible();
      await expect(canvas.getByLabelText('URL do site')).toBeVisible();
    });

    await step('O campo mantém a identidade do design system', async () => {
      // A regressão que esta story escondia: a atribuição direta de classes
      // apagava a classe base e o campo virava um input cru do navegador.
      const input = canvasElement.querySelector<HTMLInputElement>('#input-url')!;
      await expect(input).toHaveClass(/nds-input/);
      await expect(input).toHaveAttribute('data-slot', 'input-group-control');
    });

    await step('A moldura é do GRUPO; o campo interno fica nu', async () => {
      const grupo = canvasElement.querySelector<HTMLElement>('.nds-input-group')!;
      const input = canvasElement.querySelector<HTMLInputElement>('#input-url')!;
      await expect(parseFloat(getComputedStyle(grupo).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(input).borderTopWidth)).toBe(0);
    });

    await step('O respiro do campo sobrevive dentro do grupo', async () => {
      // Se `.nds-input` tivesse sido apagada, o padding cairia a zero e o texto
      // encostaria no prefixo — o defeito era visível e ninguém o afirmava.
      const cs = getComputedStyle(canvasElement.querySelector<HTMLInputElement>('#input-url')!);
      await expect(parseFloat(cs.paddingTop)).toBeGreaterThan(0);
      await expect(parseFloat(cs.paddingLeft)).toBeGreaterThan(0);
    });
  },
};
