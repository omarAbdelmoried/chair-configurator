export type BaseId = 'dowel' | 'eiffel' | 'sled';
export type BaseColorId = 'natural' | 'dark' | 'chrome';
export type BaseOnId = 'felt-dark' | 'felt-white' | 'carpet-dark' | 'carpet-white';
export type ShellStyleId = 'side-chair' | 'armchair';

export interface BaseOnOption {
  id: BaseOnId;
  name: string;
  description: string;
  color: number;
  material: 'felt' | 'carpet';
}

export interface BaseColorOption {
  id: BaseColorId;
  name: string;
  hex: number;
  metalness: number;
  roughness: number;
}

export interface ShellStyleOption {
  id: ShellStyleId;
  name: string;
  description: string;
}

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
  shellStyle: ShellStyleId;
  color: string;
  base: BaseId;
  baseColor: BaseColorId;
  baseOn: BaseOnId;
  seatPad: boolean;
}

export const BASE_PRICE = 189;
export const SEAT_PAD_PRICE = 45;

export const SHELL_STYLES: ShellStyleOption[] = [
  { id: 'side-chair', name: 'Plastic side chair', description: 'Classic armless shell' },
  { id: 'armchair', name: 'Plastic armchair', description: 'Shell with integrated arms' }
];

export const BASE_COLORS: BaseColorOption[] = [
  { id: 'natural', name: 'Natural wood', hex: 0xd2a76b, metalness: 0, roughness: 0.55 },
  { id: 'dark', name: 'Basic dark', hex: 0x24262a, metalness: 0.35, roughness: 0.4 },
  { id: 'chrome', name: 'Chrome', hex: 0xdfe2e6, metalness: 1, roughness: 0.15 }
];

export const BASE_ON_OPTIONS: BaseOnOption[] = [
  {
    id: 'felt-dark',
    name: 'Felt glides, dark',
    description: 'For wood and tile floors',
    color: 0x292b2f,
    material: 'felt'
  },
  {
    id: 'felt-white',
    name: 'Felt glides, white',
    description: 'For wood and tile floors',
    color: 0xe8e6df,
    material: 'felt'
  },
  {
    id: 'carpet-dark',
    name: 'Carpet glides, dark',
    description: 'For carpet',
    color: 0x292b2f,
    material: 'carpet'
  },
  {
    id: 'carpet-white',
    name: 'Carpet glides, white',
    description: 'For carpet',
    color: 0xe8e6df,
    material: 'carpet'
  }
];

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
  shellStyle: 'side-chair',
  color: 'white',
  base: 'dowel',
  baseColor: 'natural',
  baseOn: 'felt-dark',
  seatPad: false
};

export function findShellStyle(id: ShellStyleId): ShellStyleOption {
  return SHELL_STYLES.find((style) => style.id === id) ?? SHELL_STYLES[0];
}

export function findColor(id: string): ShellColor {
  return SHELL_COLORS.find((c) => c.id === id) ?? SHELL_COLORS[0];
}

export function findBase(id: BaseId): BaseOption {
  return BASES.find((b) => b.id === id) ?? BASES[0];
}

export function findBaseColor(id: BaseColorId): BaseColorOption {
  return BASE_COLORS.find((color) => color.id === id) ?? BASE_COLORS[0];
}

export function findBaseOn(id: BaseOnId): BaseOnOption {
  return BASE_ON_OPTIONS.find((option) => option.id === id) ?? BASE_ON_OPTIONS[0];
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
