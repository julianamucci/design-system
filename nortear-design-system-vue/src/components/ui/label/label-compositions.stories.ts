import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Label } from './index';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  labelComCaixaDeSelecaoSource,
  labelComCampoSource,
  labelObrigatorioSource,
} from './label.source';

const meta = {
  title: 'UI/Label/Compositions',
  component: Label,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: labelComCampoSource },
      description: {
        component:
          'Composições do rótulo com outros elementos de formulário: campo de texto, caixa de seleção e campo obrigatório.',
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <Label for="comp-input">Telefone</Label>
        <Input id="comp-input" type="tel" placeholder="(11) 99999-9999" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Telefone');
    const input = canvasElement.querySelector<HTMLInputElement>('#comp-input')!;

    await step('O campo é alcançável pelo texto do rótulo', async () => {
      await expect(canvas.getByLabelText('Telefone')).toBe(input);
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      input.blur();
      await expect(input).not.toHaveFocus();
      await userEvent.click(label);
      await expect(input).toHaveFocus();
    });
  },
};

export const WithCheckbox: Story = {
  // A ordem se inverte e o bloco deita: o controle vem antes do texto, que é a
  // forma que a caixa pede. A do `meta` empilha rótulo em cima do campo.
  parameters: { docs: { source: { transform: labelComCaixaDeSelecaoSource } } },
  render: () => ({
    components: { Label, Checkbox },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="comp-checkbox" />
        <Label for="comp-checkbox">Concordo com os termos de uso</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Concordo com os termos de uso');
    const checkbox = canvas.getByRole('checkbox');

    await step('A caixa recebe o nome acessível do rótulo', async () => {
      await expect(checkbox).toHaveAccessibleName('Concordo com os termos de uso');
    });

    await step('Clicar no rótulo foca a caixa E alterna o estado', async () => {
      // Par idempotente: o painel Interactions reexecuta no mesmo DOM, e sem
      // desmarcar antes a segunda rodada partiria de "marcada" e inverteria o
      // resultado.
      if (checkbox.getAttribute('aria-checked') === 'true') await userEvent.click(label);
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
      // O foco é o segundo eixo, e é o que nenhuma das cinco stacks verificava:
      // `for` só alcança controle rotulável, e sem isso o rótulo não leva o foco.
      (checkbox as HTMLElement).blur();
      await expect(checkbox).not.toHaveFocus();
      await userEvent.click(label);
      await expect(checkbox).toHaveFocus();
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const RequiredField: Story = {
  name: 'With required input',
  // O asterisco decorativo dentro do rótulo mais o `aria-required` no controle:
  // o par não existe na marcação do `meta`.
  parameters: { docs: { source: { transform: labelObrigatorioSource } } },
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <Label for="comp-required">
          Email profissional
          <span class="nds-text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input id="comp-required" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    const marcador = canvasElement.querySelector<HTMLElement>('.nds-text-destructive')!;

    await step('O asterisco é decorativo', async () => {
      await expect(marcador).toHaveAttribute('aria-hidden', 'true');
      await expect(marcador.textContent?.trim()).toBe('*');
    });

    await step('O nome acessível do campo não carrega o asterisco', async () => {
      // É o que `aria-hidden` no marcador compra: o leitor anuncia o rótulo, e
      // a obrigatoriedade vem do `aria-required`, não de um "asterisco" falado.
      await expect(input).toHaveAccessibleName('Email profissional');
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
