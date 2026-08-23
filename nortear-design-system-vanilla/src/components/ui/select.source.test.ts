import { describe, expect, it } from 'vitest';
import {
  formSelectSnippet,
  selectSnippet,
  selectSource,
  selectSourceWith,
} from './select.source';

describe('selectSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do gatilho', () => {
    const code = selectSnippet();
    expect(code).toContain("import { createSelect } from '@/components/ui/select';");
    expect(code).toContain('createSelect({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="combobox"');
  });

  it('usa o nome acessível canônico do campo', () => {
    const code = selectSnippet({ labelText: 'Estado' });
    expect(code).toContain("'aria-label': 'Estado'");
    expect(code).toContain('rotulo.htmlFor =');
  });

  it('aponta para o rótulo visível quando é ele que nomeia o campo', () => {
    const code = selectSnippet({ 'aria-labelledby': true, labelText: 'Selecione a região' });
    expect(code).toContain("'aria-labelledby': 'campo-estado-rotulo'");
    expect(code).toContain('rotulo.id =');
    // Um nome só: com o rótulo visível ligado, o `aria-label` seria eco.
    expect(code).not.toContain("'aria-label':");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = selectSnippet();
    expect(code).not.toContain('size:');
    expect(code).not.toContain('disabled:');
    expect(code).not.toContain('required:');
    expect(code).not.toContain('defaultValue:');
    expect(code).not.toContain('aria-invalid');
  });

  it('mostra densidade, estado e valor inicial quando a story os usa', () => {
    const code = selectSnippet({ size: 'sm', disabled: true, required: true, defaultValue: 'rj' });
    expect(code).toContain("size: 'sm'");
    expect(code).toContain('disabled: true');
    expect(code).toContain('required: true');
    expect(code).toContain("defaultValue: 'rj'");
  });

  it('escreve a lista com a união discriminada da fábrica, sem fixture de story', () => {
    const code = selectSnippet({
      items: [
        { type: 'group', label: 'Sudeste', items: [{ value: 'sp', label: 'São Paulo' }] },
        { type: 'separator' },
        { type: 'group', label: 'Sul', items: [{ value: 'pr', label: 'Paraná' }] },
      ],
    });
    expect(code).toContain("type: 'group'");
    expect(code).toContain("{ type: 'separator' }");
    expect(code).toContain("{ value: 'sp', label: 'São Paulo' }");
    expect(code).not.toContain('ESTADOS');
    expect(code).not.toContain('REGIOES');
    expect(code).not.toContain('BASIC_ITEMS');
    expect(code).not.toContain('comRotulo');
  });

  it('mostra a opção bloqueada e o ícone decorativo quando a story os usa', () => {
    const bloqueada = selectSnippet({
      items: [{ value: 'mg', label: 'Minas Gerais (indisponível)', disabled: true }],
    });
    expect(bloqueada).toContain('disabled: true');

    const withIcon = selectSnippet({
      items: [{ value: 'email', label: 'E-mail', icon: ['m22 7-8.99 5.72', 'M4 4h16'] }],
    });
    expect(withIcon).toContain("icon: ['m22 7-8.99 5.72', 'M4 4h16']");
    expect(withIcon).not.toContain('ICONES');
  });

  it('liga a mensagem de erro ao campo pelos dois lados do par', () => {
    const code = selectSnippet({
      id: 'estado-invalido',
      'aria-invalid': true,
      mensagemDeErro: 'Selecione um estado para continuar.',
    });
    expect(code).toContain("'aria-invalid': true");
    expect(code).toContain("'aria-describedby': 'estado-invalido-erro'");
    expect(code).toContain("erro.id = 'estado-invalido-erro';");
    expect(code).toContain('append(rotulo, campo, erro)');
  });
});

describe('selectSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = selectSource('<button role="combobox">', {});
    const pequeno = selectSource('<button role="combobox">', {
      args: { size: 'sm', name: 'uf', labelText: 'Unidade federativa' },
    });
    expect(padrão).not.toBe(pequeno);
    expect(pequeno).toContain("size: 'sm'");
    expect(pequeno).toContain("name: 'uf'");
    expect(pequeno).toContain("'aria-label': 'Unidade federativa'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(selectSource('<button role="combobox" aria-expanded="false">', {})).not.toContain(
      'aria-expanded="false"',
    );
  });

  it('liga a linha do callback quando a story passa um spy nos args', () => {
    const code = selectSource('', { args: { onValueChange: () => {} } });
    expect(code).toContain('onValueChange: (valor) => salvarEstado(valor)');
  });
});

describe('selectSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = selectSourceWith({ disabled: true })('', { args: { disabled: false } });
    expect(code).toContain('disabled: true');
  });
});

describe('selectEmFormularioSnippet', () => {
  it('mostra a serialização nativa, que é o assunto da composição', () => {
    const code = formSelectSnippet();
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("name: 'state'");
    expect(code).toContain('required: true');
    expect(code).toContain('new FormData(formulario)');
    expect(code).toContain("createButton({ type: 'submit', label: 'Continuar' })");
  });
});
