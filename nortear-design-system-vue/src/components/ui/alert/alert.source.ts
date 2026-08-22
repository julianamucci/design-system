/**
 * Transforms do painel Code do Alert.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import {
  attr,
  attrBool,
  attrs,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type AlertArgs = {
  variant: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role: 'alert' | 'status' | 'note';
  dismissible: boolean;
};

const IMPORT = `import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'`;

const IMPORT_WITH_ACTION = `import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'`;

/** Import do ícone. Ele é decorativo; quem nomeia o alerta é o título. */
function importIcon(...nomes: string[]): string {
  return `import { ${nomes.join(', ')} } from 'lucide-vue-next'`;
}

/** O ícone entra como filho comum: a posição é do CSS, não de uma prop. */
function icone(nome: string): string {
  return `<${nome} class="nds-icon" aria-hidden="true" />`;
}

/** Raiz + filhos, cada filho indentado um nível. */
function alerta(partes: Array<string | false | undefined>, filhos: string[]): string {
  return `<Alert${attrs(...partes)}>\n${indentar(filhos.join('\n'))}\n</Alert>`;
}

/**
 * Corpo mais comum: ícone, título e texto corrido.
 *
 * O texto corrido NÃO recebe a cor da variante — é regra do design system para
 * contêiner colorido: cor semântica sobre fundo suave raramente alcança os
 * 4.5:1 que texto longo exige. Por isso não há classe de cor aqui.
 */
function corpo(nomeIcone: string | null, titulo: string, descricao: string): string[] {
  const filhos = [];
  if (nomeIcone) filhos.push(icone(nomeIcone));
  if (titulo) filhos.push(`<AlertTitle>${titulo}</AlertTitle>`);
  filhos.push(`<AlertDescription>${descricao}</AlertDescription>`);
  return filhos;
}

/**
 * Forma canônica: a raiz e, dentro dela, ícone, título e descrição na ordem em
 * que o leitor de tela os encontra.
 *
 * `role` fica de fora quando é o padrão: `alert` já é live region assertiva, e
 * repeti-lo sugeriria que a semântica precisa ser pedida.
 */
export const alertSource: SourceTransform<AlertArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alerta(
      [
        attr('variant', args.variant, 'default'),
        attr('role', args.role, 'alert'),
        attrBool('dismissible', args.dismissible, false),
      ],
      corpo('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.'),
    ),
  );
};

/** Variante padrão: nenhuma cor semântica, para aviso sem urgência. */
export function alertDefaultSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alerta([], corpo('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/** Variante de erro: a que interrompe uma tarefa em curso. */
export function alertDestructiveSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('AlertCircle')}`,
    alerta(
      ['variant="destructive"'],
      corpo(
        'AlertCircle',
        'Erro ao salvar',
        'Não foi possível salvar. Verifique sua conexão e tente novamente.',
      ),
    ),
  );
}

/** Variante de sucesso: confirma o que acabou de acontecer. */
export function alertSuccessSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('CheckCircle2')}`,
    alerta(
      ['variant="success"'],
      corpo('CheckCircle2', 'Perfil atualizado', 'Suas informações foram salvas com sucesso.'),
    ),
  );
}

/** Variante de atenção: algo ainda vai acontecer e há tempo de agir. */
export function alertWarningSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('TriangleAlert')}`,
    alerta(
      ['variant="warning"'],
      corpo(
        'TriangleAlert',
        'Assinatura expirando',
        'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
      ),
    ),
  );
}

/** Variante informativa: contexto útil, nunca urgência. */
export function alertInfoSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alerta(
      ['variant="info"'],
      corpo('Info', 'Dica', 'Você pode personalizar os atalhos de teclado nas configurações.'),
    ),
  );
}

/**
 * Fechável: o botão aparece por uma prop, e o rótulo dele é texto de produto.
 *
 * O componente se remove sozinho ao fechar — o evento existe para quem precisa
 * reagir. O `v-if` não é o que remove: é o que impede o alerta de voltar quando
 * o que está em volta renderizar de novo.
 */
export function alertDismissivelSource(): string {
  return vueSnippet(
    `${IMPORT}
${importIcon('CheckCircle2')}
import { ref } from 'vue'

