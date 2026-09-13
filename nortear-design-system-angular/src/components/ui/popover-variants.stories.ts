import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, screen } from 'storybook/test';
import { NDS_POPOVER } from './popover';
import { open, panel } from './popover.fixtures';
import { popoverFormSource } from './popover.source';
import { NdsButton } from './button';
import { NdsInput } from './input';
import { NdsLabel } from './label';

import { figmaDesign } from '@shared/figma/design-links';
// As três formas canônicas do painel, na ordem em que o conteúdo compartilhado
// as descreve: conteúdo livre, cabeçalho com título e descrição, e formulário
// inline. Nenhuma acrescenta API — todas são arranjo de conteúdo dentro do
// mesmo `<ng-template ndsPopoverContent>`.

const meta: Meta = {
  title: 'Components/Overlay/Popover/Variants',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_POPOVER, NdsButton, NdsInput, NdsLabel] })],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Conteúdo livre, cabeçalho com título e descrição, e formulário inline. ' +
          'O painel sempre precisa de nome acessível: com título ele vem do ' +
          'aria-labelledby, sem título ele é declarado por aria-label.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">Ver atalhos</button>

        <ng-template ndsPopoverContent ariaLabel="Informações adicionais">
          <p>
            Use <kbd class="nds-kbd">Ctrl</kbd> + <kbd class="nds-kbd">K</kbd> para abrir a
            busca em qualquer tela.
          </p>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Ver atalhos' });

    await step('Sem título, o painel se nomeia por aria-label', async () => {
      // `role="dialog"` sem nome reprova na regra aria-dialog-name do axe. O
      // Vanilla resolve assim, e este stack copia: sem `ndsPopoverTitle`, o
      // nome do painel se DECLARA — herdar o do gatilho anunciaria o botão.
      await open(trigger);
      const dialogo = screen.getByRole('dialog', { name: 'Informações adicionais' });
      await expect(dialogo).toBeVisible();
      await expect(dialogo).not.toHaveAttribute('aria-labelledby');
    });

    await step('O painel carrega a classe do design system', async () => {
      await expect(panel()).toHaveClass(/nds-popover-content/);
    });
  },
};

