import { createApiService } from "@/services/api/ApiService";
import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { FHIR_CONFIG } from "@/services/fhir-service/fhir-config";
import { FhirPatientMapper } from "@/services/fhir-service/mappers/PatientFhirMapper";
import { Patient as FhirPatient } from "@/services/fhir-service/resources/types/hl7-fhir-r4-core/Patient";

const api = createApiService({
    baseURL: FHIR_CONFIG.BASE_URL,
    timeout: FHIR_CONFIG.TIMEOUT,
});

export const FhirService = {
    getPatient: async (patientId: string): Promise<Partial<DbPatient>> => {
        const response = await api.get(`/Patient/${patientId}?_format=json`);
        // Map to Patient (FHIR) type
        const dbPatient = FhirPatientMapper.toDb(response as FhirPatient);
        return dbPatient;
    },

    getEverything: async (patientId: string) => {
        return api.get(`/Patient/${patientId}/$everything?_format=json`);
    },
};