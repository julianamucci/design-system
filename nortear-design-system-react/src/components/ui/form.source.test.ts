import { describe, expect, it } from 'vitest';
import {
  formComDescricaoSource,
  formComFieldsetSource,
  formComVariosCamposSource,
  formDesabilitadoSource,
  formEmDuasPaletasSource,
  formInvalidoSource,
  formRotuloEControleSource,
  formSource,
} from './form.source';

const TODAS = [
  formSource,
  formRotuloEControleSource,
  formComDescricaoSource,
  formInvalidoSource,
  formDesabilitadoSource,
  formEmDuasPaletasSource,
  formComFieldsetSource,
  formComVariosCamposSource,
];

describe('formSource', () => {
  it('ensina as peças que o componente realmente exporta', () => {
    const saida = formSource();
    expect(saida).toContain('import { FormField } from "@/components/ui/form";');
    expect(saida).toContain('import { Input } from "@/components/ui/input";');
  });

  it('o controle é PROJETADO dentro do campo, e é o campo que os associa', () => {
    const saida = formSource();
    expect(saida).toContain('<FormField');
    expect(saida).toContain('<Input');
    expect(saida).toContain('</FormField>');
  });

  it('o rótulo do control vira a prop label', () => {
    expect(formSource(undefined, { args: { label: 'Telefone' } })).toContain('label="Telefone"');
  });

  it('control vazio significa peça AUSENTE, não atributo com string vazia', () => {
    // Um `aria-describedby=""` faz o leitor de tela anunciar uma pausa sem
    // conteúdo — a descrição some do markup, não vira atributo vazio.
    const saida = formSource(undefined, { args: { label: 'Email', description: '', error: '' } });
    expect(saida).toContain('<FormField label="Email">');
    expect(saida).not.toContain('description=');
    expect(saida).not.toContain('error=');
  });

  it('a mensagem de erro vem sempre acompanhada de aria-invalid no controle', () => {
    // Cor no rótulo sozinha não alcança quem não enxerga cor.
    const saida = formSource(undefined, { args: { error: 'Email inválido.' } });
    expect(saida).toContain('error="Email inválido."');
    expect(saida).toContain('aria-invalid');
  });

  it('sem erro e sem o control ligado, nada de aria-invalid', () => {
    expect(formSource(undefined, { args: { error: '', ariaInvalid: false } })).not.toContain(
      'aria-invalid',
    );
  });

  it('o control de desabilitado vai para o CONTROLE, não para o campo', () => {
    const saida = formSource(undefined, { args: { disabled: true } });
    expect(saida).toContain('disabled');
    expect(saida.indexOf('disabled')).toBeGreaterThan(saida.indexOf('<Input'));
  });

  it('cai nos textos padrão quando o control entrega um espião no lugar da string', () => {
    const espiao = () => 'CORPO_DO_MOCK';
    const saida = formSource(undefined, {
      args: { label: espiao as never, placeholder: espiao as never },
    });
    expect(saida).toContain('label="Email"');
    expect(saida).toContain('placeholder="ex: joao@empresa.com"');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });
});

describe('variantes', () => {
  it('o par mínimo não leva descrição nem erro — a ausência é o assunto', () => {
    const saida = formRotuloEControleSource();
    expect(saida).toContain('<FormField label="Nome completo">');
    expect(saida).not.toContain('description=');
    expect(saida).not.toContain('error=');
  });

  it('a descrição é declarada no campo, e o campo a liga ao controle', () => {
    const saida = formComDescricaoSource();
    expect(saida).toContain('description="Use pelo menos 8 caracteres, com letras e números."');
    expect(saida).toContain('<Input type="password" autoComplete="new-password" />');
  });
});

describe('estados', () => {
  it('inválido = mensagem no campo E aria-invalid no controle', () => {
    const saida = formInvalidoSource();
    expect(saida).toContain('error="A senha precisa ter pelo menos 8 caracteres."');
    expect(saida).toContain('aria-invalid');
    // `aria-live` e `data-error` são emitidos pelo componente: escrevê-los aqui
    // ensinaria a refazer à mão a costura que ele já entrega.
    expect(saida).not.toContain('aria-live');
    expect(saida).not.toContain('data-error');
  });

  it('desabilitado mantém rótulo e descrição — some só a interação', () => {
    const saida = formDesabilitadoSource();
    expect(saida).toContain('label="CPF"');
    expect(saida).toContain('description="Preenchido pelo cadastro da empresa."');
    expect(saida).toContain('disabled />');
  });

  it('a story das duas paletas mostra os três casos juntos', () => {
    const saida = formEmDuasPaletasSource();
    expect(saida).toContain('import { Fieldset, FormField } from "@/components/ui/form";');
    expect(saida).toContain('error="Endereço de email incompleto."');
    expect(saida).toContain('<Fieldset legend="Endereço de entrega">');
  });
});

describe('composições', () => {
  it('o agrupamento usa a legenda do componente, não um título por cima', () => {
    const saida = formComFieldsetSource();
    expect(saida).toContain('<Fieldset legend="Endereço de entrega">');
    // O par nativo fieldset/legend é o que anuncia o grupo; um <div> com <h3>
    // parece igual e não anuncia nada.
    expect(saida).not.toContain('<h3');
    expect(saida).not.toContain('<legend');
  });

  it('o formulário passa três controles diferentes pelo mesmo campo', () => {
    const saida = formComVariosCamposSource();
    expect(saida).toContain('import { Textarea } from "@/components/ui/textarea";');
    expect(saida).toContain('<Textarea name="bio" rows={3} />');
    expect(saida).toContain('<Button type="submit">Salvar</Button>');
    expect(saida.match(/<FormField/g)).toHaveLength(3);
  });

  it('a ordem de tabulação é a do DOM — nenhum snippet escreve tabIndex', () => {
    for (const fn of TODAS) {
      expect(fn()).not.toContain('tabIndex');
    }
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet escreve à mão a costura que o campo faz sozinho', () => {
    // `for`/`id` e `aria-describedby` são o produto do componente: mostrá-los
    // ensinaria a duplicar exatamente o que ele existe para resolver.
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).not.toContain('htmlFor');
      expect(saida).not.toContain('aria-describedby');
      expect(saida).not.toContain(' id=');
    }
  });

  it('nenhum snippet carrega o andaime do canvas da story', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      expect(saida).not.toContain('nds-max-w-sm');
      expect(saida).not.toContain('style={{');
    }
  });
});
