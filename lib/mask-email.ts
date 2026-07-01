/** Mask email for display in compact UI (e.g. sidebar). */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return "••••••@••••";
  }

  const maskedLocal =
    local.length <= 1
      ? "•"
      : `${local[0]}${"•".repeat(Math.min(local.length - 1, 8))}`;

  return `${maskedLocal}@${domain}`;
}
