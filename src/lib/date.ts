export function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "NO DUE";

  const dateOnly = dueDate.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);

  return new Date(year, month - 1, day)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}