import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { computed, ref } from 'vue';
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxSeparator,
  ComboboxTrigger,
} from './index';
import { backgroundEffective, noTransicao, ratio } from '@shared/testing/cor';
import {
  COUNTRIES,
  FRUITS,
  SHORT_COUNTRIES,
  VEGETABLES,
  removeLabelOf,
  removedAnnouncementOf,
} from './combobox.fixtures';
import {
  comboboxGroupedSource,
  comboboxMultipleSource,
  comboboxSingleLineSource,
  comboboxSource,
} from './combobox.source';

const meta = {
  title: 'Components/Form/Combobox/Variants',
  component: Combobox,
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: comboboxMultipleSource },
      description: {
        component:
          'Escolha única com a lista aberta, múltipla escolha com chips dentro do próprio campo e lista organizada por categoria. As formas partilham a mesma raiz: o que muda é o que a caixa do campo mostra e como as opções se agrupam.',
      },
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenWithActiveOption: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: comboboxSource },
      description: {
        story:
          'Lista aberta, ancorada ao campo. A opção ativa é apontada por aria-activedescendant e realçada por data-highlighted — nenhuma opção recebe foco do navegador.',
      },
    },
  },
  render: () => ({
    components: {
      Combobox,
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
      return { country, countries: SHORT_COUNTRIES };
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
      await expect(within(listbox).getAllByRole('option')).toHaveLength(SHORT_COUNTRIES.length);
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

export const MultipleWithChips: Story = {
  parameters: {
    covers: [
      'functional.item4',
      'functional.item5',
      'accessibility.item5',
      'accessibility.item6',
      'visual.item2',
    ],
    docs: {
      source: { transform: comboboxMultipleSource },
      description: {
        story:
          'Cada escolhido vira um chip dentro do campo, com botão de remover de nome próprio. Backspace com o texto vazio tira o último.',
      },
    },
  },
  render: () => ({
    components: {
      Combobox,
      ComboboxChip,
      ComboboxChipRemove,
      ComboboxChips,
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
      const chosen = ref<string[]>(['brasil', 'argentina']);
      // Os chips saem do MESMO valor que a raiz guarda — não há segunda lista a
      // manter em dia. É o que a nota de ponte em `Combobox.vue` explica.
      const chips = computed(() =>
        chosen.value.flatMap((value) => COUNTRIES.filter((item) => item.value === value)),
      );
      return { chosen, chips, countries: COUNTRIES, removeLabelOf, removedAnnouncementOf };
    },
    template: `
      <div class="nds-w-xs nds-min-h-90">
        <Combobox v-model="chosen" multiple name="paises">
          <ComboboxLabel>Países</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxChips>
              <ComboboxChip
                v-for="item in chips"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
                <ComboboxChipRemove :aria-label="removeLabelOf(item.label)" :removed-announcement="removedAnnouncementOf(item.label)" />
              </ComboboxChip>
              <!-- O texto mora DENTRO da caixa de chips: é ela que quebra ou
                   rola. Limpar e gatilho ficam de fora, na primeira linha. -->
              <ComboboxInput placeholder="Adicionar país" />
            </ComboboxChips>
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
    const field = canvas.getByRole('combobox', { name: /Países/i });
    const chips = () =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]'));
    // A região viva do CAMPO, e não qualquer `role="status"`: a mensagem de
    // lista vazia também é uma, e com a lista aberta as duas convivem.
    const liveRegion = () =>
      canvasElement.querySelector('[data-slot="combobox-input-wrapper"] > [role="status"]');

    // Precondição de todo passo, e o que o último passo devolve: a story é
    // reexecutada no MESMO DOM pelo painel Interactions.
    const choose = async (label: string) => {
      field.focus();
      await userEvent.type(field, label);
      await waitFor(async () => {
        await expect(within(canvas.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
      });
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(field).toHaveValue('');
      });
    };

    await step('Os escolhidos aparecem como chips dentro do campo', async () => {
      await waitFor(async () => {
        await expect(chips()).toHaveLength(2);
      });
      await expect(chips()[0]).toHaveTextContent('Brasil');
      await expect(chips()[1]).toHaveTextContent('Argentina');
    });

    await step('Cada botão de remover tem nome próprio', async () => {
      // Cinco botões chamados "Remover" são indistinguíveis para quem navega
      // por lista de controles — o rótulo entra no nome.
      await expect(canvas.getByRole('button', { name: 'Remover Brasil' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Remover Argentina' })).toBeVisible();
    });

    await step('O texto do chip mantém contraste sobre a superfície do campo', async () => {
      // O chip pinta a própria superfície dentro do campo, então a medida é
      // contra ELA — medir contra o fundo da página daria um número que a tela
      // não mostra em lugar nenhum.
      const chip = chips()[0];
      const measured = noTransicao(chip, () => {
        const background = backgroundEffective(chip);
        return background ? ratio(getComputedStyle(chip).color, background) : null;
      });
      await expect(measured).not.toBeNull();
      await expect(measured!.ratio).toBeGreaterThanOrEqual(4.5);
    });

    await step('Backspace com o texto vazio remove o último chip', async () => {
      // É o gesto que define o chip: sem ele, desfazer exige o mouse.
      field.focus();
      await userEvent.clear(field);
      await userEvent.keyboard('{Backspace}');
      await waitFor(async () => {
        await expect(chips()).toHaveLength(1);
      });
      await expect(chips()[0]).toHaveTextContent('Brasil');
      // A saída do chip não move o foco, então quem não vê a tela só recebe a
      // mudança pela região viva.
      await expect(liveRegion()).toHaveTextContent('Remover Argentina');
    });

    await step('O botão de remover tira só aquele chip, e o foco fica no campo', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Remover Brasil' }));
      await waitFor(async () => {
        await expect(chips()).toHaveLength(0);
      });
      await waitFor(async () => {
        await expect(field).toHaveFocus();
      });
    });

    await step('Escolher pelo teclado devolve os dois chips', async () => {
      // Devolve a story ao estado que o Chromatic fotografa, e prova a ida e a
      // volta na mesma rodada.
      await choose('Brasil');
      await choose('Argentina');
      await waitFor(async () => {
        await expect(chips()).toHaveLength(2);
      });
      await expect(chips()[1]).toHaveTextContent('Argentina');
    });
  },
};

export const Grouped: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: comboboxGroupedSource },
      description: {
        story:
          'Opções organizadas por categoria: cada grupo carrega o próprio cabeçalho, e o divisor separa os blocos para o olho sem falar com o leitor de tela.',
      },
    },
  },
  render: () => ({
    components: {
      Combobox,
      ComboboxEmpty,
      ComboboxGroup,
      ComboboxGroupLabel,
      ComboboxIcon,
      ComboboxInput,
      ComboboxInputWrapper,
      ComboboxItem,
      ComboboxItemIndicator,
      ComboboxLabel,
      ComboboxList,
      ComboboxPopup,
      ComboboxPositioner,
      ComboboxSeparator,
      ComboboxTrigger,
    },
    setup() {
      const ingredient = ref('');
      return { ingredient, fruits: FRUITS, vegetables: VEGETABLES };
    },
    template: `
      <div class="nds-w-xs nds-min-h-100">
        <Combobox v-model="ingredient" :default-open="true">
          <ComboboxLabel>Ingrediente</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxInput placeholder="Buscar ingrediente" />
            <ComboboxTrigger aria-label="Abrir lista">
              <ComboboxIcon />
            </ComboboxTrigger>
          </ComboboxInputWrapper>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxGroup>
                  <ComboboxGroupLabel>Frutas</ComboboxGroupLabel>
                  <ComboboxItem
                    v-for="item in fruits"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                </ComboboxGroup>
                <ComboboxSeparator />
                <ComboboxGroup>
                  <ComboboxGroupLabel>Legumes</ComboboxGroupLabel>
                  <ComboboxItem
                    v-for="item in vegetables"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                </ComboboxGroup>
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

    await step('Cada grupo é anunciado pelo próprio cabeçalho', async () => {
      const groups = await waitFor(() => canvas.getAllByRole('group'));
      await expect(groups).toHaveLength(2);
      // O cabeçalho nomeia o grupo por referência, e não por proximidade
      // visual: sem o par `aria-labelledby` / `id` o grupo entra anônimo na
      // árvore de acessibilidade.
      for (const group of groups) {
        const labelId = group.getAttribute('aria-labelledby');
        await expect(labelId).toBeTruthy();
        await expect(canvasElement.ownerDocument.getElementById(labelId!)).not.toBeNull();
      }
      await expect(groups[0]).toHaveTextContent('Frutas');
      await expect(groups[1]).toHaveTextContent('Legumes');
    });

    await step('O divisor é linha para o olho e silêncio para o leitor de tela', async () => {
      const separator = canvasElement.querySelector('[data-slot="combobox-separator"]');
      await expect(separator).not.toBeNull();
      await expect(separator).toHaveAttribute('aria-hidden', 'true');
    });

    await step('As opções dos dois grupos estão na mesma lista', async () => {
      const listbox = canvas.getByRole('listbox');
      await expect(within(listbox).getAllByRole('option')).toHaveLength(
        FRUITS.length + VEGETABLES.length,
      );
    });
  },
};

/* Os cinco primeiros países: chips de sobra para transbordar um campo estreito. */
const SINGLE_LINE_CHOSEN = COUNTRIES.slice(0, 5).map((item) => item.value);

export const SingleLineChips: Story = {
  parameters: {
    docs: {
      source: { transform: comboboxSingleLineSource },
      description: {
        story:
          'Chips numa linha só: a caixa que os guarda rola na horizontal em vez de acumular linhas, e o campo mantém a altura. Limpar e abrir moram fora dessa caixa, e por isso continuam na primeira linha mesmo com os chips transbordando.',
      },
    },
  },
  render: () => ({
    components: {
      Combobox,
      ComboboxChip,
      ComboboxChipRemove,
      ComboboxChips,
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
      // Cópia da lista fixa: o `ref` é gravado ao remover um chip, e escrever
      // na constante do módulo faria a próxima montagem nascer com o resultado
      // da anterior.
      const chosen = ref<string[]>([...SINGLE_LINE_CHOSEN]);
      const chips = computed(() =>
        chosen.value.flatMap((value) => COUNTRIES.filter((item) => item.value === value)),
      );
      return { chosen, chips, countries: COUNTRIES, removeLabelOf, removedAnnouncementOf };
    },
    template: `
      <div class="nds-w-xs nds-min-h-90">
        <Combobox v-model="chosen" multiple chips-layout="single-line" name="paises">
          <ComboboxLabel>Países</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxChips>
              <ComboboxChip
                v-for="item in chips"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
                <ComboboxChipRemove :aria-label="removeLabelOf(item.label)" :removed-announcement="removedAnnouncementOf(item.label)" />
              </ComboboxChip>
              <ComboboxInput placeholder="Adicionar país" />
            </ComboboxChips>
            <!-- Limpar e gatilho são IRMÃOS da caixa de chips, nunca filhos:
                 é o que os mantém fora do que rola. -->
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
    const wrapper = canvasElement.querySelector<HTMLElement>(
      '[data-slot="combobox-input-wrapper"]',
    )!;
    const chipsBox = canvasElement.querySelector<HTMLElement>('[data-slot="combobox-chips"]')!;
    const chips = () =>
      Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]'));

    // Meia diferença de altura entre um chip e um botão do campo, alinhados ao
    // centro. Uma linha PERDIDA custaria a altura inteira de um chip — muitas
    // vezes isto —, então a folga não afrouxa a medida.
    const TOLERANCE_PX = 6;

    await step('A escolha de linha única chega ao elemento que a folha consulta', async () => {
      // A prop mora na RAIZ e desce pelo contexto; o atributo é o que a folha
      // lê. Sem ele, a regra de rolagem horizontal não casa com nada.
      await expect(wrapper).toHaveAttribute('data-chips', 'single-line');
    });

    await step('Os chips transbordam e mesmo assim ficam todos na mesma linha', async () => {
      await waitFor(async () => {
        await expect(chips()).toHaveLength(SINGLE_LINE_CHOSEN.length);
      });
      // Sem transbordo a asserção seguinte seria vazia: uma linha só é o que
      // qualquer layout faria com chips que cabem.
      await expect(chipsBox.scrollWidth).toBeGreaterThan(chipsBox.clientWidth);
      const first = chips()[0].getBoundingClientRect().top;
      for (const chip of chips()) {
        await expect(Math.abs(chip.getBoundingClientRect().top - first)).toBeLessThanOrEqual(1);
      }
    });

    await step('Limpar e abrir continuam na primeira linha', async () => {
      // Era este o defeito: com chips e controles no MESMO flex que quebra,
      // quem sobrava caía para a linha de baixo. Sem esta medida, apagar a
      // regra de layout mantém tudo verde.
      const first = chips()[0].getBoundingClientRect().top;
      const clear = canvas.getByRole('button', { name: 'Limpar' });
      const trigger = canvas.getByRole('button', { name: 'Abrir lista' });
      await expect(
        Math.abs(clear.getBoundingClientRect().top - first),
      ).toBeLessThanOrEqual(TOLERANCE_PX);
      await expect(
        Math.abs(trigger.getBoundingClientRect().top - first),
      ).toBeLessThanOrEqual(TOLERANCE_PX);
    });
  },
};
