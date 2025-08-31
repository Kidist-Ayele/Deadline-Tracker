-- Deadline Tracker Seed Data for MySQL
-- This file contains sample data for testing the application

USE deadline_tracker;

INSERT INTO assignments (title, description, due_date, priority, status) VALUES
(
    'Complete Project Proposal',
    'Write and submit the final project proposal for the web development course. Include all required sections and appendices.',
    '2024-01-15 17:00:00',
    'high',
    'pending'
),
(
    'Review Code Documentation',
    'Go through the existing codebase and update documentation for all major functions and classes.',
    '2024-01-20 14:00:00',
    'medium',
    'in-progress'
),
(
    'Prepare Presentation Slides',
    'Create presentation slides for the upcoming team meeting about project progress and next steps.',
    '2024-01-18 10:00:00',
    'medium',
    'pending'
),
(
    'Fix Bug in Login System',
    'Investigate and fix the authentication bug that prevents users from logging in with special characters in passwords.',
    '2024-01-16 16:00:00',
    'high',
    'in-progress'
),
(
    'Update Portfolio Website',
    'Add new projects and update the personal portfolio website with recent work and achievements.',
    '2024-01-25 12:00:00',
    'low',
    'pending'
),
(
    'Complete Online Course Module',
    'Finish the current module of the JavaScript advanced concepts course and submit the final assignment.',
    '2024-01-22 23:59:00',
    'medium',
    'pending'
),
(
    'Backup Database',
    'Create a complete backup of the production database and verify the backup integrity.',
    '2024-01-17 02:00:00',
    'high',
    'completed'
),
(
    'Write Blog Post',
    'Write a technical blog post about the latest features implemented in the application.',
    '2024-01-30 18:00:00',
    'low',
    'pending'
);
