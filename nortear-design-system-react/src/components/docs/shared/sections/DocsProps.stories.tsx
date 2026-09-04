import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { DocsProps } from "./DocsProps";

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsProps; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="propriedades"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta = {
  title: "Doc Components/DocsProps",
  component: DocsProps,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: "Tabelas de propriedades, uma por grupo, mais a interface em código e o bloco de extensibilidade. A descrição é neutra de API de propósito: o mesmo texto serve às cinco stacks, e o nome da prop é que muda." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    tables: {
      control: "object",
      description: "Uma tabela por grupo de propriedades."
    },
    interfaceCode: {
      control: "text",
      description: "Opcional. A interface, em código."
    },
    extensibilityTitle: {
      control: "text",
      description: "Opcional. Título do bloco de extensibilidade."
    },
    extensibilityNotes: {
      control: "text",
      description: "Opcional. O que o componente repassa ao elemento raiz."
    }
  },
  args: {
    title: "Propriedades",
    tables: [
      {
        title: "",
        cols: {
          prop: "Prop",
          type: "Tipo",
          default: "Padrão",
          required: "Obrigatória",
          description: "Descrição"
        },
        items: [
          {
            name: "variant",
            type: "'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'",
            defaultValue: "'default'",
            required: "Não",
            description: "Peso visual da ação."
          },
          {
            name: "size",
            type: "'xs' | 'sm' | 'default' | 'lg' | 'icon-*'",
            defaultValue: "'default'",
            required: "Não",
            description: "Altura e espaçamento. Os `icon-*` são quadrados e não têm rótulo."
          },
          {
            name: "disabled",
            type: "boolean",
            defaultValue: "false",
            required: "Não",
            description: "Tira o controle da ordem de foco e bloqueia o ponteiro."
          }
        ]
      }
    ],
    interfaceCode: "",
    extensibilityTitle: "Extensibilidade",
    extensibilityNotes: "O que não estiver na tabela é repassado ao elemento raiz — `id`, `aria-*`, `data-*` e manipuladores de evento."
  },
} satisfies Meta<typeof DocsProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Dois grupos: cada tabela ganha o próprio título, e é assim que raiz e subcomponente ficam separados sem virar duas seções. */
export const TwoTables: Story = {
  args: {
    tables: [
      {
        title: "Raiz",
        cols: {
          prop: "Prop",
          type: "Tipo",
          default: "Padrão",
          required: "Obrigatória",
          description: "Descrição"
        },
        items: [
          {
            name: "variant",
            type: "string",
            defaultValue: "'default'",
            required: "Não",
            description: "Peso visual da ação."
          }
        ]
      },
      {
        title: "Ícone",
        cols: {
          prop: "Prop",
          type: "Tipo",
          default: "Padrão",
          required: "Obrigatória",
          description: "Descrição"
        },
        items: [
          {
            name: "size",
            type: "'sm' | 'md' | 'lg'",
            defaultValue: "'md'",
            required: "Não",
            description: "Tamanho do glifo dentro do controle."
          }
        ]
      }
    ]
  },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#propriedades`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#propriedades');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
