import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import ComboboxStory from './ComboboxStory.svelte';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import {
	comboboxGroupedSource,
	comboboxMultipleSource,
	comboboxOpenSource,
	comboboxSingleLineChipsSource,
} from './combobox.source';
import type { ComboboxOption } from './index';

const COUNTRIES: ComboboxOption[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'portugal', label: 'Portugal' },
];

// Lista inteira da spec de exemplos, a mesma que o Playground usa: a story de
// chips escolhe entre os nove, e não entre os quatro que bastam às formas de
// escolha única deste arquivo.
const MULTIPLE_COUNTRIES: ComboboxOption[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'colombia', label: 'Colômbia' },
	{ value: 'mexico', label: 'México' },
	{ value: 'peru', label: 'Peru' },
	{ value: 'portugal', label: 'Portugal' },
	{ value: 'espanha', label: 'Espanha' },
	{ value: 'uruguai', label: 'Uruguai' },
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

// Lista longa de propósito: com o campo estreito, seis chips não cabem numa
// linha só, e é o transbordo que a story de linha única existe para mostrar.
const VISITED: ComboboxOption[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'colombia', label: 'Colômbia' },
	{ value: 'mexico', label: 'México' },
	{ value: 'portugal', label: 'Portugal' },
	{ value: 'uruguai', label: 'Uruguai' },
];

// ─── Contraste ────────────────────────────────────────────────────────────────
//
// O axe não mede o chip contra a superfície do CAMPO: ele compara com o fundo
// que herda. E o chip pinta sobre `--input-background`, não sobre a página —
// medir contra a página superestima e deixa passar um par que na tela não
// alcança.