export const WithTitle: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item5'] },
  render: () => ({
    // Estado controlado só por causa do rodapé: o "Salvar" fecha por CÓDIGO, e
    // é isso que faz o motivo chegar como `api` em vez de `close-button`.
    props: { isOpen: false },
    template: `
      <div ndsPopover [(open)]="isOpen">
        <button ndsPopoverTrigger ndsButton variant="outline">Configurações de exibição</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h2 ndsPopoverTitle>Configurações de exibição</h2>
            <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <!-- Cancelar é a peça de fechar: desistiu, motivo close-button. -->
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
            <!-- Salvar fecha por código: concluiu, motivo api. -->
            <button ndsButton size="sm" (click)="isOpen = false">Salvar</button>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Configurações de exibição' });

    await step('O título nomeia o painel por aria-labelledby', async () => {
      await open(trigger);
      const dialogo = screen.getByRole('dialog');
      const idTitle = dialogo.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();
      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveAttribute('data-slot', 'popover-title');
      await expect(title).toHaveClass(/nds-popover-title/);
      await expect(title.textContent?.trim()).toBe('Configurações de exibição');
    });

    await step('A descrição entra por aria-describedby', async () => {
      const dialogo = screen.getByRole('dialog');
      const idDescription = dialogo.getAttribute('aria-describedby');
      await expect(idDescription).toBeTruthy();
      await expect(document.getElementById(idDescription!)).toHaveClass(/nds-popover-description/);
    });

    await step('O cabeçalho é um agrupador com classe própria', async () => {
      await expect(
        panel()!.querySelector('[data-slot="popover-header"]'),
      ).toHaveClass(/nds-popover-header/);
    });
  },
};

export const Form: Story = {
  parameters: {
    covers: ['visual.item3'],
    // O painel Code do formulário tem de ensinar a MESMA forma que o preview:
    // o fechamento no `(submit)`, e não no clique da ação primária.
    docs: { source: { transform: popoverFormSource } },
  },
  render: () => ({
    // Controlada por causa do "Atualizar": ele fecha por CÓDIGO depois de
    // gravar, e é isso que faz o motivo chegar como `api`. Marcado com
    // `ndsPopoverClose` ele reportaria `close-button`, que é o motivo de quem
    // desistiu — e o "Cancelar" ao lado é justamente esse caminho.
    props: { isOpen: false },
    template: `
      <div ndsPopover [(open)]="isOpen">
        <button ndsPopoverTrigger ndsButton variant="outline">Editar perfil</button>

        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h2 ndsPopoverTitle>Editar perfil</h2>
            <p ndsPopoverDescription>Altere o nome e o email da conta.</p>
          </div>

          <!-- Fechar mora AQUI, no submit, e não no clique de "Atualizar":
               fechar no clique desmontaria o formulário antes de ele enviar, e
               só o caminho do submit cobre também o Enter num campo, que é como
               metade das pessoas envia formulário. -->
          <form
            class="nds-stack"
            data-spacing="md"
            (submit)="$event.preventDefault(); isOpen = false"
          >
            <div class="nds-stack" data-spacing="xs">
              <label ndsLabel for="pv-form-nome">Nome</label>
              <input ndsInput id="pv-form-nome" value="Ana Ribeiro" />
            </div>

            <div class="nds-stack" data-spacing="xs">
              <label ndsLabel for="pv-form-email">Email</label>
              <input ndsInput id="pv-form-email" type="email" value="ana@nortear.com.br" />
            </div>

            <!-- Os dois fecham, por CAMINHOS diferentes: "Cancelar" é a peça de
                 fechar (close-button, desistiu) e "Atualizar" é submit do form,
                 que fecha por código (api, concluiu). Marcá-lo com
                 ndsPopoverClose apagaria a diferença e ainda tiraria o Enter. -->
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
              <button ndsButton type="submit" size="sm">Atualizar</button>
            </div>
          </form>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Editar perfil' });

    await step('Os campos existem e estão associados aos rótulos', async () => {
      await open(trigger);
      const name = screen.getByLabelText('Nome');
      const email = screen.getByLabelText('Email');
      await expect(name).toHaveValue('Ana Ribeiro');
      await expect(email).toHaveValue('ana@nortear.com.br');
    });

    await step('E aceitam digitação — o painel não é inerte', async () => {
      // Conteúdo interativo dentro do painel é a razão de existir do popover.
      // Se o portal renderizasse fora de qualquer contexto de eventos, a
      // digitação abaixo não mudaria nada.
      const name = screen.getByLabelText('Nome') as HTMLInputElement;
      await userEvent.clear(name);
      await userEvent.type(name, 'Bruno Lima');
      await expect(name).toHaveValue('Bruno Lima');
    });

    await step('Enter num campo envia o formulário e fecha o painel', async () => {
      // O gesto que o clique não cobre: quem digitou um valor aperta Enter. Com
      // o fechamento pendurado no clique de "Atualizar", este caminho deixaria
      // o painel aberto depois de gravar.
      await userEvent.type(screen.getByLabelText('Nome'), '{Enter}');
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });

    await step('E "Atualizar" fecha por código, não pela peça de fechar', async () => {
      await open(trigger);
      const update = screen.getByRole('button', { name: 'Atualizar' });
      await expect(update).not.toHaveAttribute('data-slot', 'popover-close');
      await expect(update).toHaveAttribute('type', 'submit');
      await userEvent.click(update);
      await waitFor(async () => {
        await expect(panel()).toBeNull();
      });
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await open(trigger);
      await expect(panel()).toBeInTheDocument();
    });
  },
};
