import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_COMMAND } from './command';
import { NdsCommandDocs } from '@/components/docs/CommandDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  onItemSelect: (detalhe: { value: string; label: string }) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o `@if` que
 * alterna os grupos e com `(itemSelect)` ligado ao espião. O `transform`
 * devolve o uso real, montado a partir dos controls (armadilha 3).
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<CommandArgs> }): string {
  const {
    placeholder = 'Buscar componente...',
    emptyMessage = 'Nenhum resultado encontrado.',
    showGroups = true,
  } = ctx.args ?? {};

  const grupo = showGroups ? ' heading="Componentes"' : '';

  return `import { NDS_COMMAND } from '@/components/ui/command';

@Component({
  imports: [...NDS_COMMAND],
  template: \`
    <nds-command (itemSelect)="executar($event)">
      <input ndsCommandInput placeholder="${placeholder}" />

      <div ndsCommandList>
        <div ndsCommandGroup${grupo}>
          <div ndsCommandItem value="button">Button</div>
          <div ndsCommandItem value="input">Input</div>
        </div>
      </div>

      <div ndsCommandEmpty>${emptyMessage}</div>
    </nds-command>
  \`,
})
export class Exemplo {
  executar(comando: CommandSelectDetails): void {
    // roda o comando e volta o foco para onde ele age
  }
}`;
}

