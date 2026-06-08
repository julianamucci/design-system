import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/HoverCard/Composicoes',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais: PerfilDeUsuario (avatar + bio + métrica), PreviewDeLink (favicon + URL + título), DefinicaoDeTermo (texto explicativo curto), MetricaExplicada (KPI + descrição).',
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { HoverCard, HoverCardContent, HoverCardTrigger };

export const PerfilDeUsuario: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Preview de perfil ao passar em @username — avatar, nome e métrica social.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;">
        <HoverCard :default-open="true" :open-delay="0" :close-delay="0">
          <HoverCardTrigger as-child>
            <a href="#" class="font-medium text-primary underline-offset-4 hover:underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start">
            <div class="flex gap-3">
              <div class="size-10 rounded-full bg-muted" aria-hidden="true"></div>
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none">Joana Silva</p>
                <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                <p class="text-xs">Trabalha com sistemas de design desde 2019.</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(body.getByText(/Joana Silva/i)).toBeVisible();
  },
};

export const PreviewDeLink: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Preview de link externo — favicon, URL e título da página.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 220px;">
        <HoverCard :default-open="true" :open-delay="0" :close-delay="0">
          <HoverCardTrigger as-child>
            <a href="#" class="font-medium text-primary underline-offset-4 hover:underline">design-system.dev</a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start" class="w-72">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="size-4 rounded bg-muted" aria-hidden="true"></div>
                <span class="text-xs text-muted-foreground truncate">design-system.dev</span>
              </div>
              <p class="text-sm font-medium leading-snug">Design System — Documentação técnica</p>
              <p class="text-xs text-muted-foreground">Componentes acessíveis em React, Vue, Svelte e Basecoat.</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(body.getByText(/design-system.dev/i)).toBeVisible();
  },
};

export const DefinicaoDeTermo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Definição contextual de termo técnico — texto explicativo curto.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 220px;">
        <p class="text-sm">
          O conteúdo é renderizado em um
          <HoverCard :default-open="true" :open-delay="0" :close-delay="0">
            <HoverCardTrigger as-child>
              <a href="#" class="font-medium text-primary underline-offset-4 underline decoration-dotted">portal</a>
            </HoverCardTrigger>
            <HoverCardContent side="top" align="center">
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none">Portal</p>
                <p class="text-xs text-muted-foreground">
                  Técnica do React/Vue para renderizar um elemento fora da hierarquia DOM do componente pai, geralmente em <code>document.body</code>, evitando problemas de overflow e z-index.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
          para evitar problemas de overflow.
        </p>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
  },
};

export const MetricaExplicada: Story = {
  parameters: {
    docs: {
      description: {
        story: 'KPI em dashboard com explicação detalhada — fórmula e janela temporal.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;">
        <HoverCard :default-open="true" :open-delay="0" :close-delay="0">
          <HoverCardTrigger as-child>
            <a href="#" class="inline-flex items-baseline gap-1 font-medium text-primary underline-offset-4 underline decoration-dotted">
              <span class="text-2xl">87%</span>
              <span class="text-xs">CSAT</span>
            </a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start" class="w-72">
            <div class="space-y-1">
              <p class="text-sm font-medium leading-none">CSAT (Customer Satisfaction)</p>
              <p class="text-xs text-muted-foreground">
                Percentual de respostas com nota 4 ou 5 (escala 1-5) nas últimas 30 dias. Base: 1.248 respostas.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(body.getByText(/CSAT/i)).toBeVisible();
  },
};
