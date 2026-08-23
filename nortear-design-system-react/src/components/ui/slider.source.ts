/**
 * Transforms do painel Code do Slider.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: o `style` com
 * `height`/`width` do quadro vertical e a `.nds-demo-box` — moldura de
 * documentação, e a própria folha diz isso ao definir a classe ("a altura ali
 * é ANDAIME DE DOCUMENTAÇÃO, não contrato do componente"). A barra vertical já
 * carrega `min-height` na regra `[data-orientation="vertical"]`: ela fica em pé
 * sozinha, e cravar altura no exemplo ensinaria uma dependência que não existe.
 *
 * Duas decisões de composição valem para todos os snippets:
 *
 *  · **O contêiner de largura fica.** O controle nasce com `width: 100%`, então
 *    fora de um bloco com largura ele ocupa a página inteira. `nds-w-sm` é o
 *    uso real, não moldura.
 *  · **`aria-label` sempre presente.** A alça é o elemento com `role="slider"`,
 *    e sem nome ela é anunciada só como "controle deslizante". O rótulo visível
 *    ao lado não a nomeia sozinho — `<Label>` aponta para o campo, e o campo
 *    aqui é a alça que a lib desenha por dentro.
 *
 * O par `value` + `onValueChange` aparece com estado de VERDADE, nunca com o
 * arg do Storybook: o painel entrega `onValueChange` como espião, e o corpo do
 * mock apareceria como se fosse código do design system.
 */
import {
  childText,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type SliderArgs = {
  min: number;
  max: number;
  step: number;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
  'aria-label': string;
};

const ORIENTACOES = ['horizontal', 'vertical'] as const;

/** Faixa e passo padrão do primitivo — o que já é padrão não entra no snippet. */
const MINIMUM_DEFAULT = 0;
const MAXIMO_DEFAULT = 100;
const STEP_DEFAULT = 1;

const IMPORT_STATE = 'import { useState } from "react";';
const IMPORT = 'import { Slider } from "@/components/ui/slider";';
const IMPORT_LABEL = 'import { Label } from "@/components/ui/label";';

/** Cabeçalho com o estado da(s) alça(s) declarado, que é o uso controlado. */
function state(nome: string, setter: string, valueInitial: string, extras = ''): string {
  return `${IMPORT_STATE}
${IMPORT}${extras ? `\n${extras}` : ''}

const [${nome}, ${setter}] = useState(${valueInitial});`;
}

/**
 * Atributos da faixa. Só o que difere do padrão: repetir `min={0} max={100}`
 * em todo exemplo ensina ruído a quem copia.
 */
function faixa(args: Partial<SliderArgs>): Array<string | undefined> {
  return [
    typeof args.min === 'number' && args.min !== MINIMUM_DEFAULT
      ? propNumber('min', args.min)
      : undefined,
    typeof args.max === 'number' && args.max !== MAXIMO_DEFAULT
      ? propNumber('max', args.max)
      : undefined,
    typeof args.step === 'number' && args.step !== STEP_DEFAULT
      ? propNumber('step', args.step)
      : undefined,
  ];
}

/**
 * Linha de rótulo e valor corrente. `aria-live="polite"` no número é o que
 * entrega a mudança a quem não vê a alça andar: sem ele o valor muda em
 * silêncio, e a alça anuncia só o próprio `aria-valuenow` quando tem foco.
 */
function valueLine(rotulo: string, valor: string, comLabel = false): string {
  const nome = comLabel
    ? `    <Label>${rotulo}</Label>`
    : `    <span className="nds-text-body nds-text-muted-foreground">${rotulo}</span>`;
  return `  <div className="nds-cluster" data-justify="between">
${nome}
    <span aria-live="polite" className="nds-text-body nds-tabular-nums">
      ${valor}
    </span>
  </div>`;
}

/**
 * O controle já indentado dentro do bloco: uma linha enquanto os atributos
 * cabem, uma por linha quando não cabem. Atributo em fila longa some na barra
 * de rolagem do painel, que é estreito.
 */
function tag(partes: Array<string | false | null | undefined>): string {
  const lista = partes.filter((p): p is string => Boolean(p));
  const inLine = lista.join(' ');
  if (inLine.length <= 52) return `  <Slider ${inLine} />`;
  return `  <Slider\n${lista.map((p) => `    ${p}`).join('\n')}\n  />`;
}

/** Bloco vertical: sem largura de página e com o valor acima da barra. */
function emPe(conteudo: string): string {
  return `<div className="nds-stack" data-align="center" data-spacing="sm">
${conteudo}
</div>`;
}

/** Bloco horizontal: a largura do contêiner é a largura do controle. */
function deitado(conteudo: string): string {
  return `<div className="nds-stack nds-w-sm" data-spacing="sm">
${conteudo}
</div>`;
}

/**
 * Transform do `meta` — vale para todas as stories dos quatro arquivos. Lê os
 * controls do Playground e troca a COMPOSIÇÃO junto com a orientação: em pé, a
 * linha de rótulo e valor lado a lado não caberia na coluna estreita, e o valor
 * vai para cima da barra.
 */
export const sliderSource: SourceTransform<SliderArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const rotulo = childText(args['aria-label'], 'Volume');
  const emPeAgora = args.orientation === 'vertical';

  const controle = tag([
    'value={volume}',
    'onValueChange={setVolume}',
    ...faixa(args),
    propOption('orientation', args.orientation, ORIENTACOES, 'horizontal'),
    propBool('disabled', args.disabled),
    `aria-label="${rotulo}"`,
  ]);

  const corpo = emPeAgora
    ? emPe(
        `  <span aria-live="polite" className="nds-text-body nds-tabular-nums">
    {volume[0]}
  </span>
${controle}`,
      )
    : deitado(`${valueLine(rotulo, '{volume[0]}')}\n${controle}`);

  return jsxSnippet(state('volume', 'setVolume', '[50]'), corpo);
};

