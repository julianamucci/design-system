import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { expectAnuncioNaRegiao, expectNotificacaoForaDoTab } from '@shared/testing/anuncio';
import { toast } from 'vue-sonner';
import { Toaster, REGION_LABEL } from './index';
import { Button } from '@/components/ui/button';
import { waitForToast, clearToasts, TEXTS, type ToastType } from './sonner.fixtures';
import SonnerDocs from '@/components/docs/SonnerDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sonnerPlaygroundSource } from './sonner.source';

type SonnerArgs = {
  type: ToastType;
  title: string;
  description: string;
  actionLabel: string;
  position: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

const meta = {
  title: 'Components/Feedback/Sonner',
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(SonnerDocs), source: { transform: sonnerPlaygroundSource } },
    // A paleta de `richColors` é da lib externa e não passa pelos tokens do
    // tema, então o contraste dela não é auditável aqui — ver
    // PATCHES.md#sonner-rich-colors-contrast. `aria-prohibited-attr`: a lib
    // escreve `<div data-title aria-label>` no markup dela.
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false },
          { id: 'aria-prohibited-attr', enabled: false },
        ],
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning', 'info', 'loading'],
      description: 'Tipo semântico da notificação. Define ícone e cor.',
    },
    title: { control: 'text', description: 'Título da notificação. Uma frase, no passado, sem exclamação.' },
    description: { control: 'text', description: 'Complemento opcional ao título, quando o título sozinho não orienta.' },
    actionLabel: {
      control: 'text',
      description:
        'Rótulo do botão de ação. Vazio remove o botão. A ação oferecida aqui precisa existir em outro lugar também — a notificação some.',
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'],
      description: 'Canto da tela onde a pilha nasce.',
    },
    richColors: { control: 'boolean', description: 'Aplica a cor semântica do tema a cada tipo.' },
    closeButton: { control: 'boolean', description: 'Mostra o botão de fechar em todas as notificações.' },
    duration: {
      control: { type: 'number', min: 500, step: 500 },
      description:
        'Milissegundos até o fechamento automático. O relógio congela enquanto o ponteiro estiver dentro da região.',
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
} satisfies Meta<SonnerArgs>;

