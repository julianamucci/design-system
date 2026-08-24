import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { computed, ref } from 'vue';
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
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
import { FRUITS, TECHNOLOGIES, VEGETABLES, removeLabelOf, removedAnnouncementOf } from './combobox.fixtures';
import { comboboxGroupedSource, comboboxMultipleSource } from './combobox.source';

const meta = {
  title: 'UI/Combobox/Variants',
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
          'Múltipla escolha com chips dentro do próprio campo, e lista organizada por categoria. As duas formas partilham a mesma raiz: o que muda é o que a caixa do campo mostra e como as opções se agrupam.',
      },
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

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
      const chosen = ref<string[]>(['react', 'vue']);
      // Os chips saem do MESMO valor que a raiz guarda — não há segunda lista a
      // manter em dia. É o que a nota de ponte em `Combobox.vue` explica.
      const chips = computed(() =>
        chosen.value.flatMap((value) => TECHNOLOGIES.filter((item) => item.value === value)),
      );
      return { chosen, chips, technologies: TECHNOLOGIES, removeLabelOf, removedAnnouncementOf };
    },
    template: `
      <div class="nds-w-xs nds-min-h-90">
        <Combobox v-model="chosen" multiple name="tecnologias">
          <ComboboxLabel>Tecnologias</ComboboxLabel>
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
            </ComboboxChips>
            <ComboboxInput placeholder="Adicionar tecnologia" />
            <ComboboxTrigger aria-label="Abrir lista">
              <ComboboxIcon />
            </ComboboxTrigger>
          </ComboboxInputWrapper>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxItem
                  v-for="item in technologies"
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
    const field = canvas.getByRole('combobox', { name: /Tecnologias/i });
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
      await expect(chips()[0]).toHaveTextContent('React');
      await expect(chips()[1]).toHaveTextContent('Vue');
    });

    await step('Cada botão de remover tem nome próprio', async () => {
      // Cinco botões chamados "Remover" são indistinguíveis para quem navega
      // por lista de controles — o rótulo entra no nome.
      await expect(canvas.getByRole('button', { name: 'Remover React' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Remover Vue' })).toBeVisible();
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
      await expect(chips()[0]).toHaveTextContent('React');
      // A saída do chip não move o foco, então quem não vê a tela só recebe a
      // mudança pela região viva.
      await expect(liveRegion()).toHaveTextContent('Remover Vue');
    });

    await step('O botão de remover tira só aquele chip, e o foco fica no campo', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Remover React' }));
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
      await choose('React');
      await choose('Vue');
      await waitFor(async () => {
        await expect(chips()).toHaveLength(2);
      });
      await expect(chips()[1]).toHaveTextContent('Vue');
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
