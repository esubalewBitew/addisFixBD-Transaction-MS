import axios, { AxiosResponse, AxiosError } from "axios";

const makeRequest = async (
  baseURL: string,
  url: string,
  method: "get" | "post" | "put" | "delete",
  data?: any,
  authToken?: string,
  apiKey?: string,
  serviceName?: string
): Promise<AxiosResponse | undefined> => {
  try {
    console.log(".... axios starting ....");
    const axiosInstance = axios.create({
      baseURL: baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    if (serviceName) {
      headers["service-name"] = serviceName;
    }
    console.log("... before axios happening ...");

    const response = await axiosInstance({
      method,
      url,
      data,
      headers,
    });

    console.log("Response in the axios service", response.data);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error in making request:", error.message);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error response headers:", error.response?.headers);
    } else {
      console.error("Unexpected error:", error);
    }
    return undefined; // Indicate an error occurred
  }
};

export default makeRequest;
