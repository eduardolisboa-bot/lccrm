export function nextRecurrenceDate(date: string, recorrencia: string): string | null {
  if (!date || !recorrencia || recorrencia === "nenhuma") return null;
  const d = new Date(`${date}T12:00:00`);
  if (recorrencia === "diaria") d.setDate(d.getDate() + 1);
  else if (recorrencia === "semanal") d.setDate(d.getDate() + 7);
  else if (recorrencia === "mensal") d.setMonth(d.getMonth() + 1);
  else return null;
  return d.toISOString().slice(0, 10);
}
