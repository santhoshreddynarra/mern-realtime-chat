import axios from "axios";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// ─── Global 401 Handler ───────────────────────────────────────────────────────
// Guards against duplicate toasts/redirects when multiple concurrent requests
// all receive 401 at the same time (e.g., on a page load with several API calls).
let isHandlingUnauthorized = false;

axiosInstance.interceptors.response.use(
  (response) => response, // pass through successful responses unchanged

  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';

    // Skip the interceptor for auth endpoints — login failures must reach the component
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/signup');

    if (status === 401 && !isAuthEndpoint && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;

      // Access Zustand store without importing it at module level (avoids circular deps)
      // Dynamic import is fine here because this only runs at runtime, not at module init.
      import('../store/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().setAuthUser(null);
        localStorage.removeItem('chat-user');

        // Also disconnect socket if one is active
        import('../store/useSocketStore').then(({ useSocketStore }) => {
          useSocketStore.getState().disconnectSocket();
        });

        toast.error('Your session has expired. Please log in again.');

        // Give the toast a moment to show before navigating
        setTimeout(() => {
          isHandlingUnauthorized = false;
          // Navigate to login without a full page reload so BrowserRouter stays intact
          window.location.replace('/login');
        }, 1500);
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;