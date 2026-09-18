import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import {
  createPopover,
  createPopoverDescription,
  createPopoverTitle,
  type PopoverElement,
} from './popover';
import { open, empilharCentrado, panel } from './popover.fixtures';
import {
  popoverSource,
  popoverSourceActions,
  popoverSourceControlled,
  popoverSourceModal,
  popoverSourceWith,
} from './popover.source';
import { createButton } from './button';
import { createCheckbox } from './checkbox';
import { createLabel } from './label';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import { checkPanelFollowsTrigger } from './floating-follow-probe';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Popover/States',
  parameters: {
    design: figmaDesign('popover'),
    actions: { disable: true },
    // `centered`, como as outras quatro. Era `padded` aqui e só aqui, e o quadro
    // ancorado no topo do canvas é o mesmo arranjo que a D0 corrigiu no
    // Playground: sem nada acima do gatilho, um painel que abre para cima abre
    // para fora da tela. Quem depende de espaço acima declara `padded` na
    // própria story — ver a `SideTop` das composições.
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          'Estados do Popover: fechado (painel fora do DOM), aberto, ' +
          'controlado por fora e com foco dentro do painel. Fechado o painel não é um ' +
          'elemento escondido — é um elemento que não existe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Uma linha "caixa + rótulo", no idioma que o `checkbox-compositions` já usa.
 *
 * O `htmlFor` é o que dá NOME ACESSÍVEL à caixa — sem ele o `getByRole`
 * ('checkbox', { name }) da play não acha nada, e a caixa chega ao leitor de
 * tela anônima.
 */
function buildOptionRow(id: string, label: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';

  const box = createCheckbox({ id });

  const text = createLabel({ text: label, htmlFor: id });
  text.classList.add('nds-cursor-pointer');

  row.append(box, text);
  return row;
}

function buildSimpleContent(text: string): HTMLElement {
  const c = document.createElement('div');
  c.className = 'nds-stack';
  c.dataset.spacing = 'xs';

  // As sub-fábricas emitem a classe E o `data-slot` que o conteúdo
  // compartilhado documenta — escrever os dois à mão era o que fazia o contrato
  // divergir quando um dos lados mudava.
  c.append(
    createPopoverTitle({ text: 'Configurações de exibição' }),
    createPopoverDescription({ text }),
  );
  return c;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    const el = createPopover({ trigger, content: buildSimpleContent('Conteúdo desmontado enquanto fechado.') });
    return empilharCentrado([el]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(panel()).toBeNull();
      await expect(trigger).toBeVisible();
    });

    await step('E o gatilho declara o estado nos dois contratos', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // Sem painel não há id para apontar — o atributo some, senão o axe
      // reprovaria por aria-valid-attr-value.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2'],
    // Override de story: o assunto é o painel JÁ aberto, e o snippet do meta
    // imprime o painel fechado, que é o padrão da fábrica.
    docs: { source: { transform: popoverSourceWith({ defaultOpen: true }) } },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    // `defaultOpen`, e não um clique encenado: o estado é o ASSUNTO desta story,
    // e a opção o declara. O clique já é medido pela `Playground` (C1), e era
    // só aqui — nas outras quatro — que ele abria esta story, deixando a mesma
    // story provando coisas diferentes conforme a stack.
    const el = createPopover({
      trigger,
      content: buildSimpleContent('Ajuste a aparência do conteúdo da página.'),
      defaultOpen: true,
    });
    return empilharCentrado([el]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });

    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (contraste e ARIA do painel) e que o
    // Chromatic fotografa.
    await step('O painel está aberto e declarado nos dois contratos', async () => {
      // SEM `open(trigger)`. A fixture clica quando `aria-expanded` ainda é
      // `false`, e aqui quem abre é o `defaultOpen` — num `setTimeout(0)`, porque
      // posicionar exige o gatilho já no layout. Se o clique começa antes do
      // timeout e o timeout dispara durante os `await` do `userEvent.click`, o
      // painel abre e o clique, ao chegar, o FECHA. Medido em 2026-09-17: a
      // story reprovava com "popover ainda fechado". Ela não interage — só
      // espera o estado que declara.
      await waitFor(() => {
        if (!panel()) throw new Error('popover ainda fechado');
      }, { timeout: 1500 });
      const p = panel()!;
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
    });

    await step('E é nomeado pelo título que ele mesmo carrega', async () => {
      const id = panel()!.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)?.textContent).toMatch(/Configurações de exibição/);
    });

    await step('Com o painel aberto, o gatilho deslocado e a página rolada reposicionam o painel junto dele', async () => {
      // O painel mora no `body` e o gatilho, no canvas: sem o acompanhamento de
      // `autoUpdateFloating` o painel ficava onde abriu. Quem se desloca é o
      // canvas inteiro, e não o botão — o botão anima `transform` na folha, e a
      // transição mediria a animação em vez do reposicionamento.
      await checkPanelFollowsTrigger(panel()!, canvasElement);
      // Reposicionar não anuncia nem fecha nada.
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

/**
 * Espião do `onOpenChange` da `Controlled`, no MÓDULO pelo mesmo motivo do
 * `focusedOpenChange` abaixo: é a play que conta os anúncios.
 */
const controlledOpenChange = fn();

/**
 * A política do consumidor da `Controlled`. Com `refuse`, o fechamento anunciado
 * NÃO é aplicado — o painel fica aberto e nada re-renderiza. É o estado que a
 * guarda `focusLossTarget` da fábrica precisa atravessar sem engolir o pedido
 * seguinte.
 */
const controlledPolicy = { refuse: false };

function controlledCloseCount(): number {
  return controlledOpenChange.mock.calls.filter(([isOpen]) => isOpen === false).length;
}

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item3'],
    // Override de story: o assunto é o comando de fora por `open()` mais o
    // `onOpenChange` que devolve o estado — duas linhas que o snippet do meta
    // não teria como adivinhar.
    docs: {
      source: { transform: popoverSourceControlled() },
    },
  },
  render: () => {
    const status = document.createElement('span');
    status.className = 'nds-text-caption nds-font-mono nds-text-muted-foreground';
    status.dataset.testid = 'estado';
    status.textContent = 'open=false';

    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });
    // Sem `size: 'sm'`: o botão pequeno mede 23px de altura e reprova na regra
    // target-size do axe (mínimo 24px). O alvo aqui é externo ao painel e fica
    // sozinho na coluna — não há motivo para encolhê-lo.
    //
    // O rótulo diz ABRIR, e não "alternar": até 2026-09-12 este botão encenava
    // um `trigger.click()`, e clique no gatilho é alternância — fechava o painel
    // que ele diz abrir. Quem comanda de fora chama o verbo, e o verbo desta
    // fábrica que ABRE é `open()`.
    const externalBtn = createButton({ variant: 'secondary', label: 'Abrir por código' });

    // CONTROLADO de verdade (`open: false`), como o PRD define a story: o painel
    // não guarda estado próprio, o gesto só ANUNCIA, e quem aplica é o consumidor
    // chamando `setOpen()`. Até 2026-09-17 esta story era não-controlada com um
    // observador, e o consumidor não tinha como RECUSAR um fechamento.
    const el: PopoverElement = createPopover({
      trigger,
      content: buildSimpleContent('Estado observado por fora via onOpenChange.'),
      open: false,
      onOpenChange: (open, reason) => {
        controlledOpenChange(open, reason);
        if (!open && controlledPolicy.refuse) return;
        el.setOpen(open);
        status.textContent = `open=${open}`;
      },
    });

    const externo = document.createElement('p');
    externo.className = 'nds-text-body nds-text-muted-foreground';
    externo.dataset.testid = 'area-externa';
    externo.textContent = 'Área externa';

    // `el.open()`, e não `trigger.click()`. Não é o gatilho escondido que o
    // portão acusa — este gatilho está à vista, e ele é a âncora do painel —,
    // mas encenar o clique de outra pessoa esconde a API pública de quem lê a
    // story e alterna quando o rótulo promete abrir. A guarda de "já aberto"
    // mora em `open()`, então não há espelho de estado aqui.
    //
    // Controlado, `open()` move o painel e NÃO anuncia — quem comandou já sabe —,
    // então o estado exibido é escrito por quem comanda.
    externalBtn.addEventListener('click', () => {
      el.open();
      status.textContent = 'open=true';
    });

    return empilharCentrado([status, externalBtn, el, externo]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });
    const externo = canvas.getByRole('button', { name: /abrir por código/i });

    await step('O botão externo abre o painel e o estado sai por onOpenChange', async () => {
      // Um clique só, e ele basta nas duas rodadas: `open()` é idempotente, e o
      // replay do painel Interactions parte do mesmo lugar sem a dança de
      // "clica para fechar antes de clicar para abrir" que o `trigger.click()`
      // exigia.
      await userEvent.click(externo);
      await waitFor(() => {
        if (!panel()) throw new Error('popover ainda fechado');
      }, { timeout: 1500 });
      await expect(canvas.getByTestId('estado')).toHaveTextContent('open=true');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar fora do painel fecha o popover', async () => {
      await open(trigger);
      await userEvent.click(canvas.getByTestId('area-externa'));
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 1500 });
      await expect(canvas.getByTestId('estado')).toHaveTextContent('open=false');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('No modo controlado, o foco levado para fora anuncia o fechamento uma vez, e o pedido seguinte também é anunciado', async () => {
      // O consumidor RECUSA: o fechamento é anunciado e não aplicado. A guarda
      // `focusLossTarget` da fábrica existe para o clique fora não repetir o
      // anúncio que a perda de foco já fez — e ela não pode engolir a perda de
      // foco SEGUINTE, depois de o foco ter voltado ao painel. `focus()`, e não
      // clique: o único caminho aqui é o foco.
      const p = await open(trigger);
      p.focus();
      await expect(p.contains(document.activeElement)).toBe(true);
      controlledPolicy.refuse = true;
      try {
        const closesBefore = controlledCloseCount();

        externo.focus();
        // Espera de RELÓGIO antes de contar: `waitFor` não prova que um segundo
        // anúncio NÃO chegou.
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(controlledCloseCount()).toBe(closesBefore + 1);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
        // Recusado: o painel continua de pé.
        await expect(panel()).not.toBeNull();

        // Repete a perda de foco: o foco volta ao painel e sai de novo.
        panel()!.focus();
        await expect(panel()!.contains(document.activeElement)).toBe(true);
        externo.focus();
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(controlledCloseCount()).toBe(closesBefore + 2);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
      } finally {
        controlledPolicy.refuse = false;
      }
    });

    await step('Estado final: painel aberto', async () => {
      await expect(await open(trigger)).toBeVisible();
    });
  },
};

