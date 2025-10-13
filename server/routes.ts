import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import multer from "multer";
import { crimePredictor } from "./ml/crimePredictor";
import { z } from "zod";

// Define schemas inline since @shared/schema is missing
const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["admin", "operator"]).optional(),
  name: z.string().min(1),
});

const insertCriminalRecordSchema = z.object({
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

const insertFirRecordSchema = z.object({
  firNumber: z.string().optional(),
  criminalId: z.string().optional().nullable(),
  firDate: z.union([z.string(), z.date()])
    .optional()
    .transform(val => {
      if (!val) return new Date();
      return val instanceof Date ? val : new Date(val);
    })
    .refine(val => !isNaN(val.getTime()), {
      message: "Invalid date format"
    }),
  description: z.string({
    required_error: "Description is required",
    invalid_type_error: "Description must be a string"
  }).min(1, "Description cannot be empty"),
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`, req.query, req.body);
    next();
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Criminal records routes
  app.get("/api/criminals", async (req, res) => {
    try {
      const { search, crimeType, status } = req.query;
      
      if (search || crimeType || status) {
        const records = await storage.searchCriminalRecords(
          search as string || "",
          { crimeType, status }
        );
        res.json(records);
      } else {
        const records = await storage.getAllCriminalRecords();
        res.json(records);
      }
    } catch (error) {
      console.error("Get criminals error:", error);
      res.status(500).json({ message: "Failed to fetch criminal records" });
    }
  });

  app.get("/api/criminals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getCriminalRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Criminal record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Get criminal by ID error:", error);
      res.status(500).json({ message: "Failed to fetch criminal record" });
    }
  });

  app.post("/api/criminals", upload.single('photo'), async (req, res) => {
    try {
      // Convert FormData values to proper types
      const bodyData = {
        ...req.body,
        age: req.body.age ? parseInt(req.body.age, 10) : undefined,
        arrestDate: req.body.arrestDate ? new Date(req.body.arrestDate) : undefined,
      };

      const recordData = insertCriminalRecordSchema.parse(bodyData);
      
      // Handle photo upload
      if (req.file) {
        const photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        recordData.photo = photoBase64;
      }
      
      const record = await storage.createCriminalRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Criminal creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid criminal record data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create criminal record" });
    }
  });

  app.put("/api/criminals/:id", upload.single('photo'), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Handle photo upload
      if (req.file) {
        const photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        updates.photo = photoBase64;
      }
      
      const record = await storage.updateCriminalRecord(id, updates);
      if (!record) {
        return res.status(404).json({ message: "Criminal record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Update criminal error:", error);
      res.status(500).json({ message: "Failed to update criminal record" });
    }
  });

  app.delete("/api/criminals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCriminalRecord(id);
      if (!success) {
        return res.status(404).json({ message: "Criminal record not found" });
      }
      res.json({ message: "Criminal record deleted successfully" });
    } catch (error) {
      console.error("Delete criminal error:", error);
      res.status(500).json({ message: "Failed to delete criminal record" });
    }
  });

  // FIR records routes - FIXED VERSION
  app.get("/api/firs", async (req, res) => {
    console.log("🔍 GET /api/firs called with query:", req.query);
    
    try {
      const { search } = req.query;
      
      console.log("📋 Search parameter:", search);
      
      if (search) {
        const records = await storage.searchFirRecords(search as string, {});
        console.log("✅ Search results:", records.length, "records found");
        res.json(records);
      } else {
        const records = await storage.getAllFirRecords();
        console.log("✅ All FIR records:", records.length, "records found");
        res.json(records);
      }
    } catch (error) {
      console.error("💥 GET /api/firs failed:", error);
      res.status(500).json({ 
        message: "Failed to fetch FIR records",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/firs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getFirRecord(id);
      if (!record) {
        return res.status(404).json({ message: "FIR record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Get FIR by ID error:", error);
      res.status(500).json({ message: "Failed to fetch FIR record" });
    }
  });

  app.post("/api/firs", async (req, res) => {
    console.log("🚨 POST /api/firs - Request body:", req.body);
    
    try {
      // Check if body exists and has description
      if (!req.body || !req.body.description) {
        console.log("❌ Missing description in request body");
        return res.status(400).json({ 
          message: "Description is required",
          received: req.body 
        });
      }

      console.log("🔍 Validating FIR data...");
      
      // More flexible schema for date handling
      const firData = insertFirRecordSchema.parse({
        ...req.body,
        firDate: req.body.firDate ? new Date(req.body.firDate) : undefined
      });
      
      console.log("✅ FIR data validated:", firData);

      const record = await storage.createFirRecord(firData);
      console.log("🎉 FIR created successfully:", record);

      res.status(201).json(record);
    } catch (error) {
      console.error("💥 FIR creation failed:", error);
      
      if (error instanceof z.ZodError) {
        console.log("❌ Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid FIR data", 
          errors: error.errors,
          receivedData: req.body
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create FIR record",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/firs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const record = await storage.updateFirRecord(id, updates);
      if (!record) {
        return res.status(404).json({ message: "FIR record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Update FIR error:", error);
      res.status(500).json({ message: "Failed to update FIR record" });
    }
  });

  app.delete("/api/firs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFirRecord(id);
      if (!success) {
        return res.status(404).json({ message: "FIR record not found" });
      }
      res.json({ message: "FIR record deleted successfully" });
    } catch (error) {
      console.error("Delete FIR error:", error);
      res.status(500).json({ message: "Failed to delete FIR record" });
    }
  });

  // Statistics route
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Get statistics error:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Debug routes
  app.get("/api/debug/db-check", async (req, res) => {
    try {
      console.log("🔍 Testing database connection...");
      
      // Test if we can count FIR records
      const count = await storage.getAllFirRecords();
      console.log("✅ Database connected. FIR records count:", count.length);
      
      res.json({ 
        status: "success", 
        message: "Database is working",
        firCount: count.length 
      });
    } catch (error) {
      console.error("❌ Database test failed:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/debug/firs-status", async (req, res) => {
  try {
    const allFirs = await storage.getAllFirRecords();
    console.log("📊 FIR Status - Records from storage:", allFirs.length);
    
    res.json({
      storageRecords: allFirs.length,
      records: allFirs
    });
  } catch (error) {
    console.error("❌ FIR status check failed:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

  // Export routes
  app.get("/api/export/criminals/pdf", async (req, res) => {
    try {
      res.json({ message: "PDF export functionality would be implemented here" });
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ message: "Failed to export PDF" });
    }
  });

  app.get("/api/export/criminals/excel", async (req, res) => {
    try {
      res.json({ message: "Excel export functionality would be implemented here" });
    } catch (error) {
      console.error("Excel export error:", error);
      res.status(500).json({ message: "Failed to export Excel" });
    }
  });

  // Crime Prediction ML Routes
  app.get("/api/predict/all", async (req, res) => {
    try {
      const predictions = crimePredictor.getAllPredictions();
      res.json(predictions);
    } catch (error) {
      console.error("Get predictions error:", error);
      res.status(500).json({ message: "Failed to get predictions" });
    }
  });

  app.get("/api/predict/top-risk", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topCities = crimePredictor.getTopRiskCities(limit);
      res.json(topCities);
    } catch (error) {
      console.error("Get top risk cities error:", error);
      res.status(500).json({ message: "Failed to get top risk cities" });
    }
  });

  app.get("/api/predict/city/:name", async (req, res) => {
    try {
      const prediction = crimePredictor.getCityPrediction(req.params.name);
      if (!prediction) {
        return res.status(404).json({ message: "City not found" });
      }
      res.json(prediction);
    } catch (error) {
      console.error("Get city prediction error:", error);
      res.status(500).json({ message: "Failed to get city prediction" });
    }
  });

  app.get("/api/predict/distribution", async (req, res) => {
    try {
      const distribution = crimePredictor.getCrimeDistribution();
      res.json(distribution);
    } catch (error) {
      console.error("Get crime distribution error:", error);
      res.status(500).json({ message: "Failed to get crime distribution" });
    }
  });

  app.get("/api/predict/statistics", async (req, res) => {
    try {
      const stats = crimePredictor.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Get prediction statistics error:", error);
      res.status(500).json({ message: "Failed to get statistics" });
    }
  });

  // Initialize ML model
  try {
    await crimePredictor.loadData();
    console.log("✅ Crime prediction ML model loaded successfully");
  } catch (error) {
    console.error("❌ Failed to load ML model:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}