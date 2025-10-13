import { type User, type InsertUser, type CriminalRecord, type InsertCriminalRecord, type FirRecord, type InsertFirRecord } from "@shared/schema";
import { prisma } from "./prismaClient";

// Type guards to ensure proper enum types
const isUserRole = (role: string): role is "admin" | "operator" => {
  return role === "admin" || role === "operator";
};

const isGender = (gender: string): gender is "male" | "female" | "other" => {
  return gender === "male" || gender === "female" || gender === "other";
};

const isCaseStatus = (status: string): status is "open" | "pending" | "closed" => {
  return status === "open" || status === "pending" || status === "closed";
};

// Transform Prisma results to match our schema types
const transformUser = (user: any): User => ({
  ...user,
  role: isUserRole(user.role) ? user.role : "operator",
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

const transformCriminalRecord = (record: any): CriminalRecord => ({
  ...record,
  gender: isGender(record.gender) ? record.gender : "other",
  caseStatus: isCaseStatus(record.caseStatus) ? record.caseStatus : "open",
  arrestDate: record.arrestDate,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const transformFirRecord = (record: any): FirRecord => ({
  ...record,
  firDate: record.firDate,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Criminal Records methods
  getCriminalRecord(id: string): Promise<CriminalRecord | undefined>;
  getAllCriminalRecords(): Promise<CriminalRecord[]>;
  createCriminalRecord(record: InsertCriminalRecord): Promise<CriminalRecord>;
  updateCriminalRecord(id: string, updates: Partial<CriminalRecord>): Promise<CriminalRecord | undefined>;
  deleteCriminalRecord(id: string): Promise<boolean>;
  searchCriminalRecords(query: string, filters: any): Promise<CriminalRecord[]>;
  
  // FIR Records methods
  getFirRecord(id: string): Promise<FirRecord | undefined>;
  getAllFirRecords(): Promise<FirRecord[]>;
  createFirRecord(record: InsertFirRecord): Promise<FirRecord>;
  updateFirRecord(id: string, updates: Partial<FirRecord>): Promise<FirRecord | undefined>;
  deleteFirRecord(id: string): Promise<boolean>;
  searchFirRecords(query: string, filters: any): Promise<FirRecord[]>;
  
  // Statistics
  getStatistics(): Promise<{
    totalCriminals: number;
    activeFirs: number;
    solvedCases: number;
    pendingCases: number;
    crimeTypeDistribution: { type: string; count: number }[];
    caseStatusDistribution: { status: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ 
      where: { id } 
    });
    return user ? transformUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    return user ? transformUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await prisma.user.create({
      data: insertUser
    });
    return transformUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updates
      });
      return transformUser(user);
    } catch (error) {
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return users.map(transformUser);
  }

  // Criminal Records methods
  async getCriminalRecord(id: string): Promise<CriminalRecord | undefined> {
    const record = await prisma.criminalRecord.findUnique({
      where: { id }
    });
    return record ? transformCriminalRecord(record) : undefined;
  }

  async getAllCriminalRecords(): Promise<CriminalRecord[]> {
    const records = await prisma.criminalRecord.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return records.map(transformCriminalRecord);
  }

  async createCriminalRecord(record: InsertCriminalRecord): Promise<CriminalRecord> {
    const criminalRecord = await prisma.criminalRecord.create({
      data: {
        ...record,
        firNumber: record.firNumber || this.generateFirNumber(),
      }
    });
    return transformCriminalRecord(criminalRecord);
  }

  async updateCriminalRecord(id: string, updates: Partial<CriminalRecord>): Promise<CriminalRecord | undefined> {
    try {
      const record = await prisma.criminalRecord.update({
        where: { id },
        data: updates
      });
      return transformCriminalRecord(record);
    } catch (error) {
      return undefined;
    }
  }

  async deleteCriminalRecord(id: string): Promise<boolean> {
    try {
      await prisma.criminalRecord.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async searchCriminalRecords(query: string, filters: any): Promise<CriminalRecord[]> {
    const where: any = {
      OR: []
    };

    if (query) {
      where.OR.push(
        { name: { contains: query, mode: 'insensitive' } },
        { firNumber: { contains: query, mode: 'insensitive' } }
      );
    }

    if (filters.crimeType) {
      where.crimeType = filters.crimeType;
    }

    if (filters.status) {
      where.caseStatus = filters.status;
    }

    // If no query, remove the OR condition
    if (!query) {
      delete where.OR;
    }

    const records = await prisma.criminalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return records.map(transformCriminalRecord);
  }

  // FIR Records methods
  async getFirRecord(id: string): Promise<FirRecord | undefined> {
    const record = await prisma.firRecord.findUnique({
      where: { id }
    });
    return record ? transformFirRecord(record) : undefined;
  }

  async getAllFirRecords(): Promise<FirRecord[]> {
    const records = await prisma.firRecord.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return records.map(transformFirRecord);
  }

  async createFirRecord(record: InsertFirRecord): Promise<FirRecord> {
    const firRecord = await prisma.firRecord.create({
      data: {
        ...record,
        firNumber: record.firNumber || this.generateFirNumber(),
      }
    });
    return transformFirRecord(firRecord);
  }

  async updateFirRecord(id: string, updates: Partial<FirRecord>): Promise<FirRecord | undefined> {
    try {
      const record = await prisma.firRecord.update({
        where: { id },
        data: updates
      });
      return transformFirRecord(record);
    } catch (error) {
      return undefined;
    }
  }

  async deleteFirRecord(id: string): Promise<boolean> {
    try {
      await prisma.firRecord.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async searchFirRecords(query: string, filters: any): Promise<FirRecord[]> {
    const where: any = {
      OR: []
    };

    if (query) {
      where.OR.push(
        { firNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      );
    }

    // If no query, remove the OR condition
    if (!query) {
      delete where.OR;
    }

    const records = await prisma.firRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return records.map(transformFirRecord);
  }

  // Statistics
  async getStatistics() {
    const [totalCriminals, activeFirs, criminals] = await Promise.all([
      prisma.criminalRecord.count(),
      prisma.firRecord.count(),
      prisma.criminalRecord.findMany()
    ]);

    // Get crime type distribution
    const crimeTypeDistribution = await prisma.criminalRecord.groupBy({
      by: ['crimeType'],
      _count: {
        crimeType: true
      }
    });

    // Get case status distribution
    const caseStatusDistribution = await prisma.criminalRecord.groupBy({
      by: ['caseStatus'],
      _count: {
        caseStatus: true
      }
    });

    return {
      totalCriminals,
      activeFirs,
      solvedCases: criminals.filter(c => c.caseStatus === "closed").length,
      pendingCases: criminals.filter(c => c.caseStatus === "pending").length,
      crimeTypeDistribution: crimeTypeDistribution.map(item => ({
        type: item.crimeType,
        count: item._count.crimeType
      })),
      caseStatusDistribution: caseStatusDistribution.map(item => ({
        status: item.caseStatus,
        count: item._count.caseStatus
      }))
    };
  }

  private generateFirNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 900000) + 100000;
    return `FIR-${year}-${random}`;
  }
}

export const storage = new DatabaseStorage();