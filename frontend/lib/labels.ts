// enum 代替の String 値（§3-3）に対する日本語表示ラベル。許可値は PROJECT_SPEC / backend utils と一致。
export const EVENT_TYPE_LABEL: Record<string, string> = {
  REGULAR: "定例会",
  SPECIAL: "特別企画",
  SOCIAL: "懇親会",
  EXTERNAL: "外部交流",
};

export const EVENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "下書き",
  PUBLISHED: "公開",
  CLOSED: "締切",
  ARCHIVED: "アーカイブ",
};

export const ATTENDANCE_STATUS_LABEL: Record<string, string> = {
  ATTENDING: "出席",
  ABSENT: "欠席",
  UNDECIDED: "未定",
  LATE: "遅刻",
};
