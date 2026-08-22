import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { REGRA_GUARDA_DE_FOCO, waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  sheetAbertoSource,
  sheetControladoSource,
  sheetFechadoSource,
  sheetSemBotaoFecharSource,
} from './sheet.source';

// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta = {
  title: 'UI/Sheet/States',
  component: Sheet,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    // Painel modal aberto: ver o motivo em wait-for-portal.ts.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      source: { transform: sheetFechadoSource },
      description: {
        component:
          'Estados canônicos do Sheet: Closed (inicial), Open (defaultOpen), ' +
          'WithCloseButtonHidden (sem o botão do canto) e Controlled (estado externo).',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div style="min-height: 480px; width: 100%;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      // A do meta é a ausência de `default-open`; aqui a presença dela é o assunto.
      source: { transform: sheetAbertoSource },
      description: {
        story:
          'Aberto por defaultOpen, sem estado externo nenhum. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAccessibleName();
      await expect(painel).toHaveAccessibleDescription();
      await expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!painel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      // Sem gatilho e sem o botão do canto: a saída passa a ser o rodapé, e é o
      // par (prop desligada + rodapé com saída) que precisa aparecer junto.
      source: { transform: sheetSemBotaoFecharSource },
      description: {
        story:
          'Sem o botão do canto. Só faz sentido quando o rodapé já oferece uma saída ' +
          'explícita — Escape continua fechando de qualquer forma.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetContent side="right" :show-close-button="false">
          <SheetHeader>
            <SheetTitle>Aceitar atualização</SheetTitle>
            <SheetDescription>Uma nova versão está disponível. Continue para atualizar.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Mais tarde</Button>
            </SheetClose>
            <Button>Atualizar agora</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');

    await step('O botão do canto não é renderizado', async () => {
      await expect(painel).toBeVisible();
      await expect(
        within(painel).queryByRole('button', { name: /^Fechar$/i }),
      ).not.toBeInTheDocument();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      const rodape = painel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(rodape).not.toBeNull();
      await expect(within(rodape!).getAllByRole('button').length).toBeGreaterThan(0);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // Estado externo: entra `open` ligado e sai `update:open` — nada disso
      // existe na composição não-controlada que o meta mostra.
      source: { transform: sheetControladoSource },
      description: {
        story:
          'Estado do lado de fora. O componente não decide nada sozinho: abre quando o ' +
          'valor ligado diz que sim, e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Button variant="outline" @click="open = true">Abrir pelo estado externo</Button>
        <Sheet :open="open" @update:open="(v) => open = v">
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Controlado pelo pai</SheetTitle>
              <SheetDescription>
                Este painel é comandado por estado externo, e devolve cada mudança a quem é dono dele.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">Cancelar</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /Abrir pelo estado externo/i });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const painel = await waitForPortal('dialog');
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('data-slot', 'sheet-content');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const painel = await waitForPortal('dialog');
      await userEvent.click(within(painel).getByRole('button', { name: /^Cancelar$/i }));
      await waitForPortalGone('dialog');
      // Se o evento não tivesse chegado, `open` continuaria true e o painel
      // reabriria no próximo ciclo de render.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};
