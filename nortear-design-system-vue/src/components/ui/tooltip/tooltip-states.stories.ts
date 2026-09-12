import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-vue-next';
import { balaoDe } from './tooltip.fixtures';
import {
  tooltipOpenSource,
  tooltipWithWaitSource,
  tooltipControlledSource,
  tooltipClosedSource,
  tooltipPersistenteSource,
} from './tooltip.source';

import { figmaDesign } from '@shared/figma/design-links';
// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/**
 * Espera em ms que o hover do provider precisa vencer nas stories de delay.
 *
 * O DOBRO da espera padrão (300ms): é uma espera declarada no Provider, e é ela
 * que dá à asserção "o mouse passando não abre" uma janela larga o bastante para
 * não competir com o relógio do navegador. Com a espera padrão a mesma asserção
 * ficaria apertada — a janela é o que a mantém longe de intermitência.
 */
const LONG_DELAY = 600;

/**
 * A espera que o Provider desta stack entrega SEM atributo nenhum.
 *
 * Valor do design system, igual nas cinco stacks (PRD do tooltip, D5). Está aqui
 * para a story `Delayed` medi-lo: o default é justamente o que ninguém escreve e,
 * por isso, o que muda sem nada ficar vermelho.
 */
const DEFAULT_DELAY = 300;

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Quantos ms o balão levou para aparecer, medidos por RELÓGIO desde `since`.
 *
 * Laço de relógio, e não `waitFor`: aqui o assunto É o tempo, e o `waitFor`
 * reagenda por observador de mutação — mede o DOM, não a espera. Devolve `NaN`
 * quando o prazo vence sem o balão. A condição é leitura pura (`balaoDe` só
 * consulta atributo e ancestral), que é o que a torna segura num laço.
 */
async function msUntilBubble(trigger: HTMLElement, since: number, deadline: number): Promise<number> {
  for (;;) {
    const elapsed = performance.now() - since;
    if (balaoDe(trigger)) return elapsed;
    if (elapsed >= deadline) return Number.NaN;
    await wait(16);
  }
}

