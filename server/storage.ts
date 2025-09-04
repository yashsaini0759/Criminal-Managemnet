import { type User, type InsertUser, type CriminalRecord, type InsertCriminalRecord, type FirRecord, type InsertFirRecord } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private criminalRecords: Map<string, CriminalRecord>;
  private firRecords: Map<string, FirRecord>;

  constructor() {
    this.users = new Map();
    this.criminalRecords = new Map();
    this.firRecords = new Map();
    this.initializeDummyData();
  }

  private async initializeDummyData() {
    // Create default admin and operator users
    const adminPassword = await bcrypt.hash("admin123", 10);
    const operatorPassword = await bcrypt.hash("op123", 10);
    
    const admin: User = {
      id: randomUUID(),
      username: "admin",
      password: adminPassword,
      role: "admin",
      name: "John Smith",
      lastLogin: null,
      isActive: true,
      createdAt: new Date(),
    };
    
    const operator: User = {
      id: randomUUID(),
      username: "operator",
      password: operatorPassword,
      role: "operator",
      name: "Sarah Wilson",
      lastLogin: new Date(),
      isActive: true,
      createdAt: new Date(),
    };
    
    this.users.set(admin.id, admin);
    this.users.set(operator.id, operator);

    // Create sample criminal records
    const sampleCriminals: CriminalRecord[] = [
      {
        id: randomUUID(),
        name: "Robert Johnson",
        age: 28,
        gender: "male",
        crimeType: "theft",
        firNumber: "FIR-2024-001234",
        caseStatus: "pending",
        arrestDate: new Date("2024-12-15"),
        address: "123 Main St, City",
        photo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Maria Garcia",
        age: 35,
        gender: "female",
        crimeType: "fraud",
        firNumber: "FIR-2024-001235",
        caseStatus: "closed",
        arrestDate: new Date("2024-12-10"),
        address: "456 Oak Ave, City",
        photo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleCriminals.forEach(criminal => {
      this.criminalRecords.set(criminal.id, criminal);
    });

    // Create sample FIR records
    const sampleFirs: FirRecord[] = [
      {
        id: randomUUID(),
        firNumber: "FIR-2024-001234",
        criminalId: sampleCriminals[0].id,
        firDate: new Date("2024-12-15"),
        description: "Theft of electronic items from residential area including laptops, mobile phones, and other valuable items",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleFirs.forEach(fir => {
      this.firRecords.set(fir.id, fir);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      password: hashedPassword,
      lastLogin: null,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Criminal Records methods
  async getCriminalRecord(id: string): Promise<CriminalRecord | undefined> {
    return this.criminalRecords.get(id);
  }

  async getAllCriminalRecords(): Promise<CriminalRecord[]> {
    return Array.from(this.criminalRecords.values());
  }

  async createCriminalRecord(record: InsertCriminalRecord): Promise<CriminalRecord> {
    const criminal: CriminalRecord = {
      ...record,
      id: randomUUID(),
      firNumber: record.firNumber || this.generateFirNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.criminalRecords.set(criminal.id, criminal);
    return criminal;
  }

  async updateCriminalRecord(id: string, updates: Partial<CriminalRecord>): Promise<CriminalRecord | undefined> {
    const record = this.criminalRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...updates, updatedAt: new Date() };
    this.criminalRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteCriminalRecord(id: string): Promise<boolean> {
    return this.criminalRecords.delete(id);
  }

  async searchCriminalRecords(query: string, filters: any): Promise<CriminalRecord[]> {
    let records = Array.from(this.criminalRecords.values());
    
    if (query) {
      records = records.filter(record => 
        record.name.toLowerCase().includes(query.toLowerCase()) ||
        record.firNumber?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (filters.crimeType) {
      records = records.filter(record => record.crimeType === filters.crimeType);
    }
    
    if (filters.status) {
      records = records.filter(record => record.caseStatus === filters.status);
    }
    
    return records;
  }

  // FIR Records methods
  async getFirRecord(id: string): Promise<FirRecord | undefined> {
    return this.firRecords.get(id);
  }

  async getAllFirRecords(): Promise<FirRecord[]> {
    return Array.from(this.firRecords.values());
  }

  async createFirRecord(record: InsertFirRecord): Promise<FirRecord> {
    const fir: FirRecord = {
      ...record,
      id: randomUUID(),
      firNumber: record.firNumber || this.generateFirNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.firRecords.set(fir.id, fir);
    return fir;
  }

  async updateFirRecord(id: string, updates: Partial<FirRecord>): Promise<FirRecord | undefined> {
    const record = this.firRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord = { ...record, ...updates, updatedAt: new Date() };
    this.firRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteFirRecord(id: string): Promise<boolean> {
    return this.firRecords.delete(id);
  }

  async searchFirRecords(query: string, filters: any): Promise<FirRecord[]> {
    let records = Array.from(this.firRecords.values());
    
    if (query) {
      records = records.filter(record => 
        record.firNumber.toLowerCase().includes(query.toLowerCase()) ||
        record.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return records;
  }

  // Statistics
  async getStatistics() {
    const criminals = Array.from(this.criminalRecords.values());
    const firs = Array.from(this.firRecords.values());
    
    const crimeTypeDistribution = criminals.reduce((acc, criminal) => {
      const existing = acc.find(item => item.type === criminal.crimeType);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: criminal.crimeType, count: 1 });
      }
      return acc;
    }, [] as { type: string; count: number }[]);
    
    const caseStatusDistribution = criminals.reduce((acc, criminal) => {
      const existing = acc.find(item => item.status === criminal.caseStatus);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ status: criminal.caseStatus, count: 1 });
      }
      return acc;
    }, [] as { status: string; count: number }[]);
    
    return {
      totalCriminals: criminals.length,
      activeFirs: firs.length,
      solvedCases: criminals.filter(c => c.caseStatus === "closed").length,
      pendingCases: criminals.filter(c => c.caseStatus === "pending").length,
      crimeTypeDistribution,
      caseStatusDistribution,
    };
  }

  private generateFirNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 900000) + 100000;
    return `FIR-${year}-${random}`;
  }
}

export const storage = new MemStorage();
