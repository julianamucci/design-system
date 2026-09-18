import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { toast, createSonnerToaster, type ToastOptions, type ToastPosition, type ToastType } from './sonner';
import { sonnerSource, sonnerSourceWith } from './sonner.source';
import { waitForToast, clearToasts, TEXTS } from './sonner.fixtures';
import { expectAnuncioNaRegiao, expectNotificacaoForaDoTab } from '@shared/testing/anuncio';
import { createButton } from './button';
import { createSonnerDocs } from '@/components/docs/SonnerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SonnerArgs = {
  type: ToastType;
  title: string;
  description: string;
  actionLabel: string;
  position: ToastPosition;
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

/**
 * Nome acessível da região DESTA demonstração.
 *
 * O padrão da fábrica é "Notificações"; aqui ele é sobreposto porque a página
 * tem outras regiões e a `play` afirma este nome. Um lugar só: ele é prop real
 * da região, então o `render`, a `play` e o snippet do painel Code leem a mesma
 * constante — três literais divergiriam na primeira revisão de texto.
 */
const DEMO_REGION_LABEL = 'Notificações da demonstração';

const meta: Meta<SonnerArgs> = {
  title: 'Components/Feedback/Sonner',
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createSonnerDocs), source: { transform: sonnerSource } },
  },
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
    covers: ['accessibility.item1', 'accessibility.item3'],
    // Declarada aqui, e não herdada do `meta`: os args cascateiam, mas o nome
    // acessível desta região não é arg nenhum — sem isto o painel publicava uma
    // região sem nome enquanto a `play` afirmava o nome.
    docs: { source: { transform: sonnerSourceWith({ ariaLabel: DEMO_REGION_LABEL }) } },
  },
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-min-h-30';
    wrapper.dataset.spacing = 'md';
    wrapper.style.cssText = 'contain: layout; position: relative;';

    wrapper.appendChild(
      createButton({
        variant: 'outline',
        label: 'Disparar notificação',
        onClick: () => {
          const options: ToastOptions = {};
          if (args.description) options.description = args.description;
          if (args.actionLabel) {
            options.action = { label: args.actionLabel, onClick: () => undefined };
          }
          if (args.type === 'default') toast(args.title, options);
          else toast[args.type](args.title, options);
        },
      }),
    );

    // O prazo vem da região, e não de cada `toast()`: é o mesmo caminho que o
    // teste usa para encurtar o tempo sem depender do relógio real.
    wrapper.appendChild(
      createSonnerToaster({
        position: args.position,
        richColors: args.richColors,
        closeButton: args.closeButton,
        duration: args.duration,
        'aria-label': DEMO_REGION_LABEL,
      }),
    );

    return wrapper;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    // Cada play estabelece a própria precondição: o painel Interactions
    // reexecuta a função no mesmo DOM, sem remontar.
    await clearToasts();

    await step('O disparo desenha a notificação na região do Toaster', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Disparar notificação' }));
      const toastEl = await waitForToast({ type: 'success', text: TEXTS.success });
      const region = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(region.contains(toastEl)).toBe(true);
      await expect(region).toHaveAttribute('data-position', 'top-right');
    });

    await step('O `aria-live` mora na REGIÃO, e a notificação não anuncia', async () => {
      // accessibility.item1. Esta asserção está INVERTIDA em relação ao que ela
      // afirmava até 2026-09-13, e a inversão é decisão da dona: uma região viva
      // só é observada pela tecnologia assistiva se existir ANTES de o conteúdo
      // mudar, e a notificação É o conteúdo — nasce já com o texto. Quem anuncia
      // passou a ser a região persistente; a notificação perdeu `role="status"`
      // e `aria-live`.
      //
      // As duas metades vêm do módulo compartilhado porque nenhum portão vê
      // nenhuma delas — `aria-live` aninhado não é violação de axe, e região sem
      // `aria-live` também não —, e asserção escrita cinco vezes é asserção que
      // diverge na sexta. `role="status"` entra na conta: o papel JÁ IMPLICA
      // `polite`, então mantê-lo traria o anúncio de volta pela porta implícita.
      //
      // `polite` continua sendo escolha e não default: a região é afirmada em
      // `polite` exato, o que reprova um `assertive` que cortasse a leitura em
      // curso para avisar que algo deu certo.
      const toastEl = await waitForToast({ type: 'success' });
      const region = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(region.contains(toastEl)).toBe(true);

      expectAnuncioNaRegiao();
      // E a notificação não é parada de teclado: torrada que some sozinha
      // levaria o foco embora junto.
      expectNotificacaoForaDoTab();
    });

    await step('A região tem nome acessível e é alcançável a qualquer momento', async () => {
      // Um marco de página nomeado: o leitor de tela chega até as notificações
      // pela lista de regiões, e não só no instante em que elas são anunciadas.
      const region = within(document.body).getByRole('region', { name: DEMO_REGION_LABEL });
      await expect(region).toHaveClass('nds-toaster');
    });

    await step('O ícone é decorativo — o texto já descreve o estado', async () => {
      // accessibility.item3 — o tipo e o título dizem tudo; anunciar o ícone
      // faria o leitor ler "imagem" antes de cada notificação.
      const toastEl = await waitForToast({ type: 'success' });
      const icon = toastEl.querySelector<HTMLElement>('.nds-sonner-icon')!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon.querySelector('svg')).not.toBeNull();
    });

    await step('O apelido depreciado continua produzindo o atributo', async () => {
      // `label` era o único nome da região. O canônico entrou e o antigo ficou
      // como apelido — apagá-lo quebraria chamador em silêncio, e sem asserção
      // a compatibilidade é promessa, não contrato.
      const storyRegion = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      const parent = storyRegion.parentElement!;

      const legacy = createSonnerToaster({ label: 'Região antiga' });
      await expect(legacy).toHaveAttribute('aria-label', 'Região antiga');

      // E o canônico vence quando os dois vierem.
      const both = createSonnerToaster({ label: 'Antigo', 'aria-label': 'Canônico' });
      await expect(both).toHaveAttribute('aria-label', 'Canônico');

      // `createSonnerToaster` REGISTRA a região em vigor e desmonta a anterior:
      // sem devolver a da story, a próxima rodada da play — o painel
      // Interactions reexecuta no mesmo DOM — procuraria um nome que sumiu.
      parent.appendChild(
        createSonnerToaster({
          position: args.position,
          richColors: args.richColors,
          closeButton: args.closeButton,
          duration: args.duration,
          'aria-label': DEMO_REGION_LABEL,
        }),
      );
    });

    // Termina com a tela limpa: uma notificação com prazo correndo estaria no
    // meio do fade quando o axe medisse contraste, e ~1.0 num elemento em
    // transição parece paleta ruim sem ser.
    await clearToasts();
  },
};
