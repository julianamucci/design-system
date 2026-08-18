import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { createButton } from './button';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do DropdownMenu: Fechado (apenas trigger), Aberto (defaultOpen via .click()), Controlado (open externo) e ItemDesabilitado (aria-disabled).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '180px';
  wrapper.appendChild(child);
  return wrapper;
}

function buildBase(opts: {
  triggerLabel: string;
  openInitially?: boolean;
  withDisabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}): { wrapper: HTMLElement; trigger: HTMLButtonElement } {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const items = opts.withDisabled
    ? [
        { type: 'item' as const, label: 'Editar',  value: 'edit' },
        { type: 'item' as const, label: 'Arquivar', value: 'archive', disabled: true },
        { type: 'item' as const, label: 'Excluir', value: 'delete' },
      ]
    : [
        { type: 'item' as const, label: 'Perfil', value: 'profile' },
        { type: 'item' as const, label: 'Configuracoes', value: 'settings' },
        { type: 'separator' as const },
        { type: 'item' as const, label: 'Sair', value: 'logout' },
      ];

  const menu = createDropdownMenu({ trigger, items, onOpenChange: opts.onOpenChange });
  menu.dataset.slot = 'dropdown-menu';

  if (opts.openInitially) queueMicrotask(() => trigger.click());
  return { wrapper: wrap(menu), trigger };
}

async function closeAfter(): Promise<void> {
  const body = within(document.body);
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (body.queryByRole('menu')) throw new Error('still open');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => buildBase({ triggerLabel: 'Abrir menu' }).wrapper,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Só o gatilho está na tela', async () => {
      const trigger = canvas.getByRole('button', { name: /abrir menu/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // O portal desmonta o popup ao fechar: fechado não é "escondido com
      // display:none", é ausente do DOM. Um popup só escondido continuaria no
      // percurso do leitor de tela.
      await expect(body.queryAllByRole('menu')).toHaveLength(0);
      await expect(body.queryAllByRole('menuitem')).toHaveLength(0);
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item2', 'accessibility.item3'],
    // Medido na própria factory: o item de marcação é de DOIS estados. A opção
    // declara `checked?: boolean`, o callback de mudança entrega `boolean`, e o
    // `aria-checked` é escrito a partir desse booleano. Não há terceiro valor a
    // receber, logo não há misto para anunciar nem traço para desenhar. A caixa
    // de seleção avulsa desta stack resolve o misto; o item de menu não a expõe.
    coversNotApplicable: {
      'functional.item8':
        'a factory do item de marcação é de dois estados — a opção é booleana, o callback entrega booleano e o aria-checked sai dele, sem terceiro valor para anunciar como misto',
    },
  },
  // O menu abre pelo CLIQUE da `play`, não por um `.click()` na montagem: é o
  // caminho de quem usa, e é o único em que dá para afirmar onde o foco pousa.
  render: () => buildBase({ triggerLabel: 'Abrir menu' }).wrapper,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const gatilho = canvas.getByRole('button', { name: /abrir menu/i });
    const itensDoMenu = async () =>
      within(await body.findByRole('menu')).getAllByRole('menuitem');

    await step('Clicar abre o menu e o foco entra no painel', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
      // O foco tem que ENTRAR no menu: se ficasse no gatilho, a seta seguinte
      // não acharia item nenhum e o menu seria inoperável por teclado.
      await waitFor(async () => {
        await expect(menu.contains(document.activeElement)).toBe(true);
      });
    });

    await step('As setas descem e sobem um item por vez', async () => {
      const itens = await itensDoMenu();
      itens[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(itens[1]);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(itens[0]);
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      const itens = await itensDoMenu();
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(itens[2]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(itens[0]);
    });

    await step('Digitar uma letra salta para o item que começa com ela', async () => {
      // Typeahead: numa lista de ações longa é o que evita percorrer item por
      // item. Sem ele a letra não faz nada e o foco fica onde estava — por isso
      // a asserção compara com OUTRO item, e não com "mudou de lugar".
      const itens = await itensDoMenu();
      await userEvent.keyboard('s');
      await expect(document.activeElement).toBe(itens[2]);
    });

    await step('Limpa via ESC antes do postVisit', async () => {
      await closeAfter();
    });
  },
};

export const Controlled: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.contain = 'layout';
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';
    wrapper.style.minHeight = '180px';

    const externalState = { isOpen: false };
    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });

    const hiddenTrigger = createButton({ variant: 'outline', label: 'internal-trigger' });
    hiddenTrigger.classList.add('sr-only');
    hiddenTrigger.setAttribute('tabindex', '-1');
    hiddenTrigger.setAttribute('aria-hidden', 'true');

    const menu = createDropdownMenu({
      trigger: hiddenTrigger,
      items: [
        { type: 'item', label: 'Comando A', value: 'a' },
        { type: 'item', label: 'Comando B', value: 'b' },
      ],
      onOpenChange: (open) => {
        externalState.isOpen = open;
        externalBtn.dataset.open = String(open);
      },
    });
    menu.dataset.slot = 'dropdown-menu';

    externalBtn.addEventListener('click', () => {
      if (!externalState.isOpen) hiddenTrigger.click();
    });

    wrapper.append(externalBtn, menu);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const botaoExterno = canvas.getByRole('button', { name: /open programmatically/i });

    await step('O botão externo abre o menu', async () => {
      // Idempotente: só clica quando o estado atual não é o desejado, então o
      // replay do painel Interactions chega ao mesmo lugar.
      if (botaoExterno.dataset.open !== 'true') await userEvent.click(botaoExterno);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      // O `data-open` do botão de fora é escrito pelo `onOpenChange`: se o
      // callback não tivesse voltado, o estado externo ficaria dessincronizado
      // do menu e um segundo clique não abriria nada.
      await expect(botaoExterno.dataset.open).toBe('true');
    });

    await step('ESC fecha e o estado de fora acompanha', async () => {
      await closeAfter();
      await expect(botaoExterno.dataset.open).toBe('false');
      await expect(body.queryAllByRole('menu')).toHaveLength(0);
    });
  },
};

