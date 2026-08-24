/**
 * Transforms do painel Code do Switch.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é andaime e não entra no snippet: a `key`
 * de remontagem do Playground existe só porque `defaultChecked` é prop de
 * MONTAGEM e o control precisa remontar o componente para mexer nela; o
 * invólucro `onCheckedChange={(checked) => onCheckedChange?.(checked)}` existe
 * só para o espião da aba Actions não receber o evento nativo (serializá-lo
 * estoura SecurityError). Quem copia escreve `onCheckedChange={setAtivo}`.
 *
 * A decisão de composição é o PAR: o Switch nunca aparece sozinho no snippet.
 * Um interruptor sem rótulo associado não tem nome acessível e não alterna pelo
 * clique no texto — e é justamente o `htmlFor`/`id` que dá as duas coisas de
 * uma vez.
 */
import {
  attrs,
  jsxSnippet,
  propBool,
  propOption,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

export type SwitchArgs = {
  defaultChecked: boolean;
  disabled: boolean;
  name: string;
  size: 'default' | 'sm';
};

const SIZES = ['default', 'sm'] as const;

const IMPORTS = `import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";`;

/**
 * O par rótulo ↔ controle, que é a unidade mínima utilizável do componente.
 *
 * O `id` do Switch e o `htmlFor` do Label são a mesma string por contrato: é
 * essa ligação que nomeia o controle para o leitor de tela e que faz o clique
 * no texto alternar o interruptor.
 */
function pairLabelled(id: string, label: string, attrs = ''): string {
  return `<div className="nds-cluster" data-spacing="sm">
  <Switch id="${id}"${attrs} />
  <Label htmlFor="${id}">${label}</Label>
</div>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground e imprime só o que difere do padrão do componente.
 *
 * `checked` não entra: é prop CONTROLADA e não tem control neste arquivo
 * (dar valor a ela congelaria o Playground). Quem quer o estado inicial usa
 * `defaultChecked`, e quem quer o estado controlado está na story própria.
 *
 * `onCheckedChange` NÃO é interpolado: o Storybook o entrega como espião, e o
 * corpo do mock apareceria no painel como se fosse código do design system.
 */
export const switchSource: SourceTransform<SwitchArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const attrList = attrs(
    propBool('defaultChecked', args.defaultChecked),
    propBool('disabled', args.disabled),
    propText('name', args.name),
    propOption('size', args.size, SIZES, 'default'),
  );
  return jsxSnippet(
    IMPORTS,
    pairLabelled('notificacoes', 'Receber notificações', attrList),
  );
};

/**
 * Painel de configuração: texto à esquerda, controle à direita.
 *
 * A descrição fica FORA do `Label` de propósito — dentro dele entraria no nome
 * acessível, e quem usa leitor de tela ouviria a frase inteira toda vez que
 * passasse pelo controle. O nome é o rótulo; a frase é contexto para quem vê.
 */
export function switchWithDescriptionSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<div
  className="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4"
  data-align="center"
  data-justify="between"
>
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="emails-marketing">Emails de marketing</Label>
    <p className="nds-text-body">Receba novidades e promoções da plataforma.</p>
  </div>
  <Switch id="emails-marketing" />
</div>`,
  );
}

/**
 * Degrau compacto. O que se escreve é só `size="sm"`: a medida do trilho e do
 * thumb vive no CSS compartilhado, atrás do `data-size`. O par com o padrão que
 * a story desenha ao lado é vitrine de comparação, não composição a copiar.
 */
export function switchCompactoSource(): string {
  return jsxSnippet(IMPORTS, pairLabelled('modo-compacto', 'Modo compacto', ' size="sm"'));
}

/**
 * Ligado na montagem. `defaultChecked` é prop de MONTAGEM e não-controlada: o
 * componente segue dono do próprio estado depois disso. Trocar por `checked`
 * aqui congelaria o interruptor no valor escrito.
 */
export function switchLigadoSource(): string {
  return jsxSnippet(IMPORTS, pairLabelled('notificacoes', 'Receber notificações', ' defaultChecked'));
}

/**
 * Desabilitado — estado que só existe no `render` da story, sem control que o
 * descreva neste arquivo. O rótulo continua ali: desabilitar o controle não é
 * motivo para esconder o que ele significa.
 */
export function switchDisabledSource(): string {
  return jsxSnippet(
    IMPORTS,
    pairLabelled('notificacoes', 'Receber notificações', ' disabled'),
  );
}

/**
 * Desabilitado E ligado. As duas props juntas são o assunto: quem lê a tela
 * precisa saber que a opção está ATIVA ainda que não possa mudá-la — desligado
 * e bloqueado são fatos diferentes, e o desenho sozinho não os separa.
 */
export function switchDisabledLigadoSource(): string {
  return jsxSnippet(IMPORTS, pairLabelled('notificacoes', 'Receber notificações', ' disabled defaultChecked'));
}

