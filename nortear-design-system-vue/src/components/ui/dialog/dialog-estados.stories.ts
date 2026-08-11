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
  abrir,
  botaoFecharDoCanto,
  conferirNomeEDescricao,
  esperarAberto,
  esperarFechado,
  gatilho,
  overlay,
  painel,
} from './dialog.fixtures';

const meta = {
  title: 'UI/Dialog/States',
  component: Dialog,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
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
    const trigger = gatilho(canvasElement)!;

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // O portal é estrutural: fechado, nem o overlay nem o painel estão no
      // DOM. Um painel escondido por CSS continuaria na ordem de tabulação e
      // seria lido pelo leitor de tela.
      await expect(painel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(trigger).toBeVisible();
    });

    await step('O gatilho anuncia que abre um diálogo, e que está recolhido', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
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
    // `esperarAberto` e não o helper idempotente: esta story tem que provar que
    // `defaultOpen` MONTA aberta. Abrir por clique aqui passaria mesmo com a
    // prop sendo ignorada em silêncio.
    const p = await esperarAberto();

    await step('Monta já aberto, sem estado externo nenhum', async () => {
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('data-state', 'open');
      // Sem `aria-modal`: conferido em node_modules, o primitivo desta stack
      // não emite o atributo — ele isola com `aria-hidden` no que está fora.
      // Quem verifica esse mecanismo é a Playground.
      await expect(p).toHaveAttribute('role', 'dialog');
      await expect(overlay()).toBeVisible();
      await conferirNomeEDescricao(p);
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
    const p = await esperarAberto();

    await step('Sem X no canto', async () => {
      await expect(botaoFecharDoCanto(p)).toBeNull();
    });

    await step('Escape continua fechando — nunca se tira toda saída', async () => {
      // Sem o X, Escape e o "Mais tarde" do rodapé são as saídas que restam.
      // Retirar todas de uma vez deixaria o diálogo sem fechamento acessível.
      await userEvent.keyboard('{Escape}');
      await esperarFechado();
      // Reabre: o Chromatic fotografa o estado final, e o que esta story existe
      // para mostrar é o painel SEM o X no canto.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};

// Espião do modo controlado. Vive fora do `render` para que a play alcance as
// chamadas — spy criado dentro do render é inalcançável e deixa a aba Actions
// vazia. `mockClear()` no início da play zera o que a execução anterior deixou.
const espiaoControlado = fn();

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via open + onUpdate:open.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      const aoMudar = (v: boolean) => {
        open.value = v;
        espiaoControlado(v);
      };
      return { open, aoMudar };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Button @click="aoMudar(true)">Abrir via estado externo</Button>
        <Dialog :open="open" @update:open="aoMudar">
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
              <Button @click="aoMudar(false)">Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    espiaoControlado.mockClear();

    await step('Nasce fechado, porque o valor externo diz que sim', async () => {
      await expect(painel()).toBeNull();
    });

    await step('Interagir avisa o dono do estado, e o painel segue o valor', async () => {
      const externo = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(externo);
      await expect(await esperarAberto()).toBeVisible();
      await expect(espiaoControlado).toHaveBeenLastCalledWith(true);
    });

    await step('Escape também passa pelo dono do estado', async () => {
      await userEvent.keyboard('{Escape}');
      await esperarFechado();
      // O valor externo é quem fecha: se o callback não disparasse, o painel
      // teria sumido por conta própria e o estado do pai ficaria mentindo.
      await expect(espiaoControlado).toHaveBeenLastCalledWith(false);
      await expect(painel()).toBeNull();
    });
  },
};
