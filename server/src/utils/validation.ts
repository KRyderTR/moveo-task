export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

export function isValidPassword(password: string): boolean {
    return password.length >= 6;
}
