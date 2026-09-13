import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_POPOVER } from './popover';
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
  render: () => ({
    props: { aberto: false },
    template: `
      <div ndsPopover [(open)]="aberto">
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
        ${SIMPLE_PANEL}
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
  parameters: { covers: ['accessibility.item1', 'accessibility.item2'] },
  render: () => ({
    // Nasce aberta pelo estado externo, e não por `defaultOpen`: o rodapé fecha
    // por código no "Salvar", e isso exige o par `[open]`/`(openChange)`. O
    // `defaultOpen` continua provado pela story `Modal` logo abaixo, que abre
    // por ele e reprovaria se o input não chegasse.
    props: { aberto: true },
    template: `
      <div ndsPopover [(open)]="aberto">
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
        ${SIMPLE_PANEL}
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

export const Controlled: Story = {
  parameters: { covers: ['functional.item3'] },
  render: () => ({
    props: { aberto: false },
    // O par `[open]`/`(openChange)` escrito por extenso, que é o assunto desta
    // story — `[(open)]="aberto"` das outras é o mesmo par açucarado.
    template: `
      <div class="nds-cluster" data-spacing="md">
        <div ndsPopover [open]="aberto" (openChange)="aberto = $event">
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

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(screen.getByRole('dialog')).toBeVisible();
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['functional.item4', 'accessibility.item3'] },
  render: () => ({
    props: { aberto: false },
    template: `
      <div ndsPopover [(open)]="aberto">
        <button ndsPopoverTrigger ndsButton variant="outline">Abrir popover</button>
        ${SIMPLE_PANEL}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir popover' });

    await step('O foco entra no painel ao abrir', async () => {
      await open(trigger);
      await waitFor(async () => {
        await expect(panel()!.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Tab caminha entre os controles internos', async () => {
      const cancel = screen.getByRole('button', { name: 'Cancelar' });
      const save = screen.getByRole('button', { name: 'Salvar' });
      cancel.focus();
      await userEvent.tab();
      await expect(save).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const save = screen.getByRole('button', { name: 'Salvar' });
      await expect(save.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(save).boxShadow).not.toBe('none');
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava e o painel se anuncia como diálogo modal. As três coisas andam juntas: anunciar inércia sem prender o foco engana quem navega por leitor de tela.',
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
      // apertar Tab. Não-modal, o foco SAI do painel e esta asserção reprova;
      // modal, ele volta ao primeiro.
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
      const trigger = screen.getByRole('button', { name: 'Abrir modal' });
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
  },
};
