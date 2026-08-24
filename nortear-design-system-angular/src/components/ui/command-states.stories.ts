import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_COMMAND } from './command';

const meta: Meta = {
  title: 'UI/Command/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_COMMAND] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
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

// ─── Sem resultados ───────────────────────────────────────────────────────────

export const EmptyState: Story = {
  // `functional.item1` também é daqui: a metade "a frase de vazio aparece
  // quando nada sobra" é verificada nesta story, e não no Playground — lá ela
  // era a mesma asserção escrita duas vezes.
  parameters: { covers: ['functional.item1', 'visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar componente..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Componentes">
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input">Input</div>
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');
    const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

    // Idempotente: a busca parte sempre do zero — a play REEXECUTA no mesmo
    // DOM, e esta story TERMINA com texto no campo.
    await userEvent.clear(field);
    // Com o campo vazio há dois comandos. Os itens só se registram no render
    // seguinte ao da montagem, e sem esta espera a contagem de zero logo
    // adiante passaria só por ter chegado cedo demais.
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(2);
    });

    await step('Buscando "xyz", nenhum comando sobra e a lista fica vazia', async () => {
      await userEvent.type(field, 'xyz');
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      // O grupo se recolhe junto — cabeçalho sem itens embaixo é ruído.
      await expect(root.querySelector<HTMLElement>('[data-slot="command-group"]'))
        .not.toBeVisible();
    });

    await step('A frase é ANUNCIADA, não só desenhada', async () => {
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent('Nenhum resultado encontrado.');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      await expect(vazio).toHaveAttribute('data-empty', '');
      // Região viva montada o tempo todo: é a mudança DENTRO dela que o leitor
      // de tela anuncia, e criá-la só quando a busca esvazia não anunciaria
      // nada — quem usa leitor digitaria no vazio sem saber que não achou.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveAttribute('aria-atomic', 'true');
    });

    await step('A região viva não é filha do listbox', async () => {
      // `role="status"` dentro de `role="listbox"` é filho não permitido, e o
      // axe reprova por aria-required-children.
      const list = canvas.getByRole('listbox');
      await expect(list.contains(vazio)).toBe(false);
    });

    await step('Apagar a busca traz os comandos, e a região viva volta a zero', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(2);
      });
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que
      // traz 24px de respiro em cima e embaixo.
      await expect(vazio).not.toHaveAttribute('data-empty');
      await expect(vazio).not.toHaveClass(/nds-command-empty/);
      await expect(vazio.getBoundingClientRect().height).toBe(0);
    });

    await step('E a story termina SEM resultados — é o quadro que o Chromatic tira', async () => {
      // Terminar cheia faria a foto do estado vazio ser a foto do estado
      // cheio: o Chromatic captura o FIM da play, não o meio.
      await userEvent.type(field, 'xyz');
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveAttribute('data-empty', '');
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item4', 'visual.item4'] },
  render: () => ({
    props: { last: '' },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar comando..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Arquivo">
              <div ndsCommandItem value="novo" (onSelect)="last = $event.value">Novo</div>
              <div ndsCommandItem value="arquivar" [disabled]="true" (onSelect)="last = $event.value">Arquivar</div>
              <div ndsCommandItem value="renomear" (onSelect)="last = $event.value">Renomear</div>
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </div>

      <p data-testid="escolhido">{{ last }}</p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const escolhido = canvas.getByTestId('escolhido');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const arquivar = canvas.getByRole('option', { name: 'Arquivar' });

    await step('O estado chega ao markup e ao desenho', async () => {
      // Sob JIT o componente renderiza no default e `[disabled]="true"` nunca
      // chegaria (armadilha 1) — a asserção é o que impede isso de voltar.
      await expect(arquivar).toHaveAttribute('aria-disabled', 'true');
      await expect(arquivar).toHaveAttribute('data-disabled', '');
      const estilo = getComputedStyle(arquivar);
      await expect(estilo.pointerEvents).toBe('none');
      await expect(Number.parseFloat(estilo.opacity)).toBeLessThan(1);
      // O contrato diz "cursor não permitido", e a folha entrega os dois: o
      // `pointer-events: none` barra o clique, e o `cursor` é o que a pessoa vê
      // antes de tentar. Sem esta linha, metade do item ficava sem verificação.
      await expect(estilo.cursor).toBe('not-allowed');
    });

    await step('Clicar não executa o comando', async () => {
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      await userEvent.click(arquivar, { pointerEventsCheck: 0 });
      await expect(escolhido).toHaveTextContent('');
    });

    await step('As setas pulam o comando desabilitado', async () => {
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const active = document.getElementById(field.getAttribute('aria-activedescendant')!)!;
        await expect(active).toHaveTextContent('Novo');
      });

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const active = document.getElementById(field.getAttribute('aria-activedescendant')!)!;
        // "Arquivar" não é destino de navegação — quem usa teclado nunca para
        // num comando que não pode executar.
        await expect(active).toHaveTextContent('Renomear');
      });
      await expect(arquivar).toHaveAttribute('aria-selected', 'false');
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  // `visual.item5` é "estado disabled E estado checked": o quadro do
  // desabilitado está em `ItemDisabled`, o do marcado é este. Declarar só lá
  // deixava metade do item sem story declarada — e esta não interage, então o
  // Chromatic fotografa exatamente a marca acesa.
  parameters: { covers: ['functional.item5', 'visual.item4'] },
  render: () => ({
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar tema..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Aparência">
              <div ndsCommandItem value="claro" [checked]="true">Claro</div>
              <div ndsCommandItem value="escuro" [checked]="false">Escuro</div>
              <div ndsCommandItem value="sistema" [checked]="true" textValue="Sistema">Sistema <span ndsCommandShortcut>⌘S</span></div>
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const light = canvas.getByRole('option', { name: 'Claro' });
    const escuro = canvas.getByRole('option', { name: 'Escuro' });
    const sistema = canvas.getByRole('option', { name: 'Sistema ⌘S' });
    const marca = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(light).toHaveAttribute('data-checked', 'true');
      await expect(escuro).toHaveAttribute('data-checked', 'false');
    });

    await step('O check aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do item não pular a cada troca.
      await expect(marca(light).opacity).toBe('1');
      await expect(marca(escuro).opacity).toBe('0');
    });

    await step('Com atalho no item, o check some', async () => {
      // Os dois disputariam a borda direita. A folha resolve por `:has()`, e a
      // guideline é escolher um dos dois por item.
      await expect(sistema).toHaveAttribute('data-checked', 'true');
      await expect(marca(sistema).display).toBe('none');
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const atalho = sistema.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBeNull();
      await expect(atalho).toHaveClass(/nds-command-shortcut/);
    });
  },
};

// ─── Lista longa ──────────────────────────────────────────────────────────────

export const LongList: Story = {
  render: () => ({
    props: {
      comandos: Array.from({ length: 24 }, (_v, i) => ({
        value: `comando-${i + 1}`,
        label: `Comando ${i + 1}`,
      })),
    },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar comando..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Todos">
              @for (c of comandos; track c.value) {
                <div ndsCommandItem [value]="c.value" [textValue]="c.label">{{ c.label }}</div>
              }
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('listbox');
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(24);
    });

    await step('A lista rola em vez de esticar a paleta', async () => {
      // 300px de teto na folha: sem ele a paleta cresceria para fora da tela e
      // o campo de busca sairia do alcance.
      await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      await expect(getComputedStyle(list).overflowY).toBe('auto');
    });

    await step('Digitar reduz a lista', async () => {
      await userEvent.type(field, 'comando 1');
      await waitFor(async () => {
        // 1, 10 a 19 e 21 não casam com "comando 1" no fim — sobram 1 e 10..19.
        await expect(canvas.getAllByRole('option')).toHaveLength(11);
      });

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(24);
      });
    });
  },
};
