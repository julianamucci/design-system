/**
 * Transforms do painel Code do Slider.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Duas coisas que só o snippet ensina: o valor é SEMPRE um array — o número de
 * alças sai do tamanho dele, não de uma prop — e o nome acessível vai no
 * componente, que o repassa a cada alça.
 */
import {
  attr,
  attrBool,
  attrNum,
  attrs,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type SliderArgs = {
  modelValue: number[];
  defaultValue: number[];
  min: number;
  max: number;
  step: number;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
};

const IMPORTS = `import { ref } from 'vue'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'`;

/** Só array de números vira estado inicial; qualquer outra coisa cai no padrão. */
function values(raw: unknown, padrao: number[]): number[] {
  return Array.isArray(raw) && raw.length > 0 && raw.every((n) => typeof n === 'number')
    ? raw
    : padrao;
}

/**
 * Bloco canônico: o rótulo e o valor corrente numa linha, o controle embaixo.
 *
 * O valor corrente é texto vivo (`aria-live="polite"`), e não um segundo
 * controle: quem arrasta com o ponteiro não ouve a alça, e sem esta linha o
 * número só existe para quem vê.
 */
function bloco(opcoes: {
  rotulo: string;
  state: string;
  saida?: string;
  controle: string;
  largura?: string;
  extra?: string;
}): string {
  const largura = opcoes.largura ?? 'nds-stack nds-w-sm';
  const header = opcoes.saida
    ? `  <div class="nds-cluster" data-justify="between">
    <Label>${opcoes.rotulo}</Label>
    <span aria-live="polite" class="nds-text-body nds-tabular-nums">${opcoes.saida}</span>
  </div>`
    : `  <Label>${opcoes.rotulo}</Label>`;
  return `<div class="${largura}" data-spacing="sm">
${header}
${indentar(opcoes.controle)}${opcoes.extra ? `\n${indentar(opcoes.extra)}` : ''}
</div>`;
}

/** O controle em si, com os atributos que diferem do padrão do componente. */
function controle(state: string, rotulo: string, extras = ''): string {
  return `<Slider v-model="${state}"${extras} aria-label="${rotulo}" />`;
}

/**
 * Forma canônica: um array no `v-model`, o rótulo ao lado do valor corrente e o
 * nome acessível no componente.
 *
 * `min`, `max`, `step` e `orientation` só aparecem quando diferem do padrão —
 * escrever `:min="0" :max="100" :step="1"` é repetir o que o componente já faz.
 */
export const sliderPlaygroundSource: SourceTransform<SliderArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const inicial = values(args.modelValue ?? args.defaultValue, [50]);
  const extras = attrs(
    attrNum('min', args.min, 0),
    attrNum('max', args.max, 100),
    attrNum('step', args.step, 1),
    attr('orientation', args.orientation, 'horizontal'),
    attrBool('disabled', args.disabled, false),
  );
  return vueSnippet(
    `${IMPORTS}\n\nconst volume = ref([${inicial.join(', ')}])`,
    bloco({
      rotulo: 'Volume',
      state: 'volume',
      saida: '{{ volume[0] }}%',
      controle: controle('volume', 'Volume', extras),
    }),
  );
};

/** Uma alça: um valor no array. É o array que decide, não uma prop de modo. */
export function sliderUnicoSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst volume = ref([50])`,
    bloco({
      rotulo: 'Volume',
      state: 'volume',
      saida: '{{ volume[0] }}%',
      controle: controle('volume', 'Volume'),
    }),
  );
}

/**
 * Duas alças: dois valores no mesmo array. Não há prop de faixa — o tamanho do
 * array é a única coisa que muda, e o preenchimento passa a ser o miolo entre
 * as duas alças em vez do começo do trilho.
 */
export function sliderRangeSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst faixa = ref([20, 80])`,
    bloco({
      rotulo: 'Faixa de preço',
      state: 'faixa',
      saida: 'R$ {{ faixa[0] }} — R$ {{ faixa[1] }}',
      controle: controle('faixa', 'Faixa de preço'),
    }),
  );
}

/**
 * Eixo vertical: a orientação muda o trilho, as teclas e a geometria. O
 * controle vai dentro de um contêiner que o centraliza — em pé ele não ocupa a
 * largura da coluna, e sem isso encosta na margem.
 */
export function sliderVerticalSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst brilho = ref([60])`,
    bloco({
      rotulo: 'Brilho',
      state: 'brilho',
      saida: '{{ brilho[0] }}%',
      largura: 'nds-stack',
      controle: `<div class="nds-cluster" data-justify="center">
  ${controle('brilho', 'Brilho', ' orientation="vertical"')}
