import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import { panel } from './popover.fixtures';
import {
  popoverSource,
  popoverClosedSource,
  popoverOpenSource,
  popoverControlledSource,
  popoverModalSource,
  popoverFocusedSource,
} from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/Popover/States',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: o estado aberto, o lado e o
      // deslocamento saem dos `args` de cada uma.
      source: { transform: popoverSource },
      description: {
        component:
          'Estados do Popover: fechado (painel fora do DOM), aberto e controlado por estado externo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO.
 *
 * Nem `userEvent.tab()` nem `userEvent.keyboard('{Tab}')` servem para medir um
 * laço de tabulação, e não é questão de preferência: os dois MOVEM O FOCO
 * primeiro e só então anunciam a tecla. Medido em 2026-09-03, com um ouvinte de
 * `keydown` em fase de CAPTURA na story `Modal`: no instante do `keydown`, o
 * `document.activeElement` já era o próximo elemento — e o alvo do evento
 * também.
 *
 * Um laço é implementado no `keydown`, e a condição dele é `activeElement ===
 * último`. Com o foco já movido, essa condição é falsa quando o laço roda: ele
 * nunca dispara, o foco segue para fora do painel, a camada de foco da lib o
 * puxa de volta para onde estava, e a asserção lê "não saiu do lugar" — que
 * parece defeito do componente e não é. Nenhum laço, de nenhuma stack, pode ser
 * medido por aqueles dois instrumentos.
 *
 * Despachar a tecla reproduz a ordem do teclado real — `keydown` primeiro,
 * movimento do foco depois —, e é justamente o movimento que o laço substitui.
 * Mesma saída que o gesto de arraste do drawer já usa neste repositório, e pelo
 * mesmo motivo: quando o atalho do runner não reproduz a sequência real,
 * despacha-se o evento.
 */
function pressTab(shift = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  });
  document.activeElement?.dispatchEvent(event);
  // Devolvido para a asserção de `defaultPrevented`: despachado à mão, o evento
  // não move o foco sozinho, então só ele prova que a tecla foi CANCELADA — sem
  // isso, num teclado real, o foco devolvido ao gatilho seguiria adiante.
  return event;
}

export const Closed: Story = {
  parameters: {
    docs: {
      source: { transform: popoverClosedSource },
      description: { story: 'Estado inicial — apenas o trigger é visível, Content não renderizado.' },
    },
  },
  args: {
    defaultOpen: false,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configurações de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(trigger).toBeVisible();
      await expect(panel()).toBeNull();
    });

    await step('E o gatilho declara o estado fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // A metade FECHADA do contrato D8: `aria-controls` só existe enquanto o
      // painel existe. Apontar para um id ausente reprova em
      // `aria-valid-attr-value` — e é o par desta asserção, na story `Open`,
      // que prova que o atributo aparece quando há para onde apontar.
      await expect(trigger).not.toHaveAttribute('aria-controls');
    });
  },
};

