-- Allow admins to explicitly choose what appears on the homepage.
ALTER TABLE "Article"
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT false;

-- Preserve current behavior for already published items after migration.
UPDATE "Article"
SET "showOnHomepage" = true
WHERE "status" = 'PUBLISHED';
