import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { Accordion } from './index';
import AccordionStory from './AccordionStory.svelte';
import AccordionDocs from '@/components/docs/AccordionDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { accordionSource } from './accordion.source';

const meta: Meta = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    design: figmaDesign('accordion'),
    // O gerador de source do @storybook/svelte monta a tag a partir de
    // `component.__docgen.name` e, sem docgen, cai em `component.name` — o nome
    // interno da função compilada, que não é um componente que alguém possa
    // importar. `transform` e não `code`: um snippet fixo deixaria de acompanhar
    // os controls. Cascateia para as stories deste arquivo.
    docs: {
      page: withAutoDocsTab(AccordionDocs),
      source: { transform: accordionSource },
    },
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
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item3',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4', 'accessibility.item6',
      'visual.item1',
    ],
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

    // Idempotentes de propósito: clicam SÓ se o estado atual já não for o
    // desejado. Um clique cego ALTERNA — a partir do estado errado ele inverte
    // o resultado e a asserção seguinte falha. É o que fazia este Playground
    // passar no vitest (montagem limpa) e falhar no painel Interactions, onde
    // o replay reaproveita o componente já mexido.
    const open = async (t: HTMLElement) => {
      if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
    };
    const close = async (t: HTMLElement) => {
      if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
      await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
    };

    await step('A raiz registra o modo recebido', async () => {
      const root = canvasElement.querySelector('[data-slot="accordion"]');
      await expect(root).toHaveAttribute('data-type', args.type);
    });

    // O painel Interactions reexecuta a play no MESMO DOM: o estado inicial da
    // segunda rodada é o que a primeira deixou. Por isso o passo leva ao estado
    // que quer provar em vez de assumir o de montagem — e o defaultValue, que só
    // vale na montagem, é provado pela story DefaultOpen, com DOM limpo.
    await step('Modo único mantém um item aberto por vez', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[0]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger fechado abre o item', async () => {
      const triggers = canvas.getAllByRole('button');
      // fecha antes de abrir: garante que o clique aconteça de verdade nesta
      // rodada — é ele que popula a aba Actions.
      await close(triggers[1]);
      await open(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
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
      await close(triggers[2]);
      triggers[2].focus();
      await expect(triggers[2]).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(triggers[2]).toHaveAttribute('aria-expanded', 'true'));
    });

    await step('Space colapsa item aberto', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[2]);
      triggers[2].focus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(triggers[2]).toHaveAttribute('aria-expanded', 'false'));
    });
    await step('Trigger aponta para o painel por aria-controls, e o painel NAO e landmark', async () => {
      // Documentado em accessibility.aria.* como automático. Nesta stack NÃO é:
      // o bits-ui não emite nenhum dos três — ver accordion-a11y.ts.
      // Medido com o item ABERTO: onde o painel desmonta ao fechar, apontar
      // aria-controls para id ausente seria ARIA inválido.
      const trigger = canvas.getAllByRole('button')[0];
      await open(trigger);
      const contentId = trigger.getAttribute('aria-controls');
      await expect(contentId).toBeTruthy();
      const panel = canvasElement.querySelector(`#${CSS.escape(contentId!)}`);
      // Sem role="region": o painel fica sempre montado por causa do
      // until-found, e um landmark por item proliferaria — medido na docs
      // page, 41 paineis viraram 41 landmarks (axe landmark-unique).
      await expect(panel).not.toHaveAttribute('role');
      await expect(trigger.id).toBeTruthy();
    });

    await step('Painel fechado continua no DOM, achável pelo Ctrl+F', async () => {
      // `hidden="until-found"` esconde por content-visibility, não por display —
      // é o que deixa a busca do navegador achar a resposta e abrir o item.
      // O display computado entra na asserção de propósito: uma regra de autor
      // com `display: none` anula o recurso sem quebrar nada visível.
      const trigger = canvas.getAllByRole('button')[0];
      await open(trigger);
      await close(trigger);
      const panel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]');
        if (!el || el.getAttribute('hidden') === null) throw new Error('painel ainda fechando');
        return el;
      });
      await expect(panel.getAttribute('hidden')).toBe('until-found');
      await expect(getComputedStyle(panel).display).not.toBe('none');
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
