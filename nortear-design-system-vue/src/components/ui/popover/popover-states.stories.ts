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
import { panel } from './popover.fixtures';
import {
  popoverOpenSource,
  popoverControlledSource,
  popoverClosedSource,
  popoverModalSource,
} from './popover.source';

const meta = {
  title: 'Primitives/Overlay/Popover/States',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: popoverClosedSource },
      description: {
        component:
          'Estados canônicos do Popover: Fechado (painel fora do DOM), Aberto, Controlado por fora e Modal (focus trap + scroll lock).',
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

const SIMPLE_PANEL = `
          <PopoverContent side="bottom">
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
          ${SIMPLE_PANEL}
        </Popover>
      </div>
    `,
  }),
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
      // Aberto é PRESENÇA de `default-open`; a do meta é justamente a ausência
      // dele, e as duas se leem lado a lado.
      source: { transform: popoverOpenSource },
      description: {
        story: 'Popover aberto via defaultOpen — captura visual no Chromatic. Content com role=dialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          ${SIMPLE_PANEL}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('O painel abre já na primeira renderização', async () => {
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('E o gatilho aponta para o painel que existe de fato', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel());
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // `v-model:open` e os dois botões de fora são composição nova: o estado
      // sai do componente, e nenhuma outra story do arquivo o tem.
      source: { transform: popoverControlledSource },
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
      <div class="nds-stack nds-min-h-80" data-spacing="sm" style="contain: layout">
        <div class="nds-cluster" data-spacing="md">
          <Button @click="open = true">Abrir externamente</Button>
          <Button variant="outline" @click="open = false">Fechar externamente</Button>
        </div>
        <Popover v-model:open="open">
          <PopoverTrigger as-child>
            <Button variant="outline">Trigger</Button>
          </PopoverTrigger>
          ${SIMPLE_PANEL}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /^Trigger$/ });

    await step('O estado externo abre o painel', async () => {
      // Cada passo estabelece a própria precondição: no replay do painel
      // Interactions o DOM chega no estado que a rodada anterior deixou.
      await userEvent.click(canvas.getByRole('button', { name: /Fechar externamente/i }));
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });

      await userEvent.click(canvas.getByRole('button', { name: /Abrir externamente/i }));
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('E o estado externo fecha o painel', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Fechar externamente/i }));
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
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
      // `modal` é a prop que a story existe para mostrar, e ela vive na RAIZ —
      // não no painel, onde ficam `side` e `align`.
      source: { transform: popoverModalSource },
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava e o painel se anuncia como diálogo modal. As três coisas andam juntas: anunciar inércia sem prender o foco engana quem navega por leitor de tela.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <Popover :default-open="true" :modal="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir modal</Button>
          </PopoverTrigger>
          ${SIMPLE_PANEL}
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('O painel abre em modo modal', async () => {
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('O painel anuncia aria-modal', async () => {
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(panel()!).toHaveAttribute('aria-modal', 'true');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // A versão anterior deste passo provava a prisão com
      // `dialog.contains(document.activeElement)` SEM tabular. Aquilo é
      // verdadeiro no modo não-modal também — o foco entrar no painel é o
      // contrato `functional.item1`, cumprido pelas cinco stacks —, então a
      // asserção não podia reprovar: é a forma exata da asserção que guarda o
      // bug.
      //
      // O controle negativo de verdade é este: partir do ÚLTIMO focável e
      // apertar Tab. Não-modal, o foco SAI do painel e esta asserção reprova;
      // modal, ele volta ao primeiro.
      const dialog = panel()!;
      const inside = within(dialog);
      const cancel = inside.getByRole('button', { name: /Cancelar/i });
      const save = inside.getByRole('button', { name: /Salvar/i });

      save.focus();
      await expect(save).toHaveFocus();

      await userEvent.tab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(cancel).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const dialog = panel()!;
      const inside = within(dialog);
      const cancel = inside.getByRole('button', { name: /Cancelar/i });
      const save = inside.getByRole('button', { name: /Salvar/i });

      cancel.focus();
      await userEvent.tab({ shift: true });

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(save).toHaveFocus();
    });
  },
};
