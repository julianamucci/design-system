import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import type { SelectItem } from './select';
import { abridor, comRotulo } from './select.fixtures';
import { selectSource, selectSourceWith } from './select.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: selectSource },
      description: {
        component:
          'Variantes do Select: Default (lista plana), WithGroups (cabeçalho por categoria) e WithIcon (ícone inline antes do rótulo).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Dados ────────────────────────────────────────────────────────────────────

/** Rótulos das regiões — a asserção deriva daqui em vez de contar à mão. */
const REGIOES = {
  Sudeste: [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais' },
  ],
  Sul: [
    { value: 'rs', label: 'Rio Grande do Sul' },
    { value: 'sc', label: 'Santa Catarina' },
    { value: 'pr', label: 'Paraná' },
  ],
} as const;

/** Traçados de ícone (lucide `mail`, `phone`, `message-circle`). */
const ICONS = {
  email: [
    'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7',
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ],
  telefone:
    'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
  chat: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
} as const;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    comRotulo('v-default-select', 'Estado', {
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
          'Lista simples — só opções, sem cabeçalho. O placeholder fica à mostra até a pessoa escolher.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');
    const abrir = abridor(gatilho);

    await step('O campo é nomeado pelo rótulo externo', async () => {
      await expect(gatilho).toHaveAccessibleName('Estado');
    });

    await step('Abrir mostra uma lista plana, sem cabeçalho de grupo', async () => {
      const listbox = await abrir();
      const opcoes = within(listbox).getAllByRole('option');
      await expect(opcoes).toHaveLength(4);
      await expect(opcoes[0]).toHaveAccessibleName('São Paulo');
      // Lista plana não inventa grupo: um grupo de um só existe para o olho e
      // mente para o leitor de tela.
      await expect(within(listbox).queryAllByRole('group')).toHaveLength(0);
    });

    await step('Clicar numa opção escolhe e fecha', async () => {
      const listbox = await abrir();
      await userEvent.click(within(listbox).getByRole('option', { name: 'Minas Gerais' }));
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveTextContent('Minas Gerais');
      // Escolher pelo ponteiro devolve o foco ao campo: sem isso o `mousedown` na
      // opção levaria o foco ao `<body>` e o teclado ficaria sem dono.
      await expect(gatilho).toHaveFocus();
    });
  },
};

// ─── WithGroups ───────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  render: () =>
    comRotulo('v-groups-select', 'Selecione a região', {
      placeholder: 'Selecione...',
      items: [
        { type: 'group', label: 'Sudeste', items: [...REGIOES.Sudeste] },
        { type: 'separator' },
        { type: 'group', label: 'Sul', items: [...REGIOES.Sul] },
      ] as SelectItem[],
    }),
  parameters: {
    docs: {
      // O agrupamento é o assunto: a lista plana do meta esconderia o cabeçalho
      // de categoria e a linha entre os grupos.
      source: {
        transform: selectSourceWith({
          id: 'regiao',
          labelText: 'Selecione a região',
          items: [
            { type: 'group', label: 'Sudeste', items: [...REGIOES.Sudeste] },
            { type: 'separator' },
            { type: 'group', label: 'Sul', items: [...REGIOES.Sul] },
          ],
        }),
      },
      description: {
        story:
          'Opções agrupadas por categoria, com cabeçalho nomeando cada grupo. Use quando houver duas ou mais categorias claras com pelo menos duas opções cada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');
    const abrir = abridor(gatilho);

    await step('Escolher item de um grupo atualiza o campo', async () => {
      const listbox = await abrir();
      await userEvent.click(within(listbox).getByRole('option', { name: 'Santa Catarina' }));
      await waitForPortalGone('listbox');
      await waitFor(async () => {
        await expect(gatilho).toHaveTextContent('Santa Catarina');
      });
    });

    // Os passos abaixo reabrem a lista e a story TERMINA aberta: é a lista que
    // muda entre as variantes, não o campo fechado, e é ela que a regressão visual
    // precisa fotografar.
    await step('Cada categoria vira um grupo nomeado pelo cabeçalho', async () => {
      const listbox = await abrir();
      const grupos = within(listbox).getAllByRole('group');
      await expect(grupos).toHaveLength(Object.keys(REGIOES).length);
      for (const [i, nome] of Object.keys(REGIOES).entries()) {
        await expect(grupos[i]).toHaveAccessibleName(nome);
      }
    });

    await step('As opções continuam todas na mesma lista', async () => {
      const listbox = await waitForPortal('listbox');
      const total = Object.values(REGIOES).reduce((soma, g) => soma + g.length, 0);
      await expect(within(listbox).getAllByRole('option')).toHaveLength(total);
      // Linha para o olho, silêncio para o leitor de tela — quem separa
      // semanticamente é o grupo, e um `separator` dentro de `listbox` seria filho
      // não permitido.
      const linhas = listbox.querySelectorAll('[data-slot="select-separator"]');
      await expect(linhas).toHaveLength(Object.keys(REGIOES).length - 1);
      await expect(linhas[0]).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

// ─── WithIcon ─────────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () =>
    comRotulo('v-icon-select', 'Canal de contato', {
      placeholder: 'Selecione...',
      items: [
        { value: 'email', label: 'E-mail', icon: [...ICONS.email] },
        { value: 'phone', label: 'Telefone', icon: ICONS.telefone },
        { value: 'chat', label: 'Chat', icon: ICONS.chat },
      ],
    }),
  parameters: {
    docs: {
      // O ícone é o assunto: ele entra na própria opção, como traçado, e é
      // decorativo — fica fora do nome acessível.
      source: {
        transform: selectSourceWith({
          id: 'canal',
          labelText: 'Canal de contato',
          items: [
            { value: 'email', label: 'E-mail', icon: [...ICONS.email] },
            { value: 'phone', label: 'Telefone', icon: ICONS.telefone },
            { value: 'chat', label: 'Chat', icon: ICONS.chat },
          ],
        }),
      },
      description: {
        story:
          'Ícone inline antes do rótulo. Ele é decorativo: fica fora do nome acessível da opção e é dimensionado pela folha do componente, não pelo tamanho intrínseco do desenho.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');
    const abrir = abridor(gatilho);

    await step('O ícone entra na opção e fica fora do nome acessível', async () => {
      const listbox = await abrir();
      const opcoes = within(listbox).getAllByRole('option');
      await expect(opcoes).toHaveLength(3);
      await expect(opcoes[0].querySelector('svg')).toBeTruthy();
      // Decorativo: o nome acessível continua sendo só o rótulo, sem eco.
      await expect(opcoes[0]).toHaveAccessibleName('E-mail');
      await expect(opcoes[0].querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O ícone é dimensionado pela folha do componente', async () => {
      // A regra que dá 1rem ao SVG sem classe de tamanho; sem ela o desenho viria
      // no tamanho intrínseco e estouraria a linha.
      const listbox = await waitForPortal('listbox');
      const icone = within(listbox).getAllByRole('option')[0].querySelector('svg') as SVGElement;
      await expect(getComputedStyle(icone).width).toBe('16px');
    });
  },
};
