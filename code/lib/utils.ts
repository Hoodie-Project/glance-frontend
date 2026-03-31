export function formatCount(count: number) {
  return new Intl.NumberFormat("ko-KR").format(count);
}

