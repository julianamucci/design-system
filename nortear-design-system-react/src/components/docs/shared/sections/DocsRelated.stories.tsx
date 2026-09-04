import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { DocsRelated } from "./DocsRelated";

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsRelated; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="relacionados"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta = {
  title: "Doc Components/DocsRelated",
  component: DocsRelated,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: "Componentes vizinhos, com uma linha dizendo quando escolher cada um. O `path` aponta para a docs page do irmão, e é por ele que a pessoa troca de decisão sem voltar ao menu." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    items: {
      control: "object",
      description: "Nome, descrição e caminho de cada vizinho."
    },
    componentSlug: {
      control: "text",
      description: "Opcional. Slug para o rastreio de analytics."
    }
  },
  args: {
    title: "Relacionados",
    items: [
      {
        name: "Link",
        description: "Leva a outro endereço. O navegador deixa abrir em nova aba; o botão não.",
        path: "?path=/docs/components-navigation-link--docs"
      },
      {
        name: "Toggle",
        description: "Botão que guarda estado ligado/desligado, anunciado por `aria-pressed`.",
        path: "?path=/docs/components-form-toggle--docs"
      },
      {
        name: "Badge",
        description: "Etiqueta de status. Não é clicável — quem recebe foco é o que a envolve.",
        path: "?path=/docs/components-feedback-badge--docs"
      }
    ],
    componentSlug: "button"
  },
} satisfies Meta<typeof DocsRelated>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};


/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#relacionados`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#relacionados');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
