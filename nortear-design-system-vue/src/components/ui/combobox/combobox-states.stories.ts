import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { ref } from 'vue';
import {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxTrigger,
} from './index';
import { noTransicao, resolveColor } from '@shared/testing/cor';
import { COUNTRIES } from './combobox.fixtures';
import {
  comboboxDisabledSource,
  comboboxInvalidSource,
  comboboxSource,
} from './combobox.source';

const meta = {
  title: 'UI/Combobox/States',
  component: Combobox,
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: comboboxSource },
      description: {
        component:
          'Fechado, aberto, sem resultado, bloqueado e reprovado. O teclado, o filtro e o foco vêm do primitivo — o que estas stories provam é que a composição não desfaz nada disso.',
      },
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const components = {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxTrigger,
};

/** As três primeiras da lista: curta o bastante para a caixa aberta não rolar. */
const SHORT = COUNTRIES.slice(0, 3);

export const Default: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item7'],
    docs: {
      description: {
        story:
          'Nada escolhido: a dica do campo aparece em cor secundária, a lista não existe no DOM e o chevron aponta para baixo.',
      },
    },
  },
  render: () => ({
    components,
    setup() {
      const country = ref('');
      return { country, countries: COUNTRIES };
    },
    template: `
      <div class="nds-w-xs">
        <Combobox v-model="country">
          <ComboboxLabel>País</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxInput placeholder="Buscar país" />
            <ComboboxClear aria-label="Limpar" />
            <ComboboxTrigger aria-label="Abrir lista">
              <ComboboxIcon />
            </ComboboxTrigger>
          </ComboboxInputWrapper>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxItem
                  v-for="option in countries"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                  <ComboboxItemIndicator />
                </ComboboxItem>
              </ComboboxList>
              <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
            </ComboboxPopup>
          </ComboboxPositioner>
        </Combobox>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /País/i });
    const box = canvasElement.querySelector<HTMLElement>('[data-slot="combobox-input-wrapper"]')!;

    // A sombra medida com a transição DESLIGADA: o campo declara
    // `transition: box-shadow`, e lida logo depois de focar a medida sairia do
    // primeiro quadro — um anel perfeitamente pintado relatado como ausente.
    const shadowOf = (el: HTMLElement) => noTransicao(el, () => getComputedStyle(el).boxShadow);

    await step('O campo nasce vazio e fechado', async () => {
      field.blur();
      await expect(field).toHaveValue('');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(field).toHaveAttribute('placeholder', 'Buscar país');
      // Fechado não é "escondido": a caixa some do DOM, e uma caixa apenas
      // invisível continuaria no percurso do leitor de tela.
      await expect(canvas.queryAllByRole('listbox')).toHaveLength(0);
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('O anel de foco envolve a caixa inteira, e não só o texto', async () => {
      // O anel mora no invólucro por `:focus-within` porque quem tem foco é
      // sempre o texto — um anel só nele deixaria os chips de fora do campo que
      // eles habitam. Medir a MUDANÇA, e não `boxShadow !== 'none'`, é o que
      // distingue anel de foco de anel de erro, que já existe sem foco.
      field.blur();
      const idle = shadowOf(box);
      field.focus();
      const focused = shadowOf(box);
      await expect(focused).not.toBe(idle);
      await expect(focused).not.toBe('none');
    });

    await step('Os botões de dentro do campo também acendem ao teclado', async () => {
      const clear = canvas.getByRole('button', { name: 'Limpar' });
      clear.blur();
      const idle = shadowOf(clear);
      field.focus();
      await userEvent.tab();
      await expect(clear).toHaveFocus();
      await expect(shadowOf(clear)).not.toBe(idle);
      clear.blur();
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Lista aberta, ancorada ao campo. A opção ativa é apontada por aria-activedescendant e realçada por data-highlighted — nenhuma opção recebe foco do navegador.',
      },
    },
  },
  render: () => ({
    components,
    setup() {
      const country = ref('');
      return { country, countries: SHORT };
    },
    template: `
      <div class="nds-w-xs nds-min-h-70">
        <Combobox v-model="country" :default-open="true">
          <ComboboxLabel>País</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxInput placeholder="Buscar país" />
            <ComboboxTrigger aria-label="Abrir lista">
              <ComboboxIcon />
            </ComboboxTrigger>
          </ComboboxInputWrapper>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxItem
                  v-for="option in countries"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                  <ComboboxItemIndicator />
                </ComboboxItem>
              </ComboboxList>
              <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
            </ComboboxPopup>
          </ComboboxPositioner>
        </Combobox>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /País/i });

    await step('A lista está aberta e o campo anuncia isso', async () => {
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      const listbox = canvas.getByRole('listbox');
      await expect(within(listbox).getAllByRole('option')).toHaveLength(SHORT.length);
    });

    await step('A seta destaca uma opção sem tirar o foco do campo', async () => {
      field.focus();
      await userEvent.keyboard('{Home}');
      const options = canvas.getAllByRole('option');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-activedescendant', options[0].id);
      });
      await expect(options[0]).toHaveAttribute('data-highlighted');
      await expect(field).toHaveFocus();
    });
  },
};

