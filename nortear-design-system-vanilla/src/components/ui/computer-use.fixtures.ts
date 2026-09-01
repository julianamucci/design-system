/**
 * Andaime das demonstrações da tela do computador.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — a
 * palavra que apresenta o endereço e o molde da contagem. Os PASSOS e o
 * ENDEREÇO saem de `@shared/primitives/computer-use-examples`, porque não são
 * idioma: o ponto que o agente clicou é o mesmo nos três, e escrever pontos
 * diferentes por idioma faria as fotos mostrarem marcas em lugares diferentes.
 *
 * A TELA NÃO PODE SER COMPARTILHADA, e é a única parte do andaime que não é.
 * Ela é `HTMLElement` — DOM, que não entra em primitivo compartilhado —, e é
 * ESPAÇO de quem consome (§1 e §2 da guideline 17). Cada stack monta a sua com
 * os próprios primitivos; o que se compartilha é onde as marcas caem sobre ela.
 */

import { createTranslation } from '@/lib/i18n';
import computerUseTranslations from '@shared/content/computer-use/translations.json';
import { createButton } from './button';
import { createCard, createCardContent, createCardHeader, createCardTitle } from './card';
import { createInput } from './input';
import { createLabel } from './label';
import type { ComputerUseLabels } from './computer-use';

const { t } = createTranslation(computerUseTranslations as Record<string, unknown>);

/** A palavra que apresenta o endereço e o molde da contagem. */
export function computerUseLabels(): ComputerUseLabels {
  return { address: t('labels.address'), position: t('labels.position') };
}

/**
 * Escopo de id por instância.
 *
 * A demonstração monta várias telas na mesma página, e cada uma tem dois campos
 * rotulados. Ids derivados só do nome do campo colidiriam, e `for` passaria a
 * resolver para o PRIMEIRO campo do documento — dando ao segundo formulário o
 * rótulo do primeiro. Mesma precaução do bloco de terminal, pelo mesmo motivo.
 */
let demoScreenCount = 0;

/**
 * A tela de demonstração: uma página de entrada qualquer.
 *
 * NENHUMA CAPTURA DE SISTEMA REAL, e é a §1 da guideline 17 aplicada: uma
 * fotografia de produto de terceiro traz marca registrada e conteúdo que não é
 * nosso. A saída é desenhar a tela com os PRÓPRIOS primitivos do design system
 * — o que, de quebra, mostra o contrato certo: a peça recebe um elemento, e
 * qualquer elemento serve.
 *
 * ELA É INERTE, e essa é a decisão que se leva daqui para quem consome. A tela
 * dentro da moldura é uma FOTO: ninguém está preenchendo aquele formulário. Sem
 * `inert`, o teclado entraria em campos de uma tela que não é a de quem navega
 * — parada de tabulação para dentro de um retrato — e o leitor de tela leria um
 * formulário que não existe. Com ele, a figura volta a ser o que a legenda diz
 * que é.
 *
 * OS CAMPOS TÊM RÓTULO DE VERDADE, ainda que inertes. É cinto e suspensório: se
 * a ferramenta de auditoria não honrar `inert`, um campo sem rótulo reprovaria,
 * e o defeito seria do andaime — não da peça.
 */
export function createDemoScreen(): HTMLElement {
  const instance = ++demoScreenCount;
  const emailId = `nds-computer-use-demo-${instance}-email`;
  const passwordId = `nds-computer-use-demo-${instance}-password`;

  const card = createCard({ class: 'nds-h-full nds-w-full' });

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: t('demonstration.screen.title') }));
  card.appendChild(header);

  const content = createCardContent({ class: 'nds-stack' });
  content.dataset.spacing = 'sm';

  const emailField = document.createElement('div');
  emailField.className = 'nds-stack';
  emailField.dataset.spacing = 'xs';
  emailField.append(
    createLabel({ text: t('demonstration.screen.email'), htmlFor: emailId }),
    createInput({ id: emailId, type: 'email', value: 'agente@exemplo.com' }),
  );

  const passwordField = document.createElement('div');
  passwordField.className = 'nds-stack';
  passwordField.dataset.spacing = 'xs';
  passwordField.append(
    createLabel({ text: t('demonstration.screen.password'), htmlFor: passwordId }),
    createInput({ id: passwordId, type: 'password', value: 'ainda-nao-digitada' }),
  );

  content.append(
    emailField,
    passwordField,
    createButton({ label: t('demonstration.screen.submit'), class: 'nds-w-full' }),
  );
  card.appendChild(content);

  const screen = document.createElement('div');
  screen.append(card);
  // A FOTO NÃO SE OPERA (ver o docblock acima). `inert` tira a tela inteira da
  // ordem de foco e da árvore de acessibilidade de uma vez só, sem precisar
  // desabilitar controle por controle — e desabilitar mudaria o DESENHO da
  // tela, que é justamente o que a demonstração quer mostrar intacto.
  screen.setAttribute('inert', '');
  return screen;
}
