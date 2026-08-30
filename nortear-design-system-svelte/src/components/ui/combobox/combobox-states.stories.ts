import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import ComboboxStory from './ComboboxStory.svelte';
import {
	comboboxDisabledSource,
	comboboxEmptySource,
	comboboxInvalidSource,
} from './combobox.source';
import type { ComboboxOption } from './index';

// Mesma lista da spec de exemplos — divergir aqui faz a story mostrar coisa
// diferente da mesma story nas outras stacks.
const COUNTRIES: ComboboxOption[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'portugal', label: 'Portugal' },
];

const meta: Meta = {
	title: 'Primitives/Form/Combobox/States',
	tags: ['form'],
	parameters: {
		layout: 'padded',
		controls: { disable: true },
		actions: { disable: true },
		docs: {
			source: { transform: comboboxEmptySource },
			description: {
				component: 'Estados do Combobox: indisponível, reprovado e lista sem resultado.',
			},
		},
	},
};

export default meta;
type Story = StoryObj;

const base = { items: COUNTRIES, label: 'País', placeholder: 'Buscar país' };

export const Disabled: Story = {
	parameters: {
		covers: ['visual.item6'],
		docs: {
			source: { transform: comboboxDisabledSource },
			description: { story: 'Indisponível: nada recebe foco e a lista não abre.' },
		},
	},
	render: () => ({ Component: ComboboxStory, props: { ...base, disabled: true } }),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const field = canvas.getByRole('combobox') as HTMLInputElement;

		await step('O campo sai da ordem de tabulação', async () => {
			await expect(field.disabled).toBe(true);
		});

		await step('A lista não abre pelo clique', async () => {
			// Sem esta medida, um `disabled` correto no atributo com a guarda ausente
			// no código passaria: o campo pareceria bloqueado e abriria mesmo assim.
			await userEvent.click(field, { pointerEventsCheck: 0 });
			await expect(field).toHaveAttribute('aria-expanded', 'false');
			await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
		});

		await step('A caixa inteira se anuncia indisponível', async () => {
			const wrapper = canvasElement.querySelector('[data-slot="combobox-input-wrapper"]');
			await expect(wrapper).toHaveAttribute('data-disabled');
		});
	},
};

export const Invalid: Story = {
	parameters: {
		covers: ['visual.item7'],
		docs: {
			source: { transform: comboboxInvalidSource },
			description: { story: 'Reprovado: o campo é anunciado com erro e a borda muda de cor.' },
		},
	},
	render: () => ({ Component: ComboboxStory, props: { ...base, invalid: true } }),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const field = canvas.getByRole('combobox');

		await step('O erro é anunciado no campo', async () => {
			await expect(field).toHaveAttribute('aria-invalid', 'true');
		});

		await step('O estado reprovado deixa marca visual própria', async () => {
			// Sem esta medida, `aria-invalid` correto com a regra de CSS ausente
			// passaria: o leitor de tela anunciaria o erro que ninguém vê.
			const wrapper = canvasElement.querySelector<HTMLElement>(
				'[data-slot="combobox-input-wrapper"]',
			)!;
			await expect(getComputedStyle(wrapper).borderColor).not.toBe('rgba(0, 0, 0, 0)');
			await expect(wrapper).toHaveAttribute('aria-invalid', 'true');
		});
	},
};

export const EmptyResult: Story = {
	parameters: {
		covers: ['functional.item7', 'visual.item5'],
		docs: {
			description: { story: 'Busca sem correspondência: a lista mostra a mensagem de vazio.' },
		},
	},
	render: () => ({ Component: ComboboxStory, props: { ...base } }),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const field = canvas.getByRole('combobox') as HTMLInputElement;

		await step('Texto sem correspondência esvazia a lista', async () => {
			// `clear` antes de digitar: o painel Interactions reexecuta no mesmo DOM,
			// e sem isso a segunda rodada digitaria por cima do texto da primeira.
			await userEvent.clear(field);
			await userEvent.type(field, 'zzz');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'true');
			});
			await waitFor(async () => {
				await expect(within(document.body).queryAllByRole('option')).toHaveLength(0);
			});
		});

		await step('A mensagem de vazio aparece no lugar das opções', async () => {
			const empty = document.querySelector('[data-slot="combobox-empty"]');
			await expect(empty).not.toBeNull();
			await expect(empty).toHaveTextContent('Nenhum resultado');
		});

		await step('Nenhuma opção fica apontada quando não há opção', async () => {
			// `aria-activedescendant` apontando um id que já saiu do documento é o
			// defeito clássico do padrão: o leitor de tela anuncia uma opção
			// fantasma, e nada na tela denuncia.
			await waitFor(async () => {
				await expect(field).not.toHaveAttribute('aria-activedescendant');
			});
		});

		await step('Escape devolve o campo ao estado inicial', async () => {
			await userEvent.keyboard('{Escape}');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'false');
			});
		});
	},
};
