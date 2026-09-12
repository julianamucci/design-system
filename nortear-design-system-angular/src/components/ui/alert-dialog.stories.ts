import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_ALERT_DIALOG } from './alert-dialog';
import { NdsAlertIcon } from './alert';
import { NdsButton } from './button';
import { alertDialogPlaygroundSource, type AlertDialogArgs } from './alert-dialog.source';
import { NdsAlertDialogDocs } from '@/components/docs/AlertDialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

import { figmaDesign } from '@shared/figma/design-links';

// Args que montam a composição ficam na categoria "Demonstração" — os mesmos
// nomes, ordem e valores nas cinco stacks, para o painel de controls ser o
// mesmo em qualquer Storybook do design system.
const DEMO = { table: { category: 'Demonstração' } } as const;

const meta: Meta<AlertDialogArgs> = {
  title: 'Components/Overlay/AlertDialog',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_ALERT_DIALOG, NdsButton, NdsAlertIcon] })],
  parameters: {
    design: figmaDesign('alertDialog'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(NdsAlertDialogDocs),
      // O renderer imprimiria o template da story — `{{ title }}`, o `@if` dos
      // controls, o espião do `(openChange)`. A transform devolve o que se
      // escreve, lido dos mesmos controls.
      source: { transform: alertDialogPlaygroundSource },
    },
  },
  // Não há docgen nesta stack: a aba API Reference sai só destes argTypes.
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não controlado. Útil para capturas visuais.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    open: {
      control: false,
      description: 'Estado controlado de abertura. Use com a saída (openChange).',
      table: { type: { summary: 'boolean' } },
    },
    panelClass: {
      control: 'text',
      description:
        'Classes extras no painel. Ele é portalado, e classe posta na raiz ficaria no host, na página — esta entrada é a rota até ele. Valem para propriedade que o componente não declara: largura, respiro e cor vêm do próprio CSS.',
      table: { type: { summary: 'string' } },
    },
    // Sem entrada em argTypes o renderer Angular não repassa a função ao
    // template — ver guidelines/11-documentacao-componentes.md.
    onOpenChange: {
      control: false,
      description: 'Saída (openChange): dispara ao abrir e ao fechar, com o novo estado.',
      table: { type: { summary: 'output<boolean>' } },
    },
    onConfirm: { control: false, table: { disable: true } },

    tone: {
      control: 'select',
      options: ['destructive', 'default'],
      description: 'Severidade da confirmação — escolhe a variante do Button do gatilho e da ação.',
      ...DEMO,
    },
    showMedia: {
      control: 'boolean',
      description:
        'Caixa de ícone no topo do cabeçalho (ndsAlertDialogMedia). No mobile a folha centraliza a caixa do ícone; a partir de 40rem ela volta à esquerda.',
      ...DEMO,
    },
    triggerLabel: { control: 'text', description: 'Rótulo do botão que abre o diálogo.', ...DEMO },
    title: {
      control: 'text',
      description: 'Título — obrigatório, é o nome acessível (aria-labelledby).',
      ...DEMO,
    },
    description: {
      control: 'text',
      description:
        'Descrição — opcional. Quando existe, é a descrição acessível (aria-describedby); vazia, o parágrafo sai e o atributo também.',
      ...DEMO,
    },
    cancelLabel: {
      control: 'text',
      description: 'Rótulo do botão que fecha sem executar a ação.',
      ...DEMO,
    },
    actionLabel: { control: 'text', description: 'Rótulo do botão que confirma.', ...DEMO },
  },
  // Conteúdo dos rótulos: docs/shared/content/alert-dialog/translations.json →
  // demonstration.labels. É o mesmo exemplo da seção Demonstração da docs page.
  args: {
    defaultOpen: false,
    panelClass: '',
    onOpenChange: fn(),
    onConfirm: fn(),
    tone: 'destructive',
    showMedia: false,
    triggerLabel: 'Excluir conta',
    title: 'Excluir conta',
    description:
      'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Excluir',
  },
};

