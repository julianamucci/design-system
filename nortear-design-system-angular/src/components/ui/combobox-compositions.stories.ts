import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import type { ComboboxFilter } from '@radix-ng/primitives/combobox';
import { NDS_COMBOBOX } from './combobox';
import { comboboxCustomFilterSnippet, comboboxControlledSnippet } from './combobox.source';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';

// Mesma lista da spec de exemplos, com os mesmos rótulos das outras stacks:
// divergir aqui faz a mesma story mostrar coisa diferente em cada stack, e isso
// só aparece tarde, na comparação final.
const COUNTRIES = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'colombia', label: 'Colômbia' },
  { value: 'mexico', label: 'México' },
  { value: 'peru', label: 'Peru' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'espanha', label: 'Espanha' },
  { value: 'uruguai', label: 'Uruguai' },
] as const;

const meta: Meta = {
  title: 'Components/Form/Combobox/Compositions',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_COMBOBOX, NdsButton] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composições do Combobox: busca com filtro do consumidor e campo controlado por fora.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Filtro do consumidor ─────────────────────────────────────────────────────

/** Texto sem acento e em caixa baixa — a base de comparação do filtro abaixo. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Filtro do CONSUMIDOR: casa só pelo INÍCIO do rótulo.
 *
 * O padrão do campo casa em qualquer posição — quem digita "gen" acha
 * "Argentina". Este recusa, e é essa diferença que prova que o predicado
 * entregue pela chave é quem manda: sem ela, a story mostraria um filtro que
 * apenas repete o comportamento de fábrica.
 *
 * DIVERGÊNCIA DE API, registrada e não alinhada. A assinatura é a da lib desta
 * stack, de TRÊS argumentos — `(itemValue, query, itemToString?)`. O primeiro é
 * o valor CRU do item, e cada opção é registrada por string
 * (`[value]="item.value"`), então o que chega é `'argentina'`, e não o objeto
 * com o rótulo: quem sabe devolver o texto de exibição é o `itemToString` que a
 * própria lib passa, e por isso ele entra na comparação em vez de uma busca na
 * lista. Um predicado de dois parâmetros compila e nunca vê o rótulo.
 */
const startsWithFilter: ComboboxFilter = (itemValue, query, itemToString) => {
  const label = itemToString?.(itemValue) ?? String(itemValue ?? '');
  return normalize(label).startsWith(normalize(query));
};

