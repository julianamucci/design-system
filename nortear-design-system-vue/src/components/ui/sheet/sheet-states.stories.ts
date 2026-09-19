import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  createSheetCloseWatch,
  sheetCloseReason,
  type SheetCloseGesture,
  type SheetCloseReason,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  sheetOpenSource,
  sheetControlledSource,
  sheetClosedSource,
  sheetLongScrollBodySource,
  sheetNoButtonCloseSource,
  sheetSecondPanelClosesFirstSource,
} from './sheet.source';
import { waitForPointerRelease } from './sheet.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta = {
  title: 'Components/Overlay/Sheet/States',
  component: Sheet,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('sheet'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    // SEM `FOCUS_RULE_GUARDA`: as âncoras de foco que justificavam desligar
    // `aria-hidden-focus` não existem no caminho do Dialog. Motivo medido por
    // extenso no meta de `sheet-variants.stories.ts`.
    docs: {
      source: { transform: sheetClosedSource },
      description: {
        component:
          'Estados canônicos do Sheet: Closed (inicial), Open (defaultOpen), ' +
          'LongScrollBody (corpo mais alto que o painel), WithCloseButtonHidden ' +
          '(sem o botão do canto), Controlled (estado externo) e ' +
          'SecondPanelClosesFirst (um painel por vez).',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div class="nds-min-h-80 nds-w-full"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O motivo que cada fechamento do painel controlado relatou, na ordem.
 *
 * A `play` roda no mesmo módulo que a story e lê daqui. Um `fn()` de args não
 * serviria: o motivo não é prop do Sheet, e entraria na tabela de propriedades
 * da docs page como se fosse.
 */
const controlledCloseReasons: SheetCloseReason[] = [];

const sharedComponents = {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      // A do meta é a ausência de `default-open`; aqui a presença dela é o assunto.
      source: { transform: sheetOpenSource },
      description: {
        story:
          'Aberto por defaultOpen, sem estado externo nenhum. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      // O nome e a descrição ESPERADOS: sem argumento as duas passam com
      // qualquer texto — inclusive com o do gatilho, que é o defeito real aqui
      // (painel modal que se nomeia pelo botão que o abriu).
      await expect(panel).toHaveAccessibleName('Filtros avançados');
      await expect(panel).toHaveAccessibleDescription(
        'Configure os filtros para refinar os resultados.',
      );
      await expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
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
      // O corpo mais alto que o painel é o assunto: sem os parágrafos repetidos
      // não há rolagem para o leitor ver de onde vem a separação corpo/rodapé.
      source: { transform: sheetLongScrollBodySource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          "é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    // O exemplo é o da REFERÊNCIA: os termos de uso em 24 parágrafos. Eram 12
    // pares rótulo+campo numa grade, e só aqui — o assunto é a ROLAGEM, e o
    // formulário trazia junto a lição do `form` religado, que é de outra
    // composição.
    template: `
      <Sheet default-open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Termos de uso</SheetTitle>
            <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
          </SheetHeader>
          <SheetBody aria-label="Termos de uso">
            <div class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
              <p v-for="i in 24" :key="i">
                Parágrafo {{ i }}: termos longos o bastante para o corpo precisar rolar dentro do painel, sem empurrar o rodapé para fora da tela.
              </p>
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aceitar termos</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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

    await step('A região rolável é parada de teclado COM papel e nome', async () => {
      // Os TRÊS juntos, que é o que o contrato exige (C7). WCAG 2.1.1: sem o
      // `tabindex` quem navega por teclado não consegue rolar o corpo (é a
      // regra scrollable-region-focusable do axe). E parada de teclado precisa
      // de papel: `aria-label` em elemento sem papel é atributo PROIBIDO, que
      // o leitor de tela descarta — por isso o primitivo só emite o `role`
      // quando o nome vem.
      //
      // O ramo existe nas cinco stacks e nenhuma story o exercitava, então
      // `role="group"` nunca chegava a ser emitido: o corpo era parada de
      // teclado anônima em toda parte, sem nada reprovando.
      await expect(body).toHaveAttribute('tabindex', '0');
      await expect(body).toHaveAttribute('role', 'group');
      await expect(body).toHaveAttribute('aria-label', 'Termos de uso');
      await expect(body).toHaveAccessibleName('Termos de uso');
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
      // Sem gatilho e sem o botão do canto: a saída passa a ser o rodapé, e é o
      // par (prop desligada + rodapé com saída) que precisa aparecer junto.
      source: { transform: sheetNoButtonCloseSource },
      description: {
        story:
          'Sem o botão do canto. Só faz sentido quando o rodapé já oferece uma saída ' +
          'explícita — Escape continua fechando de qualquer forma.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    // Os rótulos são os da Demonstração, como nas outras stacks: o assunto é a
    // AUSÊNCIA do X, e um exemplo próprio fazia a mesma story contar duas
    // histórias e não se comparava com as irmãs.
    template: `
      <Sheet default-open>
        <SheetContent side="right" :show-close-button="false">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O botão do canto não é renderizado', async () => {
      await expect(panel).toBeVisible();
      await expect(
        within(panel).queryByRole('button', { name: /^Fechar$/i }),
      ).not.toBeInTheDocument();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      // `getAllByRole(...).length > 0` NÃO podia reprovar: o `getAll` estoura
      // em zero ANTES de a comparação acontecer, então a asserção só rodava
      // quando já tinha passado. Conta o que o rodapé promete, por ÍNDICE.
      await expect(
        within(footer!)
          .queryAllByRole('button')
          .map((button) => button.textContent?.trim()),
      ).toEqual(['Cancelar', 'Aplicar filtros']);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // Estado externo: entra `open` ligado e sai `update:open` — nada disso
      // existe na composição não-controlada que o meta mostra.
      source: { transform: sheetControlledSource },
      description: {
        story:
          'Estado do lado de fora. O componente não decide nada sozinho: abre quando o ' +
          'valor ligado diz que sim, e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      // O caminho de saída que o painel viu por último. Anotar é do primitivo;
      // traduzir o gesto em motivo é de quem consome — aqui, do dono do estado.
      let gesture: SheetCloseGesture | null = null;
      const closeWatch = createSheetCloseWatch((seen) => { gesture = seen; });

      function recordClose() {
        controlledCloseReasons.push(sheetCloseReason(gesture));
        gesture = null;
      }

      function handleOpenChange(value: boolean) {
        open.value = value;
        if (value) {
          gesture = null;
          return;
        }
        recordClose();
      }

      /**
       * A ação primária confirma e ela mesma fecha, mexendo no estado externo.
       * Fechar assim NÃO passa por `update:open` — a lib só avisa o que ela
       * própria decide —, então é o dono do estado quem relata. É o caminho
       * `api`: fechou por decisão de dentro.
       */
      function confirmAndClose() {
        gesture = 'confirm';
        open.value = false;
        recordClose();
      }

      return { open, closeWatch, handleOpenChange, confirmAndClose };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Button variant="outline" :data-open="String(open)" @click="open = true">Abrir pelo estado externo</Button>
        <Sheet :open="open" @update:open="handleOpenChange">
          <SheetContent v-bind="closeWatch" side="right">
            <SheetHeader>
              <SheetTitle>Controlado pelo pai</SheetTitle>
              <SheetDescription>
                Este painel é comandado por estado externo, e devolve cada mudança a quem é dono dele.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">Cancelar</Button>
              </SheetClose>
              <Button @click="confirmAndClose">Aplicar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /Abrir pelo estado externo/i });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      // A espera acima já provou a ausência do PAPEL `dialog` — repeti-la aqui
      // seria afirmar o que ela afirmou. O que ela não prova é que o nó do
      // painel saiu do documento, e é isso que se afirma.
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    // Depois do fechamento de partida: a play REEXECUTA no mesmo DOM, e o passo
    // acima pode ter fechado o que a rodada anterior deixou aberto.
    controlledCloseReasons.length = 0;

    // Lido ANTES de abrir: é isto que o fechamento tem de devolver, e não a
    // string vazia — outro painel pode estar segurando a trava.
    const overflowAntes = document.body.style.overflow;

    await step('O estado externo abre o painel', async () => {
      await waitForPointerRelease();
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
    });

    await step('Com o painel aberto, a página atrás não rola', async () => {
      // `aria-modal="true"` promete que o resto da página está fora de
      // alcance. Sem a trava a promessa é falsa: o leitor de tela não alcança
      // o que está atrás, mas o mouse e a roda alcançam. Era o contrato C5, e
      // só o Vanilla o afirmava.
      //
      // A lib trava no tique seguinte à abertura, então a espera é necessária
      // — e é de LEITURA pura: um `waitFor` que MEXESSE no DOM reagendaria a
      // si mesmo até o navegador travar, sem reprovar.
      await waitFor(() => {
        if (document.body.style.overflow !== 'hidden') {
          throw new Error(
            `esperava a rolagem da página travada, achei "${document.body.style.overflow}"`,
          );
        }
      });
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: /^Cancelar$/i }));
      await waitForPortalGone('dialog');
      // A espera acima já provou que o painel saiu do DOM — repetir isso aqui
      // era asserção que não podia reprovar. O que ela NÃO prova é que o valor
      // VOLTOU a quem é dono dele: sem o `update:open`, `open` continuaria
      // true e o painel reabriria no próximo ciclo de render.
      await expect(externo).toHaveAttribute('data-open', 'false');
      await expect(controlledCloseReasons.at(-1)).toBe('close-button');
    });

    await step('E a trava de rolagem foi solta junto', async () => {
      await waitFor(() => {
        if (document.body.style.overflow !== overflowAntes) {
          throw new Error('a rolagem da página não foi devolvida depois do fecho');
        }
      });
    });

    await step('A ação primária confirma e fecha, e isso se chama api', async () => {
      await waitForPointerRelease();
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: /^Aplicar$/i }));
      await waitForPortalGone('dialog');
      // O defeito que este passo guarda: até 2026-09-11 o motivo que sobrava era
      // `close-button`, e confirmar chegava ao relatório como "apertou o X".
      await expect(controlledCloseReasons.at(-1)).toBe('api');
    });

    await step('Os dois caminhos relataram motivos DIFERENTES', async () => {
      await expect(controlledCloseReasons).toEqual(['close-button', 'api']);
    });
  },
};

