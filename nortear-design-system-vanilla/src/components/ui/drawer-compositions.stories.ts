import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createDrawer } from './drawer';
import { drawerWithFormSource, drawerSource, drawerSourceWith } from './drawer.source';
import { createButton } from './button';
import { openPeloTrigger } from './drawer.fixtures';

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Drawer/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: drawerSource },
      description: {
        component:
          'Combinações canônicas: formulário curto com confirmar/cancelar, confirmação reversível e corpo mais alto que o painel.',
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

function buildFooter(cancelLabel: string, actionLabel: string, destrutivo = false): HTMLElement {
  // `data-slot="drawer-close"` é o que faz a factory ligar o fechamento ao
  // botão — o equivalente desta stack ao componente DrawerClose das outras.
  const cancel = createButton({ variant: 'outline', label: cancelLabel });
  cancel.dataset.slot = 'drawer-close';
  const action = createButton({
    variant: destrutivo ? 'destructive' : 'default',
    label: actionLabel,
  });

  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
  footer.append(cancel, action);
  return footer;
}

function buildWrapper(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(child);
  return wrapper;
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
      footer: buildFooter('Cancelar', 'Confirmar'),
    });
    return buildWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const painel = await openPeloTrigger(canvasElement, /editar perfil/i);
    const dentro = within(painel);

    await step('O painel carrega nome, descrição e os campos do formulário', async () => {
      await expect(painel).toHaveAccessibleName('Editar perfil');
      await expect(painel).toHaveAccessibleDescription('Atualize seu nome e e-mail.');
      // Os campos são achados pelo RÓTULO: se `for`/`id` não casassem, o input
      // ficaria sem nome acessível e a busca falharia.
      await expect(dentro.getByLabelText(/Nome/i)).toBeInTheDocument();
      await expect(dentro.getByLabelText(/E-mail/i)).toBeInTheDocument();
    });

    await step('O rodapé oferece confirmar e cancelar', async () => {
      const rodape = painel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;
      await expect(rodape).not.toBeNull();
      const names = within(rodape).getAllByRole('button').map((b) => b.textContent?.trim());
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

    const drawer = createDrawer({
      trigger,
      title: 'Remover anexo?',
      description: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
      content: body,
      footer: buildFooter('Cancelar', 'Remover', true),
    });
    return buildWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const painel = await openPeloTrigger(canvasElement, /remover anexo/i);
    const dentro = within(painel);

    await step('A consequência está escrita, não subentendida', async () => {
      await expect(painel).toHaveAccessibleName('Remover anexo?');
      await expect(painel).toHaveAccessibleDescription(/adicioná-lo novamente depois/i);
    });

    await step('A ação principal carrega a variante destrutiva', async () => {
      const destrutivo = dentro.getByRole('button', { name: /^Remover$/i });
      await expect(destrutivo).toHaveClass('nds-button-destructive');
      const cancelar = dentro.getByRole('button', { name: /Cancelar/i });
      await expect(cancelar).toHaveClass('nds-button-outline');
    });
  },
};

export const WithScroll: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

    const longBody = document.createElement('div');
    longBody.className = 'nds-text-body nds-text-muted-foreground nds-stack';
    longBody.dataset.spacing = 'md';
    for (let i = 1; i <= 30; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: conteúdo extenso para demonstrar a rolagem interna do painel sem que o rodapé com as ações saia da tela.`;
      longBody.appendChild(p);
    }

    const drawer = createDrawer({
      trigger,
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: longBody,
      footer: buildFooter('Recusar', 'Aceitar termos'),
    });
    return buildWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const painel = await openPeloTrigger(canvasElement, /ler termos/i);
    const corpo = painel.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
    const rodape = painel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(corpo).not.toBeNull();
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: o mínimo automático zero de um item com
      // overflow é o que faz o corpo ceder altura em vez de esticar a caixa.
      // O painel NÃO é contêiner de rolagem, e é isso que prova o contrato.
      // Medir `scrollHeight <= clientHeight` nele não provava nada: sem
      // `overflow` declarado o computado é `visible`, e elemento visível não
      // rola por maior que seja o `scrollHeight`. Sonda no navegador com o
      // corpo já correto: painel client 719 / scroll 2157, corpo client 559 /
      // scroll 1524 — ou seja, o corpo cede altura e rola, e o número do painel
      // era só a caixa de conteúdo não recortada.
      await expect(['auto', 'scroll']).not.toContain(
        getComputedStyle(painel).overflowY,
      );
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo. É a regra scrollable-region-focusable do axe.
      await expect(corpo).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = rodape.getBoundingClientRect();
      const boxPanel = painel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};
