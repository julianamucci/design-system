import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen, fn } from 'storybook/test';
import type { RdxPopoverOpenChange } from '@radix-ng/primitives/popover';
import { NDS_POPOVER, popoverCloseReason } from './popover';
import {
  popoverBasicSource,
  popoverControlledSource,
  popoverFocusedSource,
  popoverModalSource,
  popoverOpenSource,
} from './popover.source';
import { open, panel } from './popover.fixtures';
import { NdsButton } from './button';
import { NdsCheckbox } from './checkbox';
import { NdsLabel } from './label';

import { figmaDesign } from '@shared/figma/design-links';
// Os quatro estados que o conteúdo compartilhado descreve: fechado (painel fora
// do DOM), aberto, controlado por fora e foco dentro do painel.
//
// O estado "Fechando" da tabela não vira story própria porque não há mais
// intervalo para fotografar: desde 2026-09-12 o Popover não anima nem para
// entrar nem para sair, a folha compartilhada perdeu a regra de
// `[data-ending-style]`, e o painel desmonta no render seguinte ao fechamento.
// A afirmação anterior — de que o estado se provava pelo `data-ending-style`
// que a folha animava — caiu junto com a regra.
//
// Quem o observa hoje são os passos de FECHAMENTO das outras stories: Escape e
// botão de fechar no `popover.stories.ts`, clique fora em `Controlled` logo
// abaixo. Os três terminam em `panel()` nulo, que é exatamente o que a tabela
// de estados promete — "nada fica na tela depois de quem usa fechar".

const meta: Meta = {
  title: 'Components/Overlay/Popover/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_POPOVER, NdsButton, NdsCheckbox, NdsLabel] })],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado, aberto, controlado por fora e com foco interno. Fechado o painel ' +
          'sai do DOM — não é um elemento escondido, é um elemento que não existe.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// O rodapé fecha por DOIS caminhos, e a diferença é o que separa "desistiu" de
// "concluiu" no relatório: o "Cancelar" é a peça de fechar (`close-press`, que
// o design system lê como `close-button`) e o "Salvar" escreve no estado
// (`api`). Por isso toda story que usa este painel liga `[(open)]="aberto"` —
// sem estado externo não há como fechar por código.
const SIMPLE_PANEL = `
        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h2 ndsPopoverTitle>Configurações de exibição</h2>
            <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <button ndsButton size="sm" (click)="aberto = false">Salvar</button>
          </div>
        </ng-template>`;

export const Closed: Story = {
  parameters: {
    // O painel Code publica o componente que se escreve, e não este template:
    // ele interpola `SIMPLE_PANEL` e amarra o `[(open)]` a uma propriedade solta
    // que só existe dentro do renderer do Storybook.
    docs: { source: { transform: popoverBasicSource } },
  },
  render: () => ({
    props: { aberto: false },
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <div ndsPopover [(open)]="aberto">
          <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
          ${SIMPLE_PANEL}
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá, que é o comportamento desejado.
      await expect(panel()).toBeNull();
      await expect(screen.queryByRole('dialog')).toBeNull();
    });

    await step('E o gatilho declara o estado nos dois contratos', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // Sem painel não há id para apontar — o atributo some, senão o axe
      // reprovaria por aria-valid-attr-value.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
    });
  },
};

export const Open: Story = {
  // Story SEM interação de fechamento: termina aberta de propósito, porque é
  // este estado que o axe varre (ARIA e contraste do painel) e que o Chromatic
  // fotografa. Os dois itens vieram do Playground na revalidação do contrato —
  // lá a play termina com o painel fechado.
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2'],
    // O snippet desta story afirma o que ela afirma: o painel nasce aberto, e
    // num painel controlado isso mora no SINAL — `signal(true)`.
    docs: { source: { transform: popoverOpenSource } },
  },
  render: () => ({
    // Nasce aberta pelo estado externo, e não por `defaultOpen`: o rodapé fecha
    // por código no "Salvar", e isso exige o par `[open]`/`(openChange)`. O
    // `defaultOpen` continua provado pela story `Modal` logo abaixo, que abre
    // por ele e reprovaria se o input não chegasse.
    props: { aberto: true },
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <div ndsPopover [(open)]="aberto">
          <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
          ${SIMPLE_PANEL}
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });

    await step('O estado inicial abre o painel já na primeira renderização', async () => {
      // Prova o binding de input: sob JIT o componente cairia no valor padrão
      // do próprio componente e nasceria fechado, sem erro nenhum.
      await waitFor(async () => {
        await expect(screen.getByRole('dialog')).toBeVisible();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
      await expect(panel()).toHaveAttribute('data-state', 'open');
    });
  },
};

