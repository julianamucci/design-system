import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_SHEET } from './sheet';
import { NdsButton } from './button';
import { esperarPortal, esperarPortalSumir } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';

const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

// Os estados que o conteúdo compartilhado descreve. Fechado e aberto são os dois
// extremos do ciclo; o corpo com rolagem interna é o caso que decide se o rodapé
// fica no lugar quando o conteúdo cresce.

const meta: Meta = {
  title: 'UI/Sheet/States',
  tags: ['disclosure'],
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

const ROTULOS = {
  gatilho: () => t('demonstration.labels.trigger'),
  titulo: () => t('demonstration.labels.title'),
  descricao: () => t('demonstration.labels.description'),
  cancelar: () => t('demonstration.labels.cancel'),
  aplicar: () => t('demonstration.labels.apply'),
};

export const Closed: Story = {
  parameters: {
    covers: ['visual.item1'],
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
      rotuloGatilho: ROTULOS.gatilho(),
      tituloPainel: ROTULOS.titulo(),
      descricaoPainel: ROTULOS.descricao(),
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
    const trigger = canvas.getByRole('button', { name: ROTULOS.gatilho() });

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
      rotuloGatilho: ROTULOS.gatilho(),
      tituloPainel: ROTULOS.titulo(),
      descricaoPainel: ROTULOS.descricao(),
      rotuloCancelar: ROTULOS.cancelar(),
      rotuloAplicar: ROTULOS.aplicar(),
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
    const painel = await esperarPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('data-state', 'open');
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAccessibleName(ROTULOS.titulo());
      await expect(
        document.querySelector('[data-slot="sheet-overlay"]'),
      ).not.toBeNull();
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
      rotuloGatilho: ROTULOS.gatilho(),
      tituloPainel: ROTULOS.titulo(),
      descricaoPainel: ROTULOS.descricao(),
      rotuloCancelar: ROTULOS.cancelar(),
      rotuloAplicar: ROTULOS.aplicar(),
      paragrafos: Array.from({ length: 24 }, (_, i) => ({
        id: `p-${i}`,
        texto: `${t('demonstration.labels.section')} ${i + 1} — ${ROTULOS.descricao()}`,
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
              <p class="nds-text-body">{{ p.texto }}</p>
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
    const painel = await esperarPortal('dialog');
    const corpo = painel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const rodape = painel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(corpo).not.toBeNull();
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: `flex: 1` no corpo é o que segura o rodapé.
      await expect(painel.scrollHeight).toBeLessThanOrEqual(painel.clientHeight + 1);
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
      await expect(painel).toHaveClass(/nds-max-w-lg/);
      await expect(painel).toHaveClass(/nds-sheet-content/);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(corpo).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const caixaRodape = rodape.getBoundingClientRect();
      const caixaPainel = painel.getBoundingClientRect();
      await expect(caixaRodape.bottom).toBeLessThanOrEqual(caixaPainel.bottom + 1);
      await expect(caixaRodape.height).toBeGreaterThan(0);
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
      rotuloGatilho: ROTULOS.gatilho(),
      tituloPainel: ROTULOS.titulo(),
      descricaoPainel: ROTULOS.descricao(),
      rotuloCancelar: ROTULOS.cancelar(),
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
    const painel = await esperarPortal('dialog');

    await step('O X do canto não é renderizado', async () => {
      // Prova do binding de input: sob JIT o componente cairia no default
      // (`true`) e o botão apareceria mesmo com [showCloseButton]="false".
      await expect(within(painel).queryByRole('button', { name: /fechar/i })).toBeNull();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      await expect(
        within(painel).getByRole('button', { name: ROTULOS.cancelar() }),
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
      aberto: false,
      rotuloExterno: 'Abrir pelo estado externo',
      tituloPainel: ROTULOS.titulo(),
      descricaoPainel: ROTULOS.descricao(),
      rotuloCancelar: ROTULOS.cancelar(),
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsButton variant="outline" (click)="aberto = true">{{ rotuloExterno }}</button>

        <nds-sheet [open]="aberto" (openChange)="aberto = $event">
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
        await esperarPortalSumir('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const painel = await esperarPortal('dialog');
      await expect(painel).toHaveAttribute('data-state', 'open');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const painel = await esperarPortal('dialog');
      await userEvent.click(within(painel).getByRole('button', { name: ROTULOS.cancelar() }));
      await esperarPortalSumir('dialog');
      // Se o output não tivesse chegado, `aberto` continuaria true e o painel
      // reabriria no próximo ciclo de detecção.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};
