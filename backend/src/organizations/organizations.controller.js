const { StatusCodes } = require("http-status-codes");
const service = require("./organizations.service");

const createOrganization = async (req, res) => {
  const org = await service.createOrganization(req.validated.body.name);
  res.status(StatusCodes.CREATED).json({ success: true, data: org });
};

const listOrganizations = async (_req, res) => {
  const orgs = await service.listOrganizations();
  res.status(StatusCodes.OK).json({ success: true, data: orgs });
};

module.exports = {
  createOrganization,
  listOrganizations
};
