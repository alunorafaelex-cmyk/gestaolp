/**
 * Brazilian Portuguese date and time formatters
 */

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

export function formatDateTimeExtended(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];

  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} de ${monthName} de ${year} • ${hours}:${minutes}`;
}

export function formatRelativeDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - itemDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (diffDays === 0) {
    return `Hoje às ${hours}:${minutes}`;
  } else if (diffDays === 1) {
    return `Ontem às ${hours}:${minutes}`;
  } else if (diffDays > 1 && diffDays < 7) {
    return `Há ${diffDays} dias às ${hours}:${minutes}`;
  }

  return formatDateTime(isoString);
}

// Convert Date or ISO string to value format for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
export function toDatetimeLocalInput(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Parse value from <input type="datetime-local"> into ISO 8601 string
export function fromDatetimeLocalInput(localStr: string): string {
  if (!localStr) return new Date().toISOString();
  return new Date(localStr).toISOString();
}

// Convert Date or ISO string to value format for <input type="date"> (YYYY-MM-DD)
export function toDateInputFormat(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

// Format time only (HH:mm)
export function formatTimeOnly(isoString: string): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Format date in Brazilian standard (DD/MM/YYYY)
export function formatDateBrazilian(isoOrYmd: string): string {
  if (!isoOrYmd) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrYmd)) {
    const [y, m, d] = isoOrYmd.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(isoOrYmd);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Check if an ISO date string matches a YYYY-MM-DD local date
export function isSameDay(isoString: string, ymdDate: string): boolean {
  if (!isoString || !ymdDate) return false;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` === ymdDate;
}

export interface PerformerStats {
  rafael: number;
  leonardo: number;
  together: number;
  total: number;
}

/**
 * Computes individual participation and together counts:
 * - Rafael: performed_by = "Rafael" OR performed_by = "Rafael e Leonardo"
 * - Leonardo: performed_by = "Leonardo" OR performed_by = "Rafael e Leonardo"
 * - Em conjunto: performed_by = "Rafael e Leonardo"
 * - Total: total actions count (without duplicating together actions)
 */
export function computePerformerStats(actions: Array<{ performed_by: string }>): PerformerStats {
  let rafael = 0;
  let leonardo = 0;
  let together = 0;

  for (const act of actions) {
    const perf = act.performed_by;
    if (perf === 'Rafael') {
      rafael += 1;
    } else if (perf === 'Leonardo') {
      leonardo += 1;
    } else if (perf === 'Rafael e Leonardo') {
      together += 1;
      rafael += 1;
      leonardo += 1;
    }
  }

  return {
    rafael,
    leonardo,
    together,
    total: actions.length,
  };
}
