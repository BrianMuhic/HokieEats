const RESERVATION_MINUTES = 5;

export function isReservationValid(reservedAt: Date | null): boolean {
  if (!reservedAt) return false;
  const expiry = new Date(reservedAt.getTime() + RESERVATION_MINUTES * 60 * 1000);
  return new Date() < expiry;
}

export function reservationExpiresInSeconds(reservedAt: Date): number {
  const expiry = new Date(reservedAt.getTime() + RESERVATION_MINUTES * 60 * 1000);
  return Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
}