</div>`,
    }),
  );
}

/** Estado de repouso: nada ligado além do valor e do nome. */
export function sliderDefaultSource(): string {
  return sliderUnicoSource();
}

/**
 * Foco: não há o que escrever.
 *
 * A alça já é focável e o anel vem da folha compartilhada. O que a story
 * mostra é o desenho do foco, não uma prop — e por isso o exemplo é o mínimo,
 * sem a linha de valor que distrairia do assunto.
 */
export function sliderFocusSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst volume = ref([50])`,
    bloco({
      rotulo: 'Volume',
      state: 'volume',
      controle: controle('volume', 'Volume'),
    }),
  );
}

/**
 * Desabilitado: a prop mora na RAIZ e alcança todas as alças de uma vez — não
 * há como desabilitar uma alça só de uma faixa.
 */
export function sliderDisabledSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst volume = ref([50])`,
    bloco({
      rotulo: 'Volume',
      state: 'volume',
      controle: controle('volume', 'Volume', ' disabled'),
    }),
  );
}

/**
 * No mínimo: o limite é do componente, não do exemplo. A seta para trás não
 * passa do piso — não há nada a escrever para que isso aconteça.
 */
export function minimumSliderSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst volume = ref([0])`,
    bloco({
      rotulo: 'Volume',
      state: 'volume',
      saida: '{{ volume[0] }}%',
      controle: controle('volume', 'Volume'),
    }),
  );
}

/** No máximo: o mesmo mecanismo, no outro extremo da faixa. */
export function sliderNoMaximoSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst volume = ref([100])`,
    bloco({
      rotulo: 'Volume',
      state: 'volume',
      saida: '{{ volume[0] }}%',
      controle: controle('volume', 'Volume'),
    }),
  );
}

/** Volume com o valor ao lado: o par mais comum do componente. */
export function sliderVolumeSource(): string {
  return sliderUnicoSource();
}

/**
 * Faixa de preço: passo grosso numa faixa larga, com os extremos escritos
 * embaixo do trilho. Os extremos são texto de apoio — quem os anuncia para
 * quem não vê é a própria alça, por `aria-valuemin` e `aria-valuemax`.
 */
export function sliderPrecoSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst faixa = ref([100, 400])`,
    bloco({
      rotulo: 'Faixa de preço',
      state: 'faixa',
      saida: 'R$ {{ faixa[0] }} — R$ {{ faixa[1] }}',
      controle: controle('faixa', 'Faixa de preço', ' :max="500" :step="10"'),
      extra: `<div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
  <span>R$ 0</span>
  <span>R$ 500</span>
</div>`,
    }),
  );
}

/**
 * Dentro de um formulário: cada controle leva o próprio nome acessível, porque
 * "Brilho" e "Opacidade" são duas alças idênticas para quem não vê a tela.
 */
export function sliderFormSource(): string {
  return vueSnippet(
    `${IMPORTS}
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const brilho = ref([70])
const opacidade = ref([100])
const salvo = ref('')

function salvar() {
  salvo.value = \`Brilho \${brilho.value[0]}% · Opacidade \${opacidade.value[0]}%\`
}`,
    `<form
  class="nds-stack nds-w-sm"
  data-spacing="md"
  aria-label="Configurações de áudio"
  @submit.prevent="salvar"
>
  <div class="nds-stack" data-spacing="sm">
    <Label for="preset-nome">Nome do preset</Label>
    <Input id="preset-nome" placeholder="Meu preset" />
  </div>

${indentar(
  bloco({
    rotulo: 'Brilho',
    state: 'brilho',
    saida: '{{ brilho[0] }}%',
    controle: controle('brilho', 'Brilho'),
    largura: 'nds-stack',
  }),
)}

${indentar(
  bloco({
    rotulo: 'Opacidade',
    state: 'opacidade',
    saida: '{{ opacidade[0] }}%',
    controle: controle('opacidade', 'Opacidade'),
    largura: 'nds-stack',
  }),
)}

  <Button type="submit" size="sm">Salvar preset</Button>
  <p class="nds-text-caption nds-text-muted-foreground" aria-live="polite">{{ salvo }}</p>
</form>`,
  );
}

/**
 * Faixa curta: cinco posições, uma por passo. A escala embaixo é decorativa —
 * o que o leitor de tela recebe são os limites da própria alça.
 */
export function sliderStepGrossoSource(): string {
  return vueSnippet(
    `${IMPORTS}\n\nconst avaliacao = ref([3])`,
    bloco({
      rotulo: 'Avaliação',
      state: 'avaliacao',
      saida: '{{ avaliacao[0] }} / 5',
      controle: controle('avaliacao', 'Avaliação', ' :min="1" :max="5"'),
      extra: `<div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
  <span>1</span>
  <span>2</span>
  <span>3</span>
  <span>4</span>
  <span>5</span>
</div>`,
    }),
  );
}
