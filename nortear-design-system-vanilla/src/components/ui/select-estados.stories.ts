import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSelect, type SelectItem } from './select';
import { medirAnelDeFoco } from '@shared/testing/select-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Select: Default (placeholder visível), Selected (valor escolhido), Open (lista aberta em portal), Disabled (campo bloqueado), DisabledItem (apenas uma opção bloqueada), Invalid (aria-invalid + mensagem) e FocusVisible (anel `--ring`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASIC_ITEMS: SelectItem[] = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
];

/**
 * Campo com rótulo externo associado por `for`/`id`.
 *
 * O nome acessível vem do `aria-label`: `role="combobox"` não aceita nome vindo
 * do próprio conteúdo, e o conteúdo do gatilho é o valor exibido.
 */
function comRotulo(
  id: string,
  rotulo: string,
  opcoes: Parameters<typeof createSelect>[0],
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-sm';
  wrap.dataset.spacing = 'sm';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'nds-text-body nds-font-semibold';
  label.textContent = rotulo;

  wrap.append(label, createSelect({ ...opcoes, id, 'aria-label': rotulo }));
  return wrap;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    comRotulo('st-default', 'Estado', { placeholder: 'Selecione...', items: BASIC_ITEMS }),
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Estado inicial — placeholder visível, nenhum valor escolhido, lista fechada. Recomendado para forçar confirmação explícita do usuário.',
      },
    },
  },
  // Esta story NÃO interage de propósito: é a única que alcança o estado de
  // MONTAGEM. Uma asserção de placeholder dentro de uma play que escolhe uma
  // opção nunca sobrevive ao replay do painel Interactions.
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    await step('Campo fechado exibindo o placeholder', async () => {
      await expect(gatilho).toHaveTextContent('Selecione...');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // `data-placeholder` é o que faz a folha pintar o texto em cor secundária;
      // sem ele o placeholder teria o peso de um valor escolhido.
      await expect(gatilho).toHaveAttribute('data-placeholder');
    });

    await step('Nenhum valor viaja no formulário', async () => {
      const oculto = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="select-hidden-input"]',
      );
      await expect(oculto?.value).toBe('');
    });

    await step('A lista não existe enquanto está fechada', async () => {
      // Fechado não é "escondido": o portal desmonta. Uma lista só escondida
      // continuaria no percurso do leitor de tela.
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
    });

    await step('O rótulo externo nomeia o campo', async () => {
      await expect(gatilho).toHaveAccessibleName('Estado');
    });
  },
};

// ─── Selected ─────────────────────────────────────────────────────────────────