/**
 * Espião do `onOpenChange` da `Focused`. Fica no MÓDULO, e não dentro do
 * `render`: criado lá, a play não teria como alcançá-lo. É ele que conta os
 * fechamentos e lê o motivo — o destino do foco sozinho não diz que o painel
 * fechou UMA vez, nem por quê.
 */
const focusedOpenChange = fn();

/** Fechamentos anunciados até agora — a play compara antes e depois. */
function focusedCloseCount(): number {
  return focusedOpenChange.mock.calls.filter(([isOpen]) => isOpen === false).length;
}

export const Focused: Story = {
  parameters: {
    covers: ['functional.item4'],
    // Override de story: o assunto é o foco entrar no primeiro focável, e o
    // snippet do meta mostra um painel só de texto, sem nenhum. Os vizinhos
    // "Antes" e "Depois" são andaime da story e NÃO entram: o snippet sai das
    // `args`, não do `render`.
    docs: { source: { transform: popoverSourceActions({ title: 'Confirmar alteração' }) } },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir popover' });

    // ─── Os vizinhos do gatilho: o que dá dentes à asserção de DESTINO ─────
    //
    // Sem outro focável ao lado do gatilho, "o foco voltou ao gatilho" passava
    // por acaso da composição: numa stack, a sentinela da lib mandava o foco ao
    // próximo focável depois do gatilho e, sem vizinho, dava a volta e caía no
    // próprio gatilho. Com um antes e um depois, um destino errado tem para
    // onde ir, e a asserção o vê. Tamanho padrão: o `sm` reprova no
    // `target-size` do axe.
    const before = createButton({ variant: 'ghost', label: 'Antes' });
    const after = createButton({ variant: 'ghost', label: 'Depois' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';

    const title = createPopoverTitle({ text: 'Confirmar alteração' });
    content.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'sm';
    actions.dataset.justify = 'end';
    // O Cancelar fecha o painel: a fábrica delega o clique em
    // `[data-slot="popover-close"]` e informa `close-button`.
    const cancelar = createButton({ variant: 'ghost', size: 'sm', label: 'Cancelar' });
    cancelar.dataset.slot = 'popover-close';
    // O Confirmar NÃO leva a marca: ele fecha por CÓDIGO depois de concluir, e o
    // motivo que chega ao `onOpenChange` é `api`. Marcá-lo faria "concluiu"
    // chegar ao relatório como "apertou o botão de fechar".
    const confirmar = createButton({ variant: 'default', size: 'sm', label: 'Confirmar' });
    actions.append(cancelar, confirmar);
    content.appendChild(actions);

    // Esta story NÃO abre na renderização: quem abre é a play, por clique. O
    // foco entra no painel em resposta ao gesto — abrir antes de o canvas estar
    // montado põe o foco num painel que o Storybook ainda vai reposicionar, e a
    // medição não veria a política, veria a corrida.
    const el = createPopover({ trigger, content, onOpenChange: focusedOpenChange });
    // Só depois da fábrica há um `close()` para chamar — o conteúdo é montado
    // antes dela existir.
    confirmar.addEventListener('click', () => el.close());

    // Na MESMA linha, em fluxo: a ordem de tabulação é Antes → gatilho → Depois.
    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'md';
    row.append(before, el, after);
    return empilharCentrado([row]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir popover/i });
    const before = canvas.getByRole('button', { name: /^antes$/i });

    // Espera de RELÓGIO antes de contar fechamentos: um segundo anúncio atrasado
    // não apareceria na primeira tentativa de um `waitFor`.
    const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

    await step('O foco entra no painel, no primeiro elemento focável', async () => {
      const p = await open(trigger);
      await waitFor(() => {
        if (!p.contains(document.activeElement)) throw new Error('foco não entrou no painel');
      });
      await expect(within(p).getByRole('button', { name: /cancelar/i })).toHaveFocus();
    });

    await step('No modo não-modal, o resto da página não é escondido', async () => {
      // O par do passo de mesmo assunto na story Modal: lá o resto da página
      // sai da árvore do leitor de tela; aqui o painel é conteúdo AO LADO, e
      // "Antes" continua alcançável. `closest` cobre o elemento e os ancestrais.
      await expect(panel()).not.toBeNull();
      await expect(before.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('Tab caminha entre os controles internos', async () => {
      const p = panel()!;
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(confirmar).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      //
      // O passo CHEGA ao botão por teclado, em vez de herdar o foco do passo
      // anterior: herdar faria a asserção depender da ordem dos passos.
      const p = await open(trigger);
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(confirmar).toHaveFocus();
      await expect(confirmar.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(confirmar).boxShadow).not.toBe('none');
    });

    await step('Do ÚLTIMO focável, Tab fecha o painel e devolve o foco ao gatilho', async () => {
      // Este é o par da asserção da story Modal, e é o que dá dentes às duas:
      // a MESMA tecla, no MESMO lugar, com resultado oposto conforme o modo.
      // Aqui, sem `modal`, o painel FECHA e o foco vai ao GATILHO; lá, com
      // `modal`, o foco VOLTA ao primeiro e o painel fica.
      //
      // Contrato da dona de 2026-09-17: o destino é o gatilho, nomeado. Os
      // vizinhos "Antes" e "Depois" são o que dá dentes ao destino, e o espião
      // diz que fechou UMA vez, como `overlay`.
      const p = await open(trigger);
      const confirmar = within(p).getByRole('button', { name: /confirmar/i });
      const closesBefore = focusedCloseCount();
      confirmar.focus();
      await userEvent.tab();
      await waitFor(() => {
        if (panel()) throw new Error('o painel continuou aberto depois do Tab para fora');
      });
      // O foco devolvido ao gatilho não pode somar um segundo fechamento pela
      // perda de foco (D15).
      await settle();
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(trigger);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Do PRIMEIRO focável, Shift+Tab fecha o painel e devolve o foco ao gatilho', async () => {
      // O outro sentido é asserção SEPARADA: o ramo compara com o primeiro ou
      // com o último conforme `shiftKey`, e um sentido pode quebrar sozinho.
      const p = await open(trigger);
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      const closesBefore = focusedCloseCount();
      cancelar.focus();
      await userEvent.tab({ shift: true });
      await waitFor(() => {
        if (panel()) throw new Error('o painel continuou aberto depois do Shift+Tab para fora');
      });
      await settle();
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(trigger);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o painel aberto, o foco levado por código para "Antes" fecha o painel e fica em "Antes"', async () => {
      // D15, decisão da dona de 2026-09-17: o painel não-modal fica aberto só
      // enquanto o foco está nele. `focus()`, e não clique — clicar em "Antes"
      // é clique fora, que fecha também pelo `click`; aqui o único caminho é o
      // foco. E o destino é de quem moveu: o foco NÃO volta ao gatilho.
      const p = await open(trigger);
      within(p).getByRole('button', { name: /cancelar/i }).focus();
      await expect(p.contains(document.activeElement)).toBe(true);
      const closesBefore = focusedCloseCount();
      before.focus();
      await waitFor(() => {
        if (panel()) throw new Error('o painel continuou aberto depois de o foco sair');
      });
      await settle();
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(before);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o painel aberto, clicar em "Antes" fecha o painel uma vez só', async () => {
      // D15: clique em elemento FOCÁVEL fora do painel aciona os dois caminhos
      // de uma vez — o `mousedown` move o foco (perda de foco) e o `click` chega
      // depois (clique fora). O contrato é UM fechamento. Clique de verdade, e
      // não `focus()`: é a combinação de foco e ponteiro que se mede.
      const p = await open(trigger);
      within(p).getByRole('button', { name: /cancelar/i }).focus();
      await expect(p.contains(document.activeElement)).toBe(true);
      const closesBefore = focusedCloseCount();
      await userEvent.click(before);
      await waitFor(() => {
        if (panel()) throw new Error('o painel continuou aberto depois do clique em "Antes"');
      });
      await settle();
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(before);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o foco dentro do painel, clicar no gatilho fecha uma vez só', async () => {
      // O gatilho conta como parte do painel: o aperto o foca antes de o `click`
      // chegar, e se ele contasse como "fora" o painel fecharia pelo foco e o
      // clique o alternaria de novo. O motivo do clique no gatilho é `overlay`
      // (§9 do PRD).
      //
      // CLIQUE COM PAUSA, e não `userEvent.click`: o sintético manda o `click`
      // antes da detecção de perda de foco das libs, e deixa o passo sem dentes.
      // Uma instância SÓ para apertar e soltar — duas chamadas soltas de
      // `userEvent.pointer` não geram `click`. O instrumento é o mesmo nas cinco.
      const p = await open(trigger);
      const cancelar = within(p).getByRole('button', { name: /cancelar/i });
      cancelar.focus();
      await expect(cancelar).toHaveFocus();
      const closesBefore = focusedCloseCount();
      const user = userEvent.setup();
      await user.pointer({ keys: '[MouseLeft>]', target: trigger });
      await new Promise((resolve) => setTimeout(resolve, 150));
      await user.pointer({ keys: '[/MouseLeft]', target: trigger });
      await waitFor(() => {
        if (panel()) throw new Error('o painel continuou aberto depois do clique no gatilho');
      });
      await settle();
      await expect(panel()).toBeNull();
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    // Termina ABERTA: é este estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open(trigger)).toBeVisible();
    });
  },
};

export const Modal: Story = {
  parameters: {
    // Override de story: o assunto é o modo modal, e o snippet do meta mostra
    // um painel só de texto — sem focável nenhum, não haveria prisão para ver.
    docs: {
      source: {
        transform: popoverSourceModal({ title: 'Popover modal', modal: true, defaultOpen: true }),
      },
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava, o painel se anuncia como diálogo modal e o resto da página fica escondido do leitor de tela. As quatro coisas andam juntas: anunciar que o resto da página está inerte sem prender o foco nem escondê-lo engana quem navega por leitor de tela.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir modal' });

    const content = document.createElement('div');
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';
    content.appendChild(createPopoverTitle({ text: 'Popover modal' }));

    // DOIS focáveis de propósito: com um só, "o Tab do último volta ao
    // primeiro" seria verdade sem laço nenhum — primeiro e último seriam o
    // mesmo elemento, e a asserção nasceria sem dentes.
    //
    // E são CAIXAS DE MARCAÇÃO, não um par Cancelar/Confirmar. O motivo é o
    // mesmo das outras quatro stacks, e ele vale aqui por tabela: lá o painel
    // não pode ter controle de fechar registrado — com um, quem prenderia o
    // foco seria a lib, e a story mediria a lib em vez deste laço —, e um
    // "Cancelar" que não cancela é botão que promete saída e não entrega.
    // Checkbox é controle que se basta: ele não promete nada além de marcar.
    //
    // Aqui a fábrica não tem essa restrição (não há lib), e até 2026-09-13 esta
    // story trazia o par funcionando. Padronizada com as outras por decisão da
    // dona: a story de um contrato tem de mostrar a mesma coisa nas cinco, e o
    // caminho de saída do modo modal já é medido pela story `CloseButton` e
    // pelo Escape, que continua aqui.
    const options = document.createElement('div');
    options.className = 'nds-stack';
    options.dataset.spacing = 'sm';
    options.append(
      buildOptionRow('popover-modal-remember', 'Lembrar minha escolha'),
      buildOptionRow('popover-modal-email', 'Receber aviso por e-mail'),
    );
    content.appendChild(options);

    const el = createPopover({ trigger, content, modal: true });
    return empilharCentrado([el]);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir modal/i });

    await step('O painel abre em modo modal e anuncia aria-modal', async () => {
      const p = await open(trigger);
      await expect(p).toBeVisible();
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(p).toHaveAttribute('aria-modal', 'true');

      // ─── C8, a trava de rolagem ─────────────────────────────────────────
      //
      // Nenhuma das cinco a media até 2026-09-16: `aria-modal` e o foco preso
      // tinham asserção, e o terceiro item dos três que `modal` promete JUNTOS
      // não tinha nenhuma. Aqui é a única stack em que a trava é legível em
      // código (`lockBodyScroll()` em `open()`); as outras quatro a recebem da
      // lib, e é por isso que esta asserção nasce aqui.
      await expect(document.body.style.overflow).toBe('hidden');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // Provar a prisão com `painel.contains(document.activeElement)` SEM
      // tabular não mede nada: o foco está dentro do painel no modo não-modal
      // também, nas cinco stacks — é o contrato `functional.item1`. Essa
      // asserção não pode reprovar, e é a forma exata da asserção que guarda o
      // bug; foi encontrada assim em duas stacks desta família.
      //
      // O par desta asserção está na story Focused, que é a não-modal: lá a
      // MESMA tecla, no MESMO lugar, tem de FECHAR o painel e levar o foco ao
      // gatilho.
      const p = panel()!;
      const firstBox = within(p).getByRole('checkbox', { name: 'Lembrar minha escolha' });
      const lastBox = within(p).getByRole('checkbox', { name: 'Receber aviso por e-mail' });

      lastBox.focus();
      await expect(lastBox).toHaveFocus();

      await userEvent.tab();

      await expect(p.contains(document.activeElement)).toBe(true);
      await expect(firstBox).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const p = panel()!;
      const firstBox = within(p).getByRole('checkbox', { name: 'Lembrar minha escolha' });
      const lastBox = within(p).getByRole('checkbox', { name: 'Receber aviso por e-mail' });

      firstBox.focus();
      await userEvent.tab({ shift: true });

      await expect(p.contains(document.activeElement)).toBe(true);
      await expect(lastBox).toHaveFocus();
    });

    // Sem peça de fechar no painel, o Escape é a ÚNICA saída — e com o foco
    // preso e a rolagem travada, um Escape que falhasse deixaria quem usa sem
    // caminho nenhum. Este passo entrou em 2026-09-13, junto com a troca do par
    // Cancelar/Confirmar pelas caixas: até então quem media a saída eram os
    // cliques nos dois botões, e removê-los sem pôr isto no lugar teria tirado
    // a asserção junto com o botão.
    await step('Sem peça de fechar, o Escape é a única saída — e ela funciona', async () => {
      const p = panel()!;
      await expect(within(p).queryByRole('button', { name: /cancelar|confirmar/i })).toBeNull();

      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      });
      // O foco volta ao gatilho: sem isso, quem fechou por teclado fica com o
      // foco no `body` e recomeça a navegação do topo da página.
      await expect(trigger).toHaveFocus();

      // E a rolagem DESTRAVA — o par da asserção do primeiro passo. A trava é
      // contada (`@/lib/scroll-lock`), e um fechamento que esquecesse de soltar
      // deixaria a página presa para sempre, sem erro e sem nada vermelho: foi
      // exatamente assim que a suíte do Sheet reprovou no dia em que a trava
      // passou a existir.
      await expect(document.body.style.overflow).not.toBe('hidden');
    });

    await step('Com o painel modal aberto, o resto da página fica escondido do leitor de tela, e volta ao fechar', async () => {
      // Decisão da dona de 2026-09-17: no modo modal, `aria-hidden="true"` nos
      // irmãos de cada ancestral do painel, sempre — esta story NÃO tem peça de
      // fechar, de propósito (D2), e é justamente o caso em que duas stacks só
      // escondiam com uma registrada.
      //
      // ANDAIME: um elemento de fora que JÁ tem `aria-hidden="false"`. Ele mora
      // direto no `body` para ser irmão do painel — é o que o algoritmo toca —, e
      // é o que dá dentes à restauração EXATA: uma que apagasse o atributo em
      // vez de devolver o de antes passaria no gatilho e reprova aqui.
      const marked = document.createElement('div');
      marked.dataset.testid = 'popover-modal-outside-marked';
      marked.setAttribute('aria-hidden', 'false');
      document.body.appendChild(marked);
      try {
        // O segundo elemento de fora, SEM o atributo: o gatilho. Anotado antes
        // de abrir, e medido com `closest`, que cobre ele e os ancestrais.
        await expect(trigger.hasAttribute('aria-hidden')).toBe(false);
        await expect(trigger.closest('[aria-hidden="true"]')).toBeNull();

        const p = await open(trigger);
        await expect(p).toHaveAttribute('aria-modal', 'true');
        await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
        await expect(marked).toHaveAttribute('aria-hidden', 'true');
        // O painel NÃO: nem ele nem ancestral dele.
        await expect(p.closest('[aria-hidden="true"]')).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => {
          if (panel()) throw new Error('popover ainda aberto');
        });
        await expect(trigger.hasAttribute('aria-hidden')).toBe(false);
        await expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
        await expect(marked.getAttribute('aria-hidden')).toBe('false');
      } finally {
        marked.remove();
      }
    });

    await step('Uma região viva fora do painel continua anunciando com o modal aberto', async () => {
      // A EXCEÇÃO do "esconder os outros", decidida pela dona em 2026-09-17: o
      // item 7 mandava esconder todo elemento de fora, e com isso um toast de
      // "salvo" ou de erro ficava MUDO com o painel modal aberto. Região viva
      // existe para ser anunciada sem receber foco; `aria-hidden` apaga o
      // anúncio. `markOthers` da base-ui e o pacote `aria-hidden` 1.2.6 pulam os
      // mesmos elementos — `[aria-live]` e `<script>`.
      //
      // ANDAIME: a região viva mora direto no `body` para ser IRMÃ do painel —
      // é o que o algoritmo toca. Removida no `finally`.
      const live = document.createElement('div');
      live.dataset.testid = 'popover-modal-outside-live';
      live.setAttribute('aria-live', 'polite');
      live.textContent = 'Alterações salvas.';
      document.body.appendChild(live);
      try {
        const p = await open(trigger);
        await expect(p).toHaveAttribute('aria-modal', 'true');

        // Nem ela nem ancestral dela — `closest` cobre os dois.
        await expect(live.hasAttribute('aria-hidden')).toBe(false);
        await expect(live.closest('[aria-hidden="true"]')).toBeNull();

        // O CONTRASTE, e é ele que dá sentido à asserção: um elemento comum de
        // fora CONTINUA escondido. Sem esta linha, uma exceção larga demais —
        // que não escondesse nada — passaria no passo.
        await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => {
          if (panel()) throw new Error('popover ainda aberto');
        });
        // Nada sobrou de nenhum dos dois lados.
        await expect(live.hasAttribute('aria-hidden')).toBe(false);
        await expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
      } finally {
        live.remove();
      }
    });

    // Termina ABERTA: é este estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open(trigger)).toBeVisible();
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
    // Override de story: o assunto é a limpeza, e a linha de `destroy()` é
    // justamente o que o snippet do meta não mostra.
    docs: {
      source: {
        transform: popoverSourceWith({
          triggerLabel: 'Abrir',
          text: 'Conteúdo do popover.',
          destroy: true,
        }),
      },
    },
  },
  render: () => probeHost(
    'Sonda de limpeza: o popover é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const content = document.createElement('p');
          content.textContent = 'Conteúdo do popover.';
          return createPopover({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            content: content,
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        portalSelector: '[data-slot="popover-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
