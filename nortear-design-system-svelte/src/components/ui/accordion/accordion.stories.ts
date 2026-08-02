import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { Accordion } from './index';
import AccordionStory from './AccordionStory.svelte';
import AccordionDocs from '@/components/docs/AccordionDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type AccordionArgs = {
  type: 'single' | 'multiple';
  disabled: boolean;
  loop: boolean;
};

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(AccordionDocs) },
  },
  // A aba "API Reference" é montada só a partir destes argTypes: o docgen do
  // Svelte está desligado no .storybook/main.ts (analisar ~447 .svelte custava
  // ~4,6 min de build). Sem declarar a API aqui, a tabela sai com uma linha só.
  // Props sem control são documentação: o wrapper da story não as encaminha,
  // e control ativo sem fiação vira controle morto.
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Define se um ou múltiplos itens podem estar abertos.',
      table: { type: { summary: "'single' | 'multiple'" }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens de uma vez.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loop: {
      control: 'boolean',
      description: 'Faz a navegação por setas voltar ao primeiro item após o último.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    value: {
      control: false,
      // Não repete aqui por que não existe defaultValue: a tabela de props da
      // docs page é o único lugar que explica as ausências desta stack.
      description: 'Item(ns) aberto(s), bindable com bind:value. Define também o estado inicial.',
      table: { type: { summary: 'string | string[]' }, defaultValue: { summary: "'' | []" } },
    },
    onValueChange: {
      control: false,
      description: 'Callback disparado quando o valor muda.',
      table: { type: { summary: '(value: string | string[]) => void' } },
    },
    orientation: {
      control: false,
      description: 'Eixo de navegação por teclado.',
      table: { type: { summary: "'vertical' | 'horizontal'" }, defaultValue: { summary: "'vertical'" } },
    },
    class: {
      control: false,
      description: 'Classes adicionais no elemento raiz. Esta stack usa class, não className.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    type: 'single',
    disabled: false,
    loop: true,
    onValueChange: fn(),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  // O gerador de source do @storybook/svelte monta a tag a partir de
  // `component.__docgen.name` e, sem docgen, cai em `component.name` — o nome
  // interno da função compilada. Daí saía `<wrapper type="single" …/>`, que não
  // é um componente que alguém possa importar. Além disso ele serializa os
  // `args` da raiz sobre o componente-wrapper da story, misturando duas coisas.
  // Enquanto o docgen estiver desligado, o snippet vai explícito.
  // `transform` e não `code`: um snippet fixo deixaria de acompanhar os
  // controls (trocar type para multiple não mudaria nada na caixa de código).
  parameters: {
    covers: [
      'functional.item1', 'functional.item3', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4', 'accessibility.item6',
      'visual.item1',
    ],
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: Partial<AccordionArgs> }) => {
          const { type = 'single', disabled = false, loop = true } = ctx.args ?? {};
          const multiple = type === 'multiple';
          const attrs = [
            `type="${type}"`,
            'bind:value',
            disabled ? 'disabled' : '',
            loop ? '' : 'loop={false}',
            'class="nds-max-w-lg"',
          ].filter(Boolean).join(' ');
          return `<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";

  let value = $state(${multiple ? '["item-1"]' : '"item-1"'});
</script>

<Accordion ${attrs}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Como faço para redefinir minha senha?</AccordionTrigger>
    <AccordionContent>
      Acesse a tela de login e clique em "Esqueci minha senha".
    </AccordionContent>
  </AccordionItem>
</Accordion>`;
        },
      },
    },
  },
  render: (args) => ({
    Component: AccordionStory,
    props: {
      type: args.type,
      disabled: args.disabled,
      loop: args.loop,
      onValueChange: args.onValueChange,
      defaultValue: 'item-1',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A raiz registra o modo recebido', async () => {
      const root = canvasElement.querySelector('[data-slot="accordion"]');
      await expect(root).toHaveAttribute('data-type', args.type);
    });

    await step('Item 1 começa aberto', async () => {
      const triggers = canvas.getAllByRole('button');
      await waitFor(
        () => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'),
        { timeout: 500 }
      );
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger fechado abre o item', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      // A aba Actions só se popula se o callback chegar ao componente.
      await expect(args.onValueChange).toHaveBeenCalled();
    });

    await step('Conteúdo aberto fica de fato visível, com altura real', async () => {
      // aria-expanded sozinho não prova que o painel apareceu: já houve
      // regressão em que o trigger reportava aberto e o conteúdo ficava
      // colapsado (altura vinda de custom property defasada da lib).
      // waitFor: a entrada tem fade (opacity 0 → 1), então a asserção precisa
      // esperar a animação assentar em vez de medir no meio dela.
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>(
          '[data-slot="accordion-content"]:not([hidden]):not([data-state="closed"]):not([data-closed])',
        );
        if (!el || el.getBoundingClientRect().height === 0) {
          throw new Error('painel aberto ainda não assentou');
        }
        return el;
      });
      await expect(panel).toBeVisible();
      await expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step('Modo single: item anterior fecha ao abrir novo', async () => {
      const triggers = canvas.getAllByRole('button');
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Enter expande item focado', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[2].focus();
      await expect(triggers[2]).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space colapsa item aberto', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[2].focus();
      await userEvent.keyboard(' ');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });
    await step('Setas movem o foco entre triggers (com loop) e Home/End vão às pontas', async () => {
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(triggers[1]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(triggers[triggers.length - 1]).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(triggers[0]).toHaveFocus();
      await userEvent.keyboard('{End}');
      await expect(triggers[triggers.length - 1]).toHaveFocus();
    });

    await step('Tab e Shift+Tab movem o foco entre triggers', async () => {
      // Documentado em accessibility.keyboard.tab/shiftTab; o conteúdo dos itens
      // não tem elementos focáveis, então Tab vai direto ao próximo trigger.
      const triggers = canvas.getAllByRole('button');
      triggers[0].focus();
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(triggers[0]).toHaveFocus();
    });

  },
};
