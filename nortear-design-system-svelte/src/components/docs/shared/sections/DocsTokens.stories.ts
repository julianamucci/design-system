import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import DocsTokens from './DocsTokens.svelte';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsTokens; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="tokens"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta = {
  title: 'Doc Components/DocsTokens',
  component: DocsTokens,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: "Tabela dos tokens que o componente lê, com o valor e a parte que cada um pinta. É a ponte entre a folha `.nds-*` e o tema — quem troca um token aqui sabe o que muda na tela." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    cols: {
      control: "object",
      description: "Cabeçalho das três colunas."
    },
    items: {
      control: "object",
      description: "Uma entrada por token."
    },
    customizationTitle: {
      control: "text",
      description: "Opcional. Título do bloco de customização."
    },
    customizationCode: {
      control: "text",
      description: "Opcional. Snippet de sobrescrita."
    }
  },
  args: {
    title: "Tokens",
    cols: {
      token: "Token",
      value: "Valor",
      description: "Onde aparece"
    },
    items: [
      {
        token: "--primary",
        value: "hsl(var(--primary))",
        description: "Fundo da variante default."
      },
      {
        token: "--primary-foreground",
        value: "hsl(var(--primary-foreground))",
        description: "Texto e ícone sobre o fundo default."
      },
      {
        token: "--radius-button",
        value: "var(--radius-button)",
        description: "Raio do controle. Alias do componente, não a escala."
      },
      {
        token: "--ring",
        value: "hsl(var(--ring))",
        description: "Anel de foco visível."
      }
    ],
    customizationTitle: "",
    customizationCode: ""
  },
} satisfies Meta<typeof DocsTokens>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Com o bloco de customização: é ele que mostra COMO sobrescrever, e sem ele a tabela só informa que o token existe. */
export const WithCustomization: Story = {
  args: {
    customizationTitle: "Customização",
    customizationCode: ".tema-cliente {\n  --radius-button: 0;\n  --primary: 210 90% 40%;\n}"
  },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#tokens`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#tokens');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
