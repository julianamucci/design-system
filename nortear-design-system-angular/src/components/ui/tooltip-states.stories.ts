import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_TOOLTIP, NDS_TOOLTIP_DELAY } from './tooltip';
import { balaoDe, SAVE_ICON } from './tooltip.fixtures';
import { NdsButton } from './button';
import {
  tooltipClosedSource,
  tooltipDefaultDelaySource,
  tooltipDelaySource,
  tooltipOpenSource,
  tooltipPersistenceSource,
} from './tooltip.source';
import tooltipTranslations from '@shared/content/tooltip/translations.json';

import { figmaDesign } from '@shared/figma/design-links';
// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora).
// A diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const LONG_DELAY = 600;

/**
 * A espera que o CONTEÚDO COMPARTILHADO declara, em ms.
 *
 * Sai do JSON, e não de um número escrito aqui: a decisão é da dona e vale para
 * as cinco stacks. Um número copiado para esta linha continuaria verde no dia em
 * que a decisão mudasse — que é exatamente como o 600 desta stack sobreviveu.
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
 * pura (`getAttribute` + `getElementById`) e a espera é de relógio, com prazo
 * que ESTOURA em erro nomeado em vez de pendurar.
 *
 * O relógio é marcado pelo chamador, antes do gesto, porque o que se mede é o
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

const meta: Meta = {
  title: 'Components/Overlay/Tooltip/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_TOOLTIP, NdsButton] })],
  parameters: {
    design: figmaDesign('tooltip'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Fechado é o padrão e o balão nem existe no DOM. Aberto pode vir do estado externo, ' +
          'do hover (depois do delay) ou do foco (imediato). Levar o mouse do gatilho até o ' +
          'balão não fecha nada — é a persistência que a WCAG 1.4.13 exige.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: { docs: { source: { transform: tooltipClosedSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O balão não está no DOM, nem no canvas nem no portal', async () => {
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
    });

    await step('Sem balão, não há describedby apontando para o vazio', async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: { docs: { source: { transform: tooltipOpenSource } } },
  render: () => ({
    props: { isOpen: true },
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [open]="isOpen" (openChange)="isOpen = $event">
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O estado externo abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-state', 'open');
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('E o gatilho passa a apontar para ele', async () => {
      await expect(document.getElementById(trigger.getAttribute('aria-describedby')!)).toBe(
        balaoDe(trigger),
      );
    });
  },
};

export const Hover: Story = {
  parameters: { covers: ['functional.item1'], docs: { source: { transform: tooltipDelaySource } } },
  render: () => ({
    props: { delay: LONG_DELAY },
    template: `
      <div ndsTooltipProvider [delay]="delay" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O mouse passando não abre — o delay é o que separa passar de parar', async () => {
      await userEvent.hover(trigger);
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois do delay do provider', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: LONG_DELAY * 5 },
      );
      await expect(balaoDe(trigger)).toHaveAttribute('data-state', 'open');
    });
  },
};

/**
 * A espera que vale quando NINGUÉM escreve `[delay]`.
 *
 * Story nova em 2026-09-12, e ela existe por uma medição: todas as outras
 * cravavam um valor — `0` para a `play` abrir na hora, `600` na story de espera
 * —, então NENHUMA exercia o padrão. Trocar o padrão passava por todos os
 * portões sem uma palavra, e foi assim que esta stack ficou em 600 ms enquanto
 * as outras quatro andavam por outros valores: o 600 não era decisão desta casa,
 * era o default global da biblioteca headless, sem número escrito em lugar
 * nenhum do repositório para alguém comparar.
 *
 * A asserção tem três pernas, e as três reprovam defeitos diferentes:
 *
 *   · o número que o código declara é o mesmo que o conteúdo compartilhado
 *     publica na tabela de props — código e documentação não podem divergir em
 *     silêncio, que era o estado anterior;
 *   · o balão não aparece antes de 0,9× a espera (prova que HÁ espera: zero
 *     acende balão a cada passada do mouse por uma barra de ferramentas);
 *   · e aparece antes de 1,7× (prova que a espera é ESTA, e não os 600 ms da
 *     lib, que nem sob carga cabem nesse teto).
 *
 * A margem é proporcional, e não um ponto fixo: prazo fixo compete com o
 * relógio do navegador e erra para o lado da intermitência.
 */
export const HoverDefaultDelay: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: { source: { transform: tooltipDefaultDelaySource } },
  },
  render: () => ({
    template: `
      <div ndsTooltipProvider class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O que o componente declara é o que a documentação publica', async () => {
      await expect(NDS_TOOLTIP_DELAY).toBe(DECLARED_DELAY);
    });

    await step('Sem [delay] escrito, o balão abre na espera que a casa declara', async () => {
      // O relógio parte ANTES do gesto: o que se mede é o tempo entre levar o
      // mouse ao gatilho e o balão existir.
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

    await step('E abriu pela ESPERA, não por um atalho de abertura instantânea', async () => {
      // A prova sem relógio: o primitivo publica no balão a ORIGEM da abertura.
      // Abertura que cumpriu a espera não tem origem instantânea, e o atributo
      // fica ausente; foco e janela de vizinhança escreveriam um valor ali.
      // Sem isto, a medição de tempo acima passaria por acidente se o balão
      // tivesse aberto na hora e a suíte demorado a olhar.
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('data-state', 'open');
      await expect(balao.hasAttribute('data-instant')).toBe(false);
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['functional.item2'], docs: { source: { transform: tooltipDelaySource } } },
  render: () => ({
    props: { delay: LONG_DELAY },
    template: `
      <div ndsTooltipProvider [delay]="delay" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O foco abre na hora, mesmo com o provider pedindo espera', async () => {
      // Quem chega por teclado não tem como "parar em cima": esperar o delay
      // aqui seria o mesmo que esconder a informação de quem não usa mouse.
      //
      // Medido por RELÓGIO, e não por `waitFor`: o `waitFor` daria verde
      // também se o foco esperasse os 600 ms do provider — ele espera o que for
      // preciso. O que prova a WCAG 1.4.13 aqui é o balão estar de pé MUITO
      // antes da espera do grupo. O teto é um quarto dela: abertura imediata
      // cabe nisso com folga mesmo sob carga, e nenhuma espera de 600 ms cabe.
      const start = performance.now();
      trigger.focus();
      const elapsed = await openedAfter(() => balaoDe(trigger) !== null, start, LONG_DELAY * 5);
      await expect(elapsed).toBeLessThan(LONG_DELAY / 4);

      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('data-state', 'open');
      // A prova sem relógio, do outro lado da que a story da espera padrão faz:
      // o primitivo publica a ORIGEM da abertura no balão, e a do foco se
      // nomeia. É o que separa "abriu rápido" de "abriu pelo caminho do foco".
      await expect(balao).toHaveAttribute('data-instant', 'focus');
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
  parameters: { covers: ['functional.item4'], docs: { source: { transform: tooltipPersistenceSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>
          <ng-template ndsTooltipContent side="bottom"
            >Cria um link público de leitura</ng-template
          >
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O hover abre o balão', async () => {
      await userEvent.hover(trigger);
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('Levar o mouse até o balão não fecha nada', async () => {
      const balao = balaoDe(trigger)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no
      // elemento.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await wait(200);
      await expect(balaoDe(trigger)).not.toBeNull();
    });
  },
};
