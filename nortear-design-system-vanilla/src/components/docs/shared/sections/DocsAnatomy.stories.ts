import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createDocsAnatomy, type DocsAnatomyProps } from './DocsAnatomy';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsAnatomy; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="anatomia"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta: Meta<DocsAnatomyProps> = {
  title: 'Doc Components/DocsAnatomy',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: "As partes do componente, em lista, mais a árvore de estrutura como código copiável. A lista nomeia cada peça; a árvore mostra como elas se encaixam." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    items: {
      control: "object",
      description: "Uma linha por parte do componente."
    },
    structureCode: {
      control: "text",
      description: "Árvore da estrutura, em texto."
    },
    structureLabel: {
      control: "text",
      description: "Rótulo acima do bloco de código."
    },
    language: {
      control: "text",
      description: "Linguagem para o realce do bloco."
    }
  },
  args: {
    title: "Anatomia",
    items: [
      "Raiz — o `<button>`, que carrega variante, tamanho e estado.",
      "Ícone à esquerda — opcional, decorativo, fora da árvore de acessibilidade.",
      "Rótulo — o texto que nomeia a ação. É ele que o leitor de tela anuncia.",
      "Ícone à direita — opcional, mesmo tratamento do da esquerda."
    ],
    structureCode: "<button class=\"nds-button nds-button-default\">\n  <svg class=\"nds-button-icon-svg\" aria-hidden=\"true\" />\n  Salvar\n</button>",
    structureLabel: "Estrutura",
    language: "html"
  },
  render: (args) => createDocsAnatomy(args),
};

export default meta;
type Story = StoryObj<DocsAnatomyProps>;

export const Playground: Story = {};


/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#anatomia`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#anatomia');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
