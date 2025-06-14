-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM expenses 
            WHERE submitted_by_id = auth.uid()
        )
    );

-- Create policies for expenses
CREATE POLICY "Users can create their own expenses"
    ON expenses FOR INSERT
    WITH CHECK (
        submitted_by_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id 
            FROM expenses 
            WHERE submitted_by_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own expenses"
    ON expenses FOR SELECT
    USING (
        submitted_by_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id 
            FROM expenses 
            WHERE submitted_by_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own expenses"
    ON expenses FOR UPDATE
    USING (
        submitted_by_id = auth.uid() AND
        status = 'PENDING'
    );

-- Create storage policies for receipts
CREATE POLICY "Users can upload their own receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at(); 