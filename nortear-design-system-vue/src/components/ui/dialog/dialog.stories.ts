import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, expect, fn, waitFor, within } from 'storybook/test';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import DialogDocs from '@/components/docs/DialogDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  abrir,
  cantoButtonClose,
  checkFocusTrap,
  checkNameEDescricao,
  waitForClosed,
  fechar,
  gatilho,
  overlay,
  painel,
} from './dialog.fixtures';
import { dialogSource } from './dialog.source';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(DialogDocs), source: { transform: dialogSource } },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Se o diálogo inicia aberto (útil para capturas visuais).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    modal: {
      control: 'boolean',
      description:
        'Trava a rolagem da página e torna o resto do documento inerte enquanto aberto.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    // Espião do evento. Sem entrada aqui a prop fica fora da aba API Reference,
    // e o `arg_without_argtype` do auditor cobra exatamente isso.
    'onUpdate:open': {
      control: false,
      description: 'Emitido a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  // Valores iniciais no meta e não na story: sem eles os controls booleanos
  // abrem vazios.
  args: {
    defaultOpen: false,
    modal: true,
    'onUpdate:open': fn(),
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'functional.item4', 'functional.item5', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: {
      Dialog,
      DialogClose,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
    },
    setup() {
      return { args };
    },
    template: `
      <Dialog :key="String(args.defaultOpen)" v-bind="args">
        <DialogTrigger as-child>
          <Button variant="outline">Editar perfil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    // Pelo contrato de markup e não por papel: enquanto o diálogo está aberto o
    // resto da página fica inerte, e uma consulta por papel depende de como a
    // biblioteca de teste trata `inert`.
    const trigger = gatilho(canvasElement)!;
    const spy = args['onUpdate:open'] as unknown as ReturnType<typeof fn>;

    await step('O markup é o mesmo das outras stacks', async () => {
      // O Vanilla é a referência: o gatilho é um `<button>` de verdade, e
      // `type="button"` porque dentro de um `<form>` o submit herdado faria
      // abrir o diálogo enviar o formulário.
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger).toHaveAttribute('type', 'button');
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // `fechar()` e não uma leitura do estado de montagem: a story termina
      // ABERTA (último passo), então na segunda rodada do painel Interactions o
      // painel já estaria montado. Quem verifica o estado fechado NA MONTAGEM é
      // a story `Closed`, que não interage com nada.
      await fechar();
      await expect(painel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no gatilho abre o diálogo com overlay', async () => {
      const p = await abrir(canvasElement);
      await expect(p).toBeVisible();
      await expect(overlay()).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(p).toHaveAttribute('data-state', 'open');
    });

    await step('O painel se anuncia como diálogo, com nome e descrição', async () => {
      const p = painel()!;
      await expect(p).toHaveAttribute('role', 'dialog');
      await checkNameEDescricao(p);
    });

    await step('Aberto e modal, o resto do documento sai do alcance', async () => {
      const p = painel()!;
      if (!args.modal) {
        // Sem modalidade não pode haver `aria-modal`: o atributo prometeria ao
        // leitor de tela um isolamento que não existe.
        await expect(p).not.toHaveAttribute('aria-modal');
        return;
      }
      // Duas provas do mesmo contrato. O atributo é o que o conteúdo
      // compartilhado documenta, e sai do wrapper do design system — conferido
      // em `node_modules/reka-ui`, o primitivo NÃO o emite sozinho (a string não
      // aparece em lugar nenhum do pacote).
      await expect(p).toHaveAttribute('aria-modal', 'true');
      // E o isolamento de fato: o primitivo marca o que está FORA do diálogo
      // com `aria-hidden` (`shared/useHideOthers`), que é o mecanismo que o
      // leitor de tela realmente observa.
      await waitFor(async () => {
        await expect(trigger.closest('[inert], [aria-hidden="true"]')).not.toBeNull();
      });
    });

    await step('O foco entra no painel ao abrir', async () => {
      const p = painel()!;
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Tab não sai do painel', async () => {
      await checkFocusTrap(painel()!);
    });

    await step('Escape fecha, avisa o callback e devolve o foco ao gatilho', async () => {
      const callsBefore = spy.mock.calls.length;
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Clique no overlay fecha e devolve o foco', async () => {
      await abrir(canvasElement);
      // `userEvent.click` e não `.click()` cru: o primitivo desta stack dispensa
      // no `pointerdown` de fora, e o `.click()` programático dispara só o
      // evento de clique — o diálogo continuava aberto.
      await userEvent.click(overlay()!);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('O botão X fecha, tem nome acessível e devolve o foco', async () => {
      const p = await abrir(canvasElement);
      const x = cantoButtonClose(p)!;
      await expect(x).toHaveAccessibleName();
      await userEvent.click(x);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('O Cancelar do rodapé fecha sem tocar na ação primária', async () => {
      const p = await abrir(canvasElement);
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      // A ação primária é a última do DOM; o Cancelar é a primeira.
      const buttons = rodape.querySelectorAll<HTMLElement>('button');
      await userEvent.click(buttons[0]);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('A story termina aberta', async () => {
      // O Chromatic fotografa o ESTADO FINAL e o axe do test-runner roda depois
      // da play: terminar fechada faria a captura mostrar só o gatilho e a
      // varredura de acessibilidade medir uma página sem diálogo nenhum — o
      // conteúdo compartilhado declara os dois sobre o estado ABERTO
      // (`visual.item1`, `accessibility.item6`).
      const p = await abrir(canvasElement);
      await expect(p).toBeVisible();
      await expect(within(p).getAllByRole('button').length).toBeGreaterThan(0);
    });
  },
};
