import { User } from "@shared/schema";

export const AUTH_STORAGE_KEY = "cms_user";

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

export function isOperator(user: User | null): boolean {
  return user?.role === "operator";
}
