import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import DocsTestes from './DocsTestes.vue';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsTestes; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="testes"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

/**
 * Anotado, e não inferido por `satisfies`: os tipos de item vivem dentro do
 * SFC, e um `meta` exportado com tipo inferido tenta nomeá-los de fora —
 * `TS4023: cannot be named`. A anotação corta a inferência antes disso.
 */
const meta: Meta<typeof DocsTestes> = {
  title: 'Doc Components/DocsTestes',
  component: DocsTestes,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: "O plano de teste em três tabelas: funcional, acessibilidade e visual. A coluna de prioridade é o que separa o que trava a entrega do que pode esperar." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    functional: {
      control: "object",
      description: "Tabela funcional: ação, resultado e prioridade."
    },
    accessibility: {
      control: "object",
      description: "Tabela de acessibilidade: critério, nível e como verificar."
    },
    visual: {
      control: "object",
      description: "Tabela visual: story e prioridade."
    }
  },
  args: {
    title: "Testes",
    functional: {
      title: "Funcional",
      description: "",
      cols: {
        action: "Ação",
        result: "Resultado esperado",
        priority: "Prioridade"
      },
      items: [
        {
          action: "Clicar no controle habilitado",
          result: "Dispara o handler uma vez.",
          priority: "Alta"
        },
        {
          action: "Pressionar Enter com o foco nele",
          result: "Mesmo resultado do clique.",
          priority: "Alta"
        },
        {
          action: "Clicar no controle desabilitado",
          result: "Nada acontece, e ele não recebe foco.",
          priority: "Alta"
        }
      ]
    },
    accessibility: {
      title: "Acessibilidade",
      description: "",
      cols: {
        criterion: "Critério",
        level: "Nível",
        how: "Como verificar"
      },
      items: [
        {
          criterion: "1.4.4 Resize Text",
          level: "AA",
          how: "Fonte do navegador a 200%: a altura acompanha e nada corta."
        },
        {
          criterion: "2.4.7 Focus Visible",
          level: "AA",
          how: "Chegar por Tab e conferir o anel com 3:1 contra o fundo."
        },
        {
          criterion: "2.5.8 Target Size",
          level: "AA",
          how: "Área clicável de 24px no mínimo, medida na caixa e não no glifo."
        }
      ]
    },
    visual: {
      title: "Visual",
      description: "",
      cols: {
        story: "Story",
        priority: "Prioridade"
      },
      items: [
        {
          story: "Variants",
          priority: "Alta"
        },
        {
          story: "States",
          priority: "Alta"
        },
        {
          story: "Sizes",
          priority: "Média"
        }
      ]
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};


/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#testes`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#testes');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
