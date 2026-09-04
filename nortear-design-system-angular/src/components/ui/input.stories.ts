import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { heightResultante, fieldOf, borderContrast } from '@shared/testing/input-probe';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { inputPlaygroundSource, type InputArgs } from './input.source';
import { NdsInputDocs } from '@/components/docs/InputDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<InputArgs> = {
  title: 'Components/Form/Input',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsInput, NdsLabel] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsInputDocs) },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'Tipo HTML do campo. Atributo nativo — não há input dedicado.',
    },
    placeholder: { control: 'text', description: 'Texto de exemplo. Nunca substitui o rótulo.' },
    label: { control: 'text', description: 'Texto do rótulo associado.' },
    disabled: { control: 'boolean', description: 'Desabilita o campo.' },
    invalid: { control: 'boolean', description: 'Marca o campo como inválido via aria-invalid.' },
  },
  args: {
    type: 'email',
    placeholder: 'ex: joao@empresa.com',
    label: 'Email profissional',
    disabled: false,
    invalid: false,
  },
};

export default meta;
type Story = StoryObj<InputArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: inputPlaygroundSource } },
    // Revalidado nesta rodada. Duas declarações eram falsas e saíram daqui:
    //  · `functional.item2` (foco) — a play nunca focava nem media o halo; foi
    //    para a story `Focus`, que afere 2px e 30% de opacidade;
    //  · `accessibility.item5` (contraste) — dizia "medido pelo axe em toda
    //    story", e o axe do test-runner só olha a tela, que está sempre no tema
    //    claro. Foi para `Default`, que mede os DOIS modos e calcula a razão.
    // `functional.item6` (digitar) e `accessibility.item2` (rótulo alcança o
    // campo) entram porque esta play já os verifica de verdade.
    covers: [
      'functional.item1', 'functional.item6',
      'accessibility.item1', 'accessibility.item2',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="pg-input">{{ label }}</label>
        <input
          ndsInput
          id="pg-input"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.aria-invalid]="invalid ? 'true' : null"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('É um <input> nativo com a classe do design system', async () => {
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input.tagName).toBe('INPUT');
      await expect(input).toHaveClass(/nds-input/);
    });

    await step('A borda em repouso alcança 3:1 contra o fundo (functional.item1)', async () => {
      // WCAG 1.4.11: o fundo do campo é igual ao da página, então a borda é a
      // única coisa que identifica o campo. Antes de b149f41f eram 1.25:1.
      const contraste = borderContrast(fieldOf(canvasElement)!);
      await expect(contraste?.ratio ?? 0).toBeGreaterThanOrEqual(3);
    });

    await step('A altura nasce do respiro, não de um valor cravado', async () => {
      // WCAG 1.4.4: `height` fixa impede o campo de crescer com a fonte do
      // navegador. A tabela de tokens já ensinou `--height-input` por engano.
      const measurement = heightResultante(fieldOf(canvasElement)!);
      await expect(measurement.alturaCravada).toBe(false);
      await expect(measurement.heightCss).not.toBe('0px');
    });

    await step('O tipo escolhido chega ao DOM', async () => {
      // `type` é atributo nativo, não input do componente — se alguém
      // transformar em signal input um dia, isto acusa a mudança de contrato.
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input.type).toBe(args.type);
    });

    await step('O rótulo está associado ao campo', async () => {
      // Buscar por role+name é o que prova a associação: `for` apontando para
      // id inexistente passaria numa checagem de atributo.
      const input = canvas.getByLabelText(args.label);
      await expect(input).toBeTruthy();
    });

    if (!args.disabled) {
      await step('O campo aceita digitação', async () => {
        const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
        await userEvent.type(input, 'teste');
        await expect(input.value).toContain('teste');
      });
    }
  },
};