export const ItemDisabled: Story = {
  render: () => buildBase({
    triggerLabel: 'Mais ações',
    openInitially: true,
    withDisabled: true,
  }).wrapper,
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await body.findByRole('menu');
    const desabilitado = within(menu).getByRole('menuitem', { name: 'Arquivar' });

    await step('O item se anuncia desabilitado', async () => {
      await expect(desabilitado).toHaveAttribute('aria-disabled', 'true');
    });

    await step('O clique é bloqueado pelo CSS, não só pelo callback', async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o item
      // continuaria clicável e o bloqueio dependeria de cada consumidor.
      await expect(getComputedStyle(desabilitado).pointerEvents).toBe('none');
    });

    await step('A seta pula o item desabilitado', async () => {
      // Aqui a navegação NÃO pousa no item bloqueado: ele fica fora do percurso
      // das setas, e por isso também não tem `tabindex`.
      const itens = within(menu).getAllByRole('menuitem');
      await expect(desabilitado.hasAttribute('tabindex')).toBe(false);
      itens[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).not.toBe(desabilitado);
      await expect(document.activeElement).toBe(itens[2]);
    });

    await step('Limpa via ESC', async () => {
      await closeAfter();
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => hospedeiroDeSonda(
    'Sonda de limpeza: o menu é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ResultadoDaSonda;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => createDropdownMenu({
          trigger: createButton({ variant: 'outline', label: 'Ações' }),
          items: [
            { type: 'item', label: 'Editar', value: 'edit' },
            { type: 'item', label: 'Excluir', value: 'delete' },
          ],
        }),
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="dropdown-menu-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await conferirLimpeza(sonda);
    });
  },
};
