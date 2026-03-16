import { pgTable, uuid, varchar, integer, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('courses_slug_idx').on(table.slug),
}));

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  lectureNumber: integer('lecture_number').notNull(),
  filename: varchar('filename', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 10 }).notNull(),
  totalPages: integer('total_pages').notNull().default(0),
  chunkCount: integer('chunk_count').notNull().default(0),
  priority: varchar('priority', { length: 10 }).notNull().default('normal'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  courseIdx: index('documents_course_id_idx').on(table.courseId),
}));

export const chunks = pgTable('chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  // NOTE: embedding_vec vector(1536) column added via raw SQL in seed script
  // Drizzle doesn't support pgvector natively
  pageNumber: integer('page_number').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  documentIdx: index('chunks_document_id_idx').on(table.documentId),
}));