export const Open: Story = {
  parameters: {
    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (ARIA e contraste do painel) e que o
    // Chromatic fotografa.
    covers: ['accessibility.item1', 'accessibility.item2'],
    docs: {
      source: { transform: popoverOpenSource },
      description: { story: 'Popover aberto. Captura visual no Chromatic.' },
    },
  },
  args: {
    defaultOpen: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configurações de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('O painel abre já na primeira renderização', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('E o gatilho e o painel declaram o estado aberto', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
      // O painel é anunciado como diálogo e nomeado pelo título que carrega —
      // os dois contratos que o conteúdo compartilhado descreve para o estado
      // aberto.
      await expect(panel()).toHaveAttribute('role', 'dialog');
      await expect(panel()).toHaveAccessibleName(/Configurações de exibição/i);

      // ─── `aria-controls`, e a exceção que tinha PREMISSA FALSA ────────────
      //
      // Até 2026-09-16 esta story declarava que o atributo ficava de fora
      // porque a lib não o emitiria com o gatilho composto por snippet `child`,
      // e porque ele não estaria na lista de ARIA documentada. As DUAS metades
      // eram falsas: `accessibility.aria.controls` existe no conteúdo
      // compartilhado nos três idiomas e a D8 o fixa como contrato, e o estado
      // do gatilho publica `aria-controls` nas props que o snippet `child`
      // entrega — que o `Button` desta casa espalha no `<button>` nativo.
      // Não havia o que declarar; havia o que medir.
      //
      // E a premissa medida em 2026-09-17: o painel NASCIA SEM ID. O bits-ui
      // 2.19 gera o id do Content e o perde no `popper-layer.svelte`; o estado
      // do gatilho só publica `aria-controls` quando esse id é verdadeiro, e o
      // atributo não aparecia nunca. Quem escreve o id agora é o
      // `popover-content.svelte` — e o id é exigido NÃO VAZIO antes da
      // comparação, senão um `aria-controls=""` passaria contra um painel sem id.
      const panelId = panel()!.id;
      await expect(panelId).toBeTruthy();
      await expect(trigger).toHaveAttribute('aria-controls', panelId);
    });
  },
};

/**
 * A recusa do consumidor na `Controlled`. Fica no MÓDULO: a play liga e desliga,
 * e a story a lê por função, a cada pedido de fechar — ver `refuseClose` no
 * `PopoverStory.svelte`.
 */
let controlledRefusing = false;

export const Controlled: Story = {
  parameters: {
    docs: {
      source: { transform: popoverControlledSource },
      description: {
        story:
          'Abertura controlada externamente via `bind:open`. Escape fecha mesmo em modo controlado.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este popover é comandado por estado externo via bind:open.',
    saveLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
    // "Antes" é o elemento de fora que recebe o foco no passo da D15.
    neighbors: true,
    refuseClose: () => controlledRefusing,
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
    // Precondição do replay: uma rodada que morreu no meio da recusa deixaria o
    // consumidor recusando para sempre.
    controlledRefusing = false;

    const closed = async () => {
      await waitFor(
        () => {
          const d = body.queryByRole('dialog');
          if (d && d.getAttribute('data-state') !== 'closed') throw new Error('still open');
        },
        { timeout: 2000 }
      );
    };
    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog', { timeout: 2000 });
    };

    await step('O estado externo abre o painel na montagem', async () => {
      const dialog = await open();
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Escape fecha mesmo em modo controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await closed();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('No modo controlado, o foco levado para fora anuncia o fechamento uma vez, e o pedido seguinte também é anunciado', async () => {
      // D15 no modo CONTROLADO. Quem decide é o consumidor: o componente ANUNCIA
      // o fechamento, e só fecha se o estado de fora aceitar. O que se mede é
      // que o anúncio não é de mão única — recusado o primeiro, a perda de foco
      // seguinte tem de ser anunciada de novo, e não engolida por uma guarda que
      // já considera o painel fechado.
      //
      // Espera de RELÓGIO antes de contar: um segundo anúncio atrasado não
      // apareceria na primeira tentativa de um `waitFor`.
      const outside = canvas.getByRole('button', { name: /^Antes$/i });
      const spy = args.onOpenChange as ReturnType<typeof fn>;
      const closeCount = () => spy.mock.calls.filter(([isOpen]) => isOpen === false).length;

      const dialog = await open();
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('foco não entrou no painel');
      });
      controlledRefusing = true;
      try {
        const closesBefore = closeCount();

        outside.focus();
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(closeCount()).toBe(closesBefore + 1);
        await expect(spy).toHaveBeenLastCalledWith(false, 'overlay');
        // Recusado: o painel segue aberto, porque quem manda é o estado de fora.
        await expect(panel()).not.toBeNull();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');

        // A perda de foco se repete: o foco volta ao painel e sai de novo.
        within(panel()!).getByRole('button', { name: 'Cancelar' }).focus();
        outside.focus();
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(closeCount()).toBe(closesBefore + 2);
        await expect(spy).toHaveBeenLastCalledWith(false, 'overlay');
        await expect(panel()).not.toBeNull();
      } finally {
        controlledRefusing = false;
      }
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open()).toBeVisible();
    });
  },
};

