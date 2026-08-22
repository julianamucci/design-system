import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_DRAWER } from './drawer';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import drawerTranslations from '@shared/content/drawer/translations.json';

const { t } = useTranslation(drawerTranslations as Record<string, unknown>);

// Os três estados que o conteúdo compartilhado descreve. Fechado e aberto são
// os extremos do ciclo; controlado é o caso em que o dono do valor está fora do
// componente e precisa continuar sendo avisado.

const meta: Meta = {
  title: 'UI/Drawer/States',
  tags: ['disclosure'],
  decorators: [moduleMetadata({ imports: [...NDS_DRAWER, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado o painel nem existe no DOM — quem o mantém montado é a transição de saída, ' +
          'e só enquanto ela dura. Aberto, o foco entra e fica preso até o fechamento.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABEL = {
  gatilho: () => t('usage.uxWriting.table.trigger.good'),
  titulo: () => t('usage.uxWriting.table.title.good'),
  descricao: () => t('usage.uxWriting.table.description.good'),
  fechar: () => t('usage.uxWriting.table.close.good'),
};

/** Rótulo do botão externo da story controlada — não é rótulo de produto. */
const TRIGGER_EXTERNO = 'Abrir pelo estado externo';

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um diálogo ' +
          'por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.gatilho(),
      tituloPainel: LABEL.titulo(),
      descricaoPainel: LABEL.descricao(),
    },
    template: `
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABEL.gatilho() });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'drawer-trigger');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story:
          'Aberto por defaultOpen, sem estado externo nenhum. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.gatilho(),
      tituloPainel: LABEL.titulo(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.fechar(),
    },
    template: `
      <nds-drawer [defaultOpen]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('role', 'dialog');
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAttribute('data-state', 'open');
      await expect(painel).toHaveAccessibleName(LABEL.titulo());
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
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

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Estado do lado de fora. O componente não decide nada sozinho: abre quando o valor ' +
          'ligado diz que sim, e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  render: () => ({
    props: {
      aberto: false,
      rotuloExterno: TRIGGER_EXTERNO,
      tituloPainel: LABEL.titulo(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.fechar(),
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsButton variant="outline" (click)="aberto = true">{{ rotuloExterno }}</button>

        <nds-drawer [open]="aberto" (openChange)="aberto = $event">
          <ng-template ndsDrawerContent>
            <div ndsDrawerHeader>
              <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
              <p ndsDrawerDescription>{{ descricaoPainel }}</p>
            </div>

            <div ndsDrawerFooter>
              <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
            </div>
          </ng-template>
        </nds-drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: TRIGGER_EXTERNO });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalVanish('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const painel = await waitForPortal('dialog');
      await expect(painel).toHaveAttribute('data-state', 'open');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const painel = await waitForPortal('dialog');
      await userEvent.click(within(painel).getByRole('button', { name: LABEL.fechar() }));
      await waitForPortalVanish('dialog');
      // Se o output não tivesse chegado, `aberto` continuaria true e o painel
      // reabriria no próximo ciclo de detecção.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sem dispensa por ponteiro: clique fora e perda de foco não fecham. Escape CONTINUA fechando, ' +
          'e é diferença deliberada deste stack — o primitivo não oferece desligar o teclado, e um painel ' +
          'modal que engole Escape é armadilha de teclado (WCAG 2.1.2). A saída explícita do rodapé fica.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.gatilho(),
      tituloPainel: LABEL.titulo(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.fechar(),
    },
    template: `
      <nds-drawer [defaultOpen]="true" [disablePointerDismissal]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');

    await step('Clique no overlay não fecha', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(painel).toBeVisible();
    });

    await step('A saída explícita do rodapé continua no painel', async () => {
      await expect(within(painel).getByRole('button', { name: LABEL.fechar() })).toBeVisible();
      await expect(painel).toHaveAccessibleName(LABEL.titulo());
    });
  },
};
