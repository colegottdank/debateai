export const MIGRATION_005_SQL = `
ALTER TABLE users ADD COLUMN current_period_end DATETIME;
ALTER TABLE users ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
`;
