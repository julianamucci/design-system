import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_SELECT } from './select';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

// ─── Dados ────────────────────────────────────────────────────────────────────
//
// As três listas ficam aqui e as asserções derivam delas: acrescentar um estado
// não pode fazer um teste mentir por contagem escrita à mão.

const SUDESTE = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
] as const;

const SUL = [
  { value: 'rs', label: 'Rio Grande do Sul' },
  { value: 'sc', label: 'Santa Catarina' },
  { value: 'pr', label: 'Paraná' },
] as const;

const GROUPS = [
  { label: 'Sudeste', itens: SUDESTE },
  { label: 'Sul', itens: SUL },
] as const;

const meta: Meta = {
  title: 'UI/Select/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_SELECT] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          'Lista simples, lista agrupada e opção com ícone. As três nascem abertas para ' +
          'que a regressão visual capture a lista — é ela que muda entre as variantes, ' +
          'não o gatilho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// `[modal]="false"` nas stories que nascem abertas: em modo modal o positioner
// instala um backdrop que cobre a página inteira, e uma story que já abre não
// tem nada atrás para proteger — o backdrop só atrapalharia a leitura visual.

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Lista plana — apenas opções dentro do conteúdo, sem cabeçalho nem divisão.',
      },
    },
  },
  render: () => ({
    props: { states: SUDESTE },
    template: `
      <nds-select [defaultOpen]="true" [modal]="false">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (estado of states; track estado.value) {
            <div ndsSelectItem [value]="estado.value">{{ estado.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ step }) => {
    const lista = await waitForPortal('listbox', { name: 'Estado' });

    await step('A lista é um listbox nomeado, com uma opção por estado', async () => {
      const opcoes = within(lista).getAllByRole('option');
      await expect(opcoes).toHaveLength(SUDESTE.length);
      await expect(opcoes[0]).toHaveAccessibleName(SUDESTE[0].label);
      // `aria-selected` existe em toda opção: é ele que o leitor de tela lê ao
      // percorrer a lista, e não só no item escolhido.
      await expect(opcoes[0].getAttribute('aria-selected')).toBe('false');
    });

    await step('Nenhum cabeçalho de grupo aparece na lista plana', async () => {
      await expect(within(lista).queryAllByRole('group')).toHaveLength(0);
    });
  },
};

// ─── Com grupos ───────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Cabeçalho por categoria e divisão entre grupos. O cabeçalho nomeia o grupo — ' +
          'não é texto solto: o leitor de tela anuncia "Sudeste, grupo" antes das opções.',
      },
    },
  },
  render: () => ({
    props: { grupos: GROUPS },
    template: `
      <nds-select [defaultOpen]="true" [modal]="false">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (grupo of grupos; track grupo.label; let last = $last) {
            <div ndsSelectGroup>
              <div ndsSelectLabel>{{ grupo.label }}</div>
              @for (estado of grupo.itens; track estado.value) {
                <div ndsSelectItem [value]="estado.value">{{ estado.label }}</div>
              }
            </div>
            @if (!last) {
              <div ndsSelectSeparator></div>
            }
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ step }) => {
    const lista = await waitForPortal('listbox', { name: 'Estado' });
    const inside = within(lista);

    await step('Cada categoria vira um grupo nomeado pelo seu cabeçalho', async () => {
      const grupos = inside.getAllByRole('group');
      await expect(grupos).toHaveLength(GROUPS.length);
      // O nome do grupo depende de o `aria-labelledby` apontar para um id que
      // EXISTE — o primitivo gera o id no grupo e não o escreve em lugar nenhum;
      // quem o põe no cabeçalho é o componente. Sem isso o grupo ficaria anônimo
      // e o `aria-labelledby` viraria referência quebrada.
      for (const [i, grupo] of grupos.entries()) {
        await expect(grupo).toHaveAccessibleName(GROUPS[i].label);
      }
    });

    await step('As opções continuam todas na mesma lista', async () => {
      const total = GROUPS.reduce((sum, g) => sum + g.itens.length, 0);
      await expect(inside.getAllByRole('option')).toHaveLength(total);
    });

    await step('A divisão entre grupos é decorativa', async () => {
      // `role="separator"` com `aria-hidden`: linha para o olho, silêncio para o
      // leitor de tela — quem separa semanticamente é o grupo.
      const separadores = lista.querySelectorAll('.nds-select-separator');
      await expect(separadores).toHaveLength(GROUPS.length - 1);
      await expect(separadores[0].getAttribute('aria-hidden')).toBe('true');
    });
  },
};

// ─── Com ícone ────────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Ícone antes do texto da opção. Ele é decorativo: o nome acessível da opção ' +
          'continua sendo só o rótulo, sem eco.',
      },
    },
  },
  render: () => ({
    props: { states: SUDESTE },
    template: `
      <nds-select [defaultOpen]="true" [modal]="false">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (estado of states; track estado.value) {
            <div ndsSelectItem [value]="estado.value">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {{ estado.label }}
            </div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ step }) => {
    const lista = await waitForPortal('listbox', { name: 'Estado' });
    const opcoes = within(lista).getAllByRole('option');

    await step('O ícone entra na opção e fica fora do nome acessível', async () => {
      await expect(opcoes[0].querySelector('svg')).toBeTruthy();
      await expect(opcoes[0]).toHaveAccessibleName(SUDESTE[0].label);
    });

    await step('O ícone é dimensionado pela folha do componente', async () => {
      // `.nds-select-item svg:not([class*="size-"])` é a regra que dá 1rem; sem
      // ela o SVG viria no tamanho intrínseco e estouraria a linha.
      const icone = opcoes[0].querySelector('svg') as SVGElement;
      await expect(getComputedStyle(icone).width).toBe('16px');
    });
  },
};
