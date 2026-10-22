export type QueryEmbedding = () => Promise<number[]>;

export function isValidVector(vector: readonly number[]) {
  return (
    vector.length > 0 &&
    vector.every(Number.isFinite) &&
    vector.some((value) => value !== 0)
  );
}

export function cosineSimilarity(
  left: readonly number[],
  right: readonly number[],
) {
  if (
    left.length !== right.length ||
    !isValidVector(left) ||
    !isValidVector(right)
  )
    return -1;
  let dot = 0,
    leftNorm = 0,
    rightNorm = 0;
  for (let i = 0; i < left.length; i++) {
    dot += left[i] * right[i];
    leftNorm += left[i] ** 2;
    rightNorm += right[i] ** 2;
  }
  return dot / Math.sqrt(leftNorm * rightNorm);
}
