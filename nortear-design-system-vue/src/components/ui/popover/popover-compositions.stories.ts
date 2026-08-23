import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, userEvent } from 'storybook/test';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';
import { painel } from './popover.fixtures';
import {
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverPreferenciasSource,
  colorPopoverSelectorSource,
} from './popover.source';

// As quatro composições que o conteúdo compartilhado descreve — editar perfil,
// filtro de tabela, seletor de cor e configurações rápidas. Nenhuma acrescenta
// API: todas são arranjo de conteúdo dentro do mesmo PopoverContent.

const meta = {
  title: 'UI/Popover/Compositions',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: popoverEditarPerfilSource },
      description: {
        component:
          'Formulário curto, filtros combináveis, paleta restrita e preferências booleanas. Todo gatilho nomeia a ação e o objeto — nunca "Mais" ou "Clique aqui".',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Button,
  Input,
  Label,
};

export const EditProfile: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Caso clássico — formulário curto inline com Nome + Email + Atualizar.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 340px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Editar perfil</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverHeader>
              <PopoverTitle>Editar perfil</PopoverTitle>
              <PopoverDescription>Altere o nome e o email da conta.</PopoverDescription>
            </PopoverHeader>
            <form class="nds-stack" data-spacing="sm" @submit.prevent>
              <Label for="popover-comp-name" class="nds-text-caption">Nome</Label>
              <Input id="popover-comp-name" model-value="Ana Ribeiro" />
              <Label for="popover-comp-email" class="nds-text-caption">Email</Label>
              <Input id="popover-comp-email" type="email" model-value="ana@nortear.com.br" />
              <div class="nds-cluster" data-justify="end" data-spacing="sm">
                <Button variant="ghost" size="sm">Cancelar</Button>
                <Button type="submit" size="sm">Atualizar</Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('O formulário abre preenchido e pronto para edição', async () => {
      await waitForPortal('dialog');
      const ctx = within(painel()!);
      await expect(ctx.getByLabelText(/Nome/i)).toHaveValue('Ana Ribeiro');
      await expect(ctx.getByLabelText(/Email/i)).toHaveValue('ana@nortear.com.br');
    });
  },
};

