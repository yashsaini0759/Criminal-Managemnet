import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "operator"] }).notNull().default("operator"),
  name: text("name").notNull(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const criminalRecords = pgTable("criminal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  crimeType: text("crime_type").notNull(),
  firNumber: text("fir_number"),
  caseStatus: text("case_status", { enum: ["open", "pending", "closed"] }).notNull().default("open"),
  arrestDate: timestamp("arrest_date"),
  address: text("address"),
  photo: text("photo"), // Base64 encoded photo
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const firRecords = pgTable("fir_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firNumber: text("fir_number").notNull().unique(),
  criminalId: varchar("criminal_id").references(() => criminalRecords.id),
  firDate: timestamp("fir_date").notNull().default(sql`now()`),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertCriminalRecordSchema = createInsertSchema(criminalRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  age: z.number().min(1).max(150),
});

export const insertFirRecordSchema = createInsertSchema(firRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CriminalRecord = typeof criminalRecords.$inferSelect;
export type InsertCriminalRecord = z.infer<typeof insertCriminalRecordSchema>;
export type FirRecord = typeof firRecords.$inferSelect;
export type InsertFirRecord = z.infer<typeof insertFirRecordSchema>;
