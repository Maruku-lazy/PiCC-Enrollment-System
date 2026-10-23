-- ============================================================================
-- Migration: 20261023000001_academic_management_rls.sql
-- Phase 4: Staff CRUD policies for Academic Management module
-- ============================================================================
-- This migration adds INSERT / UPDATE / DELETE RLS policies for all academic
-- tables so that registrar/admin/system_admin staff can manage the catalog,
-- terms, offerings, sections, schedules, and instructor assignments through
-- the application UI. The is_staff() helper function already exists from the
-- initial schema migration and is reused here.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- academic_programs – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "academic_programs_insert" ON public.academic_programs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "academic_programs_update" ON public.academic_programs
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "academic_programs_delete" ON public.academic_programs
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- curriculum_versions – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "curriculum_versions_insert" ON public.curriculum_versions
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "curriculum_versions_update" ON public.curriculum_versions
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "curriculum_versions_delete" ON public.curriculum_versions
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- curriculum_courses – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "curriculum_courses_insert" ON public.curriculum_courses
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "curriculum_courses_update" ON public.curriculum_courses
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "curriculum_courses_delete" ON public.curriculum_courses
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- course_prerequisites – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "course_prerequisites_insert" ON public.course_prerequisites
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "course_prerequisites_delete" ON public.course_prerequisites
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- academic_terms – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "academic_terms_insert" ON public.academic_terms
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "academic_terms_update" ON public.academic_terms
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "academic_terms_delete" ON public.academic_terms
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- course_offerings – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "course_offerings_insert" ON public.course_offerings
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "course_offerings_update" ON public.course_offerings
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "course_offerings_delete" ON public.course_offerings
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- class_sections – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "class_sections_insert" ON public.class_sections
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "class_sections_update" ON public.class_sections
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "class_sections_delete" ON public.class_sections
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- section_schedules – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "section_schedules_insert" ON public.section_schedules
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "section_schedules_update" ON public.section_schedules
    FOR UPDATE TO authenticated
    USING (public.is_staff());

CREATE POLICY "section_schedules_delete" ON public.section_schedules
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- instructor_assignments – staff full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "instructor_assignments_select" ON public.instructor_assignments
    FOR SELECT TO authenticated
    USING (
        instructor_id = auth.uid()
        OR public.is_staff()
    );

CREATE POLICY "instructor_assignments_insert" ON public.instructor_assignments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "instructor_assignments_delete" ON public.instructor_assignments
    FOR DELETE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- profiles – staff can update roles/status (admin actions)
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles_update_staff" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- enrollment_application_items – staff can read all
-- ----------------------------------------------------------------------------
CREATE POLICY "application_items_select" ON public.enrollment_application_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.enrollment_applications ea
            WHERE ea.id = application_id
              AND (ea.student_id = auth.uid() OR public.is_staff())
        )
    );

CREATE POLICY "application_items_insert" ON public.enrollment_application_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.enrollment_applications ea
            WHERE ea.id = application_id AND ea.student_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- assessments – staff can insert/update
-- ----------------------------------------------------------------------------
CREATE POLICY "assessments_select" ON public.assessments
    FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR public.is_staff());

CREATE POLICY "assessments_insert" ON public.assessments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "assessments_update" ON public.assessments
    FOR UPDATE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- payment_records – staff manage payments
-- ----------------------------------------------------------------------------
CREATE POLICY "payment_records_select" ON public.payment_records
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_id
              AND (a.student_id = auth.uid() OR public.is_staff())
        )
    );

CREATE POLICY "payment_records_insert" ON public.payment_records
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "payment_records_update" ON public.payment_records
    FOR UPDATE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- certificates_of_registration – staff issue; students read own
-- ----------------------------------------------------------------------------
CREATE POLICY "cor_select" ON public.certificates_of_registration
    FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR public.is_staff());

CREATE POLICY "cor_insert" ON public.certificates_of_registration
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

-- ----------------------------------------------------------------------------
-- grading_periods – staff manage
-- ----------------------------------------------------------------------------
CREATE POLICY "grading_periods_select" ON public.grading_periods
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "grading_periods_insert" ON public.grading_periods
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

CREATE POLICY "grading_periods_update" ON public.grading_periods
    FOR UPDATE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- grade_submissions – instructors insert own; select already covered
-- ----------------------------------------------------------------------------
CREATE POLICY "grade_submissions_insert" ON public.grade_submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        instructor_id = auth.uid()
        OR public.is_staff()
    );

-- ----------------------------------------------------------------------------
-- grade_entries – instructors manage own section grades
-- ----------------------------------------------------------------------------
CREATE POLICY "grade_entries_select" ON public.grade_entries
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR public.is_staff()
        OR EXISTS (
            SELECT 1 FROM public.grade_submissions gs
            WHERE gs.id = submission_id AND gs.instructor_id = auth.uid()
        )
    );

CREATE POLICY "grade_entries_insert" ON public.grade_entries
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grade_submissions gs
            WHERE gs.id = submission_id
              AND (gs.instructor_id = auth.uid() OR public.is_staff())
        )
    );

CREATE POLICY "grade_entries_update" ON public.grade_entries
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.grade_submissions gs
            WHERE gs.id = submission_id
              AND (
                (gs.instructor_id = auth.uid() AND gs.status IN ('Draft', 'Returned for Correction'))
                OR public.is_staff()
              )
        )
    );

-- ----------------------------------------------------------------------------
-- grade_correction_requests – instructors submit; staff review
-- ----------------------------------------------------------------------------
CREATE POLICY "grade_correction_select" ON public.grade_correction_requests
    FOR SELECT TO authenticated
    USING (requested_by = auth.uid() OR public.is_staff());

CREATE POLICY "grade_correction_insert" ON public.grade_correction_requests
    FOR INSERT TO authenticated
    WITH CHECK (requested_by = auth.uid() OR public.is_staff());

CREATE POLICY "grade_correction_update" ON public.grade_correction_requests
    FOR UPDATE TO authenticated
    USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- audit_logs – staff read; system inserts (no user-facing insert policy)
-- ----------------------------------------------------------------------------
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_staff());

CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

-- ----------------------------------------------------------------------------
-- notifications – users manage own
-- ----------------------------------------------------------------------------
CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
