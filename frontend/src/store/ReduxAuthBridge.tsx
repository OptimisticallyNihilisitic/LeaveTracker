import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppDispatch } from "./hooks";
import { setAuth } from "./authSlice";
import type { AuthUser } from "./authSlice";

/**
 * Renders nothing but watches AuthContext and syncs its state into the Redux
 * auth slice so that all parts of the app can read user/token from the store.
 * Must be rendered inside <AuthProvider>.
 */
export default function ReduxAuthBridge() {
  const { user, token, loading } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      setAuth({
        user: user as AuthUser | null,
        token,
        loading,
      })
    );
  }, [user, token, loading, dispatch]);

  return null;
}
