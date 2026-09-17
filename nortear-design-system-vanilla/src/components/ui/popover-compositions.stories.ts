import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import {
  createPopover,
  createPopoverDescription,
  createPopoverTitle,
} from './popover';
import { centralizar, empilharCentrado, open, panel } from './popover.fixtures';
import { popoverSource, popoverSourceForm, popoverSourceWith } from './popover.source';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Popover/Compositions',
  parameters: {
    design: figmaDesign('popover'),
    actions: { disable: true },
    // `centered`, como as outras quatro — ver a nota do meta de `-states`. A
    // `SideTop` deste arquivo declara `padded` nela mesma: ela é a única que
    // depende de espaço ACIMA do gatilho.
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          'Composicoes reais do Popover: EditarPerfil (form inline), FiltroDeTabela (checkboxes + ação), SeletorDeCor (swatches) e ConfiguraçõesRapidas (toggles via inputs), mais a story de lado de abertura — arranjo do painel, não estado dele. Demonstra uso prático em fluxos comuns de produto.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring';

async function waitForOpen(): Promise<void> {
  await waitFor(() => {
    if (!document.querySelector('[data-slot="popover-content"]')) throw new Error('popover fechado');
  }, { timeout: 1500 });
}

/**
 * Espiões do `onOpenChange` das composições que CONFIRMAM, no módulo para a play
 * alcançá-los: é o motivo que prova qual caminho fechou — o painel some igual
 * pelos dois.
 */
const editProfileOpenChange = fn();
const tableFilterOpenChange = fn();

// ─── Stories ──────────────────────────────────────────────────────────────────

export const EditProfile: Story = {
  parameters: {
    // Override de story: o formulário dentro do painel pede outra FORMA de
    // snippet — rótulo, campo, o Cancelar e o submit.
    docs: {
      source: { transform: popoverSourceForm({ triggerLabel: 'Editar perfil', cancel: true }) },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';

    const title = createPopoverTitle({ text: 'Dados do perfil' });

    const desc = createPopoverDescription({ text: 'As mudanças são salvas ao confirmar.' });

    const nameRow = document.createElement('div');
    nameRow.className = 'nds-stack';
    nameRow.dataset.spacing = 'xs';
    nameRow.append(
      createLabel({ text: 'Nome', htmlFor: 'pc-name' }),
      createInput({ id: 'pc-name', placeholder: 'Joana Silva', value: 'Joana Silva' }),
    );

    const emailRow = document.createElement('div');
    emailRow.className = 'nds-stack';
    emailRow.dataset.spacing = 'xs';
    emailRow.append(
      createLabel({ text: 'Email', htmlFor: 'pc-email' }),
      createInput({ id: 'pc-email', type: 'email', value: 'joana@example.com' }),
    );

    // O par do rodapé fecha por CAMINHOS diferentes, e é a diferença que chega
    // ao relatório: o Cancelar é a PEÇA de fechar (`close-button`, desistiu); o
    // Atualizar é o submit do formulário, que fecha por código (`api`, concluiu).
    // `type: 'button'` é o padrão de `createButton`, então o Cancelar não envia.
    const cancelar = createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' });
    cancelar.dataset.slot = 'popover-close';
    const submit = createButton({ variant: 'default', size: 'sm', label: 'Atualizar', type: 'submit' });
    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    actions.append(cancelar, submit);

    form.append(title, desc, nameRow, emailRow, actions);

    const el = createPopover({ trigger, content: form, onOpenChange: editProfileOpenChange });
    // Confirmar o formulário fecha por CÓDIGO — motivo `api`, "salvou e
    // fechou". O ouvinte é ligado aqui, e não junto do `<form>`: o conteúdo é
    // montado antes de a fábrica existir, e é ela que tem o `close()`.
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // …aqui entraria a gravação do perfil…
      el.close();
    });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });
    return centralizar(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /editar perfil/i });

    await step('Form de perfil aberto com valores pré-preenchidos', async () => {
      await waitForOpen();
      const ctx = within(panel()!);
      await expect(ctx.getByLabelText('Nome')).toHaveValue('Joana Silva');
      await expect(ctx.getByLabelText(/email/i)).toHaveValue('joana@example.com');
    });

    await step('O Cancelar fecha o painel e informa close-button', async () => {
      const p = await open(trigger);
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      await expect(cancelar).toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(cancelar);
      await waitFor(() => {
        if (panel()) throw new Error('o Cancelar não fechou o painel');
      });
      await expect(editProfileOpenChange).toHaveBeenLastCalledWith(false, 'close-button');
    });

    await step('O Atualizar fecha por CÓDIGO e informa api', async () => {
      const p = await open(trigger);
      const atualizar = within(p).getByRole('button', { name: /atualizar/i });
      // Sem a marca de fechar de propósito: quem fecha é o `close()` do ouvinte
      // de `submit`, e o motivo é `api` — "salvou e fechou", não "desistiu".
      await expect(atualizar).not.toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(atualizar);
      await waitFor(() => {
        if (panel()) throw new Error('o Atualizar não fechou o painel');
      });
      await expect(editProfileOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // Termina ABERTA: é este estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open(trigger)).toBeVisible();
    });
  },
};

