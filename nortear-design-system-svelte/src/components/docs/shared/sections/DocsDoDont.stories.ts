import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import DocsDoDontStory from './DocsDoDontStory.svelte';

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
 * Aqui `doPreview` e `dontPreview` são `Snippet` dentro do par, então os dois
 * lados viajam junto do dado. É a diferença que mais pesa nesta seção: no Vue os
 * previews vêm de slots indexados, e trocar dois números inverte certo e errado
 * sem erro nenhum.
 */

type DocsDoDontArgs = { title: string; umParSo: boolean };

const meta: Meta<DocsDoDontArgs> = {
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
    umParSo: {
      control: 'boolean',
      description: 'Só da story: reduz a um par, para mostrar que a forma da seção não muda.',
    },
  },
  args: { title: 'Boas práticas', umParSo: false },
  render: (args) => ({ Component: DocsDoDontStory, props: args }),
};

export default meta;
type Story = StoryObj<DocsDoDontArgs>;

export const Playground: Story = {};

/** Um par só: a seção não muda de forma por ter uma comparação em vez de várias. */
export const SinglePair: Story = {
  args: { umParSo: true },
  parameters: { controls: { disable: true } },
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
