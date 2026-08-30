import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect, waitFor } from 'storybook/test';
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
import ComboboxDocs from '@/components/docs/ComboboxDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { COUNTRIES } from './combobox.fixtures';
import { comboboxSource } from './combobox.source';

const meta = {
  title: 'Primitives/Form/Combobox',
  component: Combobox,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ComboboxDocs),
      source: { transform: comboboxSource },
      description: {
        component:
          'Campo de texto que filtra uma lista: role=combobox no próprio texto, lista com role=listbox ancorada ao campo, opção ativa apontada por aria-activedescendant. Use quando digitar chega antes de rolar, e no modo múltiplo quando os escolhidos precisam ficar à vista como chips.',
      },
    },
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo e impede a abertura da lista.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
      table: { type: { summary: 'string' } },
    },
    // Espião de evento: o control ficaria vazio e a aba Actions perderia o
    // handler. Vue não tem argTypesRegex — a entrada é declarada à mão.
    'onUpdate:modelValue': {
      control: false,
      description: 'Disparado ao trocar a escolha; recebe o valor escolhido.',
      table: { category: 'events', type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    disabled: false,
    name: 'pais',
    'onUpdate:modelValue': fn(),
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

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item6',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
    ],
  },
  render: (args) => ({
    components,
    setup() {
      const country = ref('');
      return { args, country, countries: COUNTRIES };
    },
    // A caixa da lista fica em FLUXO, abaixo do campo: a altura mínima reserva
    // espaço para ela no canvas e evita que o quadro do Chromatic mude de
    // tamanho conforme a lista abre.
    template: `
      <div class="nds-w-xs nds-min-h-100">
        <Combobox v-bind="args" v-model="country">
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /País/i });
    const spy = args['onUpdate:modelValue'] as unknown as ReturnType<typeof fn>;

    // Cada passo estabelece a própria precondição: o painel Interactions
    // reexecuta a play no MESMO DOM, sem remontar. Na segunda rodada o campo já
    // chega com texto do passo anterior, e digitar por cima daria um filtro que
    // não casa com nada — asserção invertida, suíte verde (o vitest remonta) e
    // painel vermelho.
    const reset = async () => {
      field.focus();
      await userEvent.clear(field);
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'false');
      });
    };

    const activeOption = () => field.getAttribute('aria-activedescendant');

    await step('O campo é anunciado como combobox, e nasce fechado', async () => {
      await reset();
      // O papel vai no INPUT, não num invólucro: é o que faz o leitor de tela
      // anunciar o campo como combobox e ler a opção ativa depois.
      await expect(field.tagName).toBe('INPUT');
      await expect(field).toHaveAttribute('aria-autocomplete', 'list');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(canvas.queryAllByRole('listbox')).toHaveLength(0);
    });

    await step('Digitar abre a lista e filtra as opções', async () => {
      await reset();
      await userEvent.type(field, 'bra');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      const listbox = canvas.getByRole('listbox');
      await expect(listbox).toBeVisible();
      await waitFor(async () => {
        await expect(within(listbox).getAllByRole('option')).toHaveLength(1);
      });
      await expect(within(listbox).getByRole('option')).toHaveTextContent('Brasil');
    });

    await step('A opção ativa é apontada, e não focada', async () => {
      // Sem esta medida, mover o foco para a opção passaria — e a digitação
      // pararia de funcionar, que é o defeito clássico do padrão.
      const option = canvas.getByRole('option');
      await waitFor(async () => {
        await expect(activeOption()).toBe(option.id);
      });
      await expect(field).toHaveFocus();
      await expect(field).toHaveAttribute('aria-controls', canvas.getByRole('listbox').id);
    });

    await step('A seta anda pela lista e, da última, volta à primeira', async () => {
      await reset();
      await userEvent.keyboard('{ArrowDown}');
      const listbox = await waitFor(() => canvas.getByRole('listbox'));
      const options = within(listbox).getAllByRole('option');
      await expect(options).toHaveLength(COUNTRIES.length);

      // `Home` normaliza a partida: o que a lista destaca ao abrir depende do
      // que já está escolhido, e numa reexecução isso não é a primeira opção.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(activeOption()).toBe(options[0].id);
      });
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(activeOption()).toBe(options[1].id);
      });

      // A volta é do design system: a navegação da lib para na ponta.
      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(activeOption()).toBe(options[options.length - 1].id);
      });
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(activeOption()).toBe(options[0].id);
      });
    });

    await step('Enter escolhe a opção ativa e fecha a lista', async () => {
      await reset();
      spy.mockClear();
      await userEvent.type(field, 'chi');
      await waitFor(async () => {
        await expect(within(canvas.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
      });
      await userEvent.keyboard('{Enter}');
      await expect(spy).toHaveBeenCalledWith('chile');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'false');
      });
      // O texto mostra o RÓTULO do escolhido, não o valor guardado.
      await waitFor(async () => {
        await expect(field).toHaveValue('Chile');
      });
    });

    await step('Escape fecha a lista e, já fechada, limpa o texto', async () => {
      // Duas funções na mesma tecla, e a ordem importa.
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      const callsBefore = spy.mock.calls.length;
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'false');
      });
      await expect(spy.mock.calls.length).toBe(callsBefore);
      await waitFor(async () => {
        await expect(field).toHaveValue('Chile');
      });

      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(field).toHaveValue('');
      });
    });

    await step('Lista fechada não deixa opção apontada para trás', async () => {
      // Fechar desmonta o popup e leva junto a opção destacada. A lib mantém a
      // referência antiga, e o campo passaria a apontar um id que não existe —
      // opção fantasma para quem ouve a tela. O guarda vive em
      // `ComboboxInput.vue`; esta asserção é o que o mede.
      await expect(field).not.toHaveAttribute('aria-activedescendant');
    });
  },
};
