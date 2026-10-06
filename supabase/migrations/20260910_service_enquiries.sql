-- =====================================================================
-- MIGRATION: Service & Repair Enquiries Table
-- Table: public.service_enquiries
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.service_enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_no TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    preferred_contact TEXT DEFAULT 'WhatsApp',
    service_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_model TEXT,
    issue_description TEXT NOT NULL,
    additional_details TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast lookup & filtering
CREATE INDEX IF NOT EXISTS idx_service_enquiries_ref ON public.service_enquiries(reference_no);
CREATE INDEX IF NOT EXISTS idx_service_enquiries_status ON public.service_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_service_enquiries_created ON public.service_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_enquiries_phone ON public.service_enquiries(customer_phone);

-- Enable RLS
ALTER TABLE public.service_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow public to submit enquiries
CREATE POLICY "Public users can submit service enquiries"
    ON public.service_enquiries FOR INSERT
    WITH CHECK (true);

-- Allow service role / admin full access
CREATE POLICY "Admin full access to service enquiries"
    ON public.service_enquiries FOR ALL
    USING (true)
    WITH CHECK (true);
