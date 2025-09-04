-- Criminal Management System Database Schema
-- This file provides the PostgreSQL schema for reference
-- The application currently uses in-memory storage but can be migrated to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication and role management
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
    name TEXT NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Criminal records table
CREATE TABLE criminal_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age <= 150),
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    crime_type TEXT NOT NULL,
    fir_number TEXT,
    case_status TEXT NOT NULL DEFAULT 'open' CHECK (case_status IN ('open', 'pending', 'closed')),
    arrest_date TIMESTAMP,
    address TEXT,
    photo TEXT, -- Base64 encoded photo data
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- FIR (First Information Report) records table
CREATE TABLE fir_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    fir_number TEXT NOT NULL UNIQUE,
    criminal_id VARCHAR REFERENCES criminal_records(id) ON DELETE SET NULL,
    fir_date TIMESTAMP NOT NULL DEFAULT now(),
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for better query performance
CREATE INDEX idx_criminal_records_name ON criminal_records(name);
CREATE INDEX idx_criminal_records_crime_type ON criminal_records(crime_type);
CREATE INDEX idx_criminal_records_case_status ON criminal_records(case_status);
CREATE INDEX idx_criminal_records_fir_number ON criminal_records(fir_number);
CREATE INDEX idx_fir_records_fir_number ON fir_records(fir_number);
CREATE INDEX idx_fir_records_criminal_id ON fir_records(criminal_id);
CREATE INDEX idx_fir_records_fir_date ON fir_records(fir_date);
CREATE INDEX idx_users_username ON users(username);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update timestamps
CREATE TRIGGER update_criminal_records_updated_at 
    BEFORE UPDATE ON criminal_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fir_records_updated_at 
    BEFORE UPDATE ON fir_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin and operator users
-- Note: Passwords should be hashed using bcrypt in the application
INSERT INTO users (username, password, role, name, is_active) VALUES
('admin', '$2b$10$hashedpassword1', 'admin', 'System Administrator', true),
('operator', '$2b$10$hashedpassword2', 'operator', 'System Operator', true);

-- Sample criminal records (optional - for testing)
INSERT INTO criminal_records (name, age, gender, crime_type, fir_number, case_status, address) VALUES
('John Doe', 30, 'male', 'theft', 'FIR-2024-001001', 'pending', '123 Main Street, City'),
('Jane Smith', 25, 'female', 'fraud', 'FIR-2024-001002', 'open', '456 Oak Avenue, City'),
('Robert Johnson', 35, 'male', 'assault', 'FIR-2024-001003', 'closed', '789 Pine Road, City');

-- Sample FIR records (optional - for testing)
INSERT INTO fir_records (fir_number, criminal_id, description) VALUES
('FIR-2024-001001', (SELECT id FROM criminal_records WHERE name = 'John Doe'), 'Theft of electronic devices from residential area'),
('FIR-2024-001002', (SELECT id FROM criminal_records WHERE name = 'Jane Smith'), 'Financial fraud involving fake documents'),
('FIR-2024-001003', (SELECT id FROM criminal_records WHERE name = 'Robert Johnson'), 'Physical assault during domestic dispute');

-- Views for reporting and analytics
CREATE VIEW criminal_statistics AS
SELECT 
    crime_type,
    case_status,
    COUNT(*) as count,
    AVG(age) as average_age
FROM criminal_records
GROUP BY crime_type, case_status;

CREATE VIEW monthly_crime_trends AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    crime_type,
    COUNT(*) as cases
FROM criminal_records
GROUP BY DATE_TRUNC('month', created_at), crime_type
ORDER BY month DESC;

-- Security: Row Level Security (RLS) policies
ALTER TABLE criminal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fir_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data unless they are admin
CREATE POLICY user_access_policy ON users
    FOR ALL TO authenticated_users
    USING (id = current_user_id() OR is_admin(current_user_id()));

-- Function to check if current user is admin (to be implemented based on auth system)
CREATE OR REPLACE FUNCTION is_admin(user_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID (to be implemented based on auth system)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS VARCHAR AS $$
BEGIN
    -- This should return the authenticated user's ID
    -- Implementation depends on your authentication system
    RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql;

-- Backup and maintenance procedures
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
    -- Archive or delete records older than 7 years
    DELETE FROM criminal_records 
    WHERE created_at < now() - interval '7 years'
    AND case_status = 'closed';
    
    -- Clean up orphaned FIR records
    DELETE FROM fir_records 
    WHERE criminal_id IS NOT NULL 
    AND criminal_id NOT IN (SELECT id FROM criminal_records);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE criminal_records IS 'Criminal database with personal information and case details';
COMMENT ON TABLE fir_records IS 'First Information Reports linked to criminal records';

COMMENT ON COLUMN users.role IS 'User role: admin (full access) or operator (limited access)';
COMMENT ON COLUMN criminal_records.photo IS 'Base64 encoded criminal mugshot photo';
COMMENT ON COLUMN criminal_records.case_status IS 'Current status of the criminal case';
COMMENT ON COLUMN fir_records.fir_number IS 'Unique FIR identification number';

-- Grant permissions (adjust based on your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cms_admin;
-- GRANT SELECT, INSERT, UPDATE ON criminal_records TO cms_operator;
-- GRANT SELECT, INSERT, UPDATE ON fir_records TO cms_operator;
-- GRANT SELECT ON users TO cms_operator;
