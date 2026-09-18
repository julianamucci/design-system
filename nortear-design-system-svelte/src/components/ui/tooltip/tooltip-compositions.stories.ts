import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';
import TooltipSidesStory from './TooltipSidesStory.svelte';
import TooltipFormHelpStory from './TooltipFormHelpStory.svelte';
import TooltipMetricStory from './TooltipMetricStory.svelte';
import TooltipGroupStory from './TooltipGroupStory.svelte';
import TooltipCollisionStory from './TooltipCollisionStory.svelte';
import {
  BUBBLE_GAP,
  balaoDe,
  sideOf,
  wait,
  waitForBubble,
  waitForBubbleGone,
  waitForSide,
} from './tooltip.fixtures';
import { aguardarSeta } from '@shared/testing/tooltip-arrow-probe';
import {
  tooltipSource,
  tooltipCollisionSource,
  tooltipFormFieldHelpSource,
  tooltipGroupWaitSource,
  tooltipMetricDescriptionSource,
  tooltipPlacementSidesSource,
} from './tooltip.source';

import { figmaDesign } from '@shared/figma/design-links';
// As composições que o conteúdo compartilhado documenta, os quatro lados de
// posicionamento e as duas cenas que só existem no GRUPO: a virada por colisão
// e a espera compartilhada. Em todas, o Tooltip acrescenta contexto a um
// elemento que JÁ se explica sozinho — nunca é o único portador da informação.
//
// Os quatro `Side*` viraram uma story só, `PlacementSides`, e continuam neste
// arquivo: eram quatro fotos de regressão visual para uma lição só, e comparar
// os lados exigia trocar de página. Mudar o arquivo de moradia trocaria o id da
// story, e a baseline da regressão visual junto.

// `sideOf` e `waitForSide` moram em `tooltip.fixtures.ts`: três arquivos de
// story fazem a mesma pergunta sobre o lado, e cópia de asserção é cópia de
// regra — foi o que o audit já cobrou do `waitForBubble`.

/** A espera do provedor na cena de grupo, em ms. */
const GROUP_DELAY = 600;

/** A janela de cortesia do grupo: dentro dela, o vizinho abre sem esperar. */
const GROUP_SKIP = 1000;

