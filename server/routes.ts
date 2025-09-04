import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCriminalRecordSchema, insertFirRecordSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";

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
      if (error.name === 'ZodError') {
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
      res.status(500).json({ message: "Failed to fetch criminal record" });
    }
  });

  app.post("/api/criminals", upload.single('photo'), async (req, res) => {
    try {
      const recordData = insertCriminalRecordSchema.parse(req.body);
      
      // Handle photo upload
      if (req.file) {
        const photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        recordData.photo = photoBase64;
      }
      
      const record = await storage.createCriminalRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error.name === 'ZodError') {
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
      res.status(500).json({ message: "Failed to delete criminal record" });
    }
  });

  // FIR records routes
  app.get("/api/firs", async (req, res) => {
    try {
      const { search } = req.query;
      
      if (search) {
        const records = await storage.searchFirRecords(search as string, {});
        res.json(records);
      } else {
        const records = await storage.getAllFirRecords();
        res.json(records);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FIR records" });
    }
  });

  app.post("/api/firs", async (req, res) => {
    try {
      const firData = insertFirRecordSchema.parse(req.body);
      const record = await storage.createFirRecord(firData);
      res.status(201).json(record);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid FIR data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create FIR record" });
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
      res.status(500).json({ message: "Failed to update FIR record" });
    }
  });

  // Statistics route
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Export routes
  app.get("/api/export/criminals/pdf", async (req, res) => {
    try {
      // This would generate a PDF report
      res.json({ message: "PDF export functionality would be implemented here" });
    } catch (error) {
      res.status(500).json({ message: "Failed to export PDF" });
    }
  });

  app.get("/api/export/criminals/excel", async (req, res) => {
    try {
      // This would generate an Excel report
      res.json({ message: "Excel export functionality would be implemented here" });
    } catch (error) {
      res.status(500).json({ message: "Failed to export Excel" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
