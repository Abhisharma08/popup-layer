-- Add live-hardening tables and indexes.

CREATE TABLE "WorkspaceDomain" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceDomain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceDomain_workspaceId_domain_key" ON "WorkspaceDomain"("workspaceId", "domain");
CREATE INDEX "WorkspaceDomain_domain_idx" ON "WorkspaceDomain"("domain");

CREATE INDEX "Workspace_userId_idx" ON "Workspace"("userId");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX "Popup_workspaceId_idx" ON "Popup"("workspaceId");
CREATE INDEX "Popup_workspaceId_status_idx" ON "Popup"("workspaceId", "status");
CREATE INDEX "Lead_popupId_createdAt_idx" ON "Lead"("popupId", "createdAt");
CREATE INDEX "AnalyticsEvent_popupId_event_createdAt_idx" ON "AnalyticsEvent"("popupId", "event", "createdAt");
CREATE INDEX "AnalyticsEvent_popupId_createdAt_idx" ON "AnalyticsEvent"("popupId", "createdAt");

ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT "WorkspaceMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

ALTER TABLE "WorkspaceDomain"
  ADD CONSTRAINT "WorkspaceDomain_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
