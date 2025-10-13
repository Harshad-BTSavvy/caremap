export interface Mapper<FhirType, DbType> {
    toDb(fhir: FhirType): Partial<DbType>;
    toFhir(db: DbType): Partial<FhirType>;
}