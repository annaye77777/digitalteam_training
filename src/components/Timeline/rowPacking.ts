// 簡單的區間排列（interval packing）：
// 純粹是版面呈現用途 —— 讓同一軌道內時間重疊的區塊分配到不同子列，
// 避免視覺上互相蓋住；不代表任何「衝突偵測」的業務邏輯判斷。

export interface PackedItem<T> {
  item: T;
  row: number;
  startMs: number;
  endMs: number;
}

export function packRows<T>(
  items: T[],
  getStart: (item: T) => number,
  getEnd: (item: T) => number
): { packed: PackedItem<T>[]; rowCount: number } {
  const sorted = [...items].sort((a, b) => getStart(a) - getStart(b));
  const rowEnds: number[] = []; // 每一列目前最後一個區塊的結束時間
  const packed: PackedItem<T>[] = [];

  for (const item of sorted) {
    const startMs = getStart(item);
    const endMs = getEnd(item);
    let row = rowEnds.findIndex((end) => end <= startMs);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(endMs);
    } else {
      rowEnds[row] = endMs;
    }
    packed.push({ item, row, startMs, endMs });
  }

  return { packed, rowCount: rowEnds.length || 1 };
}
