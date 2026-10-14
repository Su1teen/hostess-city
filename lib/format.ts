export function plural(count: number, one: string, few: string, many: string) {
  const n = Math.abs(count) % 100;
  if (n >= 11 && n <= 14) return many;
  const last = n % 10;
  return last === 1 ? one : last >= 2 && last <= 4 ? few : many;
}
export const guestsLabel = (count: number) => `${count} ${plural(count, 'гость', 'гостя', 'гостей')}`;
export const itemsLabel = (count: number) => `${count} ${plural(count, 'позиция', 'позиции', 'позиций')}`;
