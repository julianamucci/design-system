import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect, userEvent } from 'storybook/test';
import { expectAnuncioNaRegiao, expectNotificacaoForaDoTab } from '@shared/testing/anuncio';
import SonnerPlaygroundStory from './SonnerPlaygroundStory.svelte';
import { REGION_LABEL } from './labels';
import { waitForToast, clearToasts, TEXTS } from './sonner.fixtures';
import SonnerDocs from '@/components/docs/SonnerDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sonnerSource } from './sonner.source';

const meta: Meta = {
  title: 'Components/Feedback/Sonner',
  component: SonnerPlaygroundStory,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(SonnerDocs),
      source: { transform: sonnerSource },
    },
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
      // O default do design system é `top-right`, e não o `bottom-right` da lib.
      table: { defaultValue: { summary: 'top-right' } },
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
    title: TEXTS.sucesso,
    description: '',
    actionLabel: '',
    position: 'top-right',
    richColors: true,
    closeButton: false,
    duration: 4000,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item3'],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Cada play estabelece a própria precondição: o painel Interactions
    // reexecuta a função no mesmo DOM, sem remontar.
    await clearToasts();

    await step('O disparo desenha a notificação na região do Toaster', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Disparar notificação' }));
      const toastEl = await waitForToast({ type: 'success', text: TEXTS.sucesso });
      const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(list.contains(toastEl)).toBe(true);
      await expect(list).toHaveAttribute('data-y-position', 'top');
      await expect(list).toHaveAttribute('data-x-position', 'right');
    });

    await step('A notificação é mensagem de estado, anunciada sem interromper', async () => {
      // accessibility.item1 — quem carrega a região viva é a REGIÃO persistente,
      // e não a notificação. `polite` é a escolha, não o default: `assertive`
      // cortaria a leitura em curso para avisar que algo deu certo, o que é
      // hostil justamente com quem depende do leitor de tela.
      //
      // A lib escreve o atributo cravado no `<section>` de
      // `svelte-sonner/dist/Toaster.svelte` (`aria-live="polite"`, junto de
      // `aria-relevant` e `aria-atomic`), fora de qualquer prop e fora do spread
      // — que só alcança o `<ol>` de dentro.
      const toastEl = await waitForToast({ type: 'success' });
      const secao = toastEl.closest<HTMLElement>('section[aria-label]')!;
      await expect(secao).toHaveAttribute('aria-live', 'polite');
      await expect(secao.getAttribute('aria-live')).not.toBe('assertive');
    });

    await step('O anúncio mora na região persistente, e a notificação fica fora do Tab', async () => {
      // A REGRA DA CASA, por decisão da dona em 2026-09-13: o `aria-live` mora
      // na REGIÃO, nunca na notificação. Região viva só é observada pela
      // tecnologia assistiva se existir ANTES de o conteúdo mudar, e a
      // notificação É o conteúdo — marcá-la entrega ao leitor um elemento que
      // ele não estava observando, e com a região viva por fora vira anúncio
      // duplicado. Esta stack era a ÚNICA das cinco com as duas regiões vivas
      // encaixadas, e saiu disso por patch.
      //
      // As duas asserções moram em `@shared/testing/anuncio` porque as cinco
      // stacks cobram o mesmo contrato, e asserção escrita cinco vezes é
      // asserção que diverge na sexta.
      //
      // As duas dependem do `patches/svelte-sonner+1.2.1.patch`: ele troca o
      // `tabindex={0}` do `<li>` por `{-1}` e remove dali o `aria-live` e o
      // `aria-atomic`. Se qualquer uma reprovar, rode `npx patch-package` e
      // confira o `svelte-sonner@1.2.1 ✔` antes de procurar o defeito em outro
      // lugar.
      await waitForToast({ type: 'success' });
      expectAnuncioNaRegiao();
      expectNotificacaoForaDoTab();
    });

    await step('A região tem nome acessível e é alcançável a qualquer momento', async () => {
      // Um marco de página nomeado: o leitor de tela chega até as notificações
      // pela lista de regiões, e não só no instante em que elas são anunciadas.
      // A lib acrescenta o atalho ao nome, então a comparação é por prefixo.
      const toastEl = await waitForToast({ type: 'success' });
      const liveRegion = toastEl.parentElement!.closest<HTMLElement>('[aria-label]')!;
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
