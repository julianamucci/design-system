import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsDocsWhenToUse } from './DocsWhenToUse';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsWhenToUse; é o andaime com que a documentação é escrita.
 *
 * A story que importa é a última: a seção precisa carregar `id="quando-usar"`,
 * porque é para essa âncora que a navegação lateral da docs page rola. Trocar o
 * id não muda um pixel e não reprova tipo nenhum — só faz o item do menu deixar
 * de levar a lugar nenhum.
 */

const meta: Meta = {
  title: 'Doc Components/DocsWhenToUse',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NdsDocsWhenToUse] })],
  parameters: {
    layout: 'padded',
    docs: { description: { component: "Quando escolher o componente e quando não: diretrizes, tabela de cenários com a alternativa, e os pares de faça/não faça. É a seção que resolve a dúvida antes de a pessoa escrever a primeira linha." } },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Título da seção."
    },
    guidelines: {
      control: "object",
      description: "Diretrizes gerais, em lista."
    },
    scenarios: {
      control: "object",
      description: "Cenário, o que usar e a alternativa."
    },
    uxWriting: {
      control: "object",
      description: "Opcional. Tabela de escrita: elemento, faça, não faça."
    },
    do: {
      control: "object",
      description: "Lista do que fazer."
    },
    dont: {
      control: "object",
      description: "Lista do que evitar."
    }
  },
  args: {
    title: "Quando usar",
    guidelines: {
      title: "Diretrizes",
      items: [
        "Uma ação primária por tela. Duas competem, e a pessoa para para escolher.",
        "O rótulo nomeia a ação, não o objeto: \"Salvar alterações\", não \"Alterações\".",
        "Ação que navega é link, e a diferença não é estética — muda o anúncio e o menu do navegador."
      ]
    },
    scenarios: {
      title: "Cenários",
      cols: {
        scenario: "Cenário",
        use: "Use",
        alternative: "Alternativa"
      },
      items: [
        {
          s: "Enviar um formulário",
          u: "Button, variante default",
          a: "—"
        },
        {
          s: "Ir para outra página",
          u: "Link",
          a: "Button variante link, só quando o alvo não for um endereço"
        },
        {
          s: "Ligar e desligar um estado",
          u: "Toggle",
          a: "Button com `aria-pressed`, se não houver Toggle"
        },
        {
          s: "Ação destrutiva sem volta",
          u: "Button destructive dentro de AlertDialog",
          a: "—"
        }
      ]
    },
    uxWriting: {
      title: "Escrita",
      cols: {
        element: "Elemento",
        do: "Faça",
        dont: "Não faça",
        rules: "Regra"
      },
      items: [
        {
          element: "Rótulo",
          do: "Salvar alterações",
          dont: "OK",
          rules: "Verbo no infinitivo mais o objeto."
        },
        {
          element: "Confirmação destrutiva",
          do: "Excluir projeto",
          dont: "Sim",
          rules: "Repetir a ação, para o botão fazer sentido lido sozinho."
        }
      ]
    },
    do: {
      title: "Faça",
      items: [
        "Deixe o rótulo dizer o que acontece ao clicar.",
        "Use a variante destructive só para o que não tem volta.",
        "Dê `aria-label` a botão só de ícone."
      ]
    },
    dont: {
      title: "Evite",
      items: [
        "Não use o botão para navegar quando existe um endereço.",
        "Não empilhe duas ações primárias no mesmo bloco.",
        "Não dependa só da cor para dizer que a ação é perigosa."
      ]
    }
  },
  render: (args) => ({
    props: args,
    template: `<nds-docs-when-to-use
      [title]="title"
      [guidelines]="guidelines"
      [scenarios]="scenarios"
      [uxWriting]="uxWriting"
      [do]="do"
      [dont]="dont"
    />`,
  }),
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** Sem a tabela de escrita, que é opcional: nem todo componente tem rótulo autoral, e a seção fecha sem ela. */
export const WithoutUXWriting: Story = {
  args: {},
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#quando-usar`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#quando-usar');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
