export const EXPORT_REMIND_DAYS = 14;

/** 書き出しを促すべきか */
export function needsBackup(lastExportAt: string | null, entryCount: number) {
  if (!entryCount) return false;
  if (!lastExportAt) return true;
  return Date.now() - Date.parse(lastExportAt) > EXPORT_REMIND_DAYS * 86400_000;
}
