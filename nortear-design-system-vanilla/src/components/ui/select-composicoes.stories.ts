import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSelect, type SelectItem } from './select';
import { createButton } from './button';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições de uso do Select: BrazilianState (lista plana), RegionWithGroups (categorias com cabeçalho) e InForm (integrado a um formulário com envio).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function comRotulo(
  id: string,
  rotulo: string,
  opcoes: Parameters<typeof createSelect>[0],
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-sm';
  wrap.dataset.spacing = 'sm';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'nds-text-body nds-font-semibold';
  label.textContent = rotulo;

  wrap.append(label, createSelect({ ...opcoes, id, 'aria-label': rotulo }));
  return wrap;
}

/** Abre a lista partindo sempre de fechada — o par garante clique real na rodada. */
function abridor(gatilho: HTMLElement) {
  return async () => {
    if (gatilho.getAttribute('aria-expanded') === 'true') {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
    }
    await userEvent.click(gatilho);
    return await waitForPortal('listbox');
  };
}

// ─── BrazilianState ───────────────────────────────────────────────────────────

export const BrazilianState: Story = {
  render: () =>
    comRotulo('comp-state', 'Estado', {
      placeholder: 'Selecione...',
      items: [
        { value: 'sp', label: 'São Paulo' },
        { value: 'rj', label: 'Rio de Janeiro' },
        { value: 'mg', label: 'Minas Gerais' },
        { value: 'rs', label: 'Rio Grande do Sul' },
      ],
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Caso padrão: quatro opções planas, nenhuma pré-escolhida, rótulo externo associado ao campo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');
    const abrir = abridor(gatilho);

    await step('Quatro opções disponíveis', async () => {
      const listbox = await abrir();
      await expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    });

    await step('Escolher pelo ponteiro atualiza o rótulo exibido', async () => {
      const listbox = await abrir();
      await userEvent.click(within(listbox).getByRole('option', { name: 'Minas Gerais' }));
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveTextContent('Minas Gerais');
    });

    await step('Reabrir mostra de onde a escolha partiu', async () => {
      const listbox = await abrir();
      const escolhida = within(listbox).getByRole('option', { name: 'Minas Gerais' });
      await expect(escolhida).toHaveAttribute('aria-selected', 'true');
      // O destaque nasce na opção escolhida: é o que orienta quem reabre a lista
      // para trocar de valor.
      await expect(escolhida).toHaveAttribute('data-highlighted');
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
    });
  },
};

// ─── RegionWithGroups ─────────────────────────────────────────────────────────

const REGIOES: SelectItem[] = [
  {
    type: 'group',
    label: 'Sudeste',
    items: [
      { value: 'sp', label: 'São Paulo' },
      { value: 'rj', label: 'Rio de Janeiro' },
      { value: 'mg', label: 'Minas Gerais' },
      { value: 'es', label: 'Espírito Santo' },
    ],
  },
  {
    type: 'group',
    label: 'Sul',
    items: [
      { value: 'rs', label: 'Rio Grande do Sul' },
      { value: 'sc', label: 'Santa Catarina' },
      { value: 'pr', label: 'Paraná' },
    ],
  },
];

export const RegionWithGroups: Story = {
  // Aqui o nome acessível vem do RÓTULO VISÍVEL, por `aria-labelledby`, e não de
  // um `aria-label` que repetiria o mesmo texto num segundo lugar. É a forma
  // preferível quando existe rótulo na tela: um texto só, e quem enxerga e quem
  // ouve leem a mesma coisa.
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.id = 'comp-region-label';
    label.htmlFor = 'comp-region';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = 'Selecione a região';

    wrap.append(
      label,
      createSelect({
        id: 'comp-region',
        name: 'region',
        placeholder: 'Selecione...',
        'aria-labelledby': label.id,
        items: REGIOES,
      }),
    );
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estados agrupados por região. O cabeçalho de cada grupo nomeia o conjunto para o leitor de tela, e não é escolhível. O nome do campo vem do rótulo visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');
    const abrir = abridor(gatilho);

    await step('O rótulo visível nomeia o campo', async () => {
      await expect(gatilho).toHaveAccessibleName('Selecione a região');
    });

    await step('Cada região vira um grupo nomeado', async () => {
      const listbox = await abrir();
      const grupos = within(listbox).getAllByRole('group');
      await expect(grupos).toHaveLength(2);
      await expect(grupos[0]).toHaveAccessibleName('Sudeste');
      await expect(grupos[1]).toHaveAccessibleName('Sul');
    });

    await step('O cabeçalho do grupo não é uma opção', async () => {
      const listbox = await waitForPortal('listbox');
      // Sete opções, e não nove: os dois cabeçalhos ficam fora da contagem porque
      // não são escolhíveis. Um cabeçalho publicado como `option` faria o teclado
      // parar num item que o Enter não resolve.
      await expect(within(listbox).getAllByRole('option')).toHaveLength(7);
      await expect(within(listbox).queryAllByRole('option', { name: 'Sudeste' })).toHaveLength(0);
    });

    await step('Escolher dentro de um grupo atualiza o campo e o formulário', async () => {
      const listbox = await abrir();
      await userEvent.click(within(listbox).getByRole('option', { name: 'Paraná' }));
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveTextContent('Paraná');
      const oculto = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="select-hidden-input"]',
      );
      await expect(oculto?.value).toBe('pr');
    });
  },
};

