import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect, waitFor } from 'storybook/test';
import { createCombobox, type ComboboxItem } from './combobox';
import { comboboxSource } from './combobox.source';

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

const TECNOLOGIAS: ComboboxItem[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
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
  multiple: ['react', 'vue'],
};

// ─── Contraste ────────────────────────────────────────────────────────────────
//
// O axe não mede o chip contra a superfície do CAMPO: ele compara com o fundo
// que herda. E o chip pinta sobre `--input-background`, não sobre a página —
// medir contra a página superestima e deixa passar um par que na tela não
// alcança.

function luminance(color: string): number {
  const channels = (color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  const [r, g, b] = channels.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ComboboxArgs = {
  label: string;
  placeholder: string;
  multiple: boolean;
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
    docs: { source: { transform: comboboxSource } },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Rótulo visível do field.',
      table: { type: { summary: 'string' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto exibido enquanto o field está emptyEl.',
      table: { type: { summary: 'string' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Modo múltiplo: os escolhidos viram chips dentro do field.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o field e impede a abertura da list.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Marca o field como inválido e pinta a borda de erro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'Nome do field no formulário.',
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

    await step('O field é anunciado como combobox fechado', async () => {
      // `role` no INPUT, não num wrapper: é o que faz o leitor de tela anunciar
      // o campo como combobox e ler a opção ativa depois.
      await expect(field.tagName).toBe('INPUT');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Digitar abre a list e filtra', async () => {
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

// ─── Múltiplo com chips ───────────────────────────────────────────────────────

export const MultipleWithChips: Story = {
  parameters: {
    covers: [
      'functional.item4',
      'functional.item5',
      'functional.item6',
      'accessibility.item5',
      'accessibility.item6',
      'visual.item2',
    ],
    docs: {
      description: {
        story:
          'Modo múltiplo: cada escolhido vira um chip dentro do field. Backspace com o textEl emptyEl remove o último.',
      },
    },
  },
  args: {
    label: 'Tecnologias',
    placeholder: 'Adicionar tecnologia',
    multiple: true,
    name: 'tecnologias',
  },
  render: (args) =>
    createCombobox({
      items: TECNOLOGIAS,
      label: args.label,
      placeholder: args.placeholder,
      // `multiple` fica fixo: é o assunto da story, e um control que a
      // desligasse deixaria a story sem o que demonstrar.
      multiple: true,
      // Estes vinham do `meta` e NÃO eram repassados: o painel mostrava
      // interruptores ligados a nada. Controle que não faz nada é pior que
      // controle ausente, porque a pessoa conclui que o componente é que não
      // responde.
      disabled: args.disabled,
      invalid: args.invalid,
      name: args.name,
      defaultValue: valueByStory.multiple,
      onValueChange: (value) => {
        valueByStory.multiple = value;
        args.onValueChange(value);
      },
    }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const spy = args.onValueChange as unknown as ReturnType<typeof fn>;
    const chips = () =>
      canvasElement.querySelectorAll('[data-slot="combobox-chip"]');

    await step('Os escolhidos iniciais aparecem como chips', async () => {
      await expect(chips()).toHaveLength(2);
      await expect(chips()[0]).toHaveTextContent('React');
      await expect(chips()[1]).toHaveTextContent('Vue');
    });

    await step('Cada botão de removeButton tem nome próprio', async () => {
      // Cinco botões chamados "Remover" são indistinguíveis para quem navega
      // por lista de controles — o rótulo entra no nome.
      await expect(canvas.getByRole('button', { name: 'Remover React' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Remover Vue' })).toBeVisible();
    });

    await step('Backspace com o textEl emptyEl remove o último chip', async () => {
      // É o gesto que define o chip: sem ele, desfazer exige o mouse.
      spy.mockClear();
      field.focus();
      await userEvent.keyboard('{Backspace}');
      await expect(spy).toHaveBeenCalledWith(['react']);
      await expect(chips()).toHaveLength(1);
    });

    await step('O botão de remover do chip funciona pelo clique', async () => {
      // `functional.item5` é o botão; o passo anterior cobriu o Backspace, que
      // é outro gesto para o mesmo fim.
      spy.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: 'Remover React' }));
      await expect(spy).toHaveBeenCalledWith([]);
      await expect(chips()).toHaveLength(0);
    });

    await step('O texto do chip alcança 4.5:1 contra a superfície do campo', async () => {
      // Medido contra `--input-background`, que é o que o chip pinta em cima —
      // medir contra a página superestima e deixa passar par que não alcança.
      await userEvent.type(field, 'react');
      await userEvent.keyboard('{Enter}');
      const chip = chips()[0] as HTMLElement;
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const razao = contrast(
        getComputedStyle(chip).color,
        getComputedStyle(wrapper).backgroundColor,
      );
      await expect(razao).toBeGreaterThanOrEqual(4.5);
    });

    await step('Escape fecha a lista sem alterar a escolha', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Escolher pelo teclado devolve o chip', async () => {
      // Devolve a story ao estado que o Chromatic fotografa, e prova a ida e a
      // volta na mesma rodada.
      await userEvent.type(field, 'vue');
      await userEvent.keyboard('{Enter}');
      await expect(chips()).toHaveLength(2);
      await expect(field).toHaveValue('');
    });
  },
};
