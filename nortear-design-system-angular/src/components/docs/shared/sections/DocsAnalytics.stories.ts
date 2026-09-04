import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsDocsAnalytics } from './DocsAnalytics';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsAnalytics; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="analytics"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta: Meta = {
  title: 'Doc Components/DocsAnalytics',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NdsDocsAnalytics] })],
  parameters: {
    layout: 'padded',
    docs: { description: { component: "Eventos que o componente dispara, o gatilho de cada um e o payload. O payload carrega valor estável — slug, variante, lado —, nunca texto traduzido, que partiria um evento em três no GA4." } },
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
      description: "Uma entrada por evento."
    }
  },
  args: {
    title: "Analytics",
    cols: {
      event: "Evento",
      trigger: "Gatilho",
      payload: "Payload"
    },
    items: [
      {
        event: "button_click",
        trigger: "Clique ou Enter/Espaço no controle",
        payload: "{ slug, variant, size }"
      },
      {
        event: "docs_section_viewed",
        trigger: "Seção visível por 2s contínuos",
        payload: "{ slug, section }"
      },
      {
        event: "code_copied",
        trigger: "Clique em copiar num bloco de código",
        payload: "{ slug, snippet }"
      }
    ]
  },
  render: (args) => ({
    props: args,
    template: `<nds-docs-analytics
      [title]="title"
      [cols]="cols"
      [items]="items"
    />`,
  }),
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {};


/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#analytics`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#analytics');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
