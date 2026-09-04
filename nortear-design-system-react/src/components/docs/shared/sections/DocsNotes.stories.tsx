import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { DocsNotes } from "./DocsNotes";

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsNotes; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="notas"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta = {
  title: "Doc Components/DocsNotes",
  component: DocsNotes,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: "Notas de implementação: decisões que o código carrega e que não se leem no uso. É onde mora o porquê, e é o que evita que a próxima pessoa \"conserte\" o que estava certo." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    items: {
      control: "object",
      description: "Título e conteúdo de cada nota."
    },
    componentSlug: {
      control: "text",
      description: "Opcional. Slug para o rastreio de analytics."
    }
  },
  args: {
    title: "Notas de implementação",
    items: [
      {
        title: "Altura é resultado, não medida",
        content: "O controle não declara `height`. A altura sai de `padding-block` mais `line-height`, e é isso que o faz crescer junto com a fonte do navegador. Cravar altura reprovaria WCAG 1.4.4 a 200%."
      },
      {
        title: "A variante link não é uma caixa",
        content: "Ela zera padding e borda: é texto com afordância, não superfície. Somar o calço de altura das irmãs não a alinharia — ela mede 17,5px contra 37,5px — e só engordaria a área de clique."
      }
    ],
    componentSlug: "button"
  },
} satisfies Meta<typeof DocsNotes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};


/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#notas`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#notas');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
