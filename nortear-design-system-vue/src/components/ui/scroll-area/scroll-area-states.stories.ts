import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import {
  focusDeclaradoRing,
  grabberContrast,
  measureRatio,
  transbordo,
} from '@shared/testing/scroll-area-probe';
import { ScrollArea } from './index';
import {
  scrollAreaAoRolarSource,
  scrollAreaContentFocavelSource,
  scrollAreaOciosoSource,
  scrollAreaNoLimitSource,
  scrollAreaSempreSource,
} from './scroll-area.source';

const meta = {
  title: 'UI/ScrollArea/States',
  component: ScrollArea,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: scrollAreaOciosoSource },
      description: {
        component:
          'Estados do ScrollArea: idle (padrão, barra só sob o ponteiro), always (barra sempre montada), scroll (barra durante a rolagem), focus (viewport na ordem de tabulação), conteúdo focável dentro da área e o caso em que o componente não rola — quando ninguém define altura no pai.',
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = Array.from({ length: 30 }, (_, i) => `Tag ${i + 1}`);

const wrapTemplate = (typeAttr: string) => `
  <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 280px">
    <ScrollArea ${typeAttr} size="lg" class="nds-w-full">
      <div class="nds-p-4" data-spacing="sm">
        <div
          v-for="tag in tags"
          :key="tag"
          class="nds-block nds-text-body nds-rounded-sm nds-border-default nds-px-2" style="padding-block: 0.375rem"
        >
          {{ tag }}
        </div>
      </div>
    </ScrollArea>
  </div>
`;

/**
 * Espera a barra existir E parar de animar.
 *
 * `toBeVisible()` do jest-dom só reprova em opacidade exatamente 0, então uma
 * asserção feita no meio da transição passa no vitest e falha no painel
 * Interactions — o gate é a opacidade computada.
 */
async function waitForBar(
  raiz: HTMLElement,
  orientation: 'vertical' | 'horizontal' = 'vertical',
): Promise<HTMLElement> {
  return await waitFor(
    () => {
      const barra = raiz.querySelector<HTMLElement>(
        `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`,
      );
      if (!barra) throw new Error('barra ainda não montada');
      const estilo = getComputedStyle(barra);
      if (estilo.visibility === 'hidden') throw new Error('barra ainda sem medida');
      if (parseFloat(estilo.opacity) < 0.9) {
        throw new Error(`barra em fade (opacity=${estilo.opacity})`);
      }
      return barra;
    },
    { timeout: 4000, interval: 50 },
  );
}

export const Idle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado padrão — o viewport transborda e rola; a barra só se materializa quando o ponteiro entra na área.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate(''),
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O viewport transborda e é o elemento que rola', async () => {
      await expect(transbordo(viewport).y).toBe(true);
      viewport.scrollTop = 0;
      viewport.scrollTop = 50;
      await expect(viewport.scrollTop).toBe(50);
    });
  },
};

