import { describe, expect, it } from 'vitest';
import { stepperSnippet, stepperSource, stepperSourceWith } from './stepper.source';

/** Onde o corpo do snippet começa — depois da lista de importação. */
function body(code: string): string {
  return code.slice(code.indexOf("} from '@/components/ui/stepper';"));
}

describe('stepperSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = stepperSnippet();
    expect(code).toContain("from '@/components/ui/stepper';");
    expect(code).toContain('createStepper({');
    expect(code).toContain('createStepperItem({ step })');
    expect(code).toContain('createStepperTrigger()');
    expect(code).toContain('createStepperIndicator()');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<ol');
    expect(code).not.toContain('<button');
  });

  it('mostra a segunda fase, que é o que faz o estado existir', () => {
    // Sem `setStepperValue` toda etapa fica em `inactive` — é como o item
    // nasce. O snippet que a omitisse ensinaria um fluxo sem etapa atual.
    const code = stepperSnippet({ value: 3 });
    expect(code).toContain('setStepperValue(stepper, 3);');
    expect(stepperSnippet()).toContain('setStepperValue(stepper, 2);');
  });

  it('nomeia o fluxo mesmo quando a story não troca o nome', () => {
    // `'aria-label'` é opção OBRIGATÓRIA da raiz: omiti-la do snippet por ser
    // o valor de sempre ensinaria a montar um fluxo que o leitor de tela
    // anuncia como uma lista sem assunto.
    expect(stepperSnippet()).toContain("'aria-label': 'Progresso do cadastro'");
    expect(stepperSnippet({ 'aria-label': 'Etapas do checkout' })).toContain(
      "'aria-label': 'Etapas do checkout'",
    );
  });

  it('só escreve as palavras de estado que a story passou', () => {
    expect(stepperSnippet()).not.toContain('labels:');
    expect(
      stepperSnippet({ labels: { completed: 'Etapa concluída', current: 'Etapa atual' } }),
    ).toContain("labels: { completed: 'Etapa concluída', current: 'Etapa atual' }");
    expect(stepperSnippet({ labels: { current: 'Etapa atual' } })).toContain(
      "labels: { current: 'Etapa atual' }",
    );
    expect(stepperSnippet({ labels: {} })).not.toContain('labels:');
  });

  it('o traço fica fora da última etapa', () => {
    // Contrato do DOM: o traço mora DENTRO do item, depois do gatilho. A
    // última etapa não tem para onde apontar, e um traço solto ali sobra na
    // tela sem nada do outro lado.
    const code = stepperSnippet();
    expect(code).toContain('etapas.slice(0, -1)');
    expect(code).toContain('createStepperSeparator()');

    // Fluxo de uma etapa só não tem traço nenhum — nem no import.
    const single = stepperSnippet({ steps: [{ title: 'Conta' }] });
    expect(single).not.toContain('createStepperSeparator');
    expect(single).not.toContain('.slice(0, -1)');
  });

  it('a assinatura da etapa acompanha o que a story usa', () => {
    // Sem texto de apoio, nem o parâmetro nem a fábrica da descrição entram —
    // parâmetro que a story não usa é ruído que quem copia leva junto.
    const plain = stepperSnippet();
    expect(plain).toContain('const etapa = (step: number, title: string) => {');
    expect(plain).not.toContain('createStepperDescription');
    expect(body(plain)).not.toContain('description');

    const withDescription = stepperSnippet({
      steps: [
        { title: 'Conta', description: 'Seus dados' },
        { title: 'Endereço', description: 'Onde entregar' },
      ],
    });
    expect(withDescription).toContain(
      'const etapa = (step: number, title: string, description: string) => {',
    );
    expect(withDescription).toContain('createStepperDescription({ text: description }),');
    expect(withDescription).toContain("etapa(1, 'Conta', 'Seus dados'),");
    expect(withDescription).toContain('createStepperDescription,');
  });

  it('o estado declarado no item vira opção, e só quando existe', () => {
    const code = stepperSnippet({
      steps: [
        { title: 'Conta' },
        { title: 'Endereço' },
        { title: 'Pagamento', disabled: true },
        { title: 'Revisão', completed: true },
      ],
    });
    expect(code).toContain('createStepperItem({ step, ...state })');
    expect(code).toContain("etapa(3, 'Pagamento', { disabled: true }),");
    expect(code).toContain("etapa(4, 'Revisão', { completed: true }),");
    // A etapa sem estado não ganha objeto vazio.
    expect(code).toContain("etapa(1, 'Conta'),");

    // E sem nenhuma etapa marcada, o parâmetro de estado não existe.
    expect(stepperSnippet()).toContain('createStepperItem({ step })');
    expect(stepperSnippet()).not.toContain('...state');
  });

  it('mostra o ouvinte de seleção quando a story reporta a etapa escolhida', () => {
    const code = stepperSnippet({ onStepSelect: 'irPara(step);' });
    expect(code).toContain('onStepSelect: (step) => {');
    expect(code).toContain('irPara(step);');
    expect(stepperSnippet()).not.toContain('onStepSelect');
  });

  it('não vaza andaime de story', () => {
    const code = stepperSnippet({ steps: [{ title: 'Conta', disabled: true }] });
    expect(code).not.toContain('buildStepper');
    expect(code).not.toContain('triggerOfStep');
    expect(code).not.toContain('SIGNUP_STEPS');
    expect(code).not.toContain('fixtures');
  });
});

describe('stepperSource', () => {
  it('acompanha os args em vez de congelar um snippet fixo', () => {
    const noArgs = stepperSource('<ol data-slot="stepper">', {});
    const withArgs = stepperSource('<ol data-slot="stepper">', {
      args: { value: 4, 'aria-label': 'Etapas do checkout' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('setStepperValue(stepper, 4);');
    expect(withArgs).toContain("'aria-label': 'Etapas do checkout'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    const code = stepperSource('<ol data-slot="stepper" aria-label="Progresso" data-value="2">', {});
    expect(code).not.toContain('data-value=');
    expect(code).not.toContain('aria-label="Progresso"');
  });
});

describe('stepperSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = stepperSourceWith({
      steps: [{ title: 'Conta' }, { title: 'Endereço', disabled: true }],
      value: 1,
    });
    const code = transform('', { args: { value: 3, steps: [{ title: 'Outra' }] } });
    expect(code).toContain("etapa(2, 'Endereço', { disabled: true }),");
    expect(code).not.toContain("etapa(1, 'Outra')");
    expect(code).toContain('setStepperValue(stepper, 1);');
  });

  it('deixa passar o que a story não fixou', () => {
    const transform = stepperSourceWith({ value: 1 });
    const code = transform('', { args: { 'aria-label': 'Etapas do checkout' } });
    expect(code).toContain("'aria-label': 'Etapas do checkout'");
    expect(code).toContain('setStepperValue(stepper, 1);');
  });
});
