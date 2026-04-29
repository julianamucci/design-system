import type { Meta, StoryObj } from '@storybook/html';
import { createSeparator } from './separator';

const meta: Meta = {
  title: 'UI/Separator/Variantes',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Orientações do Separator: horizontal (h-px w-full) e vertical (w-px h-full). ' +
          'A orientação vertical exige um parent com altura definida ou flex container.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  name: 'Horizontal',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md space-y-4';

    const top = document.createElement('div');
    top.className = 'text-sm';
    top.innerHTML =
      '<p class="font-medium">Configurações da conta</p>' +
      '<p class="text-muted-foreground">Gerencie seu nome e e-mail.</p>';

    const bottom = document.createElement('div');
    bottom.className = 'text-sm';
    bottom.innerHTML =
      '<p class="font-medium">Preferências</p>' +
      '<p class="text-muted-foreground">Tema, idioma e notificações.</p>';

    wrap.append(top, createSeparator({ orientation: 'horizontal' }), bottom);
    return wrap;
  },
};

export const Vertical: Story = {
  name: 'Vertical',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'flex h-16 items-center gap-4 w-full max-w-md';

    const a = document.createElement('span');
    a.className = 'text-sm';
    a.textContent = 'Blog';

    const b = document.createElement('span');
    b.className = 'text-sm';
    b.textContent = 'Documentação';

    const c = document.createElement('span');
    c.className = 'text-sm';
    c.textContent = 'Contato';

    wrap.append(
      a,
      createSeparator({ orientation: 'vertical' }),
      b,
      createSeparator({ orientation: 'vertical' }),
      c,
    );
    return wrap;
  },
};
