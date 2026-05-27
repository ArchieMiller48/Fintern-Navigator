const CV_KEY = "fn_cv_records";
const INTERVIEW_KEY = "fn_interview_records";
const FIRST_USE_KEY = "fn_first_use";
const MAX_RECORDS = 50;

export interface CVRecord {
  id: string;
  date: string;
  fileName: string;
  overallScore: number;
  atsScore: number;
  contentScore: number;
  keywordScore: number;
  impactScore: number;
  formatScore: number;
}

export interface InterviewRecord {
  id: string;
  date: string;
  role: string;
  firm: string;
  overallScore: number;
  communicationScore: number;
  commercialScore: number;
  motivationScore: number;
  competencyScore: number;
  technicalScore: number;
}

export function getCVRecords(): CVRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CV_KEY);
    return raw ? (JSON.parse(raw) as CVRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveCVRecord(r: CVRecord): void {
  if (typeof window === "undefined") return;
  try {
    const records = getCVRecords();
    records.unshift(r);
    if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
    localStorage.setItem(CV_KEY, JSON.stringify(records));
    ensureFirstUse();
  } catch {
    // silently ignore storage errors
  }
}

export function getInterviewRecords(): InterviewRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INTERVIEW_KEY);
    return raw ? (JSON.parse(raw) as InterviewRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveInterviewRecord(r: InterviewRecord): void {
  if (typeof window === "undefined") return;
  try {
    const records = getInterviewRecords();
    records.unshift(r);
    if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
    localStorage.setItem(INTERVIEW_KEY, JSON.stringify(records));
    ensureFirstUse();
  } catch {
    // silently ignore storage errors
  }
}

function ensureFirstUse(): void {
  if (!localStorage.getItem(FIRST_USE_KEY)) {
    localStorage.setItem(FIRST_USE_KEY, new Date().toISOString());
  }
}

export function getStreak(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(FIRST_USE_KEY);
    if (!raw) return 1;
    const first = new Date(raw);
    const now = new Date();
    const diffMs = now.getTime() - first.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  } catch {
    return 1;
  }
}
