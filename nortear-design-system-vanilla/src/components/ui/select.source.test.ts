import { describe, expect, it } from 'vitest';
import {
  formSelectSnippet,
  selectSnippet,
  selectSource,
  selectSourceWith,
} from './select.source';

describe('selectSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do gatilho', () => {
    const código = selectSnippet();
    expect(código).toContain("import { createSelect } from '@/components/ui/select';");
    expect(código).toContain('createSelect({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="combobox"');
  });

  it('usa o nome acessível canônico do campo', () => {
    const código = selectSnippet({ labelText: 'Estado' });
    expect(código).toContain("'aria-label': 'Estado'");
    expect(código).toContain('rotulo.htmlFor =');
  });

  it('aponta para o rótulo visível quando é ele que nomeia o campo', () => {
    const código = selectSnippet({ 'aria-labelledby': true, labelText: 'Selecione a região' });
    expect(código).toContain("'aria-labelledby': 'campo-estado-rotulo'");
    expect(código).toContain('rotulo.id =');
    // Um nome só: com o rótulo visível ligado, o `aria-label` seria eco.
    expect(código).not.toContain("'aria-label':");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = selectSnippet();
    expect(código).not.toContain('size:');
    expect(código).not.toContain('disabled:');
    expect(código).not.toContain('required:');
    expect(código).not.toContain('defaultValue:');
    expect(código).not.toContain('aria-invalid');
  });

  it('mostra densidade, estado e valor inicial quando a story os usa', () => {
    const código = selectSnippet({ size: 'sm', disabled: true, required: true, defaultValue: 'rj' });
    expect(código).toContain("size: 'sm'");
    expect(código).toContain('disabled: true');
    expect(código).toContain('required: true');
    expect(código).toContain("defaultValue: 'rj'");
  });

  it('escreve a lista com a união discriminada da fábrica, sem fixture de story', () => {
    const código = selectSnippet({
      items: [
        { type: 'group', label: 'Sudeste', items: [{ value: 'sp', label: 'São Paulo' }] },
        { type: 'separator' },
        { type: 'group', label: 'Sul', items: [{ value: 'pr', label: 'Paraná' }] },
      ],
    });
    expect(código).toContain("type: 'group'");
    expect(código).toContain("{ type: 'separator' }");
    expect(código).toContain("{ value: 'sp', label: 'São Paulo' }");
    expect(código).not.toContain('ESTADOS');
    expect(código).not.toContain('REGIOES');
    expect(código).not.toContain('BASIC_ITEMS');
    expect(código).not.toContain('comRotulo');
  });

  it('mostra a opção bloqueada e o ícone decorativo quando a story os usa', () => {
    const bloqueada = selectSnippet({
      items: [{ value: 'mg', label: 'Minas Gerais (indisponível)', disabled: true }],
    });
    expect(bloqueada).toContain('disabled: true');

    const comIcone = selectSnippet({
      items: [{ value: 'email', label: 'E-mail', icon: ['m22 7-8.99 5.72', 'M4 4h16'] }],
    });
    expect(comIcone).toContain("icon: ['m22 7-8.99 5.72', 'M4 4h16']");
    expect(comIcone).not.toContain('ICONES');
  });

  it('liga a mensagem de erro ao campo pelos dois lados do par', () => {
    const código = selectSnippet({
      id: 'estado-invalido',
      'aria-invalid': true,
      mensagemDeErro: 'Selecione um estado para continuar.',
    });
    expect(código).toContain("'aria-invalid': true");
    expect(código).toContain("'aria-describedby': 'estado-invalido-erro'");
    expect(código).toContain("erro.id = 'estado-invalido-erro';");
    expect(código).toContain('append(rotulo, campo, erro)');
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
    const código = selectSource('', { args: { onValueChange: () => {} } });
    expect(código).toContain('onValueChange: (valor) => salvarEstado(valor)');
  });
});

describe('selectSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = selectSourceWith({ disabled: true })('', { args: { disabled: false } });
    expect(código).toContain('disabled: true');
  });
});

describe('selectEmFormularioSnippet', () => {
  it('mostra a serialização nativa, que é o assunto da composição', () => {
    const código = formSelectSnippet();
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain("name: 'state'");
    expect(código).toContain('required: true');
    expect(código).toContain('new FormData(formulario)');
    expect(código).toContain("createButton({ type: 'submit', label: 'Continuar' })");
  });
});
