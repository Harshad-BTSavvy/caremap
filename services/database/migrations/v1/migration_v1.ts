import { tables } from "@/services/database/migrations/v1/schema_v1";
import { logger } from "@/services/logging/logger";
import { SQLiteDatabase } from "expo-sqlite";

export const up = async (db: SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${tables.USER} (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ${tables.SYNC_PATIENT_DATA} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_fhir_id TEXT NOT NULL UNIQUE,
      last_synced_date TEXT,
      status INTEGER NOT NULL DEFAULT 0,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      fhir_id TEXT NOT NULL UNIQUE,
      blood_type TEXT,
      date_of_birth TEXT,
      first_name TEXT NOT NULL,
      gender TEXT,
      height REAL,
      height_unit TEXT,
      last_name TEXT NOT NULL,
      middle_name TEXT,
      profile_picture TEXT,
      relationship TEXT,
      weight REAL,
      weight_unit TEXT,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES ${tables.USER}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_SNAPSHOT} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      health_issues TEXT DEFAULT NULL,
      patient_overview TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_CONDITION} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      fhir_id TEXT UNIQUE,
      condition_name TEXT NOT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_EQUIPMENT} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      equipment_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      equipment_description TEXT,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_GOAL} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      fhir_id TEXT UNIQUE,
      goal_description TEXT NOT NULL,
      target_date TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_EMERGENCY_CARE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      topic TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_ALLERGY} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      fhir_id TEXT UNIQUE,
      topic TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      onset_date TEXT DEFAULT (datetime('now')),
      severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe')) DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_MEDICATION} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      fhir_id TEXT UNIQUE,
      name TEXT NOT NULL,
      details TEXT NOT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.PATIENT_NOTE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      reminder_date TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.HOSPITALIZATION} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      fhir_id TEXT UNIQUE,
      admission_date TEXT NOT NULL,
      discharge_date TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.SURGERY_PROCEDURE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      fhir_id TEXT UNIQUE,
      procedure_name TEXT NOT NULL,
      facility TEXT DEFAULT NULL,
      complications TEXT DEFAULT NULL,
      surgeon_name TEXT DEFAULT NULL,
      procedure_date TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.DISCHARGE_INSTRUCTION} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      linked_health_system INTEGER NOT NULL DEFAULT 0,
      fhir_id TEXT UNIQUE,
      summary TEXT NOT NULL,
      discharge_date TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );

     CREATE TABLE IF NOT EXISTS ${tables.TRACK_CATEGORY} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ${tables.TRACK_ITEM} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES ${tables.TRACK_CATEGORY}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.QUESTION} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      type TEXT CHECK(type IN ('boolean', 'multi-choice', 'multi-select', 'numeric', 'text')) NOT NULL,
      subtype TEXT,
      units TEXT,
      min REAL,
      max REAL,
      precision INTEGER,
      instructions TEXT DEFAULT NULL,
      parent_question_id INTEGER,
      display_condition TEXT,                                       -- JSON String
      required INTEGER NOT NULL DEFAULT 0,
      summary_template TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(item_id) REFERENCES ${tables.TRACK_ITEM}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.RESPONSE_OPTION} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(question_id) REFERENCES ${tables.QUESTION}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.TRACK_ITEM_ENTRY} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      patient_id INTEGER NOT NULL,
      track_item_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      selected INTEGER NOT NULL DEFAULT 1,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES ${tables.USER}(id) ON DELETE CASCADE,
      FOREIGN KEY(patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE,
      FOREIGN KEY(track_item_id) REFERENCES ${tables.TRACK_ITEM}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.TRACK_RESPONSE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      patient_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      track_item_entry_id INTEGER NOT NULL,
      answer TEXT NOT NULL, -- JSON string of option/s selected
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES ${tables.USER}(id) ON DELETE CASCADE,
      FOREIGN KEY(patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES ${tables.QUESTION}(id) ON DELETE CASCADE,
      FOREIGN KEY(track_item_entry_id) REFERENCES ${tables.TRACK_ITEM_ENTRY}(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ${tables.TRACK_CONFIG_VERSION} (
      module TEXT PRIMARY KEY,     -- e.g., 'track'
      version INTEGER NOT NULL DEFAULT 0,    -- version number from config
      last_synced_date TEXT          -- ISO timestamp when last sync happened
    );

    CREATE TABLE IF NOT EXISTS ${tables.CONTACT} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT DEFAULT NULL,
      relationship TEXT DEFAULT NULL,
      phone_number TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT NULL,
      email TEXT DEFAULT NULL,
      created_date TEXT NOT NULL DEFAULT (datetime('now')),
      updated_date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES ${tables.PATIENT}(id) ON DELETE CASCADE
    );
  `);

  logger.debug(`Tables created for V1.`);
};
