export declare class PasswordUtils {
    private static readonly MIN_PASSWORD_LENGTH;
    private static readonly PASSWORD_REGEX;
    static hash(password: string): Promise<string>;
    static compare(password: string, hash: string): Promise<boolean>;
    static validate(password: string): {
        valid: boolean;
        errors: string[];
    };
    static generateSecureToken(length?: number): string;
    static checkPasswordStrength(password: string): {
        score: number;
        strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
        suggestions: string[];
    };
}
//# sourceMappingURL=password.utils.d.ts.map