import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent, NdsTabsIcon } from './tabs';
import { NdsBadge } from './badge';

const meta: Meta = {
  title: 'UI/Tabs/Composições',
  tags: ['navigation'],
  decorators: [
    moduleMetadata({
      imports: [NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent, NdsTabsIcon, NdsBadge],
    }),
  ],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Combinações canônicas dentro do trigger. Em todas elas o rótulo textual continua ' +
          'sendo o que nomeia a aba — o ícone e o badge são reforço visual, e nenhum dos dois ' +
          'recebe foco próprio.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithIcons: Story = {
  parameters: { covers: ['accessibility.item4'] },
  render: () => ({
    template: `
      <div ndsTabs class="nds-max-w-lg" defaultValue="profile">
        <div ndsTabsList aria-label="Configurações">
          <button ndsTabsTrigger value="profile">
            <svg ndsTabsIcon kind="user"></svg>
            Perfil
          </button>
          <button ndsTabsTrigger value="account">
            <svg ndsTabsIcon kind="settings"></svg>
            Conta
          </button>
          <button ndsTabsTrigger value="security">
            <svg ndsTabsIcon kind="shield"></svg>
            Segurança
          </button>
        </div>
        <div ndsTabsContent value="profile" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="account" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="security" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível é só o rótulo — o ícone não entra', async () => {
      // `getByRole` com `name` exato é a prova: se o SVG fosse anunciado, o nome
      // teria mais que a palavra, e a busca falharia.
      await expect(canvas.getByRole('tab', { name: 'Perfil' })).toBeTruthy();
      await expect(canvas.getByRole('tab', { name: 'Segurança' })).toBeTruthy();
    });

    await step('Cada ícone está marcado como decorativo', async () => {
      const icones = canvasElement.querySelectorAll('[data-slot="tabs-trigger"] svg');
      await expect(icones).toHaveLength(3);
      for (const icone of icones) {
        await expect(icone.getAttribute('aria-hidden')).toBe('true');
        // O `effect` do ícone monta os filhos por createElementNS — svg vazio
        // seria um ícone que não desenhou nada e ninguém veria falhar.
        await expect(icone.childElementCount).toBeGreaterThan(0);
      }
    });

    await step('O ícone não intercepta o clique na aba', async () => {
      // `pointer-events: none` no SVG é o que faz o clique cair sempre no
      // botão: sem isso, um clique em cima do desenho teria o próprio SVG como
      // alvo. Idempotente — clicar numa aba já ativa a mantém ativa.
      const conta = canvas.getByRole('tab', { name: 'Conta' });
      await expect(getComputedStyle(conta.querySelector('svg')!).pointerEvents).toBe('none');
      await userEvent.click(conta);
      const selecionada = conta.getAttribute('aria-selected');
      await expect(selecionada).toBe('true');
    });
  },
};

export const WithBadge: Story = {
  parameters: { covers: ['functional.item1'] },
  render: () => ({
    template: `
      <div ndsTabs class="nds-max-w-lg" defaultValue="overview">
        <div ndsTabsList aria-label="Seções do componente">
          <button ndsTabsTrigger value="overview">Visão geral</button>
          <button ndsTabsTrigger value="properties">
            Propriedades
            <span ndsBadge variant="secondary">12</span>
          </button>
          <button ndsTabsTrigger value="examples">
            Exemplos
            <span ndsBadge variant="info">Beta</span>
          </button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="properties" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="examples" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O badge entra no nome da aba, e não como controle separado', async () => {
      // A contagem faz parte do que a aba significa ("Propriedades, 12"), então
      // ela deve ser LIDA junto. O que não pode é virar um segundo alvo de foco.
      const aba = canvas.getByRole('tab', { name: /Propriedades/ });
      const badge = aba.querySelector('[data-slot="badge"]')!;
      await expect(badge.getAttribute('tabindex')).toBeNull();
      await expect(badge.getAttribute('role')).toBeNull();
      await expect(canvas.getAllByRole('tab')).toHaveLength(3);
    });

    await step('Clicar na aba com badge troca o painel', async () => {
      // Idempotente: repetir o clique mantém a mesma aba ativa.
      const aba = canvas.getByRole('tab', { name: /Propriedades/ });
      await userEvent.click(aba);
      const estado = aba.getAttribute('data-state');
      await expect(estado).toBe('active');
      await expect(canvas.getByRole('tabpanel').textContent).toContain('Lista de propriedades');
    });
  },
};
