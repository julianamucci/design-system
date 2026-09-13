import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { waitForPortal } from '@/lib/wait-for-portal';
import { panel } from './popover.fixtures';
import {
  popoverOpenSource,
  popoverControlledSource,
  popoverClosedSource,
  popoverModalSource,
} from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/Popover/States',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('popover'),
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
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Button,
  Checkbox,
};

const SIMPLE_PANEL = `
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Configurações de exibição</PopoverTitle>
              <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
            </PopoverHeader>
            <!-- Cancelar é a PEÇA de fechar (motivo close-button); Salvar fecha
                 por CÓDIGO, com o "close" do slot da raiz (motivo api). Por
                 isso toda raiz que usa ESTE painel declara v-slot="{ close }".
                 A Modal não o usa — ver MODAL_PANEL. -->
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <PopoverClose as-child>
                <Button variant="ghost" size="sm">Cancelar</Button>
              </PopoverClose>
              <Button size="sm" @click="close()">Salvar</Button>
            </div>
          </PopoverContent>`;

/**
 * O painel da Modal, e só dela.
 *
 * São DOIS focáveis porque o laço de tabulação não se prova com um: "o Tab do
 * último volta ao primeiro" seria verdade sem laço nenhum se o painel tivesse
 * um controle só.
 *
 * E são CHECKBOX, não o rodapé de ações das outras stories, por dois motivos
 * que andam juntos:
 *
 *   · não há controle de FECHAR aqui de propósito. O gerenciador de foco da lib
 *     só trapeia quando um `PopoverClose` está registrado no painel, e é esse
 *     buraco que o laço próprio do painel tapa — com um `PopoverClose` ali, a
 *     story mediria a lib, e não o nosso laço;
 *   · sem o `PopoverClose` o "Cancelar" não cancelaria nada e o "Salvar" não
 *     salvaria nada. Checkbox é um controle que se BASTA: marcar já é o efeito,
 *     e ele não promete ação que a story não faz.
 *
 * Quem vier "consertar" isto de volta para o par Cancelar/Salvar tira os dentes
 * dos dois últimos passos da play.
 */
const MODAL_PANEL = `
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Configurações de exibição</PopoverTitle>
              <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
            </PopoverHeader>
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster" data-spacing="sm">
                <Checkbox id="popover-modal-remember" />
                <label for="popover-modal-remember" class="nds-label">Lembrar minha escolha</label>
              </div>
              <div class="nds-cluster" data-spacing="sm">
                <Checkbox id="popover-modal-email" />
                <label for="popover-modal-email" class="nds-label">Receber aviso por e-mail</label>
              </div>
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
        <Popover v-slot="{ close }">
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
        <Popover v-slot="{ close }" :default-open="true">
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
        <Popover v-slot="{ close }" v-model:open="open">
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
          ${MODAL_PANEL}
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
      const firstBox = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const lastBox = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      lastBox.focus();
      await expect(lastBox).toHaveFocus();

      await userEvent.tab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(firstBox).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const dialog = panel()!;
      const inside = within(dialog);
      const firstBox = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const lastBox = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      firstBox.focus();
      await userEvent.tab({ shift: true });

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(lastBox).toHaveFocus();
    });
  },
};
