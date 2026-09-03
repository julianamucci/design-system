import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  open,
  cantoButtonClose,
  checkNameAndDescription,
  waitForOpen,
  waitForClosed,
} from './dialog.fixtures';
import {
  dialogActionDestructiveSource,
  dialogWithFormSource,
  dialogWithScrollSource,
  footerDialogCloseSource,
  dialogNoFooterSource,
  dialogConfirmarEmailSource,
  dialogSource,
} from './dialog.source';

const meta = {
  title: 'Primitives/Overlay/Dialog/Variants',
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
      await checkNameAndDescription(p);
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

    await step('O rodapé arredonda junto com o painel', async () => {
      // RELAÇÃO, e não valor: derivar a expectativa de `--radius-card` faria a
      // asserção concordar com qualquer defeito que também saísse do token, e
      // asserção que não pode falhar foi o achado mais repetido desta campanha.
      // O rodapé rasga até a borda do painel — as margens negativas cancelam o
      // padding —, então as duas quinas de baixo são a MESMA linha. O `0.75rem`
      // cravado que morava na folha divergia do painel nas doze combinações de
      // tema × modo × largura medidas.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const panelStyle = getComputedStyle(p);
      const footerStyle = getComputedStyle(footer);
      await expect(footerStyle.borderBottomLeftRadius).toBe(panelStyle.borderBottomLeftRadius);
      await expect(footerStyle.borderBottomRightRadius).toBe(panelStyle.borderBottomRightRadius);
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
      // A região rolável tem `tabindex`, papel e nome próprios — peça de corpo
      // que o snippet do `meta` não tem.
      source: { transform: dialogWithScrollSource },
      description: {
        story:
          'Body longo com rolagem própria: o painel fica parado e centralizado, e header e rodapé continuam visíveis.',
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
        <DialogContent class="nds-max-w-lg">
          <DialogHeader>
            <DialogTitle>Termos de serviço</DialogTitle>
            <DialogDescription>Leia atentamente os termos antes de aceitar.</DialogDescription>
          </DialogHeader>
          <div
            class="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
            data-slot="dialog-body"
            data-spacing="sm"
            tabindex="0"
            role="group"
            aria-label="Termos de serviço"
          >
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
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O corpo rola sozinho, com header e rodapé parados', async () => {
      // Esta story demonstrava a OUTRA rota — `DialogScrollContent`, em que quem
      // rola é o overlay e o cabeçalho sobe junto. O conteúdo compartilhado
      // descreve `withScrollContent` como "Header e Footer fixos", que é o
      // arranjo de corpo rolável; a story dizia uma coisa e a descrição ao lado
      // dela dizia outra. Comportamento e não nome de classe: é o `overflow`
      // computado que prova a variante.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(getComputedStyle(body).overflowY).toBe('auto');
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });

    await step('A região rolável é alcançável por teclado e tem nome', async () => {
      // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa —
      // é a exigência que acompanha toda região com rolagem própria.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).toHaveAttribute('tabindex', '0');
      await expect(body).toHaveAccessibleName();
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

// A ConfirmEmail vive AQUI, e não em -compositions, porque o conteúdo
// compartilhado a descreve em `variants.items.confirmEmail` — ao lado de
// default, withForm e das outras formas do painel. Estava em -compositions em
// quatro stacks e em -variants numa só; quem lia a documentação de uma stack
// encontrava a mesma story em outro lugar do menu.
export const ConfirmEmail: Story = {
  parameters: {
    docs: {
      // O campo inline muda a marcação do corpo: o andaime do meta não o traz.
      source: { transform: dialogConfirmarEmailSource },
      description: { story: 'Confirmação de troca de email com input inline.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Confirmar novo email</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar novo email</DialogTitle>
            <DialogDescription>
              Enviaremos um link de confirmação para o novo endereço. O email atual continua ativo até a confirmação.
            </DialogDescription>
          </DialogHeader>
          <div class="nds-grid" data-spacing="xs">
            <Label for="new-email">Novo email</Label>
            <Input id="new-email" type="email" placeholder="voce@example.com" />
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button>Enviar confirmação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step('O diálogo se anuncia com o nome e a descrição do fluxo', async () => {
      await checkNameAndDescription(p);
    });

    await step('O campo do fluxo está rotulado', async () => {
      const email = p.querySelector<HTMLInputElement>('#new-email')!;
      await expect(email).toHaveAccessibleName('Novo email');
      await expect(email.type).toBe('email');
    });

    await step('A operação é reversível, então a ação primária é neutra', async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      await expect(buttons[buttons.length - 1]).toHaveClass('nds-button-default');
    });
  },
};
