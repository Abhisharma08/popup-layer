const test = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../src/lib/prisma');
const {
  getAccessibleWorkspace,
  getAccessiblePopup,
  requireWorkspaceAdmin,
} = require('../src/lib/authz');

const originalWorkspaceFindFirst = prisma.workspace.findFirst;
const originalPopupFindFirst = prisma.popup.findFirst;
const originalMemberFindUnique = prisma.workspaceMember.findUnique;

test.afterEach(() => {
  prisma.workspace.findFirst = originalWorkspaceFindFirst;
  prisma.popup.findFirst = originalPopupFindFirst;
  prisma.workspaceMember.findUnique = originalMemberFindUnique;
});

test('getAccessibleWorkspace returns workspace when Prisma finds one', async () => {
  prisma.workspace.findFirst = async ({ where }) => ({ id: where.id, userId: 'user-1' });

  const workspace = await getAccessibleWorkspace('user-1', 'workspace-1');
  assert.equal(workspace.id, 'workspace-1');
});

test('getAccessibleWorkspace rejects inaccessible workspace', async () => {
  prisma.workspace.findFirst = async () => null;

  await assert.rejects(
    () => getAccessibleWorkspace('user-1', 'workspace-2'),
    error => error.status === 403 && /access/.test(error.message)
  );
});

test('getAccessiblePopup rejects inaccessible popup', async () => {
  prisma.popup.findFirst = async () => null;

  await assert.rejects(
    () => getAccessiblePopup('user-1', 'popup-1'),
    error => error.status === 403 && /access/.test(error.message)
  );
});

test('requireWorkspaceAdmin allows owner and admin member', async () => {
  prisma.workspace.findFirst = async () => ({ id: 'workspace-1', userId: 'owner-1' });

  const ownerWorkspace = await requireWorkspaceAdmin('owner-1', 'workspace-1');
  assert.equal(ownerWorkspace.id, 'workspace-1');

  prisma.workspace.findFirst = async () => ({ id: 'workspace-1', userId: 'owner-1' });
  prisma.workspaceMember.findUnique = async () => ({ role: 'ADMIN' });

  const adminWorkspace = await requireWorkspaceAdmin('user-2', 'workspace-1');
  assert.equal(adminWorkspace.id, 'workspace-1');
});

test('requireWorkspaceAdmin rejects non-admin member', async () => {
  prisma.workspace.findFirst = async () => ({ id: 'workspace-1', userId: 'owner-1' });
  prisma.workspaceMember.findUnique = async () => ({ role: 'MEMBER' });

  await assert.rejects(
    () => requireWorkspaceAdmin('user-2', 'workspace-1'),
    error => error.status === 403 && /admin/.test(error.message)
  );
});
