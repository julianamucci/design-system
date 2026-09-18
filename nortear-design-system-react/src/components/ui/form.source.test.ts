import { describe, expect, it } from 'vitest';
import {
  formWithDescriptionSource,
  formWithFieldsetSource,
  formWithMultipleFieldsSource,
  formDisabledSource,
  formEmDuasPaletasSource,
  formInvalidoSource,
  formLabelEControleSource,
  formSource,
} from './form.source';

const ALL = [
  formSource,
  formLabelEControleSource,
  formWithDescriptionSource,
  formInvalidoSource,
  formDisabledSource,
  formEmDuasPaletasSource,
  formWithFieldsetSource,
  formWithMultipleFieldsSource,
];

describe('formSource', () => {
  it('ensina as peças que o componente realmente exporta', () => {
    const output = formSource();
    expect(output).toContain('import { FormField } from "@/components/ui/form";');
    expect(output).toContain('import { Input } from "@/components/ui/input";');
  });

  it('o controle é PROJETADO dentro do campo, e é o campo que os associa', () => {
    const output = formSource();
    expect(output).toContain('<FormField');
    expect(output).toContain('<Input');
    expect(output).toContain('</FormField>');
  });

  it('o rótulo do control vira a prop label', () => {
    expect(formSource(undefined, { args: { label: 'Telefone' } })).toContain('label="Telefone"');
  });

  it('control vazio significa peça AUSENTE, não atributo com string vazia', () => {
    // Um `aria-describedby=""` faz o leitor de tela anunciar uma pausa sem
    // conteúdo — a descrição some do markup, não vira atributo vazio.
    const output = formSource(undefined, { args: { label: 'Email', description: '', error: '' } });
    expect(output).toContain('<FormField label="Email">');
    expect(output).not.toContain('description=');
    expect(output).not.toContain('error=');
  });

  it('a mensagem de erro vem sempre acompanhada de aria-invalid no controle', () => {
    // Cor no rótulo sozinha não alcança quem não enxerga cor.
    const output = formSource(undefined, { args: { error: 'Email inválido.' } });
    expect(output).toContain('error="Email inválido."');
    expect(output).toContain('aria-invalid');
  });

  it('sem erro e sem o control ligado, nada de aria-invalid', () => {
    expect(formSource(undefined, { args: { error: '', ariaInvalid: false } })).not.toContain(
      'aria-invalid',
    );
  });

  it('o control de desabilitado vai para o CONTROLE, não para o campo', () => {
    const output = formSource(undefined, { args: { disabled: true } });
    expect(output).toContain('disabled');
    expect(output.indexOf('disabled')).toBeGreaterThan(output.indexOf('<Input'));
  });

  it('cai nos textos padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = formSource(undefined, {
      args: { label: spy as never, placeholder: spy as never },
    });
    expect(output).toContain('label="Email"');
    expect(output).toContain('placeholder="ex: joao@empresa.com"');
    expect(output).not.toContain('CORPO_DO_MOCK');
  });
});

describe('variantes', () => {
  it('o par mínimo não leva descrição nem erro — a ausência é o assunto', () => {
    const output = formLabelEControleSource();
    expect(output).toContain('<FormField label="Nome completo">');
    expect(output).not.toContain('description=');
    expect(output).not.toContain('error=');
  });

  it('a descrição é declarada no campo, e o campo a liga ao controle', () => {
    const output = formWithDescriptionSource();
    expect(output).toContain('description="Use pelo menos 8 caracteres, com letras e números."');
    expect(output).toContain('<Input type="password" autoComplete="new-password" />');
  });
});

describe('estados', () => {
  it('inválido = mensagem no campo E aria-invalid no controle', () => {
    const output = formInvalidoSource();
    expect(output).toContain('error="A senha precisa ter pelo menos 8 caracteres."');
    expect(output).toContain('aria-invalid');
    // `aria-live` e `data-error` são emitidos pelo componente: escrevê-los aqui
    // ensinaria a refazer à mão a costura que ele já entrega.
    expect(output).not.toContain('aria-live');
    expect(output).not.toContain('data-error');
  });

  it('desabilitado mantém rótulo e descrição — some só a interação', () => {
    const output = formDisabledSource();
    expect(output).toContain('label="CPF"');
    expect(output).toContain('description="Preenchido pelo cadastro da empresa."');
    expect(output).toContain('disabled />');
  });

  it('a story das duas paletas mostra os três casos juntos', () => {
    const output = formEmDuasPaletasSource();
    expect(output).toContain('import { Fieldset, FormField } from "@/components/ui/form";');
    expect(output).toContain('error="Endereço de email incompleto."');
    expect(output).toContain('<Fieldset legend="Endereço de entrega">');
  });
});

describe('composições', () => {
  it('o agrupamento usa a legenda do componente, não um título por cima', () => {
    const output = formWithFieldsetSource();
    expect(output).toContain('<Fieldset legend="Endereço de entrega">');
    // O par nativo fieldset/legend é o que anuncia o grupo; um <div> com <h3>
    // parece igual e não anuncia nada.
    expect(output).not.toContain('<h3');
    expect(output).not.toContain('<legend');
  });

  it('o formulário passa três controles diferentes pelo mesmo campo', () => {
    const output = formWithMultipleFieldsSource();
    expect(output).toContain('import { Textarea } from "@/components/ui/textarea";');
    expect(output).toContain('<Textarea name="bio" rows={3} />');
    expect(output).toContain('<Button type="submit">Salvar</Button>');
    expect(output.match(/<FormField/g)).toHaveLength(3);
  });

  it('a ordem de tabulação é a do DOM — nenhum snippet escreve tabIndex', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('tabIndex');
    }
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet escreve à mão a costura que o campo faz sozinho', () => {
    // `for`/`id` e `aria-describedby` são o produto do componente: mostrá-los
    // ensinaria a duplicar exatamente o que ele existe para resolver.
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('htmlFor');
      expect(output).not.toContain('aria-describedby');
      expect(output).not.toContain(' id=');
    }
  });

  it('nenhum snippet carrega o andaime do canvas da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      expect(output).not.toContain('nds-max-w-sm');
      expect(output).not.toContain('style={{');
    }
  });
});