export const Selected: Story = {
  render: () =>
    comRotulo('st-selected', 'Estado', {
      placeholder: 'Selecione...',
      defaultValue: 'rj',
      items: BASIC_ITEMS,
    }),
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Valor inicial não-controlado — Rio de Janeiro escolhido de partida, placeholder oculto. (Pré-selecionar serve para ver o estado; em formulário real, evite.)',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    await step('O campo exibe o rótulo do valor escolhido', async () => {
      // O rótulo tem de existir ANTES da primeira abertura: as opções só existem
      // enquanto a lista está montada, então sem o mapa interno o campo mostraria
      // o valor cru "rj".
      await expect(gatilho).toHaveTextContent('Rio de Janeiro');
      await expect(gatilho).not.toHaveTextContent('Selecione...');
    });

    await step('O placeholder deixa de valer como estado do campo', async () => {
      await expect(gatilho).not.toHaveAttribute('data-placeholder');
    });

    await step('O valor inicial já viaja no formulário', async () => {
      const oculto = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="select-hidden-input"]',
      );
      await expect(oculto?.value).toBe('rj');
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  render: () =>
    comRotulo('st-open', 'Estado', { placeholder: 'Selecione...', items: BASIC_ITEMS }),
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Lista aberta, renderizada em portal no fim do documento — fora de qualquer `overflow` ou `z-index` do contexto. O gatilho segue com o foco do teclado e aponta a opção corrente por `aria-activedescendant`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    await step('Abrir mostra a lista em portal, e o campo concorda', async () => {
      // Idempotente: o clique só acontece com a lista fechada, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada — e a story
      // TERMINA aberta, que é o estado que ela documenta e o Chromatic fotografa.
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      const listbox = await waitForPortal('listbox');
      await expect(listbox).toBeVisible();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      // Portal de verdade: a lista mora no `body`, não dentro do campo.
      await expect(canvasElement.contains(listbox)).toBe(false);
      await expect(listbox.parentElement).toHaveAttribute('data-slot', 'select-positioner');
    });

    await step('A lista é dimensionada pelo campo que a ancora', async () => {
      // A folha compartilhada dimensiona o painel pelo ancoradouro, lendo
      // `--anchor-width`. Sem a fábrica publicar a largura medida, a regra cairia
      // no `auto` do fallback e o painel sairia com a largura do texto mais longo
      // — divergindo das outras stacks, que recebem a variável da lib headless.
      const listbox = await waitForPortal('listbox');
      const larguraDoCampo = gatilho.getBoundingClientRect().width;
      const publicada = parseFloat(getComputedStyle(listbox).getPropertyValue('--anchor-width'));
      await expect(Math.abs(publicada - larguraDoCampo)).toBeLessThan(2);
      // E o painel nunca sai mais ESTREITO que o campo — a folha tem um mínimo
      // próprio, então o resultado é "pelo menos a largura do campo".
      await expect(listbox.getBoundingClientRect().width).toBeGreaterThanOrEqual(
        larguraDoCampo - 1,
      );
    });

    await step('A seta para baixo anda um item por vez, e a de cima volta', async () => {
      const listbox = await waitForPortal('listbox');
      const destacada = () =>
        within(listbox)
          .getAllByRole('option')
          .findIndex((o) => o.hasAttribute('data-highlighted'));
      const ultimo = within(listbox).getAllByRole('option').length - 1;

      const partida = destacada();
      await userEvent.keyboard('{ArrowDown}');
      const primeiro = Math.min(partida + 1, ultimo);
      await waitFor(async () => {
        await expect(destacada()).toBe(primeiro);
      });

      await userEvent.keyboard('{ArrowDown}');
      const segundo = Math.min(primeiro + 1, ultimo);
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo - 1);
      });
    });

    await step('Home e End vão aos extremos da lista', async () => {
      const listbox = await waitForPortal('listbox');
      const opcoes = () => within(listbox).getAllByRole('option');
      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(opcoes()[opcoes().length - 1]).toHaveAttribute('data-highlighted');
      });
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(opcoes()[0]).toHaveAttribute('data-highlighted');
      });
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () =>
    comRotulo('st-disabled', 'Estado', {
      placeholder: 'Selecione...',
      disabled: true,
      items: BASIC_ITEMS,
    }),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Campo bloqueado — opacidade reduzida, cursor de bloqueio, fora do percurso do Tab, e a lista não abre.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    await step('O campo se anuncia bloqueado', async () => {
      // `disabled` nativo, e não só `aria-disabled`: é o atributo que tira o
      // botão do percurso do Tab e cancela o clique no próprio navegador.
      await expect(gatilho).toBeDisabled();
    });

    await step('Bloqueado, o campo não recebe foco', async () => {
      gatilho.focus();
      await expect(gatilho).not.toHaveFocus();
    });

    // Clique em elemento desabilitado é exceção legítima à regra de
    // idempotência: ele não muda de estado em rodada nenhuma.
    await step('Clicar não abre a lista', async () => {
      // A conta é a DIFERENÇA, e não o total: uma lista deixada aberta por outra
      // story é defeito de limpeza dela, e é lá que ele deve reprovar — aqui
      // esconderia o que esta story mede, que é o clique não abrir nada.
      const antes = within(document.body).queryAllByRole('listbox').length;
      await userEvent.click(gatilho, { pointerEventsCheck: 0 });
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).not.toHaveAttribute('aria-controls');
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(antes);
    });
  },
};

// ─── DisabledItem ─────────────────────────────────────────────────────────────

