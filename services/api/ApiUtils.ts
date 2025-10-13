import { DEBUG_ON } from "@/utils/config";

export const ApiUtils = {
    log: (msg: string, data?: any) => {
        if (DEBUG_ON) console.log(`[API] ${msg}`, data ?? "");
    },

    normalizeError: (error: any) => {
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error.message || "Unknown error";
        return { success: false, status, message };
    },
};