export const TableFilter: Story = {
  parameters: {
    docs: {
      // Escolha múltipla no lugar do formulário: o miolo do painel troca de
      // campos de texto para caixas combináveis.
      source: { transform: popoverFilterSource },
      description: {
        story:
          'Filtros contextuais de uma listagem — status combináveis e o par Limpar / Aplicar ao final.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 320px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Filtros</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverHeader>
              <PopoverTitle>Filtrar por status</PopoverTitle>
              <PopoverDescription>Combine quantos status quiser na listagem.</PopoverDescription>
            </PopoverHeader>
            <div class="nds-stack nds-text-body" data-spacing="xs">
              <label class="nds-cluster" data-spacing="sm">
                <input type="checkbox" class="nds-size-4" checked />
                <span>Ativo</span>
              </label>
              <label class="nds-cluster" data-spacing="sm">
                <input type="checkbox" class="nds-size-4" />
                <span>Pendente</span>
              </label>
              <label class="nds-cluster" data-spacing="sm">
                <input type="checkbox" class="nds-size-4" />
                <span>Arquivado</span>
              </label>
            </div>
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <Button variant="ghost" size="sm">Limpar</Button>
              <Button size="sm">Aplicar</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('Os três status são combináveis', async () => {
      await waitForPortal('dialog');
      const ctx = within(painel()!);
      await expect(ctx.getAllByRole('checkbox')).toHaveLength(3);
      await expect(ctx.getByLabelText(/Ativo/i)).toBeChecked();
    });

    await step('E marcar outro não fecha o painel', async () => {
      // Filtro é escolha múltipla: fechar no primeiro clique obrigaria a
      // reabrir para cada critério.
      const pendente = within(painel()!).getByLabelText(/Pendente/i);
      if (!(pendente as HTMLInputElement).checked) await userEvent.click(pendente);
      await expect(pendente).toBeChecked();
      await expect(painel()).toBeInTheDocument();
    });
  },
};

export const ColorPicker: Story = {
  parameters: {
    docs: {
      // O miolo vira uma fila de amostras sem texto visível: o nome acessível
      // passa a vir de `aria-label`, o que nenhuma outra story do arquivo faz.
      source: { transform: colorPopoverSelectorSource },
      description: {
        story: 'Paleta restrita em grid — cada amostra tem nome acessível próprio.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    // Os seis botões saem escritos um a um, e não de um `v-for` com `:class`
    // dinâmico: classe montada em runtime não é auditável — o verificador de
    // classe morta lê a expressão como se fosse o nome da classe.
    template: `
      <div style="contain: layout; min-height: 300px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Escolher cor da etiqueta</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverHeader>
              <PopoverTitle>Cor da etiqueta</PopoverTitle>
              <PopoverDescription>Escolha uma cor da paleta do tema.</PopoverDescription>
            </PopoverHeader>
            <div class="nds-cluster" data-spacing="sm">
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-primary" aria-label="Primária"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-secondary" aria-label="Secundária"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-success" aria-label="Sucesso"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-warning" aria-label="Atenção"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-info" aria-label="Informação"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-destructive" aria-label="Destrutiva"></button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('Cada amostra tem nome acessível próprio', async () => {
      // A cor não é o nome: quem não distingue a cor precisa do rótulo, e sem
      // ele o axe reprova por button-name.
      await waitForPortal('dialog');
      const amostras = within(painel()!).getAllByRole('button');
      const names = amostras
        .map((b) => b.getAttribute('aria-label'))
        .filter((n): n is string => n !== null);
      await expect(names).toHaveLength(6);
      await expect(new Set(names).size).toBe(6);
    });

    await step('E o foco chega a cada uma por Tab', async () => {
      const ctx = within(painel()!);
      const first = ctx.getByRole('button', { name: 'Primária' });
      const segunda = ctx.getByRole('button', { name: 'Secundária' });
      first.focus();
      await userEvent.tab();
      await expect(segunda).toHaveFocus();
    });
  },
};

export const QuickSettings: Story = {
  parameters: {
    docs: {
      // Rótulo e campo dividem a linha por `data-justify="between"`, e o painel
      // fecha sem par de ações: não há o que confirmar numa preferência.
      source: { transform: popoverPreferenciasSource },
      description: {
        story: 'Preferências booleanas independentes — alternativa leve ao Dialog para ajustes rápidos.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const notificacoes = ref(true);
      const escuro = ref(false);
      const compacto = ref(false);
      return { notificacoes, escuro, compacto };
    },
    template: `
      <div style="contain: layout; min-height: 320px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Configuracoes rápidas</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverHeader>
              <PopoverTitle>Preferências</PopoverTitle>
              <PopoverDescription>Cada linha vale por si — nada aqui depende do resto.</PopoverDescription>
            </PopoverHeader>
            <div class="nds-stack nds-text-body" data-spacing="sm">
              <label class="nds-cluster" data-align="center" data-justify="between">
                <span>Notificações</span>
                <input type="checkbox" v-model="notificacoes" class="nds-size-4" />
              </label>
              <label class="nds-cluster" data-align="center" data-justify="between">
                <span>Modo escuro</span>
                <input type="checkbox" v-model="escuro" class="nds-size-4" />
              </label>
              <label class="nds-cluster" data-align="center" data-justify="between">
                <span>Modo compacto</span>
                <input type="checkbox" v-model="compacto" class="nds-size-4" />
              </label>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('As preferências são independentes entre si', async () => {
      await waitForPortal('dialog');
      const ctx = within(painel()!);
      const notificacoes = ctx.getByLabelText(/Notificações/i) as HTMLInputElement;
      const escuro = ctx.getByLabelText(/Modo escuro/i) as HTMLInputElement;

      // Ponto de partida conhecido antes de medir — no replay o painel chega
      // com o que a rodada anterior deixou.
      if (!notificacoes.checked) await userEvent.click(notificacoes);
      if (escuro.checked) await userEvent.click(escuro);
      await expect(notificacoes).toBeChecked();
      await expect(escuro).not.toBeChecked();

      await userEvent.click(escuro);
      await expect(escuro).toBeChecked();
      // A que já estava marcada não se mexe: são preferências, não um grupo de
      // escolha única.
      await expect(notificacoes).toBeChecked();
    });
  },
};