/**
 * Duas alças. O que cria a segunda NÃO é uma prop: é o `value` chegar com dois
 * números. Um array de um elemento desenha uma alça só — e devolver ao estado o
 * número que o primitivo emite, em vez do array, era o que fazia uma segunda
 * alça brotar no meio da interação.
 */
export function sliderRangeSource(): string {
  return jsxSnippet(
    state('faixaDePreco', 'setFaixaDePreco', '[20, 80]'),
    deitado(
      `${valueLine('Faixa de preço', '{`R$ ${faixaDePreco[0]} — R$ ${faixaDePreco[1]}`}')}
  <Slider
    value={faixaDePreco}
    onValueChange={setFaixaDePreco}
    aria-label="Faixa de preço"
  />`,
    ),
  );
}

/**
 * Em pé. A altura não vem de contêiner: a regra da orientação vertical já
 * carrega `min-height`, e o controle levanta sozinho. O valor sobe para cima da
 * barra porque, em pé, não há largura para o par rótulo/valor lado a lado.
 */
export function sliderVerticalSource(): string {
  return jsxSnippet(
    state('brilho', 'setBrilho', '[50]'),
    emPe(
      `  <span aria-live="polite" className="nds-text-body nds-tabular-nums">
    {brilho[0]}%
  </span>
  <Slider
    value={brilho}
    onValueChange={setBrilho}
    orientation="vertical"
    aria-label="Brilho"
  />`,
    ),
  );
}

/**
 * Não controlado. `defaultValue` é o caso em que o valor não precisa sair do
 * componente — sem estado, sem re-render a cada pixel do arrasto. É a forma
 * mais curta que existe do controle, e a que as stories de aparência usam.
 */
export function sliderNotControlledSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-w-sm">
  <Slider defaultValue={[50]} aria-label="Volume" />
