import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';
import { balaoDe, wait, waitForBubble } from './tooltip.fixtures';
import { tooltipOpenSource, tooltipControlledSource, tooltipSource } from './tooltip.source';

import { figmaDesign } from '@shared/figma/design-links';
// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const LONG_DELAY = 600;

/**
 * A espera PADRÃO do provedor, em ms: 300, fixada pela dona em 2026-09-12 para
 * as cinco stacks (D5 do PRD do tooltip).
 *
 * A story `Hover (provider default)` é o único ponto desta stack que a mede.
 * Todas as outras passam um valor próprio, então um provedor que voltasse a
 * abrir na hora — ou que herdasse 600 de alguma configuração de biblioteca,
 * como aconteceu no Angular — passaria por todas elas sem uma falha.
 */
const DEFAULT_DELAY = 300;

// A pausa de relógio e a espera pelo balão moram em `tooltip.fixtures.ts`: a
// cena de grupo, no arquivo de composições, faz a mesma pergunta, e duas cópias
// de uma medida de tempo são duas versões de uma regra só.

const meta: Meta = {
  title: 'Components/Overlay/Tooltip/States',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('tooltip'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; as duas que ensinam a
      // abertura sobrescrevem com a sua própria marcação logo abaixo.
      source: { transform: tooltipSource },
      description: {
        component:
          'Fechado é o padrão e o balão nem existe no DOM. Aberto pode vir do estado externo, do hover (depois do delay) ou do foco (imediato). Levar o mouse do gatilho até o balão não fecha nada — é a persistência que a WCAG 1.4.13 exige.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const baseArgs = {
  variant: 'default' as const,
  triggerLabel: 'Salvar',
  ariaLabel: 'Salvar',
  contentText: 'Salvar (Ctrl+S)',
};

export const Closed: Story = {
  args: { ...baseArgs, defaultOpen: false, delayDuration: 200 },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O balão não está no DOM, nem no canvas nem no portal', async () => {
      await expect(trigger).toBeVisible();
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
      await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    await step('Sem balão, não há describedby apontando para o vazio', async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  name: 'Open (defaultOpen)',
  // Sem `delayDuration`: quem abre esta cena é o ESTADO INICIAL, que não passa
  // pelo temporizador do ponteiro — nenhum passo da play faz hover, então o `0`
  // que morava aqui era arg morto. Arg morto de espera é o resíduo que a D5 do
  // PRD condena: ele não muda a cena e ensina espera desligada a quem lê.
  args: { ...baseArgs, defaultOpen: true },
  parameters: { docs: { source: { transform: tooltipOpenSource } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O estado inicial abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('E o gatilho passa a apontar para ele', async () => {
      const target = document.getElementById(trigger.getAttribute('aria-describedby')!);
      await expect(balaoDe(trigger)!.contains(target)).toBe(true);
    });

    await step('A abertura foi IMEDIATA, e o primitivo diz isso em data-state', async () => {
      // O primitivo publica dois valores de abertura — imediata e por espera —
      // e esta story não afirmava nenhum: passava com qualquer um. Abrir pelo
      // estado inicial não passa pelo temporizador, então aqui só pode ser a
      // imediata; a outra metade do par é medida pela `Hover (provider
      // default)`, que exige o valor de espera.
      await expect(balaoDe(trigger)).toHaveAttribute('data-state', 'instant-open');
      await expect(trigger).toHaveAttribute('data-state', 'instant-open');
    });
  },
};

export const Hover: Story = {
  args: { ...baseArgs, defaultOpen: false, delayDuration: LONG_DELAY },
  parameters: { covers: ['functional.item1'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O mouse passando não abre — o delay separa passar de parar', async () => {
      await userEvent.hover(trigger);
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois do delay', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: LONG_DELAY * 5 },
      );
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });
  },
};

/**
 * O padrão do provedor, medido: o balão não aparece antes dos 300 ms de hover,
 * e aparece depois.
 *
 * É a única story que NÃO passa `delayDuration`. O andaime repassa `undefined`,
 * o padrão do `TooltipProvider` vale, e é ele que está sob asserção — passar
 * `300` aqui mediria esta linha em vez do primitivo.
 */
export const HoverDefaultDelay: Story = {
  name: 'Hover (provider default)',
  args: { ...baseArgs, defaultOpen: false },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });
    let hoverStart = 0;

    await step('O padrão de 300 ms é o que chega ao gatilho', async () => {
      // `data-delay-duration` é escrito pela lib no gatilho com a espera que ela
      // RESOLVEU — a do tooltip, e na falta dela a do provedor. O relógio abaixo
      // prova que existe espera; este passo prova QUAL, e sem ele um 600 herdado
      // de configuração de biblioteca passaria batido, que é exatamente a forma
      // silenciosa de divergência que esta decisão foi consertar.
      await expect(trigger).toHaveAttribute('data-delay-duration', String(DEFAULT_DELAY));
    });

    await step('O ponteiro que chega não abre nada — a contagem começa', async () => {
      hoverStart = performance.now();
      await userEvent.hover(trigger);
      // Zero abriria AQUI. Era o valor antigo desta stack.
      await expect(balaoDe(trigger)).toBeNull();

      await wait(DEFAULT_DELAY / 2);
      // A releitura no meio da contagem só vale enquanto a contagem corre: se a
      // máquina engasgar e o relógio já tiver passado dos 300 ms, o balão pode
      // ter aberto legitimamente. O defeito que este passo procura — abrir na
      // hora — já foi pego pela leitura imediatamente após o hover.
      if (performance.now() - hoverStart < DEFAULT_DELAY) {
        await expect(balaoDe(trigger)).toBeNull();
      }
    });

    await step('Parado sobre o gatilho, o balão abre depois dos 300 ms', async () => {
      const opened = await waitForBubble(trigger, DEFAULT_DELAY * 8);
      const elapsed = performance.now() - hoverStart;
      await expect(opened).toBe(true);
      // O piso é o que separa "esperou" de "abriu na hora": com o padrão em
      // zero, o balão já estaria aberto na primeira leitura e o decorrido seria
      // de alguns milissegundos. A folga de 20% absorve a granularidade do laço.
      await expect(elapsed).toBeGreaterThanOrEqual(DEFAULT_DELAY * 0.8);
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
      // E o primitivo diz que a abertura veio do TEMPORIZADOR. É o par da
      // `Open (defaultOpen)`, que exige o valor imediato: com só um dos dois,
      // `data-state` seria atributo que ninguém confere.
      await expect(balaoDe(trigger)).toHaveAttribute('data-state', 'delayed-open');
    });
  },
};