/**
 * Espião do `(onOpenChange)` da `Controlled`, e a DECISÃO do consumidor.
 *
 * No módulo pelo mesmo motivo do espião da `Focused`: a play precisa alcançá-lo.
 * `refuseClose` é o consumidor dizendo "não" ao fechamento, e a forma de dizer
 * "não" nesta stack é `eventDetails.cancel()`. Não escrever no estado NÃO recusa
 * aqui: o `open` do radix-ng é um `model()`, que o próprio primitivo põe em
 * `false` antes de o `(openChange)` chegar ao consumidor, e o `[open]` ligado a
 * um valor que não mudou não o empurra de volta. O cancelamento é a recusa que
 * a API da lib oferece — divergência de API de framework, declarada.
 */
const controlledOpenChange = fn();
const controlledDecision = { refuseClose: false };

/** Registra o anúncio e, se o consumidor recusa, cancela o fechamento. */
function recordControlledOpenChange(event: RdxPopoverOpenChange): void {
  controlledOpenChange(event.open, event.open ? undefined : popoverCloseReason(event.reason));
  if (!event.open && controlledDecision.refuseClose) event.eventDetails.cancel();
}

/** Fechamentos anunciados até agora na `Controlled`. */
function controlledCloseCount(): number {
  return controlledOpenChange.mock.calls.filter(([isOpen]) => isOpen === false).length;
}

/** Espera de RELÓGIO antes de contar: `waitFor` não prova que um segundo anúncio NÃO chegou. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150));
}

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item3'],
    // O par por extenso é o assunto, e o snippet o publica com um sinal — sem
    // o parágrafo `data-testid` e sem o espião, que são alvo e instrumento da
    // play, e não do componente.
    docs: { source: { transform: popoverControlledSource } },
  },
  render: () => ({
    props: { aberto: false, recordControlledOpenChange },
    // O par `[open]`/`(openChange)` escrito por extenso, que é o assunto desta
    // story — `[(open)]="aberto"` das outras é o mesmo par açucarado.
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <div class="nds-cluster" data-spacing="md">
          <div
            ndsPopover
            [open]="aberto"
            (openChange)="aberto = $event"
            (onOpenChange)="recordControlledOpenChange($event)"
          >
            <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
            ${SIMPLE_PANEL}
          </div>

          <button ndsButton variant="ghost" (click)="aberto = !aberto">
            Alternar por fora
          </button>

          <p class="nds-text-body nds-text-muted-foreground" data-testid="area-externa">
            Área externa
          </p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });
    const externo = canvas.getByRole('button', { name: 'Alternar por fora' });

    await step('O estado externo abre e fecha o painel', async () => {
      if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(externo);
      await userEvent.click(externo);
      await waitFor(async () => {
        await expect(screen.getByRole('dialog')).toBeVisible();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar fora do painel fecha o popover', async () => {
      await open(trigger);
      // Um elemento inerte fora do gatilho e fora do painel. O primitivo fecha
      // no pointerdown de fora — é o comportamento nativo que o conteúdo
      // compartilhado promete, e o `open` controlado acompanha.
      await userEvent.click(canvas.getByTestId('area-externa'));
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('No modo controlado, o foco levado para fora anuncia o fechamento uma vez, e o pedido seguinte também é anunciado', async () => {
      // D15 no modo CONTROLADO. O defeito que este passo guarda é a guarda que
      // só anuncia a PRIMEIRA perda de foco: um "já pedi para fechar" que não se
      // desarma quando o consumidor recusa deixa o painel aberto e MUDO para
      // todo pedido seguinte.
      await open(trigger);
      controlledDecision.refuseClose = true;
      try {
        const closesBefore = controlledCloseCount();

        // 1ª perda de foco: um anúncio, com `overlay`, e o consumidor recusa.
        externo.focus();
        await settle();
        await expect(controlledCloseCount()).toBe(closesBefore + 1);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
        // A recusa vale: o painel continua aberto, e o gatilho diz o mesmo.
        await expect(panel()).not.toBeNull();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');

        // A perda de foco se REPETE: o foco volta ao painel e sai de novo.
        const cancel = within(panel()!).getByRole('button', { name: 'Cancelar' });
        cancel.focus();
        await expect(cancel).toHaveFocus();
        externo.focus();
        await settle();
        await expect(controlledCloseCount()).toBe(closesBefore + 2);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
        await expect(panel()).not.toBeNull();

        // O foco volta ao painel ainda sob recusa: é o estado aberto-com-foco-
        // -dentro que o passo final espera, e sair daqui com o foco em "Alternar
        // por fora" seria um painel aberto que a fixture não reconhece.
        within(panel()!).getByRole('button', { name: 'Cancelar' }).focus();
      } finally {
        controlledDecision.refuseClose = false;
      }
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(screen.getByRole('dialog')).toBeVisible();
    });
  },
};

/**
 * Espião do `(onOpenChange)` da `Focused`, já no vocabulário do design system.
 * Fica no MÓDULO, e não dentro do `render`: criado lá, a play não teria como
 * alcançá-lo. É ele que conta os fechamentos e lê o motivo — o destino do foco
 * sozinho não diz que o painel fechou UMA vez, nem por quê.
 */
