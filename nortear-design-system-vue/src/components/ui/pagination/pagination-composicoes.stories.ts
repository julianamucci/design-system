import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, fn, userEvent } from 'storybook/test';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './index';

const meta = {
  title: 'UI/Pagination/Compositions',
  component: Pagination,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composições típicas: Simple (5 páginas), WithEllipsis (12 páginas), LastPage (Próxima desabilitado), Controlled (estado externo) e CompleteTable (rodapé de tabela).',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};

const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

export const Simple: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Total pequeno: todos os números aparecem em sequência, sem reticências. Previous e Next nas pontas.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup: () => ({ paginas: [1, 2, 3, 4, 5] }),
    template: `
      <Pagination :total="50" :items-per-page="10" :page="1" aria-label="Paginação simples">
        <PaginationContent>
          <PaginationItem><PaginationPrevious /></PaginationItem>
          <PaginationItem v-for="n in paginas" :key="n">
            <PaginationLink href="#" :is-active="n === 1" :aria-label="\`Ir para página \${n}\`" @click.prevent>
              {{ n }}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem><PaginationNext /></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa mostra todos os números, sem reticências', async () => {
      // visual.item1 — é o estado que o Chromatic fotografa como "default".
      const numerados = canvasElement.querySelectorAll('[data-slot="pagination-link"]');
      await expect(numerados.length).toBe(5);
      await expect([...numerados].map((l) => l.textContent?.trim())).toEqual([
        '1', '2', '3', '4', '5',
      ]);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length,
      ).toBe(0);
    });

    await step('A primeira página é a atual e Anterior está desabilitado', async () => {
      await expect(canvas.getByRole('link', { name: 'Ir para página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(canvas.getByRole('button', { name: ROTULO_ANTERIOR })).toBeDisabled();
    });
  },
};

export const WithEllipsis: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Lista longa: primeira, última, atual e vizinhas ficam visíveis; o resto vira reticências decorativas.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup: () => ({ trechos: [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12] }),
    template: `
      <Pagination :total="120" :items-per-page="10" :page="6" aria-label="Paginação com reticências">
        <PaginationContent>
          <PaginationItem><PaginationPrevious /></PaginationItem>
          <PaginationItem v-for="(trecho, i) in trechos" :key="i">
            <PaginationEllipsis v-if="trecho === 'ellipsis'" />
            <PaginationLink
              v-else
              href="#"
              :is-active="trecho === 6"
              :aria-label="\`Ir para página \${trecho}\`"
              @click.prevent
            >
              {{ trecho }}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem><PaginationNext /></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('As páginas distantes colapsam em reticências', async () => {
      // visual.item2
      const reticencias = canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]');
      await expect(reticencias.length).toBe(2);
      for (const item of reticencias) {
        // notes.item3: o caractere tipográfico, não três pontos e não um ícone.
        await expect(item.textContent?.trim()).toBe('…');
        await expect(item.tagName).toBe('SPAN');
      }
    });

    await step('As reticências não são lidas nem tabuladas', async () => {
      const reticencias = canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]');
      for (const item of reticencias) {
        await expect(item).toHaveAttribute('aria-hidden', 'true');
        await expect(item.hasAttribute('tabindex')).toBe(false);
      }
      // Cinco números continuam navegáveis; Previous e Next são botões.
      await expect(canvas.getAllByRole('link').length).toBe(5);
    });
  },
};

