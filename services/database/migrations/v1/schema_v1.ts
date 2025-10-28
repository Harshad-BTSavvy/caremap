import { SeverityType } from "@/constants/fhirTypes";
import { NumericSubtype, QuestionType, TrackingFrequency } from "@/constants/trackTypes";
import { Units } from "@/constants/units";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SyncPatientData {
  id: string;
  patient_fhir_id: string;
  last_synced_date: Date | null;
  status: boolean;
  created_date: Date;
  updated_date: Date;
}

export interface Patient {
  id: number;
  user_id: string;
  fhir_id: string;
  blood_type?: string;
  date_of_birth?: Date;
  first_name: string;
  gender?: string;
  height?: number;
  height_unit?: string;
  last_name: string;
  middle_name?: string;
  profile_picture?: string;
  relationship?: string;
  weight?: number;
  weight_unit?: string;
  created_date: Date;
  updated_date: Date;
}

export interface PatientSnapshot {
  id: number;
  patient_id: number;
  health_issues?: string;
  patient_overview?: string;
  created_date: Date;
  updated_date: Date;
}

export interface PatientCondition {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  fhir_id?: string;
  condition_name: string;
  onset_date?: Date;
  created_date: Date;
  updated_date: Date;
}

export interface PatientEquipment {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  equipment_name: string;
  equipment_description?: string;
  created_date: Date;
  updated_date: Date;
}

export interface PatientGoal {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  fhir_id?: string;
  goal_description: string;
  target_date?: Date;
  created_date: Date;
  updated_date: Date;
}

export interface PatientEmergencyCare {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  topic: string;
  details?: string;
  created_date: Date;
  updated_date: Date;
}

export interface PatientAllergy {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  fhir_id?: string;
  topic: string;
  details?: string;
  onset_date?: Date;
  severity?: SeverityType;
  created_date: Date;
  updated_date: Date;
}

export interface PatientMedication {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  fhir_id?: string;
  name: string;
  details: string;
  created_date: Date;
  updated_date: Date;
}

export interface PatientNote {
  id: number;
  patient_id: number;
  topic: string;
  details?: string;
  reminder_date?: Date;
  created_date: Date;
  updated_date: Date;
}

export interface Hospitalization {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  fhir_id?: string;
  admission_date: Date;
  discharge_date: Date;
  details: string;
  created_date: Date;
  updated_date: Date;
}

export interface SurgeryProcedure {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  fhir_id?: string;
  procedure_name: string;
  facility?: string;
  complications?: string;
  surgeon_name?: string;
  procedure_date: Date;
  details?: string;
  created_date: Date;
  updated_date: Date;
}

export interface DischargeInstruction {
  id: number;
  patient_id: number;
  linked_health_system: boolean;
  fhir_id?: string;
  summary: string;
  discharge_date: Date;
  details?: string;
  created_date: Date;
  updated_date: Date;
}

export interface TrackCategory {
  id: number;
  code: string;
  name: string;
  status: "active" | "inactive";
  created_date: Date;
  updated_date: Date;
}

export interface TrackItem {
  id: number;
  category_id: number;
  code: string;
  name: string;
  frequency: TrackingFrequency;
  status: "active" | "inactive";
  created_date: Date;
  updated_date: Date;
}

export interface Question {
  id: number;
  item_id: number;
  code: string;
  text: string;
  type: QuestionType;
  required: boolean;
  summary_template?: string;
  status: "active" | "inactive";
  created_date: Date;
  updated_date: Date;

  // optional metadata fields
  instructions?: string;
  subtype?: NumericSubtype;
  units?: Units;
  min?: number;
  max?: number;
  precision?: number;
  parent_question_id?: number | null;
  display_condition?: string | null;
}

export interface ResponseOption {
  id: number;
  question_id: number;
  code: string;
  text: string;
  status: "active" | "inactive";
  created_date: Date;
  updated_date: Date;
}

export interface TrackResponse {
  id: number;
  user_id: string;
  patient_id: number;
  question_id: number;
  track_item_entry_id: number;
  answer: string;
  created_date: Date;
  updated_date: Date;
}

export interface TrackItemEntry {
  id: number;
  user_id: string;
  patient_id: number;
  track_item_id: number;
  date: Date;
  selected: 0 | 1;
  created_date: Date;
  updated_date: Date;
}

export interface TrackConfigVersion {
  module: string;
  version: number;
  last_synced_date: string | null;
}

export interface Contact {
  id: number;
  patient_id: number;
  first_name: string;
  last_name?: string;
  relationship?: string;
  phone_number: string;
  description?: string;
  email?: string;
  created_date: Date;
  updated_date: Date;
}

export const tables = {
  USER: "USER",
  SYNC_PATIENT_DATA: "SYNC_PATIENT_DATA",
  PATIENT: "PATIENT",
  PATIENT_SNAPSHOT: "PATIENT_SNAPSHOT",
  PATIENT_CONDITION: "PATIENT_CONDITION",
  PATIENT_EQUIPMENT: "PATIENT_EQUIPMENT",
  PATIENT_GOAL: "PATIENT_GOAL",
  PATIENT_EMERGENCY_CARE: "PATIENT_EMERGENCY_CARE",
  PATIENT_ALLERGY: "PATIENT_ALLERGY",
  PATIENT_MEDICATION: "PATIENT_MEDICATION",
  PATIENT_NOTE: "PATIENT_NOTE",
  HOSPITALIZATION: "HOSPITALIZATION",
  SURGERY_PROCEDURE: "SURGERY_PROCEDURE",
  DISCHARGE_INSTRUCTION: "DISCHARGE_INSTRUCTION",
  TRACK_CATEGORY: "TRACK_CATEGORY",
  TRACK_ITEM: "TRACK_ITEM",
  QUESTION: "QUESTION",
  RESPONSE_OPTION: "RESPONSE_OPTION",
  TRACK_RESPONSE: "TRACK_RESPONSE",
  TRACK_ITEM_ENTRY: "TRACK_ITEM_ENTRY",
  TRACK_CONFIG_VERSION: "TRACK_CONFIG_VERSION",
  CONTACT: "CONTACT",
};
