import { describe, expect, it } from 'vitest';
import {
  radioGroupWithDescriptionSnippet,
  formRadioGroupSnippet,
  radioGroupInvalidoSnippet,
  radioGroupSnippet,
  radioGroupSource,
  radioGroupSourceWith,
  radioGroupSourceDescription,
  radioGroupSourceForm,
  radioGroupSourceInvalido,
} from './radio-group.source';

describe('radioGroupSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do grupo', () => {
    const code = radioGroupSnippet();
    expect(code).toContain("import { createRadioGroup } from '@/components/ui/radio-group';");
    expect(code).toContain('createRadioGroup({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<fieldset');
  });

  it('prefere a legenda VISÍVEL ao nome invisível', () => {
    const code = radioGroupSnippet({ legend: 'Forma de entrega' });
    expect(code).toContain("legend: 'Forma de entrega'");
    expect(code).not.toContain("'aria-label'");
  });

  it('só cai no nome invisível quando não há legenda', () => {
    // Os dois no mesmo elemento é o defeito, não a solução: a fábrica ignora o
    // `aria-label` quando a legenda existe.
    const code = radioGroupSnippet({ 'aria-label': 'Forma de pagamento' });
    expect(code).toContain("'aria-label': 'Forma de pagamento'");
    expect(code).not.toContain('legend:');
    expect(code).not.toContain('ariaLabel');

    const withAsDuas = radioGroupSnippet({
      legend: 'Forma de pagamento',
      'aria-label': 'Forma de pagamento',
    });
    expect(withAsDuas).toContain('legend:');
    expect(withAsDuas).not.toContain("'aria-label'");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = radioGroupSnippet();
    expect(code).not.toContain('orientation');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('defaultValue');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = radioGroupSnippet({
      name: 'delivery',
      orientation: 'horizontal',
      defaultValue: 'pix',
      disabled: true,
      items: [
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto', disabled: true },
      ],
    });
    expect(code).toContain("name: 'delivery'");
    expect(code).toContain("orientation: 'horizontal'");
    expect(code).toContain("defaultValue: 'pix'");
    expect(code).toContain('disabled: true');
    expect(code).toContain("{ value: 'boleto', label: 'Boleto', disabled: true },");
  });

  it('não vaza o andaime das stories', () => {
    const code = radioGroupSnippet();
    expect(code).not.toContain('escolher(');
    expect(code).not.toContain('razaoContraste');
  });
});

describe('radioGroupComDescricaoSnippet', () => {
  it('amarra a descrição ao controle, que é o que a fábrica não faz', () => {
    const code = radioGroupWithDescriptionSnippet(
      [{ value: 'standard', label: 'Padrão', description: 'Entrega em 5 dias úteis.' }],
      { name: 'delivery', legend: 'Forma de entrega' },
    );
    expect(code).toContain("description: 'Entrega em 5 dias úteis.'");
    expect(code).toContain("setAttribute('aria-describedby'");
    expect(code).toContain('createRadioGroup({');
    // A descrição não é opção da fábrica: só `value` e `label` chegam a `items`.
    expect(code).toContain('items: escolhas.map(({ value, label }) => ({ value, label }))');
  });
});

describe('radioGroupInvalidoSnippet', () => {
  it('marca o atributo e aponta a mensagem, sem pintar nada por conta própria', () => {
    const code = radioGroupInvalidoSnippet({ name: 'pagamento' });
    expect(code).toContain("setAttribute('aria-invalid', 'true')");
    expect(code).toContain("setAttribute('aria-describedby', 'pagamento-erro')");
    expect(code).toContain('nds-text-destructive');
    expect(code).not.toContain('box-shadow');
    expect(code).not.toContain('style.border');
  });
});

describe('radioGroupEmFormularioSnippet', () => {
  it('recolhe a escolha pelo FormData do submit, não por um callback por clique', () => {
    const code = formRadioGroupSnippet({ name: 'payment' });
    expect(code).toContain('new FormData(formulario)');
    expect(code).toContain("get('payment')");
    expect(code).toContain("type: 'submit'");
    expect(code).not.toContain('onValueChange');
  });
});

describe('radioGroupSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = radioGroupSource('<fieldset data-slot="radio-group">', {});
    const withArgs = radioGroupSource('<fieldset data-slot="radio-group">', {
      args: { name: 'entrega', orientation: 'horizontal' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("name: 'entrega'");
    expect(withArgs).toContain("orientation: 'horizontal'");
  });

  it('traduz o nome do control para o da opção da fábrica', () => {
    // O Playground chama a legenda de `groupLabel`; a fábrica a chama de `legend`.
    const code = radioGroupSource('', { args: { groupLabel: 'Forma de pagamento' } });
    expect(code).toContain("legend: 'Forma de pagamento'");
    expect(code).not.toContain('groupLabel');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(radioGroupSource('<fieldset role="radiogroup" aria-orientation="vertical">', {})).not.toContain(
      'aria-orientation="vertical"',
    );
  });
});

describe('radioGroupSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = radioGroupSourceWith({ disabled: true });
    const code = transform('', { args: { disabled: false, name: 'payment' } });
    expect(code).toContain('disabled: true');
  });
});

describe('as transforms das formas alternativas', () => {
  it('entregam a forma que a story pede', () => {
    expect(
      radioGroupSourceDescription([{ value: 'a', label: 'A', description: 'Texto auxiliar.' }])('', {}),
    ).toContain('aria-describedby');
    expect(radioGroupSourceInvalido()('', {})).toContain("setAttribute('aria-invalid', 'true')");
    expect(radioGroupSourceForm()('', {})).toContain('new FormData(formulario)');
  });
});
