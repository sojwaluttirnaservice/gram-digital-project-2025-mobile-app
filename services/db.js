import * as SQLite from "expo-sqlite";

class DatabaseService {
    constructor() {
        // Open the database synchronously
        this.db = SQLite.openDatabaseSync("gdp_offline.db");
    }

    async initDb() {
        const { user_version } = await this.db.getFirstAsync("PRAGMA user_version");
        let currentDbVersion = user_version || 0;

        if (currentDbVersion < 1) {
            // Version 1: Initial schema with properly versioned structure and timestamps
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS dharaks (
                    id INTEGER PRIMARY KEY,
                    server_url TEXT NOT NULL,
                    feu_malmattaNo TEXT,
                    feu_ownerName TEXT,
                    feu_secondOwnerName TEXT,
                    feu_homeNo TEXT,
                    feu_wardNo TEXT,
                    feu_mobileNo TEXT,
                    feu_aadharNo TEXT,
                    feu_gharkulYojna TEXT,
                    feu_havingToilet TEXT,
                    feu_gramPanchayet TEXT,
                    feu_villageName TEXT,
                    feu_areaHeight TEXT,
                    feu_areaWidth TEXT,
                    feu_totalArea TEXT,
                    feu_totalAreaSquareMeter TEXT,
                    feu_eastLandmark TEXT,
                    feu_westLandmark TEXT,
                    feu_northLandmark TEXT,
                    feu_southLandmark TEXT,
                    feu_bojaShera TEXT,
                    feu_image TEXT,
                    local_image_uri TEXT,
                    home_image_latitude REAL,
                    home_image_longitude REAL,
                    last_cached_at INTEGER,
                    created_at INTEGER,
                    updated_at INTEGER
                );
            `);

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS pending_uploads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    server_url TEXT NOT NULL,
                    dharak_id INTEGER NOT NULL,
                    malmatta_number TEXT,
                    user_id TEXT,
                    username TEXT,
                    local_image_uri TEXT NOT NULL,
                    mime_type TEXT,
                    file_name TEXT,
                    latitude REAL,
                    longitude REAL,
                    accuracy REAL,
                    altitude REAL,
                    altitude_accuracy REAL,
                    heading REAL,
                    speed REAL,
                    timestamp TEXT,
                    location_geojson TEXT,
                    created_at INTEGER,
                    updated_at INTEGER,
                    status TEXT DEFAULT 'pending',
                    attempts INTEGER DEFAULT 0,
                    error_message TEXT
                );
            `);

            await this.db.execAsync("PRAGMA user_version = 1");
        }
    }

    // --- Cache Actions ---
    async cacheDharak(serverUrl, data) {
        const timestamp = Date.now();
        await this.db.runAsync(
            `INSERT OR REPLACE INTO dharaks (
                id, server_url, feu_malmattaNo, feu_ownerName, feu_secondOwnerName, feu_homeNo, 
                feu_wardNo, feu_mobileNo, feu_aadharNo, feu_gharkulYojna, feu_havingToilet, 
                feu_gramPanchayet, feu_villageName, feu_areaHeight, feu_areaWidth, feu_totalArea, 
                feu_totalAreaSquareMeter, feu_eastLandmark, feu_westLandmark, feu_northLandmark, 
                feu_southLandmark, feu_bojaShera, feu_image, home_image_latitude, home_image_longitude, last_cached_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                      COALESCE((SELECT created_at FROM dharaks WHERE id = ?), ?), ?)`,
            [
                data.id,
                serverUrl,
                data.feu_malmattaNo || "",
                data.feu_ownerName || "",
                data.feu_secondOwnerName || "",
                data.feu_homeNo || "",
                data.feu_wardNo || "",
                data.feu_mobileNo || "",
                data.feu_aadharNo || "",
                data.feu_gharkulYojna || "",
                data.feu_havingToilet || "",
                data.feu_gramPanchayet || "",
                data.feu_villageName || "",
                data.feu_areaHeight || "",
                data.feu_areaWidth || "",
                data.feu_totalArea || "",
                data.feu_totalAreaSquareMeter || "",
                data.feu_eastLandmark || "",
                data.feu_westLandmark || "",
                data.feu_northLandmark || "",
                data.feu_southLandmark || "",
                data.feu_bojaShera || "",
                data.feu_image || "",
                data.home_image_latitude || null,
                data.home_image_longitude || null,
                timestamp,
                data.id,
                timestamp,
                timestamp,
            ],
        );
    }

    // --- Bulk Insert / Paginated Sync ---
    async bulkInsertDharaks(serverUrl, dharaksArray) {
        if (!serverUrl || !dharaksArray || dharaksArray.length === 0) return;
        const timestamp = Date.now();

        // Use a transaction for high-speed batch inserting
        await this.db.withTransactionAsync(async () => {
            const statement = await this.db.prepareAsync(`
                INSERT OR REPLACE INTO dharaks (
                    id, server_url, feu_malmattaNo, feu_ownerName, feu_secondOwnerName, feu_homeNo, 
                    feu_wardNo, feu_mobileNo, feu_aadharNo, feu_gharkulYojna, feu_havingToilet, 
                    feu_gramPanchayet, feu_villageName, feu_areaHeight, feu_areaWidth, feu_totalArea, 
                    feu_totalAreaSquareMeter, feu_eastLandmark, feu_westLandmark, feu_northLandmark, 
                    feu_southLandmark, feu_bojaShera, feu_image, home_image_latitude, home_image_longitude, last_cached_at,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                          COALESCE((SELECT created_at FROM dharaks WHERE id = ?), ?), ?)
            `);

            for (const data of dharaksArray) {
                await statement.executeAsync([
                    data.id,
                    serverUrl,
                    data.feu_malmattaNo || "",
                    data.feu_ownerName || "",
                    data.feu_secondOwnerName || "",
                    data.feu_homeNo || "",
                    data.feu_wardNo || "",
                    data.feu_mobileNo || "",
                    data.feu_aadharNo || "",
                    data.feu_gharkulYojna || "",
                    data.feu_havingToilet || "",
                    data.feu_gramPanchayet || "",
                    data.feu_villageName || "",
                    data.feu_areaHeight || "",
                    data.feu_areaWidth || "",
                    data.feu_totalArea || "",
                    data.feu_totalAreaSquareMeter || "",
                    data.feu_eastLandmark || "",
                    data.feu_westLandmark || "",
                    data.feu_northLandmark || "",
                    data.feu_southLandmark || "",
                    data.feu_bojaShera || "",
                    data.feu_image || "",
                    data.home_image_latitude || null,
                    data.home_image_longitude || null,
                    timestamp,
                    data.id,
                    timestamp,
                    timestamp,
                ]);
            }
            await statement.finalizeAsync();
        });
    }

    // Search local cache based on parameters for the current server context
    async searchLocalDharaks(serverUrl, query, searchType) {
        if (!serverUrl) return [];
        let sql = "";
        let params = [];

        // searchType: "1" = Owner name, "2" = Malmatta no, "3" = Second Owner
        if (searchType === "1") {
            sql = "SELECT id, feu_malmattaNo, feu_ownerName, feu_secondOwnerName FROM dharaks WHERE server_url = ? AND feu_ownerName LIKE ?";
            params = [serverUrl, `%${query}%`];
        } else if (searchType === "3") {
            sql =
                "SELECT id, feu_malmattaNo, feu_ownerName, feu_secondOwnerName FROM dharaks WHERE server_url = ? AND feu_secondOwnerName LIKE ?";
            params = [serverUrl, `%${query}%`];
        } else {
            sql =
                "SELECT id, feu_malmattaNo, feu_ownerName, feu_secondOwnerName FROM dharaks WHERE server_url = ? AND feu_malmattaNo LIKE ?";
            params = [serverUrl, `%${query}%`];
        }

        const results = await this.db.getAllAsync(sql, params);
        return results.map((item) => {
            let labelText = item.feu_malmattaNo;
            if (searchType === "1") {
                labelText = item.feu_ownerName;
            } else if (searchType === "3") {
                labelText = item.feu_secondOwnerName || item.feu_ownerName;
            }

            return {
                id: item.id,
                feu_malmattaNo: item.feu_malmattaNo,
                feu_ownerName: item.feu_ownerName,
                label: String(labelText),
            };
        });
    }

    async getLocalDharakDetails(id) {
        return await this.db.getFirstAsync("SELECT * FROM dharaks WHERE id = ?", [id]);
    }

    async getAllLocalDharaks(serverUrl, limit = 100, offset = 0) {
        if (!serverUrl) return [];
        return await this.db.getAllAsync("SELECT id, feu_malmattaNo, feu_ownerName FROM dharaks WHERE server_url = ? ORDER BY feu_malmattaNo ASC LIMIT ? OFFSET ?", [serverUrl, limit, offset]);
    }

    async getLocalDharaksCount(serverUrl) {
        if (!serverUrl) return 0;
        const result = await this.db.getFirstAsync("SELECT COUNT(*) as count FROM dharaks WHERE server_url = ?", [serverUrl]);
        return result ? result.count : 0;
    }

    async wipeOfflineData(serverUrl) {
        if (!serverUrl) return;
        await this.db.runAsync("DELETE FROM dharaks WHERE server_url = ?", [serverUrl]);
    }

    // --- Upload Queue Actions ---
    async queueOfflineUpload(serverUrl, dharakId, metadata) {
        if (!serverUrl || !dharakId) return;
        const timestamp = Date.now();
        await this.db.runAsync(
            `INSERT INTO pending_uploads (
                server_url, dharak_id, malmatta_number, user_id, username, local_image_uri, 
                mime_type, file_name, latitude, longitude, accuracy, altitude, 
                altitude_accuracy, heading, speed, timestamp, location_geojson, created_at, updated_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                serverUrl,
                dharakId,
                metadata.malmatta_number || "",
                metadata.user_id || "",
                metadata.username || "",
                metadata.local_image_uri,
                metadata.mime_type || "image/jpeg",
                metadata.file_name || "upload.jpg",
                metadata.latitude || null,
                metadata.longitude || null,
                metadata.accuracy || null,
                metadata.altitude || null,
                metadata.altitude_accuracy || null,
                metadata.heading || null,
                metadata.speed || null,
                metadata.timestamp || "",
                metadata.location_geojson || "",
                timestamp,
                timestamp,
            ],
        );

        // Update local cache preview image/location as well
        await this.db.runAsync(
            "UPDATE dharaks SET local_image_uri = ?, home_image_latitude = ?, home_image_longitude = ? WHERE id = ?",
            [metadata.local_image_uri, metadata.latitude || null, metadata.longitude || null, dharakId],
        );
    }

    async getPendingUploadsCount() {
        const result = await this.db.getFirstAsync(
            "SELECT COUNT(*) as count FROM pending_uploads WHERE (status = 'pending' OR status = 'failed') AND attempts < 5",
        );
        return result ? result.count : 0;
    }

    async getPendingUploads(jobIds = null) {
        // Sequential slow queue is enforced by sync.js (using async/await in a for-loop).
        // Dead-letter logic: Only fetch jobs with less than 5 attempts.
        // If attempts reach 5, the job stays in the database as a "dead letter" but won't be fetched or retried.
        if (jobIds && jobIds.length > 0) {
            const placeholders = jobIds.map(() => "?").join(",");
            return await this.db.getAllAsync(
                `SELECT * FROM pending_uploads WHERE id IN (${placeholders}) ORDER BY created_at ASC`,
                jobIds,
            );
        }
        return await this.db.getAllAsync(
            "SELECT * FROM pending_uploads WHERE (status = 'pending' OR status = 'failed') AND attempts < 5 ORDER BY created_at ASC",
        );
    }

    async updatePendingUploadStatus(id, status) {
        await this.db.runAsync("UPDATE pending_uploads SET status = ?, updated_at = ? WHERE id = ?", [
            status,
            Date.now(),
            id,
        ]);
    }

    async deletePendingUpload(id) {
        await this.db.runAsync("DELETE FROM pending_uploads WHERE id = ?", [id]);
    }

    async clearLocalImagePreview(dharakId) {
        await this.db.runAsync("UPDATE dharaks SET local_image_uri = NULL, updated_at = ? WHERE id = ?", [
            Date.now(),
            dharakId,
        ]);
    }

    async failPendingUpload(id, errorMessage) {
        await this.db.runAsync(
            "UPDATE pending_uploads SET status = 'failed', attempts = attempts + 1, error_message = ?, updated_at = ? WHERE id = ?",
            [errorMessage, Date.now(), id],
        );
    }
}

export const dbService = new DatabaseService();