const meta = {
  title: 'Components/Overlay/Tooltip/States',
  component: Tooltip,
  tags: ['overlay'],
  decorators: [
    (story) => ({
      components: { TooltipProvider, story },
      template: '<TooltipProvider :delay-duration="0"><story /></TooltipProvider>',
    }),
  ],
  parameters: {
    design: figmaDesign('tooltip'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipClosedSource },
      description: {
        component:
          'Fechado é o padrão e o balão nem existe no DOM. Aberto pode vir do estado externo, do hover (depois do delay) ou do foco (imediato). Levar o mouse do gatilho até o balão não fecha nada — é a persistência que a WCAG 1.4.13 exige.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider, Button, Save };

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas trigger renderizado. Portal vazio.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout;" class="nds-cluster" data-align="center" data-justify="center">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Salvar</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Salvar/i });

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
  parameters: {
    docs: {
      // A abertura de saída é o assunto, e ela é uma prop na raiz — a do meta
      // nasce fechada, que é justamente o estado oposto.
      source: { transform: tooltipOpenSource },
      description: {
        story: 'Tooltip aberto via defaultOpen. Captura visual no Chromatic — role=tooltip presente.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Salvar/i });

    await step('O estado inicial abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await expect(balao).toHaveAttribute('data-state', 'instant-open');
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('E o gatilho passa a apontar para dentro dele', async () => {
      const target = document.getElementById(trigger.getAttribute('aria-describedby')!);
      await expect(balaoDe(trigger)!.contains(target)).toBe(true);
    });
  },
};

export const Hover: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: {
      // A espera é o assunto, e ela mora no Provider — a do meta usa a espera
      // padrão, em que não há o que medir.
      source: { transform: tooltipWithWaitSource },
      description: {
        story:
          'Hover no trigger com delay longo — o balão só abre depois da espera do Provider. É o delay que separa passar o mouse de parar sobre o elemento.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { delay: LONG_DELAY };
    },
    // Provider próprio: o delay do decorator é 0, e sem espera não há o que medir.
    template: `
      <TooltipProvider :delay-duration="delay">
        <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Salvar/i });

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
      // `delayed-open` é o gancho que diz DE ONDE veio a abertura: do
      // temporizador do hover, e não da entrada imediata que o foco usa.
      await expect(balaoDe(trigger)).toHaveAttribute('data-state', 'delayed-open');
    });
  },
};

export const Delayed: Story = {
  parameters: {
    docs: {
      // O Provider SEM atributo é o assunto — e é exatamente o que o snippet do
      // meta publica, porque a espera padrão é o que ele ensina.
      description: {
        story:
          'A espera padrão do Provider, sem atributo nenhum: o ponteiro parado sobre o gatilho conta 300ms antes de o balão existir. É o valor do design system, e o que separa o ponteiro que passa do ponteiro que para.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    // Provider próprio e SEM `delay-duration`: o decorator do meta crava 0 para
    // as outras stories não esperarem, e é justamente o default que esta mede.
    template: `
      <TooltipProvider>
        <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Salvar</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Salvar/i });

    // Marcado ANTES do hover de propósito: o temporizador começa DENTRO da
    // chamada, então medir daqui só pode SUPERESTIMAR a espera. O piso abaixo
    // fica conservador por construção, que é o que o tira de intermitência.
    const hoverStart = performance.now();
    await userEvent.hover(trigger);

    await step('O balão não aparece antes da espera padrão', async () => {
      const elapsed = await msUntilBubble(trigger, hoverStart, DEFAULT_DELAY * 8);

      // Um ponto fixo ("nada em 240ms") competiria com o relógio do navegador:
      // sob carga a pausa estoura o prazo e o balão já estaria lá. Medir o
      // instante da abertura responde às duas perguntas com uma só leitura, e
      // erra só para o lado seguro — o temporizador nunca dispara adiantado.
      await expect(Number.isNaN(elapsed)).toBe(false);
      await expect(elapsed).toBeGreaterThanOrEqual(DEFAULT_DELAY * 0.9);
    });

    await step('Cumprida a espera, o balão abre — e abre pelo temporizador', async () => {
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      // `delayed-open`, e não `instant-open`: prova que a abertura veio da
      // espera, e não da janela em que o grupo já está quente.
      await expect(balao).toHaveAttribute('data-state', 'delayed-open');
    });
  },
};

export const WithFocus: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      // Mesma espera longa no Provider: aqui ela é o contraste — quem chega pelo
      // teclado abre na hora, e a do meta não teria espera para contrastar.
      source: { transform: tooltipWithWaitSource },
      description: {
        story: 'Foco pelo teclado abre o Tooltip imediatamente, sem esperar o delay — WCAG 1.4.13.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { delay: LONG_DELAY };
    },
    // Delay longo de propósito: quem chega por teclado não tem como "parar em
    // cima", então esperar aqui esconderia a informação de quem não usa mouse.
    template: `
      <TooltipProvider :delay-duration="delay">
        <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Salvar/i });

    await step('O foco abre na hora, mesmo com o provider pedindo espera', async () => {
      trigger.blur();
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
      // `instant-open` é o contrário do `delayed-open` que o hover carrega: diz
      // que a abertura NÃO passou pelo temporizador. É a leitura sem relógio de
      // que o atraso é do ponteiro, e o teclado não o herda (WCAG 1.4.13).
      await expect(balaoDe(trigger)).toHaveAttribute('data-state', 'instant-open');
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
      // O gatilho é um botão com rótulo visível, e o balão traz a explicação que
      // o ponteiro percorre — a do meta mostraria o icon-only.
      source: { transform: tooltipPersistenteSource },
      description: {
        story:
          'Levar o ponteiro do trigger até o balão não fecha nada — a área de tolerância entre os dois é o que a WCAG 1.4.13 (Hoverable) exige.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-spacing="md" data-align="center" data-justify="center">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline">Compartilhar</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Cria um link público de leitura</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Compartilhar/i });

    await step('O hover abre o balão', async () => {
      await userEvent.hover(trigger);
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('Levar o ponteiro até o balão não fecha nada', async () => {
      const balao = balaoDe(trigger)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no nó.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await wait(200);
      await expect(balaoDe(trigger)).not.toBeNull();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // O modo controlado acrescenta estado no script e dois botões externos —
      // uma composição inteira que a do meta, não-controlada, não descreve.
      source: { transform: tooltipControlledSource },
      description: {
        story: 'Abertura controlada por estado externo, com botões dedicados para abrir e fechar.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    // Dois botões, e não um só que alterna: o `pointerdown` do clique fora
    // dispensa o balão ANTES do `click`, então um toggle leria o estado já
    // invertido pela lib e reabriria o que acabou de fechar.
    template: `
      <div class="nds-stack nds-min-h-50" data-align="center" data-spacing="sm" style="contain: layout">
        <div class="nds-cluster" data-spacing="md">
          <Button variant="secondary" @click="open = true">Abrir externamente</Button>
          <Button variant="outline" @click="open = false">Fechar externamente</Button>
        </div>
        <Tooltip :open="open" @update:open="(v) => open = v">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Botão externo abre o Tooltip', async () => {
      const open = canvas.getByRole('button', { name: /Abrir externamente/i });
      await userEvent.click(open);
      const trigger = canvas.getByRole('button', { name: /Salvar/i });
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toHaveAttribute('role', 'tooltip');
    });

    await step('Botão externo fecha o Tooltip', async () => {
      const close = canvas.getByRole('button', { name: /Fechar externamente/i });
      await userEvent.click(close);
      await waitFor(
        async () => {
          await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  },
};
