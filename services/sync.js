import { Alert } from "react-native";
import { HttpClient } from "@/classes/HttpClient";
import { dbService } from "./db";

export const syncOfflineData = async (onSyncStatusChange, jobIds = null) => {
    try {
        // Get all pending or failed items, or target specific IDs
        const pendingJobs = await dbService.getPendingUploads(jobIds);

        if (pendingJobs.length === 0) return;

        console.log(`[Sync] Found ${pendingJobs.length} offline uploads. Beginning sync...`);

        // Keep dynamic clients for different server URLs to avoid re-creation inside loop
        const clientCache = {};

        for (const job of pendingJobs) {
            try {
                // Update status to syncing
                await dbService.updatePendingUploadStatus(job.id, "syncing");
                if (onSyncStatusChange) onSyncStatusChange();

                // Retrieve or instantiate client for specific GP serverUrl
                if (!clientCache[job.server_url]) {
                    clientCache[job.server_url] = new HttpClient({ baseURL: job.server_url });
                    // Attach response unwrapper similar to useApi hook
                    clientCache[job.server_url].useResponseInterceptor((data) => data);
                }
                const apiClient = clientCache[job.server_url];

                const formData = new FormData();
                formData.append("homeImage", {
                    uri: job.local_image_uri,
                    name: job.file_name || "upload.jpg",
                    type: job.mime_type || "image/jpeg",
                });

                formData.append("id", job.dharak_id);
                formData.append("malmatta_number", job.malmatta_number || "");
                formData.append("home_image_upload_person_user_id", job.user_id || "");
                formData.append("home_image_upload_person_username", job.username || "");
                formData.append("home_image_latitude", job.latitude !== null ? job.latitude : "");
                formData.append("home_image_longitude", job.longitude !== null ? job.longitude : "");
                formData.append("home_image_accuracy", job.accuracy !== null ? job.accuracy : "");
                formData.append("home_image_altitude", job.altitude !== null ? job.altitude : "");
                formData.append(
                    "home_image_altitude_accuracy",
                    job.altitude_accuracy !== null ? job.altitude_accuracy : "",
                );
                formData.append("home_image_heading", job.heading !== null ? job.heading : "");
                formData.append("home_image_speed", job.speed !== null ? job.speed : "");
                formData.append("home_image_timestamp", job.timestamp || "");
                formData.append("home_image_location", job.location_geojson || "");

                const result = await apiClient.put("/form-8/update-home-image", formData);
                const success = result && (result.success || result.data?.success);
                const message = result?.message || result?.data?.message;

                if (
                    success ||
                    result === undefined ||
                    (result && typeof result === "object" && !("success" in result))
                ) {
                    // Mark job as completed instead of deleting to keep history
                    await dbService.updatePendingUploadStatus(job.id, "completed");

                    // Clear local temp preview in dharaks
                    await dbService.clearLocalImagePreview(job.dharak_id);
                    console.log(`[Sync] Successfully synced upload for Dharak ID: ${job.dharak_id}`);
                } else {
                    throw new Error(message || "Server rejected data");
                }
            } catch (error) {
                console.error(`[Sync] Sync failed for Job ${job.id}:`, error.message);
                await dbService.failPendingUpload(job.id, error.message);
            } finally {
                if (onSyncStatusChange) onSyncStatusChange();
            }
        }

        Alert.alert("Offline Sync", "All pending changes have been successfully uploaded to the server.");
    } catch (e) {
        console.error("[Sync] Synchronization manager encountered an error:", e);
    }
};
