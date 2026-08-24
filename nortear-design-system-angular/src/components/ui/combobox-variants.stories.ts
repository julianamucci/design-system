import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_COMBOBOX } from './combobox';
import { comboboxSnippet } from './combobox.source';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

const COUNTRIES = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'portugal', label: 'Portugal' },
] as const;

// Grupos da spec de exemplos: Frutas e Legumes.
const GROCERIES = [
  {
    name: 'Frutas',
    items: [
      { value: 'maca', label: 'Maçã' },
      { value: 'banana', label: 'Banana' },
      { value: 'laranja', label: 'Laranja' },
    ],
  },
  {
    name: 'Legumes',
    items: [
      { value: 'cenoura', label: 'Cenoura' },
      { value: 'batata', label: 'Batata' },
      { value: 'abobrinha', label: 'Abobrinha' },
    ],
  },
] as const;

const meta: Meta = {
  title: 'UI/Combobox/Variants',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_COMBOBOX] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component: 'Formas do Combobox: lista aberta com opção ativa e lista agrupada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Lista aberta com opção ativa ─────────────────────────────────────────────

export const OpenWithActiveOption: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item4', 'accessibility.item7', 'visual.item3'],
    docs: {
      source: { transform: () => comboboxSnippet({ items: ['Brasil', 'Argentina', 'Chile', 'Portugal'] }) },
      description: {
        story:
          'Lista aberta com uma opção ativa. O foco fica no campo; a opção é apontada, não focada.',
      },
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

    await step('A seta abre a lista e ativa a primeira opção', async () => {
      // `clear` antes: o painel Interactions reexecuta no mesmo DOM, e o texto
      // da rodada anterior filtraria a lista que este passo espera inteira.
      await userEvent.clear(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');

      const list = await waitForPortal('listbox', { name: 'País' });
      await expect(field).toHaveAttribute('aria-expanded', 'true');

      const options = within(list).getAllByRole('option');
      await waitFor(async () => {
        await expect(options[0]).toHaveAttribute('data-highlighted');
      });
    });

    await step('A seta move a opção ativa, e o foco não sai do campo', async () => {
      // É o coração do padrão: se o foco fosse para a opção, a digitação
      // pararia de funcionar no meio da navegação.
      await userEvent.keyboard('{ArrowDown}');
      const list = within(document.body).getByRole('listbox', { name: 'País' });
      const options = within(list).getAllByRole('option');

      await waitFor(async () => {
        await expect(options[1]).toHaveAttribute('data-highlighted');
      });
      await expect(field).toHaveAttribute('aria-activedescendant', options[1].id);
      await expect(field).toHaveFocus();
    });

    await step('O campo em foco mostra anel visível', async () => {
      // Um `outline: 0` sem substituto passaria em qualquer teste de estado — é
      // preciso olhar o estilo computado do WRAPPER, que é quem desenha o anel,
      // porque o foco real vive no campo de texto por dentro dele.
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const styles = getComputedStyle(wrapper);
      await expect(styles.outlineStyle !== 'none' || styles.boxShadow !== 'none').toBe(true);
    });

    await step('Escape fecha e devolve a lista ao estado inicial', async () => {
      // Devolve a story ao que o Chromatic fotografa e deixa a play idempotente.
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('listbox');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

// ─── Agrupado ─────────────────────────────────────────────────────────────────

export const Grouped: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: () =>
          comboboxSnippet({
            label: 'Ingrediente',
            placeholder: 'Buscar ingrediente',
            groups: {
              Frutas: ['Maçã', 'Banana', 'Laranja'],
              Legumes: ['Cenoura', 'Batata', 'Abobrinha'],
            },
          }),
      },
      description: {
        story: 'Itens agrupados: cada grupo traz um cabeçalho que nomeia o conjunto.',
      },
    },
  },
  render: () => ({
    props: { groups: GROCERIES },
    template: `
      <nds-combobox>
        <label ndsComboboxLabel>Ingrediente</label>

        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput placeholder="Buscar ingrediente" />
          <button ndsComboboxClear aria-label="Limpar"></button>
          <button ndsComboboxTrigger aria-label="Abrir lista">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>

        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (group of groups; track group.name; let last = $last) {
              <div ndsComboboxGroup>
                <div ndsComboboxGroupLabel>{{ group.name }}</div>
                @for (item of group.items; track item.value) {
                  <div ndsComboboxItem [value]="item.value">
                    {{ item.label }}
                    <span ndsComboboxItemIndicator></span>
                  </div>
                }
              </div>
              @if (!last) {
                <div ndsComboboxSeparator></div>
              }
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

    await step('A lista abre com os dois grupos', async () => {
      await userEvent.clear(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitForPortal('listbox', { name: 'Ingrediente' });

      await waitFor(async () => {
        await expect(
          document.body.querySelectorAll('[data-slot="combobox-group"]'),
        ).toHaveLength(2);
      });
    });

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      // `role="group"` sem nome não agrupa nada para quem usa leitor de tela: é
      // o `aria-labelledby` apontando o cabeçalho que faz o trabalho.
      const groups = [
        ...document.body.querySelectorAll<HTMLElement>('[data-slot="combobox-group"]'),
      ];
      for (const group of groups) {
        const labelId = group.getAttribute('aria-labelledby');
        await expect(labelId).toBeTruthy();
        await expect(document.getElementById(labelId!)).not.toBeNull();
      }
      await expect(groups[0]).toHaveTextContent('Frutas');
      await expect(groups[1]).toHaveTextContent('Legumes');
    });

    await step('O divisor entre grupos é decorativo', async () => {
      // `role="separator"` não é filho permitido de `role="listbox"` — o axe
      // reprova por `aria-required-children`. Quem separa os blocos para quem
      // não vê a tela é o cabeçalho, não o traço.
      const separator = document.body.querySelector('[data-slot="combobox-separator"]');
      await expect(separator).not.toBeNull();
      await expect(separator).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Escape fecha a lista', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('listbox');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
