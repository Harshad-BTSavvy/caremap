import { TrackingFrequency } from "@/constants/trackTypes";
import { Question, ResponseOption, TrackCategory, TrackItem, TrackResponse } from "@/services/database/migrations/v1/schema_v1";

export type AuthTokens = {
  access_token?: string;
  refresh_token?: string;
  issued_at?: string;
  expires_in?: string;
};

export type GoogleConfig = {
  REDIRECT_URI: string,
  GOOGLE_IOS_CLIENT_ID: string;
  GOOGLE_ANDROID_CLIENT_ID: string;
}

export type AlertType = 'i' | 'e' | 'w';

export const alertTitleMap: Record<AlertType, string> = {
  i: 'Info',
  e: 'Error',
  w: 'Warning',
};

// Track module types
export interface TrackCategoryWithItems extends TrackCategory {
  items: TrackItemWithProgress[];
};

export interface TrackItemWithProgress {
  item: TrackItem;
  entry_id: number;
  completed: number;
  total: number;
  summaries?: string[]; // item-level summaries
};

export interface TrackItemSelectable {
  item: TrackItem;
  selected: boolean;
}

export interface TrackCategoryWithSelectableItems {
  category: TrackCategory;
  items: TrackItemSelectable[];
}

export interface QuestionWithOptions {
  question: Question;
  options: ResponseOption[];
  existingResponse?: TrackResponse;
}

export interface CustomGoalQuestion {
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface CustomGoalParams {
  name: string;
  userId: string;
  patientId: number;
  date: string;
  frequency: TrackingFrequency;
  code: string;
  questions: CustomGoalQuestion[];
}

// Insights module types
export interface InsightTopicRequest {
  patientId: string;
}

export interface InsightTopicResponse {
  insightName: string;
  insightKey: string;
}

// Date-based insights types
export interface DateBasedInsightRequest {
  patientId: string;
  selectedDate: string;
  insightKey: string;
  questionCode: string;
}

export interface InsightDataPoint {
  label: string;
  date: string;
  value: number;
}

export interface InsightSeries {
  questionId: number;
  transform: string;
  topicId: number;
  topic: string;
  data: InsightDataPoint[];
}

export interface DateBasedInsightResponse {
  startDate: string;
  endDate: string;
  series: InsightSeries[];
}