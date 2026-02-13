/**
 * Curriculum Data Assembler
 *
 * Combines per-grade data files into CURRICULUM_DATA.
 * Requires: kindergarden.js, grade1_data.js, grade2_data.js, grade3_data.js, grade4_data.js
 * to be loaded before this file.
 *
 * 5 Phases → 20 Skills → 100 Levels
 */

const CURRICULUM_DATA = {
  subjects: KINDERGARTEN_DATA.subjects,
  phases: [
    KINDERGARTEN_DATA.phase,
    GRADE_1_DATA.phase,
    GRADE_2_DATA.phase,
    GRADE_3_DATA.phase,
    GRADE_4_DATA.phase,
  ],
};
