import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import {
  LABELS,
  panel,
  overlay,
  open,
  waitForOpen,
  waitForClosed,
} from './dialog.fixtures';

// As configurações que o conteúdo compartilhado descreve. Abrindo e Fechando
// são transições — quem as verifica é a Playground, que passa pelas duas ao
// abrir e fechar; aqui ficam os estados que a regressão visual consegue
// congelar.

const meta: Meta = {
  title: 'UI/Dialog/States',
  decorators: [moduleMetadata({ imports: [...NDS_DIALOG, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado é o padrão, e nesse estado o conteúdo do diálogo nem existe no DOM. ' +
          'Aberto pode vir de estado externo ou do valor inicial — a diferença está em quem é ' +
          'dono do valor, não no que aparece na tela.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-trigger"]')!;

    await step('Fechado, só o gatilho existe', async () => {
      // O portal é estrutural: fechado, nem o overlay nem o painel estão no
      // DOM. Um painel escondido por CSS continuaria na ordem de tabulação e
      // seria lido pelo leitor de tela.
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(trigger).toBeVisible();
    });

    await step('O gatilho anuncia que abre um diálogo, e que está recolhido', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Open: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Monta já aberto, sem estado externo nenhum', async () => {
      // Esta é a asserção que prova o binding de input: sob JIT o componente
      // renderiza no default e `defaultOpen` seria ignorado, deixando o painel
      // fora do DOM (armadilha 1 do CLAUDE.md deste stack).
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(overlay()).toBeVisible();
    });

    await step('E o foco já está dentro do painel', async () => {
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { labels: LABELS },
    template: `
      <div ndsDialog [defaultOpen]="true">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [showCloseButton]="false">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem X no canto', async () => {
      await expect(p.querySelector('[data-slot="dialog-close"]')).toBeNull();
    });

    await step('Escape continua fechando — nunca se tira toda saída', async () => {
      // Sem X e sem rodapé com Cancelar, Escape é a única saída de teclado.
      // Retirá-la junto com o X deixaria o diálogo sem fechamento acessível.
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final e o axe roda depois da
      // play — esta story existe para mostrar o painel SEM o X no canto.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

// Espião do modo controlado. Vive fora do `render` para que a play alcance as
// chamadas; `mockClear()` no início da play zera a contagem que a execução
// anterior deixou — o painel Interactions reexecuta a play no mesmo DOM.
const spyControlled = fn();

export const Controlled: Story = {
  parameters: { covers: ['functional.item7'] },
  render: () => ({
    props: { labels: LABELS, isOpen: false, onOpenChange: spyControlled },
    template: `
      <div ndsDialog [open]="isOpen" (openChange)="isOpen = $event; onOpenChange($event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ labels.trigger }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-trigger"]')!;
    spyControlled.mockClear();

    await step('Nasce fechado, porque o valor externo diz que sim', async () => {
      await expect(panel()).toBeNull();
    });

    await step('Interagir avisa o dono do estado, e o painel segue o valor', async () => {
      await open(canvasElement);
      await expect(spyControlled).toHaveBeenLastCalledWith(true);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Escape também passa pelo dono do estado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      await expect(spyControlled).toHaveBeenLastCalledWith(false);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });
  },
};
