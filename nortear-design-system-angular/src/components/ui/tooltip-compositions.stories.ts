import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_TOOLTIP } from './tooltip';
import {
  balaoDe,
  fitsOnSide,
  HELP_ICON,
  INFO_ICON,
  openedAfter,
  pointerAt,
  SAVE_ICON,
  sideSettledAs,
} from './tooltip.fixtures';
import { aguardarSeta } from '@shared/testing/tooltip-arrow-probe';
import {
  tooltipCollisionSource,
  tooltipFormFieldHelpSource,
  tooltipGroupWaitSource,
  tooltipIconButtonShortcutSource,
  tooltipMetricDescriptionSource,
  tooltipPlacementSidesSource,
} from './tooltip.source';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle } from './card';

import { figmaDesign } from '@shared/figma/design-links';
// As três composições que o conteúdo compartilhado documenta, mais os quatro
// lados de posicionamento. As composições repetem a mesma regra: o Tooltip
// acrescenta contexto a um elemento que JÁ se explica sozinho — nunca é o único
// portador da informação.

const meta: Meta = {
  title: 'Components/Overlay/Tooltip/Compositions',
  tags: ['overlay'],
  decorators: [
    moduleMetadata({
      imports: [
        ...NDS_TOOLTIP, NdsButton, NdsInput, NdsLabel,
        NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle,
      ],
    }),
  ],
  parameters: {
    design: figmaDesign('tooltip'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Botão de ação rápida com atalho, ajuda ao lado do rótulo de um campo, definição ' +
          'de sigla no cabeçalho de uma métrica e os quatro lados de posicionamento. Nas três ' +
          'primeiras, o elemento continua compreensível sem o Tooltip — em touch não há hover, ' +
          'e o conteúdo obrigatório não pode morar aqui. As duas últimas mostram o que o lado ' +
          'pedido faz quando não cabe, e o que a espera compartilhada faz com o balão vizinho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const IconButtonWithShortcut: Story = {
  parameters: { docs: { source: { transform: tooltipIconButtonShortcutSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider class="nds-cluster nds-p-8" data-spacing="sm">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent
            ><span>Salvar</span
            ><kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd
            ><kbd class="nds-kbd" data-slot="kbd">S</kbd
          ></ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Salvar' });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      // A ordem importa: o `aria-label` sozinho já diz o que o botão faz. O
      // Tooltip acrescenta a tecla, que é conveniência, não requisito.
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.querySelectorAll('kbd').length).toBe(2);
    });

    await step('A folha encurta o respiro à direita quando há tecla', async () => {
      // D7 do PRD, e a asserção tem de ser sobre o PADDING: contar `<kbd>` não
      // alcança o defeito, porque a tecla pode estar lá sem o `data-slot` que a
      // regra `.nds-tooltip-content:has([data-slot="kbd"])` casa — e aí a regra
      // existe e não pinta nada.
      const balao = balaoDe(trigger)!;
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
      const styles = getComputedStyle(balao);
      await expect(parseFloat(styles.paddingInlineEnd)).toBeLessThan(
        parseFloat(styles.paddingInlineStart),
      );
    });
  },
};

export const HelpInFormField: Story = {
  parameters: { docs: { source: { transform: tooltipFormFieldHelpSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider class="nds-stack nds-p-8 nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-spacing="sm">
          <label ndsLabel for="token-api">Token da API</label>
          <span ndsTooltip>
            <button
              ndsTooltipTrigger
              ndsButton
              variant="ghost"
              size="icon-sm"
              aria-label="Onde encontrar o token da API"
            >
              ${HELP_ICON}
            </button>
            <ng-template ndsTooltipContent side="right"
              >Gere em Configurações › Acesso › Tokens</ng-template
            >
          </span>
        </div>
        <input ndsInput id="token-api" placeholder="ndsk_..." />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Onde encontrar o token da API' });

    await step('O campo continua rotulado pelo label, não pelo Tooltip', async () => {
      // O `for`/`id` é o que nomeia o campo. O Tooltip explica ONDE achar o
      // valor — informação complementar, que pode faltar sem quebrar o
      // formulário.
      const field = canvas.getByLabelText('Token da API');
      await expect(field).toHaveAttribute('id', 'token-api');
    });

    await step('O ícone de ajuda é um botão focável, com nome próprio', async () => {
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.textContent).toContain('Tokens');
    });
  },
};

export const MetricDescription: Story = {
  parameters: { docs: { source: { transform: tooltipMetricDescriptionSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider class="nds-p-8">
        <div ndsCard class="nds-p-4 nds-w-sm">
          <div ndsCardHeader>
            <div class="nds-cluster" data-spacing="sm">
              <span ndsCardTitle>LCP</span>
              <span ndsTooltip>
                <button
                  ndsTooltipTrigger
                  ndsButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="O que é LCP"
                >
                  ${INFO_ICON}
                </button>
                <ng-template ndsTooltipContent
                  >LCP — Largest Contentful Paint</ng-template
                >
              </span>
            </div>
          </div>
          <div ndsCardContent>
            <p class="nds-text-h3 nds-m-0">1,8 s</p>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'O que é LCP' });

    await step('A sigla fica visível; o Tooltip só a expande', async () => {
      await expect(canvasElement.textContent).toContain('LCP');
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.textContent).toContain('Largest Contentful Paint');
    });
  },
};

export const PlacementSides: Story = {
  parameters: { covers: ['visual.item3'], docs: { source: { transform: tooltipPlacementSidesSource } } },
  render: () => ({
    template: `
      <!-- Moldura alta com o grid centrado, e ela é ANDAIME com motivo: a play
           afirma o lado EXATO, e isso só é honesto onde o lado pedido cabe. Com
           o grid colado no topo do quadro sobram cerca de 38px acima da primeira
           linha contra 29px de balão, e a lib vira para baixo — corretamente —,
           o que reprovaria a story pelo tamanho da moldura em vez de por
           defeito. Quem encosta na borda de propósito é a story Collision. -->
      <div class="nds-cluster nds-w-full nds-min-h-100" data-justify="center" data-align="center">
        <div ndsTooltipProvider class="nds-grid nds-p-8" data-cols="2" data-spacing="xl">
          @for (side of lados; track side) {
            <span ndsTooltip [defaultOpen]="true">
              <button ndsTooltipTrigger ndsButton variant="outline" [attr.aria-label]="side">
                {{ side }}
              </button>
              <ng-template ndsTooltipContent [side]="side">Tooltip {{ side }}</ng-template>
            </span>
          }
        </div>
      </div>
    `,
    props: { lados: ['top', 'right', 'bottom', 'left'] },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada balão nasce EXATAMENTE do lado pedido', async () => {
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        const trigger = canvas.getByRole('button', { name: side });
        const start = performance.now();
        await openedAfter(() => balaoDe(trigger) !== null, start, 2000);
        const balao = balaoDe(trigger)!;
        // A precondição é MEDIDA, e por EIXO: lado vertical precisa de espaço
        // vertical, lado horizontal de espaço horizontal. Sem esta linha, um
        // quadro mais apertado faria a asserção abaixo reprovar pelo tamanho da
        // moldura em vez de por defeito.
        await expect(fitsOnSide(trigger, balao, side)).toBe(true);
        // Esperar o VALOR assentar, e não a existência do atributo: ele nasce
        // com o lado pedido e só troca quando o posicionador mede — ler antes
        // disso aprova o lado certo pelo motivo errado.
        await sideSettledAs(trigger, side);
        // E então o lado EXATO. Aceitar `[side, oposto]` — o que estava aqui —
        // passa com ou sem auto-flip: é asserção que não pode reprovar. Quem
        // prova a virada por colisão é a story Collision, onde o espaço falta
        // de propósito.
        await expect(balao).toHaveAttribute('data-side', side);
      }
    });

    await step('A seta encosta no balão, aponta para o gatilho e para a 4px dele', async () => {
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const trigger = canvas.getByRole('button', { name: side });
        // `aguardarSeta` espera por RELÓGIO, não por `waitFor`: a medida força
        // layout, e o `data-side` aparece antes de a posição assentar. O porquê
        // dos dois está no módulo compartilhado.
        await aguardarSeta(balaoDe(trigger)!, trigger);
      }
    });
  },
};

