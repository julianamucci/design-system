import type { Meta, StoryObj } from '@storybook/html';


const meta: Meta = {
  title: 'UI/Button/Composições',
};

export default meta;
type Story = StoryObj;

export const WithIconLeading: Story = {
  name: 'Ícone à esquerda',
  render: () => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'btn';
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Enviar email`;
    return el;
  },
  parameters: {
    docs: {
      description: {
        story: 'Ícone posicionado antes do label. O gap entre ícone e texto é gerenciado automaticamente pela classe `gap-2` do componente.',
      },
    },
  },
};

export const WithIconTrailing: Story = {
  name: 'Ícone à direita',
  render: () => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'btn-outline';
    el.innerHTML = `Próximo <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
    return el;
  },
  parameters: {
    docs: {
      description: {
        story: 'Ícone posicionado após o label. Use para botões de navegação que indicam continuidade ou próximo passo.',
      },
    },
  },
};

export const AsLink: Story = {
  name: 'Como link (<a>)',
  render: () => {
    const el = document.createElement('a');
    el.href = '#';
    el.className = 'btn-outline';
    el.textContent = 'Link estilizado como botão';
    el.setAttribute('role', 'button');
    return el;
  },
  parameters: {
    docs: {
      description: {
        story: 'Aplica as classes do botão em um elemento `<a>` para navegação com aparência de botão. Adicione `role="button"` para acessibilidade.',
      },
    },
  },
};
