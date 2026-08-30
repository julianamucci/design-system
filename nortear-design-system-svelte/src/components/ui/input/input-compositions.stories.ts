import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect } from 'storybook/test';
import { Input } from './index';
import InputWithLabelStory from './InputWithLabelStory.svelte';
import InputGroupStory from './InputGroupStory.svelte';
import {
  inputWithErrorSource,
  helperInputWithTextSource,
  groupWithButtonInputSource,
  groupInputSource,
  inputSenhaWithHelperSource,
  inputSource,
} from './input.source';

const meta: Meta = {
  title: 'Primitives/Form/Input/Compositions',
  component: Input,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a de rótulo simples já é a
      // forma canônica, as demais sobrescrevem logo abaixo.
      source: { transform: inputSource },
      description: {
        component:
          'O Input deve ser sempre acompanhado de um rótulo acessível. Composicoes comuns: com Label, com texto de apoio, com mensagem de erro e dentro de um InputGroup, que envolve o campo com prefixos, sufixos e botões internos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithLabel: Story = {
  render: () => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Nome completo', type: 'text', placeholder: 'ex: João da Silva', id: 'nome-campo' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está visível', async () => {
      await expect(canvas.getByText('Nome completo')).toBeVisible();
    });

    await step('Input alcançável pelo rótulo', async () => {
      await expect(canvas.getByLabelText('Nome completo')).toBeVisible();
    });

    await step('Clicar no rótulo leva o foco ao campo', async () => {
      // É o que a seção Composições promete e nenhuma stack verificava: o par
      // `for`/`id` existir não garante que o clique chegue ao campo.
      await userEvent.click(canvas.getByText('Nome completo'));
      await expect(canvas.getByLabelText('Nome completo')).toHaveFocus();
    });

    await step('Digitar no campo associado ao rótulo funciona', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await userEvent.clear(input);
      await userEvent.type(input, 'Maria Silva');
      await expect(input).toHaveValue('Maria Silva');
    });
  },
};

export const WithLabelAndHint: Story = {
  parameters: { docs: { source: { transform: helperInputWithTextSource } } },
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Email',
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
      hint: 'Use seu email corporativo.',
      id: 'email-campo',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Rótulo, campo e texto de apoio estão visíveis', async () => {
      await expect(canvas.getByLabelText('Email')).toBeVisible();
      await expect(canvas.getByText('Use seu email corporativo.')).toBeVisible();
    });

    await step('O texto de apoio é lido junto com o campo', async () => {
      // Hint visível mas sem describedby não chega ao leitor de tela.
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-describedby', 'email-campo-hint');
      await expect(canvasElement.ownerDocument.getElementById('email-campo-hint')).not.toBeNull();
    });
  },
};

export const ErrorMessage: Story = {
  parameters: { docs: { source: { transform: inputWithErrorSource } } },
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Email',
      type: 'email',
      placeholder: 'ex: joao@empresa.com',
      'aria-invalid': 'true',
      errorMessage: 'Email inválido. Use o formato nome@dominio.com',
      id: 'email-erro',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Email');

    await step('Campo marcado como inválido', async () => {
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para a mensagem que existe', async () => {
      await expect(input).toHaveAttribute('aria-describedby', 'email-erro-error');
      await expect(canvasElement.ownerDocument.getElementById('email-erro-error')).not.toBeNull();
    });

    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/Email inválido/)).toBeVisible();
    });
  },
};

export const Password: Story = {
  parameters: { docs: { source: { transform: inputSenhaWithHelperSource } } },
  render: () => ({
    Component: InputWithLabelStory,
    props: {
      labelText: 'Senha',
      type: 'password',
      placeholder: '••••••••',
      hint: 'Use letras maiúsculas, minúsculas e números.',
      id: 'senha-campo',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input de senha está presente', async () => {
      await expect(canvas.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    });

    await step('A política de senha é lida junto com o campo', async () => {
      await expect(canvas.getByLabelText('Senha')).toHaveAttribute('aria-describedby', 'senha-campo-hint');
    });
  },
};

/**
 * Fecha `functional.item7` e `visual.item4`. Os três alinhamentos numa captura
 * só — e as asserções afirmam o PIXEL, não o atributo: quem posiciona é a
 * propriedade `order` no CSS, e um `align` no elemento errado passaria batido.
 */
export const Alignments: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item4'],
    docs: { source: { transform: groupInputSource } },
  },
  render: () => ({ Component: InputGroupStory, props: { cenario: 'alinhamentos' } }),
  play: async ({ canvasElement, step }) => {
    const q = <T extends HTMLElement>(sel: string) => canvasElement.querySelector<T>(sel)!;

    await step('O alinhamento vira data-align, que é o que o CSS lê', async () => {
      for (const [id, align] of [
        ['addon-inicio', 'inline-start'],
        ['addon-fim', 'inline-end'],
        ['addon-bloco', 'block-start'],
      ] as const) {
        await expect(q(`[data-testid="${id}"]`)).toHaveAttribute('data-align', align);
      }
    });

    await step('O addon fica DO LADO que o nome promete', async () => {
      await expect(q('[data-testid="addon-inicio"]').getBoundingClientRect().left)
        .toBeLessThan(q('#ig-inicio').getBoundingClientRect().left);
      await expect(q('[data-testid="addon-fim"]').getBoundingClientRect().left)
        .toBeGreaterThan(q('#ig-fim').getBoundingClientRect().left);
    });

    await step('block-start empilha: o grupo vira coluna', async () => {
      await expect(q('[data-testid="addon-bloco"]').getBoundingClientRect().bottom)
        .toBeLessThanOrEqual(q('#ig-bloco').getBoundingClientRect().top + 1);
    });

    await step('A moldura é do GRUPO; o campo interno fica nu', async () => {
      // É o ponto do componente: uma borda só em volta de tudo. Se o campo
      // mantivesse a própria, apareceria uma linha dupla no meio.
      const group = q('[data-slot="input-group"]');
      await expect(parseFloat(getComputedStyle(group).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(q('#ig-inicio')).borderTopWidth)).toBe(0);
    });

    await step('O grupo é uma região só para o leitor de tela', async () => {
      await expect(q('[data-slot="input-group"]')).toHaveAttribute('role', 'group');
    });
  },
};

/** Fecha `functional.item8`. */
export const AddonClick: Story = {
  parameters: {
    covers: ['functional.item8'],
    docs: { source: { transform: groupWithButtonInputSource } },
  },
  render: () => ({ Component: InputGroupStory, props: { cenario: 'clique' } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = () => canvasElement.querySelector<HTMLInputElement>('#ig-clique')!;

    await step('Clicar no addon leva o foco ao campo', async () => {
      // A área toda parece o campo. Quem mira o "@" espera começar a digitar.
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="addon"]')!);
      await expect(field()).toHaveFocus();
    });

    await step('Clicar no BOTÃO dentro do addon não devolve o foco ao campo', async () => {
      // Sem esta distinção, apertar "Limpar" devolveria o foco ao campo no meio
      // da ação — e quem navega por teclado perderia o lugar.
      await userEvent.click(canvas.getByRole('button', { name: 'Limpar' }));
      await expect(field()).not.toHaveFocus();
    });
  },
};
