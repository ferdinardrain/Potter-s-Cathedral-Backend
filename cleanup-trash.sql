-- Clean up trash_members table to remove all duplicates
-- Run this manually in your database

-- First, let's see what's in trash
SELECT id, "fullName" FROM trash_members;

-- Delete everything from trash_members
DELETE FROM trash_members;

-- Verify it's empty
SELECT COUNT(*) FROM trash_members;
