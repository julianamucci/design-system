import { describe, expect, it } from 'vitest';
import {
  avatar2xlSource,
  avatarWithDelaySource,
  avatarWithIconSource,
  avatarWithStatusSource,
  groupAvatarSource,
  avatarLgSource,
  avatarSmSource,
  avatarSoIniciaisSource,
  avatarSource,
  avatarXlSource,
} from './avatar.source';

describe('avatarSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(avatarSource()).toContain(
      'import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";',
    );
  });

  it('monta foto com iniciais atrás — a forma completa do componente', () => {
    const output = avatarSource();
    expect(output).toContain('<Avatar>');
    expect(output).toContain('<AvatarImage src=');
    expect(output).toContain('<AvatarFallback>MR</AvatarFallback>');
  });

  it('omite o size quando é o preset padrão', () => {
    expect(avatarSource(undefined, { args: { size: 'md' } })).toContain('<Avatar>');
  });

  it('escreve o size quando difere do padrão', () => {
    expect(avatarSource(undefined, { args: { size: '2xl' } })).toContain('<Avatar size="2xl">');
  });

  it('não inventa preset fora da união', () => {
    expect(avatarSource(undefined, { args: { size: 'gigante' as never } })).toContain('<Avatar>');
  });

  it('a classe extra do control soma à do componente', () => {
    expect(avatarSource(undefined, { args: { className: 'nds-shadow-sm' } })).toContain(
      '<Avatar className="nds-shadow-sm">',
    );
  });

  it('nunca crava altura: o diâmetro sai do preset', () => {
    for (const size of ['sm', 'md', 'lg', 'xl', '2xl'] as const) {
      const output = avatarSource(undefined, { args: { size } });
      expect(output).not.toContain('height');
      expect(output).not.toContain('style=');
    }
  });

  it('a foto identifica a pessoa pelo alt', () => {
    expect(avatarSource()).toContain('alt="Foto de perfil de Maria Rodrigues"');
  });

  it('cai no padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = avatarSource(undefined, { args: { className: spy as never } });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('<Avatar>');
  });
});

describe('presets de tamanho', () => {
  it('cada story diz o seu, porque o arquivo desliga os controls', () => {
    expect(avatarSmSource()).toContain('<Avatar size="sm">');
    expect(avatarLgSource()).toContain('<Avatar size="lg">');
    expect(avatarXlSource()).toContain('<Avatar size="xl">');
    expect(avatar2xlSource()).toContain('<Avatar size="2xl">');
  });
});

describe('composições', () => {
  it('o atraso do fallback é declarado com o nome desta stack', () => {
    expect(avatarWithDelaySource()).toContain('<AvatarFallback delayMs={600}>');
  });

  it('só iniciais: sem AvatarImage, e sem importar a peça', () => {
    const output = avatarSoIniciaisSource();
    expect(output).toContain('import { Avatar, AvatarFallback } from "@/components/ui/avatar";');
    expect(output).not.toContain('<AvatarImage');
    expect(output).not.toContain('delayMs');
  });

  it('com ícone, quem nomeia é o rótulo do fallback — o svg é decorativo', () => {
    const output = avatarWithIconSource();
    expect(output).toContain('import { User } from "lucide-react";');
    expect(output).toContain('<AvatarFallback role="img" aria-label="Usuário genérico">');
    expect(output).toContain('<User aria-hidden="true" className="nds-icon-lg" />');
  });

  it('no grupo o rótulo é do contêiner e cada foto fica com alt vazio', () => {
    const output = groupAvatarSource();
    expect(output).toContain('<AvatarGroup role="group" aria-label="Participantes">');
    expect(output.match(/alt=""/g)).toHaveLength(3);
    expect(output).toContain('<AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>');
  });

  it('o grupo não empurra avatar com margem: o recuo é do contêiner', () => {
    const output = groupAvatarSource();
    expect(output).not.toContain('style=');
    expect(output).not.toContain('margin');
  });

  it('o indicador de status é irmão da imagem e se anuncia por rótulo', () => {
    const output = avatarWithStatusSource();
    expect(output).toContain('<AvatarBadge role="img" aria-label="Online" />');
    expect(output.indexOf('<AvatarFallback>')).toBeLessThan(output.indexOf('<AvatarBadge'));
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      avatarSource,
      avatar2xlSource,
      avatarWithDelaySource,
      avatarWithIconSource,
      avatarWithStatusSource,
      groupAvatarSource,
      avatarLgSource,
      avatarSmSource,
      avatarSoIniciaisSource,
      avatarXlSource,
    ]) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('IMG_MARIA');
      expect(output).not.toContain('DEMO_IMAGE');
      expect(output).not.toContain('unsplash');
    }
  });
});
