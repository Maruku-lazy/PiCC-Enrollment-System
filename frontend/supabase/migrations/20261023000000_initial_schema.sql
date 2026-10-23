-- ============================================================================
-- Pilar Community College Enrollment Management & Electronic Grading System
-- Migration: 20261023000000_initial_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Profiles (linked to Supabase Auth users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'registrar', 'admin', 'system_admin')),
    account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Academic Programs & Curricula
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE, -- e.g. 'BSCRIM', 'BTLED-ICT', 'BSESS-FSM', 'BSESS-FSC'
    name TEXT NOT NULL,
    major TEXT,
    department TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.academic_programs(id) ON DELETE RESTRICT,
    version_name TEXT NOT NULL, -- e.g. '2024-2028 Revised'
    effective_year_start INT NOT NULL,
    effective_year_end INT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_version_id UUID NOT NULL REFERENCES public.curriculum_versions(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_title TEXT NOT NULL,
    lecture_units NUMERIC(3,1) NOT NULL DEFAULT 3.0,
    lab_units NUMERIC(3,1) NOT NULL DEFAULT 0.0,
    credit_units NUMERIC(3,1) NOT NULL DEFAULT 3.0,
    year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    semester INT NOT NULL CHECK (semester IN (1, 2, 3)), -- 1=1st, 2=2nd, 3=Summer
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_prerequisites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.curriculum_courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID NOT NULL REFERENCES public.curriculum_courses(id) ON DELETE CASCADE,
    is_corequisite BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(course_id, prerequisite_course_id)
);

-- ----------------------------------------------------------------------------
-- 3. Academic Terms & Sections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year TEXT NOT NULL, -- e.g. '2026-2027'
    semester INT NOT NULL CHECK (semester IN (1, 2, 3)),
    is_current BOOLEAN NOT NULL DEFAULT false,
    enrollment_start TIMESTAMPTZ,
    enrollment_end TIMESTAMPTZ,
    grading_start TIMESTAMPTZ,
    grading_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(academic_year, semester)
);

CREATE TABLE IF NOT EXISTS public.course_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
    course_id UUID NOT NULL REFERENCES public.curriculum_courses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offering_id UUID NOT NULL REFERENCES public.course_offerings(id) ON DELETE RESTRICT,
    section_name TEXT NOT NULL, -- e.g. 'BSCRIM 1-A'
    max_capacity INT NOT NULL DEFAULT 40,
    current_enrolled INT NOT NULL DEFAULT 0 CHECK (current_enrolled <= max_capacity),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.section_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.class_sections(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.instructor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.class_sections(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(section_id, instructor_id)
);

-- ----------------------------------------------------------------------------
-- 4. Enrollment Applications & Workflows
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollment_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number TEXT NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES public.academic_programs(id) ON DELETE RESTRICT,
    year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (
        status IN (
            'Draft', 
            'Submitted', 
            'For Verification', 
            'Incomplete / Needs Correction', 
            'For Assessment', 
            'For Payment Validation', 
            'For Final Validation', 
            'Officially Enrolled', 
            'Rejected'
        )
    ),
    channel TEXT NOT NULL DEFAULT 'Online' CHECK (channel IN ('Online', 'Onsite')),
    correction_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enrollment_application_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.enrollment_applications(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.class_sections(id) ON DELETE RESTRICT,
    UNIQUE(application_id, section_id)
);

CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.enrollment_applications(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Assessment & Payments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES public.enrollment_applications(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE RESTRICT,
    reference_number TEXT NOT NULL UNIQUE,
    amount_paid NUMERIC(10,2) NOT NULL,
    receipt_file_path TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certificates_of_registration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES public.enrollment_applications(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    cor_number TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 6. Grading System
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grading_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
    period_name TEXT NOT NULL, -- e.g. 'Midterm', 'Finals'
    is_open BOOLEAN NOT NULL DEFAULT false,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.class_sections(id) ON DELETE RESTRICT,
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    grading_period_id UUID NOT NULL REFERENCES public.grading_periods(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (
        status IN (
            'Not Yet Encoded', 
            'Draft', 
            'Submitted', 
            'For Verification', 
            'Returned for Correction', 
            'Verified / Accepted', 
            'Finalized / Locked'
        )
    ),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(section_id, grading_period_id)
);

CREATE TABLE IF NOT EXISTS public.grade_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.grade_submissions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    numerical_grade NUMERIC(4,2), -- e.g. 1.00 - 5.00
    remarks TEXT CHECK (remarks IN ('Passed', 'Failed', 'Incomplete', 'Dropped', NULL)),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(submission_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.grade_correction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.grade_submissions(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. Audit & Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_application_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates_of_registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check caller staff roles securely
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('registrar', 'admin', 'system_admin')
          AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles: users can read their own profile; staff can read all profiles
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_staff());

-- Academic Catalog: Public/Authenticated can read active catalogs
CREATE POLICY "academic_programs_select" ON public.academic_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "curriculum_versions_select" ON public.curriculum_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "curriculum_courses_select" ON public.curriculum_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "course_prerequisites_select" ON public.course_prerequisites FOR SELECT TO authenticated USING (true);
CREATE POLICY "academic_terms_select" ON public.academic_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "course_offerings_select" ON public.course_offerings FOR SELECT TO authenticated USING (true);
CREATE POLICY "class_sections_select" ON public.class_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "section_schedules_select" ON public.section_schedules FOR SELECT TO authenticated USING (true);

-- Applications: Students only access own; Staff access all
CREATE POLICY "applications_select" ON public.enrollment_applications
    FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR public.is_staff());

CREATE POLICY "applications_insert" ON public.enrollment_applications
    FOR INSERT TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "applications_update" ON public.enrollment_applications
    FOR UPDATE TO authenticated
    USING (student_id = auth.uid() OR public.is_staff());

-- Documents: Students access own; Staff access all
CREATE POLICY "student_documents_select" ON public.student_documents
    FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR public.is_staff());

CREATE POLICY "student_documents_insert" ON public.student_documents
    FOR INSERT TO authenticated
    WITH CHECK (student_id = auth.uid());

-- Grades: Instructors only encode for their assigned sections
CREATE POLICY "grades_select" ON public.grade_submissions
    FOR SELECT TO authenticated
    USING (
        instructor_id = auth.uid()
        OR public.is_staff()
    );

CREATE POLICY "grades_update" ON public.grade_submissions
    FOR UPDATE TO authenticated
    USING (
        (instructor_id = auth.uid() AND status IN ('Draft', 'Returned for Correction'))
        OR public.is_staff()
    );

-- Notifications: User only sees own
CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());