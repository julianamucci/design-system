import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createTooltip, SHOW_DELAY } from './tooltip';
import { balaoDe, clearPortal, wrap } from './tooltip.fixtures';
import { tooltipSource, tooltipSourceWith } from './tooltip.source';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import { checkPanelFollowsTrigger } from './floating-follow-probe';
import tooltipTranslations from '@shared/content/tooltip/translations.json';

import { figmaDesign } from '@shared/figma/design-links';
// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois da espera interna) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/**
 * A espera que o CONTEÚDO COMPARTILHADO declara, em ms.
 *
 * Sai do JSON, e não de um número escrito aqui: a decisão é da dona e vale para
 * as cinco stacks. Um número copiado para esta linha continuaria verde no dia em
 * que a decisão mudasse — que é exatamente como o 600 do angular sobreviveu, sem
 * estar escrito em lugar nenhum do repositório para alguém comparar.
 */
const DECLARED_DELAY = Number(tooltipTranslations['pt-BR'].props.table.delay.default);

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Quanto tempo, a partir de `start`, levou para `condition()` ficar verdadeira.
 *
 * NÃO É `waitFor`, e a diferença é a armadilha desta casa: o `waitFor` da suíte
 * reagenda por observador de mutação, então uma condição que MEXE no DOM provoca
 * a própria tentativa seguinte — o prazo nunca chega, o navegador crava um
 * núcleo e o arquivo morre sem resultado nem falha. Aqui a condição é leitura
 * pura e a espera é de relógio, com prazo que ESTOURA em erro nomeado.
 *
 * O relógio é marcado por quem chama, antes do gesto, porque o que se mede é o
 * tempo desde o hover — não desde o começo da espera.
 */
async function openedAfter(
  condition: () => boolean,
  start: number,
  deadline: number,
): Promise<number> {
  for (;;) {
    const elapsed = performance.now() - start;
    if (condition()) return elapsed;
    if (elapsed > deadline) {
      throw new Error(`nada abriu em ${Math.round(elapsed)}ms (prazo de ${deadline}ms)`);
    }
    await wait(8);
  }
}

/** Põe o ponteiro no centro de um elemento e devolve a coordenada usada. */
function mover(target: HTMLElement): { x: number; y: number } {
  const r = target.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  return { x, y };
}

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Tooltip/States',
  parameters: {
    design: figmaDesign('tooltip'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          'Fechado é o padrão e o balão nem existe no DOM. Aberto vem do hover (depois da espera interna da factory) ou do foco (imediato). Levar o mouse do gatilho até o balão não fecha nada — é a persistência que a WCAG 1.4.13 exige. NOTA: a factory usa uma espera interna fixa por instância; não há Provider compartilhado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    return wrap(createTooltip({ trigger, content: 'Salvar (Ctrl+S)' }));
  },
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
      // A factory escrevia o atributo na montagem, muito antes de existir balão:
      // id ausente é violação de `aria-valid-attr-value` no axe, e uma descrição
      // que o leitor de tela procura e não acha.
      await expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O balão abre e traz o papel e o slot do contrato', async () => {
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await expect(balao).toHaveAttribute('data-state', 'open');
      await expect(balao).toBeVisible();
    });

    await step('E o gatilho passa a apontar para ele', async () => {
      const id = trigger.getAttribute('aria-describedby');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(balaoDe(trigger));
    });

    await step('Com o painel aberto, o gatilho deslocado e a página rolada reposicionam o painel junto dele', async () => {
      // O balão mora no `body` e o gatilho, no canvas: sem o acompanhamento de
      // `autoUpdateFloating` o balão ficava onde abriu. Quem se desloca é o
      // canvas, e não o botão — o botão anima `transform` na folha.
      const balao = balaoDe(trigger)!;
      await checkPanelFollowsTrigger(balao, canvasElement);
      // Reposicionar não fecha nem troca o balão, e o foco fica onde estava.
      await expect(balaoDe(trigger)).toBe(balao);
      await expect(document.activeElement).toBe(trigger);
    });

    await step('Cleanup antes do postVisit', async () => {
      clearPortal();
    });
  },
};

export const Hover: Story = {
  parameters: { covers: ['functional.item1'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    return wrap(createTooltip({ trigger, content: 'Salvar (Ctrl+S)' }));
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O mouse passando não abre — a espera separa passar de parar', async () => {
      trigger.blur();
      await userEvent.hover(trigger);
      await expect(balaoDe(trigger)).toBeNull();

      // O PISO, e sem ele esta story passava com abertura instantânea: o teto do
      // passo seguinte só diz "abriu em algum momento", e balão que nasce na
      // hora cabe nele com folga. Ainda fechado a 0,9× da espera é o que prova
      // que HÁ espera — com zero, todo movimento do ponteiro por uma barra de
      // ferramentas acenderia balão.
      await wait(DECLARED_DELAY * 0.9);
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois da espera', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: DECLARED_DELAY * 8 },
      );
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });

    await step('Cleanup antes do postVisit', async () => {
      clearPortal();
    });
  },
};

/**
 * O VALOR da espera padrão, medido em relógio, com piso e teto.
 *
 * A `Hover` acima prova que existe espera; esta prova que a espera é ESTA. As
 * três pernas reprovam defeitos diferentes:
 *
 *   · o número que o código declara é o mesmo que o conteúdo compartilhado
 *     publica na tabela de props — código e documentação não podem divergir em
 *     silêncio, que era o estado das cinco stacks antes de 2026-09-12;
 *   · o balão não aparece antes de 0,9× a espera (prova que HÁ espera);
 *   · e aparece antes de 1,7× (prova que a espera é a da casa, e não a de uma
 *     biblioteca, que nem sob carga cabe nesse teto).
 *
 * A margem é proporcional, e não um ponto fixo: prazo fixo compete com o relógio
 * do navegador e erra para o lado da intermitência.
 */