const focusedOpenChange = fn();

/** Traduz o evento do primitivo e registra no espião — ligado pelo template. */
function recordFocusedOpenChange(event: { open: boolean; reason?: string }): void {
  focusedOpenChange(event.open, event.open ? undefined : popoverCloseReason(event.reason));
}

/** Fechamentos anunciados até agora — a play compara antes e depois. */
function focusedCloseCount(): number {
  return focusedOpenChange.mock.calls.filter(([isOpen]) => isOpen === false).length;
}

export const Focused: Story = {
  parameters: {
    covers: ['functional.item4'],
    // Construtor PRÓPRIO: o painel desta story é o de CONFIRMAÇÃO — título sem
    // descrição, Cancelar e Confirmar —, o mesmo nas cinco, e não o painel de
    // `Closed`. Os vizinhos "Antes" e "Depois" e o espião do `(onOpenChange)`
    // são andaime e NÃO entram; `popover.source.test.ts` cobra as duas coisas.
    docs: { source: { transform: popoverFocusedSource } },
  },
  render: () => ({
    props: { aberto: false, recordFocusedOpenChange },
    // ─── Os vizinhos do gatilho: o que dá dentes à asserção de DESTINO ─────
    //
    // Sem outro focável ao lado do gatilho, "o foco voltou ao gatilho" passava
    // por acaso da composição: numa stack, a sentinela da lib mandava o foco ao
    // próximo focável depois do gatilho e, sem vizinho, dava a volta e caía no
    // próprio gatilho. Com um antes e um depois, um destino errado tem para
    // onde ir. Tamanho padrão: o `sm` reprova no `target-size` do axe.
    //
    // O painel é escrito AQUI, e não interpolado de uma constante: o teste do
    // painel Code lê o TEXTO da story e o compara com o snippet.
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <div class="nds-cluster" data-spacing="md">
          <button ndsButton variant="ghost">Antes</button>
          <div ndsPopover [(open)]="aberto" (onOpenChange)="recordFocusedOpenChange($event)">
            <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>

            <ng-template ndsPopoverContent>
              <div class="nds-stack" data-spacing="sm">
                <h2 ndsPopoverTitle>Confirmar alteração</h2>

                <div class="nds-cluster" data-justify="end" data-spacing="sm">
                  <!-- Desistiu: a peça de fechar, que reporta close-button -->
                  <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
                  <!-- Concluiu: confirma e fecha por código, que reporta api -->
                  <button ndsButton size="sm" (click)="aberto = false">Confirmar</button>
                </div>
              </div>
            </ng-template>
          </div>
          <button ndsButton variant="ghost">Depois</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });
    const before = canvas.getByRole('button', { name: 'Antes' });

    await step('O foco entra no painel, no primeiro elemento focável', async () => {
      await open(trigger);
      await waitFor(async () => {
        await expect(panel()!.contains(document.activeElement)).toBe(true);
      });
      // No PRIMEIRO focável, e não num qualquer: é a metade "sem marca" do
      // `data-autofocus` que a tabela de estados promete. Sem esta linha o passo
      // aceitaria o foco em qualquer lugar do painel.
      await expect(within(panel()!).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    });

    await step('No modo não-modal, o resto da página não é escondido', async () => {
      // O par do passo da story `Modal`: o esconder do leitor de tela é do modo
      // modal, e só dele (decisão da dona de 2026-09-17). "Antes" foi lido no
      // começo da play, com a página ainda à vista.
      await open(trigger);
      await expect(before.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('Tab caminha entre os controles internos', async () => {
      const cancel = within(panel()!).getByRole('button', { name: 'Cancelar' });
      const confirm = within(panel()!).getByRole('button', { name: 'Confirmar' });
      cancel.focus();
      await userEvent.tab();
      await expect(confirm).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria. O foco chegou aqui pelo
      // Tab do passo anterior.
      const confirm = within(panel()!).getByRole('button', { name: 'Confirmar' });
      await expect(confirm).toHaveFocus();
      await expect(confirm.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(confirm).boxShadow).not.toBe('none');
    });

    await step('Do ÚLTIMO focável, Tab fecha o painel e devolve o foco ao gatilho', async () => {
      // ─── O contrato C3, decisão da dona de 2026-09-17 ────────────────────
      //
      // Este passo é o par da asserção da story `Modal`, e é o que dá dentes às
      // duas: a MESMA tecla, no MESMO lugar, com resultado oposto conforme o
      // modo. Aqui, sem `modal`, o painel fecha e o foco volta ao gatilho; lá,
      // com `modal`, o foco volta ao primeiro focável e o painel fica.
      //
      // O destino é o gatilho, e não "Antes", não "Depois", não o `body`. E o
      // espião diz que fechou UMA vez, como `overlay`.
      await open(trigger);
      const confirm = within(panel()!).getByRole('button', { name: 'Confirmar' });
      confirm.focus();
      await expect(confirm).toHaveFocus();
      const closesBefore = focusedCloseCount();
      await userEvent.tab();

      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      // A devolução é do escopo de foco do primitivo, num quadro depois do
      // desmonte — por isso espera, e não lê de imediato.
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
      // Relógio antes de contar: o foco devolvido ao gatilho não pode somar um
      // segundo fechamento pela perda de foco (D15).
      await settle();
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Do PRIMEIRO focável, Shift+Tab fecha o painel e devolve o foco ao gatilho', async () => {
      // O sentido de volta, com as mesmas asserções. Um conserto que só olhasse
      // o último focável passaria no passo acima e reprovaria aqui.
      //
      // Reaberto pela fixture, que só clica se estiver fechado: o passo
      // anterior termina com o painel FECHADO.
      await open(trigger);
      const cancel = within(panel()!).getByRole('button', { name: 'Cancelar' });
      await expect(cancel).toHaveFocus();
      const closesBefore = focusedCloseCount();
      await userEvent.tab({ shift: true });

      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
      await settle();
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o painel aberto, o foco levado por código para "Antes" fecha o painel e fica em "Antes"', async () => {
      // D15, decisão da dona de 2026-09-17: o painel não-modal fica aberto só
      // enquanto o foco está nele. `focus()`, e não clique — clicar em "Antes"
      // é clique fora, que fecha pelo ponteiro; aqui o único caminho é o foco.
      // E o destino é de quem moveu: o foco NÃO volta ao gatilho.
      //
      // Nesta stack quem fecha é o primitivo (`close('focus-out')`, entregue
      // como `overlay`), e quem PODERIA devolver o foco ao gatilho é o escopo de
      // foco no desmonte — ver o bloco sobre a D15 no `popover.ts`.
      await open(trigger);
      const closesBefore = focusedCloseCount();
      before.focus();
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      // Relógio antes de contar e de ler o foco: a devolução do escopo de foco
      // roda num quadro DEPOIS do desmonte, e um segundo fechamento atrasado não
      // apareceria na primeira tentativa de um `waitFor`.
      await settle();
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(before);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o painel aberto, clicar em "Antes" fecha o painel uma vez só', async () => {
      // O clique fora num elemento FOCÁVEL aciona os DOIS caminhos de dispensa
      // no mesmo gesto: o ponteiro (`outside-press`) e o foco (`focus-out`). A
      // Playground clica num `<p>`, que não recebe foco, e por isso nunca
      // exercitou a soma. No radix-ng o gerenciador de foco ignora a perda de
      // foco com o botão apertado — ver o bloco sobre a D15 no `popover.ts` —,
      // e é esta contagem que diz se isso segue verdade.
      await open(trigger);
      const closesBefore = focusedCloseCount();
      await userEvent.click(before);
      await settle();
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(before);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o foco dentro do painel, clicar no gatilho fecha uma vez só', async () => {
      // O gatilho conta como parte do painel: o clique o foca antes do `click`
      // chegar, e se ele contasse como "fora" o painel fecharia pelo foco e o
      // clique o alternaria de novo — ou anunciaria dois fechamentos. O motivo
      // do clique no gatilho é `overlay` (§9 do PRD).
      await open(trigger);
      const cancel = within(panel()!).getByRole('button', { name: 'Cancelar' });
      cancel.focus();
      await expect(cancel).toHaveFocus();
      const closesBefore = focusedCloseCount();
      // Clique com PAUSA entre apertar e soltar, e não `userEvent.click`: no
      // clique sintético o `click` pode chegar antes da dispensa por foco, e um
      // gatilho tratado como "fora" passaria. Com a pausa a ordem é a da mão —
      // o foco muda com o botão ainda apertado. As duas metades na MESMA
      // instância de `userEvent.setup()`, que é quem guarda o botão apertado:
      // com o `userEvent` avulso, duas chamadas não emitem `click` nenhum.
      const user = userEvent.setup();
      await user.pointer({ keys: '[MouseLeft>]', target: trigger });
      await new Promise((resolve) => setTimeout(resolve, 150));
      await user.pointer({ keys: '[/MouseLeft]', target: trigger });
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await settle();
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(focusedOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa, e é o assunto da
    // story — os passos acima a deixariam fechada, igual à `Closed`.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(panel()!.contains(document.activeElement)).toBe(true);
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      // O snippet leva `[modal]="true"`, os dois checkboxes rotulados e nenhuma
      // peça de fechar — a ausência é o assunto. O `[defaultOpen]="true"` daqui
      // NÃO vai: ele abre o painel para o axe e o Chromatic.
      source: { transform: popoverModalSource },
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava, o painel se anuncia como diálogo modal e o resto da página fica escondido do leitor de tela. As quatro coisas andam juntas: anunciar que o resto da página está inerte sem prender o foco nem escondê-lo engana quem navega por leitor de tela.',
      },
    },
  },
  render: () => ({
    // O painel NÃO traz controle de fechar de propósito. O primitivo desta stack
    // só trapeia com `modal === true` quando existe um `ndsPopoverClose`
    // registrado dentro dele (`hasPopupClose()`), e é exatamente esse buraco que
    // o laço de tabulação do `NdsPopover` fecha: sem ele, `modal` prometeria
    // prisão de foco e entregaria só a trava de rolagem. Com um botão de fechar
    // aqui, a story passaria pela lib e não mediria o nosso laço.
    //
    // DOIS focáveis, também de propósito: com um só, "o Tab do último volta ao
    // primeiro" seria verdade sem laço nenhum.
    //
    // E são CHECKBOX, e não o rodapé de ações das outras stories, porque os dois
    // motivos acima andam juntos: sem o `ndsPopoverClose`, um "Cancelar" não
    // cancelaria nada e um "Confirmar" não confirmaria nada — seriam dois botões
    // inertes só para encher a ordem de tabulação. Checkbox é um controle que se
    // BASTA: marcar já é o efeito, e ele não promete ação que a story não faz.
    //
    // Quem vier "consertar" isto de volta para o par Cancelar/Confirmar tira os
    // dentes dos dois últimos passos da play.
    template: `
      <div class="nds-min-h-70" style="contain: layout">
      <div ndsPopover [defaultOpen]="true" [modal]="true">
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir modal</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h2 ndsPopoverTitle>Popover modal</h2>
            <p ndsPopoverDescription>O foco fica preso no painel enquanto ele está aberto.</p>
          </div>

          <div class="nds-stack" data-spacing="sm">
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="popover-modal-remember"></button>
              <label ndsLabel for="popover-modal-remember">Lembrar minha escolha</label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="popover-modal-email"></button>
              <label ndsLabel for="popover-modal-email">Receber aviso por e-mail</label>
            </div>
          </div>
        </ng-template>
      </div>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('O painel abre em modo modal e anuncia aria-modal', async () => {
      const dialog = await waitFor(() => screen.getByRole('dialog'), { timeout: 2000 });
      await expect(dialog).toBeVisible();
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // Provar a prisão com `dialog.contains(document.activeElement)` SEM
      // tabular não mede nada: o foco está dentro do painel no modo não-modal
      // também, nas cinco stacks — é o contrato `functional.item1`. Essa
      // asserção não pode reprovar, e é a forma exata da asserção que guarda o
      // bug; foi encontrada assim em duas stacks desta família.
      //
      // O controle negativo de verdade é este: partir do ÚLTIMO focável e
      // apertar Tab. Não-modal, o painel FECHA e o foco volta ao gatilho, e esta
      // asserção reprova; modal, ele volta ao primeiro. O par é a `Focused`.
      const dialog = panel()!;
      const inside = within(dialog);
      const firstBox = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const lastBox = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      // ─── E SE ENTRA NO PAINEL POR TAB, não por `focus()` ────────────────
      //
      // `lastBox.focus()` pelado NÃO serve aqui, e isto não é preferência de
      // estilo: a ponte de foco do portal (`radix-ng-primitives-focus-scope`)
      // chama `disableFocusInside()` enquanto o foco está FORA do painel —
      // salva o tabindex original em `data-rdx-tabindex` e crava `-1` em todo
      // o conteúdo, para o Tab não cair no portal pela ordem do DOM. Ela só
      // desfaz isso num `focusin`, e o handler começa com
      // `if (!event.relatedTarget || !isOutsideEvent(event, node)) return;`.
      //
      // Foco programático vindo do `body` não carrega `relatedTarget`: o
      // retorno antecipado dispara e o conteúdo continua inerte. Medido em
      // 2026-09-13 — os dois checkboxes com `tabindex="-1"` e o Tab virando
      // NO-OP, porque a nossa lista de focáveis (que está certa) não conta
      // elemento que o Tab não alcança, e o laço sai pelo ramo "sem nada
      // focável dentro".
      //
      // Quem chega por Tab tem `relatedTarget`. Então entramos pelo gatilho,
      // que é o caminho real; a primeira asserção abaixo já prova que a ponte
      // reabilitou o conteúdo, e é ela que reprovaria se algum dia deixasse.
      //
      // `hidden: true` porque, com o painel modal aberto, o gatilho está
      // escondido do leitor de tela (item 7 da §7 do PRD) e a consulta por papel
      // não o acharia sem a opção.
      const trigger = screen.getByRole('button', { name: 'Abrir modal', hidden: true });
      trigger.focus();

      await userEvent.tab();
      await expect(firstBox).toHaveFocus();

      await userEvent.tab();
      await expect(lastBox).toHaveFocus();

      // O Tab que importa: a partir do ÚLTIMO.
      await userEvent.tab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(firstBox).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const dialog = panel()!;
      const inside = within(dialog);
      const firstBox = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const lastBox = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      // Aqui o `focus()` pode ser direto: o passo anterior deixou o foco DENTRO
      // do painel, e a ponte só volta a inertizar o conteúdo quando ele sai.
      firstBox.focus();
      await userEvent.tab({ shift: true });

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(lastBox).toHaveFocus();
    });

    await step('A rolagem da página fica TRAVADA enquanto ele está aberto', async () => {
      // O contrato C8, que até 2026-09-16 nenhuma das cinco media: `modal`
      // promete quatro coisas juntas — foco preso, `aria-modal`, trava de
      // rolagem e o resto da página escondido do leitor de tela. Foco e anúncio
      // já tinham passo; a trava era palavra.
      //
      // O que se mede é o MARCADOR em `<html>`, e não `overflow` computado: a
      // lib escolhe entre duas estratégias conforme o documento tenha barra de
      // rolagem sobreposta ou embutida (`preventScrollOverlayScrollbars` ×
      // `preventScrollInsetScrollbars`), e cada uma mexe em propriedades
      // diferentes. O atributo é, nas palavras da própria lib, o marcador
      // "independente de estratégia" posto justamente para ser observável.
      const html = document.documentElement;
      await waitFor(async () => {
        await expect(html).toHaveAttribute('data-rdx-scroll-locked');
      });
    });

    await step('E DESTRAVA ao fechar — a trava não sobrevive ao painel', async () => {
      // A outra metade, que é a que pega o defeito caro: trava que não solta
      // deixa a página inteira sem rolagem depois que o popover já sumiu. Sem
      // este passo, a asserção acima passaria com um lock vazado.
      //
      // Escape é a única saída deste painel: ele não tem peça de fechar, e a
      // ausência é o assunto da story.
      const html = document.documentElement;
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await waitFor(async () => {
        await expect(html).not.toHaveAttribute('data-rdx-scroll-locked');
      });
    });

    await step('Com o painel modal aberto, o resto da página fica escondido do leitor de tela, e volta ao fechar', async () => {
      // ─── Item 7 da §7 do PRD, decisão da dona de 2026-09-17 ─────────────
      //
      // `aria-modal` sozinho não esconde a página em todo leitor de tela, então
      // o modo modal esconde os de fora com `aria-hidden`. Esta story NÃO tem
      // peça de fechar (D2) — e, nesta stack, nem com ela o primitivo isolaria
      // o lado de fora: ver `hideOutside` no `popover.ts`.
      //
      // ANDAIME: o ancestral da story que é filho direto do `<body>` recebe
      // `aria-hidden="false"` antes de abrir. É o elemento que o esconder
      // TOCA, e o valor prévio negado é o que dá dentes à restauração — quem
      // só remove o atributo ao fechar reprova aqui.
      const trigger = screen.getByRole('button', { name: 'Abrir modal' });
      let marked: HTMLElement = trigger;
      while (marked.parentElement && marked.parentElement !== document.body) {
        marked = marked.parentElement;
      }
      marked.setAttribute('aria-hidden', 'false');
      try {
        await expect(panel()).toBeNull();
        await expect(trigger).not.toHaveAttribute('aria-hidden');

        await open(trigger);
        const dialog = panel()!;

        await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
        await expect(dialog.closest('[aria-hidden="true"]')).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(async () => {
          await expect(panel()).toBeNull();
        });

        await expect(trigger).not.toHaveAttribute('aria-hidden');
        await expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
        await expect(marked).toHaveAttribute('aria-hidden', 'false');
      } finally {
        marked.removeAttribute('aria-hidden');
      }
    });

    await step('Uma região viva fora do painel continua anunciando com o modal aberto', async () => {
      // ─── A EXCEÇÃO do item 7 da §7 do PRD, decisão da dona de 2026-09-17 ──
      //
      // O esconder do modo modal pula REGIÃO VIVA e `<script>`, igual à base-ui e
      // ao pacote `aria-hidden` que as outras stacks carregam — ver
      // `REGIOES_VIVAS` no `popover.ts`. Sem a exceção, um toast que anuncia
      // "salvo" ou um erro que chega com o painel aberto ficaria MUDO, e o
      // anúncio é justamente o que não pode se perder. Esta stack escondia tudo
      // até esta data, ao pé da letra do item 7.
      //
      // ANDAIME: a região viva é pendurada no `<body>`, que é onde o portal do
      // painel também mora — então ela é IRMÃ da cadeia do painel, exatamente o
      // que o algoritmo marca. Removida num `finally`, aberto ou fechado.
      const live = document.createElement('div');
      live.setAttribute('aria-live', 'polite');
      live.textContent = 'Alterações salvas';
      document.body.appendChild(live);

      const trigger = screen.getByRole('button', { name: 'Abrir modal' });
      try {
        await open(trigger);

        // A região viva não é marcada, e NENHUM ancestral dela é: `aria-hidden`
        // num ancestral esconde a subárvore inteira, e uma asserção só sobre o
        // próprio elemento passaria com ele silenciado por cima.
        await expect(live).not.toHaveAttribute('aria-hidden', 'true');
        await expect(live.closest('[aria-hidden="true"]')).toBeNull();

        // O CONTRASTE, no mesmo passo, e é ele que dá sentido às duas linhas
        // acima: um elemento comum de fora CONTINUA escondido. Sem esta linha,
        // uma exceção larga demais — não esconder nada — passaria.
        await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(async () => {
          await expect(panel()).toBeNull();
        });

        // E nada sobrou: nem na região viva, que nunca foi tocada, nem no lado
        // de fora, que voltou ao estado de antes.
        await expect(live).not.toHaveAttribute('aria-hidden');
        await expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
      } finally {
        live.remove();
      }
    });

    await step('Estado final: painel aberto', async () => {
      const html = document.documentElement;
      // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
      await open(screen.getByRole('button', { name: 'Abrir modal' }));
      await waitFor(async () => {
        await expect(html).toHaveAttribute('data-rdx-scroll-locked');
      });
    });
  },
};