const meta: Meta<CommandArgs> = {
  title: 'UI/Command',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_COMMAND] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsCommandDocs) },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do campo de busca. Vira também o nome acessível do campo e da lista.',
    },
    emptyMessage: {
      control: 'text',
      description: 'Frase anunciada quando a busca não encontra nada.',
    },
    showGroups: {
      control: 'boolean',
      description: 'Exibe o cabeçalho de cada grupo. Grupo único costuma dispensar rótulo.',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a
    // função em `props` e o `(itemSelect)` fica ligado a nada — sem erro
    // nenhum (armadilha 5).
    onItemSelect: {
      control: false,
      description: 'Emitido a cada comando escolhido, por clique ou por Enter.',
      table: { type: { summary: '(detalhe: CommandSelectDetails) => void' } },
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    showGroups: true,
    onItemSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<CommandArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command (itemSelect)="onItemSelect($event)">
          <input ndsCommandInput [placeholder]="placeholder" />

          <div ndsCommandList>
            <div ndsCommandGroup [heading]="showGroups ? 'Componentes' : ''">
              <div ndsCommandItem value="button">Button</div>
              <div ndsCommandItem value="input">Input</div>
              <div ndsCommandItem value="separator">Separator</div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup [heading]="showGroups ? 'Utilitários' : ''">
              <div ndsCommandItem value="cn">cn()</div>
              <div ndsCommandItem value="clsx">clsx()</div>
            </div>
          </div>

          <div ndsCommandEmpty>{{ emptyMessage }}</div>
        </nds-command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole('combobox');
    const lista = canvas.getByRole('listbox');
    const espiao = args.onItemSelect as ReturnType<typeof fn>;

    // A busca começa sempre vazia: a play REEXECUTA no mesmo DOM.
    await userEvent.clear(campo);
    // Os itens só se registram no render seguinte ao da montagem (é assim que
    // o primitivo lê o texto de cada um do DOM), então até lá a lista está
    // legitimamente vazia.
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
    });

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(raiz).toHaveClass(/nds-command/);
      await expect(campo).toHaveClass(/nds-command-input/);
      await expect(campo).toHaveAttribute('data-slot', 'command-input');
      await expect(lista).toHaveClass(/nds-command-list/);
      await expect(lista).toHaveAttribute('data-slot', 'command-list');
      // A lupa é do componente, não do call site — quem escreve a paleta não
      // pode esquecê-la.
      await expect(raiz.querySelector('.nds-command-input-wrapper > svg')).not.toBeNull();
    });

    await step('O campo é uma combobox ligada à lista REAL', async () => {
      // Este é o par que separa a paleta de um menu: papel de combobox no
      // campo, papel de listbox na lista, e o `aria-controls` apontando para o
      // id que a lista tem de verdade — id órfão o axe reprova.
      await expect(campo).toHaveAttribute('aria-autocomplete', 'list');
      await expect(campo).toHaveAttribute('aria-expanded', 'true');
      const controlado = campo.getAttribute('aria-controls');
      await expect(controlado).toBeTruthy();
      await expect(document.getElementById(controlado!)).toBe(lista);
      // Nome acessível herdado do placeholder, nos dois papéis.
      await expect(campo).toHaveAttribute('aria-label', args.placeholder);
      await expect(lista).toHaveAttribute('aria-label', args.placeholder);
    });

    await step('O rótulo do grupo vem do input, não do default', async () => {
      // Sob JIT o componente renderiza com o default e `heading` nunca chega
      // (armadilha 1): com o control ligado, o cabeçalho existiria mesmo assim.
      const cabecalhos = raiz.querySelectorAll('.nds-command-group-heading');
      await expect(cabecalhos.length).toBe(args.showGroups ? 2 : 0);
      if (args.showGroups) {
        await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeTruthy();
      }
    });

    await step('Cada comando é uma opção da lista', async () => {
      const opcoes = canvas.getAllByRole('option');
      await expect(opcoes).toHaveLength(5);
      await expect(opcoes[0]).toHaveClass(/nds-command-item/);
      await expect(opcoes[0]).toHaveAttribute('data-slot', 'command-item');
      await expect(opcoes[0]).toHaveAttribute('aria-selected', 'false');
      // O divisor não entra na lista de opções — ARIA só admite `option` e
      // `group` dentro de um listbox.
      await expect(
        raiz.querySelector('[data-slot="command-separator"]'),
      ).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Digitar filtra, e o que não casa sai da árvore', async () => {
      await userEvent.type(campo, 'sep');

      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: 'Separator' })).toBeVisible();
      // Não basta sumir da consulta por papel: o item precisa estar realmente
      // invisível, e é a troca de classe que garante isso (a folha pinta
      // `display: flex` e venceria o `hidden` do navegador).
      const escondido = raiz.querySelector<HTMLElement>('[data-value="button"]')!;
      await expect(escondido).not.toBeVisible();
      // O grupo inteiro se recolhe quando nenhum item dele passa no filtro —
      // sem isso a paleta mostraria "Utilitários" com nada embaixo.
      const grupos = raiz.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(grupos[1]).not.toBeVisible();
    });

    await step('Sem resultado, a frase é ANUNCIADA e não só desenhada', async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, 'zzz');

      const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await waitFor(async () => {
        await expect(vazio).toHaveAttribute('data-empty', '');
      });
      await expect(vazio).toHaveTextContent(args.emptyMessage);
      // Região viva montada o tempo todo: é a mudança DENTRO dela que o leitor
      // de tela anuncia. Criá-la só na hora não anunciaria nada.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('Com resultado, a região viva volta a ocupar zero', async () => {
      await userEvent.clear(campo);
      const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await waitFor(async () => {
        await expect(vazio).not.toHaveAttribute('data-empty');
      });
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que
      // traz 24px de respiro em cima e embaixo.
      await expect(vazio).not.toHaveClass(/nds-command-empty/);
      await expect(vazio.getBoundingClientRect().height).toBe(0);
    });

    await step('As setas percorrem a lista sem tirar o foco do campo', async () => {
      campo.focus();
      await userEvent.keyboard('{ArrowDown}');

      await waitFor(async () => {
        await expect(campo.getAttribute('aria-activedescendant')).toBeTruthy();
      });
      // O foco NÃO se move: é o que separa a paleta de um menu, e é o que
      // permite continuar digitando enquanto se navega.
      await expect(campo).toHaveFocus();

      const ativo = document.getElementById(campo.getAttribute('aria-activedescendant')!)!;
      await expect(ativo).toHaveAttribute('role', 'option');
      await expect(ativo).toHaveAttribute('aria-selected', 'true');
      await expect(ativo).toHaveTextContent('Button');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const seguinte = document.getElementById(campo.getAttribute('aria-activedescendant')!)!;
        await expect(seguinte).toHaveTextContent('Input');
      });
      // O anterior deixou de ser o selecionado — um destaque por vez.
      await expect(ativo).toHaveAttribute('aria-selected', 'false');

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(ativo).toHaveAttribute('aria-selected', 'true');
      });
    });

    await step('Enter escolhe o comando em destaque e zera a busca', async () => {
      const antes = espiao.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await waitFor(async () => {
        await expect(espiao.mock.calls.length).toBe(antes + 1);
      });
      await expect(espiao.mock.calls[antes][0]).toEqual({ value: 'button', label: 'Button' });
      // A busca volta ao zero para o próximo comando — o campo não pode virar
      // o nome do que acabou de rodar.
      await waitFor(async () => {
        await expect(campo).toHaveValue('');
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
      // E a lista continua aberta: a paleta não tem estado fechado.
      await expect(campo).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar num comando também o escolhe', async () => {
      const antes = espiao.mock.calls.length;
      await userEvent.click(canvas.getByRole('option', { name: 'cn()' }));

      await waitFor(async () => {
        await expect(espiao.mock.calls.length).toBe(antes + 1);
      });
      await expect(espiao.mock.calls[antes][0]).toEqual({ value: 'cn', label: 'cn()' });
      await waitFor(async () => {
        await expect(campo).toHaveValue('');
      });
    });
  },
};
