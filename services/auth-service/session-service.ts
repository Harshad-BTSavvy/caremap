import { FhirService } from "@/services/core/FhirService";
import { createPatient, getPatient, getPatientByUserId } from "@/services/core/PatientService";
import { createUser, isExistingUser } from "@/services/core/UserService";
import { Patient, User } from "@/services/database/migrations/v1/schema_v1";
import { PATIENT_ID } from "@/services/fhir-service/fhir-config";


export async function syncPatientSession(user: User): Promise<Patient> {
    if (!user?.id) {
        throw new Error("User session missing");
    }

    // Pull FHIR Patient Data
    const fhirPatientData = await FhirService.getPatient(PATIENT_ID.toString());
    console.log("FHIR Patient: ", JSON.stringify(fhirPatientData));
    fhirPatientData.user_id = user.id;

    // Storing user in DB if not already exists
    const existingUser = await isExistingUser(user.id);
    if (!existingUser) {
        await createUser(user);
    }

    // Get patient by user_id
    const existingPatient = await getPatientByUserId(user.id);
    if (existingPatient) {
        // Get patient by patient id
        const fullPatient = await getPatient(existingPatient.id);
        if (!fullPatient) throw new Error("Patient fetch failed.");
        return fullPatient;
    }

    let newPatient = await createPatient(fhirPatientData);

    if (!newPatient) throw new Error("Patient creation failed.");

    return newPatient;
}
