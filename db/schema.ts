import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(), title: text('title').notNull(), body: text('body').notNull(),
  mediaJson: text('media_json'), jobJson: text('job_json'),
  category: text('category').notNull(), image: text('image').notNull(),
  status: text('status').notNull().default('pending'), revision: integer('revision').notNull().default(0),
  updatedAt: text('updated_at').notNull(), approvedBy: text('approved_by'),
  publishedUrl: text('published_url'), publishedAt: text('published_at'),
});
export const hubSecrets = sqliteTable('hub_secrets', {
  id: text('id').primaryKey(), ciphertext: text('ciphertext').notNull(), updatedAt: text('updated_at').notNull(),
});
export const socialPublications = sqliteTable('social_publications', {
  id: text('id').primaryKey(), articleId: text('article_id').notNull(), channel: text('channel').notNull(),
  status: text('status').notNull(), receipt: text('receipt'), postUrl: text('post_url'), providerId: text('provider_id'), caption: text('caption'), imageUrl: text('image_url'), revision: integer('revision'), updatedAt: text('updated_at').notNull(),
});

export const mediaAssets = sqliteTable('media_assets', {
 id:text('id').primaryKey(), kind:text('kind').notNull(), path:text('path').notNull(),
 size:integer('size').notNull(), isPublic:integer('is_public').notNull().default(0), createdAt:text('created_at').notNull(),
});

export const brandTemplates=sqliteTable('brand_templates',{id:text('id').primaryKey(),name:text('name').notNull(),settingsJson:text('settings_json').notNull(),updatedAt:text('updated_at').notNull()});