export const TableFilter: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Filtros' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const title = createPopoverTitle({ text: 'Filtrar por status' });

    content.appendChild(title);

    const options = ['Ativo', 'Pendente', 'Arquivado'];
    for (const opt of options) {
      const row = document.createElement('label');
      row.className = 'nds-cluster nds-text-body';
      row.dataset.spacing = 'sm';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'nds-icon-sm';
      if (opt === 'Ativo') cb.checked = true;

      const text = document.createElement('span');
      text.textContent = opt;

      row.append(cb, text);
      content.appendChild(row);
    }

    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    // O respiro acima do rodapé é CLASSE da escada, e não `style` inline: inline
    // vence a folha e sairia do tema e da densidade.
    actions.classList.add('nds-pt-2');
    const clear = createButton({ variant: 'ghost', size: 'sm', label: 'Limpar' });
    const apply = createButton({ variant: 'default', size: 'sm', label: 'Aplicar' });
    actions.append(clear, apply);
    content.appendChild(actions);

    const el = createPopover({ trigger, content, onOpenChange: tableFilterOpenChange });
    // O Aplicar é a CONFIRMAÇÃO: aplica o filtro e fecha por código, relatando
    // `api`. Marcá-lo com `data-slot="popover-close"` o faria relatar
    // `close-button`, que é o motivo de quem desistiu.
    apply.addEventListener('click', () => {
      // …aqui entraria a aplicação do filtro…
      el.close();
    });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });
    return centralizar(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Os três status são combináveis', async () => {
      await waitForOpen();
      const ctx = within(panel()!);
      await expect(ctx.getAllByRole('checkbox')).toHaveLength(3);
      await expect(ctx.getByLabelText('Ativo')).toBeChecked();
      await expect(ctx.getByRole('button', { name: /aplicar/i })).toBeInTheDocument();
    });

    await step('E marcar outro NÃO fecha o painel', async () => {
      // Este é o comportamento da composição, e a play só afirmava que os
      // controles renderizavam. Filtro é escolha MÚLTIPLA: fechar no primeiro
      // clique obrigaria a reabrir o painel para cada critério, e nada aqui
      // reprovaria se o painel passasse a se dispensar ao marcar.
      const pendente = within(panel()!).getByLabelText('Pendente') as HTMLInputElement;
      if (!pendente.checked) await userEvent.click(pendente);
      await expect(pendente).toBeChecked();
      await expect(panel()).not.toBeNull();
      // E a que já estava marcada continua marcada: os status se somam.
      await expect(within(panel()!).getByLabelText('Ativo')).toBeChecked();
    });

    await step('O Aplicar fecha por CÓDIGO e informa api', async () => {
      // Aplicar É a decisão: fecha por código, e o motivo é `api` — "concluiu".
      // Com a marca de fechar ele relataria `close-button`, que é quem desistiu.
      const apply = within(panel()!).getByRole('button', { name: /aplicar/i });
      await expect(apply).not.toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(apply);
      await waitFor(() => {
        if (panel()) throw new Error('o Aplicar não fechou o painel');
      });
      await expect(tableFilterOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // Termina ABERTA: é este estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open(canvas.getByRole('button', { name: /filtros/i }))).toBeVisible();
    });
  },
};

