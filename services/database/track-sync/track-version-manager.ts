import { useDB } from "@/services/database/db";
import { TrackConfigVersion } from "@/services/database/migrations/v1/schema_v1";


export async function getStoredVersion(module: string): Promise<number> {
    return useDB(async (db) => {
        const res = await db.getFirstAsync<TrackConfigVersion>(
            `SELECT version FROM TRACK_CONFIG_VERSION WHERE module = ?;`,
            [module]
        );
        return res?.version ?? 0;
    });
}

export async function updateStoredVersion(
    module: string,
    version: number
): Promise<void> {
    await useDB(async (db) => {
        await db.runAsync(
            `INSERT INTO TRACK_CONFIG_VERSION (module, version, last_synced_date)
       VALUES (?, ?, ?)
       ON CONFLICT(module) DO UPDATE SET version = excluded.version, last_synced_date = excluded.last_synced_date;`,
            [module, version, new Date().toISOString()]
        );
    });
}

export async function shouldSync(
    module: string,
    configVersion: number
): Promise<boolean> {
    const storedVersion = await getStoredVersion(module);
    return storedVersion < configVersion;
}
