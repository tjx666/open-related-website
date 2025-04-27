export const commands = ['toggleExtension'] as const;
export type Command = (typeof commands)[number];
