const buildInviteEmailHtml = ({ inviteLink }) => `
  <p>Hello,</p>
  <p>Your account has been created by an administrator.</p>
  <p>Click the link below to set your password:</p>
  <p><a href="${inviteLink}">${inviteLink}</a></p>
  <p>This link expires in 24 hours.</p>
`;

module.exports = {
  buildInviteEmailHtml
};
