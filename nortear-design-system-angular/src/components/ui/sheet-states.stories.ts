import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_SHEET, sheetCloseReason, type SheetCloseReason } from './sheet';
import type { RdxDialogOpenChange } from '@radix-ng/primitives/dialog';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';
import {
  sheetCloseButtonHiddenSource,
  sheetClosedSource,
  sheetControlledSource,
  sheetLongScrollBodySource,
  sheetOpenSource,
  sheetSecondPanelSource,
} from './sheet.source';

import { figmaDesign } from '@shared/figma/design-links';
const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

// Os estados que o conteúdo compartilhado descreve. Fechado e aberto são os dois
// extremos do ciclo; o corpo com rolagem interna é o caso que decide se o rodapé
// fica no lugar quando o conteúdo cresce.

const meta: Meta = {
  title: 'Components/Overlay/Sheet/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_SHEET, NdsButton] })],
  parameters: {
    design: figmaDesign('sheet'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado o painel nem existe no DOM — quem o mantém montado é a transição de ' +
          'saída, e só enquanto ela dura. Aberto, o foco entra e fica preso até o fechamento.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABELS = {
  trigger: () => t('demonstration.labels.trigger'),
  title: () => t('demonstration.labels.title'),
  description: () => t('demonstration.labels.description'),
  cancelar: () => t('demonstration.labels.cancel'),
  aplicar: () => t('demonstration.labels.apply'),
};

/**
 * O painel de TERMOS — o assunto da `LongScrollBody`, escrito como na referência.
 *
 * Literal, e não `demonstration.labels`: aqueles rótulos descrevem o painel de
 * FILTROS, que é curto por natureza e não tem por que rolar. A story rotulava um
 * painel de termos de "Abrir filtros"/"Filtros avançados"/"Aplicar filtros", e o
 * texto ao lado dizia que o corpo era longo — o exemplo contradizia a legenda.
 *
 * O vanilla é a referência e escreve estas palavras literalmente; copiá-las é o
 * que mantém as cinco páginas comparáveis lado a lado. O `bodyLabel` é a peça
 * que mais custa divergir: nome acessível diferente em cada stack é a divergência
 * que ninguém compara, porque não aparece na tela.
 */
const TERMOS = {
  trigger: 'Ler termos',
  title: 'Termos de uso',
  description: 'Leia atentamente antes de aceitar.',
  cancelar: 'Cancelar',
  aceitar: 'Aceitar termos',
  bodyLabel: 'Termos de uso',
};

export const Closed: Story = {
  parameters: {
    // Sem `covers`. Esta story declarava `visual.item1`, que é a captura da
    // direção RIGHT — item já coberto, e corretamente, pela story Right das
    // variantes. Aqui o que se vê é o painel ausente: uma declaração deslocada,
    // que fazia o auditor contar como verificada uma foto que ninguém tira.
    docs: {
      // Sem transform o painel Code imprimiria `{{ triggerLabel }}` e as
      // outras props que a story injeta para trazer o conteúdo trilíngue —
      // andaime, não componente.
      source: { transform: sheetClosedSource },
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABELS.trigger(),
      panelTitle: LABELS.title(),
      panelDescription: LABELS.description(),
    },
    template: `
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsSheetContent>
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ panelTitle }}</h2>
            <p ndsSheetDescription>{{ panelDescription }}</p>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABELS.trigger() });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(
        document.querySelector('[data-slot="sheet-content"]'),
      ).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      source: { transform: sheetOpenSource },
      description: {
        story:
          'Aberto por defaultOpen, sem estado externo nenhum. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABELS.trigger(),
      panelTitle: LABELS.title(),
      panelDescription: LABELS.description(),
      cancelLabel: LABELS.cancelar(),
      applyLabel: LABELS.aplicar(),
    },
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsSheetContent>
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ panelTitle }}</h2>
            <p ndsSheetDescription>{{ panelDescription }}</p>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ cancelLabel }}</button>
            <button ndsButton>{{ applyLabel }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-state', 'open');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAccessibleName(LABELS.title());
      // C6: o painel é nomeado pelo título E descrito pela descrição, os dois
      // obrigatórios. Só o nome era afirmado aqui — um painel que perdesse o
      // `aria-describedby` passava, e as outras quatro stacks já cobravam.
      await expect(panel).toHaveAccessibleDescription(LABELS.description());
      await expect(
        document.querySelector('[data-slot="sheet-overlay"]'),
      ).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const LongScrollBody: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: sheetLongScrollBodySource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          'é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: TERMOS.trigger,
      panelTitle: TERMOS.title,
      panelDescription: TERMOS.description,
      cancelLabel: TERMOS.cancelar,
      applyLabel: TERMOS.aceitar,
      bodyLabel: TERMOS.bodyLabel,
      paragrafos: Array.from({ length: 24 }, (_, i) => ({
        id: `p-${i}`,
        text: `Parágrafo ${i + 1}: termos longos o bastante para o corpo precisar rolar dentro do painel, sem empurrar o rodapé para fora da tela.`,
      })),
    },
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsSheetContent side="right" panelClass="nds-rounded-xl">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ panelTitle }}</h2>
            <p ndsSheetDescription>{{ panelDescription }}</p>
          </div>

          <!-- [aria-label] liga o INPUT da peça (apelido aria-label), e não o
               atributo: é o input que decide emitir role="group". Escrito como
               [attr.aria-label] o nome chegaria ao DOM e o papel não, que é a
               combinação proibida — nome em elemento sem papel. -->
          <div ndsSheetBody class="nds-stack" data-spacing="sm" [aria-label]="bodyLabel">
            @for (p of paragrafos; track p.id) {
              <p class="nds-text-body">{{ p.text }}</p>
            }
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ cancelLabel }}</button>
            <button ndsButton>{{ applyLabel }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o `flex: 1 1 auto` do corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step('panelClass chega ao painel, e o que ela escreve VALE', async () => {
      // O painel é construído dentro do portal: sem este input não haveria
      // elemento onde quem consome pudesse escrever uma classe.
      //
      // A classe é `nds-rounded-xl`, e a troca tem motivo. Antes era
      // `nds-max-w-lg`, que CHEGA e não faz nada: as regras de lado são (0,2,0)
      // e qualquer utilitária de largura é (0,1,0), então o `max-width: 24rem`
      // do lado direito vence. Uma story que ensina um botão que não liga nada é
      // o mesmo defeito de uma tabela de tokens que nomeia o token errado — e a
      // rota real da largura (`--sheet-width` / `--sheet-max-width`) já está na
      // tabela de props e no snippet de customização.
      //
      // `.nds-sheet-content` não declara raio nenhum, então aqui a utilitária
      // não disputa com ninguém: a asserção de estilo abaixo reprova tanto se a
      // classe não chegar quanto se ela chegar e for anulada.
      await expect(panel).toHaveClass(/nds-rounded-xl/);
      await expect(panel).toHaveClass(/nds-sheet-content/);
      await expect(getComputedStyle(panel).borderTopLeftRadius).not.toBe('0px');
    });

    await step('A região rolável é alcançável por teclado E se anuncia', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute('tabindex', '0');
      // C7, e os três andam JUNTOS: caixa que rola é parada de teclado, parada
      // de teclado precisa de papel, e nome em elemento sem papel é atributo
      // proibido (`aria-prohibited-attr`). O ramo que emite o papel existe no
      // primitivo e nenhuma story das cinco o exercitava — `role="group"` nunca
      // chegava a ser emitido, e o contrato não tinha portão em stack nenhuma.
      await expect(body).toHaveAttribute('role', 'group');
      await expect(body).toHaveAttribute('aria-label', TERMOS.bodyLabel);
      await expect(body).toHaveAccessibleName(TERMOS.bodyLabel);
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      source: { transform: sheetCloseButtonHiddenSource },
      description: {
        story:
          'Sem o X do canto. Só faz sentido quando o rodapé já oferece uma saída explícita — ' +
          'Escape continua fechando de qualquer forma.',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABELS.trigger(),
      panelTitle: LABELS.title(),
      panelDescription: LABELS.description(),
      cancelLabel: LABELS.cancelar(),
      applyLabel: LABELS.aplicar(),
    },
    template: `
      <nds-sheet [defaultOpen]="true">
        <button ndsSheetTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsSheetContent [showCloseButton]="false">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ panelTitle }}</h2>
            <p ndsSheetDescription>{{ panelDescription }}</p>
          </div>

          <!-- O rodapé INTEIRO, como na referência: a saída à esquerda e a
               confirmação à direita. Só o Cancelar deixava o exemplo com um
               rodapé que nenhuma outra story deste componente mostra, e a lição
               daqui é justamente o par — dispensar o X só se sustenta porque a
               saída explícita continua ali, ao lado da ação primária. -->
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ cancelLabel }}</button>
            <button ndsButton>{{ applyLabel }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O X do canto não é renderizado', async () => {
      // Prova do binding de input: sob JIT o componente cairia no default
      // (`true`) e o botão apareceria mesmo com [showCloseButton]="false".
      //
      // A busca é ANCORADA. Solta, `/fechar/i` casaria com qualquer rótulo que
      // contivesse a palavra — "Fechar sem salvar", "Não fechar" —, e a
      // ausência do X ficaria provada por um botão que não é o X. As outras
      // quatro stacks já usavam a forma ancorada.
      await expect(within(panel).queryByRole('button', { name: /^Fechar$/i })).toBeNull();
      // E o seletor da própria folha, como na referência: o posicionamento do X
      // é a única coisa que carrega esta classe, então zero dela é a prova
      // direta — inclusive se um dia o botão perder o nome acessível.
      await expect(panel.querySelector('.nds-sheet-close-position')).toBeNull();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      // A CONTAGEM esperada, e não "existe um Cancelar": com `getByRole` sozinho
      // a asserção passava igual com um rodapé de um botão ou de três, que é
      // exatamente como este exemplo divergiu da referência sem nada reprovar.
      const botoes = within(footer!).queryAllByRole('button');
      await expect(botoes).toHaveLength(2);
      // Afirmado por NOME, e na ordem: neste stack o `data-slot` é disputado
      // entre a diretiva de fechar e a de botão, e o que as cinco páginas
      // comparam lado a lado é o par que a pessoa lê na tela.
      await expect(botoes.map((b) => b.textContent?.trim())).toEqual([
        LABELS.cancelar(),
        LABELS.aplicar(),
      ]);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // O snippet ensina SINAL, e a story renderiza um campo comum: o renderer
      // do Storybook monta um objeto de props, onde `isOpen = true` basta. Num
      // componente de verdade quem agenda o redesenho é a escrita no sinal — a
      // tela é a mesma, o que se escreve não.
      source: { transform: sheetControlledSource },
      description: {
        story:
          'Estado do lado de fora. O componente não decide nada sozinho: abre quando o valor ' +
          'ligado diz que sim, e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  render: () => ({
    props: {
      isOpen: false,
      externalLabel: 'Abrir pelo estado externo',
      panelTitle: LABELS.title(),
      panelDescription: LABELS.description(),
      cancelLabel: LABELS.cancelar(),
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsButton variant="outline" (click)="isOpen = true">{{ externalLabel }}</button>

        <nds-sheet [open]="isOpen" (openChange)="isOpen = $event">
          <ng-template ndsSheetContent>
            <div ndsSheetHeader>
              <h2 ndsSheetTitle>{{ panelTitle }}</h2>
              <p ndsSheetDescription>{{ panelDescription }}</p>
            </div>

            <div ndsSheetFooter>
              <button ndsSheetClose ndsButton variant="outline">{{ cancelLabel }}</button>
            </div>
          </ng-template>
        </nds-sheet>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalVanish('dialog');
      }
      // O que a espera NÃO prova, e por isso é o que se afirma aqui: o NÓ do
      // painel não está no documento (a espera só consulta o papel `dialog`), e
      // não existe gatilho DENTRO do componente — quem abre este painel é o
      // botão de fora, que é o assunto da story.
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
      await expect(canvasElement.querySelector('[data-slot="sheet-trigger"]')).toBeNull();
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAttribute('data-state', 'open');
    });

    await step('Com o painel aberto, a página atrás não rola', async () => {
      // C5. `aria-modal="true"` promete que o resto da página está fora de
      // alcance; sem a trava a promessa é falsa — o leitor de tela não alcança o
      // que está atrás, mas o mouse e a roda alcançam.
      //
      // O marcador é o gancho que a própria lib publica para isto, e ele é
      // INDEPENDENTE de estratégia: a trava escolhe entre `scrollbar-gutter` e
      // compensação de largura conforme o navegador, então afirmar sobre
      // `overflow` mediria qual estratégia rodou, e não se a página travou.
      await expect(document.documentElement).toHaveAttribute('data-rdx-scroll-locked');
    });

    await step('Fechar por dentro devolve o valor e SOLTA a rolagem', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: LABELS.cancelar() }));
      await waitForPortalVanish('dialog');
      // A espera já provou que o papel `dialog` sumiu; o que ela não prova é que
      // o nó saiu do documento. Se o output não tivesse chegado, `isOpen`
      // continuaria true e o painel reabriria no próximo ciclo de detecção.
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
      // A outra metade de C5, e a que de fato quebra a página quando falha:
      // trava que não solta deixa o documento inerte depois que o painel sumiu.
      await expect(document.documentElement).not.toHaveAttribute('data-rdx-scroll-locked');
    });
  },
};

