import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import PopoverDocs from '@/components/docs/PopoverDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { panel } from './popover.fixtures';
import { popoverSource } from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/Popover',
  component: PopoverStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(PopoverDocs),
      // Cascateia para todas as stories do arquivo, e monta a composição a
      // partir dos `args` de cada uma.
      source: { transform: popoverSource },
      description: {
        component:
          'Overlay flutuante ativado por clique, com auto-flip por colisão, role=dialog e foco gerenciado. O painel sempre tem nome acessível: título visível, ou aria-label quando o conteúdo é livre.',
      },
    },
  },
  // O docgen está desligado neste stack: `argTypes` é a ÚNICA fonte da aba
  // API Reference, e arg sem entrada aqui fica invisível para quem consome.
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido do Content em relação ao trigger.',
      table: { type: { summary: '"top" | "bottom" | "left" | "right"' }, defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do Content ao longo do eixo do side.',
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
    sideOffset: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Distância em pixels entre trigger e Content.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    alignOffset: {
      control: { type: 'number', step: 1 },
      description: 'Deslocamento em pixels ao longo do eixo do alinhamento.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto exibido no trigger. Verbo e objeto — nunca "Clique aqui".',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Abrir popover' } },
    },
    title: {
      control: 'text',
      description: 'Título do painel. Vira o nome acessível do diálogo.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Descrição abaixo do título, ligada por aria-describedby.',
      table: { type: { summary: 'string' } },
    },
    saveLabel: {
      control: 'text',
      description: 'Texto do botão de confirmação da demonstração.',
      table: { type: { summary: 'string' } },
    },
    cancelLabel: {
      control: 'text',
      description: 'Texto do botão que fecha o painel por dentro.',
      table: { type: { summary: 'string' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'withTitle', 'form', 'tableFilter', 'colorPicker', 'quickSettings'],
      description: 'Composição interna usada na demonstração.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"default"' } },
    },
    onAction: {
      control: false,
      description: 'Callback do botão de confirmação.',
      table: { type: { summary: '() => void' } },
    },
    onOpenChange: {
      control: false,
      description: 'Callback de mudança de estado. No fechamento, recebe o motivo: escape, overlay, close-button ou api.',
      table: { type: { summary: '(open: boolean, reason?: PopoverCloseReason) => void' } },
    },
    onCancel: {
      control: false,
      description: 'Callback do botão que fecha o painel por dentro.',
      table: { type: { summary: '() => void' } },
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    sideOffset: 4,
    alignOffset: 0,
    defaultOpen: false,
    triggerLabel: 'Abrir popover',
    title: 'Configurações de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
    variant: 'withTitle',
    onAction: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    // Declarada na PRÓPRIA story, e não herdada do meta. Aqui ela é a mesma
    // transform do meta de propósito: o Playground é a única story cujo snippet
    // acompanha os controls, e é para ele que a forma com `ctx.args` existe.
    docs: { source: { transform: popoverSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item4',
    ],
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    const closed = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('popover still open');
          }
        },
        { timeout: 2000 }
      );
    };

    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog');
    };

    const close = async () => {
      if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(trigger);
      await closed();
    };

    await step('1. O gatilho anuncia que abre um diálogo', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'popover-trigger');
    });

    await step('2. Clicar no gatilho abre o painel com role=dialog', async () => {
      await close();
      const p = await open();
      await expect(p).toBeVisible();
      await expect(p).toHaveClass(/nds-popover-content/);
      await expect(p).toHaveAccessibleName(/Configurações de exibição/i);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('3. O painel é nomeado pelo título e descrito pela descrição', async () => {
      // D12: `labelledby` NOMEIA, `describedby` DESCREVE — os dois no mesmo
      // elemento não são ambiguidade.
      const p = panel()!;
      const idTitle = p.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();
      await expect(document.getElementById(idTitle!)).toHaveAttribute('data-slot', 'popover-title');
      const idDescription = p.getAttribute('aria-describedby');
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveAttribute(
        'data-slot', 'popover-description',
      );
    });

    await step('4. O painel não é modal', async () => {
      // Popover não bloqueia o resto da página: `aria-modal` faria o leitor de
      // tela esconder tudo o que está fora dele, que é contrato de Dialog.
      await expect(panel()).not.toHaveAttribute('aria-modal');
    });

    await step('5. Ao abrir, o foco vai ao PRIMEIRO focável do painel', async () => {
      // É o que separa popover de tooltip: o conteúdo é interativo, então o foco
      // precisa alcançá-lo sem caçar com Tab pela página inteira.
      //
      // E o alvo é EXATO, não "algum lugar dentro do painel": `contains` passava
      // com qualquer elemento focado, e é este passo que dá dentes ao seguinte —
      // sem ele, "o foco está dentro" passaria com ou sem `data-autofocus`. Aqui
      // o primeiro focável é o Cancelar do rodapé.
      await waitFor(() => {
        if (!panel()!.contains(document.activeElement)) {
          throw new Error('foco não entrou no painel');
        }
      });
      await expect(
        within(panel()!).getByRole('button', { name: args.cancelLabel as string }),
      ).toHaveFocus();
    });

    await step('6. E `data-autofocus` VENCE o primeiro focável, mesmo com tabindex=-1', async () => {
      // A outra metade de `accessibility.item4`, que o `covers` desta story
      // reivindica desde que o conteúdo passou a nomear o atributo.
      //
      // O alvo marcado é o TÍTULO, com `tabindex="-1"`: não é o primeiro
      // focável (nem sequer tabulável), então a asserção só passa se a marca for
      // lida — e lida SEM o filtro de `FOCUSABLE`, que exclui `tabindex="-1"` de
      // propósito. Uma implementação que passasse a marca pela lista de
      // focáveis cairia no Cancelar e reprovaria aqui.
      //
      // A marca é posta QUANDO o painel monta, e não no painel aberto antes de
      // fechar: o conteúdo é renderizado de novo a cada abertura, e um atributo
      // escrito no nó anterior some com ele. O observador escreve antes de a
      // política de foco rodar — ela espera um `requestAnimationFrame`, e a
      // notificação de mutação é microtarefa.
      await close();
      const marked: HTMLElement[] = [];
      // TODOS os títulos de painel, e não só o de `panel()`: um painel ainda em
      // saída pode continuar no DOM, e a primeira ocorrência seria ele.
      const mark = () => {
        const titles = document.querySelectorAll<HTMLElement>(
          '[data-slot="popover-content"] [data-slot="popover-title"]:not([data-autofocus])',
        );
        for (const title of titles) {
          title.setAttribute('tabindex', '-1');
          title.setAttribute('data-autofocus', '');
          marked.push(title);
        }
      };
      const observer = new MutationObserver(mark);
      let openPanel: HTMLElement | null = null;
      try {
        // `data-slot` também: onde ele é escrito por binding, pode chegar depois
        // da inserção do nó, e a marca procura por ele.
        //
        // E `data-state`, que é o que faltava. MEDIDO em 2026-09-17: este passo
        // reprovava em 3 de 4 rodadas com `marked=0` — o observador não era
        // chamado NENHUMA vez. O `closed()` deste arquivo aceita o painel ainda
        // no DOM com `data-state="closed"` (é o que ele mede), então quando o
        // `open()` cai dentro da animação de saída o bits REUSA o nó: não há
        // inserção nem `data-slot` novo, só `data-state` virando `open`. Sem ele
        // no filtro, a marca nunca era escrita e a asserção lia o título cru.
        // Com ele, a reabertura por reuso também dispara a marca — e antes da
        // política de foco, que espera um `requestAnimationFrame`.
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-slot', 'data-state'],
        });
        openPanel = await open();
        const title = openPanel.querySelector<HTMLElement>('[data-slot="popover-title"]')!;
        await expect(title).toHaveAttribute('data-autofocus');
        await waitFor(() => expect(title).toHaveFocus());
      } finally {
        observer.disconnect();
        // O foco sai do título ANTES de a marca sair: tirar o `tabindex` de um
        // elemento focado joga o foco no `body`, e o passo seguinte partiria de
        // um foco sem dono. O estado final é o do passo anterior — aberto, foco no
        // Cancelar —, e o replay do painel Interactions parte dele.
        if (openPanel?.isConnected) within(openPanel).queryByRole('button', { name: args.cancelLabel as string })?.focus();
        for (const el of marked) {
          el.removeAttribute('data-autofocus');
          el.removeAttribute('tabindex');
        }
      }
    });

    await step('7. Escape fecha o popover e retorna foco ao trigger', async () => {
      await open();
      await userEvent.keyboard('{Escape}');
      await closed();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('focus did not return to trigger');
        }
      });
      // O bits-ui não publica o motivo em `onOpenChange`: o painel o ANOTA e a
      // raiz o entrega junto. É isto que prova o caminho inteiro.
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'escape');
    });

    await step('8. Clicar fora fecha o painel', async () => {
      await open();
      // O clique de fora é REEMITIDO até a dispensa acontecer. A camada de
      // dispensa da lib só passa a escutar `pointerdown` um tick depois de o
      // painel montar (`afterSleep(1)` + `debounce(10)` na fonte), e o
      // `waitForPortal` pode retornar dentro dessa janela — um clique único
      // caía no vazio em ~1 de 3 execuções, sem erro nenhum. Reemitir mede o
      // COMPORTAMENTO ("clicar fora fecha") sem depender do instante do clique.
      //
      // A reemissão é de RELÓGIO, não de `waitFor`: o clique MEXE no DOM, e
      // condição que muta dentro do `waitFor` se reagenda sozinha pelo
      // observador de mutação — o prazo não chega, o núcleo trava e a aba
      // morre sem reportar, levando o arquivo inteiro junto.
      const dismissDeadline = Date.now() + 3000;
      while (body.queryByRole('dialog') && Date.now() < dismissDeadline) {
        await userEvent.click(canvas.getByTestId('area-externa'));
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
      }
      await expect(body.queryByRole('dialog')).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'overlay');
    });

    await step('9. Cancelar (PopoverClose) fecha o painel por dentro', async () => {
      await open();
      const cancelar = body.getByRole('button', { name: args.cancelLabel as string });
      await expect(cancelar).toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(cancelar);
      await closed();
      await expect(args.onCancel).toHaveBeenCalled();
      // A única stack com a peça de fechar E sem motivo vindo da lib — então é
      // a única onde `close-button` depende da ORDEM entre o nosso handler e o
      // fechamento interno. Esta asserção é quem mede a ordem.
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'close-button');
    });

    await step('10. Salvar fecha por CÓDIGO, e o motivo é api', async () => {
      // O contraste com o passo 8 é o ponto inteiro: os dois botões fecham, e é
      // o CAMINHO que separa "desistiu" de "concluiu" no relatório. Salvar não
      // é `PopoverClose` — dentro dele, "concluiu" chegaria ao GA4 como
      // "apertou o botão de fechar", apagando o sinal que justifica o campo.
      await open();
      const save = body.getByRole('button', { name: args.saveLabel as string });
      await expect(save).not.toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(save);
      await closed();
      await expect(args.onAction).toHaveBeenCalled();
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('11. Estado final: painel aberto', async () => {
      await expect(await open()).toBeVisible();
    });
  },
};
