import { PatientCondition as DbPatientCondition } from "@/services/database/migrations/v1/schema_v1";
import { Fhir } from "@/services/fhir-service/Fhir";

export const PatientConditionMapper = {
    // Converts a single FHIR Condition resource → DbPatientCondition object
    toDb: (fhir: Fhir.Condition, patientId: number): Partial<DbPatientCondition> => ({
        patient_id: patientId,
        linked_health_system: true,
        fhir_id: fhir.id,
        condition_name: fhir.code?.coding?.[0].display,
        onset_date: fhir.onsetDateTime ? new Date(fhir.onsetDateTime) : undefined,
    }),
};
