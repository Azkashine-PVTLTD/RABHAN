import Joi from 'joi';
export declare class ValidationUtils {
    static readonly SAUDI_PHONE_REGEX: RegExp;
    static readonly INDIAN_PHONE_REGEX: RegExp;
    static readonly MULTI_COUNTRY_PHONE_REGEX: RegExp;
    static readonly SAUDI_NATIONAL_ID_REGEX: RegExp;
    static readonly EMAIL_REGEX: RegExp;
    static validateEmail(email: string): boolean;
    static validateSaudiPhone(phone: string): boolean;
    static validateMultiCountryPhone(phone: string): boolean;
    static validateSaudiNationalId(nationalId: string): boolean;
    static normalizeSaudiPhone(phone: string): string;
    static sanitizeInput(input: string): string;
    static isValidUUID(uuid: string): boolean;
}
export declare const transformFrontendData: (data: any) => any;
export declare const validationSchemas: {
    register: Joi.ObjectSchema<any>;
    contractorRegister: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
    refreshToken: Joi.ObjectSchema<any>;
    resetPassword: Joi.ObjectSchema<any>;
    confirmResetPassword: Joi.ObjectSchema<any>;
    changePassword: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=validation.utils.d.ts.map