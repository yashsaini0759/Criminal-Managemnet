// shared/schema.ts
import { z } from "zod";

// User Schemas
export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["admin", "operator"]).optional(),
  name: z.string().min(1),
});

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.enum(["admin", "operator"]),
  name: z.string(),
  lastLogin: z.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

// Criminal Record Schemas
export const insertCriminalRecordSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(1).max(120),
  gender: z.enum(["male", "female", "other"]),
  crimeType: z.string().min(1),
  firNumber: z.string().optional().nullable(),
  caseStatus: z.enum(["open", "pending", "closed"]).optional(),
  arrestDate: z.date().optional().nullable(),
  address: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
});

export const criminalRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  gender: z.enum(["male", "female", "other"]),
  crimeType: z.string(),
  firNumber: z.string().nullable(),
  caseStatus: z.enum(["open", "pending", "closed"]),
  arrestDate: z.date().nullable(),
  address: z.string().nullable(),
  photo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// FIR Record Schemas
export const insertFirRecordSchema = z.object({
  firNumber: z.string().optional(),
  criminalId: z.string().optional().nullable(),
  firDate: z.date().optional(),
  description: z.string().min(1),
});

export const firRecordSchema = z.object({
  id: z.string(),
  firNumber: z.string(),
  criminalId: z.string().nullable(),
  firDate: z.date(),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CriminalRecord = z.infer<typeof criminalRecordSchema>;
export type InsertCriminalRecord = z.infer<typeof insertCriminalRecordSchema>;
export type FirRecord = z.infer<typeof firRecordSchema>;
export type InsertFirRecord = z.infer<typeof insertFirRecordSchema>;