/**
 * O lado pedido é PREFERÊNCIA, e esta é a story que prova o que acontece quando
 * ele não cabe (C8 do PRD, `testes.functional.item5`).
 *
 * Ela existe porque nenhuma das outras podia reprovar: todas pedem um lado onde
 * há espaço, e as que afirmavam `[side, oposto]` passavam com ou sem auto-flip.
 * Aqui o espaço acima falta de propósito, e a asserção é o lado FINAL — o
 * oposto do pedido.
 *
 * O QUADRO faz parte do arranjo. No `centered` o espaço acima do gatilho vem do
 * próprio quadro e o gatilho nunca encosta na borda; ancorada no topo
 * (`layout: 'padded'`), a única folga acima é o respiro da moldura, que não
 * cabe um balão. O bloco alto ABAIXO é para onde o balão vira — sem ele o
 * quadro encolheria à altura do gatilho e a virada não teria destino.
 */
export const Collision: Story = {
  parameters: {
    covers: ['functional.item5'],
    layout: 'padded',
    docs: { source: { transform: tooltipCollisionSource } },
  },
  render: () => ({
    template: `
      <div ndsTooltipProvider class="nds-stack nds-w-full" data-align="center" data-spacing="sm">
        <span ndsTooltip [defaultOpen]="true">
          <button ndsTooltipTrigger ndsButton variant="outline">Salvar</button>
          <ng-template ndsTooltipContent side="top">Salvar (Ctrl+S)</ng-template>
        </span>

        <!-- Espaço ABAIXO do gatilho, para onde o balão vira. aria-hidden
             porque é andaime de layout: não há nada aqui para anunciar. -->
        <div class="nds-min-h-60" aria-hidden="true"></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Salvar' });

    await step('O balão pediu o topo, e acima do gatilho não cabe balão nenhum', async () => {
      const start = performance.now();
      await openedAfter(() => balaoDe(trigger) !== null, start, 2000);
      // A PREMISSA é medida, e ANTES do resultado: sem esta linha a story
      // passaria "provando" uma virada que não houve, num quadro onde o topo
      // cabia. `fitsOnSide` é a conta da lib — altura do balão mais o vão e o
      // respiro de colisão — contra a folga real acima do gatilho.
      await expect(fitsOnSide(trigger, balaoDe(trigger)!, 'top')).toBe(false);
    });

    await step('Então ele vira para o lado OPOSTO, e o data-side traz o final', async () => {
      // Esperar o VALOR, e não a existência do atributo: ele nasce com o lado
      // PEDIDO e a virada chega no quadro em que o posicionador mede. Ler logo
      // depois de "o atributo existe" pega o `top` de antes da virada — foi o
      // que reprovou as stories irmãs em 2026-09-16.
      await sideSettledAs(trigger, 'bottom');
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('data-side', 'bottom');
      // O atributo é markup, e markup pode mentir sobre onde o balão foi parar:
      // a geometria acompanha o que ele afirma.
      await expect(balao.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        trigger.getBoundingClientRect().bottom - 1,
      );
    });
  },
};

/**
 * Espera e janela do grupo, em ms.
 *
 * Saem de constante, e não de número solto no template, porque as asserções da
 * `play` são PROPORCIONAIS a elas (0,9× o piso, 1,7× o teto): com o número
 * escrito duas vezes, mexer no provedor e esquecer a play deixaria a medida
 * verde contra outra espera.
 */
const GROUP_DELAY = 3000;
const GROUP_WINDOW = 5000;

/**
 * A barra de ações, e a janela compartilhada do grupo
 * (`testes.functional.item6`).
 *
 * É a story do card `actionBar` que o conteúdo compartilhado publica nas cinco
 * docs pages: vários gatilhos dentro de UM provedor. O que ela acrescenta ao
 * card é a medição — depois que um balão do grupo abriu, os vizinhos abrem SEM
 * esperar de novo enquanto a janela dura, que é o que faz a barra parecer uma
 * coisa só e não uma fila de esperas independentes.
 *
 * E a medição tem DUAS metades. A positiva — o vizinho abre na hora — não prova
 * nada sozinha: um provedor que nunca esperasse passaria nela igual. Por isso o
 * primeiro balão abre por PONTEIRO e com piso de relógio, provando que ELE paga
 * a espera; abri-lo por `focus()`, que abre na hora por contrato, mediria o
 * caminho que nunca espera.
 *
 * Os números são exagerados de propósito, e é o exagero que torna as duas
 * metades MENSURÁVEIS: com a espera do grupo em 3 s, um balão que aparece em
 * menos de 1 s só pode ter pulado a fila. Com a espera padrão de 300 ms, a
 * diferença entre esperar e não esperar caberia na margem de erro do relógio.
 */
export const GroupWait: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: { source: { transform: tooltipGroupWaitSource } },
  },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="${GROUP_DELAY}" [timeout]="${GROUP_WINDOW}" class="nds-cluster nds-p-8" data-spacing="sm">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent side="bottom">Salvar (Ctrl+S)</ng-template>
        </span>

        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Ajuda">
            ${HELP_ICON}
          </button>
          <ng-template ndsTooltipContent side="bottom">Abrir a central de ajuda</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole('button', { name: 'Salvar' });
    const help = canvas.getByRole('button', { name: 'Ajuda' });

    await step('Com o grupo frio, o primeiro balão PAGA a espera', async () => {
      // PONTEIRO, e não `focus()`: o foco abre NA HORA por contrato, então o
      // primeiro balão aberto pelo foco só provaria a metade positiva — que o
      // vizinho não espera. Uma janela de grupo que nunca esfriasse passaria
      // igual, porque ninguém teria medido alguém PAGANDO a espera. Quem espera
      // é o ponteiro, e é por ele que esta metade tem de entrar.
      //
      // Relógio, e não `waitFor`: o que se mede é TEMPO, e o `waitFor` espera o
      // que for preciso — daria verde para quem esperou e para quem não esperou.
      const start = performance.now();
      await userEvent.hover(save);
      const elapsed = await openedAfter(() => balaoDe(save) !== null, start, GROUP_DELAY * 3);
      // PISO e TETO, na mesma margem proporcional do `HoverDefaultDelay`: o piso
      // é o que reprova a espera que sumiu; o teto prova que a espera é ESTA, a
      // do grupo, e não outra qualquer.
      await expect(elapsed).toBeGreaterThanOrEqual(GROUP_DELAY * 0.9);
      await expect(elapsed).toBeLessThan(GROUP_DELAY * 1.7);
      // E a prova sem relógio, do outro lado: abertura que cumpriu a espera não
      // tem origem instantânea, e o atributo fica ausente.
      await expect(balaoDe(save)!.hasAttribute('data-instant')).toBe(false);
    });

    await step('O primeiro fecha, e é o fechamento que deixa a janela quente', async () => {
      // A saída vai à mão: a área de tolerância é armada no `pointerleave` a
      // partir do ponto de saída, e quem a desarma é um `pointermove` para
      // longe. Sem esse segundo evento o balão fica de pé — e a espera abaixo
      // penduraria em vez de reprovar.
      const box = save.getBoundingClientRect();
      pointerAt(save, 'pointerleave', box.left + box.width / 2, box.bottom + 1);
      pointerAt(document.body, 'pointermove', 0, 0);
      await waitFor(async () => {
        await expect(balaoDe(save)).toBeNull();
      });
    });

    await step('Dentro da janela, o vizinho abre sem esperar os 3 s do grupo', async () => {
      // O mesmo gesto do primeiro passo, e é isso que torna os dois
      // comparáveis: mesma entrada de ponteiro, mesma medição de relógio, e a
      // única coisa diferente é a janela do grupo estar quente.
      const start = performance.now();
      await userEvent.hover(help);
      const elapsed = await openedAfter(() => balaoDe(help) !== null, start, GROUP_DELAY);
      await expect(elapsed).toBeLessThan(GROUP_DELAY / 3);

      const balao = balaoDe(help)!;
      // A prova sem relógio, do outro lado: o primitivo publica no balão a
      // ORIGEM da abertura, e a que veio da janela do grupo se nomeia. É o que
      // separa "abriu rápido" de "abriu porque o vizinho já tinha aberto".
      await expect(balao).toHaveAttribute('data-instant', 'delay');
      await expect(balao.textContent).toContain('central de ajuda');
    });
  },
};
