import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu, type DropdownMenuItemDef } from './dropdown-menu';
import {
  dropdownMenuSource,
  dropdownMenuSourceControlled,
  dropdownMenuSourceWith,
} from './dropdown-menu.source';
import { createButton } from './button';
import { clicarQuandoMontado, montar, wrap } from './dropdown-menu.fixtures';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import { checkPanelFollowsTrigger } from './floating-follow-probe';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/DropdownMenu/States',
  parameters: {
    design: figmaDesign('dropdownMenu'),
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
        { type: 'item' as const, label: 'Configurações', value: 'settings' },
        { type: 'separator' as const },
        { type: 'item' as const, label: 'Sair', value: 'logout' },
      ];

  const menu = createDropdownMenu({ trigger, items, onOpenChange: opts.onOpenChange });
  menu.dataset.slot = 'dropdown-menu';

  if (opts.openInitially) clicarQuandoMontado(trigger);
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
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item10',
      'functional.item11',
      'accessibility.item3',
    ],
  },
  // O menu abre pelo CLIQUE da `play`, não por um `.click()` na montagem: é o
  // caminho de quem usa, e é o único em que dá para afirmar onde o foco pousa.
  render: () => buildBase({ triggerLabel: 'Abrir menu' }).wrapper,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /abrir menu/i });
    const menuItems = async () =>
      within(await body.findByRole('menu')).getAllByRole('menuitem');

    await step('Clicar abre o menu e o foco entra no painel', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
      // O foco tem que ENTRAR no menu: se ficasse no gatilho, a seta seguinte
      // não acharia item nenhum e o menu seria inoperável por teclado.
      await waitFor(async () => {
        await expect(menu.contains(document.activeElement)).toBe(true);
      });
    });

    await step('As setas descem e sobem um item por vez', async () => {
      const items = await menuItems();
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(items[1]);
      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(items[0]);
    });

    await step('O item em foco por teclado mostra o anel', async () => {
      // Até aqui o item destacado era indicado SÓ pelo preenchimento de accent,
      // e no tema default o texto não muda de cor: quem navega por teclado
      // dependia da diferença entre o fundo do item e o do painel, que nunca
      // chegou aos 3:1 da WCAG 1.4.11.
      //
      // A asserção lê o outline COMPUTADO, e não a classe: `:focus-visible` é
      // decidido pelo navegador a partir da última interação, e é justamente
      // isso que precisa ser provado — a lib move o foco por código depois da
      // tecla, e só o navegador sabe dizer se aquilo conta como teclado.
      const items = await menuItems();
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      const emFoco = document.activeElement as HTMLElement;
      await expect(getComputedStyle(emFoco).outlineStyle).toBe('solid');
      await expect(getComputedStyle(emFoco).outlineWidth).toBe('2px');
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      const items = await menuItems();
      await userEvent.keyboard('{End}');
      await expect(document.activeElement).toBe(items[2]);
      await userEvent.keyboard('{Home}');
      await expect(document.activeElement).toBe(items[0]);
    });

    await step('Digitar uma letra salta para o item que começa com ela', async () => {
      // Typeahead: numa lista de ações longa é o que evita percorrer item por
      // item. Sem ele a letra não faz nada e o foco fica onde estava — por isso
      // a asserção compara com OUTRO item, e não com "mudou de lugar".
      const items = await menuItems();
      await userEvent.keyboard('s');
      await expect(document.activeElement).toBe(items[2]);
    });

    await step('Com o painel aberto, o gatilho deslocado e a página rolada reposicionam o painel junto dele', async () => {
      // O menu mora no `body` e o gatilho, no canvas: sem o acompanhamento de
      // `autoUpdateFloating` o menu ficava onde abriu. Quem se desloca é o
      // canvas, e não o botão — o botão anima `transform` na folha.
      const menu = await body.findByRole('menu');
      const focused = document.activeElement;
      await checkPanelFollowsTrigger(menu, canvasElement);
      // Reposicionar não fecha o menu e não tira o foco do item.
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(document.activeElement).toBe(focused);
    });

    await step('Limpa via ESC antes do postVisit', async () => {
      await closeAfter();
    });
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────
//
// POR QUE ESTE MENU CONTINUA COM GATILHO, e o Sheet e o Dialog não.
//
// Os três tinham a mesma forma — um `<button>` com `.nds-sr-only`,
// `tabindex="-1"` e `aria-hidden="true"`, clicado por código — e nos três ela
// nasceu de `trigger` ser obrigatório. Lá a opção virou opcional; aqui NÃO, e a
// diferença é medida, não estilística: no Sheet o gatilho é usado em dois
// pontos (entra no wrapper, escuta o clique), e este menu o usa em SETE —
//
//   · `positionFloating(trigger, panelEl, …)`, que é a ÂNCORA: um menu suspenso
//     não tem onde ficar sem o elemento de que ele desce;
//   · `aria-haspopup`, `aria-expanded` e `aria-controls`, escritos nele;
//   · `trigger.focus()` na devolução de foco;
//   · `tabExitTarget(e, trigger)`, o destino do Tab que sai do painel;
//   · `trigger.contains(target)` no clique de fora, que é o que impede o
//     segundo clique no gatilho de fechar e reabrir no mesmo gesto.
//
// Tornar a opção opcional aqui não seria copiar a solução do Sheet — seria
// inventar uma política de posicionamento sem âncora, que é outro assunto. O
// que o gatilho escondido tinha de errado continua valendo: ele era INVISÍVEL, e
// o menu ancorava num retângulo de 1px fora da tela. A correção é a mesma do
// Popover — o gatilho é o que ele sempre foi, uma âncora à vista —, e o botão de
// fora deixa de encenar um clique para chamar o verbo público.