export const ColorPicker: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Escolher cor da etiqueta' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const title = createPopoverTitle({ text: 'Cor da etiqueta' });

    const grid = document.createElement('div');
    grid.className = 'nds-grid';
    grid.dataset.cols = '6';
    // Sem `data-fixed` o `data-cols` cai no auto-fit da regra base, cujo
    // `--grid-min` é 16rem: dentro do painel cabe UMA coluna, e o atributo vira
    // no-op silencioso.
    grid.dataset.fixed = 'true';
    grid.dataset.spacing = 'xs';

    // A cor sai de token do tema, nunca de hexadecimal cravado: trocar de marca
    // reescreve a paleta sem tocar na story, e o painel continua legível no
    // tema escuro. Mesma paleta e mesmos nomes das outras quatro stacks.
    const swatches = [
      { name: 'Primária',    className: 'nds-bg-primary'     },
      { name: 'Secundária',  className: 'nds-bg-secondary'   },
      { name: 'Sucesso',     className: 'nds-bg-success'     },
      { name: 'Atenção',     className: 'nds-bg-warning'     },
      { name: 'Informação',  className: 'nds-bg-info'        },
      { name: 'Destrutiva',  className: 'nds-bg-destructive' },
    ];

    for (const s of swatches) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `${SWATCH_CLASSES} ${s.className}`;
      btn.setAttribute('aria-label', s.name);
      grid.appendChild(btn);
    }

    content.append(title, grid);

    const el = createPopover({ trigger, content });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });
    return centralizar(el);
  },
  play: async ({ step }) => {
    await step('Cada amostra tem nome acessível PRÓPRIO, e eles são únicos', async () => {
      // A cor não é o nome: quem não a distingue precisa do rótulo, e sem ele o
      // axe reprova por `button-name`. Conferir duas amostras nominais — era o
      // que esta play fazia — deixava as outras quatro livres para perder o
      // `aria-label` ou repetir o do vizinho sem nada ficar vermelho.
      await waitForOpen();
      const nomes = within(panel()!)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
        .filter((n): n is string => n !== null);
      await expect(nomes).toHaveLength(6);
      // Unicidade: seis rótulos repetidos nomeariam seis botões e distinguiriam
      // zero.
      await expect(new Set(nomes).size).toBe(6);
    });
    await step('Foco navega entre swatches via Tab', async () => {
      const ctx = within(panel()!);
      const first = ctx.getByRole('button', { name: 'Primária' });
      first.focus();
      await expect(first).toHaveFocus();
      await userEvent.tab();
      await expect(ctx.getByRole('button', { name: 'Secundária' })).toHaveFocus();
    });
  },
};

export const QuickSettings: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Configurações' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';

    const title = createPopoverTitle({ text: 'Preferências rápidas' });
    content.appendChild(title);

    const toggles = [
      { id: 'cfg-notifs',  label: 'Notificações',  checked: true  },
      { id: 'cfg-dark',    label: 'Modo escuro',   checked: false },
      { id: 'cfg-compact', label: 'Modo compacto', checked: false },
    ];

    for (const t of toggles) {
      const row = document.createElement('div');
      row.className = 'nds-cluster';
      row.dataset.spacing = 'sm';
      row.dataset.justify = 'between';

      const label = createLabel({ text: t.label, htmlFor: t.id });
      label.className = 'nds-text-body';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = t.id;
      cb.className = 'nds-icon-sm';
      cb.checked = t.checked;

      row.append(label, cb);
      content.appendChild(row);
    }

    const el = createPopover({ trigger, content });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });
    return centralizar(el);
  },
  play: async ({ step }) => {
    await step('As preferências são INDEPENDENTES entre si', async () => {
      await waitForOpen();
      const ctx = within(panel()!);
      const notificacoes = ctx.getByLabelText(/notificações/i) as HTMLInputElement;
      const escuro = ctx.getByLabelText(/modo escuro/i) as HTMLInputElement;
      const compacto = ctx.getByLabelText(/modo compacto/i) as HTMLInputElement;

      // Ponto de partida conhecido antes de medir: no replay o painel chega com
      // o que a rodada anterior deixou.
      if (!notificacoes.checked) await userEvent.click(notificacoes);
      if (escuro.checked) await userEvent.click(escuro);
      if (compacto.checked) await userEvent.click(compacto);

      await userEvent.click(escuro);
      await expect(escuro).toBeChecked();
      // As outras duas não se mexem: são preferências, não um grupo de escolha
      // única. A play afirmava só o estado INICIAL de cada linha, que renderiza
      // igual com ou sem a independência.
      await expect(notificacoes).toBeChecked();
      await expect(compacto).not.toBeChecked();
    });
  },
};