function luminance(color: string): number {
	const channels = (color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
	const [r, g, b] = channels.map((channel) => {
		const scaled = channel / 255;
		return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
	const a = luminance(first);
	const b = luminance(second);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const meta: Meta = {
	title: 'Components/Form/Combobox/Variants',
	tags: ['form'],
	parameters: {
		layout: 'padded',
		controls: { disable: true },
		actions: { disable: true },
		docs: {
			source: { transform: comboboxOpenSource },
			description: {
				component:
					'Formas do Combobox: lista aberta com opção ativa, múltipla com chips e lista agrupada.',
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

// ─── Múltiplo com chips ───────────────────────────────────────────────────────

// O espião mora no ESCOPO DO MÓDULO. Criado dentro do `render`, a play não teria
// como alcançá-lo — e o meta deste arquivo não tem `args`, que era de onde ele
// vinha enquanto a story morava junto do Playground.
const multipleValueChange = fn();

export const MultipleWithChips: Story = {
	parameters: {
		covers: [
			'functional.item4',
			'functional.item5',
			'functional.item6',
			'accessibility.item5',
			'accessibility.item6',
			'visual.item2',
		],
		// A story mexe na lista aberta antes de fechar; ver o motivo do guarda de
		// foco em `wait-for-portal`.
		a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
		docs: {
			source: { transform: comboboxMultipleSource },
			description: {
				story:
					'Modo múltiplo: cada escolhido vira um chip dentro do campo. Backspace com o texto vazio remove o último.',
			},
		},
	},
	render: () => ({
		Component: ComboboxStory,
		props: {
			items: MULTIPLE_COUNTRIES,
			label: 'Países',
			placeholder: 'Adicionar país',
			// `multiple` fica fixo: é o assunto da story, e desligá-lo a deixaria
			// sem o que demonstrar.
			multiple: true,
			// Chips em linhas que se acumulam, que é o padrão do campo; a linha
			// única tem story própria logo abaixo.
			chipsLayout: 'wrap',
			name: 'paises',
			value: ['brasil', 'argentina'],
			onValueChange: multipleValueChange,
		},
	}),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const field = canvas.getByRole('combobox') as HTMLInputElement;
		const spy = multipleValueChange;
		const chips = () => canvasElement.querySelectorAll('[data-slot="combobox-chip"]');

		const chooseByKeyboard = async (text: string) => {
			await userEvent.clear(field);
			await userEvent.type(field, text);
			await waitFor(async () => {
				await expect(within(document.body).getAllByRole('option').length).toBeGreaterThan(0);
			});
			await userEvent.keyboard('{Enter}');
		};

		await step('Os escolhidos iniciais aparecem como chips', async () => {
			await waitFor(async () => {
				await expect(chips()).toHaveLength(2);
			});
			await expect(chips()[0]).toHaveTextContent('Brasil');
			await expect(chips()[1]).toHaveTextContent('Argentina');
		});

		await step('Cada botão de remover tem nome próprio', async () => {
			// Cinco botões chamados "Remover" são indistinguíveis para quem navega
			// por lista de controles — o rótulo entra no nome.
			await expect(canvas.getByRole('button', { name: 'Remover Brasil' })).toBeVisible();
			await expect(canvas.getByRole('button', { name: 'Remover Argentina' })).toBeVisible();
		});

		await step('Backspace com o texto vazio remove o último chip', async () => {
			// É o gesto que define o chip: sem ele, desfazer exige o mouse.
			spy.mockClear();
			await userEvent.clear(field);
			field.focus();
			await userEvent.keyboard('{Backspace}');
			await expect(spy).toHaveBeenCalledWith(['brasil']);
			await waitFor(async () => {
				await expect(chips()).toHaveLength(1);
			});
		});

		await step('O botão de remover do chip funciona pelo clique', async () => {
			// O passo anterior cobriu o Backspace, que é outro gesto para o mesmo
			// fim; este cobre o botão, e prova que o foco fica no campo.
			spy.mockClear();
			await userEvent.click(canvas.getByRole('button', { name: 'Remover Brasil' }));
			await expect(spy).toHaveBeenCalledWith([]);
			await waitFor(async () => {
				await expect(chips()).toHaveLength(0);
			});
			await expect(field).toHaveFocus();
		});

		await step('O texto do chip alcança 4.5:1 contra a superfície do campo', async () => {
			await chooseByKeyboard('brasil');
			const chip = (await waitFor(() => {
				const first = chips()[0] as HTMLElement | undefined;
				if (!first) throw new Error('chip ainda não montou');
				return first;
			})) as HTMLElement;
			const wrapper = canvasElement.querySelector<HTMLElement>(
				'[data-slot="combobox-input-wrapper"]',
			)!;
			const ratio = contrast(
				getComputedStyle(chip).color,
				getComputedStyle(wrapper).backgroundColor,
			);
			await expect(ratio).toBeGreaterThanOrEqual(4.5);
		});

		await step('Escolher pelo teclado devolve o segundo chip', async () => {
			// Devolve a story ao estado que o Chromatic fotografa, e prova a ida e a
			// volta na mesma rodada.
			await chooseByKeyboard('argentina');
			await waitFor(async () => {
				await expect(chips()).toHaveLength(2);
			});
			// Escolher no múltiplo limpa a busca: manter o filtro esconderia as
			// opções restantes atrás de um texto que ninguém digitou.
			await expect(field).toHaveValue('');
		});

		await step('Escape fecha a lista sem alterar a escolha', async () => {
			await userEvent.keyboard('{Escape}');
			await waitFor(async () => {
				await expect(field).toHaveAttribute('aria-expanded', 'false');
			});
			await expect(chips()).toHaveLength(2);
		});
	},
};

// ─── Com grupos ───────────────────────────────────────────────────────────────

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

// ─── Chips em linha única ─────────────────────────────────────────────────────

export const SingleLineChips: Story = {
	parameters: {
		docs: {
			source: { transform: comboboxSingleLineChipsSource },
			description: {
				story:
					'Chips numa linha só: o conjunto rola na horizontal em vez de acumular linhas, e limpar e abrir continuam ao lado do primeiro chip.',
			},
		},
	},
	render: () => ({
		Component: ComboboxStory,
		props: {
			items: VISITED,
			label: 'Países visitados',
			placeholder: 'Adicionar país',
			multiple: true,
			chipsLayout: 'single-line',
			name: 'visitados',
			value: ['brasil', 'argentina', 'chile', 'colombia', 'mexico', 'portugal'],
			// Campo estreito para o transbordo acontecer em qualquer largura de tela.
			// Classe do design system, e não medida no `style`: inline venceria a
			// folha e levaria a story para fora do tema e da densidade.
			class: 'nds-w-sm',
		},
	}),
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const wrapper = canvasElement.querySelector<HTMLElement>(
			'[data-slot="combobox-input-wrapper"]',
		)!;
		const box = canvasElement.querySelector<HTMLElement>('[data-slot="combobox-chips"]')!;
		const chips = () => [
			...canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]'),
		];

		await step('O campo declara o modo de chips escolhido', async () => {
			// A folha lê `data-chips` no WRAPPER, e não na caixa dos chips: sem o
			// atributo ali, a regra de linha única não alcança nada e o campo volta
			// a quebrar em linhas sem que a tela denuncie de imediato.
			await expect(wrapper).toHaveAttribute('data-chips', 'single-line');
		});

		await step('Os escolhidos não cabem na largura do campo', async () => {
			await waitFor(async () => {
				await expect(chips()).toHaveLength(6);
			});
			// Sem transbordo a story não mede nada: com folga sobrando, quebrar
			// linha e não quebrar desenham a mesma coisa.
			await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
		});

		await step('Mesmo transbordando, os chips ficam todos na primeira linha', async () => {
			const tops = chips().map((chip) => chip.getBoundingClientRect().top);
			for (const top of tops) {
				await expect(Math.abs(top - tops[0])).toBeLessThanOrEqual(2);
			}
		});

		await step('Limpar e abrir continuam na primeira linha', async () => {
			// Era este o defeito relatado: com os chips ocupando mais de uma linha,
			// os dois botões caíam para baixo. A conta é contra o PRIMEIRO CHIP, e
			// não contra o wrapper — o wrapper cresce junto com a pilha, então
			// medir por ele passaria com os botões afundados.
			//
			// A folga de 4px cobre a diferença de altura entre chip (28px) e botão
			// (24px), que ficam centrados um em relação ao outro; uma linha a mais
			// de chip empurraria os botões 28px para baixo.
			const first = chips()[0].getBoundingClientRect().top;
			const clear = canvas.getByRole('button', { name: 'Limpar' }).getBoundingClientRect().top;
			const trigger = canvas
				.getByRole('button', { name: 'Abrir lista' })
				.getBoundingClientRect().top;
			await expect(Math.abs(clear - first)).toBeLessThanOrEqual(4);
			await expect(Math.abs(trigger - first)).toBeLessThanOrEqual(4);
		});
	},
};
