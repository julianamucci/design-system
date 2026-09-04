import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import ComboboxControlledStory from './ComboboxControlledStory.svelte';
import ComboboxStory from './ComboboxStory.svelte';
import { comboboxControlledSource, comboboxCustomFilterSource } from './combobox.source';
import { normalizeText, type ComboboxFilter, type ComboboxOption } from './index';

// Mesma lista da spec de exemplos. "Uruguai" está aqui por um motivo: é a opção
// que o filtro padrão acha por "guai", no MEIO da palavra, e que a regra
// própria desta página não acha — é ela que torna a diferença demonstrável.
const COUNTRIES: ComboboxOption[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'portugal', label: 'Portugal' },
	{ value: 'uruguai', label: 'Uruguai' },
];

/**
 * Regra própria: casa só pelo INÍCIO do rótulo, sem acento e sem caixa.
 *
 * O filtro recebe o ITEM inteiro, e não o rótulo: escrito contra a assinatura
 * antiga, `item.label` seria indefinido e NENHUMA opção sobreviveria — o
 * primeiro passo da play é o que cobra a forma nova.
 */
const startOfLabel: ComboboxFilter = (item, query) => {
	const needle = normalizeText(query.trim());
	return needle === '' || normalizeText(item.label).startsWith(needle);
};

const meta: Meta = {
	title: 'Components/Form/Combobox/Compositions',
	tags: ['form'],
	parameters: {
		layout: 'padded',
		controls: { disable: true },
		actions: { disable: true },
		docs: {
			source: { transform: comboboxCustomFilterSource },
			description: {
				component:
					'Composições do Combobox: regra de correspondência própria e campo com escolha e busca controladas por fora.',
			},
		},
	},
};

export default meta;
type Story = StoryObj;

// ─── Filtro próprio ───────────────────────────────────────────────────────────

export const CustomFilter: Story = {
	parameters: {
		docs: {
			source: { transform: comboboxCustomFilterSource },
			description: {
				story:
					'Regra de correspondência própria no lugar do padrão: aqui a opção só sobrevive se o rótulo COMEÇAR pelo texto digitado.',
			},
		},
	},
	render: () => ({
		Component: ComboboxStory,
		props: {
			items: COUNTRIES,
			label: 'País',
			placeholder: 'Buscar país',
			filter: startOfLabel,
		},
	}),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		// A lista é portalada: quem a procura dentro do canvas não acha nada.
		const body = within(document.body);
		const field = canvas.getByRole('combobox') as HTMLInputElement;

		await step('A regra própria casa pelo início do rótulo', async () => {
			// `clear` antes de digitar: o painel Interactions reexecuta a play no
			// MESMO DOM, e sem isto a segunda rodada digitaria por cima da primeira.
			await userEvent.clear(field);
			await userEvent.type(field, 'por');
			await waitFor(async () => {
				const options = body.getAllByRole('option');
				await expect(options).toHaveLength(1);
				await expect(options[0]).toHaveTextContent('Portugal');
			});
		});

		await step('O que só o filtro padrão acharia fica de fora', async () => {
			// "guai" está no MEIO de "Uruguai": o filtro padrão devolveria a opção,
			// e a regra desta página não. Sem este passo, um `filter` ignorado pela
			// raiz passaria despercebido — a lista continuaria filtrando pelo padrão
			// e a story pareceria correta.
			await userEvent.clear(field);
			await userEvent.type(field, 'guai');
			await waitFor(async () => {
				await expect(body.queryAllByRole('option')).toHaveLength(0);
			});
			const empty = document.querySelector('[data-slot="combobox-empty"]');
			await expect(empty).not.toBeNull();
			await expect(empty).toHaveTextContent('Nenhum resultado');
		});

		await step('Escape devolve o campo ao estado inicial', async () => {
			await userEvent.keyboard('{Escape}');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'false');
			});
		});
	},
};

// ─── Controlado por fora ──────────────────────────────────────────────────────

export const Controlled: Story = {
	parameters: {
		docs: {
			source: { transform: comboboxControlledSource },
			description: {
				story:
					'Escolha e texto de busca controlados por fora: o campo reflete o estado do consumidor e devolve a ele cada mudança.',
			},
		},
	},
	render: () => ({
		Component: ComboboxControlledStory,
		props: {
			items: COUNTRIES,
			label: 'País',
			placeholder: 'Buscar país',
			outsideChoice: 'chile',
		},
	}),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);
		const field = canvas.getByRole('combobox') as HTMLInputElement;

		await step('Escolher no campo atualiza o estado de fora', async () => {
			await userEvent.clear(field);
			await userEvent.type(field, 'bra');
			await waitFor(async () => {
				await expect(body.getAllByRole('option').length).toBeGreaterThan(0);
			});
			await userEvent.keyboard('{Enter}');
			await waitFor(async () => {
				await expect(canvas.getByTestId('external-value')).toHaveTextContent('brasil');
			});
			// O texto também é do consumidor: sem a segunda ligação, a busca ficaria
			// com um dono a menos e o estado de fora não saberia o que se lê no campo.
			await expect(canvas.getByTestId('external-query')).toHaveTextContent('Brasil');
		});

		await step('Escrever no estado de fora muda o que a tela mostra', async () => {
			await userEvent.click(canvas.getByRole('button', { name: 'Escolher Chile de fora' }));
			await waitFor(async () => {
				await expect(field).toHaveValue('Chile');
			});
			await expect(canvas.getByTestId('external-value')).toHaveTextContent('chile');
		});

		await step('Limpar de fora esvazia o campo', async () => {
			// Devolve a story ao estado que o Chromatic fotografa, e prova a ida e a
			// volta na mesma rodada.
			await userEvent.click(canvas.getByRole('button', { name: 'Limpar de fora' }));
			await waitFor(async () => {
				await expect(field).toHaveValue('');
			});
			await expect(canvas.getByTestId('external-value')).toHaveTextContent('—');
		});
	},
};
