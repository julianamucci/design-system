/**
 * Transforms do painel Code do Alert.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O caso mais grave aqui era o dismissible: a story monta um wrapper que
 * remonta o alert ao fechar, só para o canvas não ficar vazio depois da play.
 * Isso é andaime de teste — quem copiava levava a remontagem junto e ficava com
 * um alerta que nunca some.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type AlertArgs = {
  variant: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role: 'alert' | 'status' | 'note';
  dismissible: boolean;
};

const VARIANTES = ['default', 'destructive', 'success', 'warning', 'info'] as const;
const PAPEIS = ['alert', 'status', 'note'] as const;

const IMPORT = 'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";';

/** Import do design system somado ao do ícone, nesta ordem em todos os snippets. */
function header(icons: string[], extra?: string): string {
  const linhas = [extra ?? IMPORT];
  if (icons.length) linhas.push(`import { ${icons.join(', ')} } from "lucide-react";`);
  return linhas.join('\n');
}

/**
 * O corpo canônico: ícone decorativo, título e texto corrido.
 *
 * O ícone leva `aria-hidden` porque quem nomeia o alerta é o texto — e o
 * posicionamento é do `.nds-alert`, que trata o SVG filho direto, nunca uma
 * margem no ícone. Título e descrição ficam no `--foreground`: em contêiner
 * colorido, o texto corrido não pode depender da variante para alcançar 4.5:1.
 */
function corpo(icone: string | null, titulo: string, descricao: string, indentacao = '  '): string {
  const linhas: string[] = [];
  if (icone) linhas.push(`${indentacao}<${icone} aria-hidden="true" className="nds-icon" />`);
  if (titulo) linhas.push(`${indentacao}<AlertTitle>${titulo}</AlertTitle>`);
  linhas.push(`${indentacao}<AlertDescription>${descricao}</AlertDescription>`);
  return linhas.join('\n');
}

function alerta(atributos: string, interior: string): string {
  return `<Alert${atributos}>\n${interior}\n</Alert>`;
}

/** Uma variante inteira: raiz, ícone próprio e o par título/descrição. */
function variante(
  nome: (typeof VARIANTES)[number],
  icone: string,
  titulo: string,
  descricao: string,
): string {
  const atributos = nome === 'default' ? '' : ` variant="${nome}"`;
  return jsxSnippet(header([icone]), alerta(atributos, corpo(icone, titulo, descricao)));
}

/**
 * Transform do `meta` — vale para todas as stories dos quatro arquivos. Lê os
 * controls do Playground; nos arquivos que desligam os controls cai no padrão do
 * componente, que é o uso canônico.
 *
 * `role` merece atenção: o padrão `alert` é live region ASSERTIVA e interrompe o
 * leitor de tela. Ele só aparece no snippet quando o control escolhe outro
 * valor, porque escrever `role="alert"` sugeriria que a escolha é opcional
 * quando na verdade é ela que define se o conteúdo interrompe ou não.
 */
export const alertSource: SourceTransform<AlertArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const atributos = attrsMultilinha([
    propOption('variant', args.variant, VARIANTES, 'default'),
    propOption('role', args.role, PAPEIS, 'alert'),
    propBool('dismissible', args.dismissible),
  ]);
  return jsxSnippet(
    header(['Info']),
    alerta(
      atributos,
      corpo('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.'),
    ),
  );
};

/**
 * Cada variante diz a sua: o arquivo desliga os controls, então o `meta` não tem
 * args de onde ler e mostraria sempre a default. O ícone muda junto com a
 * variante — cor sozinha não comunica, e o par ícone + palavra é o que sustenta
 * o significado sem depender de enxergar a cor.
 */
export function alertDestructiveSource(): string {
  return variante(
    'destructive',
    'AlertCircle',
    'Erro ao salvar',
    'Não foi possível salvar. Verifique sua conexão e tente novamente.',
  );
}

export function alertSucessoSource(): string {
  return variante(
    'success',
    'CheckCircle2',
    'Perfil atualizado',
    'Suas informações foram salvas com sucesso.',
  );
}

export function alertAvisoSource(): string {
  return variante(
    'warning',
    'TriangleAlert',
    'Assinatura expirando',
    'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
  );
}

export function alertInfoSource(): string {
  return variante(
    'info',
    'Info',
    'Dica',
    'Você pode alterar o tema em Configurações a qualquer momento.',
  );
}

/**
 * Dispensável, por clique ou por teclado — as duas stories compartilham esta
 * transform porque a marcação é a mesma; o que muda é como a play aciona.
 *
 * O `render` das duas monta um wrapper que remonta o alert ao fechar, para o
 * canvas não ficar vazio no Chromatic. Isso é andaime de teste, e é exatamente
 * o que o painel imprimia. Aqui fica só o contrato real: `dismissible` desenha o
 * botão e o componente se remove sozinho; `onDismiss` avisa depois, uma vez.
 */
export function alertDispensavelSource(): string {
  return jsxSnippet(
    `${header(['CheckCircle2'])}

function aoFechar() {
  // Dispara uma vez só, depois que o alerta já saiu da tela.
}`,
    alerta(
      ' dismissible onDismiss={aoFechar}',
      corpo(
        'CheckCircle2',
        'Perfil atualizado',
        'Suas informações foram salvas com sucesso.',
      ),
    ),
  );
}

