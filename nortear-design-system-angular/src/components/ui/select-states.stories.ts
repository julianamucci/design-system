import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_SELECT } from './select';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

const STATES = [
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
const stateLabel = (value: unknown): string =>
  STATES.find((e) => e.value === value)?.label ?? String(value ?? '');

const meta: Meta = {
  title: 'Components/Form/Select/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_SELECT] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
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
    props: { states: STATES },
    template: `
      <nds-select>
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (state of states; track state.value) {
            <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox', { name: 'Estado' });

    await step('O gatilho anuncia o campo vazio', async () => {
      await expect(trigger).toHaveTextContent('Selecione...');
      // `data-placeholder` é o que faz a folha pintar o texto em cor secundária;
      // sem ele o placeholder teria o mesmo peso de um valor escolhido.
      await expect(trigger.hasAttribute('data-placeholder')).toBe(true);
      await expect(trigger.getAttribute('data-state')).toBe('closed');
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
    props: { states: STATES, stateLabel },
    template: `
      <nds-select defaultValue="rj" [itemToStringLabel]="stateLabel">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (state of states; track state.value) {
            <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox', { name: 'Estado' });

    await step('O gatilho exibe o rótulo do valor escolhido', async () => {
      await waitFor(async () => {
        await expect(trigger).toHaveTextContent('Rio de Janeiro');
      });
      await expect(trigger.hasAttribute('data-placeholder')).toBe(false);
      // `data-filled` é o que um Field usa para saber que o campo tem conteúdo.
      await expect(trigger.hasAttribute('data-filled')).toBe(true);
    });

    await step('Ao abrir, a opção escolhida é a que nasce marcada e destacada', async () => {
      await userEvent.click(trigger);
      const list = await waitForPortal('listbox', { name: 'Estado' });
      const escolhida = within(list).getByRole('option', { name: 'Rio de Janeiro' });

      await expect(escolhida.getAttribute('aria-selected')).toBe('true');
      await waitFor(async () => {
        await expect(list.getAttribute('aria-activedescendant')).toBe(escolhida.id);
      });

      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('listbox');
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: {
    // `functional.item1` saiu daqui: esta story nasce ABERTA (`defaultOpen`) e
    // nunca clica no gatilho, então metade do item — "clicar abre" — não era
    // exercitada. Quem cobre o item inteiro é a Playground.
    //
    // `functional.item4` entrou: é aqui que a busca por digitação é
    // exercitada, com a lista aberta. O item foi reescrito no conteúdo
    // compartilhado para não prometer que ela funciona com a lista FECHADA —
    // isso varia por plataforma, e nesta ela não funciona.
    covers: ['functional.item4', 'visual.item3'],
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
    props: { states: STATES },
    template: `
      <nds-select [defaultOpen]="true" [modal]="false">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (state of states; track state.value) {
            <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox', { name: 'Estado' });
    const list = await waitForPortal('listbox', { name: 'Estado' });
    const options = within(list).getAllByRole('option');

    await step('O gatilho e a lista concordam sobre estar aberta', async () => {
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await expect(trigger.getAttribute('data-state')).toBe('open');
      // `aria-controls` só existe enquanto a lista existe — é o detalhe que
      // evita `aria-valid-attr-value` no axe quando ela desmonta.
      await expect(trigger.getAttribute('aria-controls')).toBe(list.id);
    });

    await step('Quem detém o foco é a lista, não a opção', async () => {
      await waitFor(async () => {
        await expect(document.activeElement).toBe(list);
      });
      for (const opcao of options) {
        await expect(opcao.hasAttribute('tabindex')).toBe(false);
      }
    });

    await step('A seta para baixo desce um item por vez', async () => {
      await waitFor(async () => {
        await expect(list.getAttribute('aria-activedescendant')).toBe(options[0].id);
      });
      await userEvent.keyboard('{ArrowDown}');
      await expect(list.getAttribute('aria-activedescendant')).toBe(options[1].id);
      await expect(options[1].hasAttribute('data-highlighted')).toBe(true);
    });

    await step('Home e End vão ao primeiro e ao último', async () => {
      await userEvent.keyboard('{End}');
      await expect(list.getAttribute('aria-activedescendant')).toBe(
        options[options.length - 1].id,
      );
      await userEvent.keyboard('{Home}');
      await expect(list.getAttribute('aria-activedescendant')).toBe(options[0].id);
    });

    await step('Digitar uma letra salta para a opção que começa com ela', async () => {
      // Typeahead: numa lista de estados é o que evita percorrer opção por
      // opção. Vem do popup do primitivo, e some se a lista de itens não for
      // encontrada — daí valer a pena afirmar.
      await userEvent.keyboard('m');
      await expect(list.getAttribute('aria-activedescendant')).toBe(
        within(list).getByRole('option', { name: 'Minas Gerais' }).id,
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
    props: { states: STATES, onValueChange: fn() },
    template: `
      <nds-select disabled (valueChange)="onValueChange($event)">
        <button ndsSelectTrigger aria-label="Estado">
          <span ndsSelectValue placeholder="Selecione..."></span>
        </button>

        <ng-template ndsSelectContent>
          @for (state of states; track state.value) {
            <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
          }
        </ng-template>
      </nds-select>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('combobox', { name: 'Estado' });

    await step('O gatilho se anuncia bloqueado', async () => {
      // `disabled` nativo, e não só `aria-disabled`: é o atributo que tira o
      // botão do percurso do Tab e cancela o clique no próprio navegador.
      await expect((trigger as HTMLButtonElement).disabled).toBe(true);
      await expect(trigger.hasAttribute('data-disabled')).toBe(true);
    });

    await step('Clicar não abre a lista', async () => {
      await userEvent.click(trigger);
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
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
    props: { states: STATES },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <nds-select invalid>
          <button ndsSelectTrigger aria-label="Estado">
            <span ndsSelectValue placeholder="Selecione..."></span>
          </button>

          <ng-template ndsSelectContent>
            @for (state of states; track state.value) {
              <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
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
    const list = await waitForPortal('listbox', { name: 'Estado' });
    const indisponivel = within(list).getByRole('option', { name: 'Rio de Janeiro' });

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
      await expect(list.getAttribute('aria-activedescendant')).not.toBe(indisponivel.id);
    });
  },
};
