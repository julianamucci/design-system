import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TabsStory from './TabsStory.svelte';
import {
  tabsAtivacaoManualSource,
  tabsConfigSource,
  tabsNavigationVerticalSource,
  tabsPreviewCodeSource,
  tabsSource,
} from './tabs.source';

const meta: Meta = {
  title: 'UI/Tabs/Compositions',
  component: TabsStory,
  tags: ['navigation'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: tabsSource },
    },
  },
};

export default meta;
type Story = StoryObj;

const list = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs-list"]')!;

const root = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs"]')!;

/**
 * Idempotente: clicar numa aba já ativa a MANTÉM ativa, então o par certo é
 * garantir o alvo e esperar o estado — o replay do painel Interactions parte do
 * estado que a rodada anterior deixou.
 */
const ativar = async (aba: HTMLElement) => {
  if (aba.getAttribute('aria-selected') !== 'true') await userEvent.click(aba);
  await waitFor(() => expect(aba).toHaveAttribute('aria-selected', 'true'));
};

export const SettingsPanel: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'profile',  label: 'Perfil',     content: 'Edite suas informações pessoais e foto de perfil.'   },
        { value: 'account',  label: 'Conta',      content: 'Gerencie email, senha e preferências de notificação.' },
        { value: 'security', label: 'Segurança',  content: 'Autenticação de dois fatores e sessões ativas.'      },
      ],
      defaultValue: 'profile',
      variant: 'default',
      ariaLabel: 'Configurações',
      class: 'nds-w-lg',
    },
  }),
  parameters: {
    docs: {
      source: { transform: tabsConfigSource },
      description: {
        story:
          'Painel de configurações com 3 seções paralelas: Perfil, Conta e Segurança. Rótulos ' +
          'curtos e descritivos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const perfil = canvas.getByRole('tab', { name: 'Perfil' });
    const count = canvas.getByRole('tab', { name: 'Conta' });

    await step('A fileira tem um nome acessível próprio da composição', async () => {
      // Sem nome, a mesma fileira aparece como "lista de abas" em toda tela que
      // usar o componente.
      await expect(canvas.getByRole('tablist', { name: 'Configurações' })).toBeInTheDocument();
      await expect(canvas.getAllByRole('tab')).toHaveLength(3);
    });

    await step('A aba inicial mostra o painel de Perfil', async () => {
      await ativar(perfil);
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
        'Edite suas informações pessoais',
      );
    });

    await step('A seta caminha pelas seções', async () => {
      perfil.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(count).toHaveFocus();
      await waitFor(() => expect(count).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Gerencie email');
    });

    await step('Home devolve o estado inicial', async () => {
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(perfil).toHaveAttribute('aria-selected', 'true'));
    });
  },
};

