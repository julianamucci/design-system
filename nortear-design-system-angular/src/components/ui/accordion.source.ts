/**
 * Transform do painel Code do Accordion.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é a diferença entre os dois MODOS do componente: em
 * modo único o valor inicial é uma string, em modo múltiplo é um array. É a
 * pegadinha da API, e o snippet a mostra resolvida em vez de descrita.
 */

export type AccordionArgs = {
  multiple: boolean;
  disabled: boolean;
  onValueChange: (value: unknown) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o binding de
 * arg e o andaime. Não é o que a pessoa deve escrever. Ver separator.stories.ts.
 */
export function accordionPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<AccordionArgs> } = {},
): string {
  const { multiple = false, disabled = false } = ctx.args ?? {};

  const attrs = [
    multiple ? '[multiple]="true"' : '',
    disabled ? '[disabled]="true"' : '',
    // Modo único guarda uma string; múltiplo, um array. Ver a tabela de props.
    multiple ? `[defaultValue]="['item-1']"` : `defaultValue="item-1"`,
    '(valueChange)="aoMudar($event)"',
  ].filter(Boolean).join('\n      ');

  return `import {
  NdsAccordion,
  NdsAccordionItem,
  NdsAccordionTrigger,
  NdsAccordionContent,
} from '@/components/ui/accordion';

@Component({
  imports: [NdsAccordion, NdsAccordionItem, NdsAccordionTrigger, NdsAccordionContent],
  template: \`
    <div ndsAccordion
      ${attrs}
    >
      <div ndsAccordionItem value="item-1">
        <button ndsAccordionTrigger>Como faço para redefinir minha senha?</button>
        <div ndsAccordionContent>
          Acesse a tela de login e clique em Esqueci minha senha.
        </div>
      </div>
      <div ndsAccordionItem value="item-2">
        <button ndsAccordionTrigger>Quais formas de pagamento são aceitas?</button>
        <div ndsAccordionContent>
          Aceitamos cartão de crédito, Pix e boleto bancário.
        </div>
      </div>
    </div>
  \`,
})
export class Exemplo {
  aoMudar(valor: string | string[] | undefined) {
    // Modo único: string. Modo múltiplo: array.
  }
}`;
}
