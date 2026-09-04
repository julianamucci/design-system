import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { DocsStates } from "./DocsStates";

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsStates; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="estados"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta = {
  title: "Doc Components/DocsStates",
  component: DocsStates,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: "Tabela de estados do componente: o que dispara cada um e como ele responde. Uma linha por estado, e a coluna de comportamento é onde o token aparece." } },
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
      description: "Uma entrada por estado."
    }
  },
  args: {
    title: "Estados",
    cols: {
      state: "Estado",
      trigger: "Gatilho",
      behavior: "Comportamento"
    },
    items: [
      {
        label: "Padrão",
        trigger: "Nenhum",
        behavior: "Fundo --primary, texto --primary-foreground."
      },
      {
        label: "Hover",
        trigger: "Ponteiro sobre o controle",
        behavior: "Fundo em --primary / 0.9."
      },
      {
        label: "Foco",
        trigger: ":focus-visible, pelo teclado",
        behavior: "Anel de 2px em --ring, afastado por offset."
      },
      {
        label: "Desabilitado",
        trigger: "disabled ou aria-disabled",
        behavior: "Opacidade 0.5 e ponteiro bloqueado."
      }
    ]
  },
} satisfies Meta<typeof DocsStates>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Um estado só. A tabela não ganha moldura diferente por ter uma linha — o cabeçalho continua, porque é ele que nomeia as colunas. */
export const SingleState: Story = {
  args: {
    items: [
      {
        label: "Padrão",
        trigger: "Nenhum",
        behavior: "Fundo --primary, texto --primary-foreground."
      }
    ]
  },
  parameters: { controls: { disable: true } },
};

/** Comportamento longo: a célula quebra em vez de esticar a tabela, e é o `overflow-x` do container que segura o resto. */
export const LongBehavior: Story = {
  args: {
    items: [
      {
        label: "Foco",
        trigger: ":focus-visible, pelo teclado",
        behavior: "Anel de 2px em --ring com 2px de offset, desenhado por box-shadow e não por outline, para acompanhar o raio do controle. Em :focus por ponteiro o anel não aparece — a distinção é de :focus-visible e existe para o clique de mouse não deixar rastro visual."
      }
    ]
  },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#estados`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#estados');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
