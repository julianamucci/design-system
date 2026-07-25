import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
        <Check class="" style="height: 0.75rem; width: 0.75rem" aria-hidden="true" />
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
        class="nds-cluster focus:outline-none nds-focus-ring nds-rounded-md"
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
        class="nds-cluster focus:outline-none nds-focus-ring nds-rounded-md"
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
        class="nds-cluster" style="position: relative"
        role="status"
        aria-label="12 notificações não lidas"
      >
        <Bell class="nds-text-foreground" style="height: 1.5rem; width: 1.5rem" aria-hidden="true" />
        <Badge
          variant="destructive"
          class="-top-2 -right-3 nds-px-1" data-justify="center" style="position: absolute; min-width: 1.25rem"
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
