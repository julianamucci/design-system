import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createDocsAccessibility, type DocsAccessibilityProps } from './DocsAccessibility';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsAccessibility; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="acessibilidade"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta: Meta<DocsAccessibilityProps> = {
  title: 'Doc Components/DocsAccessibility',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: "O contrato de acessibilidade: o resumo, a lista de garantias, a tabela de teclado e o que o leitor de tela anuncia. É a seção que diz o que o componente promete a quem não usa o ponteiro." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    summary: {
      control: "text",
      description: "Uma frase sobre o comportamento geral."
    },
    items: {
      control: "object",
      description: "Garantias, uma por linha."
    },
    keyboardTitle: {
      control: "text",
      description: "Título da tabela de teclado."
    },
    keyboardItems: {
      control: "object",
      description: "Tecla e o que ela faz."
    },
    screenReaderTitle: {
      control: "text",
      description: "Opcional. Título do bloco de leitor de tela."
    },
    screenReaderItems: {
      control: "object",
      description: "Opcional. O que é anunciado."
    },
    contrast: {
      control: "text",
      description: "Opcional. Nota de contraste medido."
    }
  },
  args: {
    title: "Acessibilidade",
    summary: "O controle é um `<button>` nativo, então foco, teclado e semântica vêm do navegador — não são reimplementados.",
    items: [
      "Alvo de toque de 24px no mínimo, medido na área clicável e não no glifo (WCAG 2.5.8).",
      "Anel de foco com 3:1 contra o fundo adjacente, desenhado por box-shadow para acompanhar o raio.",
      "Altura cresce com a fonte do navegador: é padding mais entrelinha, nunca `height` fixa (WCAG 1.4.4).",
      "Estado desabilitado usa `disabled`, que tira o controle da ordem de foco — `aria-disabled` sozinho não tira."
    ],
    keyboardTitle: "Teclado",
    keyboardItems: [
      {
        key: "Tab",
        description: "Move o foco para o controle."
      },
      {
        key: "Enter",
        description: "Aciona a ação."
      },
      {
        key: "Espaço",
        description: "Aciona a ação. Em `<a>` com role de botão, só o Enter aciona."
      }
    ],
    screenReaderTitle: "Leitor de tela",
    screenReaderItems: [
      "Anuncia \"botão, <rótulo>\". Ícone decorativo fica fora, por `aria-hidden`.",
      "Só de ícone exige `aria-label` — sem ele o anúncio é \"botão\" e nada mais."
    ],
    contrast: "Texto sobre a variante default mede 8.4:1 no claro e 9.1:1 no escuro."
  },
  render: (args) => createDocsAccessibility(args),
};

export default meta;
type Story = StoryObj<DocsAccessibilityProps>;

export const Playground: Story = {};

/** Sem o bloco de leitor de tela e sem a nota de contraste: os dois são opcionais, e a seção não deixa buraco quando faltam. */
export const WithoutScreenReaderBlock: Story = {
  args: {
    screenReaderTitle: "",
    screenReaderItems: [],
    contrast: ""
  },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#acessibilidade`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#acessibilidade');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
