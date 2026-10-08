export type BaseId = 'dowel' | 'eiffel' | 'sled';

export interface ShellColor {
  id: string;
  name: string;
  hex: number;
  price: number;
}

export interface BaseOption {
  id: BaseId;
  name: string;
  description: string;
  price: number;
}

export interface ChairConfig {
  color: string;
  base: BaseId;
  seatPad: boolean;
}

export const BASE_PRICE = 189;
export const SEAT_PAD_PRICE = 45;

export const SHELL_COLORS: ShellColor[] = [
  { id: 'white', name: 'Off white', hex: 0xf1efe9, price: 0 },
  { id: 'grey', name: 'Elephant grey', hex: 0x8d9094, price: 0 },
  { id: 'black', name: 'Basalt', hex: 0x24262a, price: 0 },
  { id: 'blue', name: 'Cobalt', hex: 0x2c58c9, price: 12 },
  { id: 'yellow', name: 'Mustard', hex: 0xe0a82e, price: 12 },
  { id: 'red', name: 'Poppy', hex: 0xc8382e, price: 12 },
  { id: 'green', name: 'Pine', hex: 0x2f6b55, price: 12 }
];

export const BASES: BaseOption[] = [
  { id: 'dowel', name: 'Dowel legs', description: 'Maple legs with wire cross brace', price: 0 },
  { id: 'eiffel', name: 'Eiffel base', description: 'Chrome rods in a wire frame', price: 38 },
  { id: 'sled', name: 'Sled base', description: 'Bent steel tube, stackable', price: 24 }
];

export const DEFAULT_CONFIG: ChairConfig = {
  color: 'white',
  base: 'dowel',
  seatPad: false
};

export function findColor(id: string): ShellColor {
  return SHELL_COLORS.find((c) => c.id === id) ?? SHELL_COLORS[0];
}

export function findBase(id: BaseId): BaseOption {
  return BASES.find((b) => b.id === id) ?? BASES[0];
}

export function totalPrice(cfg: ChairConfig): number {
  return (
    BASE_PRICE +
    findColor(cfg.color).price +
    findBase(cfg.base).price +
    (cfg.seatPad ? SEAT_PAD_PRICE : 0)
  );
}

export const formatPrice = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);