const meta: Meta = {
  title: 'Components/Overlay/Tooltip/Compositions',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('tooltip'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; as que não usam o andaime
      // canônico sobrescrevem com a sua própria marcação logo abaixo.
      source: { transform: tooltipSource },
      description: {
        component:
          'Atalho de teclado em botão icon-only, ajuda em campo de formulário, descrição de métrica, os quatro lados de posicionamento numa cena, e as duas situações que só o grupo produz: a virada por colisão quando o lado pedido não cabe, e o balão vizinho que abre sem esperar enquanto a janela do grupo está quente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const baseArgs = {
  defaultOpen: true,
  // Sem `delayDuration`: as cenas que nascem abertas por `defaultOpen` não
  // tocam em ponteiro nem em foco, então a espera nunca corre nelas — o `0` que
  // morava nesta linha era arg morto que o painel Code PUBLICAVA, e código que
  // alguém copia é o pior lugar para ensinar espera desligada. Quem depende de
  // tempo é a cena de grupo, e ela declara os seus próprios números.
  align: 'center' as const,
  sideOffset: 4,
};

export const IconButtonWithShortcut: Story = {
  name: 'Keyboard shortcut on icon button',
  args: {
    ...baseArgs,
    side: 'top',
    variant: 'withShortcut',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar',
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('O atalho vai em <kbd>, e a folha reconhece a tecla', async () => {
      const balao = balaoDe(trigger)!;
      const teclas = balao.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
    });

    await step('E a folha encurta o respiro à direita por causa da tecla', async () => {
      // `.nds-tooltip-content:has([data-slot="kbd"])` só casa se o data-slot
      // estiver na tecla — sem ele a regra existe e não pinta nada.
      const balao = balaoDe(trigger)!;
      await expect(getComputedStyle(balao).paddingInlineEnd).not.toBe(
        getComputedStyle(balao).paddingInlineStart,
      );
    });
  },
};

export const HelpInFormField: Story = {
  name: 'Help in form field',
  render: () => ({ Component: TooltipFormHelpStory }),
  parameters: {
    docs: {
      source: { transform: tooltipFormFieldHelpSource },
      description: {
        story:
          'Ícone de ajuda ao lado do rótulo, explicando onde gerar o valor esperado. O texto cabe numa linha e respeita o limite de largura do balão — passou disso, o caso é de Popover.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ajuda = canvas.getByRole('button', { name: 'Ajuda sobre Token de API' });

    await step('O ícone de ajuda tem nome acessível PRÓPRIO', async () => {
      // O balão é complementar: em touch não há ponteiro, e sem o nome o "?"
      // ficaria anônimo para quem não usa mouse.
      await expect(ajuda).toHaveAttribute('aria-label', 'Ajuda sobre Token de API');
    });

    await step('O rótulo do campo continua ligado ao campo, e não ao balão', async () => {
      // A ajuda entra ao LADO do rótulo; quem nomeia o input continua sendo o
      // <label>, e trocar isso pelo balão deixaria o campo sem nome em touch.
      const field = canvas.getByLabelText('Token de API');
      await expect(field.tagName).toBe('INPUT');
    });

    await step('E o balão descreve onde gerar o valor', async () => {
      await expect(await waitForBubble(ajuda, 2000)).toBe(true);
      await expect(balaoDe(ajuda)!.textContent).toContain('Configurações');
    });
  },
};

export const MetricDescription: Story = {
  name: 'Metric description',
  render: () => ({ Component: TooltipMetricStory }),
  parameters: {
    docs: {
      source: { transform: tooltipMetricDescriptionSource },
      description: {
        story:
          'Sigla técnica no cabeçalho de uma métrica, com o balão definindo o termo. A descoberta é passiva e não custa espaço vertical; para detalhe interativo o caso é de Popover.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const info = canvas.getByRole('button', { name: 'O que é LCP' });

    await step('O ícone informativo tem nome acessível próprio', async () => {
      await expect(info).toHaveAttribute('aria-label', 'O que é LCP');
    });

    await step('O balão define a sigla que o cabeçalho abrevia', async () => {
      await expect(await waitForBubble(info, 2000)).toBe(true);
      await expect(balaoDe(info)!.textContent).toContain('Largest Contentful Paint');
    });

    await step('E o valor da métrica continua visível por si', async () => {
      // O balão explica a sigla; o número nunca depende dele para ser lido.
      await expect(canvas.getByText('1,8 s')).toBeVisible();
    });
  },
};

/**
 * Os quatro lados numa cena só — era o que quatro stories `Side*` mostravam,
 * uma por página.
 *
 * Juntas elas custavam quatro fotos de regressão visual para uma lição só, e
 * comparar os lados exigia trocar de página.
 */
export const PlacementSides: Story = {
  name: 'Placement sides',
  render: () => ({ Component: TooltipSidesStory }),
  parameters: {
    covers: ['visual.item3'],
    // `padded` e não o `centered` do meta: a cena precisa da LARGURA do canvas
    // para que a coluna de quem pede `right` tenha sala à direita e a de quem
    // pede `left` tenha sala à esquerda. Centrado, o quadro encolhe para o
    // conteúdo e o aperto volta — que é como uma asserção de lado exato vira
    // falha por falta de espaço em vez de defeito de posicionamento.
    layout: 'padded',
    docs: {
      source: { transform: tooltipPlacementSidesSource },
      description: {
        story:
          'Os quatro lados lado a lado. O lado é preferência: quando não há espaço, a lib vira o balão sozinha — e é a story Collision que exige a virada. Aqui a cena garante a folga de cada lado, então o lado que sai é o pedido.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const SIDES = [
      ['Top', 'top'],
      ['Right', 'right'],
      ['Bottom', 'bottom'],
      ['Left', 'left'],
    ] as const;

    await step('Cada balão nasce no lado EXATO que o gatilho pediu', async () => {
      for (const [label, side] of SIDES) {
        const trigger = canvas.getByRole('button', { name: label });
        // Espera o VALOR, não a existência do atributo: ele nasce com o lado
        // pedido e só assenta no quadro em que o posicionador mede.
        await waitForSide(trigger, side, 2000);
        // Lado exato, e não `[side, oposto]`: a cena garante a folga daquele
        // lado, então uma asserção que aceitasse os dois passaria com o
        // posicionamento quebrado. Quem exige a VIRADA é a story `Collision`.
        await expect(sideOf(balaoDe(trigger))).toBe(side);
        // `aguardarSeta` espera por RELÓGIO, não por `waitFor`: a medida força
        // layout, e o `data-side` aparece antes de a posição assentar. O porquê
        // dos dois está no módulo compartilhado.
        await aguardarSeta(balaoDe(trigger)!, trigger);
        await expect(balaoDe(trigger)!.textContent).toContain(`Tooltip ${label}`);
      }
    });
  },
};

export const Collision: Story = {
  render: () => ({ Component: TooltipCollisionStory }),
  parameters: {
    covers: ['functional.item5'],
    // `fullscreen` e não o `centered` do meta: a cena se ancora sozinha na
    // borda de cima da janela, e o quadro centrado do meta só a empurraria
    // para o meio, devolvendo o espaço que a story existe para tirar.
    layout: 'fullscreen',
    docs: {
      source: { transform: tooltipCollisionSource },
      description: {
        story:
          'O gatilho encostado na borda de cima: o lado pedido não cabe, e o balão vira para o oposto sozinho. O lado final é o que chega ao markup em data-side, que é o gancho lido pela folha compartilhada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /sem espaço acima/i });

    await step('A PREMISSA: a cena de fato não deixa espaço acima do gatilho', async () => {
      // A premissa vem antes do resultado, e é o que separa "o flip aconteceu"
      // de "o flip foi exigido". Se um dia o quadro devolver folga acima, o
      // balão cabe no lado pedido e o passo seguinte reprovaria sem que
      // houvesse defeito nenhum no componente — com esta medida, quem reprova
      // primeiro é a CENA, dizendo que o andaime é que saiu do lugar.
      await expect(await waitForBubble(trigger, 2000)).toBe(true);
      const slackAbove = trigger.getBoundingClientRect().top;
      const bubbleHeight = balaoDe(trigger)!.getBoundingClientRect().height;
      // O vão é o afastamento pedido mais a seta — o que o balão precisa além
      // da própria altura para caber acima. Vem da fixture: é a MESMA medida
      // que as stories de lado exato usam para provar o contrário (que havia
      // sala), e duas cópias dela seriam duas versões de uma regra só.
      await expect(slackAbove).toBeLessThan(bubbleHeight + BUBBLE_GAP);
    });

    await step('O lado pedido não cabe, então o balão VIRA para o oposto', async () => {
      // Espera o VALOR `bottom`, e não a mera existência do atributo: medido em
      // 2026-09-16, `data-side` nasce com o lado PEDIDO e a virada chega no
      // quadro seguinte — ler logo após `toBeTruthy()` devolvia `top`.
      await waitForSide(trigger, 'bottom', 2000);
      // `[top, bottom]` aqui passaria com ou sem fuga de colisão, que é o
      // defeito canônico desta rodada.
      await expect(sideOf(balaoDe(trigger))).toBe('bottom');
    });

    await step('E o markup não mente: o balão está mesmo ABAIXO do gatilho', async () => {
      // Atributo que muda sozinho seria markup mentindo sobre onde o balão
      // ficou; a geometria é a segunda testemunha. A espera é de RELÓGIO, e não
      // `waitFor`, porque o posicionador nasce com um transform de reserva e só
      // assenta num quadro seguinte — medir é o assunto, não tolerar.
      const deadline = performance.now() + 2000;
      let below = false;
      while (performance.now() < deadline) {
        const bubble = balaoDe(trigger);
        if (bubble) {
          const triggerRect = trigger.getBoundingClientRect();
          const bubbleRect = bubble.getBoundingClientRect();
          if (bubbleRect.top >= triggerRect.bottom - 1) {
            below = true;
            break;
          }
        }
        await wait(25);
      }
      await expect(below).toBe(true);
    });
  },
};

/**
 * É também a story do card `actionBar` da docs page: o exemplo é o mesmo —
 * vários gatilhos de ícone sob um provedor só —, e o que ela acrescenta é a
 * MEDIDA da janela compartilhada. Sem essa dobradiça o card ficaria descrito no
 * conteúdo, renderizado nas cinco páginas, e sem story que o provasse.
 */
export const GroupWait: Story = {
  name: 'Group wait (skip delay)',
  render: () => ({
    Component: TooltipGroupStory,
    props: { delayDuration: GROUP_DELAY, skipDelayDuration: GROUP_SKIP },
  }),
  parameters: {
    covers: ['functional.item6'],
    docs: {
      source: { transform: tooltipGroupWaitSource },
      description: {
        story:
          'O primeiro balão do grupo paga a espera inteira; enquanto a janela de cortesia está quente, o vizinho abre na hora. É o que torna percorrer uma barra de ações utilizável sem transformar cada passagem de ponteiro em balão.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole('button', { name: 'Salvar' });
    const trash = canvas.getByRole('button', { name: 'Excluir' });

    await step('O primeiro balão paga a espera inteira do provedor', async () => {
      save.blur();
      const mark = performance.now();
      await userEvent.hover(save);
      // Espera zero abriria AQUI, e é o que este passo existe para reprovar.
      await expect(balaoDe(save)).toBeNull();

      const opened = await waitForBubble(save, GROUP_DELAY * 5);
      const elapsed = performance.now() - mark;
      await expect(opened).toBe(true);
      // PISO: separa "esperou" de "abriu na hora". A folga de 20% absorve a
      // granularidade do laço de relógio.
      await expect(elapsed).toBeGreaterThanOrEqual(GROUP_DELAY * 0.8);
      // E o primitivo diz que veio pelo temporizador, não por atalho.
      await expect(balaoDe(save)).toHaveAttribute('data-state', 'delayed-open');
    });

    await step('Dentro da janela do grupo, o vizinho abre SEM esperar', async () => {
      const mark = performance.now();
      await userEvent.hover(trash);

      const opened = await waitForBubble(trash, GROUP_DELAY * 5);
      const elapsed = performance.now() - mark;
      await expect(opened).toBe(true);
      // TETO bem abaixo da espera: pagar os 600 ms de novo significaria que a
      // janela do grupo não valeu — que é o defeito que esta story procura.
      await expect(elapsed).toBeLessThan(GROUP_DELAY / 2);
      await expect(balaoDe(trash)).toHaveAttribute('data-state', 'instant-open');
      // E o provedor mantém um balão por vez: o primeiro fechou.
      await expect(await waitForBubbleGone(save, 2000)).toBe(true);
    });
  },
};