export const LastPage: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'Na última página o controle Próxima fica desabilitado, pelo mesmo par de atributos usado em Anterior.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup: () => ({ paginas: [8, 9, 10], onPageChange }),
    template: `
      <Pagination :total="100" :items-per-page="10" :page="10" aria-label="Paginação na última página">
        <PaginationContent>
          <PaginationItem><PaginationPrevious /></PaginationItem>
          <PaginationItem v-for="n in paginas" :key="n">
            <PaginationLink href="#" :is-active="n === 10" :aria-label="\`Ir para página \${n}\`" @click.prevent>
              {{ n }}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext @click="onPageChange(11)" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const proxima = canvas.getByRole('button', { name: ROTULO_PROXIMA });

    await step('Próxima está marcado como desabilitado', async () => {
      await expect(proxima).toBeDisabled();
      await expect(getComputedStyle(proxima).pointerEvents).toBe('none');
    });

    await step('Clicar em Próxima não navega', async () => {
      // functional.item3 — o clique sintético do elemento, e não `fireEvent`:
      // aqui o controle é um <button> com `disabled` nativo, e o navegador barra
      // tanto o clique real quanto o `click()` de um script. `fireEvent`
      // despacharia o evento à força e mediria uma rota que não existe fora do
      // teste.
      onPageChange.mockClear();
      proxima.click();
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('A página atual é a última da faixa', async () => {
      await expect(canvas.getByRole('link', { name: 'Ir para página 10' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O estado da página atual vive fora do componente. Cada clique reposiciona o destaque, o aria-current e o contador.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const atual = ref(1);
      const total = 4;
      const irPara = (n: number) => {
        if (n >= 1 && n <= total) atual.value = n;
      };
      return { atual, total, paginas: [1, 2, 3, 4], irPara };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-body nds-text-muted-foreground" data-slot="pagina-atual">
          Página {{ atual }} de {{ total }}
        </p>
        <Pagination :total="40" :items-per-page="10" :page="atual" aria-label="Paginação controlada">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious @click="irPara(atual - 1)" />
            </PaginationItem>
            <PaginationItem v-for="n in paginas" :key="n">
              <PaginationLink
                href="#"
                :is-active="atual === n"
                :aria-label="\`Ir para página \${n}\`"
                @click.prevent="irPara(n)"
              >
                {{ n }}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext @click="irPara(atual + 1)" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const irPara = async (n: number) => {
      // Par idempotente: só clica quando ainda não é a página atual. O painel
      // Interactions reexecuta a play no mesmo DOM, e um clique cego partiria
      // do estado que a rodada anterior deixou.
      const alvo = canvas.getByRole('link', { name: `Ir para página ${n}` });
      if (alvo.getAttribute('aria-current') !== 'page') await userEvent.click(alvo);
      await expect(canvas.getByRole('link', { name: `Ir para página ${n}` })).toHaveAttribute(
        'aria-current',
        'page',
      );
    };

    await step('Clicar numa página move o destaque e o contador', async () => {
      await irPara(3);
      await expect(canvasElement.querySelector('[data-slot="pagina-atual"]')).toHaveTextContent(
        'Página 3 de 4',
      );
    });

    await step('Só uma página é a atual em qualquer momento', async () => {
      await expect(canvasElement.querySelectorAll('[aria-current="page"]').length).toBe(1);
    });

    await step('O estado volta ao início para a próxima rodada', async () => {
      await irPara(1);
      await expect(canvasElement.querySelector('[data-slot="pagina-atual"]')).toHaveTextContent(
        'Página 1 de 4',
      );
    });
  },
};

export const CompleteTable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Cenário canônico: rodapé de tabela com o contador de resultados à esquerda e a faixa encostada à direita, via data-align="end".',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup: () => ({ trechos: [1, 2, 3, 'ellipsis', 12] }),
    // `nds-cluster` e não `nds-stack`: só o cluster tem data-align/data-justify,
    // e é ele que quebra a linha sozinho quando a largura aperta. A marcação
    // anterior usava um stack com atributos que nenhuma regra lê, mais três
    // classes de força de um framework que saiu — o rodapé nunca virou linha e a
    // faixa nunca encostou à direita.
    template: `
      <div
        class="nds-cluster nds-w-full nds-max-w-prose nds-border-default nds-rounded-lg nds-p-4"
        data-spacing="sm"
        data-align="center"
        data-justify="between"
      >
        <span class="nds-text-body nds-text-muted-foreground">Mostrando 11–20 de 120 resultados</span>
        <Pagination
          :total="120"
          :items-per-page="10"
          :page="2"
          data-align="end"
          aria-label="Paginação do rodapé da tabela"
        >
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            <PaginationItem v-for="(trecho, i) in trechos" :key="i">
              <PaginationEllipsis v-if="trecho === 'ellipsis'" />
              <PaginationLink
                v-else
                href="#"
                :is-active="trecho === 2"
                :aria-label="\`Ir para página \${trecho}\`"
                @click.prevent
              >
                {{ trecho }}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem><PaginationNext /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa encosta na borda direita do rodapé', async () => {
      // O alinhamento é o PONTO desta composição, e antes ele era escrito com
      // classes inertes: a faixa ocupava a linha inteira e ficava centrada.
      const nav = canvas.getByRole('navigation', { name: 'Paginação do rodapé da tabela' });
      await expect(getComputedStyle(nav).justifyContent).toBe('flex-end');
      await expect(nav.getBoundingClientRect().width).toBeLessThan(
        (nav.parentElement as HTMLElement).getBoundingClientRect().width,
      );
    });

    await step('O contador e a faixa dividem a mesma linha', async () => {
      const rodape = canvasElement.querySelector('.nds-cluster') as HTMLElement;
      await expect(getComputedStyle(rodape).justifyContent).toBe('space-between');
      await expect(canvas.getByRole('link', { name: 'Ir para página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
};
