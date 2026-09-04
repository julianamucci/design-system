import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import DocsImport from './DocsImport.svelte';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsImport; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="importacao"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta = {
  title: 'Doc Components/DocsImport',
  component: DocsImport,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: "Como trazer o componente para o projeto. Aceita até três blocos — o import principal, e dois secundários para casos como subcomponentes ou o CSS." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    description: {
      control: "text",
      description: "Opcional. Linha acima do primeiro bloco."
    },
    code: {
      control: "text",
      description: "Bloco principal."
    },
    secondaryCode: {
      control: "text",
      description: "Opcional. Segundo bloco."
    },
    secondaryDescription: {
      control: "text",
      description: "Opcional. Linha do segundo bloco."
    },
    language: {
      control: "text",
      description: "Linguagem para o realce."
    }
  },
  args: {
    title: "Importação",
    description: "O componente sai do barril de `components/ui`.",
    code: "import { Button } from '@/components/ui/button';",
    secondaryCode: "",
    secondaryDescription: "",
    language: "ts"
  },
} satisfies Meta<typeof DocsImport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Dois blocos: o segundo existe para o que acompanha o componente mas não sai do mesmo lugar — aqui, a folha de estilo. */
export const WithSecondaryBlock: Story = {
  args: {
    secondaryDescription: "A folha entra uma vez, na raiz da aplicação.",
    secondaryCode: "import '@nortear/ds-core/styles/nds/button.css';"
  },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#importacao`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#importacao');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
