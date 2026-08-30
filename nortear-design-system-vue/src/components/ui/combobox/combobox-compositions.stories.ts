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
import type { ComboboxFilter } from './index';
import { Button } from '@/components/ui/button';
import { COUNTRIES, SHORT_COUNTRIES } from './combobox.fixtures';
import { comboboxControlledSource, comboboxCustomFilterSource } from './combobox.source';

const meta = {
  title: 'Primitives/Form/Combobox/Compositions',
  component: Combobox,
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Piso do arquivo: as duas composições declaram a sua, porque cada uma
      // tem forma própria de chamada. Sem transform aqui, uma story nova
      // apareceria com o markup gerado pelo Storybook em vez do snippet.
      source: { transform: comboboxCustomFilterSource },
      description: {
        component:
          'Composições do Combobox: filtro de correspondência próprio e campo com escolha e busca controladas por fora.',
      },
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O predicado do consumidor: casa só por INÍCIO do rótulo.
 *
 * O filtro padrão casa em QUALQUER posição e ignora acento — "ru" acharia Peru
 * e Uruguai. Este não acha nenhum dos dois, e é essa diferença que a play mede.
 */
const startsWithLabel: ComboboxFilter = (item, query) =>
  item.label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase());

export const CustomFilter: Story = {
  parameters: {
    docs: {
      source: { transform: comboboxCustomFilterSource },
      description: {
        story:
          'Filtro próprio no lugar do padrão: aqui a busca casa só pelo começo do rótulo. Com um predicado à mão, cada opção decide a própria presença na lista, e o filtro de dentro sai de cena por inteiro.',
      },
    },
  },
  render: () => ({
    components: {
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
    },
    setup() {
      const country = ref('');
      return { country, countries: COUNTRIES, startsWithLabel };
    },
    template: `
      <div class="nds-w-xs nds-min-h-100">
        <Combobox v-model="country" :filter="startsWithLabel">
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
                  v-for="item in countries"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
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

    // Cada passo estabelece a própria precondição: o painel Interactions
    // reexecuta a play no MESMO DOM, e digitar por cima do que ficou daria
    // outro filtro.
    const reset = async () => {
      field.focus();
      await userEvent.clear(field);
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'false');
      });
    };

    await step('Sem busca, a lista inteira aparece', async () => {
      await reset();
      await userEvent.keyboard('{ArrowDown}');
      const listbox = await waitFor(() => canvas.getByRole('listbox'));
      await waitFor(async () => {
        await expect(within(listbox).getAllByRole('option')).toHaveLength(COUNTRIES.length);
      });
      // Os dois rótulos que carregam "ru" no MEIO: é o que o filtro padrão
      // acharia, e é contra eles que o passo seguinte mede.
      await expect(within(listbox).getByRole('option', { name: /^Peru$/ })).toBeVisible();
      await expect(within(listbox).getByRole('option', { name: /^Uruguai$/ })).toBeVisible();
    });

    await step('O que só casa no meio não sobra na lista', async () => {
      await reset();
      await userEvent.type(field, 'ru');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      const empty = canvasElement.querySelector('[data-slot="combobox-empty"]');
      await expect(empty).toHaveTextContent('Nenhum resultado');
    });

    await step('A contagem de opções obedece ao predicado', async () => {
      await reset();
      await userEvent.type(field, 'co');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option')).toHaveTextContent('Colômbia');
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      source: { transform: comboboxControlledSource },
      description: {
        story:
          'Valor e texto de busca administrados por fora: a escolha entra e sai pelo modelo do campo, e o texto digitado também. Os botões acima escrevem no estado externo sem tocar no componente; a linha abaixo mostra o que esse estado guarda.',
      },
    },
  },
  render: () => ({
    components: {
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
      Button,
    },
    setup() {
      // Os dois modelos moram FORA: `country` leva a escolha, `search` leva o
      // texto de busca. Nenhum dos dois é copiado para dentro do componente.
      const country = ref('');
      const search = ref('');
      return { country, search, countries: SHORT_COUNTRIES };
    },
    template: `
      <div class="nds-stack nds-w-xs nds-min-h-100" data-spacing="sm">
        <div class="nds-cluster" data-spacing="md">
          <Button @click="country = 'brasil'">Escolher por fora</Button>
          <Button variant="outline" @click="search = 'arg'">Buscar por fora</Button>
          <Button variant="ghost" @click="country = ''; search = ''">Limpar por fora</Button>
        </div>
        <Combobox v-model="country" v-model:input-value="search">
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
        <p class="nds-text-caption nds-text-muted-foreground">
          Escolhido: <code data-testid="controlled-value">{{ country || 'nenhum' }}</code> ·
          Texto: <code data-testid="controlled-text">{{ search || 'vazio' }}</code>
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /País/i });
    const chosenValue = () => canvas.getByTestId('controlled-value');
    const inputText = () => canvas.getByTestId('controlled-text');

    // Cada passo estabelece a própria precondição: o painel Interactions
    // reexecuta a play no MESMO DOM, e o estado externo chega como a rodada
    // anterior o deixou.
    const reset = async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Limpar por fora' }));
      field.focus();
      // Abrir a lista inteira uma vez publica o RÓTULO de cada opção, e é dele
      // que o campo tira o texto quando a escolha chega de fora — o modelo
      // guarda só o valor.
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(SHORT_COUNTRIES.length);
      });
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'false');
      });
      await waitFor(async () => {
        await expect(field).toHaveValue('');
      });
    };

    await step('Escolher na lista atualiza o estado externo', async () => {
      await reset();
      await userEvent.type(field, 'chi');
      await waitFor(async () => {
        await expect(within(canvas.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
      });
      await userEvent.keyboard('{Enter}');
      // O estado externo recebe o VALOR…
      await waitFor(async () => {
        await expect(chosenValue()).toHaveTextContent('chile');
      });
      // …e o texto controlado passa a ser o RÓTULO correspondente, dos dois
      // lados: no campo e no estado de quem consome.
      await waitFor(async () => {
        await expect(field).toHaveValue('Chile');
      });
      await expect(inputText()).toHaveTextContent('Chile');
    });

    await step('Escrever no estado externo muda o que a tela mostra', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Escolher por fora' }));
      await waitFor(async () => {
        await expect(chosenValue()).toHaveTextContent('brasil');
      });
      await waitFor(async () => {
        await expect(field).toHaveValue('Brasil');
      });

      await userEvent.click(canvas.getByRole('button', { name: 'Buscar por fora' }));
      await waitFor(async () => {
        await expect(field).toHaveValue('arg');
      });
      await expect(inputText()).toHaveTextContent('arg');
    });
  },
};
