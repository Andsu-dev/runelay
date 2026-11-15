export interface MessageTree {
  [key: string]: string | MessageTree;
}

export type MessagesShape<T> = { [K in keyof T]: T[K] extends string ? string : MessagesShape<T[K]> };

export const defineMessages = <T extends MessageTree>(ptBR: T, en: MessagesShape<T>) => ({ "pt-BR": ptBR, en });