export const KeyboardFocus: Story = {
  name: 'Keyboard focus (no delay)',
  args: { ...baseArgs, defaultOpen: false, delayDuration: LONG_DELAY },
  parameters: { covers: ['functional.item2'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O foco abre na hora, mesmo com o provider pedindo espera', async () => {
      // Quem chega por teclado não tem como "parar em cima": esperar o delay
      // aqui seria o mesmo que esconder a informação de quem não usa mouse.
      trigger.blur();
      trigger.focus();
      await expect(trigger).toHaveFocus();

      // Medido por RELÓGIO, e com TETO. O `waitFor` que estava aqui tinha prazo
      // default de 1000 ms contra um provedor pedindo 600: se o foco passasse a
      // respeitar a espera do hover, o balão abriria aos 600 e a asserção
      // continuaria verde — portão sem dentes justamente para a regra que esta
      // story existe para provar.
      const focusStart = performance.now();
      const opened = await waitForBubble(trigger, LONG_DELAY * 3);
      const elapsed = performance.now() - focusStart;
      await expect(opened).toBe(true);
      await expect(elapsed).toBeLessThan(LONG_DELAY / 2);
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });

    await step('Sair do gatilho fecha o balão', async () => {
      trigger.blur();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
    });
  },
};

/** O centro de um elemento, em coordenada de viewport. */
function centerOf(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Um passo de ponteiro DITADO por coordenada.
 *
 * `userEvent.hover(balao)` não serve aqui, e o motivo é D2 do PRD: a folha
 * compartilhada deixa o balão `pointer-events: none`, e o hover sintético sobre
 * um nó assim chega com `clientX/clientY` em 0,0 — mediria o ponteiro no canto
 * da tela, não sobre o balão. A área de tolerância entre gatilho e balão é
 * calculada por COORDENADA, então é coordenada que o teste precisa fornecer.
 */
function pointerAt(
  target: EventTarget,
  type: 'pointermove' | 'pointerleave',
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: x,
      clientY: y,
      // `pointerleave` não borbulha na vida real, e o ouvinte da lib está no
      // próprio nó; `pointermove` é ouvido no documento.
      bubbles: type === 'pointermove',
      cancelable: true,
    }),
  );
}

