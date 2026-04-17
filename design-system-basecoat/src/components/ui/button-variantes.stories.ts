import type { Meta, StoryObj } from '@storybook/html';

function btn(variant: string): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = variant === 'default' ? 'btn' : `btn-${variant}`;
  el.textContent = 'Botão';
  return el;
}

const meta: Meta = {
  title: 'UI/Button/Variantes',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => btn('default'),
  parameters: {
    docs: {
      description: {
        story: 'A variante padrão para ações primárias que devem chamar a atenção do usuário.',
      },
    },
  },
};

export const Secondary: Story = {
  render: () => btn('secondary'),
  parameters: {
    docs: {
      description: {
        story: 'Alternativa de menor hierarquia visual. Usar para ações de suporte à ação primária.',
      },
    },
  },
};

export const Outline: Story = {
  render: () => btn('outline'),
  parameters: {
    docs: {
      description: {
        story: 'Ideal para ações secundárias ou botões que não devem competir visualmente com a ação primária.',
      },
    },
  },
};

export const Ghost: Story = {
  render: () => btn('ghost'),
  parameters: {
    docs: {
      description: {
        story: 'Ações sutis, comumente usadas em toolbars ou botões de fechar/cancelar.',
      },
    },
  },
};

export const Link: Story = {
  render: () => btn('link'),
  parameters: {
    docs: {
      description: {
        story: 'Para ações que parecem links. Use quando o botão está embutido em texto corrido ou em listas de ações inline.',
      },
    },
  },
};

export const Destructive: Story = {
  render: () => btn('destructive'),
  parameters: {
    docs: {
      description: {
        story: 'Para ações irreversíveis. Deve sempre ser precedida de um AlertDialog de confirmação — nunca dispare a ação diretamente no onClick.',
      },
    },
  },
};