// ─── InForm ───────────────────────────────────────────────────────────────────

export const InForm: Story = {
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack nds-border-default nds-rounded-lg nds-w-sm nds-p-4';
    form.dataset.spacing = 'md';
    form.noValidate = true;

    const field = document.createElement('div');
    field.className = 'nds-stack';
    field.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.htmlFor = 'comp-form-state';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = 'Estado';

    const select = createSelect({
      id: 'comp-form-state',
      name: 'state',
      required: true,
      'aria-label': 'Estado',
      placeholder: 'Selecione...',
      items: [
        { value: 'sp', label: 'São Paulo' },
        { value: 'rj', label: 'Rio de Janeiro' },
        { value: 'mg', label: 'Minas Gerais' },
      ],
    });

    field.append(label, select);
    form.appendChild(field);

    // A fábrica do próprio design system, e não um `<button>` com classes que não
    // existem em folha nenhuma — que deixavam o botão sem estilo, com o contraste
    // do texto entregue ao acaso do tema.
    const submit = createButton({ type: 'submit', label: 'Continuar' });
    submit.style.alignSelf = 'flex-end';
    form.appendChild(submit);

    const out = document.createElement('p');
    out.className = 'nds-text-body';
    out.dataset.testid = 'form-output';
    form.appendChild(out);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      out.textContent = `Selecionado: ${data.get('state') || '(nenhum)'}`;
    });

    return form;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Campo dentro de um formulário com nome definido — o valor participa da serialização nativa no envio. A exigência é anunciada no próprio campo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');
    const abrir = abridor(gatilho);

    await step('O campo se anuncia obrigatório', async () => {
      await expect(gatilho).toHaveAttribute('aria-required', 'true');
    });

    await step('Escolher uma opção e enviar leva o valor no FormData', async () => {
      const listbox = await abrir();
      await userEvent.click(within(listbox).getByRole('option', { name: 'Rio de Janeiro' }));
      await waitForPortalGone('listbox');
      await userEvent.click(canvas.getByRole('button', { name: 'Continuar' }));

      // O formulário real é a prova: é a serialização nativa que carrega o campo,
      // sem código de quem consome. A fábrica mantém um campo escondido com o
      // nome, e é ele que o `FormData` enxerga.
      const form = canvasElement.querySelector('form') as HTMLFormElement;
      await waitFor(async () => {
        await expect(Object.fromEntries(new FormData(form).entries())).toEqual({ state: 'rj' });
      });
      const out = canvasElement.querySelector('[data-testid="form-output"]');
      await expect(out?.textContent).toContain('rj');
    });
  },
};
