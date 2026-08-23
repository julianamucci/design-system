import { describe, expect, it } from 'vitest';
import {
  labelBlockDisabledSnippet,
  labelWithBoxSnippet,
  labelObrigatorioSnippet,
  labelSnippet,
  labelSource,
  labelSourceWith,
} from './label.source';

describe('labelSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = labelSnippet();
    expect(code).toContain("import { createLabel } from '@/components/ui/label';");
    expect(code).toContain('createLabel({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<label');
  });

  it('sai com o controle que o rótulo nomeia — sozinho ele não associa nada', () => {
    const code = labelSnippet();
    expect(code).toContain("createLabel({ text: 'Nome completo', htmlFor: 'campo' })");
    expect(code).toContain("createInput({ id: 'campo' })");
    expect(code).toContain("document.querySelector('#app')?.append(rotulo, campo);");
  });

  it('usa a opção canônica `class`, nunca o apelido depreciado', () => {
    // `className` é o nome do control da story e sobrevive só como apelido
    // `@deprecated` na fábrica: ensiná-lo perpetuaria o que está de saída.
    const code = labelSnippet({ className: 'nds-text-caption' });
    expect(code).toContain("class: 'nds-text-caption'");
    expect(code).not.toContain('className');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = labelSnippet();
    expect(code).not.toContain('class:');
    expect(code).not.toContain('type');
    expect(code).not.toContain('disabled');
  });

  it('marca o CONTROLE com nds-peer e o põe antes do rótulo quando bloqueado', () => {
    // O rótulo não recebe classe nenhuma: quem reage é o `.nds-label`, casando
    // no irmão marcado. Sem a ordem, a regra não alcança.
    const code = labelSnippet({ text: 'CPF', htmlFor: 'cpf', disabled: true });
    expect(code).toContain("class: 'nds-peer'");
    expect(code).toContain('disabled: true');
    expect(code).toContain("document.querySelector('#app')?.append(campo, rotulo);");
  });
});

describe('labelObrigatorioSnippet', () => {
  it('deixa o asterisco decorativo e a obrigatoriedade no controle', () => {
    const code = labelObrigatorioSnippet();
    expect(code).toContain("marcador.setAttribute('aria-hidden', 'true');");
    expect(code).toContain("rotulo.append('Email profissional', marcador);");
    expect(code).toContain("campo.setAttribute('aria-required', 'true');");
    // O texto entra pelo `append`, e não por `text:`, senão o asterisco ficaria
    // antes do rótulo.
    expect(code).not.toContain('text:');
  });
});

describe('labelBlocoDesabilitadoSnippet', () => {
  it('desabilita pelo ancestral, e não peça por peça', () => {
    const code = labelBlockDisabledSnippet();
    expect(code).toContain("bloco.dataset.disabled = 'true';");
    expect(code).toContain("createLabel({ text: 'Documento', htmlFor: 'documento' })");
    expect(code).toContain('append(bloco)');
  });
});

describe('labelComCaixaSnippet', () => {
  it('usa a fábrica da caixa, e só o par for/id', () => {
    const code = labelWithBoxSnippet();
    expect(code).toContain("import { createCheckbox } from '@/components/ui/checkbox';");
    expect(code).toContain("createCheckbox({ id: 'termos' })");
    expect(code).toContain("htmlFor: 'termos'");
    // Nada de ouvinte reenviando o clique: a caixa é um <button>, e a
    // associação nativa basta.
    expect(code).not.toContain('addEventListener');
  });
});

describe('labelSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = labelSource('<label data-slot="label">', {});
    const other = labelSource('<label data-slot="label">', {
      args: { text: 'Telefone', className: 'nds-text-caption' },
    });
    expect(padrão).not.toBe(other);
    expect(other).toContain("text: 'Telefone'");
    expect(other).toContain("class: 'nds-text-caption'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(labelSource('<label data-slot="label" for="x">Nome</label>', {})).not.toContain('for="x"');
  });
});

describe('labelSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = labelSourceWith({ text: 'CPF', disabled: true })('', { args: { text: 'Nome' } });
    expect(code).toContain("text: 'CPF'");
    expect(code).toContain("class: 'nds-peer'");
  });
});
