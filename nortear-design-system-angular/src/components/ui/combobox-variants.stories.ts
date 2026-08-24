import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_COMBOBOX } from './combobox';
import { comboboxSnippet } from './combobox.source';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';

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

// Lista longa da spec, também igual nas cinco stacks. A story de linha única
// precisa de MAIS escolhidos do que a caixa comporta: com dois ou três chips,
// acumular linhas e rolar na horizontal desenham a mesma coisa, e a play
// mediria um ramo que nunca chegou a ser exercido.
const VISITED_COUNTRIES = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'colombia', label: 'Colômbia' },
  { value: 'mexico', label: 'México' },
  { value: 'peru', label: 'Peru' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'espanha', label: 'Espanha' },
  { value: 'uruguai', label: 'Uruguai' },
] as const;

/**
 * Escolhidos da story de linha única, POR STORY, fora do componente.
 *
 * Seis de nove: é o transbordo que separa as duas formas de `chipsLayout`.
 * Guardar a escolha aqui fora é o que o consumidor real faz — quem monta o
 * formulário é dono do valor — e é o que mantém os chips de pé quando o
 * Storybook recria a árvore.
 */
const visitedStore: { values: string[] } = {
  values: VISITED_COUNTRIES.slice(0, 6).map((country) => country.value),
};

const visitedLabel = (value: string): string =>
  VISITED_COUNTRIES.find((country) => country.value === value)?.label ?? value;

const meta: Meta = {
  title: 'UI/Combobox/Variants',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_COMBOBOX] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Formas do Combobox: lista aberta com opção ativa, lista agrupada e chips em linha única.',
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

// ─── Chips em linha única ─────────────────────────────────────────────────────

export const SingleLineChips: Story = {
  parameters: {
    docs: {
      source: {
        transform: () =>
          comboboxSnippet({
            label: 'Países visitados',
            placeholder: 'Adicionar país',
            multiple: true,
            name: 'paises',
            chipsLayout: 'single-line',
            items: VISITED_COUNTRIES.map((country) => country.label),
          }),
      },
      description: {
        story:
          'Os chips ficam numa linha só que rola na horizontal, e o campo não cresce em altura. ' +
          'Limpar e abrir continuam na primeira linha, ao lado do texto.',
      },
    },
  },
  render: () => ({
    props: {
      items: VISITED_COUNTRIES,
      store: visitedStore,
      visitedLabel,
      onChange: (value: unknown) => {
        visitedStore.values = (value as string[]) ?? [];
      },
    },
    template: `
      <!-- Largura estreita de propósito, por classe e não por \`style\`: é ela
           que faz os seis chips passarem do que a caixa comporta. -->
      <div class="nds-w-xs">
        <nds-combobox
          multiple
          chipsLayout="single-line"
          name="paises"
          [value]="store.values"
          (valueChange)="onChange($event)"
        >
          <label ndsComboboxLabel>Países visitados</label>

          <div ndsComboboxInputWrapper>
            <div ndsComboboxChips>
              @for (chosen of store.values; track chosen) {
                <span ndsComboboxChip [value]="chosen">
                  {{ visitedLabel(chosen) }}
                  <button
                    ndsComboboxChipRemove
                    [attr.aria-label]="'Remover ' + visitedLabel(chosen)"
                  ></button>
                </span>
              }

              <input ndsComboboxInput placeholder="Adicionar país" />
            </div>

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
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const box = canvasElement.querySelector<HTMLElement>(
      '[data-slot="combobox-input-wrapper"]',
    )!;
    const chipsBox = canvasElement.querySelector<HTMLElement>('[data-slot="combobox-chips"]')!;
    const chips = () => canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]');

    await step('A caixa do campo declara a forma de linha única', async () => {
      // `data-chips` é HOST BINDING da diretiva do wrapper — expressão de host é
      // string, e até este portão nenhuma story a afirmava: apagar o binding
      // deixava tudo verde e o campo voltava a quebrar linha na tela.
      await expect(box).toHaveAttribute('data-chips', 'single-line');
    });

    await step('Há chips de sobra para o campo comportar', async () => {
      // A medida que dá SENTIDO à story: com poucos chips, linha única e quebra
      // desenham a mesma coisa, e o resto da play passaria sem exercer o ramo
      // que ela existe para cobrir.
      await waitFor(async () => {
        await expect(chips().length).toBeGreaterThan(4);
      });
      await expect(chipsBox.scrollWidth).toBeGreaterThan(chipsBox.clientWidth);
    });

    await step('Limpar e abrir continuam na primeira linha', async () => {
      // Era ESTE o defeito relatado: a caixa do campo quebrava junto com os
      // chips e os dois controles caíam para baixo do bloco. Comparar o topo de
      // cada um com o do primeiro chip é o que acusa a queda.
      const firstChipTop = chips()[0].getBoundingClientRect().top;
      const clearTop = canvas
        .getByRole('button', { name: 'Limpar' })
        .getBoundingClientRect().top;
      const openTop = canvas
        .getByRole('button', { name: 'Abrir lista' })
        .getBoundingClientRect().top;

      // Tolerância de poucos px: chip e botões têm alturas próximas, mas não
      // iguais, e o alinhamento vertical os separa por uma fração. Uma linha
      // inteira de queda passa dos 20px e reprova aqui.
      await expect(Math.abs(clearTop - firstChipTop)).toBeLessThanOrEqual(6);
      await expect(Math.abs(openTop - firstChipTop)).toBeLessThanOrEqual(6);
    });

    await step('O conjunto rola na horizontal, e o campo não cresce', async () => {
      // Rolar é a contrapartida de não quebrar: sem ela, os chips que passam da
      // largura ficariam inalcançáveis.
      await expect(getComputedStyle(chipsBox).overflowX).toBe('auto');
      // Uma linha só: a caixa não é mais alta do que o próprio chip mais a
      // folga que o padding do campo dá aos dois lados.
      const chipHeight = chips()[0].getBoundingClientRect().height;
      await expect(box.getBoundingClientRect().height).toBeLessThan(chipHeight * 2);
    });
  },
};
