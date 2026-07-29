export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatEventDay(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function statusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING_APPROVAL":
      return "Pending";
    case "PUBLISHED":
      return "Live";
    case "CANCELLED":
      return "Cancelled";
    case "COMPLETED":
      return "Completed";
    case "PENDING":
      return "Awaiting payment";
    case "CONFIRMED":
      return "Confirmed";
    case "EXPIRED":
      return "Expired";
    case "REFUNDED":
      return "Refunded";
    default:
      return status;
  }
}
