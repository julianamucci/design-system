import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import ComboboxStory from './ComboboxStory.svelte';
import { comboboxGroupedSource, comboboxOpenSource } from './combobox.source';
import type { ComboboxOption } from './index';

const COUNTRIES: ComboboxOption[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'portugal', label: 'Portugal' },
];

// Grupos da spec de exemplos: Frutas e Legumes.
const GROCERIES: ComboboxOption[] = [
	{ value: 'maca', label: 'Maçã', group: 'Frutas' },
	{ value: 'banana', label: 'Banana', group: 'Frutas' },
	{ value: 'laranja', label: 'Laranja', group: 'Frutas' },
	{ value: 'cenoura', label: 'Cenoura', group: 'Legumes' },
	{ value: 'batata', label: 'Batata', group: 'Legumes' },
	{ value: 'abobrinha', label: 'Abobrinha', group: 'Legumes' },
];

const meta: Meta = {
	title: 'UI/Combobox/Variants',
	tags: ['form'],
	parameters: {
		layout: 'padded',
		controls: { disable: true },
		actions: { disable: true },
		docs: {
			source: { transform: comboboxOpenSource },
			description: {
				component: 'Formas do Combobox: lista aberta com opção ativa e lista agrupada.',
			},
		},
	},
};

export default meta;
type Story = StoryObj;

export const OpenWithActiveOption: Story = {
	parameters: {
		covers: ['functional.item2', 'accessibility.item4', 'accessibility.item7', 'visual.item3'],
		docs: {
			description: {
				story:
					'Lista aberta com uma opção ativa. O foco fica no campo; a opção é apontada, não focada.',
			},
		},
	},
	render: () => ({
		Component: ComboboxStory,
		props: { items: COUNTRIES, label: 'País', placeholder: 'Buscar país' },
	}),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);
		const field = canvas.getByRole('combobox') as HTMLInputElement;

		await step('A seta abre a lista e ativa a primeira opção', async () => {
			// Cada passo estabelece a própria precondição: o painel Interactions
			// reexecuta a play no MESMO DOM, e um campo com texto da rodada
			// anterior filtraria a lista antes de a seta andar por ela.
			await userEvent.clear(field);
			field.focus();
			await userEvent.keyboard('{ArrowDown}');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'true');
			});
			await waitFor(async () => {
				await expect(body.getAllByRole('option')[0]).toHaveAttribute('data-highlighted');
			});
		});

		await step('A seta move a opção ativa, e o foco não sai do campo', async () => {
			// É o coração do padrão: se o foco fosse para a opção, a digitação
			// pararia de funcionar no meio da navegação.
			await userEvent.keyboard('{ArrowDown}');
			await waitFor(async () => {
				const options = body.getAllByRole('option');
				await expect(options[1]).toHaveAttribute('data-highlighted');
				await expect(field).toHaveAttribute('aria-activedescendant', options[1].id);
			});
			await expect(field).toHaveFocus();
		});

		await step('Da última opção a seta volta para a primeira', async () => {
			// A ativa está na segunda opção; faltam N-1 passos para dar a volta.
			const total = body.getAllByRole('option').length;
			for (let moved = 1; moved < total; moved++) {
				await userEvent.keyboard('{ArrowDown}');
			}
			await waitFor(async () => {
				await expect(body.getAllByRole('option')[0]).toHaveAttribute('data-highlighted');
			});
		});

		await step('O campo em foco mostra anel visível', async () => {
			// Um `outline: 0` sem substituto passaria em qualquer teste de estado —
			// é preciso olhar o estilo computado do WRAPPER, que é quem desenha o
			// anel, porque o foco real vive no input por dentro dele.
			const wrapper = canvasElement.querySelector<HTMLElement>(
				'[data-slot="combobox-input-wrapper"]',
			)!;
			const styles = getComputedStyle(wrapper);
			await expect(styles.outlineStyle !== 'none' || styles.boxShadow !== 'none').toBe(true);
		});

		await step('Escape fecha e devolve a lista ao estado inicial', async () => {
			// Devolve a story ao que o Chromatic fotografa e deixa a play idempotente.
			await userEvent.keyboard('{Escape}');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'false');
			});
		});
	},
};

export const Grouped: Story = {
	parameters: {
		covers: ['visual.item4'],
		docs: {
			source: { transform: comboboxGroupedSource },
			description: {
				story: 'Itens agrupados: cada grupo traz um cabeçalho que nomeia o conjunto.',
			},
		},
	},
	render: () => ({
		Component: ComboboxStory,
		props: { items: GROCERIES, label: 'Ingrediente', placeholder: 'Buscar ingrediente' },
	}),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);
		const field = canvas.getByRole('combobox') as HTMLInputElement;

		await step('A lista abre com os dois grupos', async () => {
			await userEvent.clear(field);
			field.focus();
			await userEvent.keyboard('{ArrowDown}');
			await waitFor(async () => {
				await expect(body.getAllByRole('option').length).toBeGreaterThan(0);
			});
			await expect(document.querySelectorAll('[data-slot="combobox-group"]')).toHaveLength(2);
		});

		await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
			// `role="group"` sem nome não agrupa nada para quem usa leitor de tela:
			// é o `aria-labelledby` apontando o cabeçalho que faz o trabalho.
			const groups = [
				...document.querySelectorAll<HTMLElement>('[data-slot="combobox-group"]'),
			];
			for (const group of groups) {
				const labelId = group.getAttribute('aria-labelledby');
				await expect(labelId).toBeTruthy();
				await expect(document.getElementById(labelId!)).not.toBeNull();
			}
			await expect(groups[0]).toHaveTextContent('Frutas');
			await expect(groups[1]).toHaveTextContent('Legumes');
		});

		await step('O divisor entre grupos não entra na semântica da lista', async () => {
			// Um `role="separator"` como filho direto de `role="listbox"` é filho não
			// permitido, e a lista inteira perderia a validade por causa de um traço.
			const separator = document.querySelector('[data-slot="combobox-separator"]');
			await expect(separator).not.toBeNull();
			await expect(separator).toHaveAttribute('aria-hidden', 'true');
		});

		await step('Escape fecha a lista', async () => {
			await userEvent.keyboard('{Escape}');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'false');
			});
		});
	},
};
