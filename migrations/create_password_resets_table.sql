-- Create password_resets table for managing password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_username_resets ON password_resets(username);
CREATE INDEX IF NOT EXISTS idx_expires ON password_resets("expiresAt");
