import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen, fn } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { popoverPlaygroundSource, type PopoverArgs } from './popover.source';
import { close, open, panel } from './popover.fixtures';
import { NdsButton } from './button';
import { NdsPopoverDocs } from '@/components/docs/PopoverDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta<PopoverArgs> = {
  title: 'Components/Overlay/Popover',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_POPOVER, NdsButton] })],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsPopoverDocs) },
  },
  argTypes: {
    side: {
      control: 'radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Lado preferido em relação ao gatilho. Vira o oposto quando não há espaço.',
    },
    align: {
      control: 'radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento ao longo do eixo do side.',
    },
    sideOffset: {
      control: { type: 'number', min: 0, max: 24, step: 1 },
      description: 'Distância em pixels entre o gatilho e o painel.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Verbo e objeto — nunca "Clique aqui".',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a função
    // em `props` e o `(openChange)` do template fica ligado a nada — sem erro
    // nenhum (armadilha 5 do CLAUDE.md deste stack).
    onOpenChange: {
      control: false,
      description: 'Emitido a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    sideOffset: 4,
    defaultOpen: false,
    triggerLabel: 'Abrir popover',
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<PopoverArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: popoverPlaygroundSource } },
    // `accessibility.item1` (axe no estado ABERTO) e `accessibility.item2`
    // (contraste) não são declarados aqui: quem os declara é `States/Open`.
    // O mesmo vale no vanilla e no vue — medido em 2026-09-17, o `covers` do
    // Playground das três traz exatamente estes quatro itens, e nenhuma das três
    // declara aqueles dois no Playground.
    //
    // **Até 2026-09-17 esta nota justificava a ausência dizendo que "a play
    // desta story termina com o painel FECHADO".** Ela termina ABERTA, e o passo
    // final desta mesma play diz isso com todas as letras — duas afirmações
    // opostas no mesmo arquivo, a 275 linhas uma da outra. A errada era esta, e
    // o motivo verdadeiro nunca foi o estado final: é não declarar o mesmo item
    // de contrato em dois lugares.
    //
    // `functional.item3` (clique fora dispensa) VOLTOU para cá em 2026-09-16:
    // ele é declarado pela `Playground` das outras quatro, e aqui morava só na
    // `States/Controlled` — o mesmo item continua declarado lá, como no vanilla,
    // porque as duas o provam. E `accessibility.item5` (Escape fecha e devolve o
    // foco) SAIU: quem o declara nas outras quatro é `Variants/WithTitle`, que
    // aqui também já o declara. O passo do Escape continua nesta play; declarar
    // o item em dois lugares é que era a divergência.
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item4',
    ],
  },
  render: (args) => ({
    // Painel CONTROLADO, com o estado semeado pelo control `defaultOpen`. É o
    // que permite ao "Salvar" fechar por CÓDIGO: o `ndsPopoverClose` fecha com
    // `close-press`, que chega ao relatório como `close-button` — o motivo de
    // quem DESISTIU. Quem conclui fecha escrevendo no estado, e aí o motivo é
    // `api`. Ver `popover-close-reason.ts` para o mapa inteiro.
    props: { ...args, isOpen: Boolean(args.defaultOpen) },
    // O QUADRO da story, como nas outras quatro stacks: `contain: layout` isola
    // a medição de geometria do resto da página, e a altura mínima sai da escada
    // de utilitárias — cravada em `style` inline ela venceria a folha e sairia do
    // tema e da densidade junto. Importa aqui porque o passo de posicionamento
    // abaixo MEDE o espaço livre no eixo pedido antes de exigir o lado exato.
    template: `
      <div
        class="nds-stack nds-w-full nds-min-h-90"
        data-spacing="md"
        data-align="center"
        style="contain: layout"
      >
        <div ndsPopover [open]="isOpen" (openChange)="isOpen = $event; onOpenChange($event)">
          <button ndsPopoverTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

          <ng-template
            ndsPopoverContent
            [side]="side"
            [align]="align"
            [sideOffset]="sideOffset"
          >
            <div ndsPopoverHeader>
              <h2 ndsPopoverTitle>Configurações de exibição</h2>
              <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
            </div>

            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <!-- Cancelar é a PEÇA DE FECHAR: sai sem decidir nada, e o motivo
                   chega como close-button. -->
              <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
              <!-- Salvar fecha por CÓDIGO, depois de salvar: o motivo é api, e é
                   ele que separa "concluiu" de "desistiu" no relatório. -->
              <button ndsButton size="sm" (click)="isOpen = false; onOpenChange(false)">
                Salvar
              </button>
            </div>
          </ng-template>
        </div>

        <!-- Alvo inerte para a dispensa por clique fora: clicar no body depende
             da geometria da página e do ponto exato do clique sintético, e este
             é o gesto real que prova functional.item3. -->
        <p class="nds-text-body nds-text-muted-foreground" data-testid="area-externa">
          Área externa
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="popover"]')!;
    const trigger = canvas.getByRole('button', { name: args.triggerLabel });

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(root.tagName).toBe('DIV');
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger).toHaveAttribute('data-slot', 'popover-trigger');
      // O gatilho ANUNCIA que abre um diálogo — é o que separa o popover de um
      // botão comum para quem usa leitor de tela.
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('type', 'button');
    });

    await step('O estado inicial vem do input', async () => {
      // Esta é a asserção que prova o binding de input: sob JIT o componente
      // renderiza no default e `aria-expanded` viria sempre "false" com o
      // control em true (armadilha 1 do CLAUDE.md deste stack). Aqui quem
      // carrega o valor é o `[open]` controlado, semeado pelo control; o
      // `defaultOpen` do componente é provado por `States/Modal`.
      await expect(trigger.getAttribute('aria-expanded')).toBe(String(args.defaultOpen));
      await expect(trigger).toHaveAttribute('data-state', args.defaultOpen ? 'open' : 'closed');
    });

    await step('Clicar no gatilho abre o painel com role=dialog', async () => {
      await close(trigger);
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await open(trigger);

      const dialogo = screen.getByRole('dialog');
      await expect(dialogo).toBeVisible();
      await expect(dialogo).toHaveClass(/nds-popover-content/);
      await expect(dialogo).toHaveAttribute('data-state', 'open');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step('side e align do template chegam ao posicionamento', async () => {
      // ─── A asserção que NÃO podia reprovar ───────────────────────────────
      //
      // Até 2026-09-16 este passo aceitava `[lado, oposto]` — o lado pedido OU o
      // do outro extremo do mesmo eixo —, e então passava com ou sem
      // posicionamento correto. Com `align` o caso degenerava de vez: o oposto
      // de `center` é `center`, ou seja, a lista tinha um valor só e casava
      // sempre. É a forma que a D0 declarou eliminada das cinco `SideTop`, e ela
      // tinha sobrevivido aqui.
      //
      // O lado exato só pode ser exigido quando há ESPAÇO no eixo pedido —
      // espaço no eixo errado não compra folga nenhuma, porque o auto-flip vira
      // dentro do eixo. Então a precondição é MEDIDA, e o quadro da story é quem
      // a garante; se ele encolher, reprova aqui, com nome, em vez de a asserção
      // de lado passar a medir o tamanho da janela.
      const dialogo = screen.getByRole('dialog');
      const rg = trigger.getBoundingClientRect();
      const rp = dialogo.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;

      const espacoLivre = {
        top: rg.top,
        bottom: vh - rg.bottom,
        left: rg.left,
        right: vw - rg.right,
      }[args.side];
      const espacoPedido =
        (args.side === 'top' || args.side === 'bottom' ? rp.height : rp.width) + args.sideOffset;

      await expect(
        espacoLivre,
        `sem espaço no eixo "${args.side}", o painel vira sozinho e a asserção de lado ` +
          'passaria a medir o quadro da story em vez do posicionamento',
      ).toBeGreaterThan(espacoPedido);

      // Com espaço no eixo pedido, o flip não tem por que acontecer: o lado é
      // EXATO. Se o input não tivesse chegado, o painel cairia no padrão
      // `bottom`/`center` e um control em `left`/`start` reprovaria aqui.
      await expect(dialogo).toHaveAttribute('data-side', args.side);
      await expect(dialogo).toHaveAttribute('data-align', args.align);

      // E a geometria acompanha o atributo — `data-side` sozinho é markup, e
      // markup pode mentir sobre onde o painel foi parar. O vão medido é o
      // `sideOffset` pedido, com 1px de folga para o arredondamento sub-pixel
      // do floating-ui.
      const vao = {
        top: rg.top - rp.bottom,
        bottom: rp.top - rg.bottom,
        left: rg.left - rp.right,
        right: rp.left - rg.right,
      }[args.side];
      await expect(Math.abs(vao - args.sideOffset)).toBeLessThanOrEqual(1);
    });

    await step('O painel é nomeado pelo título e descrito pela descrição', async () => {
      const dialogo = screen.getByRole('dialog');
      const idTitle = dialogo.getAttribute('aria-labelledby');
      const idDescription = dialogo.getAttribute('aria-describedby');
      await expect(idTitle).toBeTruthy();
      await expect(document.getElementById(idTitle!)).toHaveAttribute(
        'data-slot', 'popover-title',
      );
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveAttribute(
        'data-slot', 'popover-description',
      );
      // Com título não existe `aria-label`: dois contratos de nome no mesmo
      // elemento é ambiguidade, não redundância.
      await expect(dialogo).not.toHaveAttribute('aria-label');
    });

    await step('Aberto, aria-controls aponta para o id real do painel', async () => {
      // O primitivo só escreve `aria-controls` enquanto o painel existe: com o
      // painel desmontado o atributo apontaria para um id ausente e o axe
      // reprovaria por aria-valid-attr-value.
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel());
    });

    await step('O painel não é modal', async () => {
      // Popover não bloqueia o resto da página: `aria-modal` faria o leitor de
      // tela esconder tudo o que está fora dele, que é contrato de Dialog.
      await expect(panel()).not.toHaveAttribute('aria-modal');
    });

    await step('Ao abrir, o foco vai ao PRIMEIRO focável do painel', async () => {
      // É o que separa popover de tooltip: o conteúdo é interativo, então o
      // foco precisa alcançá-lo sem caçar com Tab pela página inteira.
      await waitFor(async () => {
        await expect(panel()!.contains(document.activeElement)).toBe(true);
      });
      // No PRIMEIRO focável, e não num qualquer: é o que a tabela de estados
      // promete e o que evita uma varredura por Tab dentro do painel. E é este
      // passo que dá dentes ao seguinte — sem o alvo EXATO, "o foco está dentro"
      // passaria com ou sem `data-autofocus`.
      await expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    });

    await step('E `data-autofocus` VENCE o primeiro focável, mesmo com tabindex=-1', async () => {
      // A outra metade de `accessibility.item4`, que o `covers` desta story
      // reivindica desde que o conteúdo passou a nomear o atributo.
      //
      // O alvo marcado é o TÍTULO, com `tabindex="-1"`: não é o primeiro
      // focável (nem sequer tabulável), então a asserção só passa se a marca for
      // lida — e lida SEM o filtro de `FOCAVEIS`, que exclui `tabindex="-1"` de
      // propósito. Uma implementação que passasse a marca pela lista de
      // focáveis cairia no Cancelar e reprovaria aqui.
      //
      // A marca é posta QUANDO o painel monta, e não no painel aberto antes de
      // fechar: o `ng-template` é instanciado de novo a cada abertura, e um
      // atributo escrito no nó anterior some com ele. O observador escreve antes
      // de a política de foco rodar — ela espera o painel sair de
      // `visibility: hidden`, o que só acontece num quadro depois da medição do
      // floating-ui, e a notificação de mutação é microtarefa.
      await close(trigger);
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
      try {
        // `data-slot` também: onde ele é escrito por binding, pode chegar depois
        // da inserção do nó, e a marca procura por ele.
        //
        // E NÃO `data-state`, que o svelte precisou acrescentar em 2026-09-17 —
        // premissa medida aqui, e é ela que dispensa o atributo: o `close()` das
        // fixtures espera `panel()` virar `null`, ou seja o nó FORA do DOM.
        // Reabrir depois disso é sempre uma INSERÇÃO, que o `childList` pega; o
        // que quebrou lá foi o `closed()` tolerar o painel ainda no DOM com
        // `data-state="closed"`, e aí a lib reusava o nó sem inserir nada.
        //
        // A premissa se cobra sozinha: se o radix-ng passar a manter o painel
        // montado ao fechar, é o `close()` que estoura por tempo —
        // ruidosamente —, e não este passo que fica verde medindo menos. Se
        // algum dia a espera for afrouxada, o filtro tem de crescer junto.
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-slot'],
        });
        // Clique direto, e não o `open()` das fixtures: ele espera o foco
        // assentar dentro do painel, e é essa espera que a asserção abaixo tem
        // de fazer com nome.
        await userEvent.click(trigger);
        await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
        const title = panel()!.querySelector<HTMLElement>('[data-slot="popover-title"]')!;
        await expect(title).toHaveAttribute('data-autofocus');
        await waitFor(() => expect(title).toHaveFocus());
      } finally {
        observer.disconnect();
        // O foco sai do título ANTES de a marca sair: tirar o `tabindex` de um
        // elemento focado joga o foco no `body`, e foco fora do painel o
        // dispensa. O estado final é o do passo anterior — aberto, foco no
        // Cancelar —, e o replay do painel Interactions parte dele.
        const p = panel();
        if (p) within(p).queryByRole('button', { name: 'Cancelar' })?.focus();
        for (const el of marked) {
          el.removeAttribute('data-autofocus');
          el.removeAttribute('tabindex');
        }
      }
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await open(trigger);
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      // Fechado não há painel para apontar, e o atributo some junto.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step('Clicar fora do painel dispensa o popover', async () => {
      // `functional.item3`, declarado no `covers` acima: o clique cai num
      // elemento REAL fora do gatilho e fora do painel — clicar em
      // `document.body` depende do ponto exato do clique sintético.
      await open(trigger);
      await userEvent.click(canvas.getByTestId('area-externa'));
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('O botão de fechar dentro do painel também fecha', async () => {
      await open(trigger);
      const cancelar = screen.getByRole('button', { name: 'Cancelar' });
      await expect(cancelar).toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(cancelar);
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });

    await step('Salvar fecha por CÓDIGO, não pela peça de fechar', async () => {
      // A distinção é a que separa "desistiu" de "concluiu" no relatório: a
      // peça de fechar publica `close-press`, que vira `close-button`, e o
      // fechamento por código cai em `api`. Marcado com `ndsPopoverClose`, o
      // Salvar reportaria o motivo de quem desistiu — e quem copiasse o
      // exemplo levaria a forma errada.
      await open(trigger);
      const save = screen.getByRole('button', { name: 'Salvar' });
      await expect(save).not.toHaveAttribute('data-slot', 'popover-close');

      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.click(save);
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
      // O estado externo acompanha: o `openChange` da story recebe o mesmo
      // `false` que o painel, senão o gatilho ficaria dizendo "aberto".
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
      // E o foco volta ao gatilho: fechar por código não pode deixar o foco no
      // corpo do documento, que é onde ele cairia com o painel desmontado.
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic
    // fotografa. Terminar fechada era o que tornava falsa a declaração de
    // `accessibility.item1` que morava aqui.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(screen.getByRole('dialog')).toBeVisible();
    });
  },
};
