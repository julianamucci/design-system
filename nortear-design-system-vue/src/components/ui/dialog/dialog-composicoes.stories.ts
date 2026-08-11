import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
  abrir,
  botaoFecharDoCanto,
  conferirNomeEDescricao,
  esperarAberto,
  esperarFechado,
  fechar,
  gatilho,
  painel,
} from './dialog.fixtures';

const meta = {
  title: 'UI/Dialog/Compositions',
  component: Dialog,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes canônicas de uso real do Dialog: confirmação de email, edição de perfil e pré-visualização de mídia.',
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

export const ConfirmEmail: Story = {
  parameters: {
    docs: {
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
    const p = await esperarAberto();

    await step('O diálogo se anuncia com o nome e a descrição do fluxo', async () => {
      await conferirNomeEDescricao(p);
    });

    await step('O campo do fluxo está rotulado', async () => {
      const email = p.querySelector<HTMLInputElement>('#new-email')!;
      await expect(email).toHaveAccessibleName('Novo email');
      await expect(email.type).toBe('email');
    });

    await step('A operação é reversível, então a ação primária é neutra', async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>('button');
      await expect(botoes[botoes.length - 1]).toHaveClass('nds-button-default');
    });
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      description: { story: 'Formulário de edição de perfil com múltiplos campos.' },
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
          <form class="nds-grid" data-spacing="sm">
            <div class="nds-grid" data-spacing="xs">
              <Label for="profile-name">Nome</Label>
              <Input id="profile-name" default-value="Juliana Mucci" />
            </div>
            <div class="nds-grid" data-spacing="xs">
              <Label for="profile-handle">Username</Label>
              <Input id="profile-handle" default-value="@julianamucci" />
            </div>
            <div class="nds-grid" data-spacing="xs">
              <Label for="profile-bio">Bio</Label>
              <Input id="profile-bio" default-value="Designer de sistemas em São Paulo" />
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
    const p = await esperarAberto();

    await step('Os campos estão rotulados e trazem o valor inicial', async () => {
      // O valor entra na asserção junto com o rótulo: um campo que renderiza
      // vazio passaria só na presença do label e ninguém veria a falha.
      const nome = p.querySelector<HTMLInputElement>('#profile-name')!;
      await expect(nome).toHaveAccessibleName('Nome');
      await expect(nome.value).toBe('Juliana Mucci');

      const handle = p.querySelector<HTMLInputElement>('#profile-handle')!;
      await expect(handle).toHaveAccessibleName('Username');
      await expect(handle.value).toBe('@julianamucci');
    });

    await step('O Tab percorre os campos na ordem em que aparecem', async () => {
      const nome = p.querySelector<HTMLInputElement>('#profile-name')!;
      nome.focus();
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector('#profile-handle'));
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector('#profile-bio'));
    });
  },
};

export const MediaPreview: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item6'],
    docs: {
      description: { story: 'Pré-visualização de mídia em destaque sem footer (uso passivo).' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Pré-visualizar imagem</Button>
        </DialogTrigger>
        <DialogContent class="nds-sm-max-w-md">
          <DialogHeader>
            <DialogTitle>Pré-visualização da imagem</DialogTitle>
            <DialogDescription>captura-de-tela.png · 1920×1080 · 248 KB</DialogDescription>
          </DialogHeader>
          <!--
            Marcador de mídia com as classes REAIS do sistema: \`aspect-video\` e
            \`sm:max-w-md\` eram resíduo do Tailwind e não pintavam nada. A forma
            segue o Vanilla, que é a referência de markup.
          -->
          <div
            data-slot="dialog-body"
            role="img"
            aria-label="Imagem em destaque"
            class="nds-dialog-body nds-aspect-video nds-w-full nds-rounded-md nds-border-default nds-bg-muted nds-cluster nds-text-caption nds-text-muted-foreground"
            data-align="center"
            data-justify="center"
          >
            Pré-visualização da mídia
          </div>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await esperarAberto();

    await step('A mídia tem descrição textual', async () => {
      // O bloco carrega a informação do diálogo — sem nome acessível o conteúdo
      // inteiro desapareceria para quem usa leitor de tela.
      await expect(within(p).getByRole('img')).toHaveAccessibleName();
    });

    await step('Sem rodapé de ações, porque não há o que confirmar', async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
    });

    await step('O botão de fechar é a saída, e devolve o foco ao gatilho', async () => {
      const trigger = gatilho(canvasElement)!;
      // A devolução do foco só faz sentido se o diálogo tiver sido ABERTO pelo
      // gatilho. Esta story MONTA aberta, e nesse caminho o elemento focado
      // antes era o próprio documento — era para lá que o foco voltava, com razão.
      // Fechar e reabrir pelo gatilho estabelece a precondição do que se quer
      // provar.
      await fechar();
      await abrir(canvasElement);
      const x = botaoFecharDoCanto(painel()!)!;
      await expect(x).toHaveAccessibleName();
      await userEvent.click(x);
      await esperarFechado();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
      // Reabre: o Chromatic fotografa o estado final, e é o painel ABERTO que o
      // axe precisa varrer — `accessibility.item6` é declarado nesta story.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};
