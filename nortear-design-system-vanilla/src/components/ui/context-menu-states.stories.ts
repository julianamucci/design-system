import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { createContextMenu } from './context-menu';
import { contextMenuSource, contextMenuSourceCom } from './context-menu.source';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';
import {
  abrirPorGesto,
  brilho,
  criarAreaDeClique,
  menuAberto,
} from '@shared/testing/context-menu-area';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/ContextMenu/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: contextMenuSource },
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
    // `disabled` é o assunto, e o menu canônico do meta não o tem.
    docs: {
      source: {
        transform: contextMenuSourceCom({
          items: [
            { label: 'Editar', value: 'edit' },
            { label: 'Duplicar', value: 'off', disabled: true },
            { type: 'separator' },
            { label: 'Excluir', value: 'perigo-off', variant: 'destructive', disabled: true },
          ],
        }),
      },
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
  parameters: {
    // O recuo e o rótulo de grupo são o assunto, e nenhum dos dois está no
    // menu canônico do meta.
    docs: {
      source: {
        transform: contextMenuSourceCom({
          items: [
            { type: 'label', label: 'Arquivo', inset: true },
            { label: 'Editar', value: 'normal' },
            { label: 'Duplicar', value: 'recuado', inset: true },
            { type: 'separator' },
            { label: 'Excluir', value: 'delete', inset: true, variant: 'destructive' },
          ],
        }),
      },
    },
  },
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

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação no item, de propósito. O que ela declara vale na abertura,
// e o primeiro clique num item misto o resolve para marcado — uma play que
// clicasse aqui mediria outro estado no REPLAY do painel Interactions, que
// reexecuta no mesmo DOM. O gesto de abrir é o único, e ele reconstrói o menu a
// partir das mesmas definições: cada rodada mede exatamente o mesmo.

export const CheckboxIndeterminate: Story = {
  parameters: {
    covers: ['functional.item11'],
    // O item de marcação e o estado misto são o assunto: o menu canônico do
    // meta só tem itens de ação.
    docs: {
      source: {
        transform: contextMenuSourceCom({
          items: [
            { type: 'label', label: 'Mostrar na tela' },
            { type: 'checkbox', label: 'Colunas', value: 'colunas', indeterminate: true },
            { type: 'checkbox', label: 'Régua', value: 'regua', checked: true },
            { type: 'checkbox', label: 'Grade', value: 'grade', checked: false },
          ],
        }),
      },
    },
  },
  render: () =>
    createContextMenu({
      trigger: criarAreaDeClique('Clique com o botão direito aqui'),
      items: [
        { type: 'label', label: 'Mostrar na tela' },
        { type: 'checkbox', label: 'Colunas', value: 'colunas', indeterminate: true },
        { type: 'checkbox', label: 'Régua', value: 'regua', checked: true },
        { type: 'checkbox', label: 'Grade', value: 'grade', checked: false },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const menu = await abrirPorGesto(area());
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Colunas' });
    const marcado = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria o misto como verdadeiro; o que a pessoa ouve
      // tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(marcado.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(marcado);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado continua sem glifo nenhum', async () => {
      await expect(formaDoIndicador(desmarcado)).toBeNull();
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