export const Always: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item2'],
    docs: {
      // Manter a barra montada é uma prop, e é a precondição da story: com o
      // padrão do meta o pegador nem existe no DOM.
      source: { transform: scrollAreaSempreSource },
      description: {
        story:
          'Barra sempre montada — é a condição para arrastar o pegador e para medir o contraste dele.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate('type="always"'),
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;
    const trilha = await waitForBar(canvasElement);
    const pegador = trilha.querySelector<HTMLElement>('[data-slot="scroll-area-thumb"]')!;

    await step('O pegador indica quanto do conteúdo está visível', async () => {
      // Pegador do tamanho da trilha não indica nada: ele tem de ocupar da
      // trilha a mesma fração que o viewport ocupa do conteúdo.
      viewport.scrollTop = 0;
      const p = await waitFor(() => {
        const measurement = measureRatio(trilha, pegador, viewport, 'vertical');
        if (measurement.deslocamentoMaximo <= 0) throw new Error('pegador ainda não medido');
        return measurement;
      });
      await expect(p.fracaoDoPegador).toBeGreaterThan(0);
      // O defeito que esta linha guarda é o pegador do tamanho da TRILHA — foi o
      // estado real do componente até a rodada em que `flex: 1` saiu do CSS.
      await expect(p.fracaoDoPegador).toBeLessThan(1);
      // A folga é de 0.2 porque cada lib mede a trilha de um jeito: uma desconta
      // o padding, outra reserva o canto no pé da barra, e todas aplicam um
      // tamanho mínimo de pegador. O que se afirma é a ORDEM DE GRANDEZA — com o
      // pegador ocupando a trilha inteira a diferença passa de 0.6.
      await expect(Math.abs(p.fracaoDoPegador - p.fracaoVisivel)).toBeLessThan(0.2);
    });

    await step('O pegador acompanha a posição da rolagem', async () => {
      // Esta é a metade "proporcionalmente" do functional.item2, e ela é medida
      // nos EXTREMOS e no meio — os três pontos em que o mapeamento não depende
      // de como cada lib define o curso útil da trilha (uma desconta o padding,
      // outra reserva o canto no pé da barra).
      const maximo = viewport.scrollHeight - viewport.clientHeight;
      const measure = () => measureRatio(trilha, pegador, viewport, 'vertical');

      viewport.scrollTop = 0;
      await waitFor(() => expect(measure().deslocamento).toBeLessThan(4));

      viewport.scrollTop = maximo;
      await waitFor(() => {
        const p = measure();
        expect(Math.abs(p.deslocamento - p.deslocamentoMaximo)).toBeLessThan(4);
      });

      viewport.scrollTop = Math.round(maximo / 2);
      await waitFor(() => {
        const p = measure();
        expect(Math.abs(p.deslocamento - p.deslocamentoMaximo / 2)).toBeLessThan(4);
      });
    });

    await step('Arrastar o pegador rola o viewport', async () => {
      // A outra metade do functional.item2: o gesto. `userEvent.pointer` e não
      // PointerEvent construído à mão — o primitivo chama `setPointerCapture` no
      // pointerdown, e captura só existe para um ponteiro que o navegador
      // conhece; evento fabricado é descartado ali, em silêncio.
      //
      // Cada passo estabelece a própria precondição: no replay o viewport chega
      // rolado da rodada anterior e o arrasto partiria do fim da trilha.
      const maximo = viewport.scrollHeight - viewport.clientHeight;
      const measure = () => measureRatio(trilha, pegador, viewport, 'vertical');

      // Voltar ao topo E ESPERAR O PEGADOR CHEGAR LÁ. Ele é reposicionado num
      // quadro posterior ao evento de rolagem: medido antes disso, devolve a
      // posição da rodada anterior, e o arrasto começaria de uma coordenada que
      // não é a que está na tela. Foi exatamente o que aconteceu aqui — o teste
      // acusava o pegador parado enquanto a rolagem tinha ido a 80% do curso.
      viewport.scrollTop = 0;
      await waitFor(() => {
        expect(viewport.scrollTop).toBe(0);
        expect(measure().deslocamento).toBeLessThan(4);
      });

      const caixa = pegador.getBoundingClientRect();
      const x = caixa.left + caixa.width / 2;
      const y = caixa.top + caixa.height / 2;
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: pegador, coords: { clientX: x, clientY: y } },
        { target: pegador, coords: { clientX: x, clientY: y + 60 } },
        { keys: '[/MouseLeft]' },
      ]);

      // O pegador seguiu o dedo: andou os 60px do gesto, e não deu um salto
      // para o ponto clicado.
      await waitFor(() => {
        expect(Math.abs(measure().deslocamento - 60)).toBeLessThan(12);
      });

      // E a rolagem foi para o mesmo ponto: pegador e viewport param juntos, que
      // é o "proporcionalmente" do item, agora do lado do gesto.
      const p = measure();
      await expect(viewport.scrollTop).toBeGreaterThan(0);
      await expect(
        Math.abs(p.deslocamento / p.deslocamentoMaximo - viewport.scrollTop / maximo),
      ).toBeLessThan(0.05);
    });

    await step('O pegador se distingue do fundo', async () => {
      // accessibility.item2 — 3:1 é a exigência de WCAG 1.4.11 para componente
      // de interface, e vale aqui porque a barra desenhada é a nossa, não a do
      // sistema. Contraste é aritmética: o colhedor compõe o fundo real antes
      // de dividir, senão a razão sai de uma cor que ninguém vê.
      await expect(grabberContrast(pegador)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const ScrollOnScroll: Story = {
  name: 'Scroll (while scrolling)',
  parameters: {
    docs: {
      // O modo em que a barra acende ao rolar é o assunto — o meta traz o padrão.
      source: { transform: scrollAreaAoRolarSource },
      description: {
        story:
          'A barra aparece durante a rolagem e some depois do tempo de espera configurado.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate('type="scroll" :scroll-hide-delay="600"'),
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rolar materializa a barra', async () => {
      // Precondição própria: no replay o viewport chega rolado, e sem voltar ao
      // topo a rolagem seguinte poderia não produzir evento nenhum.
      viewport.scrollTop = 0;
      await expect(transbordo(viewport).y).toBe(true);
      // Mudar `scrollTop` emite o evento `scroll` de verdade — é o mesmo sinal
      // que a lib escuta para acender a barra, sem evento fabricado à mão.
      viewport.scrollTop = 80;
      const trilha = await waitForBar(canvasElement);
      await expect(trilha).toBeInTheDocument();
    });
  },
};

export const Focus: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item4'],
    docs: {
      // Mesma marcação da story anterior: a barra fica montada para que o anel
      // no viewport seja visto ao lado dela, e o meta traz o padrão sem barra.
      source: { transform: scrollAreaSempreSource },
      description: {
        story:
          'Viewport na ordem de tabulação — é o que permite rolar sem mouse, e o anel de foco é o que torna essa parada visível.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate('type="always"'),
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O viewport entra na ordem de tabulação', async () => {
      viewport.blur();
      let alcancado = false;
      for (let i = 0; i < 8 && !alcancado; i++) {
        await userEvent.tab();
        alcancado = document.activeElement === viewport;
      }
      await expect(alcancado).toBe(true);
    });

    await step('O design system declara o anel de foco do viewport', async () => {
      // accessibility.item3. `:focus-visible` depende da modalidade de entrada
      // que o navegador registrou, e evento sintético não a atualiza — a
      // verificação vai à folha, que é onde o anel é prometido.
      await expect(focusDeclaradoRing()).toBe(true);
    });
  },
};

export const FocusableContent: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      // O conteúdo passa a ser uma navegação de links: outra composição.
      source: { transform: scrollAreaContentFocavelSource },
      description: {
        story:
          'Conteúdo focável dentro da área rolável — o componente não reordena nem remove nada da ordem de tabulação, e o navegador traz para o campo visível o item focado.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { actions: Array.from({ length: 20 }, (_, i) => `Ação ${i + 1}`) };
    },
    template: `
      <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 280px">
        <ScrollArea size="lg" class="nds-w-full">
          <nav aria-label="Ações" class="nds-p-4">
            <ul class="nds-stack nds-list-none" data-spacing="xs" style="padding: 0; margin: 0">
              <li v-for="acao in actions" :key="acao">
                <a href="#" class="nds-block nds-rounded-sm nds-px-2 nds-text-body nds-hover-bg-muted-soft" style="padding-block: 0.375rem">
                  {{ acao }}
                </a>
              </li>
            </ul>
          </nav>
        </ScrollArea>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;
    const links = canvas.getAllByRole('link');

    await step('O conteúdo focável continua na ordem natural do documento', async () => {
      // accessibility.item4: rolar por teclado e agir por teclado convivem —
      // depois do viewport vem o primeiro link, e o Tab seguinte leva ao outro.
      viewport.blur();
      viewport.focus();
      await expect(document.activeElement).toBe(viewport);

      await userEvent.tab();
      await expect(document.activeElement).toBe(links[0]);

      await userEvent.tab();
      await expect(document.activeElement).toBe(links[1]);
    });

    await step('O foco por teclado traz o item para o campo visível', async () => {
      viewport.scrollTop = 0;
      links[links.length - 1].focus();
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    });
  },
};

export const NoLimit: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      // A story é o par errado/certo lado a lado — a AUSÊNCIA da altura é o
      // assunto, e um snippet com altura esconderia justamente isso.
      source: { transform: scrollAreaNoLimitSource },
      description: {
        story:
          'Pai sem altura definida — o conteúdo expande e não há rolagem. É o erro de uso mais comum: o componente aparenta estar quebrado quando ninguém disse até onde ele pode ir.',
      },
    },
  },
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: `
      <div class="nds-stack" data-spacing="lg" style="width: 280px">
        <div class="nds-rounded-md nds-border-default">
          <ScrollArea class="nds-w-full">
            <div class="nds-p-4" data-spacing="sm">
              <div v-for="tag in tags" :key="tag" class="nds-text-body">{{ tag }}</div>
            </div>
          </ScrollArea>
        </div>

        <div class="nds-rounded-md nds-border-default nds-overflow-hidden">
          <ScrollArea size="sm" class="nds-w-full">
            <div class="nds-p-4" data-spacing="sm">
              <div v-for="tag in tags" :key="tag" class="nds-text-body">{{ tag }}</div>
            </div>
          </ScrollArea>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const [semAltura, comAltura] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="scroll-area-viewport"]'),
    );

    await step('Sem altura no pai o conteúdo expande e não há rolagem', async () => {
      // functional.item4.
      await expect(transbordo(semAltura).y).toBe(false);
      await expect(semAltura.scrollHeight).toBe(semAltura.clientHeight);
      await expect(semAltura.getBoundingClientRect().height).toBeGreaterThan(300);
    });

    await step('Com altura no pai o mesmo conteúdo rola', async () => {
      await expect(transbordo(comAltura).y).toBe(true);
      await expect(comAltura.getBoundingClientRect().height).toBeLessThan(200);
    });
  },
};
