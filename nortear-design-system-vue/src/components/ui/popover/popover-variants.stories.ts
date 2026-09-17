import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
import { waitForPortal } from '@/lib/wait-for-portal';
import { panel } from './popover.fixtures';
import {
  popoverWithTitleSource,
  popoverContentLivreSource,
  popoverFormSource,
} from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/Popover/Variants',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: popoverContentLivreSource },
      description: {
        component:
          'Conteúdo livre, cabeçalho com título e descrição, e formulário inline. O painel sempre precisa de nome acessível: com título ele vem do aria-labelledby, sem título ele é declarado por aria-label.',
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

export const Default: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Conteúdo livre — apenas PopoverContent com texto. Sem título, o painel declara o próprio nome por aria-label.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-60" style="contain: layout">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Ver atalhos</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" aria-label="Informações adicionais">
            <p>Use Ctrl+K para abrir a busca em qualquer tela.</p>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('Sem título, o painel se nomeia por aria-label', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe. E o
      // `aria-labelledby` que a lib crava no gatilho tem de ter saído: com ele
      // de pé o leitor de tela anunciaria o botão, não o painel.
      // Espera pelo NOME, não só pelo portal. A reka crava o `aria-labelledby`
      // do gatilho por último e o `PopoverContent` o arranca depois — e só
      // consegue quando o `$el` do `Presence` deixa de ser comentário e vira nó,
      // o que leva um quadro ou dois. Pedir o portal e afirmar o nome no mesmo
      // instante media a janela ANTES da correção: medido em 2026-09-05, o nome
      // recebido era "Ver atalhos", o rótulo do gatilho. O `name` do helper
      // reagenda até assentar, e as asserções seguintes viram leitura simples.
      const dialog = await waitForPortal('dialog', { name: 'Informações adicionais' });
      await expect(dialog).toHaveAccessibleName('Informações adicionais');
      await expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    await step('E carrega a classe do design system com o conteúdo livre', async () => {
      await expect(panel()).toHaveClass(/nds-popover-content/);
      await expect(panel()!.textContent).toMatch(/Ctrl\+K/);
    });
  },
};

export const WithTitle: Story = {
  parameters: {
    covers: [
      'visual.item2', 'accessibility.item5', 'accessibility.item3', 'functional.item4',
    ],
    docs: {
      // Entram três peças que o meta não tem — Header, Title e Description —, e
      // é o título que passa a nomear o painel.
      source: { transform: popoverWithTitleSource },
      description: {
        story: 'Header completo — PopoverHeader com Title + Description e botões de ação (Cancelar / Salvar).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="nds-min-h-70" style="contain: layout">
        <Popover v-slot="{ close }" :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Configurações</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Configurações de exibição</PopoverTitle>
              <PopoverDescription>
                Ajuste a aparência do conteúdo da página.
              </PopoverDescription>
            </PopoverHeader>
            <!-- Cancelar é a PEÇA de fechar (motivo close-button); Salvar fecha
                 por CÓDIGO, com o "close" do slot da raiz (motivo api). -->
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <PopoverClose as-child>
                <Button variant="ghost" size="sm">Cancelar</Button>
              </PopoverClose>
              <Button size="sm" @click="close()">Salvar</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ step }) => {
    await step('O título nomeia o painel por aria-labelledby', async () => {
      const dialog = await waitForPortal('dialog');
      const id = dialog.getAttribute('aria-labelledby');
      await expect(id).toBeTruthy();
      const title = document.getElementById(id!)!;
      await expect(title).toHaveAttribute('data-slot', 'popover-title');
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(dialog).toHaveAccessibleName(/Configurações de exibição/i);
    });

    await step('A descrição entra por aria-describedby', async () => {
      // D12: o painel aponta `aria-describedby` para o id da descrição. Nesta
      // stack quem escreve o atributo é o `PopoverDescription.vue`, porque a
      // reka não tem peça de descrição.
      const dialog = panel()!;
      const idDescription = dialog.getAttribute('aria-describedby');
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveClass(/nds-popover-description/);
    });

    await step('Tab caminha entre os controles internos', async () => {
      const ctx = within(panel()!);
      const cancelar = ctx.getByRole('button', { name: /Cancelar/i });
      const save = ctx.getByRole('button', { name: /Salvar/i });
      cancelar.focus();
      await userEvent.tab();
      await expect(save).toHaveFocus();
    });

    await step('E o elemento focado por teclado mostra o anel de foco', async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      const save = within(panel()!).getByRole('button', { name: /Salvar/i });
      await expect(save.matches(':focus-visible')).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(save).boxShadow).not.toBe('none');
    });
  },
};

