import { describe, expect, it } from 'vitest';
import {
  radioGroupComDescricaoSnippet,
  radioGroupEmFormularioSnippet,
  radioGroupInvalidoSnippet,
  radioGroupSnippet,
  radioGroupSource,
  radioGroupSourceCom,
  radioGroupSourceDescricao,
  radioGroupSourceFormulario,
  radioGroupSourceInvalido,
} from './radio-group.source';

describe('radioGroupSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do grupo', () => {
    const código = radioGroupSnippet();
    expect(código).toContain("import { createRadioGroup } from '@/components/ui/radio-group';");
    expect(código).toContain('createRadioGroup({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<fieldset');
  });

  it('prefere a legenda VISÍVEL ao nome invisível', () => {
    const código = radioGroupSnippet({ legend: 'Forma de entrega' });
    expect(código).toContain("legend: 'Forma de entrega'");
    expect(código).not.toContain("'aria-label'");
  });

  it('só cai no nome invisível quando não há legenda', () => {
    // Os dois no mesmo elemento é o defeito, não a solução: a fábrica ignora o
    // `aria-label` quando a legenda existe.
    const código = radioGroupSnippet({ 'aria-label': 'Forma de pagamento' });
    expect(código).toContain("'aria-label': 'Forma de pagamento'");
    expect(código).not.toContain('legend:');
    expect(código).not.toContain('ariaLabel');

    const comAsDuas = radioGroupSnippet({
      legend: 'Forma de pagamento',
      'aria-label': 'Forma de pagamento',
    });
    expect(comAsDuas).toContain('legend:');
    expect(comAsDuas).not.toContain("'aria-label'");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = radioGroupSnippet();
    expect(código).not.toContain('orientation');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('defaultValue');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = radioGroupSnippet({
      name: 'delivery',
      orientation: 'horizontal',
      defaultValue: 'pix',
      disabled: true,
      items: [
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto', disabled: true },
      ],
    });
    expect(código).toContain("name: 'delivery'");
    expect(código).toContain("orientation: 'horizontal'");
    expect(código).toContain("defaultValue: 'pix'");
    expect(código).toContain('disabled: true');
    expect(código).toContain("{ value: 'boleto', label: 'Boleto', disabled: true },");
  });

  it('não vaza o andaime das stories', () => {
    const código = radioGroupSnippet();
    expect(código).not.toContain('escolher(');
    expect(código).not.toContain('razaoContraste');
  });
});

describe('radioGroupComDescricaoSnippet', () => {
  it('amarra a descrição ao controle, que é o que a fábrica não faz', () => {
    const código = radioGroupComDescricaoSnippet(
      [{ value: 'standard', label: 'Padrão', description: 'Entrega em 5 dias úteis.' }],
      { name: 'delivery', legend: 'Forma de entrega' },
    );
    expect(código).toContain("description: 'Entrega em 5 dias úteis.'");
    expect(código).toContain("setAttribute('aria-describedby'");
    expect(código).toContain('createRadioGroup({');
    // A descrição não é opção da fábrica: só `value` e `label` chegam a `items`.
    expect(código).toContain('items: escolhas.map(({ value, label }) => ({ value, label }))');
  });
});

describe('radioGroupInvalidoSnippet', () => {
  it('marca o atributo e aponta a mensagem, sem pintar nada por conta própria', () => {
    const código = radioGroupInvalidoSnippet({ name: 'pagamento' });
    expect(código).toContain("setAttribute('aria-invalid', 'true')");
    expect(código).toContain("setAttribute('aria-describedby', 'pagamento-erro')");
    expect(código).toContain('nds-text-destructive');
    expect(código).not.toContain('box-shadow');
    expect(código).not.toContain('style.border');
  });
});

describe('radioGroupEmFormularioSnippet', () => {
  it('recolhe a escolha pelo FormData do submit, não por um callback por clique', () => {
    const código = radioGroupEmFormularioSnippet({ name: 'payment' });
    expect(código).toContain('new FormData(formulario)');
    expect(código).toContain("get('payment')");
    expect(código).toContain("type: 'submit'");
    expect(código).not.toContain('onValueChange');
  });
});

describe('radioGroupSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = radioGroupSource('<fieldset data-slot="radio-group">', {});
    const comArgs = radioGroupSource('<fieldset data-slot="radio-group">', {
      args: { name: 'entrega', orientation: 'horizontal' },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain("name: 'entrega'");
    expect(comArgs).toContain("orientation: 'horizontal'");
  });

  it('traduz o nome do control para o da opção da fábrica', () => {
    // O Playground chama a legenda de `groupLabel`; a fábrica a chama de `legend`.
    const código = radioGroupSource('', { args: { groupLabel: 'Forma de pagamento' } });
    expect(código).toContain("legend: 'Forma de pagamento'");
    expect(código).not.toContain('groupLabel');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(radioGroupSource('<fieldset role="radiogroup" aria-orientation="vertical">', {})).not.toContain(
      'aria-orientation="vertical"',
    );
  });
});

describe('radioGroupSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = radioGroupSourceCom({ disabled: true });
    const código = transform('', { args: { disabled: false, name: 'payment' } });
    expect(código).toContain('disabled: true');
  });
});

describe('as transforms das formas alternativas', () => {
  it('entregam a forma que a story pede', () => {
    expect(
      radioGroupSourceDescricao([{ value: 'a', label: 'A', description: 'Texto auxiliar.' }])('', {}),
    ).toContain('aria-describedby');
    expect(radioGroupSourceInvalido()('', {})).toContain("setAttribute('aria-invalid', 'true')");
    expect(radioGroupSourceFormulario()('', {})).toContain('new FormData(formulario)');
  });
});