export const CodePreviewLine: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'preview', label: 'Preview', content: 'Visualização renderizada do componente.' },
        { value: 'code',    label: 'Código',  content: '<Button>Click me</Button>' },
      ],
      defaultValue: 'preview',
      variant: 'line',
      ariaLabel: 'Modos de visualização',
      class: 'nds-w-lg',
    },
  }),
  parameters: {
    docs: {
      source: { transform: tabsPreviewCodeSource },
      description: {
        story:
          'Alternância Preview/Código com a variante `line`. Padrão comum em documentação ' +
          'técnica e playgrounds.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const l = list(canvasElement);
    const preview = canvas.getByRole('tab', { name: 'Preview' });
    const code = canvas.getByRole('tab', { name: 'Código' });

    await step('A composição usa a variante sem trilho', async () => {
      await waitFor(() => expect(l).toHaveAttribute('data-variant', 'line'));
      await expect(getComputedStyle(l).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    await step('A linha marca só a aba ativa', async () => {
      await ativar(preview);
      // A linha é um `::after` com `opacity`: procurar um nó no DOM não acharia
      // nada. O `waitFor` existe porque a opacidade tem transição.
      await waitFor(() => expect(getComputedStyle(preview, '::after').opacity).toBe('1'));
      await expect(getComputedStyle(code, '::after').opacity).toBe('0');
    });

    await step('Trocar para Código troca o painel', async () => {
      await ativar(code);
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('<Button>Click me</Button>');
      await expect(preview).toHaveAttribute('aria-selected', 'false');
    });

    await step('Voltar para Preview devolve o estado inicial', async () => {
      await ativar(preview);
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Visualização renderizada');
    });
  },
};

export const VerticalNavigation: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'overview',   label: 'Visão geral',  content: 'Resumo executivo do projeto.'    },
        { value: 'properties', label: 'Propriedades', content: 'Lista completa de propriedades.' },
        { value: 'examples',   label: 'Exemplos',     content: 'Exemplos práticos de uso.'       },
        { value: 'api',        label: 'API',          content: 'Referência completa da API.'     },
      ],
      defaultValue: 'overview',
      orientation: 'vertical',
      variant: 'default',
      ariaLabel: 'Documentação',
      class: 'nds-w-lg',
    },
  }),
  parameters: {
    docs: {
      source: { transform: tabsNavigationVerticalSource },
      description: {
        story:
          'Layout vertical para navegação lateral em painéis amplos. As setas de cima e de baixo ' +
          'são as teclas de navegação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });
    const api = canvas.getByRole('tab', { name: 'API' });

    await step('A orientação chega à raiz e ao tablist', async () => {
      await waitFor(() =>
        expect(root(canvasElement)).toHaveAttribute('data-orientation', 'vertical'),
      );
      await expect(list(canvasElement)).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('No eixo vertical quem navega é a seta para baixo', async () => {
      await ativar(visaoGeral);
      visaoGeral.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(propriedades).toHaveFocus();
      await waitFor(() => expect(propriedades).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Lista completa de propriedades');
    });

    await step('End alcança a última seção e Home devolve a primeira', async () => {
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(api).toHaveAttribute('aria-selected', 'true'));
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(visaoGeral).toHaveAttribute('aria-selected', 'true'));
    });
  },
};

export const ManualActivation: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'overview',   label: 'Visão geral',  content: 'Conteúdo da visão geral.' },
        { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.'   },
        { value: 'examples',   label: 'Exemplos',     content: 'Exemplos de uso.'         },
      ],
      defaultValue: 'overview',
      activationMode: 'manual',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  // Sem `covers`: `functional.item2` documenta que a seta ANDA E ATIVA, e esta
  // story prova exatamente o contrário — aqui a seta só move o foco. Declará-lo
  // seria cobertura fantasma, com o auditor verde sobre uma prova invertida.
  parameters: {
    docs: {
      source: { transform: tabsAtivacaoManualSource },
      description: {
        story:
          'Modo manual: as setas movem o foco sem trocar de aba, e Enter ou Espaço confirmam. ' +
          'Vale quando abrir um painel custa caro — passar por três abas com a seta faria três ' +
          'buscas que ninguém pediu.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });

    await step('O ponto de partida é a primeira aba', async () => {
      // O clique ativa em qualquer modo — é ele que normaliza o estado antes da
      // prova, e é o que torna esta play idempotente no replay.
      await ativar(visaoGeral);
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Conteúdo da visão geral');
    });

    await step('A seta move o foco SEM trocar a aba', async () => {
      visaoGeral.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(propriedades).toHaveFocus();
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Conteúdo da visão geral');
    });

    await step('Enter ativa a aba focada', async () => {
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(propriedades).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Lista de propriedades');
    });

    await step('Espaço confirma do mesmo jeito', async () => {
      const exemplos = canvas.getByRole('tab', { name: 'Exemplos' });
      propriedades.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(exemplos).toHaveAttribute('aria-selected', 'false');
      await userEvent.keyboard(' ');
      await waitFor(() => expect(exemplos).toHaveAttribute('aria-selected', 'true'));
    });

    await step('O estado volta ao inicial', async () => {
      await ativar(visaoGeral);
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
    });
  },
};
