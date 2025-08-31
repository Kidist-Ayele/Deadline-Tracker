-- Deadline Tracker Database Schema for MySQL
-- This file contains the SQL schema for the assignments table

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS deadline_tracker
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE deadline_tracker;

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_priority ON assignments(priority);

-- Add constraints
ALTER TABLE assignments ADD CONSTRAINT chk_priority 
    CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE assignments ADD CONSTRAINT chk_status 
    CHECK (status IN ('pending', 'in-progress', 'completed'));
