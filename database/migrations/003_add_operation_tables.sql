-- Create survey reminders table
CREATE TABLE IF NOT EXISTS survey_reminders (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly')),
    schedule_time VARCHAR(10) NOT NULL, -- Time in HH:MM format
    message TEXT NOT NULL,
    target_groups JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_survey_reminder UNIQUE(survey_id, frequency, schedule_time)
);

-- Create reminder logs table for tracking sent reminders
CREATE TABLE IF NOT EXISTS reminder_logs (
    id SERIAL PRIMARY KEY,
    reminder_id INTEGER NOT NULL REFERENCES survey_reminders(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recipients_count INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create survey operation logs table
CREATE TABLE IF NOT EXISTS survey_operation_logs (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    performed_by VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add status column to surveys table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'surveys'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE surveys
        ADD COLUMN status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'paused', 'closed', 'archived'));
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_survey_reminders_survey_id ON survey_reminders(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_reminders_enabled ON survey_reminders(enabled);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_reminder_id ON reminder_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_survey_operation_logs_survey_id ON survey_operation_logs(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_operation_logs_performed_at ON survey_operation_logs(performed_at);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);

-- Comments for documentation
COMMENT ON TABLE survey_reminders IS 'Stores reminder configurations for surveys';
COMMENT ON TABLE reminder_logs IS 'Logs of sent reminders for audit purposes';
COMMENT ON TABLE survey_operation_logs IS 'Audit log of survey operations (start, stop, pause, resume)';
COMMENT ON COLUMN survey_reminders.frequency IS 'Frequency of reminder: once, daily, or weekly';
COMMENT ON COLUMN survey_reminders.schedule_time IS 'Time to send reminder in HH:MM format';
COMMENT ON COLUMN survey_reminders.target_groups IS 'JSON array of target group identifiers';
COMMENT ON COLUMN survey_operation_logs.action IS 'Action performed: started, stopped, paused, resumed';