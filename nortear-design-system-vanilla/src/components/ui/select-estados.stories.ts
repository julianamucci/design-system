import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createSelect } from './select';
import { medirAnelDeFoco } from '@shared/testing/select-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Select: Default (placeholder visível), Selected (valor escolhido via defaultValue), Disabled (todo o select bloqueado), DisabledItem (apenas 1 option bloqueada), Invalid (aria-invalid + mensagem) e Focus (anel `--ring`). NOTA: estado "Open" não tem story dedicada — o dropdown é o popup nativo do navegador, controlado pelo SO.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLabel(select: HTMLSelectElement, labelText: string, id: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'sm';
  wrap.style.width = '20rem';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'nds-text-body nds-font-semibold';
  label.textContent = labelText;

  select.id = id;
  wrap.append(label, select);
  return wrap;
}

const BASIC_ITEMS = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
];

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-default',
    ),
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story: 'Estado inicial — placeholder visível, nenhum valor selecionado. Recomendado para forçar confirmação explícita do usuário.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Campo vazio, com o placeholder à mostra', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await expect(select.value).toBe('');
      await expect(select.selectedOptions[0].textContent).toBe('Selecione...');
    });
    await step('O placeholder não pode ser escolhido de volta', async () => {
      // Bloqueado e escondido: aparece no campo fechado e some da lista.
      const placeholder = (canvas.getByRole('combobox') as HTMLSelectElement)
        .querySelector('option[value=""]') as HTMLOptionElement;
      await expect(placeholder.disabled).toBe(true);
      await expect(placeholder.hidden).toBe(true);
    });
    await step('O rótulo externo nomeia o campo', async () => {
      await expect(canvas.getByRole('combobox')).toHaveAccessibleName('Estado');
    });
  },
};

// ─── Selected ─────────────────────────────────────────────────────────────────

export const Selected: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        defaultValue: 'rj',
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-selected',
    ),
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story: '`defaultValue: "rj"` — Rio de Janeiro selecionado inicialmente, placeholder oculto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O campo exibe o rótulo do valor escolhido', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await expect(select.value).toBe('rj');
      await expect(select.selectedOptions[0].textContent).toBe('Rio de Janeiro');
    });
    await step('O placeholder deixa de ser o item exibido', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const placeholder = select.querySelector('option[value=""]') as HTMLOptionElement;
      await expect(placeholder.selected).toBe(false);
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        disabled: true,
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-disabled',
    ),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story: '`disabled: true` no factory — `opacity-50`, cursor bloqueado, não recebe foco nem abre o dropdown.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O campo se anuncia bloqueado', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      // `disabled` nativo, e não só `aria-disabled`: é o atributo que tira o
      // campo do percurso do Tab e cancela a interação no próprio navegador.
      await expect(select).toBeDisabled();
    });
    await step('Bloqueado, o campo não recebe foco', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      select.focus();
      await expect(select).not.toHaveFocus();
    });
  },
};

// ─── DisabledItem ─────────────────────────────────────────────────────────────

export const DisabledItem: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais (indisponível)', disabled: true },
        ],
      }),
      'Estado',
      'st-disabled-item',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Apenas o terceiro item desabilitado via `items[2].disabled = true`. Útil para indicar opções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Terceira <option> está desabilitada', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.querySelectorAll('option')).filter((o) => !o.hidden);
      const mg = options.find((o) => o.value === 'mg');
      await expect(mg?.disabled).toBe(true);
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';

    const label = document.createElement('label');
    label.htmlFor = 'st-invalid';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = 'Estado';

    const select = createSelect({
      placeholder: 'Selecione...',
      items: BASIC_ITEMS,
    });
    select.id = 'st-invalid';
    select.setAttribute('aria-invalid', 'true');
    select.setAttribute('aria-describedby', 'st-invalid-msg');
    select.classList.add('nds-border-destructive');

    const msg = document.createElement('p');
    msg.id = 'st-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Selecione um estado para continuar.';

    wrap.append(label, select, msg);
    return wrap;
  },
  parameters: {
    covers: ['visual.item5'],
    // O estado "lista aberta" não tem story nesta stack: a lista é o popup
    // nativo do navegador, desenhado fora do documento — não há nada para o
    // Chromatic fotografar nem para o teste observar.
    coversNotApplicable: {
      'visual.item3':
        'a lista aberta é o popup nativo do navegador, desenhado fora do documento — não existe estado capturável',
    },
    docs: {
      description: {
        story:
          'Estado de erro via `aria-invalid="true"` no `<select>`. Borda `--destructive`, mensagem associada via `aria-describedby`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select possui aria-invalid', async () => {
      const select = canvas.getByRole('combobox');
      await expect(select).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro associada', async () => {
      const select = canvas.getByRole('combobox');
      await expect(select).toHaveAttribute('aria-describedby', 'st-invalid-msg');
      await expect(canvas.getByText(/Selecione um estado para continuar/)).toBeVisible();
    });
    await step('Focar o campo inválido continua mostrando o foco', async () => {
      // O anel destrutivo é declarado para o estado inválido e o anel de foco
      // vem depois: sem a regra de aninhamento, focar um campo inválido não
      // mudava nada na tela. `boxShadow !== 'none'` passaria mesmo assim — só a
      // MUDANÇA reprova.
      await expect(medirAnelDeFoco(canvas.getByRole('combobox')).mudou).toBe(true);
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: BASIC_ITEMS,
      }),
      'Estado',
      'st-focus',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Estado de foco via teclado — anel `--ring` ao redor do `<select>`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select recebe foco via Tab', async () => {
      const select = canvas.getByRole('combobox');
      await userEvent.tab();
      await expect(select).toHaveFocus();
    });
  },
};