export default meta;
type Story = StoryObj<AlertDialogArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item5', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5', 'accessibility.item6',
      'accessibility.item7',
      'visual.item1', 'visual.item2',
    ],
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <nds-alert-dialog
        [defaultOpen]="defaultOpen"
        [panelClass]="panelClass"
        (openChange)="onOpenChange($event)"
      >
        <button ndsAlertDialogTrigger ndsButton [variant]="tone">{{ triggerLabel }}</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            @if (showMedia) {
              <div ndsAlertDialogMedia><svg ndsAlertIcon kind="warning"></svg></div>
            }
            <h2 ndsAlertDialogTitle>{{ title }}</h2>
            @if (description) {
              <p ndsAlertDialogDescription>{{ description }}</p>
            }
          </div>

          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">{{ cancelLabel }}</button>
            <button ndsAlertDialogAction ndsButton [variant]="tone" (click)="onConfirm()">
              {{ actionLabel }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const onOpenChange = args.onOpenChange as unknown as ReturnType<typeof fn>;
    const onConfirm = args.onConfirm as unknown as ReturnType<typeof fn>;
    onOpenChange.mockClear();
    onConfirm.mockClear();
    const trigger = () => canvas.getByRole('button', { name: args.triggerLabel });

    await step('O gatilho está presente e anuncia que abre um diálogo', async () => {
      await expect(trigger()).toBeVisible();
      await expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    });

    await step('A raiz identifica o componente', async () => {
      await expect(canvasElement.querySelector('nds-alert-dialog')).toHaveAttribute(
        'data-slot',
        'alert-dialog',
      );
    });

    await step('O gatilho abre um alertdialog modal, com véu, e reporta a abertura', async () => {
      // `role="alertdialog"` não é enfeite: é ele que faz o leitor de tela ler a
      // descrição junto do título, em vez de esperar a pessoa navegar até ela.
      await userEvent.click(trigger());
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'alertdialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      // Sem o véu o fundo continua clicável, e a modalidade seria só visual.
      await expect(document.querySelector('.nds-alert-dialog-overlay')).not.toBeNull();
      await expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    await step('Título e descrição são o nome e a explicação do painel', async () => {
      const panel = await waitForPortal('alertdialog');
      const title = document.getElementById(panel.getAttribute('aria-labelledby') ?? '');
      await expect(title).toHaveTextContent(args.title);
      await expect(panel).toHaveAccessibleName(args.title);
      if (!args.description) {
        // Descrição é opcional: sem ela, nada de referência pendurada.
        await expect(panel).not.toHaveAttribute('aria-describedby');
        return;
      }
      const description = document.getElementById(panel.getAttribute('aria-describedby') ?? '');
      await expect(description).toHaveTextContent(args.description);
      await expect(panel).toHaveAccessibleDescription(args.description);
    });

    await step('A caixa de mídia segue o control showMedia', async () => {
      const panel = await waitForPortal('alertdialog');
      const media = panel.querySelector<HTMLElement>('.nds-alert-dialog-media');
      if (!args.showMedia) {
        await expect(media).toBeNull();
        return;
      }
      // PRIMEIRO filho do cabeçalho: é dessa ordem que sai a leitura ícone →
      // título → descrição. O `:has()` da folha não depende dela — é a PRESENÇA
      // da mídia que ele lê.
      const header = panel.querySelector('.nds-alert-dialog-header');
      await expect(header!.firstElementChild).toBe(media);
      // Quem sai da árvore de acessibilidade é o ícone, não a caixa.
      await expect(media).not.toHaveAttribute('aria-hidden');
      await expect(media!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('O foco inicial pousa no Cancelar, não na ação destrutiva', async () => {
      // Enter apertado por reflexo tem que cancelar, não excluir.
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: args.cancelLabel });
      await waitFor(() => expect(cancel).toHaveFocus());
    });

    await step('Tab e Shift+Tab ficam presos entre o Cancelar e a ação', async () => {
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: args.cancelLabel });
      const action = within(panel).getByRole('button', { name: args.actionLabel });
      await userEvent.tab();
      await expect(action).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(cancel).toHaveFocus();
      // Nas bordas o Tab dá a volta em vez de sair do painel.
      for (let i = 0; i < 4; i++) {
        await userEvent.tab();
        await expect(panel.contains(document.activeElement)).toBe(true);
      }
    });

    await step('Clique fora NÃO fecha: a escolha precisa ser explícita', async () => {
      // É a diferença que justifica o componente existir. Um diálogo comum se
      // dispensa por engano sem consequência; aqui a dispensa esconde a
      // pergunta e deixa a pessoa sem saber se a ação aconteceu.
      const overlay = document.querySelector<HTMLElement>('.nds-alert-dialog-overlay')!;
      await userEvent.click(overlay);
      await expect(body.queryByRole('alertdialog')).toBeInTheDocument();
      await expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    await step('Escape fecha, equivale a cancelar, reporta o fechamento e devolve o foco', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('alertdialog');
      await expect(onOpenChange).toHaveBeenLastCalledWith(false);
      await expect(onConfirm).not.toHaveBeenCalled();
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });

    await step('Cancelar fecha sem executar a ação e devolve o foco', async () => {
      await userEvent.click(trigger());
      const panel = await waitForPortal('alertdialog');
      await userEvent.click(within(panel).getByRole('button', { name: args.cancelLabel }));
      await waitForPortalVanish('alertdialog');
      await expect(onConfirm).not.toHaveBeenCalled();
      await expect(onOpenChange).toHaveBeenLastCalledWith(false);
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });

    await step('Confirmar executa a ação, fecha e devolve o foco', async () => {
      await userEvent.click(trigger());
      const panel = await waitForPortal('alertdialog');
      await userEvent.click(within(panel).getByRole('button', { name: args.actionLabel }));
      await waitForPortalVanish('alertdialog');
      await expect(onConfirm).toHaveBeenCalledTimes(1);
      await expect(onOpenChange).toHaveBeenLastCalledWith(false);
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });
  },
};
