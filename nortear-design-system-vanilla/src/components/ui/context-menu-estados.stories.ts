import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { createContextMenu } from './context-menu';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';
import {
  abrirPorGesto,
  brilho,
  criarAreaDeClique,
  menuAberto,
} from '@shared/testing/context-menu-area';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/ContextMenu/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do ContextMenu: item desabilitado, item recuado, item destrutivo e a paleta escura.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const item = (valor: string) =>
  menuAberto()!.querySelector<HTMLElement>(`[data-value="${valor}"]`)!;

// ─── Item desabilitado ────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item9', 'accessibility.item6', 'visual.item5'],
    // Medido na própria factory: o item de marcação é de DOIS estados. A opção
    // declara `checked?: boolean`, o callback de mudança entrega `boolean`, e o
    // `aria-checked` é escrito a partir desse booleano. Não há terceiro valor a
    // receber, logo não há misto para anunciar nem traço para desenhar. A caixa
    // de seleção avulsa desta stack resolve o misto; o item de menu não a expõe.
    coversNotApplicable: {
      'functional.item11':
        'a factory do item de marcação é de dois estados — a opção é booleana, o callback entrega booleano e o aria-checked sai dele, sem terceiro valor para anunciar como misto',
    },
  },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'item', label: 'Editar', value: 'edit', onClick: fn() },
        { type: 'item', label: 'Duplicar', value: 'off', disabled: true },
        { type: 'item', label: 'Renomear', value: 'rename', onClick: fn() },
        { type: 'separator' },
        { type: 'item', label: 'Excluir', value: 'perigo-off', variant: 'destructive', disabled: true },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O item desabilitado é anunciado como tal', async () => {
      await abrirPorGesto(area());
      await expect(item('off').getAttribute('aria-disabled')).toBe('true');
      await expect(item('perigo-off').getAttribute('aria-disabled')).toBe('true');
    });

    await step('Ele está atenuado, e não só marcado', async () => {
      // A cor sozinha não chega a quem não a distingue; a opacidade é o sinal
      // que sobra quando o contraste falha.
      await expect(Number(getComputedStyle(item('off')).opacity)).toBeLessThan(1);
    });

    await step('Enter nele não escolhe nada e o menu segue aberto', async () => {
      // Ativar um item desabilitado é o caso raro em que a play pode repetir sem
      // preparo: ele não muda de estado em rodada nenhuma.
      item('off').focus();
      await userEvent.keyboard('{Enter}');
      await expect(menuAberto()).not.toBeNull();
    });

    await step('O ponteiro também não o alcança', async () => {
      // Aqui a asserção é a folha de estilo, e não um clique: `userEvent` se
      // recusa a clicar em elemento com `pointer-events: none` e derruba a play
      // com erro em vez de falha — o que provaria o mesmo, mas sem dizer o quê.
      await expect(getComputedStyle(item('off')).pointerEvents).toBe('none');
    });
  },
};

// ─── Item recuado ─────────────────────────────────────────────────────────────

export const ItemInset: Story = {
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'label', label: 'Arquivo', inset: true },
        { type: 'item', label: 'Editar', value: 'normal', onClick: fn() },
        { type: 'item', label: 'Duplicar', value: 'recuado', inset: true, onClick: fn() },
        { type: 'separator' },
        { type: 'item', label: 'Excluir', value: 'delete', inset: true, variant: 'destructive' },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O recuo é geometria, não classe', async () => {
      // O que o recuo entrega é o alinhamento com itens que têm indicador à
      // esquerda. Afirmar o nome da classe não protegeria isso: a classe pode
      // continuar aplicada com a regra vazia.
      await abrirPorGesto(area());
      const recuo = parseFloat(getComputedStyle(item('recuado')).paddingLeft);
      const normal = parseFloat(getComputedStyle(item('normal')).paddingLeft);
      await expect(recuo).toBeGreaterThan(normal);
    });

    await step('Os dois itens continuam alinhados à direita', async () => {
      // O recuo empurra só a borda esquerda: se empurrasse a caixa inteira, o
      // menu ganharia um degrau à direita.
      const recuo = item('recuado').getBoundingClientRect();
      const normal = item('normal').getBoundingClientRect();
      await expect(Math.abs(recuo.right - normal.right)).toBeLessThan(2);
    });
  },
};

// ─── Item destrutivo ──────────────────────────────────────────────────────────

export const ItemDestructive: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item2'],
  },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'item', label: 'Editar', value: 'normal', shortcut: '⌘E', onClick: fn() },
        { type: 'item', label: 'Duplicar', value: 'duplicate', onClick: fn() },
        { type: 'separator' },
        {
          type: 'item',
          label: 'Excluir permanentemente',
          value: 'perigo',
          variant: 'destructive',
          shortcut: '⌫',
          onClick: fn(),
        },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O item destrutivo se declara pelo atributo, não só pela cor', async () => {
      // `data-variant` é o que o CSS lê e o que a auditoria compara entre
      // stacks; a cor é consequência dele.
      await abrirPorGesto(area());
      await expect(item('perigo').getAttribute('data-variant')).toBe('destructive');
      await expect(item('normal').getAttribute('data-variant')).toBe('default');
    });

    await step('E a cor do texto realmente muda', async () => {
      await expect(getComputedStyle(item('perigo')).color).not.toBe(
        getComputedStyle(item('normal')).color,
      );
    });
  },
};

// ─── Paleta escura ────────────────────────────────────────────────────────────

export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item6'],
    // `themeOverride` é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, sem precisar de limpeza manual que envenenaria a foto vizinha.
    themes: { themeOverride: 'dark' },
  },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'item', label: 'Editar', value: 'edit', onClick: fn() },
        { type: 'item', label: 'Duplicar', value: 'off', disabled: true },
        { type: 'separator' },
        { type: 'item', label: 'Excluir', value: 'delete', variant: 'destructive' },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('A paleta escura está aplicada no documento', async () => {
      await waitFor(() =>
        expect(document.documentElement.classList.contains('dark')).toBe(true),
      );
    });

    await step('O menu é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const menu = await abrirPorGesto(area());
      const cs = getComputedStyle(menu);
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => hospedeiroDeSonda(
    'Sonda de limpeza: o menu de contexto é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ResultadoDaSonda;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const trigger = document.createElement('div');
          trigger.textContent = 'Área com menu de contexto';
          return createContextMenu({
            trigger,
            items: [
              { type: 'item', label: 'Copiar', value: 'copy' },
              { type: 'item', label: 'Colar', value: 'paste' },
            ],
          });
        },
        exercitar: (no) => {
          const alvo = no.querySelector<HTMLElement>('[data-slot="context-menu-trigger"]');
          alvo?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 20, clientY: 20 }));
        },
        seletorDePortal: '[data-slot="context-menu-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await conferirLimpeza(sonda);
    });
  },
};
