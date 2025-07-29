"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.AuthProvider = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["CONTRACTOR"] = "CONTRACTOR";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["EMAIL"] = "EMAIL";
    AuthProvider["NAFATH"] = "NAFATH";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "PENDING";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["LOCKED"] = "LOCKED";
    UserStatus["DELETED"] = "DELETED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
//# sourceMappingURL=auth.types.js.map