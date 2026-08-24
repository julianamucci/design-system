import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_COMBOBOX } from './combobox';
import { comboboxSource } from './combobox.source';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { NdsComboboxDocs } from '@/components/docs/ComboboxDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Dados fixos ──────────────────────────────────────────────────────────────
//
// Os mesmos rótulos que a spec de exemplos fechou, e que as outras quatro
// stacks repetem. Divergir aqui é o que faz a mesma story mostrar coisas
// diferentes em cada stack — e isso só aparece tarde, na comparação final.

export const COUNTRIES = [
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

const TECHNOLOGIES = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
] as const;

/**
 * Valor escolhido, POR STORY, fora do componente.
 *
 * O Storybook recria a árvore a cada mudança de control, e um estado interno
 * nasceria limpo junto — mexer em `disabled` apagaria os chips que a pessoa
 * acabou de escolher. Guardá-lo fora também é o que o consumidor real faz: quem
 * monta o formulário é dono do valor, não o campo.
 */
const store: { playground: string | null | undefined; multiple: string[] } = {
  playground: undefined,
  multiple: ['react', 'vue'],
};

const technologyLabel = (value: string): string =>
  TECHNOLOGIES.find((item) => item.value === value)?.label ?? value;

// ─── Contraste ────────────────────────────────────────────────────────────────
//
// O axe não mede o chip contra a superfície do CAMPO: ele compara com o fundo
// que herda. E o chip pinta sobre `--input-background`, não sobre a página —
// medir contra a página superestima e deixa passar um par que na tela não
// alcança.

