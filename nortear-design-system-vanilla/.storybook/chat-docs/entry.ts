/**
 * A entrada do bundle do chat, para o manager.
 *
 * Existe separada de `index.ts` por um motivo só: `index.ts` EXPORTA
 * `mountChatDocs` e não o chama, para que o módulo continue importável e
 * testável sem efeito colateral. O bundle, ao contrário, precisa se montar
 * sozinho — ele é carregado por uma tag `<script>` no `manager-head.html`, e
 * ninguém o chama depois.
 */

import { mountChatDocs } from './index';

mountChatDocs();
