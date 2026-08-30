import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
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
import {
  open,
  cantoButtonClose,
  checkNameEDescricao,
  waitForOpen,
  waitForClosed,
  trigger,
  overlay,
  panel,
} from './dialog.fixtures';
import {
  dialogOpenSource,
  dialogControlledSource,
  dialogNoButtonCloseSource,
  dialogSource,
} from './dialog.source';

const meta = {
  title: 'Primitives/Overlay/Dialog/States',
  component: Dialog,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O estado fechado é a forma canônica sem nenhuma prop de abertura — o
      // mesmo snippet do Playground.
      source: { transform: dialogSource },
      description: {
        component:
          'Estados canônicos do Dialog: closed, open, withCloseButtonHidden e controlled (controle externo via open + onUpdate:open).',
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
};

export const Closed: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível. Portal vazio.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog>
        <DialogTrigger as-child>
          <Button variant="outline">Editar perfil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
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
  // Esta story não interage com nada: é aqui que a leitura do estado de
  // MONTAGEM vale, porque nenhum replay pode ter mudado o que ela observa.
  play: async ({ canvasElement, step }) => {
    const triggerEl = trigger(canvasElement)!;

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // O portal é estrutural: fechado, nem o overlay nem o painel estão no
      // DOM. Um painel escondido por CSS continuaria na ordem de tabulação e
      // seria lido pelo leitor de tela.
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(triggerEl).toBeVisible();
    });

    await step('O gatilho anuncia que abre um diálogo, e que está recolhido', async () => {
      await expect(triggerEl).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(triggerEl).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Aqui a montagem já aberta É o assunto; nas outras stories a prop é só
      // andaime da foto do Chromatic e fica fora do snippet.
      source: { transform: dialogOpenSource },
      description: { story: 'Diálogo aberto via defaultOpen. Captura visual no Chromatic.' },
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
    // `waitForOpen` e não o helper idempotente: esta story tem que provar que
    // `defaultOpen` MONTA aberta. Abrir por clique aqui passaria mesmo com a
    // prop sendo ignorada em silêncio.
    const p = await waitForOpen();

    await step('Monta já aberto, sem estado externo nenhum', async () => {
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(p).toHaveAttribute('role', 'dialog');
      await expect(p).toHaveAttribute('aria-modal', 'true');
      await expect(overlay()).toBeVisible();
      await checkNameEDescricao(p);
    });

    await step('E o foco já está dentro do painel', async () => {
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // A prop que apaga o X do canto não aparece no snippet do meta.
      source: { transform: dialogNoButtonCloseSource },
      description: {
        story:
          'showCloseButton={false} no Content. Sem X no canto — fechamento apenas por Escape, clique no overlay ou ação do Footer.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button variant="outline">Ver atualização</Button>
        </DialogTrigger>
        <DialogContent :show-close-button="false">
          <DialogHeader>
            <DialogTitle>Aceitar atualização</DialogTitle>
            <DialogDescription>Uma nova versão está disponível. Clique em continuar para atualizar.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Mais tarde</Button>
            </DialogClose>
            <Button>Atualizar agora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step('Sem X no canto', async () => {
      await expect(cantoButtonClose(p)).toBeNull();
    });

    await step('Escape continua fechando — nunca se tira toda saída', async () => {
      // Sem o X, Escape e o "Mais tarde" do rodapé são as saídas que restam.
      // Retirar todas de uma vez deixaria o diálogo sem fechamento acessível.
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final, e o que esta story existe
      // para mostrar é o painel SEM o X no canto.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

// Espião do modo controlado. Vive fora do `render` para que a play alcance as
// chamadas — spy criado dentro do render é inalcançável e deixa a aba Actions
// vazia. `mockClear()` no início da play zera o que a execução anterior deixou.
const spyControlled = fn();

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      // Não há gatilho: quem abre é um botão comum, e o par prop+evento entra
      // no lugar dele. Estrutura inteiramente outra.
      source: { transform: dialogControlledSource },
      description: {
        story: 'Abertura controlada por estado externo via open + onUpdate:open.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      const onChange = (v: boolean) => {
        open.value = v;
        spyControlled(v);
      };
      return { open, onChange };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Button @click="onChange(true)">Abrir via estado externo</Button>
        <Dialog :open="open" @update:open="onChange">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Controlado pelo pai</DialogTitle>
              <DialogDescription>
                Este diálogo é comandado por estado externo via open e update:open.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button @click="onChange(false)">Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    spyControlled.mockClear();

    await step('Nasce fechado, porque o valor externo diz que sim', async () => {
      await expect(panel()).toBeNull();
    });

    await step('Interagir avisa o dono do estado, e o painel segue o valor', async () => {
      const externo = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(externo);
      await expect(await waitForOpen()).toBeVisible();
      await expect(spyControlled).toHaveBeenLastCalledWith(true);
    });

    await step('Escape também passa pelo dono do estado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      // O valor externo é quem fecha: se o callback não disparasse, o painel
      // teria sumido por conta própria e o estado do pai ficaria mentindo.
      await expect(spyControlled).toHaveBeenLastCalledWith(false);
      await expect(panel()).toBeNull();
    });
  },
};