export const PersistenceInBubble: Story = {
  args: {
    ...baseArgs,
    defaultOpen: false,
    delayDuration: 0,
    triggerLabel: 'Compartilhar',
    ariaLabel: 'Compartilhar',
    contentText: 'Cria um link público de leitura',
    variant: 'longText' as const,
  },
  parameters: { covers: ['functional.item4'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /compartilhar/i });

    await step('O hover abre o balão', async () => {
      // Ponteiro, e não foco: o que se mede aqui é o TRAJETO do ponteiro do
      // gatilho até o balão, e ele precisa começar sobre o gatilho.
      trigger.blur();
      await userEvent.hover(trigger);
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('Levar o ponteiro até o balão não fecha nada', async () => {
      const balao = balaoDe(trigger)!;
      const exitPoint = centerOf(trigger);
      const bubbleCenter = centerOf(balao);

      // Sair do gatilho sem dizer para onde é o que ARMA a tolerância: a lib
      // guarda o ponto de saída e passa a decidir pelo próximo movimento.
      pointerAt(trigger, 'pointerleave', exitPoint.x, exitPoint.y);
      // E o ponteiro chega ao balão por coordenada, que é o que a tolerância lê.
      pointerAt(document, 'pointermove', bubbleCenter.x, bubbleCenter.y);

      // 400 ms cobre com folga as duas saídas automáticas da lib — o quadro
      // seguinte e a janela de intenção de trânsito. Se a coordenada não fosse
      // reconhecida como "cheguei ao balão", o balão teria fechado aqui.
      await wait(400);
      await expect(balaoDe(trigger)).not.toBeNull();
    });

    await step('Levar o ponteiro para longe FECHA — a tolerância tem limite', async () => {
      // O par com o passo anterior é o que impede a asserção de passar por
      // acidente: se a tolerância nunca fechasse, "continua aberto" não
      // provaria nada. Sem este passo, tolerância infinita passa.
      const balao = balaoDe(trigger)!;
      const exitPoint = centerOf(balao);
      pointerAt(balao, 'pointerleave', exitPoint.x, exitPoint.y);
      pointerAt(document, 'pointermove', 0, 0);

      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
    });
  },
};

export const Controlled: Story = {
  name: 'Controlled (open prop)',
  // Mesma razão da `Open (defaultOpen)`: a abertura vem do estado EXTERNO e
  // nenhum passo toca em ponteiro, então a espera nunca corre nesta cena. Quem
  // ainda passa `0` nesta stack é a `PersistenceInBubble`, e lá há ponteiro de
  // verdade — é a diferença entre desligar a espera por necessidade e por
  // resíduo.
  args: { ...baseArgs, open: true },
  parameters: { docs: { source: { transform: tooltipControlledSource } } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O estado externo abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });

    await step('Escape fecha o balão mantendo o foco onde estava', async () => {
      trigger.focus();
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
      await expect(trigger).toHaveFocus();
    });
  },
};
