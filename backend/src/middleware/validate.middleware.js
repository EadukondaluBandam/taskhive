const { StatusCodes } = require("http-status-codes");
const { ApiError } = require("../utils/ApiError");

const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message
    }));
    throw new ApiError(StatusCodes.BAD_REQUEST, "Validation error", issues);
  }

  req.validated = parsed.data;
  next();
};

module.exports = {
  validate
};
