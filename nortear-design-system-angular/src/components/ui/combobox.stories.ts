import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_COMBOBOX } from './combobox';
import { comboboxSource } from './combobox.source';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { NdsComboboxDocs } from '@/components/docs/ComboboxDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Dados fixos ──────────────────────────────────────────────────────────────
//
// Os mesmos rótulos que a spec de exemplos fechou, e que as outras quatro
// stacks repetem. Divergir aqui é o que faz a mesma story mostrar coisas
// diferentes em cada stack — e isso só aparece tarde, na comparação final.

// Sem `export`: no CSF todo export nomeado é story, e não há `excludeStories`
// aqui. Exportada, esta lista virava uma story chamada COUNTRIES na barra
// lateral, renderizando nada — e ainda inflava a contagem da suíte em um.
const COUNTRIES = [
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
 * Valor escolhido, POR STORY, fora do componente.
 *
 * O Storybook recria a árvore a cada mudança de control, e um estado interno
 * nasceria limpo junto — mexer em `disabled` apagaria a escolha que a pessoa
 * acabou de fazer. Guardá-lo fora também é o que o consumidor real faz: quem
 * monta o formulário é dono do valor, não o campo.
 */
const store: { playground: string | null | undefined } = {
  playground: undefined,
};

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
  title: 'Primitives/Form/Combobox',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [...NDS_COMBOBOX] })],
  parameters: {
    layout: 'padded',
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
