import { ApiUtils } from "@/services/api/ApiUtils";
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";


export interface ApiOptions {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}

export const createApiService = ({
    baseURL,
    timeout = 10000,
    headers,
}: ApiOptions): AxiosInstance => {
    const instance = axios.create({ baseURL, timeout, headers });

    // Request Interceptor
    instance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            ApiUtils.log("→ Request", { url: config.url, method: config.method });
            return config;
        },
        (error: AxiosError) => Promise.reject(ApiUtils.normalizeError(error))
    );

    // Response Interceptor
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            ApiUtils.log("← Response", {
                url: response.config.url,
                status: response.status,
            });
            return response.data;
        },
        (error: AxiosError) => Promise.reject(ApiUtils.normalizeError(error))
    );

    return instance;
};