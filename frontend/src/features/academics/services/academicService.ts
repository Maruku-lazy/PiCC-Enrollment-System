import { supabase } from '../../../lib/supabase';

// ---------------------------------------------------------------------------
// Raw Supabase join row shapes (to avoid `any` in .map callbacks)
// ---------------------------------------------------------------------------

interface RawOfferingRow {
  id: string;
  term_id: string;
  course_id: string;
  curriculum_courses: {
    course_code: string;
    course_title: string;
    credit_units: number;
    year_level: number;
    semester: number;
  } | null;
}

interface RawSectionRow {
  id: string;
  offering_id: string;
  section_name: string;
  max_capacity: number;
  current_enrolled: number;
  course_offerings: {
    term_id: string;
    curriculum_courses: { course_code: string; course_title: string } | null;
  } | null;
}

interface RawScheduleRow extends SectionSchedule {
  class_sections: { section_name: string; course_offerings: { term_id: string } | null } | null;
}

interface RawAssignmentRow {
  id: string;
  section_id: string;
  instructor_id: string;
  assigned_at: string;
  profiles: { full_name: string; email: string } | null;
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AcademicProgram {
  id: string;
  code: string;
  name: string;
  major: string | null;
  department: string;
}

export interface CurriculumVersion {
  id: string;
  program_id: string;
  version_name: string;
  effective_year_start: number;
  effective_year_end: number | null;
  is_active: boolean;
}

export interface CurriculumCourse {
  id: string;
  curriculum_version_id: string;
  course_code: string;
  course_title: string;
  lecture_units: number;
  lab_units: number;
  credit_units: number;
  year_level: number;
  semester: number;
}

export interface AcademicTerm {
  id: string;
  academic_year: string;
  semester: number;
  is_current: boolean;
  enrollment_start: string | null;
  enrollment_end: string | null;
  grading_start: string | null;
  grading_end: string | null;
}

export interface CourseOffering {
  id: string;
  term_id: string;
  course_id: string;
  // Joined fields
  course_code?: string;
  course_title?: string;
  credit_units?: number;
  year_level?: number;
  semester?: number;
  sections_count?: number;
}

export interface ClassSection {
  id: string;
  offering_id: string;
  section_name: string;
  max_capacity: number;
  current_enrolled: number;
  course_code?: string;
  course_title?: string;
}

export interface SectionSchedule {
  id: string;
  section_id: string;
  day_of_week: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  start_time: string;
  end_time: string;
  room: string;
}

export interface InstructorAssignment {
  id: string;
  section_id: string;
  instructor_id: string;
  assigned_at: string;
  instructor_name?: string;
  instructor_email?: string;
}

// ---------------------------------------------------------------------------
// Payload types (for creates/updates)
// ---------------------------------------------------------------------------

export type CreateTermPayload = Omit<AcademicTerm, 'id'>;
export type UpdateTermPayload = Partial<Omit<AcademicTerm, 'id'>>;

export type CreateProgramPayload = Omit<AcademicProgram, 'id'>;
export type UpdateProgramPayload = Partial<Omit<AcademicProgram, 'id'>>;

export type CreateCurriculumVersionPayload = Omit<CurriculumVersion, 'id'>;

export type CreateCurriculumCoursePayload = Omit<CurriculumCourse, 'id'>;

export type CreateOfferingPayload = { term_id: string; course_id: string };

export type CreateSectionPayload = {
  offering_id: string;
  section_name: string;
  max_capacity: number;
};

export type CreateSchedulePayload = Omit<SectionSchedule, 'id'>;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const academicService = {
  // ========= Academic Programs =========

  async getPrograms(): Promise<AcademicProgram[]> {
    const { data, error } = await supabase
      .from('academic_programs')
      .select('*')
      .order('code', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createProgram(payload: CreateProgramPayload): Promise<AcademicProgram> {
    const { data, error } = await supabase
      .from('academic_programs')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProgram(id: string, payload: UpdateProgramPayload): Promise<AcademicProgram> {
    const { data, error } = await supabase
      .from('academic_programs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProgram(id: string): Promise<void> {
    const { error } = await supabase.from('academic_programs').delete().eq('id', id);
    if (error) throw error;
  },

  // ========= Curriculum Versions =========

  async getCurriculumVersions(programId: string): Promise<CurriculumVersion[]> {
    const { data, error } = await supabase
      .from('curriculum_versions')
      .select('*')
      .eq('program_id', programId)
      .order('effective_year_start', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createCurriculumVersion(payload: CreateCurriculumVersionPayload): Promise<CurriculumVersion> {
    const { data, error } = await supabase
      .from('curriculum_versions')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCurriculumVersion(id: string): Promise<void> {
    const { error } = await supabase.from('curriculum_versions').delete().eq('id', id);
    if (error) throw error;
  },

  // ========= Curriculum Courses =========

  async getCurriculumCourses(versionId: string): Promise<CurriculumCourse[]> {
    const { data, error } = await supabase
      .from('curriculum_courses')
      .select('*')
      .eq('curriculum_version_id', versionId)
      .order('year_level', { ascending: true })
      .order('semester', { ascending: true })
      .order('course_code', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createCurriculumCourse(payload: CreateCurriculumCoursePayload): Promise<CurriculumCourse> {
    const { data, error } = await supabase
      .from('curriculum_courses')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCurriculumCourse(id: string): Promise<void> {
    const { error } = await supabase.from('curriculum_courses').delete().eq('id', id);
    if (error) throw error;
  },

  // ========= Academic Terms =========

  async getTerms(): Promise<AcademicTerm[]> {
    const { data, error } = await supabase
      .from('academic_terms')
      .select('*')
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getActiveTerm(): Promise<AcademicTerm | null> {
    const { data, error } = await supabase
      .from('academic_terms')
      .select('*')
      .eq('is_current', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createTerm(payload: CreateTermPayload): Promise<AcademicTerm> {
    const { data, error } = await supabase
      .from('academic_terms')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTerm(id: string, payload: UpdateTermPayload): Promise<AcademicTerm> {
    const { data, error } = await supabase
      .from('academic_terms')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setCurrentTerm(id: string): Promise<void> {
    // First, clear all other terms' is_current flag
    const { error: clearError } = await supabase
      .from('academic_terms')
      .update({ is_current: false })
      .neq('id', id);
    if (clearError) throw clearError;

    // Then set the selected term as current
    const { error: setError } = await supabase
      .from('academic_terms')
      .update({ is_current: true })
      .eq('id', id);
    if (setError) throw setError;
  },

  async deleteTerm(id: string): Promise<void> {
    const { error } = await supabase.from('academic_terms').delete().eq('id', id);
    if (error) throw error;
  },

  // ========= Course Offerings =========

  async getCourseOfferings(termId: string): Promise<CourseOffering[]> {
    const { data, error } = await supabase
      .from('course_offerings')
      .select(`
        id,
        term_id,
        course_id,
        curriculum_courses(course_code, course_title, credit_units, year_level, semester)
      `)
      .eq('term_id', termId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data as unknown as RawOfferingRow[] || []).map((row) => ({
      id: row.id,
      term_id: row.term_id,
      course_id: row.course_id,
      course_code: row.curriculum_courses?.course_code,
      course_title: row.curriculum_courses?.course_title,
      credit_units: row.curriculum_courses?.credit_units,
      year_level: row.curriculum_courses?.year_level,
      semester: row.curriculum_courses?.semester,
    }));
  },

  async createCourseOffering(payload: CreateOfferingPayload): Promise<CourseOffering> {
    const { data, error } = await supabase
      .from('course_offerings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCourseOffering(id: string): Promise<void> {
    const { error } = await supabase.from('course_offerings').delete().eq('id', id);
    if (error) throw error;
  },

  // ========= Class Sections =========

  async getClassSections(termId: string): Promise<ClassSection[]> {
    const { data, error } = await supabase
      .from('class_sections')
      .select(`
        id,
        offering_id,
        section_name,
        max_capacity,
        current_enrolled,
        course_offerings!inner(
          term_id,
          curriculum_courses(course_code, course_title)
        )
      `)
      .eq('course_offerings.term_id', termId);
    if (error) throw error;

    return (data as unknown as RawSectionRow[] || []).map((row) => ({
      id: row.id,
      offering_id: row.offering_id,
      section_name: row.section_name,
      max_capacity: row.max_capacity,
      current_enrolled: row.current_enrolled,
      course_code: row.course_offerings?.curriculum_courses?.course_code,
      course_title: row.course_offerings?.curriculum_courses?.course_title,
    }));
  },

  async getSectionsByOffering(offeringId: string): Promise<ClassSection[]> {
    const { data, error } = await supabase
      .from('class_sections')
      .select('*')
      .eq('offering_id', offeringId)
      .order('section_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createClassSection(payload: CreateSectionPayload): Promise<ClassSection> {
    const { data, error } = await supabase
      .from('class_sections')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateClassSection(
    id: string,
    payload: Partial<Pick<ClassSection, 'section_name' | 'max_capacity'>>
  ): Promise<ClassSection> {
    const { data, error } = await supabase
      .from('class_sections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteClassSection(id: string): Promise<void> {
    const { error } = await supabase.from('class_sections').delete().eq('id', id);
    if (error) throw error;
  },

  // ========= Section Schedules =========

  async getSectionSchedules(sectionId: string): Promise<SectionSchedule[]> {
    const { data, error } = await supabase
      .from('section_schedules')
      .select('*')
      .eq('section_id', sectionId);
    if (error) throw error;
    return data || [];
  },

  async getAllSchedulesForTerm(termId: string): Promise<(SectionSchedule & { section_name: string })[]> {
    const { data, error } = await supabase
      .from('section_schedules')
      .select(`
        *,
        class_sections!inner(
          section_name,
          course_offerings!inner(term_id)
        )
      `)
      .eq('class_sections.course_offerings.term_id', termId);
    if (error) throw error;

    return (data as unknown as RawScheduleRow[] || []).map((row) => ({
      ...row,
      section_name: row.class_sections?.section_name ?? '',
    }));
  },

  async createSchedule(payload: CreateSchedulePayload): Promise<SectionSchedule> {
    const { data, error } = await supabase
      .from('section_schedules')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase.from('section_schedules').delete().eq('id', id);
    if (error) throw error;
  },

  // ========= Instructor Assignments =========

  async getInstructorAssignments(sectionId: string): Promise<InstructorAssignment[]> {
    const { data, error } = await supabase
      .from('instructor_assignments')
      .select(`
        id,
        section_id,
        instructor_id,
        assigned_at,
        profiles!inner(full_name, email)
      `)
      .eq('section_id', sectionId);
    if (error) throw error;

    return (data as unknown as RawAssignmentRow[] || []).map((row) => ({
      id: row.id,
      section_id: row.section_id,
      instructor_id: row.instructor_id,
      assigned_at: row.assigned_at,
      instructor_name: row.profiles?.full_name,
      instructor_email: row.profiles?.email,
    }));
  },

  async getInstructors(): Promise<{ id: string; full_name: string; email: string }[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'instructor')
      .eq('account_status', 'active')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async assignInstructor(sectionId: string, instructorId: string): Promise<InstructorAssignment> {
    const { data, error } = await supabase
      .from('instructor_assignments')
      .insert({ section_id: sectionId, instructor_id: instructorId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeInstructorAssignment(id: string): Promise<void> {
    const { error } = await supabase.from('instructor_assignments').delete().eq('id', id);
    if (error) throw error;
  },
};
