import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_COMBOBOX } from './combobox';
import { comboboxSnippet } from './combobox.source';
import { waitForPortal } from '@/lib/wait-for-portal';

// Mesma lista da spec de exemplos — divergir aqui faz a story mostrar coisa
// diferente da mesma story nas outras stacks.
const COUNTRIES = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'portugal', label: 'Portugal' },
] as const;

const meta: Meta = {
  title: 'Primitives/Form/Combobox/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_COMBOBOX] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component: 'Estados do Combobox: desabilitado, inválido e lista sem resultado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Desabilitado ─────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: { transform: () => comboboxSnippet({ disabled: true }) },
      description: { story: 'Desabilitado: nada recebe foco e a lista não abre.' },
    },
  },
  render: () => ({
    props: { items: COUNTRIES },
    template: `
      <nds-combobox disabled>
        <label ndsComboboxLabel>País</label>

        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput placeholder="Buscar país" />
          <button ndsComboboxClear aria-label="Limpar"></button>
          <button ndsComboboxTrigger aria-label="Abrir lista">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>

        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of items; track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>Nenhum resultado</div>
        </ng-template>
      </nds-combobox>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox') as HTMLInputElement;

    await step('O campo sai da ordem de tabulação', async () => {
      await expect(field.disabled).toBe(true);
    });

    await step('A caixa do campo carrega a marca de indisponível', async () => {
      // Sem esta medida, um `disabled` correto no `<input>` com a caixa intacta
      // passaria: o texto ficaria bloqueado e a moldura seguiria ativa.
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      await expect(wrapper).toHaveAttribute('data-disabled');
    });

    await step('A lista não abre pelo clique', async () => {
      // Sem esta medida, um `disabled` correto no atributo com a guarda ausente
      // no código passaria: o campo pareceria bloqueado e abriria mesmo assim.
      await userEvent.click(field, { pointerEventsCheck: 0 });
      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
    });
  },
};

// ─── Inválido ─────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: {
      source: { transform: () => comboboxSnippet({ invalid: true }) },
      description: { story: 'Inválido: o campo é anunciado com erro e a borda muda de cor.' },
    },
  },
  render: () => ({
    props: { items: COUNTRIES },
    template: `
      <nds-combobox invalid>
        <label ndsComboboxLabel>País</label>

        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput placeholder="Buscar país" />
          <button ndsComboboxClear aria-label="Limpar"></button>
          <button ndsComboboxTrigger aria-label="Abrir lista">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>

        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of items; track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>Nenhum resultado</div>
        </ng-template>
      </nds-combobox>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await step('O erro é anunciado no campo', async () => {
      // `aria-invalid` é ligado pelo PRIMITIVO, a partir do estado de validação
      // da raiz. Escrevê-lo no template seria escrever num atributo que o host
      // binding sobrescreve no quadro seguinte.
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-invalid', 'true');
      });
    });

    await step('O estado inválido deixa marca visual própria', async () => {
      // Sem esta medida, `aria-invalid` correto com a regra de CSS ausente
      // passaria: o leitor de tela anunciaria o erro que ninguém vê.
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const color = getComputedStyle(wrapper).borderColor;
      await expect(color).not.toBe('rgba(0, 0, 0, 0)');
      await expect(wrapper).toHaveAttribute('aria-invalid', 'true');
    });
  },
};

// ─── Lista sem resultado ──────────────────────────────────────────────────────

export const EmptyResult: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      source: { transform: () => comboboxSnippet({}) },
      description: { story: 'Busca sem correspondência: a lista mostra a mensagem de vazio.' },
    },
  },
  render: () => ({
    props: { items: COUNTRIES },
    template: `
      <nds-combobox>
        <label ndsComboboxLabel>País</label>

        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput placeholder="Buscar país" />
          <button ndsComboboxClear aria-label="Limpar"></button>
          <button ndsComboboxTrigger aria-label="Abrir lista">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>

        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of items; track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>Nenhum resultado</div>
        </ng-template>
      </nds-combobox>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox') as HTMLInputElement;

    await step('Texto sem correspondência esvazia a lista', async () => {
      // `clear` antes de digitar: o painel Interactions reexecuta no mesmo DOM,
      // e sem isso a segunda rodada digitaria por cima do texto da primeira.
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');
      await waitForPortal('listbox', { name: 'País' });

      await waitFor(async () => {
        await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
      });
    });

    await step('A mensagem de vazio aparece no lugar das opções', async () => {
      const empty = document.body.querySelector('[data-slot="combobox-empty"]');
      await expect(empty).not.toBeNull();
      await expect(empty).toHaveTextContent('Nenhum resultado');
    });

    await step('Nenhuma opção fica apontada quando não há opção', async () => {
      // `aria-activedescendant` apontando um id que não existe mais é o defeito
      // clássico do padrão: o leitor de tela anuncia uma opção fantasma.
      await waitFor(async () => {
        await expect(field).not.toHaveAttribute('aria-activedescendant');
      });
    });
  },
};
