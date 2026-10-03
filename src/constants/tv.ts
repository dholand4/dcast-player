import { Platform } from 'react-native';

// No Android a FlatList desmonta os itens que saem da tela (removeClippedSubviews).
// Na TV o controle não acha o próximo item e a lista não desce, então desliga só lá.
export const TV_LIST_PROPS = Platform.isTV ? { removeClippedSubviews: false } : {};