/**
 * Inválido. `aria-invalid` sozinho pinta o anel de erro e não diz o que houve;
 * é o `aria-describedby` apontando para a mensagem que fecha o par. Os dois
 * andam juntos ou nenhum dos dois serve.
 */
export function switchInvalidoSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<div className="nds-stack" data-spacing="xs">
  <div className="nds-cluster" data-spacing="sm">
    <Switch
      id="aceitar-termos"
      aria-invalid="true"
      aria-describedby="aceitar-termos-erro"
    />
    <Label htmlFor="aceitar-termos">Aceitar termos</Label>
  </div>
  <p id="aceitar-termos-erro" className="nds-text-body nds-text-destructive">
    Este campo é obrigatório.
  </p>
</div>`,
  );
}

/**
 * Lista de configurações: painéis idênticos empilhados, um por preferência.
 *
 * A descrição fica FORA do `Label` de propósito — dentro dele entraria no nome
 * acessível, e quem usa leitor de tela ouviria a frase inteira toda vez que
 * passasse pelo controle.
 *
 * A lista é escrita por extenso, e não mapeada de um array: no snippet o que
 * importa é a FORMA de cada linha, e um `map` esconderia justamente ela.
 */
export function switchPreferenciasSource(): string {
  const painel = (id: string, label: string, descricao: string, ligado = false) => `    <div
      className="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
      data-align="center"
      data-justify="between"
    >
      <div className="nds-stack nds-pr-4" data-spacing="xs">
        <Label htmlFor="${id}">${label}</Label>
        <p className="nds-text-body">${descricao}</p>
      </div>
      <Switch id="${id}"${ligado ? ' defaultChecked' : ''} />
    </div>`;

  // É `fieldset` + `legend`, e não `div` + `<p>`, porque os três interruptores
  // são UM grupo: só o fieldset amarra os controles ao título, e é assim que o
  // leitor de tela anuncia "Preferências de notificação" ao entrar em cada um
  // (WCAG 1.3.1). Com `<p>` o título é texto solto e os três ficam órfãos.
  // O `nds-stack` mora no div INTERNO: fieldset com display flex/grid tem
  // histórico de bug de layout em navegador.
  return jsxSnippet(
    IMPORTS,
    `<fieldset className="nds-border-none nds-p-0 nds-m-0 nds-w-md">
  <legend className="nds-text-body nds-font-semibold nds-mb-2">Preferências de notificação</legend>
  <div className="nds-stack" data-spacing="sm">
${painel('pref-email', 'Receber novidades por email', 'Resumo semanal sobre o produto.', true)}
${painel('pref-push', 'Receber notificações push', 'Alertas no dispositivo em tempo real.')}
${painel('pref-sms', 'Alertas por SMS', 'Eventos críticos via mensagem de texto.')}
  </div>
</fieldset>`,
  );
}

/**
 * Controlado por estado externo. O par é sempre este: `checked` recebe o valor
 * e o callback de mudança o devolve. Passar só `checked` deixa o interruptor
 * inerte — ele deixa de ser dono do próprio estado e ninguém assume o lugar.
 */
export function switchControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORTS}

const [ativo, setAtivo] = useState(false);`,
    `<div className="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
  <div className="nds-cluster" data-spacing="sm">
    <Switch id="tema-escuro" checked={ativo} onCheckedChange={setAtivo} />
    <Label htmlFor="tema-escuro">Modo escuro</Label>
  </div>
  <p className="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code className="nds-font-mono">{String(ativo)}</code>
  </p>
</div>`,
  );
}

/**
 * Sem rótulo visível: o nome vive em `aria-label`, e continua obrigatório.
 *
 * O snippet mostra o controle SOZINHO de propósito — é a única composição em
 * que o par rótulo ↔ controle não aparece, e é justamente por isso que ela
 * precisa deixar o nome explícito. Sem ele o leitor de tela anuncia "botão".
 */
export function switchSemRotuloSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<Switch id="modo-escuro" aria-label="Ativar modo escuro" />`,
  );
}

/**
 * Em formulário. O `name` é o que faz o controle participar do envio: sem ele
 * o campo não entra no `FormData`, e o formulário submete sem a preferência.
 *
 * Esta stack não precisa de campo oculto escrito à mão — a lib já emite o
 * próprio. A composição equivalente em stack sem lib sincroniza o valor num
 * `<input type="hidden">` pelo callback de mudança, e é por isso que o texto
 * compartilhado descreve as duas saídas em vez de prescrever uma.
 */
export function switchFormSource(): string {
  return jsxSnippet(
    `${IMPORTS}
import { Button } from "@/components/ui/button";`,
    `<form className="nds-stack nds-w-sm" data-spacing="sm">
  <div className="nds-cluster" data-spacing="sm">
    <Switch id="newsletter" name="newsletter" defaultChecked />
    <Label htmlFor="newsletter">Aceitar newsletter semanal</Label>
  </div>
  <Button type="submit">Salvar preferências</Button>
</form>`,
  );
}