// ─── Dois painéis, e o mais novo manda ────────────────────────────────────────
//
// O Sheet é MODAL: um de cada vez. Abrir o segundo tira o primeiro da tela, e
// essa saída é um fechamento como qualquer outro — precisa dizer por quê. Sem
// a guarda a lib EMPILHA os dois: o de baixo fica atrás do véu, inalcançável, e
// some do analytics sem nunca ter relatado um fechamento.
//
// A guarda mora no primitivo (`SheetContent.vue`), como no Vanilla, e é por
// isso que esta story não faz nada para o primeiro se recolher.

/** Motivos que o PRIMEIRO painel relatou, na ordem. */
const firstPanelReasons: SheetCloseReason[] = [];

/**
 * Estado do SEGUNDO painel, no módulo para a `play` alcançar.
 *
 * Abrir o segundo por CLIQUE não é possível: enquanto o primeiro é modal a lib
 * deixa `pointer-events: none` no `body`, e o `userEvent` recusa clicar num
 * elemento assim. Quem comanda o segundo é o estado — que é também o que a
 * pessoa escreveria, já que o gatilho dele estaria atrás do véu.
 */
const secondPanelOpen = ref(false);

export const SecondPanelClosesFirst: Story = {
  parameters: {
    docs: {
      source: { transform: sheetSecondPanelClosesFirstSource },
      description: {
        story:
          'Dois painéis na mesma página. Abrir o segundo fecha o primeiro, que relata o ' +
          'motivo api — ninguém o dispensou, foi a modalidade do componente que o recolheu.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      // O caminho de saída que o PRIMEIRO painel viu. Anotar é do primitivo;
      // traduzir o gesto em motivo é de quem consome.
      let gesture: SheetCloseGesture | null = null;
      const closeWatch = createSheetCloseWatch((seen) => { gesture = seen; });

      function handleFirstOpenChange(value: boolean) {
        if (value) {
          gesture = null;
          return;
        }
        firstPanelReasons.push(sheetCloseReason(gesture));
        gesture = null;
      }

      function setSecondOpen(value: boolean) {
        secondPanelOpen.value = value;
      }

      return { closeWatch, handleFirstOpenChange, secondPanelOpen, setSecondOpen };
    },
    template: `
      <div class="nds-cluster" data-spacing="md">
        <Sheet @update:open="handleFirstOpenChange">
          <SheetTrigger as-child>
            <Button variant="outline">Abrir o primeiro</Button>
          </SheetTrigger>
          <SheetContent v-bind="closeWatch" side="left">
            <SheetHeader>
              <SheetTitle>Primeiro painel</SheetTitle>
              <SheetDescription>Este sai de cena quando o outro entra.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">Abra o segundo painel e este aqui se recolhe.</p>
            </SheetBody>
          </SheetContent>
        </Sheet>

        <Sheet :open="secondPanelOpen" @update:open="setSecondOpen">
          <SheetTrigger as-child>
            <Button variant="outline">Abrir o segundo</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Segundo painel</SheetTitle>
              <SheetDescription>O mais novo manda: dois painéis modais ao mesmo tempo deixariam um deles inalcançável.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">Este entrou por último, então é este que está na tela.</p>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole('button', { name: 'Abrir o primeiro' });

    // A play REEXECUTA no mesmo DOM: parte sempre do mesmo ponto.
    secondPanelOpen.value = false;
    await waitForPortalGone('dialog');
    await waitForPointerRelease();
    firstPanelReasons.length = 0;

    let firstPanel!: HTMLElement;

    await step('O primeiro painel abre sozinho na tela', async () => {
      await userEvent.click(firstTrigger);
      firstPanel = await waitForPortal('dialog', { name: 'Primeiro painel' });
      await expect(firstPanel).toHaveAccessibleName('Primeiro painel');
      await expect(firstPanelReasons).toEqual([]);
    });

    await step('Abrir o segundo recolhe o primeiro, e ele diz por quê', async () => {
      secondPanelOpen.value = true;

      // A espera é PELO NOME, e era aqui que estava o defeito. "Existe
      // exatamente um painel" já era verdade ANTES de o segundo montar — o
      // primeiro ainda estava lá —, então a condição passava na primeira
      // tentativa e a asserção media o painel em DESMONTE, cujo
      // `aria-labelledby` já apontava para um título fora do documento. Nome
      // acessível vazio era o sintoma de uma espera sem dentes, não de uma
      // asserção exigente demais.
      //
      // `waitForPortal` com `name` espera o painel CERTO e ainda segura a
      // animação de entrada (o portão de opacidade), que é o outro tempo que
      // esta story atravessa — aqui sem o gesto de clique para o cobrir.
      const panel = await waitForPortal('dialog', { name: 'Segundo painel' });
      await expect(panel).toHaveAccessibleName('Segundo painel');

      // O recolhimento foi DECIDIDO e RELATADO antes de o segundo se nomear.
      // Esta é a metade SÍNCRONA do contrato, e a que não depende de quando o
      // nó sai do DOM: a guarda do primitivo roda em `flush: 'sync'`, então o
      // motivo já está no livro-caixa neste ponto. O painel que sai da TELA
      // tem de sair também do analytics — `api` e não `overlay`/`escape`/
      // `close-button`, porque nenhum gesto da pessoa fechou este painel.
      await expect(firstPanelReasons).toEqual(['api']);

      // E o NÓ sai da tela. A saída passa pelo Presence da lib e pela fila de
      // render do Vue, então é assíncrona em relação ao nome do segundo:
      // afirmar a ordem instantânea aqui seria afirmar uma promessa que esta
      // lib não faz. A espera é só de LEITURA e tem prazo — se a guarda não
      // recolhesse, o primeiro continuaria na tela e isto reprovaria.
      await waitFor(() => {
        const abertos = document.querySelectorAll('[data-slot="sheet-content"]');
        const firstInDom = document.body.contains(firstPanel);
        if (firstInDom || abertos.length !== 1) {
          throw new Error(
            'esperava só o segundo painel na tela — ' +
            `primeiro ainda no DOM: ${firstInDom}, painéis: ${abertos.length}, ` +
            `motivos do primeiro: ${JSON.stringify(firstPanelReasons)}`,
          );
        }
      });
    });

    await step('Fechado o segundo, não sobra painel nenhum', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      // E o primeiro não relatou um SEGUNDO fechamento: ele já tinha saído, e
      // um registro morto no conjunto o faria fechar de novo aqui.
      await expect(firstPanelReasons).toEqual(['api']);
    });
  },
};