export default meta;
type Story = StoryObj<SonnerArgs>;

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item3'],
    // Declarada aqui, e não herdada do `meta`: story que herda transform acerta
    // por coincidência — foi assim que a PauseOnHover deste stack publicou por
    // meses a chamada de outra story.
    docs: { source: { transform: sonnerPlaygroundSource } },
  },
  render: (args) => ({
    components: { Toaster, Button },
    setup() {
      function fire() {
        const options: Record<string, unknown> = {};
        if (args.description) options.description = args.description;
        if (args.actionLabel) {
          options.action = { label: args.actionLabel, onClick: () => undefined };
        }
        if (args.type === 'default') toast(args.title, options);
        else toast[args.type](args.title, options);
      }
      return { args, fire };
    },
    // O prazo vem da região, e não de cada `toast()`: é o mesmo caminho que o
    // teste usa para encurtar o tempo sem depender do relógio real.
    template: `
      <div class="nds-stack nds-min-h-30" data-spacing="md" style="contain: layout; position: relative">
        <Button variant="outline" @click="fire">Disparar notificação</Button>

        <Toaster
          :position="args.position"
          :rich-colors="args.richColors"
          :close-button="args.closeButton"
          :duration="args.duration"
        />
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
      const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(list.contains(toastEl)).toBe(true);
      await expect(list).toHaveAttribute('data-y-position', 'top');
      await expect(list).toHaveAttribute('data-x-position', 'right');
    });

    await step('A notificação é anunciada sem interromper a leitura em curso', async () => {
      // accessibility.item1 — `polite` é a escolha, não o default: `assertive`
      // cortaria a leitura para avisar que algo deu certo, o que é hostil
      // justamente com quem depende do leitor de tela.
      //
      // A FIAÇÃO REAL desta stack, medida em 2026-09-13 no `vue-sonner@2.0.9`
      // instalado (`lib/index.js`, que é o que o pacote exporta): a única região
      // viva é o `<section>` que embrulha a pilha —
      // `aria-live="polite" aria-relevant="additions text" aria-atomic="false"`,
      // nas linhas 1150-1156. O `<li>` de cada notificação NÃO recebe
      // `aria-live`, `role` nem `aria-atomic`: o que ele recebe é `tabindex`
      // (`-1` por patch, ver PATCHES.md#vue-sonner-toast-tabindex). Ou seja,
      // aqui NÃO existe região viva aninhada — a duplicação que o PRD atribui a
      // esta stack não está nesta versão da lib.
      //
      // A decisão da dona, de 2026-09-13, é que o `aria-live` more na REGIÃO —
      // e esta stack JÁ cumpre, sem patch nenhum. O passo seguinte cobra o
      // contrato pelas duas metades; este descreve a árvore desta lib, que é o
      // que faz o passo seguinte ser legível.
      const toastEl = await waitForToast({ type: 'success' });
      const liveRegion = toastEl.closest<HTMLElement>('[aria-live]')!;
      await expect(liveRegion.tagName).toBe('SECTION');
      await expect(liveRegion.contains(toastEl)).toBe(true);
      await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      await expect(liveRegion.getAttribute('aria-live')).not.toBe('assertive');
      // Sem aninhamento: a notificação não é uma segunda região viva dentro da
      // primeira. Se um bump da lib passar a marcá-la, este passo reprova.
      await expect(toastEl).not.toHaveAttribute('aria-live');
      await expect(toastEl).not.toHaveAttribute('role');
    });

    await step('O anúncio mora na região persistente, e a notificação fica fora do Tab', async () => {
      // A REGRA DA CASA, por decisão da dona em 2026-09-13: o `aria-live` mora
      // na REGIÃO, nunca na notificação. Região viva só é observada pela
      // tecnologia assistiva se existir ANTES de o conteúdo mudar, e a
      // notificação É o conteúdo — marcá-la entrega ao leitor um elemento que
      // ele não estava observando, e com a região viva por fora vira anúncio
      // duplicado. Esta stack já nasce certa; o que faltava era a prova.
      //
      // As duas asserções moram em `@shared/testing/anuncio` porque as cinco
      // stacks cobram o mesmo contrato, e asserção escrita cinco vezes é
      // asserção que diverge na sexta.
      //
      // `tabIndex` negativo depende do `patches/vue-sonner+2.0.9.patch`: a lib
      // nasce com `tabindex="0"` no `<li>`, e torrada que some sozinha leva o
      // foco embora junto. Se esta linha reprovar, confira `npx patch-package`
      // antes de procurar o defeito em outro lugar.
      await waitForToast({ type: 'success' });
      expectAnuncioNaRegiao();
      expectNotificacaoForaDoTab();
    });

    await step('A região tem nome acessível e é alcançável a qualquer momento', async () => {
      // Um marco de página nomeado: o leitor de tela chega até as notificações
      // pela lista de regiões, e não só no instante em que elas são anunciadas.
      // A lib acrescenta o atalho ao nome, então a comparação é por prefixo.
      const toastEl = await waitForToast({ type: 'success' });
      const liveRegion = toastEl.closest<HTMLElement>('[aria-live]')!;
      await expect(liveRegion.getAttribute('aria-label')).toContain(REGION_LABEL);
    });

    await step('O ícone é decorativo — o texto já descreve o estado', async () => {
      // accessibility.item3 — o tipo e o título dizem tudo; anunciar o ícone
      // faria o leitor ler "imagem" antes de cada notificação.
      const toastEl = await waitForToast({ type: 'success' });
      const icon = toastEl.querySelector<SVGSVGElement>('[data-icon] svg')!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon.childElementCount).toBeGreaterThan(0);
    });

    // Termina com a tela limpa: uma notificação com prazo correndo estaria no
    // meio do fade quando o axe medisse contraste, e ~1.0 num elemento em
    // transição parece paleta ruim sem ser.
    await clearToasts();
  },
};
