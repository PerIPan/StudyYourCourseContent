export interface Course {
  id: string;
  name: string;
  slug: string;
}

export interface Document {
  id: string;
  courseId: string;
  lectureNumber: number;
  filename: string;
  fileType: string;
  totalPages: number;
  chunkCount: number;
  priority: 'high' | 'normal';
  createdAt: string;
}

export interface ChunkResult {
  id: string;
  content: string;
  page_number: number;
  chunk_index: number;
  filename: string;
  lecture_number: number;
  priority: string;
  course_name: string;
  course_slug: string;
  similarity?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
}

export interface SourceCitation {
  courseName: string;
  lectureNumber: number;
  filename: string;
  pageNumber: number;
}

export interface ExamQuestion {
  questionId: string;
  question: string;
  questionType: 'open-ended' | 'scenario' | 'compare-contrast';
  courseName: string;
  lectureScope: number | null;
  sources: SourceCitation[];
}

export interface ExamGrade {
  correct: string;
  missing: string;
  modelAnswer: string;
  sources: SourceCitation[];
}

export interface AdminDoc {
  id: string;
  filename: string;
  course_name: string;
  lecture_number: number;
  chunk_count: number;
  priority: string;
  file_type: string;
}
