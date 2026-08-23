import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  open,
  cantoButtonClose,
  checkNameEDescricao,
  waitForOpen,
  waitForClosed,
  overlay,
} from './dialog.fixtures';
import {
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  footerDialogCloseSource,
  dialogNoFooterSource,
  dialogSource,
} from './dialog.source';

const meta = {
  title: 'UI/Dialog/Variants',
  component: Dialog,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // A composição padrão é a mesma do Playground: cabeçalho, saída e ação
      // primária. As outras variantes trocam a estrutura e declaram a sua.
      source: { transform: dialogSource },
      description: {
        component:
          'Composicoes estruturais recorrentes do Dialog. Não há prop variant — escolha a estrutura que melhor descreve o caso de uso.',
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
};

// Todas as composições trazem o gatilho, como nas outras stacks: sem ele a
// story não tem como reabrir depois de um passo que fecha, e o painel
// Interactions ficaria com um diálogo que não volta mais.

export const Default: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: { story: 'Title + Description + Footer com ação primária. Composição padrão.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Editar perfil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</DialogDescription>
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
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('As quatro partes da composição padrão estão no painel', async () => {
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-title"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-description"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
      await checkNameEDescricao(p);
    });

    await step('A ação primária é a última do rodapé', async () => {
      // `flex-direction: column-reverse` põe a ação primária no topo da pilha
      // no estreito e à direita no largo. No DOM ela vem por último, que é a
      // ordem de leitura e de foco correta.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons.length).toBe(2);
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-default');
    });
  },
};

export const WithForm: Story = {
  parameters: {
    covers: ['visual.item2', 'visual.item4'],
    docs: {
      // O corpo ganha um formulário com campos rotulados — dois imports a mais
      // e uma seção que o snippet do meta não tem.
      source: { transform: dialogWithFormSource },
      description: { story: 'Body com formulário inline. Submissão dispara a ação primária do Footer.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Editar perfil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize seu nome e email. As mudanças entram em vigor após salvar.</DialogDescription>
          </DialogHeader>
          <form class="nds-grid" data-spacing="sm">
            <div class="nds-grid" data-spacing="xs">
              <Label for="dialog-name">Nome</Label>
              <Input id="dialog-name" default-value="Juliana Mucci" />
            </div>
            <div class="nds-grid" data-spacing="xs">
              <Label for="dialog-email">E-mail</Label>
              <Input id="dialog-email" type="email" default-value="juliana@example.com" />
            </div>
          </form>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      // O valor entra na asserção junto com o rótulo: um campo que renderiza
      // vazio passaria só na presença do label e ninguém veria a falha.
      const name = p.querySelector<HTMLInputElement>('#dialog-name')!;
      await expect(name).toHaveAccessibleName('Nome');
      await expect(name.value).toBe('Juliana Mucci');

      const email = p.querySelector<HTMLInputElement>('#dialog-email')!;
      await expect(email).toHaveAccessibleName('E-mail');
      await expect(email.value).toBe('juliana@example.com');
    });

    await step('O foco alcança os campos por teclado, dentro do painel', async () => {
      const name = p.querySelector<HTMLInputElement>('#dialog-name')!;
      name.focus();
      await expect(document.activeElement).toBe(name);
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector('#dialog-email'));
    });
  },
};

