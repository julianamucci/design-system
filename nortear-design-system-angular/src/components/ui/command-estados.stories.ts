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

export const Empty: Story = {
  parameters: { covers: ['visual.item2'] },
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
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole('combobox');
    const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

    // Idempotente: a busca parte sempre do zero.
    await userEvent.clear(campo);
    await userEvent.type(campo, 'xyz');

    await step('Nenhum comando sobra e a lista fica vazia', async () => {
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      // O grupo se recolhe junto — cabeçalho sem itens embaixo é ruído.
      await expect(raiz.querySelector<HTMLElement>('[data-slot="command-group"]'))
        .not.toBeVisible();
    });

    await step('A frase é anunciada, não só desenhada', async () => {
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent('Nenhum resultado encontrado.');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      await expect(vazio).toHaveAttribute('data-empty', '');
      // Sem a região viva, quem usa leitor de tela digitaria no vazio sem
      // nunca saber que a busca não achou nada.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveAttribute('aria-atomic', 'true');
    });

    await step('A região viva não é filha do listbox', async () => {
      // `role="status"` dentro de `role="listbox"` é filho não permitido, e o
      // axe reprova por aria-required-children.
      const lista = canvas.getByRole('listbox');
      await expect(lista.contains(vazio)).toBe(false);
    });

    await step('Apagar a busca traz os comandos de volta', async () => {
      await userEvent.clear(campo);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(2);
      });
      await expect(vazio).not.toHaveAttribute('data-empty');
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const DisabledItem: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item4', 'visual.item5'] },
  render: () => ({
    props: { ultimo: '' },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command>
          <input ndsCommandInput placeholder="Buscar comando..." />

          <div ndsCommandList>
            <div ndsCommandGroup heading="Arquivo">
              <div ndsCommandItem value="novo" (onSelect)="ultimo = $event.value">Novo</div>
              <div ndsCommandItem value="arquivar" [disabled]="true" (onSelect)="ultimo = $event.value">Arquivar</div>
              <div ndsCommandItem value="renomear" (onSelect)="ultimo = $event.value">Renomear</div>
            </div>
          </div>

          <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
        </nds-command>
      </div>

      <p data-testid="escolhido">{{ ultimo }}</p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');
    const escolhido = canvas.getByTestId('escolhido');

    await userEvent.clear(campo);
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
    });

    await step('Clicar não executa o comando', async () => {
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      await userEvent.click(arquivar, { pointerEventsCheck: 0 });
      await expect(escolhido).toHaveTextContent('');
    });

    await step('As setas pulam o comando desabilitado', async () => {
      campo.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const ativo = document.getElementById(campo.getAttribute('aria-activedescendant')!)!;
        await expect(ativo).toHaveTextContent('Novo');
      });

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const ativo = document.getElementById(campo.getAttribute('aria-activedescendant')!)!;
        // "Arquivar" não é destino de navegação — quem usa teclado nunca para
        // num comando que não pode executar.
        await expect(ativo).toHaveTextContent('Renomear');
      });
      await expect(arquivar).toHaveAttribute('aria-selected', 'false');
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  parameters: { covers: ['functional.item5'] },
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

    const claro = canvas.getByRole('option', { name: 'Claro' });
    const escuro = canvas.getByRole('option', { name: 'Escuro' });
    const sistema = canvas.getByRole('option', { name: 'Sistema ⌘S' });
    const marca = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(claro).toHaveAttribute('data-checked', 'true');
      await expect(escuro).toHaveAttribute('data-checked', 'false');
    });

    await step('O check aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do item não pular a cada troca.
      await expect(marca(claro).opacity).toBe('1');
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
    const lista = canvas.getByRole('listbox');
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(24);
    });

    await step('A lista rola em vez de esticar a paleta', async () => {
      // 300px de teto na folha: sem ele a paleta cresceria para fora da tela e
      // o campo de busca sairia do alcance.
      await expect(lista.scrollHeight).toBeGreaterThan(lista.clientHeight);
      await expect(getComputedStyle(lista).overflowY).toBe('auto');
    });

    await step('Digitar reduz a lista', async () => {
      await userEvent.type(campo, 'comando 1');
      await waitFor(async () => {
        // 1, 10 a 19 e 21 não casam com "comando 1" no fim — sobram 1 e 10..19.
        await expect(canvas.getAllByRole('option')).toHaveLength(11);
      });

      await userEvent.clear(campo);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(24);
      });
    });
  },
};