/**
 * Espião do `update:open` da `Form`. No módulo, e não no `setup`: criado lá,
 * a play não o alcançaria. É ele que diz que o formulário fechou por CÓDIGO
 * (`api`) — o painel sumir sozinho passaria com qualquer motivo.
 */
const formOpenChange = fn();

export const Form: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // O painel passa a guardar conteúdo interativo com estado próprio: campos,
      // rótulos e submit não aparecem em nenhuma outra story do arquivo.
      source: { transform: popoverFormSource },
      description: {
        story: 'Formulário inline — Inputs e botão submit dentro do PopoverContent.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { formOpenChange };
    },
    template: `
      <div class="nds-min-h-90" style="contain: layout">
        <Popover v-slot="{ close }" :default-open="true" @update:open="formOpenChange">
          <PopoverTrigger as-child>
            <Button variant="outline">Editar perfil</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
            <PopoverHeader>
              <PopoverTitle>Editar perfil</PopoverTitle>
            </PopoverHeader>
            <!-- O formulário fecha por CÓDIGO ao salvar, e o fechamento vai no
                 SUBMIT — nunca no clique do "Atualizar": fechar no clique
                 desmontaria o formulário antes de ele submeter, e só este
                 caminho cobre também o Enter num campo, que é como metade das
                 pessoas envia formulário. -->
            <form class="nds-stack" data-spacing="sm" @submit.prevent="close()">
              <Label for="popover-var-name" class="nds-text-caption">Nome</Label>
              <Input id="popover-var-name" model-value="Ana Ribeiro" />
              <Label for="popover-var-email" class="nds-text-caption">Email</Label>
              <Input id="popover-var-email" type="email" model-value="ana@nortear.com.br" />
              <Button type="submit" size="sm">Atualizar</Button>
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

    await step('Os campos existem e estão associados aos rótulos', async () => {
      await waitForPortal('dialog');
      const ctx = within(panel()!);
      await expect(ctx.getByLabelText(/Nome/i)).toHaveValue('Ana Ribeiro');
      await expect(ctx.getByRole('button', { name: /Atualizar/i })).toBeInTheDocument();
    });

    await step('E aceitam digitação — o painel não é inerte', async () => {
      // Conteúdo interativo dentro do painel é a razão de existir do popover.
      const name = within(panel()!).getByLabelText(/Nome/i);
      await userEvent.clear(name);
      await userEvent.type(name, 'Bruno Lima');
      await expect(name).toHaveValue('Bruno Lima');
    });

    await step('Enter num campo envia o formulário e fecha o painel', async () => {
      // É por isto que o fechamento mora no `submit`, e não no clique do
      // "Atualizar": metade das pessoas envia formulário pelo teclado, e o
      // caminho do clique não cobriria este gesto.
      const name = within(panel()!).getByLabelText(/Nome/i);
      name.focus();
      formOpenChange.mockClear();
      await userEvent.keyboard('{Enter}');
      await closed();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // Fechou por CÓDIGO: o motivo é `api`, "concluiu".
      await expect(formOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    await step('E o "Atualizar" fecha pelo mesmo caminho', async () => {
      await userEvent.click(trigger);
      await waitForPortal('dialog');
      formOpenChange.mockClear();
      await userEvent.click(within(panel()!).getByRole('button', { name: /Atualizar/i }));
      await closed();
      await expect(formOpenChange).toHaveBeenLastCalledWith(false, 'api');
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await userEvent.click(trigger);
      await expect(await waitForPortal('dialog')).toBeVisible();
    });
  },
};
