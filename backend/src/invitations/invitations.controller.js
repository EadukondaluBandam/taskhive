const { StatusCodes } = require("http-status-codes");
const service = require("./invitations.service");

const sendInvitation = async (req, res) => {
  await service.sendInvitation(req.validated.body, req.user);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Invitation email sent successfully",
    data: {}
  });
};

const acceptInvitation = async (req, res) => {
  const data = await service.acceptInvitation(req.validated.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Invitation accepted successfully",
    data
  });
};

module.exports = {
  sendInvitation,
  acceptInvitation
};
