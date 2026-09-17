import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { panel } from './popover.fixtures';
import {
  popoverOpenSource,
  popoverControlledSource,
  popoverClosedSource,
  popoverFocusedSource,
  popoverModalSource,
} from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/Popover/States',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: popoverClosedSource },
      description: {
        component:
          'Estados canônicos do Popover: Fechado (painel fora do DOM), Aberto, Controlado por fora e Modal (focus trap + scroll lock).',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Button,
  Checkbox,
};

const SIMPLE_PANEL = `
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Configurações de exibição</PopoverTitle>
              <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
            </PopoverHeader>
            <!-- Cancelar é a PEÇA de fechar (motivo close-button); Salvar fecha
                 por CÓDIGO, com o "close" do slot da raiz (motivo api). Por
                 isso toda raiz que usa ESTE painel declara v-slot="{ close }".
                 A Modal não o usa — ver MODAL_PANEL. -->
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <PopoverClose as-child>
                <Button variant="ghost" size="sm">Cancelar</Button>
              </PopoverClose>
              <Button size="sm" @click="close()">Salvar</Button>
            </div>
          </PopoverContent>`;

/**
 * O painel da Modal, e só dela.
 *
 * São DOIS focáveis porque o laço de tabulação não se prova com um: "o Tab do
 * último volta ao primeiro" seria verdade sem laço nenhum se o painel tivesse
 * um controle só.
 *
 * E são CHECKBOX, não o rodapé de ações das outras stories, por dois motivos
 * que andam juntos:
 *
 *   · não há controle de FECHAR aqui de propósito. O gerenciador de foco da lib
 *     só trapeia quando um `PopoverClose` está registrado no painel, e é esse
 *     buraco que o laço próprio do painel tapa — com um `PopoverClose` ali, a
 *     story mediria a lib, e não o nosso laço;
 *   · sem o `PopoverClose` o "Cancelar" não cancelaria nada e o "Salvar" não
 *     salvaria nada. Checkbox é um controle que se BASTA: marcar já é o efeito,
 *     e ele não promete ação que a story não faz.
 *
 * Quem vier "consertar" isto de volta para o par Cancelar/Salvar tira os dentes
 * dos dois últimos passos da play.
 */
const MODAL_PANEL = `
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Configurações de exibição</PopoverTitle>
              <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
            </PopoverHeader>
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster" data-spacing="sm">
                <Checkbox id="popover-modal-remember" />
                <label for="popover-modal-remember" class="nds-label">Lembrar minha escolha</label>
              </div>
              <div class="nds-cluster" data-spacing="sm">
                <Checkbox id="popover-modal-email" />
                <label for="popover-modal-email" class="nds-label">Receber aviso por e-mail</label>
              </div>
            </div>
          </PopoverContent>`;

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível. PopoverContent desmontado.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Popover v-slot="{ close }">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          ${SIMPLE_PANEL}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(trigger).toBeVisible();
      await expect(panel()).toBeNull();
    });

    await step('E o gatilho declara o estado fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
    });
  },
};

export const Open: Story = {
  parameters: {
    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (ARIA e contraste do painel) e que o
    // Chromatic fotografa.
    covers: ['accessibility.item1', 'accessibility.item2'],
    docs: {
      // Aberto é PRESENÇA de `default-open`; a do meta é justamente a ausência
      // dele, e as duas se leem lado a lado.
      source: { transform: popoverOpenSource },
      description: {
        story: 'Popover aberto via defaultOpen — captura visual no Chromatic. Content com role=dialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <Popover v-slot="{ close }" :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          ${SIMPLE_PANEL}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('O painel abre já na primeira renderização', async () => {
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('E o gatilho aponta para o painel que existe de fato', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel());
    });
  },
};

/**
 * Espião e recusa da `Controlled`. Ficam no MÓDULO, e não no `setup`: criados
 * lá, a play não teria como alcançá-los. O espião conta os anúncios e lê o
 * motivo; a recusa é o consumidor que responde "não" ao pedido de fechar.
 */
const controlledOpenChange = fn();
const controlledRefuseClose = ref(false);

