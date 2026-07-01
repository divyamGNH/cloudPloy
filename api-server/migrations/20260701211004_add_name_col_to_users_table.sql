-- migrate:up
ALTER TABLE users
ADD COLUMN name TEXT NOT NULL DEFAULT '';

-- migrate:down
ALTER TABLE users
DROP COLUMN name;