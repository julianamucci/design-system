import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsToaster, toast, type ToastOptions } from './sonner';
import { waitForToast, clearToasts, TEXTS } from './sonner.fixtures';
import { NdsButton } from './button';
import { NdsSonnerDocs } from '@/components/docs/SonnerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sonnerPlaygroundSource, type SonnerArgs } from './sonner.source';
import { expectAnuncioNaRegiao, expectNotificacaoForaDoTab } from '@shared/testing/anuncio';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<SonnerArgs> = {
  title: 'Components/Feedback/Sonner',
  tags: ['autodocs', 'feedback'],
  decorators: [moduleMetadata({ imports: [NdsToaster, NdsButton] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsSonnerDocs) },
  },
  // Sem compodoc neste stack (ver CLAUDE.md): a aba API Reference sai daqui.
  argTypes: {
    type: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning', 'info', 'loading'],
      description: 'Tipo semântico da notificação. Define ícone e cor.',
      table: { type: { summary: 'ToastType' }, defaultValue: { summary: 'default' } },
    },
    title: {
      control: 'text',
      description: 'Título da notificação. Uma frase, no passado, sem exclamação.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Complemento opcional ao título, quando o título sozinho não orienta.',
      table: { type: { summary: 'string' } },
    },
    actionLabel: {
      control: 'text',
      description:
        'Rótulo do botão de ação. Vazio remove o botão. A ação oferecida aqui precisa existir em outro lugar também — a notificação some.',
      table: { type: { summary: 'string' } },
    },
    position: {
      control: 'select',
      options: [
        'top-right', 'top-center', 'top-left',
        'bottom-right', 'bottom-center', 'bottom-left',
      ],
      description: 'Canto da tela onde a pilha nasce.',
      table: { type: { summary: 'ToastPosition' }, defaultValue: { summary: 'top-right' } },
    },
    richColors: {
      control: 'boolean',
      description: 'Aplica a cor semântica do tema a cada tipo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    closeButton: {
      control: 'boolean',
      description: 'Mostra o botão de fechar em todas as notificações.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    duration: {
      control: { type: 'number', min: 500, step: 500 },
      description:
        'Milissegundos até o fechamento automático. O relógio congela enquanto o ponteiro ou o foco estiverem dentro da região.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4000' } },
    },
  },
  args: {
    type: 'success',
    title: TEXTS.success,
    description: '',
    actionLabel: '',
    position: 'top-right',
    richColors: true,
    closeButton: false,
    duration: 4000,
  },
};

export default meta;
type Story = StoryObj<SonnerArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: sonnerPlaygroundSource } },
    covers: ['accessibility.item1', 'accessibility.item3'],
  },
  render: (args) => ({
    props: {
      ...args,
      fire: () => {
        const options: ToastOptions = {};
        if (args.description) options.description = args.description;
        if (args.actionLabel) {
          options.action = { label: args.actionLabel, onClick: () => undefined };
        }
        if (args.type === 'default') toast(args.title, options);
        else toast[args.type](args.title, options);
      },
    },
    // O prazo vem do input do Toaster, e não de cada `toast()`: é o mesmo botão
    // que o teste usa para encurtar o tempo sem depender do relógio real.
    template: `
      <div class="nds-stack" data-spacing="md">
        <button ndsButton variant="outline" (click)="fire()">Disparar notificação</button>

        <div
          ndsToaster
          [position]="position"
          [richColors]="richColors"
          [closeButton]="closeButton"
          [duration]="duration"
          label="Notificações da demonstração"
        ></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Cada play estabelece a própria precondição: o painel Interactions
    // reexecuta a função no mesmo DOM, sem remontar.
    await clearToasts();

    await step('O disparo desenha a notificação na região do Toaster', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Disparar notificação' }));
      const toastEl = await waitForToast({ type: 'success', text: TEXTS.success });
      const region = canvasElement.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(region.contains(toastEl)).toBe(true);
      await expect(region).toHaveAttribute('data-position', 'top-right');
    });

    await step('O `aria-live` mora na REGIÃO, e a notificação não anuncia', async () => {
      // accessibility.item1. As duas asserções que viviam aqui afirmavam o
      // CONTRÁRIO até 2026-09-13 — notificação com `role="status"` e
      // `aria-live`, região sem —, e a inversão é decisão da dona: uma região
      // viva só é observada pela tecnologia assistiva se existir ANTES de o
      // conteúdo mudar, e a notificação É o conteúdo, porque nasce já com o
      // texto. Quem anuncia passou a ser a região persistente.
      //
      // As duas metades vêm do módulo compartilhado, e as duas são necessárias:
      // nenhum portão vê nenhuma delas — `aria-live` aninhado não é violação de
      // axe, e região sem `aria-live` também não. `role="status"` entra na conta
      // porque o papel JÁ IMPLICA `polite`: tirar o atributo e manter o papel
      // traria o anúncio de volta pela porta implícita.
      //
      // `polite` continua sendo escolha e não default — a região é afirmada em
      // `polite` exato, o que reprova um `assertive` que cortasse a leitura em
      // curso para avisar que algo deu certo.
      const toastEl = await waitForToast({ type: 'success' });
      const region = canvasElement.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(region.contains(toastEl)).toBe(true);
      // A região continua sendo marco de página nomeado: o papel de `region` e o
      // anúncio convivem no mesmo elemento, e é essa soma que faz a fila ser
      // alcançável a qualquer momento E anunciada quando muda.
      await expect(region).toHaveAttribute('role', 'region');

      expectAnuncioNaRegiao();
      // E a notificação não é parada de teclado: torrada que some sozinha
      // levaria o foco embora junto.
      expectNotificacaoForaDoTab();
    });

    await step('A região tem nome acessível e é alcançável a qualquer momento', async () => {
      // Um marco de página nomeado: o leitor de tela chega até as notificações
      // pela lista de regiões, e não só no instante em que elas são anunciadas.
      const region = canvas.getByRole('region', { name: 'Notificações da demonstração' });
      await expect(region).toHaveClass('nds-toaster');
    });

    await step('O ícone é decorativo — o texto já descreve o estado', async () => {
      // accessibility.item3 — o tipo e o título dizem tudo; anunciar o ícone
      // faria o leitor ler "imagem" antes de cada notificação.
      const toastEl = await waitForToast({ type: 'success' });
      const icon = toastEl.querySelector<SVGSVGElement>('.nds-sonner-icon > svg')!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon.childElementCount).toBeGreaterThan(0);
    });

    // Termina com a tela limpa: uma notificação com prazo correndo estaria no
    // meio do fade quando o axe medisse contraste, e ~1.0 num elemento em
    // transição parece paleta ruim sem ser.
    await clearToasts();
  },
};
