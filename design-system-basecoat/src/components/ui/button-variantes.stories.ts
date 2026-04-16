import type { Meta, StoryObj } from '@storybook/html';

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer';

const VARIANTS: Record<string, string> = {
  default:     `${BTN_BASE} bg-primary text-primary-foreground hover:bg-primary/90`,
  secondary:   `${BTN_BASE} bg-secondary text-secondary-foreground hover:bg-secondary/80`,
  outline:     `${BTN_BASE} border bg-background hover:bg-accent hover:text-accent-foreground`,
  ghost:       `${BTN_BASE} hover:bg-accent hover:text-accent-foreground`,
  link:        `${BTN_BASE} text-primary underline-offset-4 hover:underline`,
  destructive: `${BTN_BASE} bg-destructive text-white hover:bg-destructive/90`,
};

function btn(variant: string): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `${VARIANTS[variant]} h-9 px-4 py-2`;
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
