import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createCommand } from './command';
import { commandSource, commandSourceWith } from './command.source';
import { WRAPPER, comando, regiaoVazia, zerarSearch, mountInline } from './command.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Primitives/Overlay/Command/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          'Os estados que a paleta assume sozinha (sem resultados, lista longa) e os que ' +
          'cada comando assume (marcado, desabilitado).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Sem resultados ───────────────────────────────────────────────────────────

export const EmptyState: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: {
        transform: commandSourceWith({
          placeholder: 'Buscar componente...',
          emptyMessage: 'Nenhum resultado encontrado.',
          items: [
            { value: 'button', label: 'Button' },
            { value: 'input', label: 'Input' },
            { value: 'separator', label: 'Separator' },
          ],
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = WRAPPER;

    const cmd = createCommand({
      placeholder: 'Buscar componente...',
      emptyMessage: 'Nenhum resultado encontrado.',
      items: [
        { value: 'button',    label: 'Button'    },
        { value: 'input',     label: 'Input'     },
        { value: 'separator', label: 'Separator' },
      ],
    });
    wrap.appendChild(cmd);

    // A busca já nasce sem correspondência: é o estado que esta story
    // documenta, e o quadro que o Chromatic captura.
    const input = wrap.querySelector('input');
    if (input) {
      input.value = 'xyznotfound';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');
    const vazio = regiaoVazia(canvasElement);

    await step('Buscando "xyznotfound" não sobra nenhum comando', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'xyznotfound');
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('A frase é anunciada, não só desenhada', async () => {
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent('Nenhum resultado encontrado.');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      await expect(vazio).toHaveAttribute('data-empty', '');
      // Sem a região viva, quem usa leitor de tela digitaria no vazio sem nunca
      // saber que a busca não achou nada.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveAttribute('aria-atomic', 'true');
      // `role="status"` dentro de `role="listbox"` é filho não permitido, e o
      // axe reprova por aria-required-children.
      await expect(list.contains(vazio)).toBe(false);
    });

    await step('Apagar a busca traz os 3 comandos de volta', async () => {
      await userEvent.clear(field);
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
      await expect(vazio).not.toHaveAttribute('data-empty');
      await expect(vazio).not.toHaveClass(/nds-command-empty/);
    });

    await step('A story termina SEM resultados', async () => {
      // O Chromatic fotografa o estado final: terminar com a lista cheia
      // capturaria outra story.
      await userEvent.type(field, 'xyznotfound');
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      await expect(vazio).toHaveAttribute('data-empty', '');
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

const onChooseWithDisabled = fn();

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4', 'visual.item4'],
    // `disabled` no item é o assunto: a lista canônica do meta não o tem.
    docs: {
      source: {
        transform: commandSourceWith({
          placeholder: 'Buscar comando...',
          emptyMessage: 'Nenhum resultado encontrado.',
          items: [
            { value: 'novo', label: 'Novo' },
            { value: 'arquivar', label: 'Arquivar', disabled: true },
            { value: 'renomear', label: 'Renomear' },
          ],
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = WRAPPER;
    wrap.appendChild(
      createCommand({
        placeholder: 'Buscar comando...',
        emptyMessage: 'Nenhum resultado encontrado.',
        items: [
          { value: 'novo',     label: 'Novo'      },
          { value: 'arquivar', label: 'Arquivar', disabled: true },
          { value: 'renomear', label: 'Renomear'  },
        ],
        onSelect: (value) => onChooseWithDisabled(value),
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await expect(canvas.getAllByRole('option')).toHaveLength(3);
    // Consultado a cada passo: o filtro reconstrói a lista, e um nó guardado
    // antes de um re-render vira uma asserção sobre elemento solto no ar.
    const arquivar = () => comando(canvasElement, 'arquivar');

    await step('O estado chega ao markup e ao desenho', async () => {
      await expect(arquivar()).toHaveAttribute('aria-disabled', 'true');
      const computedStyle = getComputedStyle(arquivar());
      await expect(computedStyle.pointerEvents).toBe('none');
      await expect(Number.parseFloat(computedStyle.opacity)).toBeLessThan(1);
    });

    await step('Clicar não executa o comando', async () => {
      const antes = onChooseWithDisabled.mock.calls.length;
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de a factory ter chance de errar.
      await userEvent.click(arquivar(), { pointerEventsCheck: 0 });
      await expect(onChooseWithDisabled.mock.calls.length).toBe(antes);
    });

    await step('As setas pulam o comando desabilitado', async () => {
      await zerarSearch(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(
        document.getElementById(field.getAttribute('aria-activedescendant')!),
      ).toHaveTextContent('Novo');

      await userEvent.keyboard('{ArrowDown}');
      // "Arquivar" não é destino de navegação — quem usa teclado nunca para num
      // comando que não pode executar.
      await expect(
        document.getElementById(field.getAttribute('aria-activedescendant')!),
      ).toHaveTextContent('Renomear');
      await expect(arquivar()).toHaveAttribute('aria-selected', 'false');
    });

    await step('Enter no comando habilitado seguinte executa normalmente', async () => {
      const antes = onChooseWithDisabled.mock.calls.length;
      await userEvent.keyboard('{Enter}');
      await expect(onChooseWithDisabled.mock.calls.length).toBe(antes + 1);
      await expect(onChooseWithDisabled.mock.calls[antes][0]).toBe('renomear');
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    // `checked` e `shortcut` são o assunto, e nenhum dos dois está na lista
    // canônica do meta.
    docs: {
      source: {
        transform: commandSourceWith({
          placeholder: 'Buscar tema...',
          emptyMessage: 'Nenhum resultado encontrado.',
          items: [
            { value: 'claro', label: 'Claro', group: 'Aparência', checked: true },
            { value: 'escuro', label: 'Escuro', group: 'Aparência', checked: false },
            {
              value: 'sistema',
              label: 'Sistema',
              group: 'Aparência',
              checked: true,
              shortcut: 'Ctrl+S',
            },
          ],
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = WRAPPER;
    wrap.appendChild(
      createCommand({
        placeholder: 'Buscar tema...',
        emptyMessage: 'Nenhum resultado encontrado.',
        items: [
          { value: 'claro',   label: 'Claro',   group: 'Aparência', checked: true  },
          { value: 'escuro',  label: 'Escuro',  group: 'Aparência', checked: false },
          { value: 'sistema', label: 'Sistema', group: 'Aparência', checked: true, shortcut: 'Ctrl+S' },
        ],
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await expect(canvas.getAllByRole('option')).toHaveLength(3);

    const light = comando(canvasElement, 'claro');
    const escuro = comando(canvasElement, 'escuro');
    const sistema = comando(canvasElement, 'sistema');
    const marca = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(light).toHaveAttribute('data-checked', 'true');
      await expect(escuro).toHaveAttribute('data-checked', 'false');
    });

    await step('A marca aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do item não pular a cada troca.
      await expect(marca(light).opacity).toBe('1');
      await expect(marca(escuro).opacity).toBe('0');
    });

    await step('Com atalho no item, a marca some', async () => {
      // Os dois disputariam a borda direita. A folha resolve por `:has()`, e a
      // guideline é escolher um dos dois por item.
      await expect(sistema).toHaveAttribute('data-checked', 'true');
      await expect(marca(sistema).display).toBe('none');
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const atalho = sistema.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveClass(/nds-command-shortcut/);
      await expect(atalho.getAttribute('aria-hidden')).toBeNull();
      await expect(sistema).toHaveAccessibleName(/Ctrl\+S/);
    });
  },
};

// ─── Lista longa ──────────────────────────────────────────────────────────────

const COMPONENTES_LONGOS = [
  'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar',
  'Badge', 'Breadcrumb', 'Button', 'Calendar', 'Card',
  'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command',
  'ContextMenu', 'DataTable', 'DatePicker', 'Dialog', 'Drawer',
  'DropdownMenu', 'Form', 'HoverCard', 'Input', 'InputOTP',
  'Label', 'Menubar', 'NavigationMenu', 'Pagination', 'Popover',
];

export const LongList: Story = {
  render: () =>
    mountInline(
      COMPONENTES_LONGOS.map((label) => ({
        value: label.toLowerCase(),
        label,
        group: 'Componentes',
      })),
      'Buscar componente...'
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');

    await userEvent.clear(field);
    await expect(canvas.getAllByRole('option')).toHaveLength(30);

    await step('A lista rola em vez de esticar a paleta', async () => {
      // 300px de teto na folha: sem ele a paleta cresceria para fora da tela e
      // o campo de busca sairia do alcance.
      await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      await expect(getComputedStyle(list).overflowY).toBe('auto');
    });

    await step('Buscando "dialog" sobram 2 — Dialog e AlertDialog', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'dialog');
      await expect(canvas.getAllByRole('option')).toHaveLength(2);
      await expect(comando(canvasElement, 'dialog')).toBeVisible();
      await expect(comando(canvasElement, 'alertdialog')).toBeVisible();
    });

    await step('A story termina com a lista inteira', async () => {
      await userEvent.clear(field);
      await expect(canvas.getAllByRole('option')).toHaveLength(30);
    });
  },
};