// ─── Dois painéis, e o mais novo manda ────────────────────────────────────────
//
// O Sheet é MODAL: um de cada vez. Abrir o segundo tira o primeiro da tela, e
// essa saída é um fechamento como qualquer outro — precisa dizer por quê. A lib
// desta stack empilha diálogos; quem recolhe o anterior é o componente, e o
// painel que sai da TELA tem de sair também do analytics, senão a série de
// abre/fecha da docs page não fecha a conta.

/**
 * Motivos que o PRIMEIRO painel relatou, gravados no render e lidos pela play.
 *
 * Fora do render porque o `(onOpenChange)` é ligado na MONTAGEM e a play só
 * recebe o `canvasElement`: sem um ponto combinado entre os dois, não há como
 * observar o output daqui.
 */
const firstPanelReasons: SheetCloseReason[] = [];

export const SecondPanelClosesFirst: Story = {
  parameters: {
    docs: {
      source: { transform: sheetSecondPanelSource },
      description: {
        story:
          'Dois painéis na mesma página. Abrir o segundo fecha o primeiro, que relata o motivo ' +
          'api — ninguém o dispensou, foi a modalidade do componente que o recolheu.',
      },
    },
  },
  render: () => ({
    props: {
      secondOpen: false,
      noteFirstClose: (evento: RdxDialogOpenChange) => {
        if (!evento.open) firstPanelReasons.push(sheetCloseReason(evento.reason));
      },
    },
    template: `
      <div class="nds-cluster" data-spacing="md">
        <nds-sheet (onOpenChange)="noteFirstClose($event)">
          <button ndsSheetTrigger ndsButton variant="outline">Abrir o primeiro</button>

          <ng-template ndsSheetContent side="left">
            <div ndsSheetHeader>
              <h2 ndsSheetTitle>Primeiro painel</h2>
              <p ndsSheetDescription>Este sai de cena quando o outro entra.</p>
            </div>

            <div ndsSheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                Abra o segundo painel e este aqui se recolhe.
              </p>
            </div>

            <div ndsSheetFooter>
              <button ndsButton variant="outline" (click)="secondOpen = true">Abrir o segundo</button>
            </div>
          </ng-template>
        </nds-sheet>

        <nds-sheet [open]="secondOpen" (openChange)="secondOpen = $event">
          <ng-template ndsSheetContent side="right">
            <div ndsSheetHeader>
              <h2 ndsSheetTitle>Segundo painel</h2>
              <p ndsSheetDescription>
                O mais novo manda: dois painéis modais ao mesmo tempo deixariam um deles inalcançável.
              </p>
            </div>

            <div ndsSheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                Este entrou por último, então é este que está na tela.
              </p>
            </div>
          </ng-template>
        </nds-sheet>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole('button', { name: 'Abrir o primeiro' });

    // O painel Interactions REEXECUTA a play no mesmo DOM: sem este ponto de
    // partida, a rodada seguinte começaria com um painel aberto e um motivo já
    // gravado. A lista é zerada DEPOIS do fecho, que também relata.
    if (within(document.body).queryAllByRole('dialog').length > 0) {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('dialog');
    }
    firstPanelReasons.length = 0;

    await step('O primeiro painel abre sozinho na tela', async () => {
      await userEvent.click(firstTrigger);
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAccessibleName('Primeiro painel');
      await expect(document.querySelectorAll('[data-slot="sheet-content"]')).toHaveLength(1);
      await expect(firstPanelReasons).toEqual([]);
    });

    await step('Abrir o segundo recolhe o primeiro, e ele diz por quê', async () => {
      // O segundo painel abre por ESTADO, e o controle que vira esse estado
      // mora DENTRO do primeiro painel. Não é rodeio de teste: com um modal
      // aberto a lib põe `pointer-events: none` no body e marca o resto da
      // página como inerte, então nenhum gatilho de fora é clicável enquanto o
      // primeiro estiver na tela — quem abre o segundo só pode ser algo que
      // esteja dentro do primeiro, ou código.
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: 'Abrir o segundo' }));

      await waitFor(() => {
        const openPanels = document.querySelectorAll('[data-slot="sheet-content"]');
        if (openPanels.length !== 1) {
          throw new Error(`esperava um painel na tela, achei ${openPanels.length}`);
        }
      });

      const onScreen = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')!;
      await expect(onScreen).toHaveAccessibleName('Segundo painel');
      // `api`, e não `overlay`/`escape`/`close-button`: nenhum gesto da pessoa
      // fechou este painel — foi uma decisão de dentro do componente.
      await expect(firstPanelReasons).toEqual(['api']);
    });

    // Termina fechado, e o primeiro não relata um segundo fechamento: ele já
    // tinha saído.
    await userEvent.keyboard('{Escape}');
    await waitForPortalVanish('dialog');
    await expect(firstPanelReasons).toEqual(['api']);
  },
};
