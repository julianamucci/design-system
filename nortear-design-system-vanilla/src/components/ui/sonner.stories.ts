import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { toast, createSonnerToaster, type ToastOptions, type ToastPosition, type ToastType } from './sonner';
import { sonnerSource } from './sonner.source';
import { esperarTorrada, limparTorradas, TEXTOS } from './sonner.fixtures';
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

const meta: Meta<SonnerArgs> = {
  title: 'UI/Sonner',
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
      table: { type: { summary: 'ToastPosition' }, defaultValue: { summary: 'bottom-right' } },
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
    title: TEXTOS.sucesso,
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
          const opcoes: ToastOptions = {};
          if (args.description) opcoes.description = args.description;
          if (args.actionLabel) {
            opcoes.action = { label: args.actionLabel, onClick: () => undefined };
          }
          if (args.type === 'default') toast(args.title, opcoes);
          else toast[args.type](args.title, opcoes);
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
        'aria-label': 'Notificações da demonstração',
      }),
    );

    return wrapper;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    // Cada play estabelece a própria precondição: o painel Interactions
    // reexecuta a função no mesmo DOM, sem remontar.
    await limparTorradas();

    await step('O disparo desenha a notificação na região do Toaster', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Disparar notificação' }));
      const torrada = await esperarTorrada({ tipo: 'success', texto: TEXTOS.sucesso });
      const regiao = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(regiao.contains(torrada)).toBe(true);
      await expect(regiao).toHaveAttribute('data-position', 'top-right');
    });

    await step('A notificação é mensagem de estado, anunciada sem interromper', async () => {
      // accessibility.item1 — `polite` é a escolha, não o default: `assertive`
      // cortaria a leitura em curso para avisar que algo deu certo, o que é
      // hostil justamente com quem depende do leitor de tela.
      const torrada = await esperarTorrada({ tipo: 'success' });
      await expect(torrada).toHaveAttribute('role', 'status');
      await expect(torrada).toHaveAttribute('aria-live', 'polite');
      await expect(torrada.getAttribute('aria-live')).not.toBe('assertive');
    });

    await step('A região tem nome acessível e é alcançável a qualquer momento', async () => {
      // Um marco de página nomeado: o leitor de tela chega até as notificações
      // pela lista de regiões, e não só no instante em que elas são anunciadas.
      const regiao = within(document.body).getByRole('region', { name: 'Notificações da demonstração' });
      await expect(regiao).toHaveClass('nds-toaster');
    });

    await step('O ícone é decorativo — o texto já descreve o estado', async () => {
      // accessibility.item3 — o tipo e o título dizem tudo; anunciar o ícone
      // faria o leitor ler "imagem" antes de cada notificação.
      const torrada = await esperarTorrada({ tipo: 'success' });
      const icone = torrada.querySelector<HTMLElement>('.nds-toast-icon')!;
      await expect(icone).toHaveAttribute('aria-hidden', 'true');
      await expect(icone.querySelector('svg')).not.toBeNull();
    });

    await step('O apelido depreciado continua produzindo o atributo', async () => {
      // `label` era o único nome da região. O canônico entrou e o antigo ficou
      // como apelido — apagá-lo quebraria chamador em silêncio, e sem asserção
      // a compatibilidade é promessa, não contrato.
      const regiaoDaStory = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      const pai = regiaoDaStory.parentElement!;

      const antigo = createSonnerToaster({ label: 'Região antiga' });
      await expect(antigo).toHaveAttribute('aria-label', 'Região antiga');

      // E o canônico vence quando os dois vierem.
      const ambos = createSonnerToaster({ label: 'Antigo', 'aria-label': 'Canônico' });
      await expect(ambos).toHaveAttribute('aria-label', 'Canônico');

      // `createSonnerToaster` REGISTRA a região em vigor e desmonta a anterior:
      // sem devolver a da story, a próxima rodada da play — o painel
      // Interactions reexecuta no mesmo DOM — procuraria um nome que sumiu.
      pai.appendChild(
        createSonnerToaster({
          position: args.position,
          richColors: args.richColors,
          closeButton: args.closeButton,
          duration: args.duration,
          'aria-label': 'Notificações da demonstração',
        }),
      );
    });

    // Termina com a tela limpa: uma notificação com prazo correndo estaria no
    // meio do fade quando o axe medisse contraste, e ~1.0 num elemento em
    // transição parece paleta ruim sem ser.
    await limparTorradas();
  },
};
