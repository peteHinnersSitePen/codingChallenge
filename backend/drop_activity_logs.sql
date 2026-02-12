-- Drop activity_logs table to fix enum constraint issue
-- Run this in H2 Console: http://localhost:8080/h2-console
-- JDBC URL: jdbc:h2:file:./data/issuetracker
-- Username: sa
-- Password: (empty)

DROP TABLE IF EXISTS activity_logs;
