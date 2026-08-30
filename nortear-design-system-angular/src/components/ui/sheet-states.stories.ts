import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_SHEET } from './sheet';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';

const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

// Os estados que o conteúdo compartilhado descreve. Fechado e aberto são os dois
// extremos do ciclo; o corpo com rolagem interna é o caso que decide se o rodapé
// fica no lugar quando o conteúdo cresce.

const meta: Meta = {
  title: 'Primitives/Overlay/Sheet/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_SHEET, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado o painel nem existe no DOM — quem o mantém montado é a transição de ' +
          'saída, e só enquanto ela dura. Aberto, o foco entra e fica preso até o fechamento.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABELS = {
  trigger: () => t('demonstration.labels.trigger'),
  title: () => t('demonstration.labels.title'),
  descricao: () => t('demonstration.labels.description'),
  cancelar: () => t('demonstration.labels.cancel'),
  aplicar: () => t('demonstration.labels.apply'),
};

export const Closed: Story = {
  parameters: {
    // Sem `covers`. Esta story declarava `visual.item1`, que é a captura da
    // direção RIGHT — item já coberto, e corretamente, pela story Right das
    // variantes. Aqui o que se vê é o painel ausente: uma declaração deslocada,
    // que fazia o auditor contar como verificada uma foto que ninguém tira.
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABELS.trigger(),
      tituloPainel: LABELS.title(),
      descricaoPainel: LABELS.descricao(),
    },
    template: `
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsSheetContent>
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ tituloPainel }}</h2>
            <p ndsSheetDescription>{{ descricaoPainel }}</p>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABELS.trigger() });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(
        document.querySelector('[data-slot="sheet-content"]'),
      ).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  },
};

export const Open: Story = {
  parameters: {
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
      rotuloGatilho: LABELS.trigger(),
      tituloPainel: LABELS.title(),
      descricaoPainel: LABELS.descricao(),
      rotuloCancelar: LABELS.cancelar(),
      rotuloAplicar: LABELS.aplicar(),
    },
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsSheetContent>
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ tituloPainel }}</h2>
            <p ndsSheetDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ rotuloCancelar }}</button>
            <button ndsButton>{{ rotuloAplicar }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-state', 'open');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAccessibleName(LABELS.title());
      await expect(
        document.querySelector('[data-slot="sheet-overlay"]'),
      ).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const LongScrollBody: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          'é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABELS.trigger(),
      tituloPainel: LABELS.title(),
      descricaoPainel: LABELS.descricao(),
      rotuloCancelar: LABELS.cancelar(),
      rotuloAplicar: LABELS.aplicar(),
      paragrafos: Array.from({ length: 24 }, (_, i) => ({
        id: `p-${i}`,
        text: `${t('demonstration.labels.section')} ${i + 1} — ${LABELS.descricao()}`,
      })),
    },
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsSheetContent side="right" panelClass="nds-max-w-lg">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ tituloPainel }}</h2>
            <p ndsSheetDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsSheetBody class="nds-stack" data-spacing="sm">
            @for (p of paragrafos; track p.id) {
              <p class="nds-text-body">{{ p.text }}</p>
            }
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ rotuloCancelar }}</button>
            <button ndsButton>{{ rotuloAplicar }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: `flex: 1` no corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step('panelClass chega ao painel de verdade', async () => {
      // O painel é construído dentro do portal: sem este input não haveria
      // elemento onde quem consome pudesse escrever uma classe.
      //
      // ACHADO do CSS compartilhado, registrado aqui porque é onde se vê: a
      // classe chega, mas `nds-max-w-lg` (0,1,0) NÃO vence
      // `.nds-sheet-content[data-side="right"]` (0,2,0), que crava
      // `max-width: 24rem`. Largura customizada por classe utilitária é inerte
      // nas quatro stacks de navegador, e não só nesta.
      await expect(panel).toHaveClass(/nds-max-w-lg/);
      await expect(panel).toHaveClass(/nds-sheet-content/);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};

export const WithoutCloseButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sem o X do canto. Só faz sentido quando o rodapé já oferece uma saída explícita — ' +
          'Escape continua fechando de qualquer forma.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABELS.trigger(),
      tituloPainel: LABELS.title(),
      descricaoPainel: LABELS.descricao(),
      rotuloCancelar: LABELS.cancelar(),
    },
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsSheetContent [showCloseButton]="false">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ tituloPainel }}</h2>
            <p ndsSheetDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ rotuloCancelar }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O X do canto não é renderizado', async () => {
      // Prova do binding de input: sob JIT o componente cairia no default
      // (`true`) e o botão apareceria mesmo com [showCloseButton]="false".
      await expect(within(panel).queryByRole('button', { name: /fechar/i })).toBeNull();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      await expect(
        within(panel).getByRole('button', { name: LABELS.cancelar() }),
      ).toBeInTheDocument();
    });
  },
};

export const Controlled: Story = {
  parameters: {
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
      isOpen: false,
      rotuloExterno: 'Abrir pelo estado externo',
      tituloPainel: LABELS.title(),
      descricaoPainel: LABELS.descricao(),
      rotuloCancelar: LABELS.cancelar(),
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsButton variant="outline" (click)="isOpen = true">{{ rotuloExterno }}</button>

        <nds-sheet [open]="isOpen" (openChange)="isOpen = $event">
          <ng-template ndsSheetContent>
            <div ndsSheetHeader>
              <h2 ndsSheetTitle>{{ tituloPainel }}</h2>
              <p ndsSheetDescription>{{ descricaoPainel }}</p>
            </div>

            <div ndsSheetFooter>
              <button ndsSheetClose ndsButton variant="outline">{{ rotuloCancelar }}</button>
            </div>
          </ng-template>
        </nds-sheet>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalVanish('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAttribute('data-state', 'open');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: LABELS.cancelar() }));
      await waitForPortalVanish('dialog');
      // Se o output não tivesse chegado, `isOpen` continuaria true e o painel
      // reabriria no próximo ciclo de detecção.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};
