export const formatAdmissionDate = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.error("Invalid date format:", dateString, error);
    return dateString;
  }
};

export const formatDateWithOffset = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = date.getMilliseconds().toString().padStart(3, '0');

  const offsetMin = date.getTimezoneOffset(); // in minutes
  const sign = offsetMin > 0 ? '-' : '+';
  const absMin = Math.abs(offsetMin);
  const offsetH = pad(Math.floor(absMin / 60));
  const offsetM = pad(absMin % 60);

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${ms}${sign}${offsetH}:${offsetM}`;
};