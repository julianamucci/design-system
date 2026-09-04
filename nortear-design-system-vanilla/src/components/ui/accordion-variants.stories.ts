import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { createAccordion, type AccordionOptions } from './accordion';
import { accordionSource, accordionSourceWith } from './accordion.source';
import DOMPurify from 'dompurify';

const meta: Meta = {
  tags: ['disclosure'],
  parameters: {
    design: figmaDesign('accordion'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: accordionSource } },
  },
  title: 'Components/Disclosure/Accordion/Variants',
};

export default meta;
type Story = StoryObj;

// Idempotentes: o painel Interactions reexecuta a play no MESMO DOM, então o
// estado de partida é o que a rodada anterior deixou. Um clique cego ALTERNA —
// a partir do estado errado ele inverte o resultado e a asserção seguinte falha.
const open = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const close = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

// O payload do callback é montado pela própria factory nesta stack — nas outras
// três quem monta é a lib headless. Por isso a asserção de formato vive aqui.
const onMultipleChange = fn();

// ─── Items ────────────────────────────────────────────────────────────────────

const FAQ_ITEMS: AccordionOptions['items'] = [
  { value: 'senha',     trigger: 'Como faço para redefinir minha senha?',  content: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
  { value: 'pagamento', trigger: 'Quais formas de pagamento são aceitas?',  content: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
  { value: 'cancel',    trigger: 'Como cancelo minha assinatura?',          content: 'Você pode cancelar a qualquer momento em Configuracoes → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
];

// Mesmo exemplo do snippet `codeMultiple` da docs page e das demais stacks.
const SPEC_ITEMS: AccordionOptions['items'] = [
  { value: 'especificacoes',  trigger: 'Especificações técnicas', content: 'CPU: Intel Core i7-12700, RAM: 16GB DDR5, SSD: 512GB NVMe' },
  { value: 'compatibilidade', trigger: 'Compatibilidade',         content: 'Windows 11, macOS 14+, Ubuntu 22.04 LTS' },
  { value: 'garantia',        trigger: 'Garantia e suporte',      content: '24 meses de garantia de fábrica. Suporte técnico 24/7.' },
];

// ─── Modos ────────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () => createAccordion({ type: 'single', defaultValue: 'senha', items: FAQ_ITEMS }),
  parameters: {
    covers: ['functional.item2', 'functional.item3', 'functional.item6', 'visual.item2'],
    // Override de story: o valor inicial não passa por control nenhum, e sem os
    // itens desta story ele apontaria para um `value` que o snippet não tem.
    docs: {
      source: { transform: accordionSourceWith({ defaultValue: 'senha', items: FAQ_ITEMS }) },
      description: {
        story: 'Apenas um item pode estar aberto por vez. Abrir um novo fecha o anterior automaticamente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Item 1 começa aberto via defaultValue', async () => {
      await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
    });

    await step('Abrir item 2 fecha automaticamente o item 1', async () => {
      await open(triggers[1]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no item ativo fecha-o (modo single permite collapse)', async () => {
      await close(triggers[1]);
    });
  },
};

/**
 * O fechar-ao-clicar-de-novo, medido sem nenhuma configuração.
 *
 * A factory é chamada só com `type: 'single'` e os itens — nada mais. É esse
 * recorte que prova o contrato: o comportamento não depende de uma chave que
 * quem consome precise lembrar de ligar. Enquanto existia um `collapsible`, esta
 * story ficava vermelha na stack cuja lib o trazia desligado por omissão — foi
 * assim que a divergência foi medida.
 *
 * Sobrevive ao REPLAY: cada passo estabelece a própria precondição, e o par
 * `open`/`close` garante um clique real nesta rodada partindo de um estado
 * conhecido, em vez de alternar a partir do que a rodada anterior deixou.
 */
export const CloseOnSecondClick: Story = {
  render: () => createAccordion({ type: 'single', items: FAQ_ITEMS.slice(0, 2) }),
  parameters: {
    covers: ['functional.item2'],
    docs: {
      description: {
        story: 'Modo único sem nenhuma configuração extra: clicar de novo no item aberto o fecha.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Clicar de novo no item aberto o fecha', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[0]);  // precondição própria: garantidamente aberto
      await close(triggers[0]); // clique real nesta rodada + asserção de estado
    });

    await step('O painel recolhe de fato, não só o atributo', async () => {
      // Atributo é promessa, altura é entrega. Sem esta asserção, um painel que
      // continuasse expandido com aria-expanded="false" passaria despercebido.
      // A tolerância de 1px cobre o arredondamento do grid em 0fr.
      await waitFor(() => {
        const expandidos = Array.from(
          canvasElement.querySelectorAll<HTMLElement>('[data-slot="accordion-content"]'),
        ).filter((p) => p.getBoundingClientRect().height > 1);
        expect(expandidos).toHaveLength(0);
      });
    });
  },
};

export const Multiple: Story = {
  render: () => createAccordion({ type: 'multiple', items: SPEC_ITEMS, onValueChange: onMultipleChange }),
  beforeEach: () => { onMultipleChange.mockClear(); },
  parameters: {
    covers: ['functional.item4'],
    // Override de story: o modo múltiplo e o callback são o assunto daqui, e
    // nenhum dos dois passa por control.
    docs: {
      source: {
        transform: accordionSourceWith({
          type: 'multiple',
          items: SPEC_ITEMS,
          onValueChange: '(abertos) => registrar(abertos)',
        }),
      },
      description: {
        story: 'Múltiplos itens podem estar abertos simultaneamente. Use para conteúdo independente que o usuário precisa comparar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Abre dois itens simultaneamente', async () => {
      await open(triggers[0]);
      await open(triggers[1]);
    });

    await step('O callback recebe a lista de abertos, não um valor só', async () => {
      // Modo múltiplo devolve array; o modo único devolve string. É o contrato
      // documentado em props.accordion.items.value (string | string[]) e o
      // único lugar onde a forma do payload é verificada.
      const last = onMultipleChange.mock.calls.at(-1)?.[0];
      await expect(Array.isArray(last)).toBe(true);
      await expect(last).toEqual(['especificacoes', 'compatibilidade']);
    });

    await step('Clicar em trigger aberto fecha individualmente (modo múltiplo)', async () => {
      await close(triggers[0]);
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Controlled: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-lg';
    wrapper.dataset.spacing = 'sm';

    const indicator = document.createElement('p');
    indicator.className = 'nds-text-caption nds-text-muted-foreground';

    const setIndicator = (val: string | string[]) => {
      const display = Array.isArray(val) ? val.join(', ') : val || 'nenhum';
      indicator.innerHTML = DOMPurify.sanitize(`Item aberto: <code class="nds-font-mono">${display}</code>`);
    };
    setIndicator('item-1');

    const accordion = createAccordion({
      type: 'single',
      defaultValue: 'item-1',
      onValueChange: setIndicator,
      items: [
        { value: 'item-1', trigger: 'Item 1 — controlado', content: 'Estado gerenciado externamente via valor inicial e callback de mudança.' },
        { value: 'item-2', trigger: 'Item 2 — controlado', content: 'Útil para sincronizar com URL ou outro estado da aplicação.' },
      ],
    });

    wrapper.append(indicator, accordion);
    return wrapper;
  },
  parameters: {
    covers: ['functional.item6'],
    // Override de story: o valor inicial e o callback que alimenta o indicador
    // externo são o assunto, e nenhum dos dois passa por control.
    docs: {
      source: {
        transform: accordionSourceWith({
          defaultValue: 'item-1',
          items: [
            { value: 'item-1', trigger: 'Item 1 — controlado' },
            { value: 'item-2', trigger: 'Item 2 — controlado' },
          ],
          onValueChange: '(aberto) => atualizarIndicador(aberto)',
        }),
      },
      description: {
        story: 'Modo controlado via onValueChange. O indicador acima mostra o item ativo em tempo real.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Item 1 começa aberto (valor inicial controlado)', async () => {
      const triggers = canvas.getAllByRole('button');
      await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
    });

    await step('Clicar em item 2 atualiza o estado externo', async () => {
      const triggers = canvas.getAllByRole('button');
      await open(triggers[1]);
    });
  },
};

const DEFAULT_OPEN_ITEMS: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Item aberto por padrão',  content: 'Este item inicia expandido via valor inicial. Não é modo controlado — o estado interno gerencia após a montagem.' },
  { value: 'item-2', trigger: 'Item fechado por padrão', content: 'Este item inicia colapsado.' },
];

export const DefaultOpen: Story = {
  render: () =>
    createAccordion({
      type: 'single',
      defaultValue: 'item-1',
      items: DEFAULT_OPEN_ITEMS,
    }),
  parameters: {
    covers: ['functional.item6'],
    // Override de story: o valor inicial É o assunto, e não passa por control.
    docs: {
      source: {
        transform: accordionSourceWith({ defaultValue: 'item-1', items: DEFAULT_OPEN_ITEMS }),
      },
      description: {
        story: 'Item aberto por padrão via defaultValue. Use para destacar a pergunta mais frequente ou o passo atual de um fluxo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Primeiro item está aberto por padrão', async () => {
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};
