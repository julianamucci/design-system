import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './index';

const meta = {
  title: 'UI/Accordion/Modos',
  component: Accordion,
  args: {
    type: 'single',
    collapsible: true,
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { value: 'item-1', trigger: 'Seção 1', content: 'Conteúdo da primeira seção do accordion.' },
  { value: 'item-2', trigger: 'Seção 2', content: 'Conteúdo da segunda seção do accordion.' },
  { value: 'item-3', trigger: 'Seção 3', content: 'Conteúdo da terceira seção do accordion.' },
];

// ─── Single (collapsible) ─────────────────────────────────────────────────────

export const Single: Story = {
  args: { type: 'single', collapsible: true },
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args, items }; },
    template: `
      <Accordion v-bind="args" class="w-full max-w-md">
        <AccordionItem v-for="item in items" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.trigger }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo single com collapsible. Apenas um item pode estar aberto por vez; clicar no item aberto o fecha.',
      },
    },
  },
};

// ─── Single sem collapsible ───────────────────────────────────────────────────

export const SingleNoCollapsible: Story = {
  name: 'Single sem Collapsible',
  args: { type: 'single', collapsible: false },
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args, items }; },
    template: `
      <Accordion v-bind="args" class="w-full max-w-md">
        <AccordionItem v-for="item in items" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.trigger }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo single sem collapsible — sempre mantém um item aberto. Clicar no item ativo não o fecha.',
      },
    },
  },
};

// ─── Multiple ─────────────────────────────────────────────────────────────────

export const Multiple: Story = {
  args: { type: 'multiple' },
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args, items }; },
    template: `
      <Accordion v-bind="args" class="w-full max-w-md">
        <AccordionItem v-for="item in items" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.trigger }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo multiple — vários itens podem estar abertos simultaneamente. Ideal para FAQs e listas de configurações.',
      },
    },
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  args: { type: 'single', collapsible: true },
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() {
      const openItem = ref('item-1');
      function handleUpdate(val: string | string[]) {
        openItem.value = Array.isArray(val) ? val[0] : val;
      }
      return { openItem, handleUpdate, items };
    },
    template: `
      <div class="space-y-4 w-full max-w-md">
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="item in items"
            :key="item.value"
            @click="openItem = item.value"
            class="px-3 py-1 text-sm rounded border hover:bg-muted transition-colors"
            :class="openItem === item.value ? 'bg-primary text-primary-foreground border-primary' : ''"
          >
            {{ item.trigger }}
          </button>
        </div>
        <Accordion
          type="single"
          :collapsible="true"
          :model-value="openItem"
          @update:model-value="handleUpdate"
          class="w-full"
        >
          <AccordionItem v-for="item in items" :key="item.value" :value="item.value">
            <AccordionTrigger>{{ item.trigger }}</AccordionTrigger>
            <AccordionContent>{{ item.content }}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo controlado com v-model. O estado é gerenciado externamente — os botões acima controlam qual item está aberto.',
      },
    },
  },
};
