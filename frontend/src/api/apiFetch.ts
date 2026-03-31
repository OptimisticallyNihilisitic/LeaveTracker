const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const apiFetch = async (
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${BASE_URL}${path}`;

  console.log("API CALL:", url);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });

    console.log("RESPONSE STATUS:", res.status);

    // Handle empty response safely
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      console.error("API ERROR RESPONSE:", data);
      throw new Error(data?.error ?? "Something went wrong");
    }

    return data;
  } catch (err: any) {
    // 🚨 This will catch your current error
    console.error("FETCH FAILED:", err.message);

    throw new Error(
      err.message === "Failed to fetch"
        ? "Cannot reach backend. Check API URL or server."
        : err.message
    );
  }
};