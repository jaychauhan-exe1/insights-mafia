/**
 * Robust way to get parts of any date in India Standard Time (IST)
 */
export const getISTParts = (date: Date | string = new Date()) => {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || "";
  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
};

/**
 * Get current date in IST (YYYY-MM-DD)
 */
export const getISTToday = (date: Date = new Date()) => {
  const { year, month, day } = getISTParts(date);
  return `${year}-${month}-${day}`;
};

/**
 * Format a timestamp to IST human-readable string (e.g., 01 Mar 2024, 02:29 PM)
 */
export const formatIST = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Get current time and date in IST for database insertion (ISO with +05:30)
 */
export const getISTISOString = (date: Date = new Date()) => {
  // sv-SE locale gives YYYY-MM-DD HH:mm:ss format
  const istStr = date.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });
  return istStr.replace(" ", "T") + "+05:30";
};

/**
 * Format timestamp to IST Time only (HH:mm)
 */
export const formatISTTime = (date: Date | string | null | undefined) => {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Use HH:mm as per existing UI
  });
};

/**
 * Get Hours specifically in IST (0-23)
 */
export const getISTHours = (date: Date = new Date()) => {
  const { hour } = getISTParts(date);
  return parseInt(hour);
};
