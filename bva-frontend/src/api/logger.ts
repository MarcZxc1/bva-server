/* eslint-disable @typescript-eslint/no-explicit-any */

export const apiLogger = {
  request: (method: string, url: string, data?: any) => {
    console.log(
      `%c🚀 [API] ${method.toUpperCase()} ${url}`,
      "color: #3b82f6; font-weight: bold;",
      data ? `\nPayload:` : "",
      data || ""
    );
  },

  response: (status: number, url: string, duration: number) => {
    const color = status >= 200 && status < 300 ? "#22c55e" : "#eab308";
    console.log(
      `%c✅ [API] ${status} OK - ${url}`,
      `color: ${color}; font-weight: bold;`,
      `- Time: ${duration}ms`
    );
  },

  error: (status: number, url: string, message: string) => {
    console.log(
      `%c❌ [API] ${status} Error - ${url}`,
      "color: #ef4444; font-weight: bold;",
      `\nMessage: ${message}`
    );
  },
};