export const WithScrollContent: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      // Outro painel: `DialogScrollContent` no lugar de `DialogContent`.
      source: { transform: dialogWithScrollSource },
      description: {
        story:
          'Conteúdo longo demais para a janela: o painel sai do centro fixo e entra no fluxo do overlay, que passa a ser quem rola. Header e Footer continuam dentro do painel.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Ver termos</Button>
        </DialogTrigger>
        <DialogScrollContent class="nds-max-w-lg">
          <DialogHeader>
            <DialogTitle>Termos de serviço</DialogTitle>
            <DialogDescription>Leia atentamente os termos antes de aceitar.</DialogDescription>
          </DialogHeader>
          <div class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
            <p v-for="i in 12" :key="i">
              Parágrafo {{ i }} — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
              ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Recusar</Button>
            </DialogClose>
            <Button>Aceitar termos</Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O painel sai do centro fixo e entra no fluxo do overlay', async () => {
      // Conteúdo mais alto que a janela precisa de alguém para rolar. Quem rola
      // é o overlay: o painel centralizado por `position: fixed` cortaria o que
      // não coubesse, sem barra de rolagem nenhuma. Comportamento e não nome de
      // classe — é o `overflow` computado que prova a variante.
      await expect(getComputedStyle(overlay()!).overflowY).toBe('auto');
      await expect(getComputedStyle(p).position).toBe('relative');
    });

    await step('Header e Footer continuam no painel, acima e abaixo do corpo', async () => {
      const partes = [...p.querySelectorAll<HTMLElement>('[data-slot^="dialog-"]')]
        .map((el) => el.dataset.slot)
        .filter((slot) => slot !== 'dialog-close');
      await expect(partes).toEqual(['dialog-header', 'dialog-title', 'dialog-description', 'dialog-footer']);
    });
  },
};

export const NoFooter: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // A AUSÊNCIA do rodapé é o assunto: o snippet do meta o mostraria e
      // ensinaria o contrário.
      source: { transform: dialogNoFooterSource },
      description: { story: 'Apenas Title + Description, sem Footer. Para uso informativo passivo.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Ver detalhes do pedido</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do pedido #4287</DialogTitle>
            <DialogDescription>
              Pedido confirmado em 15 de março às 14:32. Entrega prevista para 20 de março via transportadora parceira.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem rodapé, o botão X é a única saída visível', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
      const x = cantoButtonClose(p)!;
      await expect(x).toHaveAccessibleName();
    });

    await step('E ele fecha de verdade — a story volta a abrir para a captura', async () => {
      await userEvent.click(cantoButtonClose(p)!);
      await waitForClosed();
      // O Chromatic fotografa o estado final: uma composição que termina
      // fechada capturaria só o gatilho.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // A ação primária troca de variante — é uma prop que o snippet do meta,
      // por ser o caso neutro, não escreve.
      source: { transform: dialogActionDestructiveSource },
      description: {
        story:
          'Footer com ação destrutiva. Use só quando a destrutividade é secundária ao fluxo (ex: remover item de lista). Para confirmações irreversíveis principais, prefira AlertDialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Remover anexo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover anexo</DialogTitle>
            <DialogDescription>O anexo será removido desta mensagem. Você pode adicioná-lo novamente depois.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive">Remover anexo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('A ação primária carrega a variante destrutiva', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-destructive');
    });

    await step('Ainda assim é um Dialog, não um AlertDialog', async () => {
      // A destrutividade aqui é secundária ao fluxo (remover de uma mensagem,
      // não apagar o recurso). Confirmação irreversível pede
      // `role="alertdialog"`, foco inicial no Cancelar e Cancelar obrigatório —
      // outro componente.
      await expect(p).toHaveAttribute('role', 'dialog');
    });
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // Duas props que andam em par, e nenhuma delas está no snippet do meta.
      source: { transform: footerDialogCloseSource },
      description: {
        story:
          '`showCloseButton: false` no Content e `showCloseButton` no Footer — o botão de fechar sai do canto e passa a acompanhar as ações.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Configurar notificações</Button>
        </DialogTrigger>
        <DialogContent :show-close-button="false">
          <DialogHeader>
            <DialogTitle>Configuracoes de notificação</DialogTitle>
            <DialogDescription>Escolha como deseja ser avisado sobre novas atividades.</DialogDescription>
          </DialogHeader>
          <DialogFooter show-close-button>
            <Button>Salvar preferências</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem X no canto, o fechar mora no rodapé', async () => {
      await expect(cantoButtonClose(p)).toBeNull();
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(within(footer).getByRole('button', { name: /fechar/i })).toBeVisible();
    });

    await step('E o botão do rodapé fecha o diálogo', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await userEvent.click(within(footer).getByRole('button', { name: /fechar/i }));
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final da play.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};
