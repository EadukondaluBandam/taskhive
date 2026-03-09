const { StatusCodes } = require("http-status-codes");
const { ApiError } = require("../utils/ApiError");
const { ROLES } = require("../utils/roles");

const ROLE_RANK = {
  [ROLES.EMPLOYEE]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3
};

const assertAuthenticated = (req) => {
  if (!req.user) throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthenticated request");
};

const hasRoleOrHigher = (actorRole, requiredRole) => (ROLE_RANK[actorRole] || 0) >= (ROLE_RANK[requiredRole] || 0);

const requireRole = (requiredRole) => (req, _res, next) => {
  assertAuthenticated(req);

  if (!hasRoleOrHigher(req.user.role, requiredRole)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Insufficient permissions");
  }

  next();
};

const authorize = (...allowedRoles) => (req, _res, next) => {
  assertAuthenticated(req);

  // super_admin has full system access by default.
  if (req.user.role === ROLES.SUPER_ADMIN) return next();
  if (!allowedRoles.includes(req.user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Insufficient permissions");
  }

  next();
};

const requireOrganizationAccess = ({ organizationIdPath = "organizationId", allowSuperAdmin = true } = {}) => (req, _res, next) => {
  assertAuthenticated(req);

  if (allowSuperAdmin && req.user.role === ROLES.SUPER_ADMIN) return next();

  const targetOrganizationId =
    req.params?.[organizationIdPath] ||
    req.body?.organizationId ||
    req.query?.organizationId ||
    null;

  if (!targetOrganizationId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "organizationId is required for organization-scoped access");
  }

  if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only admins can access organization-scoped resources");
  }

  if (!req.user.organizationId || req.user.organizationId !== targetOrganizationId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Cross-organization access is not allowed");
  }

  next();
};

const requireSelfOrPrivileged = ({ userIdPath = "userId" } = {}) => (req, _res, next) => {
  assertAuthenticated(req);

  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(req.user.role)) return next();

  const targetUserId =
    req.params?.[userIdPath] ||
    req.body?.userId ||
    req.query?.userId ||
    null;

  if (!targetUserId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "userId is required for this action");
  }

  if (req.user.role === ROLES.EMPLOYEE && req.user.sub !== targetUserId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Employees can only access their own resources");
  }

  next();
};

const canAssignRole = (requestedRolePath = "role") => (req, _res, next) => {
  const requestedRole = req.body?.[requestedRolePath] || ROLES.EMPLOYEE;

  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE].includes(requestedRole)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid role");
  }

  // Unauthenticated self-registration must remain employee-only.
  if (!req.user) {
    if (requestedRole !== ROLES.EMPLOYEE) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Privileged role assignment requires authenticated admin");
    }
    return next();
  }

  if (req.user.role === ROLES.EMPLOYEE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Employees cannot assign roles");
  }

  if (requestedRole === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only super_admin can assign super_admin role");
  }

  if (requestedRole === ROLES.ADMIN && req.user.role === ROLES.ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Admin cannot assign admin role");
  }

  next();
};

module.exports = {
  requireRole,
  authorize,
  requireOrganizationAccess,
  requireSelfOrPrivileged,
  canAssignRole
};