export const Empty: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      description: {
        story:
          'O texto digitado não casa com nenhuma opção: a lista continua aberta e mostra a mensagem de lista vazia, sem opção nenhuma.',
      },
    },
  },
  render: () => ({
    components,
    setup() {
      const country = ref('');
      return { country, countries: SHORT };
    },
    template: `
      <div class="nds-w-xs nds-min-h-70">
        <Combobox v-model="country">
          <ComboboxLabel>País</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxInput placeholder="Buscar país" />
            <ComboboxTrigger aria-label="Abrir lista">
              <ComboboxIcon />
            </ComboboxTrigger>
          </ComboboxInputWrapper>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxItem
                  v-for="option in countries"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                  <ComboboxItemIndicator />
                </ComboboxItem>
              </ComboboxList>
              <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
            </ComboboxPopup>
          </ComboboxPositioner>
        </Combobox>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /País/i });

    await step('Um texto sem correspondência esvazia a lista', async () => {
      // Cada passo estabelece a própria precondição: o painel Interactions
      // reexecuta a play no MESMO DOM, e digitar por cima do que ficou daria
      // outro filtro.
      field.focus();
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
    });

    await step('A mensagem de lista vazia é escrita e anunciada', async () => {
      const empty = canvasElement.querySelector('[data-slot="combobox-empty"]');
      await expect(empty).not.toBeNull();
      await expect(empty).toHaveTextContent('Nenhum resultado');
      // Região viva: o elemento fica montado e o que entra é o CONTEÚDO —
      // criar a região no instante da mudança não anuncia nada.
      await expect(empty).toHaveAttribute('role', 'status');
      await expect(empty).toHaveAttribute('aria-live', 'polite');
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      source: { transform: comboboxDisabledSource },
      description: {
        story:
          'Campo indisponível: nada recebe foco, a lista não abre e o botão de abrir sai do alcance do ponteiro e do teclado.',
      },
    },
  },
  render: () => ({
    components,
    setup() {
      const country = ref('brasil');
      return { country, countries: SHORT };
    },
    template: `
      <div class="nds-w-xs">
        <Combobox v-model="country" disabled>
          <ComboboxLabel>País</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxInput placeholder="Buscar país" />
            <ComboboxTrigger aria-label="Abrir lista">
              <ComboboxIcon />
            </ComboboxTrigger>
          </ComboboxInputWrapper>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxItem
                  v-for="option in countries"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                  <ComboboxItemIndicator />
                </ComboboxItem>
              </ComboboxList>
              <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
            </ComboboxPopup>
          </ComboboxPositioner>
        </Combobox>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /País/i });

    await step('O bloqueio vale para o texto e para o botão de abrir', async () => {
      // `disabled` nativo, não só `aria-`: é o que tira os dois do percurso do
      // Tab e cancela o clique no próprio navegador.
      await expect(field).toBeDisabled();
      await expect(canvas.getByRole('button', { name: 'Abrir lista' })).toBeDisabled();
      await expect(
        canvasElement.querySelector('[data-slot="combobox-input-wrapper"]'),
      ).toHaveAttribute('data-disabled');
    });

    await step('A lista não abre pelo teclado', async () => {
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(canvas.queryAllByRole('listbox')).toHaveLength(0);
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: {
      source: { transform: comboboxInvalidSource },
      description: {
        story:
          'Validação reprovada: a borda da caixa passa a usar a cor de erro, o campo é anunciado como inválido e a mensagem fica escrita ao lado — a cor é reforço do aviso, nunca o aviso.',
      },
    },
  },
  render: () => ({
    components,
    setup() {
      const country = ref('');
      return { country, countries: SHORT };
    },
    template: `
      <div class="nds-w-xs nds-stack" data-spacing="sm">
        <Combobox v-model="country">
          <ComboboxLabel>País</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxInput placeholder="Buscar país" aria-invalid="true" />
            <ComboboxTrigger aria-label="Abrir lista">
              <ComboboxIcon />
            </ComboboxTrigger>
          </ComboboxInputWrapper>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxItem
                  v-for="option in countries"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                  <ComboboxItemIndicator />
                </ComboboxItem>
              </ComboboxList>
              <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
            </ComboboxPopup>
          </ComboboxPositioner>
        </Combobox>
        <p class="nds-text-body nds-text-destructive">Escolha um país para continuar.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /País/i });
    const box = canvasElement.querySelector<HTMLElement>('[data-slot="combobox-input-wrapper"]')!;

    await step('O campo é anunciado como inválido', async () => {
      field.blur();
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(canvas.getByText('Escolha um país para continuar.')).toBeVisible();
    });

    await step('A borda da caixa passa a usar a cor de erro', async () => {
      // A cor sai da folha, resolvida pelo próprio navegador dentro da árvore
      // da story: comparar com o token é o que prova que a borda mudou por
      // causa da validação, e não porque alguma outra regra a pintou.
      const expected = resolveColor(canvasElement, 'hsl(var(--destructive))');
      const painted = noTransicao(box, () => getComputedStyle(box).borderTopColor);
      await expect(expected).not.toBeNull();
      await expect(painted).toBe(expected);
    });
  },
};
