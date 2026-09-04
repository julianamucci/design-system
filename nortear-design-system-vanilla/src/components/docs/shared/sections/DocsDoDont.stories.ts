import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createDocsDoDont, type DocsDoDontProps } from './DocsDoDont';
import { createButton } from '@/components/ui/button';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsDoDont; é o andaime com que a documentação é escrita.
 *
 * Cada par mostra o certo e o errado LADO A LADO, com preview vivo dos dois. É o
 * que o distingue de uma lista de regras: a comparação é visual, e por isso a
 * seção só funciona se os dois lados forem renderizáveis de verdade.
 *
 * Isso impõe um limite que vale saber: o lado "não faça" é renderizado na
 * página, então ele não pode ser um defeito de acessibilidade real — um contraste
 * insuficiente ali reprovaria o axe da própria docs page. Os exemplos errados
 * são de ESCRITA e de arranjo, não de violação.
 *
 * O preview segue o mecanismo desta stack, `doPreviewFactory` e
 * `dontPreviewFactory`. As cinco divergem aqui, e o DocsVariants documenta a
 * tabela inteira.
 */

const meta: Meta<DocsDoDontProps> = {
  title: 'Doc Components/DocsDoDont',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pares de faça e não faça, com preview dos dois lados. A comparação é visual — ' +
          'é isso que a separa de uma lista de regras.',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Título da seção.' },
    pairs: { control: false, description: 'Um par por comparação. As fábricas são o slot desta stack.' },
  },
  args: {
    title: 'Boas práticas',
    pairs: [
      {
        doLabel: 'Faça',
        dontLabel: 'Evite',
        doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
        dontCaption: '"Clique aqui" não diz o que acontece, e o leitor de tela anuncia só isso.',
        doPreviewFactory: () => createButton({ children: 'Salvar alterações' }),
        dontPreviewFactory: () => createButton({ children: 'Clique aqui' }),
      },
      {
        doLabel: 'Faça',
        dontLabel: 'Evite',
        doCaption: 'Uma primária por bloco, com a secundária em outline à esquerda.',
        dontCaption: 'Duas primárias competem, e a pessoa para para escolher.',
        doPreviewFactory: () => {
          const linha = document.createElement('span');
          linha.className = 'nds-cluster';
          linha.dataset.spacing = 'md';
          linha.append(
            createButton({ variant: 'outline', children: 'Cancelar' }),
            createButton({ children: 'Confirmar' }),
          );
          return linha;
        },
        dontPreviewFactory: () => {
          const linha = document.createElement('span');
          linha.className = 'nds-cluster';
          linha.dataset.spacing = 'md';
          linha.append(createButton({ children: 'Salvar' }), createButton({ children: 'Enviar' }));
          return linha;
        },
      },
    ],
  },
  render: (args) => createDocsDoDont(args),
};

export default meta;
type Story = StoryObj<DocsDoDontProps>;

export const Playground: Story = {};

/** Um par só: a seção não muda de forma por ter uma comparação em vez de várias. */
export const SinglePair: Story = {
  parameters: { controls: { disable: true } },
  args: {
    pairs: [
      {
        doLabel: 'Faça',
        dontLabel: 'Evite',
        doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
        dontCaption: '"Clique aqui" não diz o que acontece.',
        doPreviewFactory: () => createButton({ children: 'Salvar alterações' }),
        dontPreviewFactory: () => createButton({ children: 'Clique aqui' }),
      },
    ],
  },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para `#do-dont`,
 * e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#do-dont');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