export const Controlled: Story = {
  parameters: {
    docs: {
      // `v-model:open` e os dois botões de fora são composição nova: o estado
      // sai do componente, e nenhuma outra story do arquivo o tem.
      source: { transform: popoverControlledSource },
      description: {
        story: 'Abertura controlada por estado externo via open + @update:open.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      // `:open` + `@update:open` escritos à mão, e não `v-model:open`: o passo da
      // perda de foco precisa de um consumidor que RECUSE o fechamento, e o
      // `v-model` aceitaria sempre. Com a recusa desligada, o efeito é o mesmo
      // do `v-model` que o painel Code ensina.
      function onOpenChange(value: boolean, reason?: string): void {
        controlledOpenChange(value, reason);
        if (!value && controlledRefuseClose.value) return;
        open.value = value;
      }
      return { open, onOpenChange };
    },
    // Dois botões, e não um alternador: um alternador FORA do painel dispara a
    // dispensa por clique fora antes do próprio clique, e o par fechar+abrir
    // reabriria o painel no mesmo gesto.
    template: `
      <div class="nds-stack nds-min-h-80" data-spacing="sm" style="contain: layout">
        <div class="nds-cluster" data-spacing="md">
          <Button @click="open = true">Abrir externamente</Button>
          <Button variant="outline" @click="open = false">Fechar externamente</Button>
        </div>
        <Popover v-slot="{ close }" :open="open" @update:open="onOpenChange">
          <PopoverTrigger as-child>
            <Button variant="outline">Trigger</Button>
          </PopoverTrigger>
          ${SIMPLE_PANEL}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /^Trigger$/ });
    // Precondição do replay: uma rodada que morreu no meio do passo da recusa
    // deixaria o consumidor recusando para sempre.
    controlledRefuseClose.value = false;

    await step('O estado externo abre o painel', async () => {
      // Cada passo estabelece a própria precondição: no replay do painel
      // Interactions o DOM chega no estado que a rodada anterior deixou.
      await userEvent.click(canvas.getByRole('button', { name: /Fechar externamente/i }));
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });

      await userEvent.click(canvas.getByRole('button', { name: /Abrir externamente/i }));
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('E o estado externo fecha o painel', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Fechar externamente/i }));
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('No modo controlado, o foco levado para fora anuncia o fechamento uma vez, e o pedido seguinte também é anunciado', async () => {
      // D15 no modo CONTROLADO. Quem decide é o consumidor: a lib ANUNCIA o
      // fechamento e só fecha se o estado de fora mudar. O que se mede aqui é
      // que o anúncio não é de mão única — recusado o primeiro, a perda de foco
      // seguinte tem de ser anunciada de novo, e não engolida por um estado
      // interno que já se considera fechado.
      //
      // Espera de RELÓGIO antes de contar: um segundo anúncio atrasado não
      // apareceria na primeira tentativa de um `waitFor`.
      const outside = canvas.getByRole('button', { name: /Abrir externamente/i });
      const closeCount = () =>
        controlledOpenChange.mock.calls.filter(([isOpen]) => isOpen === false).length;

      await userEvent.click(outside);
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      controlledRefuseClose.value = true;
      try {
        within(dialog).getByRole('button', { name: /Cancelar/i }).focus();
        const closesBefore = closeCount();

        outside.focus();
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(closeCount()).toBe(closesBefore + 1);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
        // Recusado: o painel segue aberto, porque quem manda é o estado de fora.
        await expect(panel()).not.toBeNull();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');

        // A perda de foco se repete: o foco volta ao painel e sai de novo.
        within(panel()!).getByRole('button', { name: /Cancelar/i }).focus();
        outside.focus();
        await new Promise((resolve) => setTimeout(resolve, 150));
        await expect(closeCount()).toBe(closesBefore + 2);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
        await expect(panel()).not.toBeNull();
      } finally {
        controlledRefuseClose.value = false;
      }
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: aberto pelo estado externo', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Abrir externamente/i }));
      await expect(await waitForPortal('dialog', { timeout: 2000 })).toBeVisible();
    });
  },
};

/**
 * Espião do `update:open` da `Focused`. Fica no módulo, e não em `args`, porque o
 * meta deste arquivo desliga controles e ações: aqui ele só existe para a play
 * afirmar o MOTIVO do fechamento pelo Tab, que a reka não publica e o painel
 * anota. Cada passo compara a contagem antes e depois do gesto que mede.
 */
const openChangeSpy = fn();

/** Fechamentos anunciados até agora — a play compara antes e depois: a CONTAGEM, não só a última chamada. */
function focusedCloseCount(): number {
  return openChangeSpy.mock.calls.filter(([isOpen]) => isOpen === false).length;
}

export const Focused: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      // Override de story: o assunto é o foco DENTRO do painel, e o snippet do
      // meta imprime o painel fechado — sem um par de controles dentro não
      // haveria "primeiro focável" nem "último focável" para medir.
      source: { transform: popoverFocusedSource },
      description: {
        story:
          'Foco dentro do painel. Ao abrir, o foco vai ao primeiro elemento focável; o Tab caminha entre os controles internos; e sair com Tab a partir do último (ou Shift+Tab a partir do primeiro) fecha o painel e devolve o foco ao gatilho. É a mesma tecla da story Modal, no mesmo lugar, com o resultado oposto: é isso que faz cada uma medir o seu modo.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { openChangeSpy };
    },
    // Nasce FECHADA: quem abre é a play, por clique. O foco entra no painel em
    // resposta ao gesto — abrir na renderização poria o foco num painel que o
    // Storybook ainda vai reposicionar, e a medição veria a corrida em vez da
    // política. Mesma forma do vanilla, que é o modelo desta story.
    //
    // O painel é o único do arquivo sem descrição: com título e um par de
    // ações, ele tem exatamente os dois focáveis que o passo do Tab precisa.
    //
    // "Antes" e "Depois" são os VIZINHOS do gatilho, e o que dá dentes à
    // asserção de destino: sem outro focável ao lado, "o foco voltou ao
    // gatilho" podia passar por acaso da composição — numa stack, a sentinela
    // da lib dava a volta e caía no próprio gatilho. São andaime da story: o
    // snippet do painel Code não os mostra. Tamanho padrão — o `sm` reprova no
    // `target-size` do axe.
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <div class="nds-cluster" data-spacing="md">
        <Button variant="ghost">Antes</Button>
        <Popover v-slot="{ close }" @update:open="openChangeSpy">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Confirmar alteração</PopoverTitle>
            </PopoverHeader>
            <!-- Cancelar é a PEÇA de fechar (motivo close-button, desistiu);
                 Confirmar fecha por CÓDIGO, com o "close" do slot da raiz
                 (motivo api, concluiu). -->
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <PopoverClose as-child>
                <Button variant="ghost" size="sm">Cancelar</Button>
              </PopoverClose>
              <Button size="sm" @click="close()">Confirmar</Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost">Depois</Button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
    const beforeButton = canvas.getByRole('button', { name: /^Antes$/i });
    // Abre pelo gatilho só se ele estiver fechado: o painel Interactions
    // REEXECUTA a play no mesmo DOM, e a story termina aberta — um clique cego
    // fecharia o painel que o passo diz abrir.
    const openPanel = async (): Promise<HTMLElement> => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return waitForPortal('dialog');
    };
    const waitClosed = async (message: string): Promise<void> => {
      // Só LEITURA dentro do `waitFor`.
      await waitFor(() => {
        if (panel()) throw new Error(message);
      }, { timeout: 2000 });
    };

    await step('O foco entra no painel, no primeiro elemento focável', async () => {
      const dialog = await openPanel();
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('foco não entrou no painel');
      }, { timeout: 2000 });
      // O alvo EXATO, e não "algum lugar dentro do painel": `contains` é
      // verdade no modo modal e no não-modal, então não mede política nenhuma.
      await expect(within(dialog).getByRole('button', { name: /Cancelar/i })).toHaveFocus();
    });

    await step('No modo não-modal, o resto da página não é escondido', async () => {
      // O par da asserção da `Modal`: sem este passo, esconder nos DOIS modos
      // passaria lá. Relógio antes de ler, porque quem esconderia o faria depois
      // de o painel montar.
      await openPanel();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await expect(beforeButton.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('Tab caminha entre os controles internos', async () => {
      const inside = within(panel()!);
      const cancelButton = inside.getByRole('button', { name: /Cancelar/i });
      const confirmButton = inside.getByRole('button', { name: /Confirmar/i });
      cancelButton.focus();
      await userEvent.tab();
      await expect(confirmButton).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria. O passo CHEGA ao botão
      // por teclado, em vez de herdar o foco do passo anterior.
      const inside = within(await openPanel());
      const cancelButton = inside.getByRole('button', { name: /Cancelar/i });
      const confirmButton = inside.getByRole('button', { name: /Confirmar/i });
      cancelButton.focus();
      await userEvent.tab();
      await expect(confirmButton).toHaveFocus();
      await expect(confirmButton.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(confirmButton).boxShadow).not.toBe('none');
    });

    await step('Do ÚLTIMO focável, Tab fecha o painel e devolve o foco ao gatilho', async () => {
      // ─── O C3, e ele exige as TRÊS metades ──────────────────────────────
      //
      // Este é o par da asserção da story Modal, e é o que dá dentes às duas: a
      // MESMA tecla, no MESMO lugar, com resultado oposto conforme o modo. Aqui,
      // sem `modal`, o painel fecha e o foco vai ao gatilho; lá, com `modal`, o
      // foco volta ao primeiro controle.
      //
      // Decisão de 2026-09-17: o DESTINO é o gatilho. Afirmar só "o foco saiu do
      // painel" passava com o foco em qualquer lugar — inclusive no `body`, que
      // é para onde ele ia sem o `preventDefault` do `PopoverContent.vue`. Os
      // vizinhos são o que dá dentes ao destino, e o espião diz que fechou UMA
      // vez, como `overlay`.
      const p = await openPanel();
      const confirmButton = within(p).getByRole('button', { name: /Confirmar/i });
      confirmButton.focus();
      await expect(confirmButton).toHaveFocus();
      const closesBefore = focusedCloseCount();

      await userEvent.tab();

      await waitClosed('o painel continuou aberto depois do Tab para fora');
      // Leitura pura dentro do `waitFor`: quem move o foco é o `closeAutoFocus`
      // da lib, no desmonte do painel, e não há como sincronizar com ele antes.
      await waitFor(() => expect(trigger).toHaveFocus(), { timeout: 2000 });
      // Relógio antes de contar: o foco devolvido ao gatilho não pode somar um
      // segundo fechamento pela perda de foco (D15).
      await new Promise((resolve) => setTimeout(resolve, 150));
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveFocus();
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(openChangeSpy).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Do PRIMEIRO focável, Shift+Tab fecha o painel e devolve o foco ao gatilho', async () => {
      // O outro sentido do mesmo contrato, com asserção própria: um corte que só
      // olhasse o `Tab` para a frente passaria no passo acima e reprovaria aqui.
      const p = await openPanel();
      const cancelButton = within(p).getByRole('button', { name: /Cancelar/i });
      cancelButton.focus();
      await expect(cancelButton).toHaveFocus();
      const closesBefore = focusedCloseCount();

      await userEvent.tab({ shift: true });

      await waitClosed('o painel continuou aberto depois do Shift+Tab para fora');
      await waitFor(() => expect(trigger).toHaveFocus(), { timeout: 2000 });
      await new Promise((resolve) => setTimeout(resolve, 150));
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveFocus();
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(openChangeSpy).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o painel aberto, o foco levado por código para "Antes" fecha o painel e fica em "Antes"', async () => {
      // D15, decisão da dona de 2026-09-17: o painel não-modal fica aberto só
      // enquanto o foco está nele. `focus()`, e não clique — clicar em "Antes"
      // é clique fora, que fecha pelo ponteiro; aqui o único caminho é o foco.
      // E o destino é de quem moveu: o foco NÃO volta ao gatilho.
      //
      // Nesta stack quem fecha é a reka: o `DismissableLayer` emite
      // `focus-outside`, que o `PopoverContent.vue` anota como `overlay`. E quem
      // poderia devolver o foco ao gatilho é o `closeAutoFocus` do
      // `PopoverContentNonModal` — ver o comentário no `PopoverContent.vue`.
      await openPanel();
      const closesBefore = focusedCloseCount();
      beforeButton.focus();
      await waitClosed('o painel continuou aberto depois de o foco sair');
      // Espera de RELÓGIO antes de contar e de ler o foco: um segundo fechamento
      // atrasado, ou um foco devolvido no desmonte, não apareceria na primeira
      // tentativa de um `waitFor`.
      await new Promise((resolve) => setTimeout(resolve, 150));
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(beforeButton);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(openChangeSpy).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o painel aberto, clicar em "Antes" fecha o painel uma vez só', async () => {
      // O clique fora num elemento FOCÁVEL aciona os DOIS caminhos de dispensa
      // no mesmo gesto: o ponteiro (`pointerdown` fora) e o foco (`focusin` em
      // "Antes"). A Playground clica num `<p>`, que não recebe foco, e por isso
      // nunca exercitou a soma. Na reka, `PopoverContentNonModal.js:140`
      // previne o `focusin` que chega depois de um `pointerdown` fora — e é
      // esta contagem que diz se isso segue verdade.
      await openPanel();
      const closesBefore = focusedCloseCount();
      await userEvent.click(beforeButton);
      await waitClosed('o painel continuou aberto depois do clique em "Antes"');
      await new Promise((resolve) => setTimeout(resolve, 150));
      await expect(panel()).toBeNull();
      await expect(document.activeElement).toBe(beforeButton);
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(openChangeSpy).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('Com o foco dentro do painel, clicar no gatilho fecha uma vez só', async () => {
      // O gatilho conta como parte do painel: o clique o foca antes do `click`
      // chegar, e se ele contasse como "fora" o painel fecharia pelo foco e o
      // clique o alternaria de novo — ou anunciaria dois fechamentos. O motivo
      // do clique no gatilho é `overlay` (§9 do PRD).
      const p = await openPanel();
      const cancelButton = within(p).getByRole('button', { name: /Cancelar/i });
      cancelButton.focus();
      await expect(cancelButton).toHaveFocus();
      const closesBefore = focusedCloseCount();
      // Clique com PAUSA entre apertar e soltar, e não `userEvent.click`: no
      // clique sintético o `click` chega antes da dispensa por foco da lib, que
      // roda dois tiques depois do `focusin` (`DismissableLayer/utils.js:97-98`).
      // Com a pausa a ordem é a humana: a perda de foco chega primeiro, e o
      // defeito aparece como painel reaberto.
      //
      // As duas metades na MESMA instância de `userEvent.setup()`: é ela que
      // guarda o botão apertado. Com o `userEvent` avulso, duas chamadas não
      // emitem `click` nenhum.
      const user = userEvent.setup();
      await user.pointer({ keys: '[MouseLeft>]', target: trigger });
      await new Promise((resolve) => setTimeout(resolve, 150));
      await user.pointer({ keys: '[/MouseLeft]', target: trigger });
      await waitClosed('o painel continuou aberto depois do clique no gatilho');
      await new Promise((resolve) => setTimeout(resolve, 150));
      await expect(panel()).toBeNull();
      await expect(focusedCloseCount()).toBe(closesBefore + 1);
      await expect(openChangeSpy).toHaveBeenLastCalledWith(false, 'overlay');
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await openPanel()).toBeVisible();
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      // `modal` é a prop que a story existe para mostrar, e ela vive na RAIZ —
      // não no painel, onde ficam `side` e `align`.
      source: { transform: popoverModalSource },
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava, o painel se anuncia como diálogo modal e o resto da página fica escondido do leitor de tela. As quatro coisas andam juntas: anunciar que o resto da página está inerte sem prender o foco nem escondê-lo engana quem navega por leitor de tela.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <Popover :default-open="true" :modal="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir modal</Button>
          </PopoverTrigger>
          ${MODAL_PANEL}
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O painel abre em modo modal', async () => {
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('O painel anuncia aria-modal', async () => {
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(panel()!).toHaveAttribute('aria-modal', 'true');
    });

    await step('E a rolagem da página fica TRAVADA — a terceira das três (C8)', async () => {
      // A D2 promete quatro coisas juntas no modo modal: foco preso, rolagem
      // travada, `aria-modal` e — desde 2026-09-17 — o resto da página
      // escondido do leitor de tela (passo próprio, mais abaixo). Até a trava
      // ganhar este passo a story media duas das três de então, e ela não tinha
      // asserção em stack NENHUMA das cinco.
      //
      // Quem trava é a lib: `PopoverContentModal` chama `useBodyScrollLock(true)`,
      // que escreve `overflow: hidden` no `<body>`. Por isso a asserção lê o
      // `<body>`, e não o painel: o painel rolar ou não é outro assunto.
      await expect(getComputedStyle(document.body).overflow).toBe('hidden');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // A versão anterior deste passo provava a prisão com
      // `dialog.contains(document.activeElement)` SEM tabular. Aquilo é
      // verdadeiro no modo não-modal também — o foco entrar no painel é o
      // contrato `functional.item1`, cumprido pelas cinco stacks —, então a
      // asserção não podia reprovar: é a forma exata da asserção que guarda o
      // bug.
      //
      // O controle negativo de verdade é este: partir do ÚLTIMO focável e
      // apertar Tab. Não-modal, o foco SAI do painel e esta asserção reprova;
      // modal, ele volta ao primeiro.
      //
      // ─── E até 2026-09-17 isso era FALSO nesta stack ─────────────────────
      //
      // O comentário acima descrevia um controle negativo que esta stack não
      // tinha: o `PopoverContentImpl` da reka passa `loop` CRAVADO ao
      // `FocusScope`, e o handler dele (`FocusScope.js:141-159`) roda com ou sem
      // trap — a porteira de `:142` só desiste quando NEM `loop` NEM `trapped`,
      // e `loop` é sempre verdadeiro. O foco dava a volta nos DOIS modos, então
      // este passo passava nos dois: asserção que não pode reprovar.
      //
      // Agora ele pode. O `PopoverContent.vue` intercepta o `Tab` de saída na
      // fase de captura e tira o laço do caminho — mas SÓ fora do modo modal.
      // Aqui, com `modal`, a interceptação nem começa e quem prende o foco
      // continua sendo o laço da lib. A outra metade do par está na story
      // `Focused`, onde o mesmo Tab sai do painel e o fecha.
      const dialog = panel()!;
      const inside = within(dialog);
      const firstBox = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const lastBox = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      lastBox.focus();
      await expect(lastBox).toHaveFocus();

      await userEvent.tab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(firstBox).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const dialog = panel()!;
      const inside = within(dialog);
      const firstBox = inside.getByRole('checkbox', { name: /Lembrar minha escolha/i });
      const lastBox = inside.getByRole('checkbox', { name: /Receber aviso por e-mail/i });

      firstBox.focus();
      await userEvent.tab({ shift: true });

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(lastBox).toHaveFocus();
    });

    await step('Fechado, a rolagem é DEVOLVIDA à página', async () => {
      // A outra metade do C8, e é ela que dá dentes à primeira: um `overflow`
      // que ficasse `hidden` para sempre passaria na asserção de cima e deixaria
      // a página travada depois que o painel sumisse. Sem peça de fechar neste
      // painel de propósito (ver MODAL_PANEL), o Escape é a saída.
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(getComputedStyle(document.body).overflow).not.toBe('hidden');
    });

    await step('Com o painel modal aberto, o resto da página fica escondido do leitor de tela, e volta ao fechar', async () => {
      // Decisão de 2026-09-17, igual nas cinco: modo modal esconde o resto da
      // página por `aria-hidden`, SEMPRE — a `Modal` não tem peça de fechar de
      // propósito (D2), e é justamente o caso em que duas libs não escondiam.
      //
      // Dois elementos de fora, com papéis diferentes:
      //  - o GATILHO, sem atributo: fica escondido por um ancestral dele;
      //  - um `<div>` de andaime, filho direto do `<body>` e já com
      //    `aria-hidden="false"`. Direto no `<body>` porque é ali que o algoritmo
      //    escreve: marcado mais fundo, ninguém o tocaria e a restauração
      //    passaria sem medir nada. É o que dá dentes à restauração EXATA — a
      //    lib desta stack apaga o `"false"` ao desfazer (ver
      //    `popover-aria-hidden-restore.ts`).
      const trigger = canvas.getByRole('button', { name: /Abrir modal/i });
      const hiddenAncestor = (el: Element): Element | null => el.closest('[aria-hidden="true"]');
      const marked = document.createElement('div');
      marked.setAttribute('aria-hidden', 'false');
      document.body.appendChild(marked);
      try {
        const triggerBefore = trigger.getAttribute('aria-hidden');
        await expect(hiddenAncestor(trigger)).toBeNull();

        await userEvent.click(trigger);
        const dialog = await waitForPortal('dialog');
        // Só LEITURA dentro do `waitFor`: a lib esconde depois de o painel montar.
        await waitFor(() => {
          if (!hiddenAncestor(trigger)) throw new Error('o gatilho, fora do painel, não ficou escondido');
        }, { timeout: 2000 });
        await expect(hiddenAncestor(dialog)).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
        await waitFor(() => {
          if (marked.getAttribute('aria-hidden') !== 'false') {
            throw new Error(`o elemento marcado voltou com aria-hidden=${String(marked.getAttribute('aria-hidden'))}`);
          }
        }, { timeout: 2000 });
        await expect(trigger.getAttribute('aria-hidden')).toBe(triggerBefore);
        await expect(hiddenAncestor(trigger)).toBeNull();
        await expect(marked).toHaveAttribute('aria-hidden', 'false');
      } finally {
        marked.remove();
      }
    });

    await step('Uma região viva fora do painel continua anunciando com o modal aberto', async () => {
      // A especificação do item 7 dizia "todo elemento fora do painel", e estava
      // INCOMPLETA: região viva escondida é o toast que anuncia "salvo" ficando
      // mudo enquanto o painel está aberto. Esta stack já fazia certo — foi a
      // medição dela que corrigiu a especificação —, e certo sem asserção é
      // certo até a próxima refatoração. Este passo é o portão.
      //
      // Quem esconde aqui é a LIB: `useHideOthers` da reka aplica o `hideOthers`
      // do pacote `aria-hidden` 1.2.6, e é o pacote que pula a região viva —
      // `dist/es2015/index.js:133` empurra `querySelectorAll('[aria-live],
      // script')` para dentro da lista de alvos preservados, junto com o painel.
      // A exceção não é nossa, então o portão guarda uma dependência: se a lib
      // deixar de pular, este passo reprova em vez de a página emudecer calada.
      //
      // Os dois andaimes são filhos diretos do `<body>` porque é ali que o
      // algoritmo escreve, e o CONTRASTE entre eles é o que dá sentido à
      // asserção: sem o irmão comum, um algoritmo que não escondesse nada
      // passaria neste passo com louvor.
      //
      // ─── DIVERGÊNCIA MEDIDA, e ela é da lib ────────────────────────────────
      //
      // Medido em 2026-09-17 com uma sonda de sete elementos: a exceção é por
      // ATRIBUTO, não por papel. Pulados: `[aria-live]` (qualquer valor) e
      // `<script>`. Escondidos: `role="status"`, `"alert"`, `"log"`,
      // `"progressbar"`, `"marquee"` e `"timer"` SEM `aria-live` explícito — e os
      // dois primeiros têm `aria-live` implícito pela ARIA, então um `role="alert"`
      // de fora emudece com o painel aberto. A lista é menor que a das outras
      // stacks, que pulam os seis papéis; aqui quem escolhe é o pacote
      // `aria-hidden`, e aumentar a lista é mudar a lib, não a story. Fica
      // REGISTRADO, e o andaime deste passo usa `aria-live` explícito de propósito
      // — é o que a lib de fato garante.
      const trigger = canvas.getByRole('button', { name: /Abrir modal/i });
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.textContent = 'Alterações salvas.';
      const plainSibling = document.createElement('div');
      plainSibling.textContent = 'Texto comum fora do painel.';
      document.body.append(liveRegion, plainSibling);
      const isHidden = (el: Element): boolean => el.getAttribute('aria-hidden') === 'true';
      const hiddenAncestorOf = (el: Element): Element | null =>
        el.parentElement?.closest('[aria-hidden="true"]') ?? null;
      try {
        await userEvent.click(trigger);
        const dialog = await waitForPortal('dialog');

        // Só LEITURA dentro do `waitFor`: a lib esconde depois de o painel montar.
        await waitFor(() => {
          if (!isHidden(plainSibling)) {
            throw new Error('o elemento comum fora do painel não ficou escondido');
          }
        }, { timeout: 2000 });

        // A região viva não foi escondida — nem ela, nem nenhum ancestral dela.
        // As duas asserções levam MENSAGEM porque a `Modal` tem outro passo que
        // mede `aria-hidden` logo acima: sem ela, o relato de falha das duas é
        // indistinguível, e portão que não se identifica custa uma investigação.
        await expect(
          isHidden(liveRegion),
          'a região viva fora do painel foi escondida com o modal aberto',
        ).toBe(false);
        await expect(
          hiddenAncestorOf(liveRegion),
          'um ancestral da região viva fora do painel foi escondido com o modal aberto',
        ).toBeNull();
        await expect(hiddenAncestorOf(dialog)).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
        // Nada sobrou: o irmão comum volta SEM atributo, que é como chegou.
        await waitFor(() => {
          if (plainSibling.hasAttribute('aria-hidden')) {
            throw new Error('o elemento comum continuou escondido depois de fechar');
          }
        }, { timeout: 2000 });
        await expect(liveRegion.hasAttribute('aria-hidden')).toBe(false);
      } finally {
        liveRegion.remove();
        plainSibling.remove();
      }
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa, e é o
    // estado em que o próximo replay encontra a story.
    await step('Estado final: painel aberto de novo', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Abrir modal/i }));
      await expect(await waitForPortal('dialog')).toBeVisible();
    });
  },
};
