import { Patient as DbPatient } from "@/services/database/migrations/v1/schema_v1";
import { Mapper } from "@/services/fhir-service/mappers/FhirMapper";
import { Patient as FhirPatient } from "@/services/fhir-service/resources/types/hl7-fhir-r4-core/Patient";

export const FhirPatientMapper: Mapper<FhirPatient, DbPatient> = {
    toDb: (fhir: FhirPatient): Partial<DbPatient> => {
        if (!fhir) return {};

        const nameObj = fhir.name?.[0] || {};

        return {
            id: Number(fhir.id) || 0,
            first_name: nameObj.given?.[0] || "",
            middle_name: nameObj.given?.[1] || undefined,
            last_name: nameObj.family || "",
            gender: fhir.gender || undefined,
            date_of_birth: fhir.birthDate ? new Date(fhir.birthDate) : undefined,
        };
    },

    toFhir: (db: DbPatient): Partial<FhirPatient> => {
        return {
            id: String(db.id),
            name: [
                {
                    given: db.middle_name ? [db.first_name, db.middle_name] : [db.first_name],
                    family: db.last_name,
                },
            ],
            gender: db.gender as "male" | "female" | "other" | "unknown" | undefined,
            birthDate: db.date_of_birth?.toISOString().split("T")[0],
        };
    },
};
