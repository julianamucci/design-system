import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { dropdownMenuSource, dropdownMenuSourceWith } from './dropdown-menu.source';
import { createButton } from './button';
import { wrap } from './dropdown-menu.fixtures';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: dropdownMenuSource },
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
  },
  // O menu abre pelo CLIQUE da `play`, não por um `.click()` na montagem: é o
  // caminho de quem usa, e é o único em que dá para afirmar onde o foco pousa.
  render: () => buildBase({ triggerLabel: 'Abrir menu' }).wrapper,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const gatilho = canvas.getByRole('button', { name: /abrir menu/i });
    const menuItems = async () =>
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
      const itens = await menuItems();
      itens[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(itens[1]);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(itens[0]);
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      const itens = await menuItems();
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(itens[2]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(itens[0]);
    });

    await step('Digitar uma letra salta para o item que começa com ela', async () => {
      // Typeahead: numa lista de ações longa é o que evita percorrer item por
      // item. Sem ele a letra não faz nada e o foco fica onde estava — por isso
      // a asserção compara com OUTRO item, e não com "mudou de lugar".
      const itens = await menuItems();
      await userEvent.keyboard('s');
      await expect(document.activeElement).toBe(itens[2]);
    });

    await step('Limpa via ESC antes do postVisit', async () => {
      await closeAfter();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    // Override de story: o assunto é o callback que devolve cada mudança a quem
    // é dono do estado — sem ele o snippet mostraria um menu que ninguém
    // acompanha de fora.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Abrir menu',
          items: [
            { label: 'Comando A', value: 'a' },
            { label: 'Comando B', value: 'b' },
          ],
          onOpenChange: '(aberto) => sincronizarEstadoExterno(aberto)',
        }),
      },
    },
  },
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
    const buttonExterno = canvas.getByRole('button', { name: /open programmatically/i });

    await step('O botão externo abre o menu', async () => {
      // Idempotente: só clica quando o estado atual não é o desejado, então o
      // replay do painel Interactions chega ao mesmo lugar.
      if (buttonExterno.dataset.open !== 'true') await userEvent.click(buttonExterno);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      // O `data-open` do botão de fora é escrito pelo `onOpenChange`: se o
      // callback não tivesse voltado, o estado externo ficaria dessincronizado
      // do menu e um segundo clique não abriria nada.
      await expect(buttonExterno.dataset.open).toBe('true');
    });

    await step('ESC fecha e o estado de fora acompanha', async () => {
      await closeAfter();
      await expect(buttonExterno.dataset.open).toBe('false');
      await expect(body.queryAllByRole('menu')).toHaveLength(0);
    });
  },
};

export const ItemDisabled: Story = {
  parameters: {
    // Override de story: o item bloqueado é o assunto, e a marca dele é uma
    // chave da lista — o snippet do meta traria a lista canônica, sem nenhum.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Mais ações',
          items: [
            { label: 'Editar', value: 'edit' },
            { label: 'Arquivar', value: 'archive', disabled: true },
            { label: 'Excluir', value: 'delete' },
          ],
          defaultOpen: true,
        }),
      },
    },
  },
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

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação, de propósito. O que ela declara vale na montagem, e o
// primeiro clique num item misto o resolve para marcado — uma play que clicasse
// aqui mediria outro estado no REPLAY do painel Interactions, que reexecuta no
// mesmo DOM. Sem clique, cada rodada mede exatamente o mesmo.

export const CheckboxIndeterminate: Story = {
  parameters: {
    covers: ['functional.item8'],
    // Override de story: o item de marcação e o estado misto são o assunto, e
    // vivem na lista — o snippet do meta mostraria uma lista de ações simples,
    // sem `checkbox` nenhum.
    docs: {
      source: {
        transform: dropdownMenuSourceWith({
          triggerLabel: 'Colunas',
          items: [
            { type: 'label', label: 'Colunas visíveis' },
            { type: 'checkbox', label: 'Nome', value: 'nome', indeterminate: true },
            { type: 'checkbox', label: 'E-mail', value: 'email', checked: true },
            { type: 'checkbox', label: 'Telefone', value: 'telefone', checked: false },
          ],
          defaultOpen: true,
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Colunas' });
    const menu = createDropdownMenu({
      trigger,
      items: [
        { type: 'label', label: 'Colunas visíveis' },
        { type: 'checkbox', label: 'Nome', value: 'nome', indeterminate: true },
        { type: 'checkbox', label: 'E-mail', value: 'email', checked: true },
        { type: 'checkbox', label: 'Telefone', value: 'telefone', checked: false },
      ],
    });
    // A abertura é da MONTAGEM, e o painel fica aberto até o fim: é o estado que
    // a story existe para mostrar, e é o que o Chromatic fotografa.
    queueMicrotask(() => trigger.click());
    return wrap(menu);
  },
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const marcado = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Telefone' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria o misto como verdadeiro; o que a pessoa ouve
      // tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(marcado.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(marcado);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado continua sem glifo nenhum', async () => {
      await expect(formaDoIndicador(desmarcado)).toBeNull();
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
  render: () => probeHost(
    'Sonda de limpeza: o menu é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
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
      await checkLimpeza(probe);
    });
  },
};