function luminance(color: string): number {
  const channels = (color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  const [r, g, b] = channels.map((raw) => {
    const scaled = raw / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ComboboxArgs = {
  label: string;
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
  name: string;
  onValueChange: (value: unknown) => void;
};

const meta: Meta<ComboboxArgs> = {
  title: 'UI/Combobox',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [...NDS_COMBOBOX] })],
  parameters: {
    layout: 'padded',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      page: withAutoDocsTab(NdsComboboxDocs),
      source: { transform: comboboxSource },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Rótulo visível do campo.',
      table: { type: { summary: 'string' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto exibido enquanto nada foi digitado.',
      table: { type: { summary: 'string' } },
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
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(valueChange)` ficaria ligado a nada, sem erro nenhum.
    onValueChange: { control: false, table: { disable: true } },
  },
  args: {
    label: 'País',
    placeholder: 'Buscar país',
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
    docs: {
      description: {
        story:
          'Escolha única. O modo múltiplo tem story própria: ele exige o bloco de chips ' +
          'no markup, e um interruptor aqui mudaria a composição, não só um estado.',
      },
    },
  },
  render: (args) => ({
    props: {
      ...args,
      items: COUNTRIES,
      store,
      onChange: (value: unknown) => {
        store.playground = value as string | null | undefined;
        args.onValueChange(value);
      },
    },
    template: `
      <nds-combobox
        [value]="store.playground"
        [disabled]="disabled"
        [invalid]="invalid"
        [name]="name"
        (valueChange)="onChange($event)"
      >
        <label ndsComboboxLabel>{{ label }}</label>

        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput [placeholder]="placeholder" />
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox') as HTMLInputElement;
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

      const list = await waitForPortal('listbox', { name: 'País' });
      await expect(field).toHaveAttribute('aria-expanded', 'true');

      const options = within(list).getAllByRole('option');
      await expect(options).toHaveLength(1);
      await expect(options[0]).toHaveTextContent('Brasil');
    });

    await step('A lista é anunciada como listbox', async () => {
      // O item de contrato fala dos DOIS papéis; declarar sem medir o segundo
      // deixaria o auditor mentindo com aval.
      const list = within(document.body).getByRole('listbox', { name: 'País' });
      await expect(list).toBeVisible();
    });

    await step('A opção ativa é apontada, e não focada', async () => {
      // Sem esta medida, mover o foco para a opção passaria — e a digitação
      // pararia de funcionar, que é o defeito clássico do padrão.
      const list = within(document.body).getByRole('listbox', { name: 'País' });
      const active = within(list).getAllByRole('option')[0];
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-activedescendant', active.id);
      });
      await expect(field).toHaveFocus();
    });

    await step('Enter escolhe a opção ativa', async () => {
      spy.mockClear();
      await userEvent.keyboard('{Enter}');
      await waitForPortalVanish('listbox');

      await expect(spy).toHaveBeenCalledWith('brasil');
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
      source: {
        transform: () =>
          comboboxSource('', {
            args: {
              label: 'Tecnologias',
              placeholder: 'Adicionar tecnologia',
              multiple: true,
              name: 'tecnologias',
            },
          }),
      },
      description: {
        story:
          'Modo múltiplo: cada escolhido vira um chip dentro do campo. Backspace com o ' +
          'texto vazio remove o último.',
      },
    },
  },
  args: {
    label: 'Tecnologias',
    placeholder: 'Adicionar tecnologia',
    name: 'tecnologias',
  },
  render: (args) => ({
    props: {
      ...args,
      items: TECHNOLOGIES,
      store,
      technologyLabel,
      onChange: (value: unknown) => {
        store.multiple = (value as string[]) ?? [];
        args.onValueChange(value);
      },
    },
    template: `
      <nds-combobox
        multiple
        [value]="store.multiple"
        [disabled]="disabled"
        [invalid]="invalid"
        [name]="name"
        (valueChange)="onChange($event)"
      >
        <label ndsComboboxLabel>{{ label }}</label>

        <div ndsComboboxInputWrapper>
          <div ndsComboboxChips>
            @for (chosen of store.multiple; track chosen) {
              <span ndsComboboxChip [value]="chosen">
                {{ technologyLabel(chosen) }}
                <button
                  ndsComboboxChipRemove
                  [attr.aria-label]="'Remover ' + technologyLabel(chosen)"
                ></button>
              </span>
            }
          </div>

          <input ndsComboboxInput [placeholder]="placeholder" />
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox') as HTMLInputElement;
    const spy = args.onValueChange as unknown as ReturnType<typeof fn>;
    const chips = () => canvasElement.querySelectorAll('[data-slot="combobox-chip"]');

    await step('Os escolhidos iniciais aparecem como chips', async () => {
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

    await step('Backspace com o texto vazio remove o último chip', async () => {
      // É o gesto que define o chip: sem ele, desfazer exige o mouse.
      spy.mockClear();
      field.focus();
      await userEvent.keyboard('{Backspace}');
      await expect(spy).toHaveBeenCalledWith(['react']);
      await waitFor(async () => {
        await expect(chips()).toHaveLength(1);
      });
    });

    await step('O botão de remover do chip funciona pelo clique', async () => {
      // `functional.item5` é o botão; o passo anterior cobriu o Backspace, que
      // é outro gesto para o mesmo fim. O foco continua no campo, e é isso que
      // permite escolher o próximo sem tocar no mouse de novo.
      spy.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: 'Remover React' }));
      await expect(spy).toHaveBeenCalledWith([]);
      await waitFor(async () => {
        await expect(chips()).toHaveLength(0);
      });
      await expect(field).toHaveFocus();
    });

    await step('O texto do chip alcança 4.5:1 contra a superfície do campo', async () => {
      // Medido contra `--input-background`, que é o que o chip pinta em cima —
      // medir contra a página superestima e deixa passar par que não alcança.
      await userEvent.type(field, 'react');
      await waitForPortal('listbox', { name: 'Tecnologias' });
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(chips()).toHaveLength(1);
      });

      const chip = chips()[0] as HTMLElement;
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const ratio = contrast(
        getComputedStyle(chip).color,
        getComputedStyle(wrapper).backgroundColor,
      );
      await expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    await step('Escape fecha a lista sem alterar a escolha', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('listbox');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await expect(chips()).toHaveLength(1);
    });

    await step('Escolher pelo teclado devolve o chip', async () => {
      // Devolve a story ao estado que o Chromatic fotografa, e prova a ida e a
      // volta na mesma rodada.
      await userEvent.type(field, 'vue');
      await waitForPortal('listbox', { name: 'Tecnologias' });
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(chips()).toHaveLength(2);
      });
      await expect(field).toHaveValue('');
    });
  },
};
