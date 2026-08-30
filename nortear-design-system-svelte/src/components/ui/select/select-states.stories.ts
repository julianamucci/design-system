import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';
import { focusMeasureRing, STATES } from '@shared/testing/select-probe';
import {
  selectBloqueadoSource,
  selectInvalidoSource,
  selectSelectedSource,
  selectSource,
} from './select.source';

const meta: Meta = {
  title: 'Primitives/Form/Select/States',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo — Default e Open partem da
      // mesma composição, e as demais sobrescrevem logo abaixo.
      source: { transform: selectSource },
      description: {
        component:
          'Vazio, preenchido, aberto, bloqueado, inválido e compacto. Teclado, foco e posicionamento vêm do primitivo — o que estas stories provam é que a composição não desfaz nada disso.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const base = {
  placeholder: 'Selecione...',
  ariaLabel: 'Selecionar estado',
  options: [...STATES],
};

export const Default: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: { story: 'Nada escolhido: o campo mostra o placeholder e a lista não existe.' },
    },
  },
  render: () => ({ Component: SelectStory, props: { ...base } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo anuncia estar vazio e fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveTextContent(/Selecione/);
    });

    await step('A lista não existe enquanto está fechada', async () => {
      // Fechado não é "escondido": o portal desmonta. Uma lista só escondida
      // continuaria no percurso do leitor de tela.
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
    });
  },
};

export const Selected: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: selectSelectedSource },
      description: {
        story:
          'Valor pré-escolhido. O rótulo vem da lista de opções que a composição já tem em mãos — o primitivo desmonta a lista ao fechar e não teria de onde tirá-lo. (Pré-selecionar serve para ver o estado; em formulário real, evite.)',
      },
    },
  },
  render: () => ({ Component: SelectStory, props: { ...base, value: 'rj' } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo exibe o rótulo do valor escolhido', async () => {
      await expect(trigger).toHaveTextContent(/Rio de Janeiro/);
      await expect(trigger).not.toHaveTextContent(/Selecione/);
    });

    await step('Ao abrir, a opção escolhida é a que nasce marcada', async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox');
      const escolhida = within(listbox).getByRole('option', { name: /Rio de Janeiro/i });
      await expect(escolhida).toHaveAttribute('aria-selected', 'true');
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      });
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['visual.item3'],
    // A story TERMINA aberta — é o estado que ela documenta e o que a
    // regressão visual precisa fotografar. Ver o motivo do guarda de foco em
    // `wait-for-portal`.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        story: 'Lista aberta, em portal. As setas andam item a item e o destaque acompanha.',
      },
    },
  },
  render: () => ({ Component: SelectStory, props: { ...base } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    const open = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('listbox');
    };

    await step('O campo e a lista concordam sobre estar aberta', async () => {
      const listbox = await open();
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(listbox).getAllByRole('option')).toHaveLength(STATES.length);
    });

    await step('A seta para baixo anda um item por vez, e a de cima volta', async () => {
      // O índice de partida vem MEDIDO, não suposto: umas libs já nascem com o
      // primeiro item destacado, outras só destacam quando o teclado entra. O
      // que o item do contrato promete é o passo de um, e é ele que se afirma.
      const listbox = await open();
      const destacada = () =>
        within(listbox)
          .getAllByRole('option')
          .findIndex((o) => o.hasAttribute('data-highlighted'));
      const last = within(listbox).getAllByRole('option').length - 1;

      const partida = destacada();
      await userEvent.keyboard('{ArrowDown}');
      const first = Math.min(partida + 1, last);
      await waitFor(async () => {
        await expect(destacada()).toBe(first);
      });

      await userEvent.keyboard('{ArrowDown}');
      const segundo = Math.min(first + 1, last);
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo - 1);
      });
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: selectBloqueadoSource },
      description: { story: 'Campo bloqueado: não abre, não responde ao clique e sai do percurso do Tab.' },
    },
  },
  render: () => ({ Component: SelectStory, props: { ...base, disabled: true } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo se anuncia bloqueado', async () => {
      // `disabled` nativo, e não só `aria-disabled`: é o atributo que tira o
      // botão do percurso do Tab e cancela o clique no próprio navegador.
      await expect(trigger).toBeDisabled();
    });

    await step('Clicar não abre a lista', async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await waitFor(async () => {
        await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
      });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: selectInvalidoSource },
      description: {
        story:
          'Campo reprovado pela validação. A borda de perigo acompanha `aria-invalid` — a cor não é o aviso, é o reforço dele.',
      },
    },
  },
  render: () => ({ Component: SelectStory, props: { ...base, ariaInvalid: true } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo inválido se anuncia como tal', async () => {
      await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    });

    await step('O anel de erro vem da folha compartilhada', async () => {
      // A story NÃO pinta nada: se a regra `[aria-invalid="true"]` sumir do CSS
      // compartilhado, isto reprova.
      await expect(getComputedStyle(trigger).boxShadow).not.toBe('none');
    });

    await step('Focar o campo inválido continua mostrando o foco', async () => {
      // O anel destrutivo é PERMANENTE e era declarado depois do
      // `:focus-visible` com a mesma especificidade: sem a regra de
      // aninhamento, focar um campo inválido não mudava nada na tela.
      // `boxShadow !== 'none'` passaria mesmo assim — só a MUDANÇA reprova.
      await expect(focusMeasureRing(trigger).mudou).toBe(true);
    });
  },
};