/**
 * As cinco variantes empilhadas: o assunto da story é a comparação de contraste
 * entre elas, e um alerta sozinho esconderia justamente isso. Sem ícone de
 * propósito — o que se mede aqui é texto sobre o fundo que a variante pinta.
 */
export function alertContrastSource(): string {
  const blocks = VARIANTES.map((nome) => {
    const atributos = nome === 'default' ? '' : ` variant="${nome}"`;
    return [
      `  <Alert${atributos}>`,
      `    <AlertTitle>Título ${nome}</AlertTitle>`,
      `    <AlertDescription>Texto corrido da variante ${nome}.</AlertDescription>`,
      '  </Alert>',
    ].join('\n');
  }).join('\n');
  return jsxSnippet(
    IMPORT,
    `<div className="nds-stack" data-spacing="sm">\n${blocks}\n</div>`,
  );
}

/**
 * Sem título: a descrição vira o conteúdo inteiro. A ausência É o assunto, e o
 * snippet do `meta` mostraria o título de volta.
 */
export function alertNoTitleSource(): string {
  return jsxSnippet(
    header(['Info'], 'import { Alert, AlertDescription } from "@/components/ui/alert";'),
    alerta('', corpo('Info', '', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/**
 * Sem ícone: o layout vira coluna única sem nenhuma prop — o `.nds-alert` reage
 * à presença do SVG filho direto. Compartilhado pelas duas stories que provam a
 * mesma ausência (estados e composições).
 */
export function alertNoIconSource(): string {
  return jsxSnippet(
    IMPORT,
    alerta('', corpo(null, 'Atenção', 'Alert sem ícone mantém layout de coluna única.')),
  );
}

/**
 * `role="note"` ao lado do padrão: os dois juntos são o assunto.
 *
 * `note` NÃO é live region — é o valor correto para conteúdo já presente no
 * carregamento, que não deve interromper a leitura. O padrão `alert` continua
 * assertivo e fica no snippet sem prop nenhuma, provando que a escolha do papel
 * é uma decisão de conteúdo, não de estilo.
 */
export function alertNoAnnouncementSource(): string {
  const nota = [
    '  <Alert role="note">',
    corpo(
      'Info',
      'Nota de implementação',
      'Conteúdo já presente no carregamento — o leitor de tela não é interrompido.',
      '    ',
    ),
    '  </Alert>',
  ].join('\n');
  const padrao = [
    '  <Alert>',
    corpo(
      'Info',
      'Sessão expirada',
      'Mensagem urgente que surge em tempo de execução.',
      '    ',
    ),
    '  </Alert>',
  ].join('\n');
  return jsxSnippet(
    header(['Info']),
    `<div className="nds-stack" data-spacing="sm">\n${nota}\n${padrao}\n</div>`,
  );
}

/**
 * Inserção dinâmica: o alerta nasce depois do carregamento, dentro de uma região
 * já anunciada como `aria-live="polite"`. É o contêiner que muda o
 * comportamento, e ele não cabe em nenhum arg do componente.
 */
export function alertInsercaoDinamicaSource(): string {
  return jsxSnippet(
    header(['Info']),
    `<div aria-live="polite">\n${[
      '  <Alert>',
      corpo('Info', 'Operação concluída', 'O relatório foi gerado com sucesso.', '    '),
      '  </Alert>',
    ].join('\n')}\n</div>`,
  );
}

/**
 * Com ação: o `AlertAction` é o quarto subcomponente e o `meta` não o importa.
 *
 * O alerta em si não é focável — o Tab chega direto ao botão interno, que é o
 * único ponto de interação da composição.
 */
export function alertWithActionSource(): string {
  return jsxSnippet(
    `import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";`,
    alerta(
      '',
      [
        corpo('Info', 'Atualização disponível', 'Uma nova versão está pronta para instalação.'),
        '  <AlertAction>',
        '    <Button size="sm" variant="outline">',
        '      Atualizar',
        '    </Button>',
        '  </AlertAction>',
      ].join('\n'),
    ),
  );
}

/**
 * Classe do consumidor: ela SOMA às do design system, não substitui — em todos
 * os subcomponentes. O que a story prova é a composição de classes, e por isso o
 * snippet precisa mostrar o `className` em cada peça, e não só na raiz.
 */
export function alertClassNameAdicionalSource(): string {
  return jsxSnippet(
    `import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";`,
    alerta(
      ' className="nds-w-full"',
      [
        '  <Info aria-hidden="true" className="nds-icon" />',
        '  <AlertTitle className="nds-w-full">Classe adicional</AlertTitle>',
        '  <AlertDescription className="nds-w-full">',
        '    A classe do consumidor convive com as do design system.',
        '  </AlertDescription>',
        '  <AlertAction className="nds-w-auto">',
        '    <Button size="sm" variant="outline">',
        '      Ação',
        '    </Button>',
        '  </AlertAction>',
      ].join('\n'),
    ),
  );
}
