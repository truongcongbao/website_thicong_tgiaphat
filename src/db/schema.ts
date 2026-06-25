import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Define 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'posts' table (for editing/posting info articles)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  category: text('category').default('Tin tức').notNull(), // 'Tin tức', 'Mẹo thi công', 'Vật liệu', 'Dự án'
  authorId: integer('author_id')
    .references(() => users.id)
    .notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relationships for 'users'
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

// Define relationships for 'posts'
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
