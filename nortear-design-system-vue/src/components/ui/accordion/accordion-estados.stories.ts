import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './index';

const meta = {
  title: 'UI/Accordion/States',
  tags: ['disclosure'],
  parameters: {
    design: figmaDesign('accordionItem'),
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" class="nds-max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item fechado (estado padrão)</AccordionTrigger>
          <AccordionContent>Conteúdo oculto.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item7', 'visual.item3'],
    docs: {
      description: {
        story: 'Estado fechado. aria-expanded="false" no trigger. Chevron aponta para baixo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger tem aria-expanded=false', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('O painel fechado permanece no documento', async () => {
      // `hidden="until-found"` é o que deixa o Ctrl+F achar a resposta dentro
      // de um item fechado; desmontar o painel mataria o recurso em silêncio. O
      // display entra junto porque um `display: none` de autor o anula sem
      // quebrar nada visível.
      const painel = await waitFor(() => {
        const el = canvasElement.querySelector<HTMLElement>('[data-slot="accordion-content"]');
        if (!el || !el.hasAttribute('hidden')) throw new Error('painel ainda assentando');
        return el;
      });
      await expect(painel.getAttribute('hidden')).toBe('until-found');
      await expect(getComputedStyle(painel).display).not.toBe('none');
    });

    await step('Fechado, o gatilho ainda aponta para o painel', async () => {
      // Sem `role="region"` no painel, o aria-controls é o ÚNICO vínculo entre
      // gatilho e conteúdo — e esta stack não o emitia em estado nenhum. Ver
      // accordion-a11y.ts.
      const contentId = trigger.getAttribute('aria-controls');
      await expect(contentId).toBeTruthy();
      await expect(
        canvasElement.querySelector(`#${CSS.escape(contentId!)}`),
      ).toBeInTheDocument();
    });
  },
};

export const Open: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" default-value="item-1" class="nds-max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item aberto</AccordionTrigger>
          <AccordionContent>
            Conteúdo visível. Chevron rotaciona 180°. aria-expanded="true".
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    covers: ['accessibility.item2', 'visual.item3'],
    docs: {
      description: {
        story: 'Estado aberto. aria-expanded="true" no trigger. Conteúdo visível e acessível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger tem aria-expanded=true', async () => {
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'), {
        timeout: 500,
      });
    });

    await step('O painel aberto tem altura de verdade', async () => {
      // aria-expanded sozinho não prova que o painel apareceu: a altura vem da
      // animação de grid (0fr → 1fr), e já houve regressão com o gatilho
      // anunciando aberto e o painel colapsado. O waitFor gateia na altura
      // computada, não no relógio.
      await waitFor(() => {
        const painel = canvasElement.querySelector<HTMLElement>(
          '[data-slot="accordion-content"]:not([hidden])',
        );
        if (!painel || painel.getBoundingClientRect().height === 0) {
          throw new Error('painel ainda abrindo');
        }
      });
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" class="nds-max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item habilitado</AccordionTrigger>
          <AccordionContent>Este item funciona normalmente.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" :disabled="true">
          <AccordionTrigger>Item desabilitado</AccordionTrigger>
          <AccordionContent>Este conteúdo não pode ser acessado.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    covers: ['functional.item5', 'accessibility.item5', 'visual.item5'],
    docs: {
      description: {
        story: 'Estado disabled. Trigger não responde a cliques. Use para seções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Segundo trigger está desabilitado', async () => {
      await expect(triggers[1]).toBeDisabled();
    });

    await step('Clicar no disabled não abre o item', async () => {
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="single" default-value="item-1" class="nds-max-w-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger>Navegar com Tab para ver focus ring</AccordionTrigger>
          <AccordionContent>Focus ring visível ao navegar por teclado.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Segundo item</AccordionTrigger>
          <AccordionContent>Tab move o foco para este trigger.</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story: 'Navegação por teclado. Tab move entre triggers. Enter e Space abrem/fecham. Focus ring ring-[3px] visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Trigger recebe foco via Tab', async () => {
      triggers[0].focus();
      await expect(triggers[0]).toHaveFocus();
    });

    await step('Tab move foco para próximo trigger', async () => {
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
    });
  },
};