/**
 * O foco entra, caminha e — do último — SAI: o painel fecha e o foco volta ao
 * GATILHO.
 *
 * É o par exato da `Modal`: a MESMA tecla, no MESMO lugar, com resultado oposto
 * conforme o modo. É esse contraste que dá dentes às duas, e uma asserção que
 * passasse nos dois modos não estaria medindo modo nenhum.
 */
export const Focused: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      source: { transform: popoverFocusedSource },
      description: {
        story:
          'O foco entra no painel ao abrir e caminha pelos controles internos. Sair com Tab a partir do último, ou com Shift+Tab a partir do primeiro, fecha o painel e devolve o foco ao gatilho; foco levado a outro elemento da página fecha o painel e fica onde foi posto. É o contrato não-modal, e o oposto do que a story Modal mede.',
      },
    },
  },
  args: {
    defaultOpen: false,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Confirmar alteração',
    // Sem descrição: o painel é só título e o par de ações, igual nas cinco.
    description: '',
    saveLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
    neighbors: true,
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
    const beforeButton = canvas.getByRole('button', { name: /^Antes$/i });
    // Fechamentos anunciados até agora — a CONTAGEM, não só a última chamada.
    // O espião vem das `args` e sobrevive ao replay: cada passo compara antes e
    // depois.
    const closeCount = (): number =>
      (args.onOpenChange as ReturnType<typeof fn>).mock.calls.filter(([isOpen]) => isOpen === false).length;

    // Tab REAL (`userEvent.tab`), devolvendo se a tecla foi cancelada. Nesta
    // stack a interceptação foca o gatilho DENTRO do `keydown`, e o `userEvent`
    // não reproduz o movimento nativo que viria depois: medido em 2026-09-17,
    // sem o `preventDefault` o foco continuou no gatilho e o destino passou.
    // Num teclado real, o Tab seguiria do gatilho adiante. Só o
    // `defaultPrevented` vê esse defeito aqui — lido em `window`, o último
    // degrau da bolha, depois de qualquer ouvinte do painel.
    const tabObservingPrevention = async (shift = false): Promise<boolean> => {
      let prevented = false;
      const observe = (event: KeyboardEvent) => {
        if (event.key === 'Tab') prevented = event.defaultPrevented;
      };
      window.addEventListener('keydown', observe);
      try {
        await userEvent.tab({ shift });
      } finally {
        window.removeEventListener('keydown', observe);
      }
      return prevented;
    };

    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog', { timeout: 2000 });
    };

    /**
     * Abre (se fechado) e espera o foco de abertura assentar DENTRO do painel.
     * A espera vem antes de qualquer `focus()` da play: o quadro que foca o
     * primeiro focável chegaria depois e desfaria a precondição.
     */
    const openSettled = async (): Promise<HTMLElement> => {
      const p = await open();
      await waitFor(() => {
        if (!p.contains(document.activeElement)) throw new Error('foco não entrou no painel');
      });
      return p;
    };

    // Espera de RELÓGIO antes de contar, e não `waitFor`: um segundo fechamento
    // ou uma reabertura chegam DEPOIS do primeiro, e um `waitFor` passaria na
    // primeira tentativa que visse o painel fechado.
    const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

    await step('O foco entra no painel, no primeiro elemento focável', async () => {
      // Esta story NÃO nasce aberta: o foco entra em resposta ao GESTO. Aberta
      // na montagem, o que se mediria era a corrida com o reposicionamento do
      // painel, e não a política de foco.
      const p = await openSettled();
      await expect(within(p).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    });

    await step('No modo não-modal, o resto da página não é escondido', async () => {
      // O par da asserção da `Modal`: sem este passo, esconder nos DOIS modos
      // passaria lá. Relógio antes de ler, porque quem esconderia o faria depois
      // de o painel montar.
      await openSettled();
      await settle();
      await expect(beforeButton.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('Tab caminha entre os controles internos', async () => {
      const inside = within(panel()!);
      const cancelButton = inside.getByRole('button', { name: 'Cancelar' });
      const confirmButton = inside.getByRole('button', { name: 'Confirmar' });
      cancelButton.focus();
      await userEvent.tab();
      await expect(confirmButton).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa, e vinda
      // do ponteiro o navegador não casaria a pseudo-classe. O passo CHEGA ao
      // botão por teclado, em vez de herdar o foco do passo anterior.
      const inside = within(await openSettled());
      const cancelButton = inside.getByRole('button', { name: 'Cancelar' });
      const confirmButton = inside.getByRole('button', { name: 'Confirmar' });
      cancelButton.focus();
      await userEvent.tab();
      await expect(confirmButton).toHaveFocus();
      await expect(confirmButton.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(confirmButton).boxShadow).not.toBe('none');
    });

    // ─── O contrato C3 como a dona o fixou em 2026-09-17 ─────────────────────
    //
    // Sair do painel com a tecla FECHA e devolve o foco ao GATILHO, nos dois
    // sentidos. Cada sentido tem as suas asserções de DESTINO, e nenhuma delas é
    // "o foco não está no painel": essa passava com o foco em qualquer lugar —
    // no `body`, fora do documento, num controle da página.
    //
    // O instrumento é `userEvent.tab()`, como nas outras quatro, e NÃO o
    // `pressTab` deste arquivo, que não move o foco sozinho — é por isso que
    // ele serve ao laço da `Modal`. Aqui o movimento nativo precisa poder
    // acontecer, para os vizinhos "Antes" e "Depois" terem como receber um
    // destino errado. O `defaultPrevented` continua afirmado, pelo motivo do
    // docblock de `tabObservingPrevention`.
    await step('Do ÚLTIMO focável, Tab fecha o painel e devolve o foco ao gatilho', async () => {
      // O destino é o gatilho, e não "Antes", não "Depois", não o `body`. E o
      // espião diz que fechou UMA vez, como `overlay` — contado depois de
      // `settle`: a tecla foca o gatilho, e um segundo fechamento pela perda de
      // foco chegaria depois do primeiro.
      const p = await openSettled();
      const confirmButton = within(p).getByRole('button', { name: 'Confirmar' });
      confirmButton.focus();
      await expect(confirmButton).toHaveFocus();
      const closesBefore = closeCount();

      const prevented = await tabObservingPrevention();

      await expect(prevented).toBe(true);
      await waitForPortalGone('dialog');
      await settle();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveFocus();
      // `overlay` é a palavra do vocabulário fechado para "saiu do painel sem
      // decidir nada" — a mesma do clique fora.
      await expect(closeCount()).toBe(closesBefore + 1);
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Do PRIMEIRO focável, Shift+Tab fecha o painel e devolve o foco ao gatilho', async () => {
      const p = await openSettled();
      const cancelButton = within(p).getByRole('button', { name: 'Cancelar' });
      cancelButton.focus();
      await expect(cancelButton).toHaveFocus();
      const closesBefore = closeCount();

      const prevented = await tabObservingPrevention(true);

      await expect(prevented).toBe(true);
      await waitForPortalGone('dialog');
      // Mesmo `settle` do passo anterior: um fechamento só, também daqui.
      await settle();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveFocus();
      await expect(closeCount()).toBe(closesBefore + 1);
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    // ─── D15: perda de foco FECHA, e o gatilho conta como painel ─────────────
    await step('Com o painel aberto, o foco levado por código para "Antes" fecha o painel e fica em "Antes"', async () => {
      // `focus()`, e não clique: clicar em "Antes" também é clique fora, e aqui
      // o que se mede é só a perda de foco.
      await openSettled();
      const closesBefore = closeCount();

      beforeButton.focus();

      await waitForPortalGone('dialog');
      await settle();
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // O destino é o que o código escolheu — não o gatilho, não o `body`.
      await expect(document.activeElement).toBe(beforeButton);
      await expect(closeCount()).toBe(closesBefore + 1);
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o painel aberto, clicar em "Antes" fecha o painel uma vez só', async () => {
      // D15: clique em elemento FOCÁVEL fora do painel aciona os dois caminhos
      // de uma vez — o aperto move o foco (perda de foco) e a camada de
      // interação da lib vê o clique fora. O contrato é UM fechamento. As
      // Playgrounds clicam num `<p>` não focável, que só passa pela interação;
      // este é o passo que exercita a soma.
      await openSettled();
      const closesBefore = closeCount();

      await userEvent.click(beforeButton);

      await waitForPortalGone('dialog');
      // Relógio antes de contar: `waitFor` não prova que um segundo anúncio NÃO
      // chegou — e a camada de interação da lib chega depois do foco.
      await settle();
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(document.activeElement).toBe(beforeButton);
      await expect(closeCount()).toBe(closesBefore + 1);
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o foco dentro do painel, clicar no gatilho fecha uma vez só', async () => {
      // O `pointerdown` foca o gatilho ANTES do `click`. Se o gatilho contasse
      // como fora, a perda de foco fecharia e o `click`, que alterna, reabriria.
      //
      // O clique é o de uma pessoa — botão apertado, uma pausa, botão solto —,
      // e não `userEvent.click`: no clique do instrumento o `click` chegava
      // ANTES da perda de foco, fechava, e a perda de foco achava o painel já
      // fechado — um fechamento só, e o passo verde medindo nada. As duas
      // metades na MESMA instância de `userEvent.setup()`: é ela que guarda o
      // botão apertado.
      const p = await openSettled();
      const cancelButton = within(p).getByRole('button', { name: 'Cancelar' });
      cancelButton.focus();
      await expect(cancelButton).toHaveFocus();
      const closesBefore = closeCount();

      const user = userEvent.setup();
      await user.pointer({ keys: '[MouseLeft>]', target: trigger });
      await new Promise((resolve) => setTimeout(resolve, 150));
      await user.pointer({ keys: '[/MouseLeft]', target: trigger });

      await waitForPortalGone('dialog');
      await settle();
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(closeCount()).toBe(closesBefore + 1);
      // `overlay`: clicar no gatilho de novo é sair sem decidir nada (§9).
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open()).toBeVisible();
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      source: { transform: popoverModalSource },
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava, o painel se anuncia como diálogo modal e o resto da página fica escondido do leitor de tela. As quatro coisas andam juntas: anunciar que o resto da página está inerte sem prender o foco nem escondê-lo engana quem navega por leitor de tela.',
      },
    },
  },
  args: {
    defaultOpen: true,
    modal: true,
    // `options` traz DOIS focáveis no painel. Com um só, "o Tab do último
    // volta ao primeiro" seria verdade sem laço nenhum — primeiro e último
    // seriam o mesmo elemento, e a asserção nasceria sem dentes.
    //
    // São DUAS CAIXAS, e não o rodapé de Cancelar/Salvar da `withTitle`:
    // aqueles dois botões não executavam ação nenhuma aqui, e não podiam
    // passar a executar — com um `PopoverClose` registrado no painel, o
    // gerenciador de foco da lib trapeia sozinho e a story mediria a lib em
    // vez do laço. Checkbox é controle que se basta. O porquê de a variante
    // ser nova está no comentário dela, no `PopoverStory.svelte`.
    variant: 'options',
    triggerLabel: 'Abrir modal',
    title: 'Popover modal',
    description: 'O foco fica preso no painel enquanto ele está aberto.',
  },
  play: async ({ canvasElement, step }) => {
    await step('O painel abre em modo modal', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
    });

    await step('O painel anuncia aria-modal', async () => {
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(panel()).toHaveAttribute('aria-modal', 'true');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // Provar a prisão com `dialog.contains(document.activeElement)` SEM
      // tabular não mede nada: o foco está dentro do painel no modo não-modal
      // também, em todas as stacks — é o contrato `functional.item1`. Essa
      // asserção não pode reprovar, e é a forma exata da asserção que guarda o
      // bug; foi encontrada assim em duas stacks desta família.
      //
      // O controle negativo de verdade é este: partir do ÚLTIMO focável e
      // apertar Tab. Não-modal, o painel FECHA e o foco vai ao GATILHO — as
      // duas asserções abaixo reprovam, e a story `Focused` afirma exatamente
      // esse destino; modal, o foco volta ao primeiro e o painel fica.
      //
      // O instrumento é o `pressTab` deste arquivo, e o docblock dele explica
      // por que `userEvent.tab()` e `userEvent.keyboard('{Tab}')` não podem medir
      // um laço de tabulação. Esta story nasceu com `tab()` e nunca tinha sido
      // executada, então o instrumento errado nunca tinha aparecido.
      //
      // Os dois focáveis são CAIXAS, e a consulta é por `role: 'checkbox'` com
      // o rótulo associado: o `Label` é quem nomeia o controle, então um
      // rótulo que se solte da caixa derruba a consulta em vez de passar
      // medindo um elemento sem nome.
      const dialog = panel()!;
      const inside = within(dialog);
      const remember = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const emailNotice = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      emailNotice.focus();
      await expect(emailNotice).toHaveFocus();

      pressTab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(remember).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const dialog = panel()!;
      const inside = within(dialog);
      const remember = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const emailNotice = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      remember.focus();
      // Mesmo instrumento e mesmo motivo do passo anterior.
      pressTab(true);

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(emailNotice).toHaveFocus();
    });

    // ─── A TERCEIRA das quatro coisas que `modal` liga ──────────────────────
    //
    // O C8 promete foco preso, rolagem travada, `aria-modal` e — desde
    // 2026-09-17 — o resto da página escondido do leitor de tela JUNTOS (a
    // quarta tem passo próprio, logo depois do fechamento), e até
    // 2026-09-16 a trava de rolagem não tinha asserção em stack NENHUMA: as
    // cinco `Modal` mediam `aria-modal` e o laço de Tab, e um terço do que o
    // modo promete não era cobrado em lugar nenhum. Varredura do mesmo dia:
    // `overflow`, `scrollLock`, `lockBodyScroll` e `body.style` tinham zero
    // ocorrências nos arquivos de story de popover das cinco.
    await step('Com o painel aberto, a página atrás NÃO rola', async () => {
      // Anunciar inércia sem travar a rolagem é promessa falsa: o leitor de
      // tela não alcança o que está atrás, mas a roda do mouse alcança.
      await expect(document.body.style.overflow).toBe('hidden');
    });

    await step('E ao fechar, a trava é SOLTA — ela não é só posta', async () => {
      // Sem peça de fechar no painel, o Escape é a única saída daqui — e é o
      // fechamento que prova a metade que faltava: trava que não solta deixa a
      // página inteira sem rolagem depois que o painel já saiu.
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      // Leitura PURA dentro da espera: a lib devolve o atributo `style` do
      // `body` inteiro, num tique próprio depois de remover o painel.
      await waitFor(() => {
        if (document.body.style.overflow === 'hidden') {
          throw new Error('a rolagem da página continua travada');
        }
      });
    });

    await step('Com o painel modal aberto, o resto da página fica escondido do leitor de tela, e volta ao fechar', async () => {
      // Decisão de 2026-09-17, igual nas cinco: modo modal esconde o resto da
      // página por `aria-hidden`, SEMPRE — a `Modal` não tem peça de fechar de
      // propósito (D2). Nesta stack quem esconde é `popover-hide-others.ts`: o
      // bits não tem `modal`.
      //
      // Dois elementos de fora, com papéis diferentes:
      //  - o GATILHO, sem atributo: fica escondido por um ancestral dele;
      //  - um `<div>` de andaime, filho direto do `<body>` e já com
      //    `aria-hidden="false"`. Direto no `<body>` porque é ali que o algoritmo
      //    escreve: marcado mais fundo, ninguém o tocaria e a restauração
      //    passaria sem medir nada. É o que dá dentes à restauração EXATA.
      const trigger = within(canvasElement).getByRole('button', { name: /Abrir modal/i });
      const hiddenAncestor = (el: Element): Element | null => el.closest('[aria-hidden="true"]');
      const marked = document.createElement('div');
      marked.setAttribute('aria-hidden', 'false');
      document.body.appendChild(marked);
      try {
        const triggerBefore = trigger.getAttribute('aria-hidden');
        await expect(hiddenAncestor(trigger)).toBeNull();

        await userEvent.click(trigger);
        const dialog = await waitForPortal('dialog', { timeout: 2000 });
        // Só LEITURA dentro do `waitFor`: o esconder nasce depois de o painel montar.
        await waitFor(() => {
          if (!hiddenAncestor(trigger)) throw new Error('o gatilho, fora do painel, não ficou escondido');
        }, { timeout: 2000 });
        await expect(hiddenAncestor(dialog)).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
        await waitFor(() => {
          if (marked.getAttribute('aria-hidden') !== 'false') {
            throw new Error(`o elemento marcado voltou com aria-hidden=${String(marked.getAttribute('aria-hidden'))}`);
          }
        }, { timeout: 2000 });
        await expect(trigger.getAttribute('aria-hidden')).toBe(triggerBefore);
        await expect(hiddenAncestor(trigger)).toBeNull();
        await expect(marked).toHaveAttribute('aria-hidden', 'false');
        // Andaime de TEMPO, não asserção deste passo: a trava de rolagem da lib
        // também põe `pointer-events: none` no `<body>` e só o devolve num tique
        // próprio depois do fechamento (`internal/body-scroll-lock.svelte.js`).
        // O passo final clica no gatilho, e antes deste passo quem esperava a
        // trava soltar era o passo anterior. Leitura pura dentro da espera.
        await waitFor(() => {
          if (document.body.style.pointerEvents === 'none' || document.body.style.overflow === 'hidden') {
            throw new Error('a trava da página não soltou depois do fechamento');
          }
        });
      } finally {
        marked.remove();
      }
    });

    await step('Uma região viva fora do painel continua anunciando com o modal aberto', async () => {
      // A especificação do item 7 dizia "todo elemento fora do painel", e estava
      // INCOMPLETA: região viva escondida é o toast que anuncia "salvo" ficando
      // mudo enquanto o painel está aberto. Esta stack já fazia certo — foi a
      // medição dela que corrigiu a especificação —, e certo sem asserção é
      // certo até a próxima refatoração. Este passo é o portão.
      //
      // Aqui a exceção é NOSSA, e por isso o portão vale mais: o
      // `popover-hide-others.ts` põe região viva e `script` na lista de alvos
      // preservados, ao lado do painel, e nada além deste passo cobra isso.
      //
      // Os três andaimes são filhos diretos do `<body>` porque é ali que o
      // algoritmo escreve, e o CONTRASTE com o irmão comum é o que dá sentido às
      // asserções: sem ele, um algoritmo que não escondesse nada passaria neste
      // passo com louvor.
      //
      // ─── O SEGUNDO ANDAIME, e por que ele existe ───────────────────────────
      //
      // Medido em 2026-09-17 com uma sonda de sete elementos: a exceção desta
      // stack era só por ATRIBUTO. `[aria-live]` e `<script>` eram pulados, e os
      // seis papéis que IMPLICAM região viva — `status`, `alert`, `log`,
      // `progressbar`, `marquee`, `timer` — eram escondidos quando vinham SEM
      // `aria-live` explícito. Como `role="status"` e `role="alert"` têm
      // `aria-live` implícito pela ARIA, o toast marcado apenas pelo papel, que é
      // a forma mais comum, emudecia com o painel modal aberto.
      //
      // O algoritmo aqui é NOSSO (`popover-hide-others.ts`), então a lista foi
      // alargada para a das outras três stacks que também o implementam, e este
      // passo é o portão dos dois caminhos: o andaime de ATRIBUTO
      // (`aria-live="polite"`) e o de PAPEL (`role="status"` sem `aria-live`).
      const trigger = within(canvasElement).getByRole('button', { name: /Abrir modal/i });
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.textContent = 'Alterações salvas.';
      // De propósito SEM `aria-live`: é o papel, e só ele, que tem de bastar.
      const roleOnlyLiveRegion = document.createElement('div');
      roleOnlyLiveRegion.setAttribute('role', 'status');
      roleOnlyLiveRegion.textContent = 'Rascunho salvo automaticamente.';
      const plainSibling = document.createElement('div');
      plainSibling.textContent = 'Texto comum fora do painel.';
      document.body.append(liveRegion, roleOnlyLiveRegion, plainSibling);
      const isHidden = (el: Element): boolean => el.getAttribute('aria-hidden') === 'true';
      const hiddenAncestorOf = (el: Element): Element | null =>
        el.parentElement?.closest('[aria-hidden="true"]') ?? null;
      try {
        await userEvent.click(trigger);
        const dialog = await waitForPortal('dialog', { timeout: 2000 });

        // Só LEITURA dentro do `waitFor`: o esconder nasce depois de o painel montar.
        await waitFor(() => {
          if (!isHidden(plainSibling)) {
            throw new Error('o elemento comum fora do painel não ficou escondido');
          }
        }, { timeout: 2000 });

        // A região viva não foi escondida — nem ela, nem nenhum ancestral dela.
        // As duas asserções levam MENSAGEM porque a `Modal` tem outro passo que
        // mede `aria-hidden` logo acima: sem ela, o relato de falha das duas é
        // indistinguível, e portão que não se identifica custa uma investigação.
        await expect(
          isHidden(liveRegion),
          'a região viva fora do painel foi escondida com o modal aberto',
        ).toBe(false);
        await expect(
          hiddenAncestorOf(liveRegion),
          'um ancestral da região viva fora do painel foi escondido com o modal aberto',
        ).toBeNull();

        // E a região viva marcada SÓ pelo papel, que é o andaime novo.
        await expect(
          isHidden(roleOnlyLiveRegion),
          'a região viva marcada só por role="status" foi escondida com o modal aberto',
        ).toBe(false);
        await expect(
          hiddenAncestorOf(roleOnlyLiveRegion),
          'um ancestral da região viva marcada só por role="status" foi escondido',
        ).toBeNull();

        await expect(hiddenAncestorOf(dialog)).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
        // Nada sobrou: o irmão comum volta SEM atributo, que é como chegou.
        await waitFor(() => {
          if (plainSibling.hasAttribute('aria-hidden')) {
            throw new Error('o elemento comum continuou escondido depois de fechar');
          }
        }, { timeout: 2000 });
        await expect(liveRegion.hasAttribute('aria-hidden')).toBe(false);
        await expect(roleOnlyLiveRegion.hasAttribute('aria-hidden')).toBe(false);
        // Mesmo andaime de TEMPO do passo anterior, e pelo mesmo motivo: o passo
        // final clica no gatilho, e a trava da lib só devolve `pointer-events` ao
        // `<body>` num tique próprio depois do fechamento. Leitura pura.
        await waitFor(() => {
          if (document.body.style.pointerEvents === 'none' || document.body.style.overflow === 'hidden') {
            throw new Error('a trava da página não soltou depois do fechamento');
          }
        });
      } finally {
        liveRegion.remove();
        roleOnlyLiveRegion.remove();
        plainSibling.remove();
      }
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto, e a trava de volta', async () => {
      const trigger = within(canvasElement).getByRole('button', { name: /Abrir modal/i });
      await userEvent.click(trigger);
      await expect(await waitForPortal('dialog', { timeout: 2000 })).toBeVisible();
      await waitFor(() => {
        if (document.body.style.overflow !== 'hidden') {
          throw new Error('a trava não voltou ao reabrir');
        }
      });
    });
  },
};
