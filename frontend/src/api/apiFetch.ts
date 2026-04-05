const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const apiFetch = async <T,>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> => {
  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errMessage = "Something went wrong";
      try {
        const errorData = await res.json();
        errMessage = errorData.error || errMessage;
      } catch {
        // use default
      }
      throw new Error(errMessage);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return await res.json() as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Something went wrong");
  }
};