</div>`,
  );
}

/**
 * Desabilitado. `disabled` desliga as alças TODAS de uma vez, e é ele — não uma
 * classe — que tira o controle da ordem de tabulação e marca `data-disabled`
 * para a folha pintar.
 */
export function sliderDisabledSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-w-sm">
  <Slider defaultValue={[50]} disabled aria-label="Volume desabilitado" />
</div>`,
  );
}

/**
 * Com `<Label>`. O rótulo visível e o `aria-label` convivem de propósito: quem
 * recebe `role="slider"` é a alça, lá dentro, e `htmlFor` não a alcança. Tirar
 * um dos dois deixa alguém sem nome — ou quem vê, ou quem ouve.
 */
export function sliderWithLabelSource(): string {
  return jsxSnippet(
    state('volume', 'setVolume', '[75]', IMPORT_LABEL),
    deitado(
      `${valueLine('Volume', '{`${volume[0]}%`}', true)}
  <Slider value={volume} onValueChange={setVolume} aria-label="Volume" />`,
    ),
  );
}

/**
 * Faixa de preço com unidade. `max` fora do padrão e `step` de 10 andam juntos:
 * numa faixa de 500 reais, a seta de teclado andando de 1 em 1 exigiria 500
 * toques para atravessar o controle.
 */
export function sliderPrecoSource(): string {
  return jsxSnippet(
    state('preco', 'setPreco', '[100, 400]', IMPORT_LABEL),
    deitado(
      `${valueLine('Faixa de preço', '{`R$ ${preco[0]} — R$ ${preco[1]}`}', true)}
  <Slider
    value={preco}
    onValueChange={setPreco}
    max={500}
    step={10}
    aria-label="Faixa de preço"
  />`,
    ),
  );
}

/**
 * Passo maior que um. `step` é o incremento de CADA seta do teclado, não só a
 * granularidade do arrasto — é o que garante que o valor alcançável pelo mouse
 * também seja alcançável sem ele.
 */
export function sliderStepSource(): string {
  return jsxSnippet(
    state('nivel', 'setNivel', '[50]', IMPORT_LABEL),
    deitado(
      `${valueLine('Nível', '{nivel[0]}', true)}
  <Slider value={nivel} onValueChange={setNivel} step={10} aria-label="Nível" />`,
    ),
  );
}

/**
 * Em formulário. Cada controle tem nome PRÓPRIO: dois sliders com o mesmo
 * `aria-label` deixam quem navega por teclado sem saber qual está mexendo, e é
 * o erro mais comum quando o rótulo visível é a única identificação.
 */
export function formSliderSource(): string {
  return jsxSnippet(
    `${IMPORT_STATE}
${IMPORT}
${IMPORT_LABEL}
import { Button } from "@/components/ui/button";

const [volume, setVolume] = useState([60]);
const [brilho, setBrilho] = useState([80]);`,
    `<form
  aria-label="Configurações de áudio"
  className="nds-stack nds-w-sm"
  data-spacing="md"
  onSubmit={(evento) => evento.preventDefault()}
>
  <div className="nds-stack" data-spacing="sm">
${campo('Volume', 'volume', 'setVolume')}
  </div>
  <div className="nds-stack" data-spacing="sm">
${campo('Brilho', 'brilho', 'setBrilho')}
  </div>
  <Button type="submit" size="sm">Salvar preset</Button>
</form>`,
  );
}

/** Um controle do formulário: rótulo, valor corrente e barra. */
function campo(rotulo: string, valor: string, setter: string): string {
  return `    <div className="nds-cluster" data-justify="between">
      <Label>${rotulo}</Label>
      <span aria-live="polite" className="nds-text-body nds-tabular-nums">
        {\`\${${valor}[0]}%\`}
      </span>
    </div>
    <Slider value={${valor}} onValueChange={${setter}} aria-label="${rotulo}" />`;
}
