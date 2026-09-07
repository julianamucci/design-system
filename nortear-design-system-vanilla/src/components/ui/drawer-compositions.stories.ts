import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createDrawer } from './drawer';
import { drawerWithFormSource, drawerSource, drawerSourceWith } from './drawer.source';
import { createButton } from './button';
import { buildDrawerFooter, buildDrawerWrapper, openPeloTrigger } from './drawer.fixtures';

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Drawer/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: drawerSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar e confirmação reversível.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildField(labelText: string, id: string, type: string, value: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'nds-stack nds-text-body';
  label.dataset.spacing = 'xs';
  label.htmlFor = id;

  const span = document.createElement('span');
  span.className = 'nds-font-medium';
  span.textContent = labelText;

  const input = document.createElement('input');
  input.id = id;
  input.className = 'nds-input';
  input.type = type;
  input.value = value;

  label.append(span, input);
  return label;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item5'],
    // Override de story: o corpo deixa de ser um parágrafo e passa a ser uma
    // composição de campos — a sub-fábrica que fecha o par rótulo ↔ controle é o
    // assunto, e o snippet do meta a esconderia.
    docs: {
      source: {
        transform: drawerWithFormSource({
          triggerLabel: 'Editar perfil',
          title: 'Editar perfil',
          description: 'Atualize seu nome e e-mail.',
          fields: [
            { label: 'Nome', value: 'Maria Souza' },
            { label: 'E-mail', type: 'email', value: 'maria@exemplo.com' },
          ],
        }),
      },
      description: {
        story:
          'Formulário curto no corpo e par de ações no rodapé. Título e descrição dizem o que está sendo editado — juntos formam o nome e a descrição acessíveis do painel.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.append(
      buildField('Nome', 'drawer-comp-nome', 'text', 'Maria Souza'),
      buildField('E-mail', 'drawer-comp-email', 'email', 'maria@exemplo.com'),
    );

    const drawer = createDrawer({
      trigger,
      title: 'Editar perfil',
      description: 'Atualize seu nome e e-mail.',
      content: form,
      footer: buildDrawerFooter('Cancelar', 'Confirmar'),
    });
    return buildDrawerWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement, /editar perfil/i);
    const inside = within(panel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(panel).toHaveAccessibleName('Editar perfil');
      await expect(panel).toHaveAccessibleDescription('Atualize seu nome e e-mail.');
      // Os campos são achados pelo RÓTULO: se `for`/`id` não casassem, o input
      // ficaria sem nome acessível e a busca falharia.
      await expect(inside.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(inside.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step('O rodapé oferece confirmar e cancelar', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      await expect(footer).not.toBeNull();
      const names = within(footer).getAllByRole('button').map((b) => b.textContent?.trim());
      await expect(names).toContain('Confirmar');
      await expect(names).toContain('Cancelar');
    });
  },
};

export const WithConfirmation: Story = {
  parameters: {
    // Override de story: a ênfase da ação principal não passa por control
    // nenhum, e o snippet do meta mostraria `default` onde a story renderiza a
    // variante destrutiva.
    docs: {
      source: {
        transform: drawerSourceWith({
          triggerLabel: 'Remover anexo',
          title: 'Remover anexo?',
          description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
          bodyText: 'O anexo sai desta mensagem e continua na biblioteca.',
          footer: [
            { label: 'Cancelar', variant: 'outline', close: true },
            { label: 'Remover', variant: 'destructive' },
          ],
          initialFocusOnCloser: true,
        }),
      },
      description: {
        story:
          'Mensagem curta e par de ações, com a principal na variante destrutiva. Vale para confirmação reversível; se a ação for realmente bloqueante, o componente é o AlertDialog.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Remover anexo' });

    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent = 'O anexo sai desta mensagem e continua na biblioteca.';

    // Aqui a decisão É a tela, e por isso o foco entra no cancelar — a mesma
    // escolha do `alert-dialog` desta stack: o Enter por reflexo tem de cair na
    // saída segura, nunca na ação que consuma. Sem isto o foco iria para o corpo
    // rolável, que é o primeiro focável do painel. Na `WithForm` o padrão FICA:
    // ali o assunto é editar, e cobrar um Tab a mais de quem só quer editar é o
    // custo que esta regra não paga.
    const footerActions = buildDrawerFooter('Cancelar', 'Remover', true);

    const drawer = createDrawer({
      trigger,
      title: 'Remover anexo?',
      description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
      content: body,
      footer: footerActions,
      initialFocus: footerActions[0],
    });
    return buildDrawerWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement, /remover anexo/i);
    const inside = within(panel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(panel).toHaveAccessibleName('Remover anexo?');
      await expect(panel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step('A ação principal carrega a variante destrutiva', async () => {
      const destrutivo = inside.getByRole('button', { name: /^Remover$/i });
      await expect(destrutivo).toHaveClass('nds-button-destructive');
      const cancelar = inside.getByRole('button', { name: /Cancelar/i });
      await expect(cancelar).toHaveClass('nds-button-outline');
    });

    // O ELEMENTO, não a mera presença de foco: um painel que foca a si mesmo, ou
    // o corpo rolável, também tem foco dentro — e é justamente o que esta story
    // recusa.
    await step('O foco abre no cancelar, que é a saída segura', async () => {
      const cancelar = inside.getByRole('button', { name: /^Cancelar$/i });
      await expect(cancelar).toHaveFocus();
    });
  },
};
