import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';
import { painel } from './popover.fixtures';

const meta = {
  title: 'UI/Popover/States',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Popover: Fechado (painel fora do DOM), Aberto, ancorado acima, Controlado por fora e Modal (focus trap + scroll lock).',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Button,
};

const PAINEL_SIMPLES = `
          <PopoverContent side="bottom" align="start">
            <PopoverHeader>
              <PopoverTitle>Configuracoes de exibição</PopoverTitle>
              <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
            </PopoverHeader>
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <Button variant="ghost" size="sm">Cancelar</Button>
              <Button size="sm">Salvar</Button>
            </div>
          </PopoverContent>`;

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível. PopoverContent desmontado.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          ${PAINEL_SIMPLES}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(gatilho).toBeVisible();
      await expect(painel()).toBeNull();
    });

    await step('E o gatilho declara o estado fechado', async () => {
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveAttribute('data-state', 'closed');
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
      description: {
        story: 'Popover aberto via defaultOpen — captura visual no Chromatic. Content com role=dialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          ${PAINEL_SIMPLES}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('O painel abre já na primeira renderização', async () => {
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('E o gatilho aponta para o painel que existe de fato', async () => {
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      const id = gatilho.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(painel());
    });
  },
};

export const SideTop: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Posicionamento preferido side="top". Sem espaço acima, o painel faz auto-flip para baixo.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 320px; padding-top: 200px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir acima</Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" :side-offset="12">
            <PopoverHeader>
              <PopoverTitle>Ancorado acima</PopoverTitle>
              <PopoverDescription>Sem espaço acima, o painel vira para baixo sozinho.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Abrir acima/i });

    await step('O lado pedido no template chega ao posicionamento', async () => {
      const dialog = await waitForPortal('dialog');
      // `top` ou `bottom`, nunca um lado do outro eixo: o auto-flip troca de
      // LADO por colisão, jamais de eixo.
      await expect(['top', 'bottom']).toContain(dialog.getAttribute('data-side'));
    });

    await step('E o sideOffset separa painel e gatilho pela medida pedida', async () => {
      // Dentro de waitFor: o posicionador da lib nasce com um transform de
      // reserva e só mede a posição num quadro seguinte. Medir antes disso lê o
      // painel fora da tela, e a falha aponta para o offset em vez do relógio.
      await waitFor(() => {
        const dialog = painel()!;
        const r1 = gatilho.getBoundingClientRect();
        const r2 = dialog.getBoundingClientRect();
        const distancia =
          dialog.getAttribute('data-side') === 'top' ? r1.top - r2.bottom : r2.top - r1.bottom;
        // 12px pedidos, com 1px de folga para arredondamento sub-pixel.
        expect(Math.abs(distancia - 12)).toBeLessThanOrEqual(1);
      }, { timeout: 2000 });
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via open + @update:open.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    // Dois botões, e não um alternador: um alternador FORA do painel dispara a
    // dispensa por clique fora antes do próprio clique, e o par fechar+abrir
    // reabriria o painel no mesmo gesto.
    template: `
      <div class="nds-stack" data-spacing="sm" style="contain: layout; min-height: 300px;">
        <div class="nds-cluster" data-spacing="sm">
          <Button @click="open = true">Abrir externamente</Button>
          <Button variant="outline" @click="open = false">Fechar externamente</Button>
        </div>
        <Popover v-model:open="open">
          <PopoverTrigger as-child>
            <Button variant="outline">Trigger</Button>
          </PopoverTrigger>
          ${PAINEL_SIMPLES}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /^Trigger$/ });

    await step('O estado externo abre o painel', async () => {
      // Cada passo estabelece a própria precondição: no replay do painel
      // Interactions o DOM chega no estado que a rodada anterior deixou.
      await userEvent.click(canvas.getByRole('button', { name: /Fechar externamente/i }));
      await waitFor(() => {
        if (painel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });

      await userEvent.click(canvas.getByRole('button', { name: /Abrir externamente/i }));
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
    });

    await step('E o estado externo fecha o painel', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Fechar externamente/i }));
      await waitFor(() => {
        if (painel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: aberto pelo estado externo', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Abrir externamente/i }));
      await expect(await waitForPortal('dialog', { timeout: 2000 })).toBeVisible();
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Modal=true — foco fica preso dentro do Popover e scroll do body é bloqueado.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <Popover :default-open="true" :modal="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir modal</Button>
          </PopoverTrigger>
          ${PAINEL_SIMPLES}
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('O painel abre em modo modal', async () => {
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Modal prende o foco, e ainda assim não anuncia aria-modal', async () => {
      // `modal` aqui é bloqueio de rolagem e prisão de foco — não é o contrato
      // de Dialog. `aria-modal` faria o leitor de tela esconder o resto da
      // página, e um popover continua sendo conteúdo AO LADO, não no lugar.
      const dialog = painel()!;
      await expect(dialog).not.toHaveAttribute('aria-modal');
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('foco fora do painel');
      });
    });
  },
};
