export const POINTS_PER_REWARD_DOLLAR = 50;

export function calculateRedemption(currentPoints, subtotal, requestedPoints) {
  const availablePoints = Math.max(0, Math.floor(Number(currentPoints)));

  const availableDollars = Math.floor(
    availablePoints / POINTS_PER_REWARD_DOLLAR,
  );

  const discount = Math.min(availableDollars, Math.floor(Number(subtotal)));
  const maximumPoints = discount * POINTS_PER_REWARD_DOLLAR;
  if (requestedPoints === undefined) {
    return { discount, pointsUsed: maximumPoints };
  }
  if (!Number.isSafeInteger(requestedPoints) || requestedPoints < 50 ||
      requestedPoints % POINTS_PER_REWARD_DOLLAR !== 0 || requestedPoints > maximumPoints) {
    throw new Error("Choose points in groups of 50, within your balance and order subtotal.");
  }
  return {
    discount: requestedPoints / POINTS_PER_REWARD_DOLLAR,
    pointsUsed: requestedPoints,
  };
}
