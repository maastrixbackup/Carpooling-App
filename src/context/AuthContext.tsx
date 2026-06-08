import { logger } from "@/lib/logger";
import {
    clearAccessToken,
    getAccessToken,
    saveAccessToken,
} from "@/lib/storage";
import { loginApi, logoutApi, meApi, signupApi } from "@/services/auth.service";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

type User = {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: number;
};

type LoginPayload = {
    email: string;
    password: string;
};

type SignupPayload = {
    name: string;
    phone: string;
    email: string;
    password: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    signup: (payload: SignupPayload) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    const bootstrap = async () => {
        try {
            const token = await getAccessToken();

            if (!token) {
                setUser(null);
                return;
            }

            const response = await meApi();
            setUser(response.data.user);
        } catch {
            await clearAccessToken();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        bootstrap();
    }, []);

    const login = async (payload: LoginPayload) => {
        const response = await loginApi(payload);
        logger.auth("LOGIN SUCCESS", response);
        await saveAccessToken(response.data.access_token);
        setUser(response.data.user);
    };

    const signup = async (payload: SignupPayload) => {
        const response = await signupApi(payload);

        await saveAccessToken(response.data.access_token);
        setUser(response.data.user);
    };

    const logout = async () => {
        try {
            await logoutApi();
        } catch { }

        await clearAccessToken();
        setUser(null);
    };

    const refreshUser = async () => {
        const response = await meApi();
        setUser(response.data.user);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                login,
                signup,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}