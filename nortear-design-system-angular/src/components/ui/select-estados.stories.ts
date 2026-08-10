import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_SELECT } from './select';
import { esperarPortal, esperarPortalSumir, REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';

const ESTADOS = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
] as const;

/**
 * Resolve o rótulo de um valor sem a lista montada.
 *
 * Os rótulos das opções só existem enquanto a lista está aberta — o portal
 * desmonta o conteúdo ao fechar. Um valor que chega antes da primeira abertura
 * (`defaultValue`, valor inicial de um `FormControl`) não teria rótulo, e o
 * gatilho mostraria o valor cru. Esta função é o caminho que o primitivo
 * oferece para isso, e é o que a docs page recomenda.
 */
const rotuloDoEstado = (valor: unknown): string =>
  ESTADOS.find((e) => e.value === valor)?.label ?? String(valor ?? '');

const meta: Meta = {
  title: 'UI/Select/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_SELECT] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        component:
          'Vazio, preenchido, aberto, bloqueado, inválido e com opção indisponível. ' +
          'Teclado, foco e posicionamento vêm do primitivo — o que estas stories provam ' +
          'é que a composição não desfaz nada disso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story: 'Nada escolhido: o gatilho mostra o placeholder, em cor secundária.',
      },
    },
  },
  render: () => ({
    props: { estados: ESTADOS },
    template: `
      <nds-select>
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (estado of estados; track estado.value) {
            <div ndsSelectItem [value]="estado.value">{{ estado.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('combobox', { name: 'Estado' });

    await step('O gatilho anuncia o campo vazio', async () => {
      await expect(gatilho).toHaveTextContent('Selecione...');
      // `data-placeholder` é o que faz a folha pintar o texto em cor secundária;
      // sem ele o placeholder teria o mesmo peso de um valor escolhido.
      await expect(gatilho.hasAttribute('data-placeholder')).toBe(true);
      await expect(gatilho.getAttribute('data-state')).toBe('closed');
    });

    await step('A lista não existe enquanto está fechada', async () => {
      // Fechado não é "escondido com display:none": o portal desmonta. Um
      // listbox só escondido continuaria no percurso do leitor de tela.
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
    });
  },
};

// ─── Selected ─────────────────────────────────────────────────────────────────

export const Selected: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Valor pré-escolhido via `defaultValue`. O gatilho passa a anunciar o rótulo da ' +
          'opção — e o rótulo vem de `itemToStringLabel`, porque a lista ainda não foi ' +
          'aberta nenhuma vez. (Pré-selecionar serve para ver o estado; em formulário ' +
          'real, evite.)',
      },
    },
  },
  render: () => ({
    props: { estados: ESTADOS, rotuloDoEstado },
    template: `
      <nds-select defaultValue="rj" [itemToStringLabel]="rotuloDoEstado">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (estado of estados; track estado.value) {
            <div ndsSelectItem [value]="estado.value">{{ estado.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('combobox', { name: 'Estado' });

    await step('O gatilho exibe o rótulo do valor escolhido', async () => {
      await waitFor(async () => {
        await expect(gatilho).toHaveTextContent('Rio de Janeiro');
      });
      await expect(gatilho.hasAttribute('data-placeholder')).toBe(false);
      // `data-filled` é o que um Field usa para saber que o campo tem conteúdo.
      await expect(gatilho.hasAttribute('data-filled')).toBe(true);
    });

    await step('Ao abrir, a opção escolhida é a que nasce marcada e destacada', async () => {
      await userEvent.click(gatilho);
      const lista = await esperarPortal('listbox', { name: 'Estado' });
      const escolhida = within(lista).getByRole('option', { name: 'Rio de Janeiro' });

      await expect(escolhida.getAttribute('aria-selected')).toBe('true');
      await waitFor(async () => {
        await expect(lista.getAttribute('aria-activedescendant')).toBe(escolhida.id);
      });

      await userEvent.keyboard('{Escape}');
      await esperarPortalSumir('listbox');
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: {
      description: {
        story:
          'Lista aberta. Num listbox o teclado é do popup: os itens não recebem foco um ' +
          'a um, o destaque anda por `aria-activedescendant` — é o padrão WAI-ARIA, e é ' +
          'o oposto do menu.',
      },
    },
  },
  render: () => ({
    props: { estados: ESTADOS },
    template: `
      <nds-select [defaultOpen]="true" [modal]="false">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (estado of estados; track estado.value) {
            <div ndsSelectItem [value]="estado.value">{{ estado.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('combobox', { name: 'Estado' });
    const lista = await esperarPortal('listbox', { name: 'Estado' });
    const opcoes = within(lista).getAllByRole('option');

    await step('O gatilho e a lista concordam sobre estar aberta', async () => {
      await expect(gatilho.getAttribute('aria-expanded')).toBe('true');
      await expect(gatilho.getAttribute('data-state')).toBe('open');
      // `aria-controls` só existe enquanto a lista existe — é o detalhe que
      // evita `aria-valid-attr-value` no axe quando ela desmonta.
      await expect(gatilho.getAttribute('aria-controls')).toBe(lista.id);
    });

    await step('Quem detém o foco é a lista, não a opção', async () => {
      await waitFor(async () => {
        await expect(document.activeElement).toBe(lista);
      });
      for (const opcao of opcoes) {
        await expect(opcao.hasAttribute('tabindex')).toBe(false);
      }
    });

    await step('A seta para baixo desce um item por vez', async () => {
      await waitFor(async () => {
        await expect(lista.getAttribute('aria-activedescendant')).toBe(opcoes[0].id);
      });
      await userEvent.keyboard('{ArrowDown}');
      await expect(lista.getAttribute('aria-activedescendant')).toBe(opcoes[1].id);
      await expect(opcoes[1].hasAttribute('data-highlighted')).toBe(true);
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      await userEvent.keyboard('{End}');
      await expect(lista.getAttribute('aria-activedescendant')).toBe(
        opcoes[opcoes.length - 1].id,
      );
      await userEvent.keyboard('{Home}');
      await expect(lista.getAttribute('aria-activedescendant')).toBe(opcoes[0].id);
    });

    await step('Digitar uma letra salta para a opção que começa com ela', async () => {
      // Typeahead: numa lista de estados é o que evita percorrer opção por
      // opção. Vem do popup do primitivo, e some se a lista de itens não for
      // encontrada — daí valer a pena afirmar.
      await userEvent.keyboard('m');
      await expect(lista.getAttribute('aria-activedescendant')).toBe(
        within(lista).getByRole('option', { name: 'Minas Gerais' }).id,
      );
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story: 'Campo bloqueado: o gatilho não abre, não recebe foco e some do percurso do Tab.',
      },
    },
  },
  render: () => ({
    props: { estados: ESTADOS, onValueChange: fn() },
    template: `
      <nds-select disabled (valueChange)="onValueChange($event)">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (estado of estados; track estado.value) {
            <div ndsSelectItem [value]="estado.value">{{ estado.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('combobox', { name: 'Estado' });

    await step('O gatilho se anuncia bloqueado', async () => {
      // `disabled` nativo, e não só `aria-disabled`: é o atributo que tira o
      // botão do percurso do Tab e cancela o clique no próprio navegador.
      await expect((gatilho as HTMLButtonElement).disabled).toBe(true);
      await expect(gatilho.hasAttribute('data-disabled')).toBe(true);
    });

    await step('Clicar não abre a lista', async () => {
      await userEvent.click(gatilho);
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(gatilho.getAttribute('aria-expanded')).toBe('false');
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Campo reprovado pela validação. A borda de perigo acompanha `aria-invalid` — ' +
          'a cor não é o aviso, é o reforço dele.',
      },
    },
  },
  render: () => ({
    props: { estados: ESTADOS },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <nds-select invalid>
          <button ndsSelectTrigger aria-label="Estado">
            <span ndsSelectValue placeholder="Selecione..."></span>
          </button>

          <ng-template ndsSelectContent>
            @for (estado of estados; track estado.value) {
              <div ndsSelectItem [value]="estado.value">{{ estado.label }}</div>
            }
          </ng-template>
        </nds-select>

        <nds-select>
          <button ndsSelectTrigger aria-label="Cidade">
            <span ndsSelectValue placeholder="Selecione..."></span>
          </button>

          <ng-template ndsSelectContent>
            <div ndsSelectItem value="campinas">Campinas</div>
          </ng-template>
        </nds-select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const invalido = canvas.getByRole('combobox', { name: 'Estado' });
    const valido = canvas.getByRole('combobox', { name: 'Cidade' });

    await step('O gatilho inválido se anuncia como tal', async () => {
      await expect(invalido.getAttribute('aria-invalid')).toBe('true');
      await expect(invalido.hasAttribute('data-invalid')).toBe(true);
      await expect(valido.getAttribute('aria-invalid')).toBe(null);
    });

    await step('A borda muda de cor junto com o atributo', async () => {
      // Comparação contra um campo válido no mesmo tema: afirma que a regra
      // `[aria-invalid="true"]` da folha chegou, sem cravar o valor do token.
      await expect(getComputedStyle(invalido).borderTopColor).not.toBe(
        getComputedStyle(valido).borderTopColor,
      );
    });
  },
};

// ─── Opção indisponível ───────────────────────────────────────────────────────

export const OptionDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Uma opção indisponível continua sendo anunciada — é assim que quem usa leitor ' +
          'de tela descobre que ela existe e por que não pode escolhê-la. O que ela não ' +
          'faz é ser escolhida.',
      },
    },
  },
  render: () => ({
    props: { onValueChange: fn() },
    template: `
      <nds-select [defaultOpen]="true" [modal]="false" (valueChange)="onValueChange($event)">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          <div ndsSelectItem value="sp">São Paulo</div>
          <div ndsSelectItem value="rj" disabled>Rio de Janeiro</div>
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ step }) => {
    const lista = await esperarPortal('listbox', { name: 'Estado' });
    const indisponivel = within(lista).getByRole('option', { name: 'Rio de Janeiro' });

    await step('A opção se anuncia indisponível', async () => {
      await expect(indisponivel.getAttribute('aria-disabled')).toBe('true');
      await expect(indisponivel.hasAttribute('data-disabled')).toBe(true);
    });

    await step('O clique é barrado pela folha, não só pelo callback', async () => {
      // `pointer-events: none` é o que impede o clique de chegar; sem ele o
      // bloqueio dependeria de cada consumidor lembrar de checá-lo.
      await expect(getComputedStyle(indisponivel).pointerEvents).toBe('none');
    });

    await step('O typeahead pula a opção indisponível', async () => {
      // O destaque só pousa em opção escolhível: parar numa que não se pode
      // escolher deixaria o Enter sem efeito, sem explicação.
      await userEvent.keyboard('r');
      await expect(lista.getAttribute('aria-activedescendant')).not.toBe(indisponivel.id);
    });
  },
};
