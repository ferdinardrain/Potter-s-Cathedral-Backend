-- Database initialization script for Porters Church Management System
-- Database: porters_db

-- Create the members table
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  age INT,
  dob DATE,
  residence VARCHAR(255),
  gpsAddress VARCHAR(255),
  phoneNumber VARCHAR(20),
  altPhoneNumber VARCHAR(20),
  nationality VARCHAR(100),
  maritalStatus VARCHAR(50),
  joiningDate DATE,
  avatar VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance on common filters
CREATE INDEX idx_maritalStatus ON members(maritalStatus);
CREATE INDEX idx_age ON members(age);
CREATE INDEX idx_fullName ON members(fullName);

-- Optional: Insert sample data (uncomment if needed)
-- INSERT INTO members (fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar) VALUES
-- ('John Doe', 30, '1994-01-01', 'Accra', '5.6037,-0.1870', '+233123456789', '+233987654321', 'Ghanaian', 'Married', '2023-01-01', 'avatars/john.jpg');
