/**
 * Transform do painel Code do Stepper.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o fluxo é uma `<ol ndsStepper>` nomeada, cada etapa é
 * um `<li ndsStepperItem [step]="n">` com um gatilho dentro, e quem decide para
 * onde ir é a aplicação — o componente só avisa por `(stepSelect)`. Os rótulos
 * de estado (`completed`, `current`) são o que o leitor de tela ouve além do
 * título, e por isso entram sempre.
 */
import { FLOW_LABEL, STATE_LABELS, STEP_TITLES } from './stepper.fixtures';
import type { StepperLabels } from './stepper';

export type StepperArgs = {
  value: number;
  ariaLabel: string;
  labels: StepperLabels;
  onStepSelect: (step: number) => void;
};

/**
 * O renderer imprime o `template` da story como está escrito, com os bindings
 * ligados aos args (`[value]="value"`). Isso é o andaime da story, não o que
 * alguém escreve para usar o Stepper. O `transform` devolve o uso real, com os
 * valores atuais dos controls já resolvidos.
 */
export function stepperPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<StepperArgs> } = {},
): string {
  const { value = 2, ariaLabel = FLOW_LABEL, labels = STATE_LABELS } = ctx.args ?? {};

  const labelsLiteral = `{ completed: '${labels.completed ?? ''}', current: '${labels.current ?? ''}' }`;

  return `import { NDS_STEPPER } from '@/components/ui/stepper';

@Component({
  imports: [NDS_STEPPER],
  template: \`
    <ol
      ndsStepper
      [value]="${value}"
      aria-label="${ariaLabel}"
      [labels]="${labelsLiteral}"
      (stepSelect)="irPara($event)"
    >
      <li ndsStepperItem [step]="1">
        <button ndsStepperTrigger>
          <span ndsStepperIndicator></span>
          <span ndsStepperTitle>${STEP_TITLES.account}</span>
          <span ndsStepperDescription>Seus dados</span>
        </button>
        <div ndsStepperSeparator></div>
      </li>

      <li ndsStepperItem [step]="2">
        <button ndsStepperTrigger>
          <span ndsStepperIndicator></span>
          <span ndsStepperTitle>${STEP_TITLES.address}</span>
        </button>
      </li>
    </ol>
  \`,
})
export class Exemplo {
  irPara(etapa: number) {
    // A aplicação decide para onde o fluxo vai; o componente só avisa.
  }
}`;
}