const avisoVisivel = ref(true)`,
    alerta(
      [
        'v-if="avisoVisivel"',
        'variant="success"',
        'dismissible',
        'dismiss-label="Fechar alerta"',
        '@dismiss="avisoVisivel = false"',
      ],
      corpo('CheckCircle2', 'Perfil atualizado', 'Suas informações foram salvas com sucesso.'),
    ),
  );
}

/**
 * Fechar pelo teclado não tem nada a configurar: o controle é botão de verdade,
 * então o Tab chega nele e Enter e Espaço o acionam. Escrever um handler de
 * tecla aqui ensinaria um remendo que o componente não precisa.
 */
export function keyboardAlertDismissivelSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alerta(
      ['dismissible', 'dismiss-label="Fechar alerta"'],
      corpo('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.'),
    ),
  );
}

/**
 * As cinco variantes lado a lado. O que a story mede é CONTRASTE, e por isso o
 * exemplo é só título e texto corrido: nenhum ícone competindo pela atenção,
 * nenhuma cor no texto corrido.
 */
export function alertContrastSource(): string {
  const variantes = ['default', 'destructive', 'success', 'warning', 'info'];
  const blocos = variantes.map((v) =>
    alerta(
      [attr('variant', v, 'default')],
      corpo(null, `Título ${v}`, `Texto corrido da variante ${v}.`),
    ),
  );
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="sm">
${indentar(blocos.join('\n'))}
</div>`,
  );
}

/** Composição completa: ícone, título e descrição. */
export function alertCompletoSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alerta([], corpo('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/**
 * Sem título: a descrição sozinha basta para uma frase curta. Não há prop a
 * desligar — o título simplesmente não é escrito.
 */
export function alertNoTitleSource(): string {
  return vueSnippet(
    `${IMPORT.replace(', AlertTitle', '')}\n${importIcon('Info')}`,
    alerta([], corpo('Info', '', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/** Sem ícone: o alerta passa a coluna única, e o título assume a identificação. */
export function alertNoIconSource(): string {
  return vueSnippet(
    IMPORT,
    alerta([], corpo(null, 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/**
 * O anúncio é decisão de conteúdo, não de estilo.
 *
 * `note` não é live region: é o valor de conteúdo estático, já presente quando
 * a página carrega. O padrão continua sendo `alert`, assertivo, para a mensagem
 * que SURGE — e é o contraste entre os dois que o exemplo mostra.
 */
export function alertNoAnnouncementSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    `<div class="nds-stack" data-spacing="md">
${indentar(
  alerta(
    ['role="note"'],
    corpo(
      'Info',
      'Nota de implementação',
      'Conteúdo estático, já presente no carregamento: o leitor de tela lê na ordem da página, sem interromper.',
    ),
  ),
)}
${indentar(
  alerta(
    [],
    corpo(
      'Info',
      'Falha ao salvar',
      'Sem papel explícito o alerta segue como live region assertiva.',
    ),
  ),
)}
</div>`,
  );
}

/**
 * Inserção em tempo de execução: quando o alerta só aparece depois de uma ação,
 * a região que o recebe já precisa estar no documento. Anunciar um elemento
 * junto com o contêiner que o carrega é o caso que os leitores de tela perdem.
 */
export function alertInsercaoDinamicaSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    `<div aria-live="polite">
${indentar(
  alerta([], corpo('Info', 'Operação concluída', 'O relatório foi gerado com sucesso.')),
)}
</div>`,
  );
}

/** Ícone na composição: filho comum, decorativo, posicionado pelo componente. */
export function alertWithIconSource(): string {
  return vueSnippet(
    `${IMPORT}\n${importIcon('Info')}`,
    alerta([], corpo('Info', 'Informação', 'Ícone posicionado automaticamente.')),
  );
}

/**
 * Ação dentro do alerta: ela vive num slot próprio, que é quem a posiciona.
 * O botão é secundário de propósito — o assunto do alerta é a mensagem.
 */
export function alertWithActionSource(): string {
  return vueSnippet(
    `${IMPORT_WITH_ACTION}
import { Button } from '@/components/ui/button'
${importIcon('Info')}`,
    alerta(
      [],
      [
        ...corpo('Info', 'Atualização disponível', 'Uma nova versão está pronta para instalação.'),
        `<AlertAction>
  <Button size="sm" variant="outline">Atualizar</Button>
</AlertAction>`,
      ],
    ),
  );
}

/**
 * Classe do consumidor: ela SOMA às do design system em qualquer subcomponente,
 * nunca substitui. É o que permite ajustar o encaixe sem reescrever o alerta.
 */
export function alertClassNameAdicionalSource(): string {
  return vueSnippet(
    `${IMPORT_WITH_ACTION}
import { Button } from '@/components/ui/button'
${importIcon('Info')}`,
    `<Alert class="nds-w-full">
  ${icone('Info')}
  <AlertTitle class="nds-w-full">Classe adicional</AlertTitle>
  <AlertDescription class="nds-w-full">A classe do consumidor convive com as do design system.</AlertDescription>
  <AlertAction class="nds-w-auto">
    <Button size="sm" variant="outline">Ação</Button>
  </AlertAction>
</Alert>`,
  );
}

/** Layout de coluna única: sem ícone, título e texto ocupam a linha inteira. */
export function alertLayoutNoIconSource(): string {
  return vueSnippet(
    IMPORT,
    alerta([], corpo(null, 'Sem ícone', 'Alerta sem ícone mantém layout de coluna única.')),
  );
}