export const Controlled: Story = {
  parameters: {
    // Override de story: o assunto é o comando de fora por `open()` mais o
    // callback que devolve cada mudança a quem é dono do estado — sem ele o
    // snippet mostraria um menu que ninguém acompanha nem comanda de fora.
    docs: {
      source: {
        transform: dropdownMenuSourceControlled({
          triggerLabel: 'Ações',
          items: [
            { label: 'Comando A', value: 'a' },
            { label: 'Comando B', value: 'b' },
          ],
        }),
      },
      description: {
        story:
          'Estado do lado de fora: um botão externo abre o menu por open() e recebe de volta cada mudança pelo callback. O gatilho continua à vista porque é ele a âncora de que o menu desce — comandar de fora não é escondê-lo.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.contain = 'layout';
    // Degrau da escada `.nds-min-h-*` em vez de altura cravada: o andaime do
    // canvas acompanha o tema e a densidade como o resto da página.
    wrapper.className = 'nds-stack nds-min-h-50';
    wrapper.dataset.spacing = 'md';

    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });
    externalBtn.dataset.open = 'false';

    // Gatilho VISÍVEL: ele é a âncora do menu e o dono do `aria-expanded`, não
    // um alvo de clique sintético. Era um botão `.nds-sr-only` com
    // `tabindex="-1"` e `aria-hidden="true"`, e o menu descia de um retângulo
    // de 1px fora da tela.
    const trigger = createButton({ variant: 'outline', label: 'Ações' });

    const menu = createDropdownMenu({
      trigger,
      items: [
        { type: 'item', label: 'Comando A', value: 'a' },
        { type: 'item', label: 'Comando B', value: 'b' },
      ],
      onOpenChange: (open) => {
        externalBtn.dataset.open = String(open);
      },
    });
    menu.dataset.slot = 'dropdown-menu';

    // Sem espelho de estado: a guarda de "já aberto" mora em `open()`, e um
    // `if (!externalState.isOpen)` aqui seria a mesma guarda no lugar errado.
    externalBtn.addEventListener('click', () => menu.open());

    wrapper.append(externalBtn, menu);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const buttonExterno = canvas.getByRole('button', { name: /open programmatically/i });
    const trigger = canvas.getByRole('button', { name: /^ações$/i });

    await step('NÃO existe gatilho escondido — quem abre por fora é `open()`', async () => {
      // A âncora do menu está à vista e alcançável por teclado. O que saiu foi o
      // `<button>` invisível que existia só para receber um clique sintético.
      await expect(trigger).toBeVisible();
      await expect(trigger).not.toHaveAttribute('aria-hidden');
      await expect(trigger).not.toHaveAttribute('tabindex', '-1');
      await expect(canvasElement.querySelector('button.nds-sr-only')).toBeNull();
    });

    await step('O botão externo abre o menu — e quem abre é `open()`', async () => {
      // `open()` é idempotente na fábrica, então o replay do painel Interactions
      // chega ao mesmo lugar sem o espelho de estado que guardava este clique.
      await userEvent.click(buttonExterno);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      // O `data-open` do botão de fora é escrito pelo `onOpenChange`: se o
      // callback não tivesse voltado, o estado externo ficaria dessincronizado
      // do menu e quem espelha o estado pararia de acompanhar.
      await expect(buttonExterno.dataset.open).toBe('true');
      // E o gatilho, que é quem carrega o contrato ARIA, acompanha a abertura
      // mesmo tendo sido o código a abrir.
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('ESC fecha e o estado de fora acompanha', async () => {
      await closeAfter();
      await expect(buttonExterno.dataset.open).toBe('false');
      await expect(body.queryAllByRole('menu')).toHaveLength(0);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const ItemDisabled: Story = {
  parameters: {
    covers: ['accessibility.item7'],
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
    const disabled = within(menu).getByRole('menuitem', { name: 'Arquivar' });

    await step('O item se anuncia desabilitado', async () => {
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    });

    await step('O clique é bloqueado pelo CSS, não só pelo callback', async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o item
      // continuaria clicável e o bloqueio dependeria de cada consumidor.
      await expect(getComputedStyle(disabled).pointerEvents).toBe('none');
    });

    await step('A seta POUSA no item desabilitado', async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // A asserção anterior aqui media o CONTRÁRIO — "a seta pula" — e passou a
      // estar errada com a decisão. Ela também exigia `tabindex` ausente; agora
      // o atributo está presente em todo item, porque sem ele o `focus()` das
      // setas seria no-op e a roda pareceria pular um passo.
      const items = within(menu).getAllByRole('menuitem');
      items[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(disabled);
    });

    await step('Limpa via ESC', async () => {
      await closeAfter();
    });
  },
};

// ─── ItemInset ────────────────────────────────────────────────────────────────
//
// O recuo que a anatomia compartilhada promete (`anatomy.item4`) e que esta
// fábrica não tinha — o ContextMenu e o Menubar desta stack já o expunham. Ele
// alinha o texto de um item de ação com o dos itens de marcação, que desenham o
// tique à esquerda do rótulo.

const INSET_ITEMS: DropdownMenuItemDef[] = [
  { type: 'label', label: 'Colunas', inset: true },
  { type: 'checkbox', label: 'Nome', value: 'name', checked: true },
  { type: 'item', label: 'Redefinir', value: 'reset', inset: true },
  { type: 'submenu', label: 'Exportar', value: 'export', inset: true, items: [{ type: 'item', label: 'CSV', value: 'csv' }] },
  { type: 'separator' },
  { type: 'item', label: 'Fechar', value: 'close', inset: false },
];

export const ItemInset: Story = {
  parameters: {
    docs: {
      source: {
        transform: dropdownMenuSourceWith({ triggerLabel: 'Tabela', items: INSET_ITEMS, defaultOpen: true }),
      },
    },
  },
  render: () => montar('Tabela', INSET_ITEMS),
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const reset = within(menu).getByRole('menuitem', { name: 'Redefinir' });
    const exportTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });
    const closeItem = within(menu).getByRole('menuitem', { name: 'Fechar' });
    const label = menu.querySelector<HTMLElement>('.nds-dropdown-menu-label')!;

    await step('O recuo chega ao item, ao rótulo e ao sub-gatilho — e só a quem o pediu', async () => {
      for (const el of [reset, exportTrigger, label]) await expect(el).toHaveAttribute('data-inset');
      // `inset: false` não escreve o atributo: a folha casa `[data-inset]` por
      // PRESENÇA, e um `data-inset="false"` recuaria do mesmo jeito.
      await expect(closeItem).not.toHaveAttribute('data-inset');
    });

    await step('O recuo é geometria, não atributo', async () => {
      // O atributo pode continuar lá com a regra vazia: o que se mede é a
      // margem interna que ele produz, contra a do item sem recuo.
      const padding = (el: HTMLElement) => Number.parseFloat(getComputedStyle(el).paddingLeft);
      await expect(padding(reset)).toBeGreaterThan(padding(closeItem));
      await expect(padding(exportTrigger)).toBeGreaterThan(padding(closeItem));
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
    clicarQuandoMontado(trigger);
    return wrap(menu);
  },
  play: async ({ step }) => {
    const menu = await within(document.body).findByRole('menu');
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const checked = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Telefone' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria o misto como verdadeiro; o que a pessoa ouve
      // tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(checked.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(checked);
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
    // Os avisos que a instância deu, em ordem — zerados a cada rodada.
    const avisos: string[] = [];

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      avisos.length = 0;
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => createDropdownMenu({
          trigger: createButton({ variant: 'outline', label: 'Ações' }),
          items: [
            { type: 'item', label: 'Editar', value: 'edit' },
            { type: 'item', label: 'Excluir', value: 'delete' },
          ],
          onOpenChange: (open) => avisos.push(open ? 'abriu' : 'fechou'),
          onClose: (reason) => avisos.push(`motivo:${reason}`),
        }),
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="dropdown-menu-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });

    await step('Sair da página com o menu aberto não é fechamento: ninguém é avisado', async () => {
      // O `abriu` é a precondição que dá dentes ao resto: sem ele a lista vazia
      // passaria com um menu que nunca abriu. Até 2026-09-11 a destruição saía
      // como `close('api')`, e cada troca de idioma da docs page mandava um
      // `dropdown_menu_close` de um menu que a pessoa não fechou.
      await expect(avisos).toEqual(['abriu']);
    });
  },
};
