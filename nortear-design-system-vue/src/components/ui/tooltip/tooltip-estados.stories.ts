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
  tooltipAbertoSource,
  tooltipComEsperaSource,
  tooltipControladoSource,
  tooltipFechadoSource,
  tooltipPersistenteSource,
} from './tooltip.source';

// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const DELAY_LONGO = 600;

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function espera(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const meta = {
  title: 'UI/Tooltip/States',
  component: Tooltip,
  tags: ['overlay'],
  decorators: [
    (story) => ({
      components: { TooltipProvider, story },
      template: '<TooltipProvider :delay-duration="0"><story /></TooltipProvider>',
    }),
  ],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipFechadoSource },
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
    const gatilho = canvas.getByRole('button', { name: /Salvar/i });

    await step('O balão não está no DOM, nem no canvas nem no portal', async () => {
      await expect(gatilho).toBeVisible();
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
      await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    await step('Sem balão, não há describedby apontando para o vazio', async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(gatilho.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      // A abertura de saída é o assunto, e ela é uma prop na raiz — a do meta
      // nasce fechada, que é justamente o estado oposto.
      source: { transform: tooltipAbertoSource },
      description: {
        story: 'Tooltip aberto via defaultOpen. Captura visual no Chromatic — role=tooltip presente.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 160px;" class="nds-cluster" data-align="center" data-justify="center">
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
    const gatilho = canvas.getByRole('button', { name: /Salvar/i });

    await step('O estado inicial abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await expect(balao).toHaveAttribute('data-state', 'instant-open');
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('E o gatilho passa a apontar para dentro dele', async () => {
      const alvo = document.getElementById(gatilho.getAttribute('aria-describedby')!);
      await expect(balaoDe(gatilho)!.contains(alvo)).toBe(true);
    });
  },
};

export const Hover: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: {
      // A espera é o assunto, e ela mora no Provider — a do meta usa a espera
      // padrão, em que não há o que medir.
      source: { transform: tooltipComEsperaSource },
      description: {
        story:
          'Hover no trigger com delay longo — o balão só abre depois da espera do Provider. É o delay que separa passar o mouse de parar sobre o elemento.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { atraso: DELAY_LONGO };
    },
    // Provider próprio: o delay do decorator é 0, e sem espera não há o que medir.
    template: `
      <TooltipProvider :delay-duration="atraso">
        <div style="contain: layout; min-height: 160px;" class="nds-cluster" data-align="center" data-justify="center">
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
    const gatilho = canvas.getByRole('button', { name: /Salvar/i });

    await step('O mouse passando não abre — o delay separa passar de parar', async () => {
      await userEvent.hover(gatilho);
      await expect(balaoDe(gatilho)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois do delay', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(gatilho)).not.toBeNull();
        },
        { timeout: DELAY_LONGO * 5 },
      );
      await expect(balaoDe(gatilho)).toHaveAttribute('role', 'tooltip');
    });
  },
};

export const WithFocus: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      // Mesma espera longa no Provider: aqui ela é o contraste — quem chega pelo
      // teclado abre na hora, e a do meta não teria espera para contrastar.
      source: { transform: tooltipComEsperaSource },
      description: {
        story: 'Foco pelo teclado abre o Tooltip imediatamente, sem esperar o delay — WCAG 1.4.13.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { atraso: DELAY_LONGO };
    },
    // Delay longo de propósito: quem chega por teclado não tem como "parar em
    // cima", então esperar aqui esconderia a informação de quem não usa mouse.
    template: `
      <TooltipProvider :delay-duration="atraso">
        <div style="contain: layout; min-height: 160px;" class="nds-cluster" data-align="center" data-justify="center">
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
    const gatilho = canvas.getByRole('button', { name: /Salvar/i });

    await step('O foco abre na hora, mesmo com o provider pedindo espera', async () => {
      gatilho.blur();
      gatilho.focus();
      await expect(gatilho).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)).toHaveAttribute('role', 'tooltip');
    });

    await step('Sair do gatilho fecha o balão', async () => {
      gatilho.blur();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).toBeNull();
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
      <div style="contain: layout; min-height: 160px;" class="nds-cluster" data-align="center" data-justify="center">
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
    const gatilho = canvas.getByRole('button', { name: /Compartilhar/i });

    await step('O hover abre o balão', async () => {
      await userEvent.hover(gatilho);
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
    });

    await step('Levar o ponteiro até o balão não fecha nada', async () => {
      const balao = balaoDe(gatilho)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no nó.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await espera(200);
      await expect(balaoDe(gatilho)).not.toBeNull();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // O modo controlado acrescenta estado no script e dois botões externos —
      // uma composição inteira que a do meta, não-controlada, não descreve.
      source: { transform: tooltipControladoSource },
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
      <div class="nds-stack" data-align="center" data-spacing="sm" style="contain: layout; min-height: 200px;">
        <div class="nds-cluster" data-spacing="sm">
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
      const abrir = canvas.getByRole('button', { name: /Abrir externamente/i });
      await userEvent.click(abrir);
      const gatilho = canvas.getByRole('button', { name: /Salvar/i });
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)).toHaveAttribute('role', 'tooltip');
    });

    await step('Botão externo fecha o Tooltip', async () => {
      const fechar = canvas.getByRole('button', { name: /Fechar externamente/i });
      await userEvent.click(fechar);
      await waitFor(
        async () => {
          await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  },
};
