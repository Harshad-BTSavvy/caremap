import { FhirService } from "@/services/core/FhirService";
import { deletePatientByFhirId, getPatientByFhirId, updatePatient } from "@/services/core/PatientService";
import { BaseModel, useModel } from "@/services/database/BaseModel";
import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { DischargeInstructionModel } from "@/services/database/models/DischargeInstructionModel";
import { HospitalizationModel } from "@/services/database/models/HospitalizationModel";
import { PatientAllergyModel } from "@/services/database/models/PatientAllergyModel";
import { PatientConditionModel } from "@/services/database/models/PatientConditionModel";
import { PatientGoalModel } from "@/services/database/models/PatientGoalModel";
import { PatientMedicationModel } from "@/services/database/models/PatientMedicationModel";
import { SurgeryProcedureModel } from "@/services/database/models/SurgeryProcedureModel";
import { PATIENT_FHIR_ID, PATIENT_WITH_ALLERGY, PATIENT_WITH_CONDITION, PATIENT_WITH_DISCHARGE, PATIENT_WITH_GOAL, PATIENT_WITH_HOSPITALIZATION, PATIENT_WITH_MEDICATION, PATIENT_WITH_PROCEDURE } from "@/services/fhir-service/fhir-config";
import { logger } from "@/services/logging/logger";

function getSyncAction<T>(fhirData: T | null, exists: boolean) {
    if (!fhirData && exists) return "delete";
    if (fhirData && !exists) return "create";
    if (fhirData && exists) return "update";
    return "skip";
}

function createFhirLinkedService<T>(model: BaseModel<T>) {
    return {
        getByFhirId: async (patientId: number, fhirId: string) =>
            useModel(model, (m) => m.getFirstByFields({ patient_id: patientId, fhir_id: fhirId })),

        create: async (data: Partial<T>) =>
            useModel(model, (m) => m.insert(data)),

        updateByFhirId: async (data: Partial<T>, where: Partial<T>) =>
            useModel(model, (m) => m.updateByFields(data, where)),

        deleteByFhirId: async (where: Partial<T>) =>
            useModel(model, (m) => m.deleteByFields(where)),
    };
}

const patientFhirMap: Record<string, string> = {
    "Patient Medical Condition": PATIENT_WITH_CONDITION,
    "Patient Allergy": PATIENT_WITH_ALLERGY,
    "Patient Medication": PATIENT_WITH_MEDICATION,
    "Patient Hospitalization": PATIENT_WITH_HOSPITALIZATION,
    "Patient Surgery Procedure": PATIENT_WITH_PROCEDURE,
    "Patient Discharge Instruction": PATIENT_WITH_DISCHARGE,
    "Patient High Level Goal": PATIENT_WITH_GOAL,
};

// ------------------------------------------------------------------------------------------------------------

const getPatientFhirIdByUseCase = (name: string): string | null => {
    return patientFhirMap[name]?.trim() || PATIENT_FHIR_ID;
};

const PatientAllergyService = createFhirLinkedService(new PatientAllergyModel());
const PatientConditionService = createFhirLinkedService(new PatientConditionModel());
const PatientMedicationService = createFhirLinkedService(new PatientMedicationModel());
const PatientHospitalizationService = createFhirLinkedService(new HospitalizationModel());
const PatientDischargeInstructionService = createFhirLinkedService(new DischargeInstructionModel());
const PatientSurgeryProcedureService = createFhirLinkedService(new SurgeryProcedureModel());
const PatientHighLevelGoalService = createFhirLinkedService(new PatientGoalModel());

// Patient Health records sync
const resourcesToSync = [
    { name: "Patient Medical Condition", fetch: FhirService.getPatientConditions, service: PatientConditionService },
    { name: "Patient Allergy", fetch: FhirService.getPatientAllergies, service: PatientAllergyService },
    { name: "Patient Medication", fetch: FhirService.getPatientMedications, service: PatientMedicationService },
    { name: "Patient Hospitalization", fetch: FhirService.getPatientHospitalizations, service: PatientHospitalizationService },
    { name: "Patient Surgery Procedure", fetch: FhirService.getPatientSurgeryProcedures, service: PatientSurgeryProcedureService },
    { name: "Patient Discharge Instruction", fetch: FhirService.getPatientDischargeInstructions, service: PatientDischargeInstructionService },
    { name: "Patient High Level Goal", fetch: FhirService.getPatientHighLevelGoals, service: PatientHighLevelGoalService },
    // add more here in same pattern
];

// ------------------------------------------------------------------------------------------------------------

export async function handleBackgroundFhirSync(patient: DbPatient) {

    logger.debug(`[FHIR SYNC] Starting background sync for patient ${patient.id}`);

    // Patient record sync
    const fhirPatient = await FhirService.getPatient(patient.fhir_id);
    const existingPatient = await getPatientByFhirId(patient.fhir_id);
    const patientAction = getSyncAction(fhirPatient, !!existingPatient);

    logger.debug(`[FHIR SYNC][Patient] Action: ${patientAction}`);

    if (patientAction === "delete") {
        await deletePatientByFhirId(patient.fhir_id);
        logger.debug(`[FHIR SYNC][STOP] Patient deleted. Stopping sync.`);
        return;
    }

    if (patientAction === "update") {
        await updatePatient(fhirPatient!, { fhir_id: existingPatient?.fhir_id });
    }

    for (const { name, fetch, service } of resourcesToSync) {
        try {
            const patientFhirId = getPatientFhirIdByUseCase(name) ?? patient.fhir_id;
            const fhirItems = await fetch(patientFhirId, patient.id); // returns DbEntity[] | null
            if (!fhirItems) {
                logger.debug(`[FHIR SYNC][${name}] No FHIR data returned.`);
                continue;
            }

            for (const fhirItem of fhirItems) {
                if (!fhirItem || !fhirItem.fhir_id) {
                    logger.debug(`[FHIR SYNC][${name}] Skipping item without fhir_id`);
                    continue;
                }
                const existing = await service.getByFhirId(patient.id, fhirItem.fhir_id);
                const action = getSyncAction(fhirItem, !!existing);

                logger.debug(`[FHIR SYNC][${name}] Action: ${action}`);

                if (action === "delete") {
                    await service.deleteByFhirId({ patient_id: patient.id, fhir_id: fhirItem.fhir_id });
                } else if (action === "create") {
                    logger.debug('[FHIR SYNC][Allergy]', JSON.stringify({ ...fhirItem }));
                    await service.create(fhirItem);
                } else if (action === "update") {
                    await service.updateByFhirId(fhirItem, { patient_id: patient.id, fhir_id: fhirItem.fhir_id });
                }
            }
        } catch (err: any) {
            logger.debug(`[FHIR SYNC][${name}] Error: ${err.message}`);
        }
    }

    logger.debug(`[FHIR SYNC] Completed successfully for patient ${patient.id}`);
}
