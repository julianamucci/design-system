import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { heightResultante, fieldOf } from '@shared/testing/input-probe';
import { Input } from './index';
import {
  inputTypeFileSource,
  inputTypeSearchSource,
  inputTypeEmailSource,
  inputTypeNumberSource,
  inputTypeSenhaSource,
  inputTypeTextSource,
} from './input.source';

const meta = {
  title: 'UI/Input/Types',
  component: Input,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inputTypeTextSource },
      description: {
        component:
          'O Input não tem variantes via prop — a aparência e o comportamento mudam conforme o atributo `type` HTML. Use sempre o tipo semântico correto para cada campo.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => ({
    components: { Input },
    template: '<div class="nds-w-xs"><Input type="text" placeholder="ex: João da Silva" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input type=text está renderizado', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('type', 'text');
    });
  },
};

export const Email: Story = {
  // Cada tipo troca teclado, papel implícito e validação nativa: é o atributo
  // inteiro do exemplo, e a do `meta` mostra o tipo de texto.
  parameters: { docs: { source: { transform: inputTypeEmailSource } } },
  render: () => ({
    components: { Input },
    template: '<div class="nds-w-xs"><Input type="email" placeholder="ex: joao@empresa.com" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    await step('Input type=email está renderizado', async () => {
      const input = canvasElement.querySelector('input[type="email"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('type', 'email');
    });
  },
};

export const Password: Story = {
  // O tipo é o assunto: aqui ele muda o mascaramento e o gerenciador de senhas.
  parameters: { docs: { source: { transform: inputTypeSenhaSource } } },
  render: () => ({
    components: { Input },
    template: '<div class="nds-w-xs"><Input type="password" placeholder="••••••••" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    await step('Input type=password está renderizado', async () => {
      const input = canvasElement.querySelector('input[type="password"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('type', 'password');
    });
  },
};

export const Number: Story = {
  // O tipo é o assunto: aqui ele muda o teclado e traz os incrementos nativos.
  parameters: { docs: { source: { transform: inputTypeNumberSource } } },
  render: () => ({
    components: { Input },
    template: '<div class="nds-w-xs"><Input type="number" placeholder="ex: 42" /></div>',
  }),
  play: async ({ canvasElement, step }) => {
    await step('Input type=number está renderizado', async () => {
      const input = canvasElement.querySelector('input[type="number"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('type', 'number');
    });
  },
};

/**
 * `type="search"` não tinha story em stack nenhuma — e é um dos tipos que a
 * seção Variantes documenta e que o contrato pede em `visual.item3`.
 */
export const Search: Story = {
  parameters: {
    covers: ['visual.item3'],
    // O tipo troca o papel implícito para searchbox — nada no visual denuncia
    // se estiver errado, então o snippet precisa mostrá-lo.
    docs: { source: { transform: inputTypeSearchSource } },
  },
  render: () => ({
    components: { Input },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <label for="tipo-search" class="nds-text-body nds-font-medium">Buscar</label>
        <Input id="tipo-search" type="search" placeholder="Buscar componentes..." />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O campo de busca é anunciado como busca, não como texto', async () => {
      // `type="search"` muda o papel implícito para searchbox — é o que o
      // leitor de tela anuncia, e nada no visual denuncia se estiver errado.
      const input = canvas.getByRole('searchbox', { name: 'Buscar' });
      await expect(input).toHaveAttribute('type', 'search');
    });

    await step('Aceita digitação', async () => {
      const input = canvas.getByRole('searchbox', { name: 'Buscar' });
      await userEvent.clear(input);
      await userEvent.type(input, 'Button');
      await expect(input).toHaveValue('Button');
      await userEvent.clear(input);
    });
  },
};

export const File: Story = {
  parameters: {
    covers: ['functional.item5'],
    // Único tipo sem marcador de exemplo: quem desenha o miolo é o navegador.
    docs: { source: { transform: inputTypeFileSource } },
  },
  render: () => ({
    components: { Input },
    template: `
      <div class="nds-stack nds-w-xs" data-spacing="xs">
        <label for="tipo-file" class="nds-text-body nds-font-medium">Arquivo</label>
        <Input id="tipo-file" type="file" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input type file está presente e rotulado', async () => {
      const input = canvas.getByLabelText('Arquivo');
      await expect(input).toHaveAttribute('type', 'file');
    });

    await step('O botão nativo recebe estilo próprio do design system', async () => {
      // `::file-selector-button` é a única parte do campo que o navegador
      // desenha sozinho; sem a regra do design system ele sai com o cinza do
      // sistema operacional e o exemplo mente sobre o resultado.
      const botao = getComputedStyle(fieldOf(canvasElement)!, '::file-selector-button');
      await expect(botao.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      await expect(parseFloat(botao.borderTopLeftRadius)).toBeGreaterThan(0);
    });

    await step('A altura continua saindo do respiro, não de um valor cravado', async () => {
      const medida = heightResultante(fieldOf(canvasElement)!);
      await expect(medida.alturaCravada).toBe(false);
      await expect(parseFloat(medida.paddingBloco[0])).toBeGreaterThan(0);
    });
  },
};
