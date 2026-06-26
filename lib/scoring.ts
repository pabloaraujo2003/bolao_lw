export function calcPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) return 5

  const predictedWinner = Math.sign(predictedHome - predictedAway)
  const actualWinner = Math.sign(actualHome - actualAway)

  if (predictedWinner !== actualWinner) return 0

  // acertou o resultado: empate vale 3, vitória vale 1
  return predictedWinner === 0 ? 3 : 1
}