export const HoverDefaultDelay: Story = {
  parameters: {
    covers: ['functional.item1'],
    // Transform PRÓPRIO: herdar o do meta faz o painel Code publicar o exemplo
    // de outra story e acertar por coincidência. Aqui a ausência de
    // `delayDuration` no snippet é a lição — quem copia herda a espera da casa.
    docs: { source: { transform: tooltipSourceWith({ content: 'Salvar (Ctrl+S)' }) } },
  },
  render: () => {
    // Sem `delayDuration`: a espera é a da fábrica, que é justamente o assunto.
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    return wrap(createTooltip({ trigger, content: 'Salvar (Ctrl+S)' }));
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O que o código declara é o que a documentação publica', async () => {
      await expect(SHOW_DELAY).toBe(DECLARED_DELAY);
    });

    await step('Sem espera escrita, o balão abre na que a casa declara', async () => {
      // O relógio parte ANTES do gesto: o que se mede é o tempo entre levar o
      // ponteiro ao gatilho e o balão existir.
      const start = performance.now();
      await userEvent.hover(trigger);
      const elapsed = await openedAfter(
        () => balaoDe(trigger) !== null,
        start,
        DECLARED_DELAY * 8,
      );

      await expect(elapsed).toBeGreaterThanOrEqual(DECLARED_DELAY * 0.9);
      await expect(elapsed).toBeLessThan(DECLARED_DELAY * 1.7);
    });

    await step('E o que abriu é o balão do contrato, no lado padrão', async () => {
      // A prova sem relógio, ao lado da medição: o nó que apareceu no portal é o
      // do contrato — papel, slot e estado —, e o lado é o padrão da fábrica.
      // Sem isto, a medição acima passaria por acidente se qualquer outro nó
      // tivesse sido montado no `body` dentro da janela de tempo.
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-state', 'open');
      await expect(balao).toHaveAttribute('data-side', 'top');
    });

    await step('Cleanup antes do postVisit', async () => {
      trigger.blur();
      clearPortal();
    });
  },
};

export const KeyboardFocus: Story = {
  name: 'Keyboard focus',
  parameters: { covers: ['functional.item2'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', 'aria-label': 'Salvar' });
    return wrap(createTooltip({ trigger, content: 'Salvar (Ctrl+S)' }));
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O foco abre na hora, sem a espera do hover', async () => {
      // Quem chega por teclado não tem como "parar em cima": esperar aqui seria
      // o mesmo que esconder a informação de quem não usa mouse.
      trigger.blur();
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await expect(balaoDe(trigger)).not.toBeNull();
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

export const PersistenceInBubble: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      source: {
        transform: tooltipSourceWith({
          triggerLabel: 'Compartilhar',
          content: 'Cria um link público de leitura',
          side: 'bottom',
        }),
      },
    },
  },
  render: () => {
    const trigger = createButton({
      variant: 'outline',
      label: 'Compartilhar',
      'aria-label': 'Compartilhar',
    });
    return wrap(
      createTooltip({
        trigger,
        content: 'Cria um link público de leitura',
        side: 'bottom',
      }),
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /compartilhar/i });

    await step('O hover abre o balão', async () => {
      // Hover, e não foco: o que se mede aqui é o trajeto do PONTEIRO do gatilho
      // até o balão, e ele precisa começar sobre o gatilho.
      trigger.blur();
      await userEvent.hover(trigger);
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: 3000 },
      );
    });

    await step('Levar o ponteiro até o balão não fecha nada', async () => {
      // Coordenada dita à mão, e não `userEvent.hover(balao)`: a folha
      // compartilhada deixa o balão `pointer-events: none`, e um hover sintético
      // sobre um nó assim chega com clientX/clientY em 0,0 — mediria o ponteiro
      // no canto da tela, não sobre o balão. A área de tolerância da factory lê
      // COORDENADA, então é coordenada que o teste precisa fornecer.
      const center = mover(balaoDe(trigger)!);
      await expect(center).toBeTruthy();
      await wait(400);
      await expect(balaoDe(trigger)).not.toBeNull();
    });

    await step('Levar o ponteiro para longe fecha — a tolerância tem limite', async () => {
      // O par com o passo anterior é o que impede a asserção de passar por
      // acidente: se a tolerância nunca fechasse, "continua aberto" não provaria
      // nada.
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 0, clientY: 0, bubbles: true }),
      );
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
    });

    await step('Cleanup antes do postVisit', async () => {
      trigger.blur();
      clearPortal();
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
    docs: {
      source: {
        transform: tooltipSourceWith({ triggerLabel: 'Ajuda', content: 'Texto de ajuda.' }),
      },
    },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => probeHost(
    'Sonda de limpeza: o balão é montado, exibido por foco e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => createTooltip({
          trigger: createButton({ variant: 'outline', label: 'Ajuda' }),
          content: 'Texto de ajuda.',
        }),
        exercitar: (no) => {
          const trigger = no.querySelector<HTMLElement>('button');
          trigger?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          trigger?.dispatchEvent(new FocusEvent('focus'));
        },
        seletorDePortal: '[data-slot="tooltip-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
