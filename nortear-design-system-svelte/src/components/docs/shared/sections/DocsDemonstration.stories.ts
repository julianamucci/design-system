import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import DocsDemonstrationStory from './DocsDemonstrationStory.svelte';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsDemonstration; é o andaime com que a documentação é escrita.
 *
 * Aqui mora a única divergência real entre as cinco stacks nesta família, e ela
 * é de API de framework, não deriva: o conteúdo do palco entra por
 * `children: Snippet` no Svelte, `demoFactory: () => HTMLElement` no Vanilla,
 * `children` no React, `<slot />` no Vue e `<ng-content />` no Angular. Cada
 * uma usa o mecanismo da sua linguagem, e não há fonte de verdade a alinhar.
 *
 * A consequência prática está no arquivo ao lado: snippet é SINTAXE DE
 * TEMPLATE, não valor, então não se passa como arg de um `.stories.ts`. Por
 * isso a story renderiza `DocsDemonstrationStory.svelte`, do mesmo jeito que o
 * AspectRatio já fazia.
 *
 * `componentSlug` é informativo: este container NÃO injeta `data-track*` no que
 * vem pelo slot, porque quem controla esse conteúdo é a docs page. Quem quiser
 * rastreio põe os atributos no gatilho, e o observador do DocsPageLayout os
 * captura por `closest('[data-track]')`.
 */

type DocsDemonstrationArgs = {
  title: string;
  componentSlug: string;
  rastreado: boolean;
};

const meta: Meta<DocsDemonstrationArgs> = {
  title: 'Doc Components/DocsDemonstration',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Palco da seção "Demonstração": a moldura em que a docs page mostra o componente vivo, ' +
          'antes de qualquer tabela. O conteúdo entra pelo mecanismo de slot de cada stack.',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Título da seção.' },
    componentSlug: {
      control: 'text',
      description: 'Informativo. Não injeta rastreio — quem o faz é o gatilho dentro do slot.',
    },
    rastreado: {
      control: 'boolean',
      description: 'Só da story: liga os `data-track*` no gatilho, para mostrar a forma documentada.',
    },
  },
  args: {
    title: 'Demonstração',
    componentSlug: 'button',
    rastreado: false,
  },
  render: (args) => ({ Component: DocsDemonstrationStory, props: args }),
};

export default meta;
type Story = StoryObj<DocsDemonstrationArgs>;

export const Playground: Story = {};

/**
 * Conteúdo com rastreio: os `data-track*` vão no GATILHO, não no container.
 * É a forma documentada, e a story existe para que ela seja copiável.
 */
export const WithTrackedTrigger: Story = {
  args: { rastreado: true },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#demonstracao`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#demonstracao');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