export const SideTop: Story = {
  parameters: {
    covers: ['visual.item4'],
    // `padded` e não o `centered` do meta: com o conteúdo centrado na vertical,
    // o espaço acima do gatilho é metade do que SOBRA do viewport, e some ou
    // reaparece conforme a altura da janela — o passo que exige a virada
    // mediria o tamanho da tela, não o auto-flip. É o que a D0 custou uma
    // captura de tela para descobrir, e é a mesma declaração que vue, svelte e
    // angular trazem nesta story.
    layout: 'padded',
    // Override de story: o lado é o assunto, e `side` não passa por control
    // neste arquivo.
    docs: {
      source: {
        transform: popoverSourceWith({
          side: 'top',
          sideOffset: 12,
          alignOffset: 8,
          triggerLabel: 'Abrir acima',
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir acima' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';
    content.append(
      createPopoverTitle({ text: 'Ancorado acima' }),
      createPopoverDescription({ text: 'Sem espaço acima, o painel vira para baixo sozinho.' }),
    );

    // `sideOffset: 12` como nas outras quatro: o vão é o assunto visual desta
    // story, e no padrão 4 a diferença entre "encostado" e "afastado" não dá
    // para ver nem para medir com folga de arredondamento.
    //
    // `alignOffset: 8` (D14): o deslocamento do eixo CRUZADO, o par do
    // `sideOffset`. Com o padrão `0`, a asserção de alinhamento passaria com a
    // opção ignorada; com 8, ela só passa se a opção chegar ao posicionamento.
    const el = createPopover({ trigger, content, side: 'top', sideOffset: 12, alignOffset: 8 });
    queueMicrotask(() => { if (trigger.isConnected) trigger.click(); });

    // Espaço ACIMA do gatilho, senão o painel não cabe e o auto-flip o manda
    // para baixo — a story mediria o recurso oposto ao que documenta.
    //
    // O espaço é um IRMÃO, e não `data-split="last"`, que é o que estava aqui
    // até 2026-09-13 e não empurrava nada: aquele utilitário põe `margin-top:
    // auto` no ÚLTIMO filho, e o popover era filho único — ele já era o último.
    // Ninguém viu porque, sem `flip`, o painel era desenhado acima do mesmo
    // jeito: fora da tela. A story afirmava "posicionado acima" medindo um
    // painel que ninguém conseguia ler.
    const espaco = document.createElement('div');
    espaco.className = 'nds-min-h-60';
    espaco.setAttribute('aria-hidden', 'true');

    return empilharCentrado([espaco, el], 'nds-min-h-100');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir acima' });

    await step('O lado pedido é o lado obtido, e o vão é o pedido', async () => {
      const p = await open(trigger);
      // `top` EXATO. Afirmar só a geometria deixava o markup livre para dizer
      // outra coisa, e é o `data-side` que as stories e a folha leem.
      await expect(p).toHaveAttribute('data-side', 'top');
      const rg = trigger.getBoundingClientRect();
      const rp = p.getBoundingClientRect();
      // O painel INTEIRO acima do gatilho.
      await expect(rp.bottom).toBeLessThanOrEqual(rg.top + 1);
      // Os 12px pedidos, com 1px de folga para arredondamento sub-pixel. É a
      // asserção que pega o painel crescendo POR CIMA do gatilho quando o
      // posicionador perde a medida.
      await expect(Math.abs(rg.top - rp.bottom - 12)).toBeLessThanOrEqual(1);
    });

    await step('E no outro eixo o painel se desloca pelo alignOffset pedido', async () => {
      // `align: 'center'` põe os dois centros juntos, e o `alignOffset: 8`
      // empurra o painel 8px para o fim do eixo — a direita, no lado `top`.
      // Com sinal: um deslocamento para o lado errado também reprova.
      const rg = trigger.getBoundingClientRect();
      const rp = panel()!.getBoundingClientRect();
      const centerTrigger = rg.left + rg.width / 2;
      const centerPanel = rp.left + rp.width / 2;
      await expect(Math.abs(centerPanel - centerTrigger - 8)).toBeLessThanOrEqual(1);
    });

    // ─── O contrato C9, que esta story afirmava e não media ──────────────────
    //
    // Os dois passos acima provam que `side: 'top'` chega ao posicionamento —
    // e é só isso. A story GARANTE espaço acima, de propósito, então o
    // auto-flip nunca acontece nela: até 2026-09-13 o C9 estava gateado por uma
    // asserção que não podia reprovar, e o flip nem ligado estava.
    //
    // Este passo tira o espaço. O painel deixa de caber acima, o lado vira, e o
    // `data-side` acompanha — se ele continuasse dizendo `top`, o markup estaria
    // mentindo sobre onde o painel ficou.
    await step('Sem espaço acima, o painel VIRA para baixo e o markup acompanha', async () => {
      const p = panel()!;
      const espaco = canvasElement.querySelector<HTMLElement>('.nds-min-h-60')!;
      try {
        // Some com o irmão que cria o espaço: o gatilho sobe para o topo.
        espaco.style.display = 'none';
        await userEvent.click(trigger);           // fecha
        await userEvent.click(trigger);           // reabre já sem espaço
        const reaberto = panel()!;
        await expect(reaberto).toHaveAttribute('data-side', 'bottom');
        const rg = trigger.getBoundingClientRect();
        await expect(reaberto.getBoundingClientRect().top).toBeGreaterThanOrEqual(rg.bottom - 1);
      } finally {
        espaco.style.display = '';
        void p;
      }
    });

    // Termina ABERTA e no lado pedido: é o estado que o Chromatic fotografa.
    await step('Estado final: de volta ao lado pedido', async () => {
      await userEvent.click(trigger);
      await userEvent.click(trigger);
      await expect(panel()).toHaveAttribute('data-side', 'top');
    });
  },
};
