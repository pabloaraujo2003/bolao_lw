export function calcPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) return 3

  const predictedWinner = Math.sign(predictedHome - predictedAway)
  const actualWinner = Math.sign(actualHome - actualAway)

  if (predictedWinner === actualWinner) return 1
  return 0
}
