export const GroupSessionStatus = {
  Open: 0,
  PaymentProcessing: 1,
  Completed: 2,
  Cancelled: 3,
};

export const ParticipantPaymentStatus = {
  Pending: 0,
  Authorized: 1,
  Paid: 2,
  Failed: 3,
};

export const GroupOrderPaymentStatus = {
  Pending: 0,
  Processing: 1,
  Succeeded: 2,
  Failed: 3,
  Cancelled: 4,
};

export function sessionStatusLabel(status) {
  const map = ["OPEN", "PAYMENT_PROCESSING", "COMPLETED", "CANCELLED"];
  return map[status] ?? "UNKNOWN";
}
