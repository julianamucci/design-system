import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { panel } from './popover.fixtures';
import {
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverPreferenciasSource,
  colorPopoverSelectorSource,
  popoverAboveSource,
} from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
// As quatro composições que o conteúdo compartilhado descreve — editar perfil,
// filtro de tabela, seletor de cor e configurações rápidas. Nenhuma acrescenta
// API: todas são arranjo de conteúdo dentro do mesmo PopoverContent.

const meta = {
  title: 'Components/Overlay/Popover/Compositions',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: popoverEditarPerfilSource },
      description: {
        component:
          'Formulário curto, filtros combináveis, paleta restrita e preferências booleanas. Todo gatilho nomeia a ação e o objeto — nunca "Mais" ou "Clique aqui". O lado de abertura entra aqui pelo mesmo motivo: é arranjo do painel, não estado dele.',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Button,
  Input,
  Label,
};

/**
 * Espiões do `update:open` das composições que fecham. No módulo, e não no
 * `setup`: criados lá, a play não os alcançaria. São eles que separam
 * "desistiu" (`close-button`) de "concluiu" (`api`) — o painel sumir sozinho
 * passaria com qualquer motivo.
 */
const editProfileOpenChange = fn();
const tableFilterOpenChange = fn();

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
    setup() {
      return { editProfileOpenChange };
    },
    template: `
      <div class="nds-min-h-90" style="contain: layout">
        <Popover v-slot="{ close }" :default-open="true" @update:open="editProfileOpenChange">
          <PopoverTrigger as-child>
            <Button variant="outline">Editar perfil</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Editar perfil</PopoverTitle>
              <PopoverDescription>Altere o nome e o email da conta.</PopoverDescription>
            </PopoverHeader>
            <!-- Cancelar é a PEÇA de fechar (motivo close-button); o
                 "Atualizar" fecha por CÓDIGO ao salvar, e o fechamento vai no
                 SUBMIT — nunca no clique do botão: fechar no clique
                 desmontaria o formulário antes de ele submeter, e só este
                 caminho cobre também o Enter num campo. -->
            <form class="nds-stack" data-spacing="sm" @submit.prevent="close()">
              <Label for="popover-comp-name" class="nds-text-caption">Nome</Label>
              <Input id="popover-comp-name" model-value="Ana Ribeiro" />
              <Label for="popover-comp-email" class="nds-text-caption">Email</Label>
              <Input id="popover-comp-email" type="email" model-value="ana@nortear.com.br" />
              <div class="nds-cluster" data-justify="end" data-spacing="sm">
                <PopoverClose as-child>
                  <Button variant="ghost" size="sm">Cancelar</Button>
                </PopoverClose>
                <Button type="submit" size="sm">Atualizar</Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Editar perfil/i });
    const closed = async () => {
      // Só LEITURA dentro do `waitFor`: condição que mexe no DOM reagenda a si
      // mesma pelo observador de mutação e pendura o arquivo inteiro.
      await waitFor(
        () => {
          if (panel()) throw new Error('popover ainda aberto');
        },
        { timeout: 2000 },
      );
    };

    await step('O formulário abre preenchido e pronto para edição', async () => {
      await waitForPortal('dialog');
      const ctx = within(panel()!);
      await expect(ctx.getByLabelText(/Nome/i)).toHaveValue('Ana Ribeiro');
      await expect(ctx.getByLabelText(/Email/i)).toHaveValue('ana@nortear.com.br');
    });

    await step('O Cancelar é a PEÇA de fechar, e fecha o painel', async () => {
      const cancelar = within(panel()!).getByRole('button', { name: /Cancelar/i });
      await expect(cancelar).toHaveAttribute('data-slot', 'popover-close');
      editProfileOpenChange.mockClear();
      await userEvent.click(cancelar);
      await closed();
      await expect(editProfileOpenChange).toHaveBeenLastCalledWith(false, 'close-button');
    });

    await step('E o Atualizar fecha pelo SUBMIT do formulário', async () => {
      // O fechamento mora no `@submit`, e não no clique: fechar no clique
      // desmontaria o formulário antes de ele submeter. O mesmo caminho é o que
      // atende o Enter num campo.
      await userEvent.click(trigger);
      await waitForPortal('dialog');
      const update = within(panel()!).getByRole('button', { name: /Atualizar/i });
      await expect(update).not.toHaveAttribute('data-slot', 'popover-close');
      editProfileOpenChange.mockClear();
      await userEvent.click(update);
      await closed();
      await expect(editProfileOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await userEvent.click(trigger);
      await expect(await waitForPortal('dialog')).toBeVisible();
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
    setup() {
      return { tableFilterOpenChange };
    },
    template: `
      <div class="nds-min-h-80" style="contain: layout">
        <Popover v-slot="{ close }" :default-open="true" @update:open="tableFilterOpenChange">
          <PopoverTrigger as-child>
            <Button variant="outline">Filtros</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
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
            <!-- Aplicar É a decisão: fecha por CÓDIGO depois de aplicar, com o
                 "close" do slot da raiz, e o motivo chega como api. Limpar
                 devolve a escolha a quem ainda está decidindo, e não fecha. -->
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <Button variant="ghost" size="sm">Limpar</Button>
              <Button size="sm" @click="close()">Aplicar</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Filtros/i });

    await step('Os três status são combináveis', async () => {
      // Precondição do replay: a story termina aberta, mas uma rodada que
      // morreu depois do Aplicar a deixaria fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await waitForPortal('dialog');
      const ctx = within(panel()!);
      await expect(ctx.getAllByRole('checkbox')).toHaveLength(3);
      await expect(ctx.getByLabelText(/Ativo/i)).toBeChecked();
    });

    await step('E marcar outro não fecha o painel', async () => {
      // Filtro é escolha múltipla: fechar no primeiro clique obrigaria a
      // reabrir para cada critério.
      const pendente = within(panel()!).getByLabelText(/Pendente/i);
      if (!(pendente as HTMLInputElement).checked) await userEvent.click(pendente);
      await expect(pendente).toBeChecked();
      await expect(panel()).toBeInTheDocument();
    });

    await step('Aplicar fecha o painel por CÓDIGO — motivo api', async () => {
      // Aplicar É a decisão: fecha pelo `close` do slot da raiz, e o motivo
      // chega como `api`, "concluiu" — nunca como a peça de fechar.
      const apply = within(panel()!).getByRole('button', { name: /Aplicar/i });
      await expect(apply).not.toHaveAttribute('data-slot', 'popover-close');
      tableFilterOpenChange.mockClear();
      await userEvent.click(apply);
      await waitFor(() => {
        if (panel()) throw new Error('popover ainda aberto');
      }, { timeout: 2000 });
      await expect(tableFilterOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await userEvent.click(trigger);
      await expect(await waitForPortal('dialog')).toBeVisible();
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
      <div class="nds-min-h-80" style="contain: layout">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Escolher cor da etiqueta</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
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
      const amostras = within(panel()!).getAllByRole('button');
      const names = amostras
        .map((b) => b.getAttribute('aria-label'))
        .filter((n): n is string => n !== null);
      await expect(names).toHaveLength(6);
      await expect(new Set(names).size).toBe(6);
    });

    await step('E o foco chega a cada uma por Tab', async () => {
      const ctx = within(panel()!);
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
      <div class="nds-min-h-80" style="contain: layout">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Configurações rápidas</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
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
      const ctx = within(panel()!);
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

export const SideTop: Story = {
  parameters: {
    covers: ['visual.item4'],
    // `padded` e não o `centered` do meta: com o conteúdo centrado na vertical,
    // o espaço acima do gatilho é metade do que SOBRA do viewport, e some ou
    // reaparece conforme a altura da janela. O passo que exige a virada mediria
    // o tamanho da tela, não o auto-flip. Ancorado ao topo, o segundo caso não
    // tem espaço acima em janela nenhuma — e é também o que o vanilla, que é a
    // referência, usa neste arquivo.
    layout: 'padded',
    docs: {
      // O painel muda de lado e ganha folga própria: `side` e `side-offset` não
      // aparecem em nenhuma outra story do arquivo.
      source: { transform: () => popoverAboveSource({ alignOffset: 8 }) },
      description: {
        story:
          'Posicionamento preferido side="top". Sem espaço acima, o painel faz auto-flip para baixo.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-stack" data-spacing="sm" data-align="center" style="contain: layout">
        <div class="nds-min-h-60" aria-hidden="true"></div>
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir acima</Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" :side-offset="12" :align-offset="8">
            <PopoverHeader>
              <PopoverTitle>Ancorado acima</PopoverTitle>
              <PopoverDescription>Sem espaço acima, o painel vira para baixo sozinho.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir acima/i });
    // O espaço acima é um IRMÃO de verdade, e não `data-split="last"`, que é o
    // que estava aqui até 2026-09-13 e não empurrava nada: aquele utilitário põe
    // `margin-top: auto` no ÚLTIMO filho, e o popover era filho único — ele já
    // era o último. É um nó estático do template, então mexer no `display` dele
    // pelo DOM não disputa com o Vue: nenhum render o reescreve.
    const spacer = () => canvasElement.querySelector<HTMLElement>('.nds-min-h-60')!;

    /**
     * Fecha e reabre o painel, para que a lib recalcule a colisão com a folga
     * que existe AGORA. Reabrir é o ponto: a posição é decidida na abertura.
     */
    async function reopen(): Promise<void> {
      if (panel()) {
        await userEvent.click(trigger);
        await waitForPortalGone('dialog');
      }
      await userEvent.click(trigger);
      await waitForPortal('dialog');
    }

    /**
     * Exige o lado NO ATRIBUTO e na GEOMETRIA — atributo que muda sozinho seria
     * markup mentindo sobre onde o painel ficou.
     *
     * Espera de RELÓGIO, e nunca `waitFor`. O comentário que estava aqui dizia
     * "só leitura pura aqui dentro", e descrevia a intenção, não o código:
     * `getBoundingClientRect()` FORÇA layout, que é mexer no DOM. Dentro do
     * `waitFor` isso não reprova — PENDURA: o observador de mutação reagenda a
     * própria tentativa, o prazo nunca chega, e o arquivo inteiro morre sem
     * resultado e sem falha. É latente, porque no caso feliz a primeira
     * tentativa assenta e ninguém vê.
     *
     * O laço abaixo tem prazo de verdade e não depende de mutação nenhuma para
     * tentar de novo; as asserções ficam FORA dele, onde podem reprovar.
     */
    async function expectSide(side: 'top' | 'bottom'): Promise<void> {
      const prazo = Date.now() + 2000;
      while (Date.now() < prazo) {
        const atual = panel();
        if (atual?.getAttribute('data-side') === side) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const dialog = panel();
      await expect(dialog).not.toBeNull();
      await expect(dialog!.getAttribute('data-side')).toBe(side);
      const rt = trigger.getBoundingClientRect();
      const rp = dialog!.getBoundingClientRect();
      // 12px pedidos, com 1px de folga para arredondamento sub-pixel.
      const distancia = side === 'top' ? rt.top - rp.bottom : rp.top - rt.bottom;
      await expect(Math.abs(distancia - 12)).toBeLessThanOrEqual(1);
    }

    await step('Com espaço acima, o painel abre EXATAMENTE no lado pedido', async () => {
      // Precondição própria: no replay o irmão pode ter ficado escondido.
      spacer().style.display = '';
      await reopen();
      await expectSide('top');
    });

    await step('E o alignOffset desloca o painel no outro eixo pela medida pedida', async () => {
      // D14: `alignOffset` desliza o painel no eixo CRUZADO. Positivo empurra
      // para a direita num lado vertical. 8px pedidos, com 1px de folga para
      // arredondamento sub-pixel — medir só "alinhado" passaria sem a prop.
      const rt = trigger.getBoundingClientRect();
      const rp = panel()!.getBoundingClientRect();
      const shift = (rp.left + rp.width / 2) - (rt.left + rt.width / 2);
      await expect(Math.abs(shift - 8)).toBeLessThanOrEqual(1);
    });

    // ─── O contrato C9, que esta story afirmava e não media ──────────────────
    //
    // A asserção anterior era `expect(['top','bottom']).toContain(data-side)`:
    // aceitava os dois lados, então passava com ou sem auto-flip. Este passo
    // tira o espaço, o painel deixa de caber acima, e o lado tem de virar.
    await step('Sem espaço acima, o painel VIRA para baixo e o markup acompanha', async () => {
      spacer().style.display = 'none';
      try {
        await reopen();
        await expectSide('bottom');
      } finally {
        spacer().style.display = '';
      }
    });

    // Termina ABERTA e no lado pedido: é o estado que o Chromatic fotografa, e
    // é o estado em que o próximo replay encontra a story.
    await step('Estado final: de volta ao lado pedido', async () => {
      await reopen();
      await expectSide('top');
    });
  },
};