export const CustomFilter: Story = {
  parameters: {
    docs: {
      source: { transform: () => comboboxCustomFilterSnippet() },
      description: {
        story:
          'A busca é do consumidor: aqui o campo só aceita o que começa com o texto digitado, ' +
          'e o que casa no meio da palavra deixa de aparecer.',
      },
    },
  },
  render: () => ({
    props: { items: COUNTRIES, filter: startsWithFilter },
    template: `
      <nds-combobox name="pais" [filter]="filter">
        <label ndsComboboxLabel>País</label>

        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput placeholder="Buscar país" />
          <button ndsComboboxClear aria-label="Limpar"></button>
          <button ndsComboboxTrigger aria-label="Abrir lista">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>

        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of items; track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>Nenhum resultado</div>
        </ng-template>
      </nds-combobox>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox') as HTMLInputElement;
    const body = within(document.body);

    await step('O que casa no MEIO do rótulo é recusado', async () => {
      // "gen" está dentro de "Argentina", e o filtro de fábrica a acharia. O do
      // consumidor não — é esta asserção que separa os dois. `clear` antes de
      // digitar porque o painel Interactions reexecuta a play no MESMO DOM.
      await userEvent.clear(field);
      await userEvent.type(field, 'gen');
      await waitForPortal('listbox', { name: 'País' });

      await waitFor(async () => {
        await expect(body.queryAllByRole('option')).toHaveLength(0);
      });
      const empty = document.body.querySelector('[data-slot="combobox-empty"]');
      await expect(empty).not.toBeNull();
      await expect(empty).toHaveTextContent('Nenhum resultado');
    });

    await step('O que casa no INÍCIO continua sendo achado', async () => {
      // O contraponto: sem ele, um filtro que rejeitasse tudo passaria no passo
      // anterior e a story diria que o predicado funciona.
      await userEvent.clear(field);
      await userEvent.type(field, 'arg');
      await waitFor(async () => {
        await expect(body.queryAllByRole('option')).toHaveLength(1);
      });
      await expect(body.queryAllByRole('option')[0]).toHaveTextContent('Argentina');
    });

    await step('Sem texto, a lista inteira volta', async () => {
      // Devolve a story ao estado que o Chromatic fotografa: lista aberta e
      // completa, sem filtro nenhum.
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(body.queryAllByRole('option')).toHaveLength(COUNTRIES.length);
      });
    });
  },
};

// ─── Controlado por fora ──────────────────────────────────────────────────────

/** País que o botão escreve no estado de fora, sem passar pela lista. */
const EXTERNAL_COUNTRY = COUNTRIES[2];

/** Texto que o outro botão injeta na busca sem ninguém digitar. */
const EXTERNAL_QUERY = 'por';

/**
 * As duas pontas do estado controlado, fora do componente.
 *
 * São SINAIS, e não campos de um objeto comum: esta stack roda sem zone.js, e é
 * a escrita no sinal que agenda o redesenho. Um campo comum mudaria o estado e
 * deixaria a tela como estava — e a play do último passo mediria a própria
 * escrita, não o efeito dela.
 *
 * Moram no módulo, e não dentro do `render`, porque a play precisa LER o estado
 * de fora para provar que escolher no campo chegou até ele.
 */
const external = {
  chosen: signal<string | null>(null),
  query: signal(''),
};

export const Controlled: Story = {
  parameters: {
    docs: {
      source: { transform: () => comboboxControlledSnippet() },
      description: {
        story:
          'A escolha e o texto de busca vivem fora do campo. Escolher na lista atualiza o estado ' +
          'de fora, e escrever nesse estado muda o que o campo mostra.',
      },
    },
  },
  render: () => ({
    props: {
      items: COUNTRIES,
      chosen: external.chosen,
      query: external.query,
      onValueChange: (value: unknown) => external.chosen.set((value as string | null) ?? null),
      onInputValueChange: (value: string) => external.query.set(value),
      fillQuery: () => external.query.set(EXTERNAL_QUERY),
      chooseExternal: () => {
        // As duas pontas juntas: quem controla o campo é dono do valor E do
        // texto, e escrever só o valor deixaria o campo mostrando a busca
        // anterior.
        external.chosen.set(EXTERNAL_COUNTRY.value);
        external.query.set(EXTERNAL_COUNTRY.label);
      },
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="md">
        <nds-combobox
          name="pais"
          [value]="chosen()"
          (valueChange)="onValueChange($event)"
          [inputValue]="query()"
          (inputValueChange)="onInputValueChange($event)"
        >
          <label ndsComboboxLabel>País</label>

          <div ndsComboboxInputWrapper>
            <input ndsComboboxInput placeholder="Buscar país" />
            <button ndsComboboxClear aria-label="Limpar"></button>
            <button ndsComboboxTrigger aria-label="Abrir lista">
              <svg ndsComboboxIcon></svg>
            </button>
          </div>

          <ng-template ndsComboboxPopup>
            <div ndsComboboxList>
              @for (item of items; track item.value) {
                <div ndsComboboxItem [value]="item.value">
                  {{ item.label }}
                  <span ndsComboboxItemIndicator></span>
                </div>
              }
            </div>
            <div ndsComboboxEmpty>Nenhum resultado</div>
          </ng-template>
        </nds-combobox>

        <div class="nds-cluster" data-spacing="md">
          <button ndsButton variant="outline" type="button" (click)="fillQuery()">
            Preencher a busca
          </button>
          <button ndsButton variant="outline" type="button" (click)="chooseExternal()">
            Escolher ${EXTERNAL_COUNTRY.label}
          </button>
        </div>

        <p class="nds-text-body">
          Escolhido: <span class="nds-font-mono">{{ chosen() ?? '—' }}</span>
        </p>
        <p class="nds-text-body">
          Busca: <span class="nds-font-mono">{{ query() || '—' }}</span>
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox') as HTMLInputElement;

    await step('Escolher no campo atualiza o estado de fora', async () => {
      // Cada passo estabelece a própria precondição: a play reexecuta no mesmo
      // DOM, e o estado de fora chega com o que a rodada anterior deixou.
      await userEvent.clear(field);
      await userEvent.type(field, 'uru');
      await waitForPortal('listbox', { name: 'País' });
      await userEvent.keyboard('{Enter}');
      await waitForPortalVanish('listbox');

      // O estado de fora guarda o VALOR e o campo mostra o RÓTULO: as duas
      // pontas do controle, cada uma no seu formato.
      await waitFor(async () => {
        await expect(external.chosen()).toBe('uruguai');
      });
      await expect(canvas.getByText('uruguai')).toBeVisible();
      await expect(field).toHaveValue('Uruguai');
    });

    await step('Escrever na busca por fora muda o texto do campo', async () => {
      // Ninguém digitou: o texto entrou pelo estado de fora e desceu ao campo.
      // Sem o texto controlado, o botão não mudaria nada aqui.
      await userEvent.click(canvas.getByRole('button', { name: 'Preencher a busca' }));
      await waitFor(async () => {
        await expect(field).toHaveValue(EXTERNAL_QUERY);
      });
      // E a escolha NÃO mudou junto: as duas pontas são independentes.
      await expect(external.chosen()).toBe('uruguai');
      await expect(canvas.getByText('uruguai')).toBeVisible();
    });

    await step('Escrever a escolha por fora muda o que a tela mostra', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: `Escolher ${EXTERNAL_COUNTRY.label}` }),
      );
      await waitFor(async () => {
        await expect(field).toHaveValue(EXTERNAL_COUNTRY.label);
      });
      await expect(canvas.getByText(EXTERNAL_COUNTRY.value)).toBeVisible();
    });

    await step('A lista marca como escolhida a opção que veio de fora', async () => {
      // O texto do campo sozinho provaria só o `inputValue`. É `aria-selected`
      // na opção que prova que o VALOR também desceu — e é ele que o leitor de
      // tela anuncia ao percorrer a lista.
      await userEvent.click(canvas.getByRole('button', { name: 'Abrir lista' }));
      const list = await waitForPortal('listbox', { name: 'País' });
      const chosen = within(list).getByRole('option', { name: EXTERNAL_COUNTRY.label });
      await expect(chosen).toHaveAttribute('aria-selected', 'true');

      // Devolve a story ao estado fechado que o Chromatic fotografa.
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('listbox');
    });
  },
};
