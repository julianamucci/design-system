// Portão de WCAG 1.4.11 (Non-text Contrast) na borda dos CAMPOS.
//
// O fundo do campo é o mesmo da página (`--input-background` == `--background`
// nos três temas): a borda é a única coisa que diz onde o campo começa. Ela
// ficou anos em ~1.25:1 porque `--input` copiava `--border`, que é linha
// decorativa. A rodada de foundations escureceu `--input` até ~3.2:1 e
// desacoplou os dois tokens.
//
// A asserção mora AQUI, e não em cada componente, por três razões:
//
//   1. o que está sendo provado é um TOKEN e uma folha compartilhada
//      (docs/shared/themes/*.css + docs/shared/styles/nds/*.css), não o
//      comportamento de um componente. Uma cópia por componente afirmaria seis
//      vezes a mesma linha de CSS;
//   2. `--input` não é redeclarado em nenhuma stack — só existe em
//      docs/shared —, então a prova não se multiplica por stack: o que cada
//      stack precisa provar (que o componente carrega a classe `.nds-*`) já é
//      portão nas stories do próprio componente;
//   3. a varredura de tema exige trocar `tema-*`/`dark` numa raiz e devolver a
//      classe no fim. Espalhar isso por seis plays multiplica a chance de uma
//      delas deixar o tema posto e envenenar a story seguinte.
//
// Vanilla é a referência cross-stack, então é aqui que a folha compartilhada é
// medida.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import {
  declaracaoDaRegra,
  descreverMedida,
  medirCorPorTema,
  porTema,
  razao,
  resolverCor,
  type AlvoDeCor,
} from '@shared/testing/cor';
import { createInput } from './input';
import { createTextarea } from './textarea';
import { createSelect } from './select';
import { createCheckbox } from './checkbox';
import { createSwitch } from './switch';

