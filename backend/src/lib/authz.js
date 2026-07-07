const prisma = require('./prisma');
const { forbidden, notFound } = require('./http');

async function getAccessibleWorkspace(userId, workspaceId) {
  if (!workspaceId) throw notFound('Workspace not found');

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { userId },
        { members: { some: { userId } } },
      ],
    },
  });

  if (!workspace) throw forbidden('You do not have access to this workspace');
  return workspace;
}

async function getAccessiblePopup(userId, popupId) {
  if (!popupId) throw notFound('Popup not found');

  const popup = await prisma.popup.findFirst({
    where: {
      id: popupId,
      workspace: {
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
    },
  });

  if (!popup) throw forbidden('You do not have access to this popup');
  return popup;
}

async function requireWorkspaceAdmin(userId, workspaceId) {
  const workspace = await getAccessibleWorkspace(userId, workspaceId);
  if (workspace.userId === userId) return workspace;

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member || member.role !== 'ADMIN') {
    throw forbidden('Workspace admin access required');
  }
  return workspace;
}

async function requirePopupAdmin(userId, popupId) {
  const popup = await getAccessiblePopup(userId, popupId);
  await requireWorkspaceAdmin(userId, popup.workspaceId);
  return popup;
}

module.exports = {
  getAccessibleWorkspace,
  getAccessiblePopup,
  requireWorkspaceAdmin,
  requirePopupAdmin,
};
