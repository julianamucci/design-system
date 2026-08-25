import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect, waitFor } from 'storybook/test';
import { createCombobox, type ComboboxChipsLayout, type ComboboxItem } from './combobox';
import { comboboxSource } from './combobox.source';
import { createComboboxDocs } from '@/components/docs/ComboboxDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Dados fixos ──────────────────────────────────────────────────────────────
//
// Os mesmos rótulos que a spec de exemplos fechou, e que as outras quatro
// stacks vão repetir. Divergir aqui é o que faz a mesma story mostrar coisas
// diferentes em cada stack — e isso só aparece tarde, na comparação final.

const PAISES: ComboboxItem[] = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'colombia', label: 'Colômbia' },
  { value: 'mexico', label: 'México' },
  { value: 'peru', label: 'Peru' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'espanha', label: 'Espanha' },
  { value: 'uruguai', label: 'Uruguai' },
];

/**
 * Valor escolhido, POR STORY, fora da fábrica.
 *
 * Storybook re-executa o `render` a cada mudança de control, e a fábrica é
 * recriada com o closure limpo. Sem guardar o valor aqui, mexer em `disabled`
 * apagaria os chips que a pessoa acabou de escolher — que foi exatamente o
 * relato. Guardá-lo fora também é o que o consumidor real faz: quem monta o
 * formulário é dono do valor, não o campo.
 */
const valueByStory: Record<string, string[]> = {
  playground: [],
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ComboboxArgs = {
  label: string;
  placeholder: string;
  multiple: boolean;
  chipsLayout: ComboboxChipsLayout;
  disabled: boolean;
  invalid: boolean;
  name: string;
  onValueChange: (value: string[]) => void;
};

const meta: Meta<ComboboxArgs> = {
  title: 'UI/Combobox',
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createComboboxDocs), source: { transform: comboboxSource } },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Rótulo visível do campo.',
      table: { type: { summary: 'string' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto exibido enquanto o campo está vazio.',
      table: { type: { summary: 'string' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Modo múltiplo: os escolhidos viram chips dentro do campo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    chipsLayout: {
      control: 'inline-radio',
      options: ['wrap', 'single-line'],
      description:
        'Como os chips ocupam o campo: em linhas que se acumulam ou numa linha só que rola na horizontal. Limpar e abrir ficam na primeira linha nos dois casos.',
      table: {
        type: { summary: "'wrap' | 'single-line'" },
        defaultValue: { summary: "'wrap'" },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo e impede a abertura da lista.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Marca o campo como inválido e pinta a borda de erro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário.',
      table: { type: { summary: 'string' } },
    },
    onValueChange: {
      action: 'valueChange',
      description: 'Callback de mudança da escolha.',
      table: { type: { summary: '(value: string[]) => void' } },
    },
  },
  args: {
    label: 'País',
    placeholder: 'Buscar país',
    multiple: false,
    chipsLayout: 'wrap',
    disabled: false,
    invalid: false,
    name: 'pais',
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ComboboxArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'visual.item1',
    ],
  },
  render: (args) =>
    createCombobox({
      items: PAISES,
      label: args.label,
      placeholder: args.placeholder,
      multiple: args.multiple,
      chipsLayout: args.chipsLayout,
      disabled: args.disabled,
      invalid: args.invalid,
      name: args.name,
      defaultValue: valueByStory.playground,
      onValueChange: (value) => {
        valueByStory.playground = value;
        args.onValueChange(value);
      },
    }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const spy = args.onValueChange as unknown as ReturnType<typeof fn>;

    await step('O campo é anunciado como combobox fechado', async () => {
      // `role` no INPUT, não num wrapper: é o que faz o leitor de tela anunciar
      // o campo como combobox e ler a opção ativa depois.
      await expect(field.tagName).toBe('INPUT');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Digitar abre a lista e filtra', async () => {
      // `clear` e não `click`: o painel Interactions reexecuta a play no MESMO
      // DOM, sem remontar. Na segunda rodada o campo já traz "Brasil" do último
      // passo, e digitar por cima daria "Brasilbra" — filtro vazio, asserção
      // invertida, suíte verde (o vitest remonta) e painel vermelho.
      await userEvent.clear(field);
      await userEvent.type(field, 'bra');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      const optionEls = canvas.getAllByRole('option');
      await expect(optionEls).toHaveLength(1);
      await expect(optionEls[0]).toHaveTextContent('Brasil');
    });

    await step('A lista é anunciada como listbox', async () => {
      // O item de contrato fala dos DOIS papéis; declarar sem medir o segundo
      // deixaria o auditor mentindo com aval.
      await expect(canvas.getByRole('listbox')).toBeVisible();
    });

    await step('A opção ativa é apontada, e não focada', async () => {
      // Sem esta medida, mover o foco para a opção passaria — e a digitação
      // pararia de funcionar, que é o defeito clássico do padrão.
      const activeIndex = canvas.getAllByRole('option')[0];
      await expect(field).toHaveAttribute('aria-activedescendant', activeIndex.id);
      await expect(field).toHaveFocus();
    });

    await step('Enter escolhe a opção ativa', async () => {
      spy.mockClear();
      await userEvent.keyboard('{Enter}');
      await expect(spy).toHaveBeenCalledWith(['brasil']);
      await expect(field).toHaveValue('Brasil');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