export const DisabledItem: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'lg';

    wrap.append(
      comRotulo('st-disabled-item', 'Estado', {
        placeholder: 'Selecione...',
        items: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais (indisponível)', disabled: true },
        ],
      }),
      // O caso extremo do mesmo estado: NENHUMA opção disponível. Uma lista de
      // filtro esgotada chega aqui, e é onde o destaque não tem onde pousar — o
      // campo tem de abrir sem apontar nada e não pode escolher com Enter.
      comRotulo('st-none-available', 'Cidade', {
        placeholder: 'Selecione...',
        items: [
          { value: 'a', label: 'Campinas (indisponível)', disabled: true },
          { value: 'b', label: 'Santos (indisponível)', disabled: true },
        ],
      }),
    );
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Opções indisponíveis. No primeiro campo, só a terceira: ela se anuncia bloqueada e o teclado a pula. No segundo, todas: a lista abre sem apontar nenhuma, e não há o que confirmar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const [gatilho, gatilhoVazio] = canvas.getAllByRole('combobox');

    const abridor = (alvo: HTMLElement) => async () => {
      if (alvo.getAttribute('aria-expanded') === 'true') {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('listbox');
      }
      await userEvent.click(alvo);
      return await waitForPortal('listbox');
    };
    const abrir = abridor(gatilho);

    await step('A opção indisponível se anuncia bloqueada', async () => {
      const listbox = await abrir();
      const mg = within(listbox).getByRole('option', { name: /Minas Gerais/ });
      await expect(mg).toHaveAttribute('aria-disabled', 'true');
    });

    await step('O teclado pula a opção bloqueada e para na anterior', async () => {
      const listbox = await abrir();
      const opcoes = () => within(listbox).getAllByRole('option');
      // Três setas para baixo numa lista de três, sendo a última bloqueada: o
      // destaque para na segunda. Sem a guarda, ele pousaria numa opção que o
      // Enter não consegue escolher — e o teclado ficaria preso ali.
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      await waitFor(async () => {
        await expect(opcoes()[1]).toHaveAttribute('data-highlighted');
        await expect(opcoes()[2]).not.toHaveAttribute('data-highlighted');
      });

      // Mesma abertura, para não depender do que outro passo deixou: o Enter
      // resolve na opção disponível em que o destaque parou.
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('listbox');
      await expect(gatilho).toHaveTextContent('Rio de Janeiro');
    });

    await step('Clicar na opção bloqueada não escolhe nada', async () => {
      const listbox = await abrir();
      const mg = within(listbox).getByRole('option', { name: /Minas Gerais/ });
      await userEvent.click(mg, { pointerEventsCheck: 0 });
      // A folha põe `pointer-events: none` na opção bloqueada, então o clique nem
      // chega — e o campo continua no valor anterior, com a lista aberta.
      await expect(gatilho).toHaveTextContent('Rio de Janeiro');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
    });

    await step('Sem nenhuma opção disponível, a lista abre sem apontar nada', async () => {
      const listbox = await abridor(gatilhoVazio)();
      await expect(within(listbox).getAllByRole('option')).toHaveLength(2);
      // Nada destacado, e nada apontado: apontar uma opção que o Enter não resolve
      // seria prometer uma escolha que não existe.
      await expect(listbox.querySelectorAll('[data-highlighted]')).toHaveLength(0);
      await expect(gatilhoVazio).not.toHaveAttribute('aria-activedescendant');
    });

    await step('E as setas e o Enter não têm o que fazer', async () => {
      const listbox = await waitForPortal('listbox');
      const textoAntes = gatilhoVazio.textContent;
      await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}');
      // A lista continua aberta: o Enter sem opção destacada não escolhe nem fecha.
      await expect(gatilhoVazio).toHaveAttribute('aria-expanded', 'true');
      await expect(listbox.querySelectorAll('[data-highlighted]')).toHaveLength(0);
      await expect(gatilhoVazio.textContent).toBe(textoAntes);
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.htmlFor = 'st-invalid';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = 'Estado';

    const select = createSelect({
      id: 'st-invalid',
      'aria-label': 'Estado',
      'aria-invalid': true,
      'aria-describedby': 'st-invalid-msg',
      placeholder: 'Selecione...',
      items: BASIC_ITEMS,
    });

    const msg = document.createElement('p');
    msg.id = 'st-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Selecione um estado para continuar.';

    wrap.append(label, select, msg);
    return wrap;
  },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Estado de erro no campo fechado. A borda e o anel vêm da folha compartilhada, e a mensagem é associada ao campo para o leitor de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    await step('O campo inválido se anuncia como tal', async () => {
      await expect(gatilho).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Mensagem de erro associada e visível', async () => {
      await expect(gatilho).toHaveAttribute('aria-describedby', 'st-invalid-msg');
      await expect(canvas.getByText(/Selecione um estado para continuar/)).toBeVisible();
    });

    await step('O anel de erro vem da folha compartilhada', async () => {
      // A story NÃO pinta nada: se a regra de estado inválido sumir do CSS
      // compartilhado, isto reprova.
      await expect(getComputedStyle(gatilho).boxShadow).not.toBe('none');
    });

    await step('Focar o campo inválido continua mostrando o foco', async () => {
      // O anel destrutivo é PERMANENTE e era declarado depois do
      // `:focus-visible` com a mesma especificidade: sem a regra de aninhamento,
      // focar um campo inválido não mudava nada na tela. `boxShadow !== 'none'`
      // passaria mesmo assim — só a MUDANÇA reprova.
      await expect(medirAnelDeFoco(gatilho).mudou).toBe(true);
    });
  },
};

// ─── FocusVisible ─────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  render: () =>
    comRotulo('st-focus', 'Estado', { placeholder: 'Selecione...', items: BASIC_ITEMS }),
  parameters: {
    docs: {
      description: {
        story: 'Foco por teclado — anel desenhado a partir de `--ring` ao redor do campo fechado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    await step('O campo recebe foco por Tab', async () => {
      // Solta o foco antes de tabular: no replay ele já estaria no campo, e o Tab
      // passaria PARA O SEGUINTE — a asserção reprovaria um comportamento certo.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(gatilho).toHaveFocus();
    });

    await step('E o foco é visível, não só existente', async () => {
      await expect(medirAnelDeFoco(gatilho).mudou).toBe(true);
    });
  },
};
