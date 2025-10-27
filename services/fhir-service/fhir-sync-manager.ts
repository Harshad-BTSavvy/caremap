import { useModel } from "@/services/database/BaseModel";
import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { SyncPatientDataModel } from "@/services/database/models/SyncPatientDataModel";
import { handleBackgroundFhirSync } from "@/services/fhir-service/fhir-sync-service";
import { logger } from "@/services/logging/logger";
import { FHIR_SYNC_FREQ } from "@/utils/config";

export const shouldSync = async (patientFhirId: string): Promise<boolean> => {

    let lastSyncedAt: any;

    if (!FHIR_SYNC_FREQ) return false; // manual-only mode

    const syncPatientDataModel = new SyncPatientDataModel();
    useModel(syncPatientDataModel, async (model) => {
        lastSyncedAt = await model.getFirstByFields({ patient_fhir_id: patientFhirId }).then((data: { last_synced_date: any; }) => data?.last_synced_date);
    });

    if (!lastSyncedAt) return true; // never synced before

    const diffSec = (Date.now() - new Date(lastSyncedAt).getTime()) / 1000;
    return diffSec >= FHIR_SYNC_FREQ;
};

export const updateSyncStatus = async (
    patientFhirId: string,
    status: boolean
): Promise<void> => {
    const syncPatientDataModel = new SyncPatientDataModel();
    
    await useModel(syncPatientDataModel, async (model) => {
        const existing = await model.getFirstByFields({ patient_fhir_id: patientFhirId });
        if (existing) {
            await model.updateByFields({
                last_synced_date: new Date().toISOString(),
                status: status ? 1 : 0,
                updated_date: new Date().toISOString(),
            }, {
                id: existing.id,
            });
        } else {
            await model.insert({
                patient_fhir_id: patientFhirId,
                last_synced_date: new Date().toISOString(),
                status: status ? 1 : 0,
                created_date: new Date().toISOString(),
                updated_date: new Date().toISOString()
            });
        }
    });
};


export const startFhirSync = (patient: DbPatient) => {
    const scheduleSync = async () => {
        try {
            const should = await shouldSync(patient.fhir_id);
            if (should) {
                await handleBackgroundFhirSync(patient);
                await updateSyncStatus(patient.fhir_id, true);
            }
        } catch (err) {
            logger.debug("FHIR sync error:", err);
        } finally {
            // Schedule the next run
            setTimeout(scheduleSync, FHIR_SYNC_FREQ! * 1000);
        }
    };

    // Start the first sync
    scheduleSync();
};