const meta: Meta = {
  title: 'QA/Borda de Campo',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

const MINIMO = 3;

/**
 * Um de cada família que consome `--input`.
 *
 * O grupo de input entra montado à mão porque a moldura é do GRUPO e o controle
 * interno fica nu (ver cabeçalho de input-group.css) — é o único caso em que a
 * borda medida não pertence ao campo que recebe o texto.
 *
 * O switch entra pelo PREENCHIMENTO: `--input` pinta o trilho desligado, não uma
 * borda. Era o consumidor com a pior medida antes da mudança (o polegar em
 * `--background` sobre o trilho dava 1.25:1 — polegar invisível).
 */
function cenario(): HTMLElement {
  const raiz = document.createElement('div');
  // .nds-stack já dá 16px de ritmo vertical entre os filhos diretos; o fundo
  // opaco é o que a medição compara contra (o campo é transparente ao redor).
  raiz.className = 'nds-bg-background nds-stack nds-p-4';

  const campo = createInput({ placeholder: 'Campo de texto' });
  campo.setAttribute('aria-label', 'Campo de texto');

  const area = createTextarea({ placeholder: 'Área de texto' });
  area.setAttribute('aria-label', 'Área de texto');

  const escolha = createSelect({
    items: [
      { value: 'a', label: 'Opção A' },
      { value: 'b', label: 'Opção B' },
    ],
    defaultValue: 'a',
  });
  escolha.setAttribute('aria-label', 'Escolha');

  const marca = createCheckbox({ id: 'borda-de-campo-checkbox', 'aria-label': 'Caixa de seleção' });
  const chave = createSwitch({ checked: false, 'aria-label': 'Chave liga-desliga' });

  const grupo = document.createElement('div');
  grupo.className = 'nds-input-group';
  const addon = document.createElement('span');
  addon.className = 'nds-input-group-addon';
  addon.dataset.align = 'inline-start';
  addon.textContent = 'https://';
  const interno = createInput({ placeholder: 'exemplo.com' });
  interno.setAttribute('aria-label', 'Endereço do site');
  interno.classList.add('nds-input-group-control');
  interno.dataset.slot = 'input-group-control';
  grupo.append(addon, interno);

  raiz.append(campo, area, escolha, marca, chave, grupo);
  return raiz;
}

const ALVOS: AlvoDeCor[] = [
  { nome: 'input', seletor: 'input.nds-input:not(.nds-input-group-control)' },
  { nome: 'textarea', seletor: '.nds-textarea' },
  { nome: 'select', seletor: '.nds-select' },
  { nome: 'checkbox', seletor: '.nds-checkbox' },
  { nome: 'input-group', seletor: '.nds-input-group' },
  { nome: 'switch (trilho desligado)', seletor: '.nds-switch', lado: 'preenchimento' },
];

/**
 * A borda em REPOUSO alcança 3:1 contra o fundo, nos três temas e nos dois
 * modos.
 *
 * Mede cor computada, não nome de token: se alguém reintroduzir
 * `hsl(var(--border))` num campo, o valor volta a 1.25:1 e esta story fica
 * vermelha mesmo que o CSS continue "parecendo" certo.
 */
export const RepousoAlcanca3a1: Story = {
  render: cenario,
  play: async ({ canvasElement }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-bg-background')!;
    const medidas = medirCorPorTema(raiz, ALVOS);

    await expect(medidas).toHaveLength(ALVOS.length * 6);

    const ausentes = medidas.filter((m) => !m.presente || m.razao === null);
    await expect(ausentes.map(descreverMedida)).toEqual([]);

    const fracas = medidas.filter((m) => (m.razao ?? 0) < MINIMO);
    await expect(fracas.map(descreverMedida)).toEqual([]);
  },
};

/**
 * Hover e foco continuam ACIMA do repouso depois que o repouso escureceu.
 *
 * A pseudo-classe `:hover` não acende com evento sintético, então o que se lê
 * aqui é a declaração da folha resolvida dentro da árvore com o tema aplicado —
 * o navegador expande o `var()` e compõe o alfa. Foi assim que se viu que
 * `hsl(var(--ring) / 0.4)` compunha em ~1.7:1 e passaria a APAGAR a borda no
 * hover, invertendo o sinal do estado.
 */
export const HoverEFocoNaoFicamAbaixoDoRepouso: Story = {
  render: cenario,
  play: async ({ canvasElement }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-bg-background')!;
    const campo = raiz.querySelector<HTMLElement>('input.nds-input:not(.nds-input-group-control)')!;
    const doc = canvasElement.ownerDocument;

    const corDeHover = declaracaoDaRegra(
      doc,
      (sel) => sel.startsWith('.nds-input:hover'),
      'border-color',
    );
    const corDeFoco = declaracaoDaRegra(
      doc,
      (sel) => sel.startsWith('.nds-input:focus-visible'),
      'border-color',
    );
    await expect(corDeHover, 'regra de hover do .nds-input sumiu da folha').not.toBeNull();
    await expect(corDeFoco, 'regra de foco do .nds-input sumiu da folha').not.toBeNull();

    campo.style.transition = 'none';
    const problemas = porTema(raiz, (tema, modo) => {
      const fundo = getComputedStyle(campo).backgroundColor;
      const repouso = razao(getComputedStyle(campo).borderTopColor, fundo)?.razao ?? 0;
      const hover = razao(resolverCor(raiz, corDeHover!) ?? fundo, fundo)?.razao ?? 0;
      const foco = razao(resolverCor(raiz, corDeFoco!) ?? fundo, fundo)?.razao ?? 0;

      const linha = `${tema}/${modo} repouso ${repouso}:1 · hover ${hover}:1 · foco ${foco}:1`;
      if (hover < repouso) return `hover ABAIXO do repouso — ${linha}`;
      if (foco < repouso) return `foco ABAIXO do repouso — ${linha}`;
      if (foco < MINIMO) return `foco abaixo de ${MINIMO}:1 — ${linha}`;
      return null;
    });
    campo.style.removeProperty('transition');

    await expect(problemas.filter(Boolean)).toEqual([]);
  },
};
