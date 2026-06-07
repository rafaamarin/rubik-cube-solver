export interface TimerRecord {
  completionMs: number;
  scrambleSeed: string;
  moveCount: number;
  completedAt: string;
}

const STORAGE_KEY = "rubik-solver-game:timer-records";
const MAX_RECORDS = 12;

export function loadTimerRecords(): TimerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isTimerRecord).slice(0, MAX_RECORDS);
  } catch {
    return [];
  }
}

export function saveTimerRecord(record: TimerRecord): TimerRecord[] {
  const records = [record, ...loadTimerRecords()]
    .sort((a, b) => a.completionMs - b.completionMs)
    .slice(0, MAX_RECORDS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    return records;
  }

  return records;
}

export function formatTime(milliseconds: number): string {
  const totalMilliseconds = Math.max(0, Math.round(milliseconds));
  const minutes = Math.floor(totalMilliseconds / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const millis = totalMilliseconds % 1000;

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${millis
    .toString()
    .padStart(3, "0")}`;
}

function isTimerRecord(value: unknown): value is TimerRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as TimerRecord;
  return (
    typeof record.completionMs === "number" &&
    typeof record.scrambleSeed === "string" &&
    typeof record.moveCount === "number" &&
    typeof record.completedAt === "string"
  );
}
