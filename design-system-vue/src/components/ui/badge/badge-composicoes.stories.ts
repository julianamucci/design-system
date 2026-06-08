import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Badge } from './index';
import { Check, Bell } from 'lucide-vue-next';

const meta = {
  title: 'UI/Badge/Composicoes',
  component: Badge,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Composicoes do Badge: com ícone, envolvido em link, envolvido em button e usado como contador.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => ({
    components: { Badge, Check },
    setup() { return {}; },
    template: `
      <Badge>
        <Check class="h-3 w-3" aria-hidden="true" />
        Ativo
      </Badge>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const AsLink: Story = {
  render: () => ({
    components: { Badge },
    setup() { return {}; },
    template: `
      <a
        href="#filtro-design"
        aria-label="Filtrar conteúdo pela categoria Design"
        class="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
      >
        <Badge variant="secondary">Design</Badge>
      </a>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const AsButton: Story = {
  render: () => ({
    components: { Badge },
    setup() { return {}; },
    template: `
      <button
        type="button"
        aria-label="Remover tag React"
        class="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
      >
        <Badge variant="outline">React</Badge>
      </button>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const CountBadge: Story = {
  render: () => ({
    components: { Badge, Bell },
    setup() { return {}; },
    template: `
      <div
        class="relative inline-flex"
        role="status"
        aria-label="12 notificações não lidas"
      >
        <Bell class="h-6 w-6 text-foreground" aria-hidden="true" />
        <Badge
          variant="destructive"
          class="absolute -top-2 -right-3 min-w-[1.25rem] justify-center px-1"
        >
          12
        </Badge>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
