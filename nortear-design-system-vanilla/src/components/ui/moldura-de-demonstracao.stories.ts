// Portão da MOLDURA DE DEMONSTRAÇÃO: camada flutuante dentro dela não pode ser
// recortada por nenhum cartão acima.
//
// Nasceu de três rodadas de conserto no mesmo ponto, todas encontradas por olho
// numa captura de tela e nenhuma por portão. O defeito é este: as molduras que
// emolduram componente vivo — `demonstracao` do ComponentDemo, `do` e `dont` do
// Do & Don't — são `.nds-card`, e o card tem `overflow: hidden` desde o primeiro
// commit do `.nds-*`, para que imagem e fundo respeitem o raio.
//
// Recortar é certo no card de produto e errado na moldura de demo, e a diferença
// só aparece com componente que abre CAMADA FLUTUANTE inline: o painel é
// posicionado fora do fluxo, então não empurra a altura do card — a moldura fica
// do tamanho do gatilho e o painel é decepado. Foi o que aconteceu com o seletor
// de modelo, e o conserto precisou de duas passadas porque a primeira soltou só
// a moldura, e no Do & Don't quem recortava era o cartão que envolve a SEÇÃO.
//
// POR QUE A PROVA É GEOMÉTRICA, e não "nenhum ancestral tem overflow hidden"
//
// A segunda formulação é mais fácil de escrever e prova menos: ela fixa a
// IMPLEMENTAÇÃO de hoje. Amanhã o recorte pode vir de `clip-path`, de
// `contain: paint` ou de um `mask`, e a asserção continuaria verde com o painel
// cortado na tela. Medir o retângulo contra o de quem recorta prova o que
// importa — que a camada aparece inteira —, e é indiferente ao mecanismo.
//
// POR QUE A SONDA É ABSOLUTA, e escapa para CIMA
//
// Porque é o caso real: o painel do seletor de modelo abre acima do gatilho
// quando não há espaço embaixo, e foi exatamente a metade de cima dele que
// apareceu cortada. Uma sonda que crescesse no fluxo empurraria a altura do
// cartão e não seria recortada nunca — passaria sem provar nada.
//
// Vanilla é a referência cross-stack, e a folha medida aqui
// (`docs/shared/styles/nds/docs-demo.css`) é a mesma nas cinco.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createButton } from './button';
import { createComponentDemo } from '@/components/ComponentDemo';
import { createDocsDoDont } from '@/components/docs/shared/sections/DocsDoDont';

const meta: Meta = {
  title: 'QA/Moldura de Demonstração',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    // A sonda escapa da moldura de propósito, e sobrepor é o comportamento
    // provado. O axe leria a sobreposição como conteúdo obscurecido.
    a11y: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/** Marca que identifica a sonda na árvore, para a asserção achá-la. */
const SONDA = 'data-sonda-flutuante';

/**
 * Um gatilho com uma camada flutuante presa a ele, como um seletor aberto.
 *
 * Só propriedades mecânicas no `style`: posição e deslocamento não são valor de
 * design (guideline 12). A largura nasce do texto, para não cravar medida.
 */
function gatilhoComPainel(): HTMLElement {
  const ancora = document.createElement('div');
  ancora.style.position = 'relative';

  ancora.appendChild(createButton({ label: 'Abrir', variant: 'outline' }));

  const painel = document.createElement('div');
  painel.setAttribute(SONDA, 'true');
  painel.className = 'nds-card';
  painel.textContent = 'Camada que escapa da moldura para cima';
  painel.style.position = 'absolute';
  // Acima do gatilho: é a direção que apareceu cortada em produção.
  painel.style.insetBlockEnd = '100%';
  painel.style.insetInlineStart = '0';
  painel.style.zIndex = '1';
  ancora.appendChild(painel);

  return ancora;
}

/** Recorta? Devolve o nome de quem recorta, ou null. */
function quemRecorta(sonda: HTMLElement, parar: Element): string | null {
  const r = sonda.getBoundingClientRect();
  // Sonda sem área é sinal de montagem errada, não de aprovação.
  if (r.width === 0 || r.height === 0) return 'a própria sonda não tem área — a montagem falhou';

  let no = sonda.parentElement;
  while (no && no !== parar) {
    const cs = getComputedStyle(no);
    const recorta = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
    if (recorta) {
      const a = no.getBoundingClientRect();
      // Folga de 1px: subpixel de layout não é recorte.
      const cortado =
        r.top < a.top - 1 || r.left < a.left - 1 || r.bottom > a.bottom + 1 || r.right > a.right + 1;
      if (cortado) {
        const id = no.className || no.tagName.toLowerCase();
        return `${id} (overflow ${cs.overflowX}/${cs.overflowY}) corta a camada`;
      }
    }
    no = no.parentElement;
  }
  return null;
}

function medir(canvasElement: HTMLElement): string | null {
  const sonda = canvasElement.querySelector<HTMLElement>(`[${SONDA}]`);
  if (!sonda) return 'a sonda não foi montada';
  // Força um layout ANTES de medir, uma vez. Nada de `waitFor` aqui: a condição
  // lê geometria, e leitura que provoca layout dentro de `waitFor` reagenda a si
  // mesma até o prazo nunca chegar — a armadilha registrada no CLAUDE.md.
  void sonda.offsetHeight;
  return quemRecorta(sonda, canvasElement);
}

/**
 * A moldura da seção Demonstração. Aqui o cartão da moldura é o mais externo,
 * então só ele podia recortar — foi o caso que a primeira passada do conserto
 * resolveu.
 */
export const Demonstracao: Story = {
  render: () => createComponentDemo(gatilhoComPainel()),
  play: async ({ canvasElement }) => {
    await expect(medir(canvasElement)).toBe(null);
  },
};

/**
 * A moldura do Do & Don't, montada pela SEÇÃO REAL.
 *
 * É o caso que a primeira passada não pegou, e por isso a story usa
 * `createDocsDoDont` em vez de imitar a árvore: o que faltava soltar era o
 * cartão que envolve a seção, quatro níveis acima da moldura. Uma imitação com
 * um nível teria passado.
 */
export const DoEDont: Story = {
  render: () =>
    createDocsDoDont({
      title: 'Certo e errado',
      pairs: [
        {
          doLabel: 'Faça isso',
          dontLabel: 'Não faça isso',
          doCaption: 'A camada aparece inteira.',
          dontCaption: 'A camada é decepada pelo cartão da seção.',
          doPreviewFactory: gatilhoComPainel,
          dontPreviewFactory: () => createButton({ label: 'Sem camada', variant: 'outline' }),
        },
      ],
    }),
  play: async ({ canvasElement }) => {
    await expect(medir(canvasElement)).toBe(null);
  },
};
