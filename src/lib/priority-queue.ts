/**
 * Binary Min-Heap Priority Queue
 * Optimized for Dijkstra and A* shortest path search over Lightning graph.
 */

interface HeapNode<T> {
  element: T;
  priority: number;
}

export class MinHeapPriorityQueue<T> {
  private heap: HeapNode<T>[] = [];

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  enqueue(element: T, priority: number): void {
    const node: HeapNode<T> = { element, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;

    const min = this.heap[0].element;
    const last = this.heap.pop();

    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.sinkDown(0);
    }

    return min;
  }

  private bubbleUp(index: number): void {
    const node = this.heap[index];
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIdx];

      if (node.priority >= parent.priority) break;

      this.heap[index] = parent;
      this.heap[parentIdx] = node;
      index = parentIdx;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const node = this.heap[index];

    while (true) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let swapIdx = -1;

      if (leftChildIdx < length) {
        if (this.heap[leftChildIdx].priority < node.priority) {
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        if (
          (swapIdx === -1 && this.heap[rightChildIdx].priority < node.priority) ||
          (swapIdx !== -1 && this.heap[rightChildIdx].priority < this.heap[swapIdx].priority)
        ) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === -1) break;

      this.heap[index] = this.heap[swapIdx];
      this.heap[swapIdx] = node;
      index = swapIdx;
    }
  }
}
