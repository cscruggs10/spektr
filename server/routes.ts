import type { Express, Request, Response } from "express";

// Extend Request interface for authentication
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        name: string;
        role: string;
      };
      isAuthenticated(): boolean;
    }
  }
}
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { cloudinaryUpload } from "./cloudinary";
import { localUpload } from "./local-upload";
import { 
  insertUserSchema, insertDealerSchema, insertInspectorSchema, 
  insertBuyBoxItemSchema, insertAuctionSchema, insertAuctionScheduleSchema, insertRunlistSchema,
  insertVehicleSchema, insertInspectionTemplateSchema, insertInspectionSchema,
  insertInspectionResultSchema, insertPurchaseSchema, insertColumnMappingSchema,
  insertActivityLogSchema, insertVehicleMakeAliasSchema, insertVehicleModelAliasSchema,
  insertVehicleMakeSchema, insertVehicleModelSchema,
  vehicles, runlists, users, inspectionResults
} from "@shared/schema";
import * as NHTSAService from "./services/nhtsa";
import { ExcelService } from "./services/excel";
import { ZodError } from "zod";
import { parse } from "csv-parse";
import ExcelJS from "exceljs";

// Configure multer storage for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Default upload for CSV/Excel files
const fileUpload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for spreadsheet files
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV, XLS, XLSX files for data uploads
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return cb(null, true);
    }
    cb(new Error("Only CSV, XLS, and XLSX files are allowed"));
  },
});

// Media upload (photos, videos, etc.)
const mediaUpload = multer({
  storage: storage_config,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for media
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (
      file.mimetype.startsWith("image/") || 
      file.mimetype.startsWith("video/") ||
      file.mimetype === "audio/webm" || 
      file.mimetype === "audio/mpeg"
    ) {
      return cb(null, true);
    }
    cb(new Error("Only images, videos, and audio files are allowed"));
  },
});

function handleZodError(error: ZodError, res: Response) {
  const formattedErrors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
  return res.status(400).json({ error: "Validation failed", details: formattedErrors });
}

// Helper to log activity
async function logActivity(userId: number, action: string, details: any = {}) {
  try {
    await storage.createActivityLog({
      user_id: userId,
      action,
      details
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add authentication middleware
  app.use((req, res, next) => {
    // Mock authentication for now - in production this would use sessions/JWT
    req.user = {
      id: 1,
      username: "admin",
      name: "Administrator",
      role: "admin"
    };
    req.isAuthenticated = () => true;
    next();
  });

  // Health check endpoint for Railway
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  const router = app.route("/api");

  // ------------------------
  // Users and Auth routes
  // ------------------------
  
  // Get current user (placeholder for auth implementation)
  app.get("/api/users/current", async (req, res) => {
    // Placeholder - would typically use session/JWT
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(user);
  });

  // Create a user
  app.post("/api/users", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ 
          error: "Username already exists" 
        });
      }
      
      const user = await storage.createUser(validation.data);
      
      // Log activity
      await logActivity(7, "User created", { 
        user_id: user.id, 
        username: user.username,
        role: user.role
      });
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // ------------------------
  // Dashboard routes
  // ------------------------
  
  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get activity logs
  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Vehicle Make/Model Normalization Routes
  
  // Get make aliases
  app.get("/api/make-aliases", async (req, res) => {
    try {
      const auctionId = req.query.auctionId ? parseInt(req.query.auctionId as string) : undefined;
      const aliases = await storage.getVehicleMakeAliases(auctionId);
      res.json(aliases);
    } catch (error) {
      console.error("Error fetching make aliases:", error);
      res.status(500).json({ error: "Failed to fetch make aliases" });
    }
  });

  // Create make alias
  app.post("/api/make-aliases", async (req, res) => {
    try {
      const { canonical_make, alias, auction_id } = req.body;
      
      if (!canonical_make || !alias) {
        return res.status(400).json({ error: "Canonical make and alias are required" });
      }
      
      const newAlias = await storage.createVehicleMakeAlias({
        canonical_make,
        alias,
        auction_id: auction_id || null
      });
      
      // Log activity
      if (req.isAuthenticated() && req.user) {
        await storage.createActivityLog({
          user_id: req.user.id,
          action: "Create Make Alias",
          details: { make: canonical_make, alias: alias }
        });
      }
      
      res.status(201).json(newAlias);
    } catch (error) {
      console.error("Error creating make alias:", error);
      res.status(500).json({ error: "Failed to create make alias" });
    }
  });

  // Delete make alias
  app.delete("/api/make-aliases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicleMakeAlias(id);
      
      // Log activity
      if (req.isAuthenticated() && req.user) {
        await storage.createActivityLog({
          user_id: req.user.id,
          action: "Delete Make Alias",
          details: { id }
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting make alias:", error);
      res.status(500).json({ error: "Failed to delete make alias" });
    }
  });

  // Get model aliases
  app.get("/api/model-aliases", async (req, res) => {
    try {
      const { make } = req.query;
      const auctionId = req.query.auctionId ? parseInt(req.query.auctionId as string) : undefined;
      
      if (!make) {
        return res.status(400).json({ error: "Make parameter is required" });
      }
      
      const aliases = await storage.getVehicleModelAliases(make as string, auctionId);
      res.json(aliases);
    } catch (error) {
      console.error("Error fetching model aliases:", error);
      res.status(500).json({ error: "Failed to fetch model aliases" });
    }
  });

  // Create model alias
  app.post("/api/model-aliases", async (req, res) => {
    try {
      const { make, canonical_model, alias, auction_id } = req.body;
      
      if (!make || !canonical_model || !alias) {
        return res.status(400).json({ error: "Make, canonical model, and alias are required" });
      }
      
      const newAlias = await storage.createVehicleModelAlias({
        make,
        canonical_model,
        alias,
        auction_id: auction_id || null
      });
      
      // Log activity
      if (req.isAuthenticated()) {
        await storage.createActivityLog({
          user_id: req.user.id,
          action: "Create Model Alias",
          details: { make, model: canonical_model, alias }
        });
      }
      
      res.status(201).json(newAlias);
    } catch (error) {
      console.error("Error creating model alias:", error);
      res.status(500).json({ error: "Failed to create model alias" });
    }
  });

  // Delete model alias
  app.delete("/api/model-aliases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicleModelAlias(id);
      
      // Log activity
      if (req.isAuthenticated()) {
        await storage.createActivityLog({
          user_id: req.user.id,
          action: "Delete Model Alias",
          details: { id }
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting model alias:", error);
      res.status(500).json({ error: "Failed to delete model alias" });
    }
  });

  // Normalize vehicle make/model
  app.post("/api/normalize-vehicle", async (req, res) => {
    try {
      const { make, model, auction_id } = req.body;
      
      if (!make) {
        return res.status(400).json({ error: "Make is required" });
      }
      
      const normalizedMake = await storage.normalizeVehicleMake(make, auction_id);
      const normalizedModel = model ? await storage.normalizeVehicleModel(make, model, auction_id) : null;
      
      res.json({
        original: { make, model: model || null },
        normalized: { make: normalizedMake, model: normalizedModel }
      });
    } catch (error) {
      console.error("Error normalizing vehicle:", error);
      res.status(500).json({ error: "Failed to normalize vehicle" });
    }
  });

  // Get upcoming inspections for dashboard
  app.get("/api/dashboard/upcoming-inspections", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const inspections = await storage.getUpcomingInspections(limit);
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching upcoming inspections:", error);
      res.status(500).json({ error: "Failed to fetch upcoming inspections" });
    }
  });

  // ------------------------
  // Dealer routes
  // ------------------------
  
  // Get all dealers
  app.get("/api/dealers", async (req, res) => {
    try {
      const dealers = await storage.getDealers();
      res.json(dealers);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      res.status(500).json({ error: "Failed to fetch dealers" });
    }
  });

  // Get a specific dealer
  app.get("/api/dealers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dealer = await storage.getDealer(id);
      
      if (!dealer) {
        return res.status(404).json({ error: "Dealer not found" });
      }
      
      res.json(dealer);
    } catch (error) {
      console.error("Error fetching dealer:", error);
      res.status(500).json({ error: "Failed to fetch dealer" });
    }
  });

  // Create a dealer
  app.post("/api/dealers", async (req, res) => {
    try {
      const validation = insertDealerSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const dealer = await storage.createDealer(validation.data);
      
      // Log activity
      await logActivity(7, "Dealer created", { 
        dealer_id: dealer.id, 
        name: dealer.name
      });
      
      res.status(201).json(dealer);
    } catch (error) {
      console.error("Error creating dealer:", error);
      res.status(500).json({ error: "Failed to create dealer" });
    }
  });

  // Update a dealer
  app.patch("/api/dealers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dealer = await storage.getDealer(id);
      
      if (!dealer) {
        return res.status(404).json({ error: "Dealer not found" });
      }
      
      const validation = insertDealerSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const updatedDealer = await storage.updateDealer(id, validation.data);
      
      // Log activity
      await logActivity(7, "Dealer updated", { 
        dealer_id: id, 
        updates: req.body
      });
      
      res.json(updatedDealer);
    } catch (error) {
      console.error("Error updating dealer:", error);
      res.status(500).json({ error: "Failed to update dealer" });
    }
  });

  // ------------------------
  // Inspector routes
  // ------------------------
  
  // Get all inspectors
  app.get("/api/inspectors", async (req, res) => {
    try {
      const inspectors = await storage.getInspectors();
      res.json(inspectors);
    } catch (error) {
      console.error("Error fetching inspectors:", error);
      res.status(500).json({ error: "Failed to fetch inspectors" });
    }
  });
  
  // Get auctions assigned to an inspector
  app.get("/api/inspectors/:id/auctions", async (req, res) => {
    try {
      const inspectorId = parseInt(req.params.id);
      const inspector = await storage.getInspector(inspectorId);
      
      if (!inspector) {
        return res.status(404).json({ error: "Inspector not found" });
      }
      
      const assignments = await storage.getInspectorAuctions(inspectorId);
      
      // Get the full auction details for each assignment
      const auctions = await Promise.all(
        assignments.map(async (assignment) => {
          return await storage.getAuction(assignment.auction_id);
        })
      );
      
      // Filter out any undefined auctions (in case an auction was deleted)
      res.json(auctions.filter(Boolean));
    } catch (error) {
      console.error("Error fetching auctions by inspector:", error);
      res.status(500).json({ error: "Failed to fetch auctions" });
    }
  });
  
  // Assign inspector to auction
  app.post("/api/inspectors/:id/auctions", async (req, res) => {
    try {
      const inspectorId = parseInt(req.params.id);
      const inspector = await storage.getInspector(inspectorId);
      
      if (!inspector) {
        return res.status(404).json({ error: "Inspector not found" });
      }
      
      const { auction_id } = req.body;
      
      if (!auction_id) {
        return res.status(400).json({ error: "auction_id is required" });
      }
      
      const auctionId = parseInt(auction_id);
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }
      
      const assignment = await storage.assignInspectorToAuction({
        inspector_id: inspectorId,
        auction_id: auctionId
      });
      
      // Log activity
      await logActivity(7, "Inspector assigned to auction", { 
        inspector_id: inspectorId,
        auction_id: auctionId
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning inspector to auction:", error);
      res.status(500).json({ error: "Failed to assign inspector to auction" });
    }
  });
  
  // Remove inspector from auction
  app.delete("/api/inspectors/:inspectorId/auctions/:auctionId", async (req, res) => {
    try {
      const inspectorId = parseInt(req.params.inspectorId);
      const auctionId = parseInt(req.params.auctionId);
      
      const inspector = await storage.getInspector(inspectorId);
      if (!inspector) {
        return res.status(404).json({ error: "Inspector not found" });
      }
      
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }
      
      await storage.removeInspectorFromAuction(inspectorId, auctionId);
      
      // Log activity
      await logActivity(7, "Inspector removed from auction", { 
        inspector_id: inspectorId,
        auction_id: auctionId
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing inspector from auction:", error);
      res.status(500).json({ error: "Failed to remove inspector from auction" });
    }
  });

  // Create an inspector
  app.post("/api/inspectors", async (req, res) => {
    try {
      const validation = insertInspectorSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const inspector = await storage.createInspector(validation.data);
      
      // Log activity
      await logActivity(7, "Inspector created", { 
        inspector_id: inspector.id, 
        user_id: inspector.user_id
      });
      
      res.status(201).json(inspector);
    } catch (error) {
      console.error("Error creating inspector:", error);
      res.status(500).json({ error: "Failed to create inspector" });
    }
  });

  // Update an inspector
  app.patch("/api/inspectors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inspector = await storage.getInspector(id);
      
      if (!inspector) {
        return res.status(404).json({ error: "Inspector not found" });
      }
      
      const updatedInspector = await storage.updateInspector(id, req.body);
      
      // Log activity
      await logActivity(7, "Inspector updated", { 
        inspector_id: id, 
        updates: req.body
      });
      
      res.json(updatedInspector);
    } catch (error) {
      console.error("Error updating inspector:", error);
      res.status(500).json({ error: "Failed to update inspector" });
    }
  });

  // ------------------------
  // Buy Box routes
  // ------------------------
  
  // Export buy box items to Excel
  app.get("/api/buy-box/export", async (req, res) => {
    try {
      const dealerId = req.query.dealerId ? parseInt(req.query.dealerId as string) : undefined;
      
      // Get the buy box items
      const items = await storage.getBuyBoxItems(dealerId);
      
      // Get dealer information if dealerId is provided
      let dealer = undefined;
      if (dealerId) {
        dealer = await storage.getDealer(dealerId);
      }
      
      // Generate Excel buffer
      const excelBuffer = await ExcelService.generateBuyBoxExcel(items, dealer);
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=buy-box-${dealerId || 'all'}-${Date.now()}.xlsx`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      // Log activity
      await logActivity(7, "Buy box exported", { 
        dealer_id: dealerId,
        item_count: items.length
      });
      
      // Send the file
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting buy box items:", error);
      res.status(500).json({ error: "Failed to export buy box items" });
    }
  });
  
  // Get all buy box items
  app.get("/api/buy-box", async (req, res) => {
    try {
      const dealerId = req.query.dealerId ? parseInt(req.query.dealerId as string) : undefined;
      const items = await storage.getBuyBoxItems(dealerId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching buy box items:", error);
      res.status(500).json({ error: "Failed to fetch buy box items" });
    }
  });

  // Get a specific buy box item
  app.get("/api/buy-box/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getBuyBoxItem(id);
      
      if (!item) {
        return res.status(404).json({ error: "Buy box item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching buy box item:", error);
      res.status(500).json({ error: "Failed to fetch buy box item" });
    }
  });

  // Create a buy box item
  app.post("/api/buy-box", async (req, res) => {
    try {
      const validation = insertBuyBoxItemSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const item = await storage.createBuyBoxItem(validation.data);
      
      // Log activity
      await logActivity(7, "Buy box item created", { 
        item_id: item.id, 
        dealer_id: item.dealer_id,
        make: item.make,
        model: item.model
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating buy box item:", error);
      res.status(500).json({ error: "Failed to create buy box item" });
    }
  });

  // Update a buy box item
  app.patch("/api/buy-box/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getBuyBoxItem(id);
      
      if (!item) {
        return res.status(404).json({ error: "Buy box item not found" });
      }
      
      const validation = insertBuyBoxItemSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const updatedItem = await storage.updateBuyBoxItem(id, validation.data);
      
      // Log activity
      await logActivity(7, "Buy box item updated", { 
        item_id: id, 
        updates: req.body
      });
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating buy box item:", error);
      res.status(500).json({ error: "Failed to update buy box item" });
    }
  });

  // Delete a buy box item
  app.delete("/api/buy-box/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getBuyBoxItem(id);
      
      if (!item) {
        return res.status(404).json({ error: "Buy box item not found" });
      }
      
      await storage.deleteBuyBoxItem(id);
      
      // Log activity
      await logActivity(7, "Buy box item deleted", { 
        item_id: id,
        dealer_id: item.dealer_id,
        make: item.make,
        model: item.model
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting buy box item:", error);
      res.status(500).json({ error: "Failed to delete buy box item" });
    }
  });
  
  // Duplicate a buy box item to another dealer
  app.post("/api/buy-box/:id/duplicate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { dealerId } = req.body;
      
      if (!dealerId) {
        return res.status(400).json({ error: "Dealer ID is required" });
      }
      
      const sourceItem = await storage.getBuyBoxItem(id);
      
      if (!sourceItem) {
        return res.status(404).json({ error: "Buy box item not found" });
      }
      
      // Create a new item with the same criteria but for the new dealer
      const { id: sourceId, created_at, ...itemData } = sourceItem;
      const newItem = await storage.createBuyBoxItem({
        ...itemData,
        dealer_id: parseInt(dealerId)
      });
      
      // Log activity
      await logActivity(7, "Buy box item duplicated", { 
        source_item_id: sourceId,
        new_item_id: newItem.id,
        source_dealer_id: sourceItem.dealer_id,
        target_dealer_id: dealerId,
        make: sourceItem.make,
        model: sourceItem.model
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error duplicating buy box item:", error);
      res.status(500).json({ error: "Failed to duplicate buy box item" });
    }
  });

  // ------------------------
  // Auction routes
  // ------------------------
  
  // Get all auctions
  app.get("/api/auctions", async (req, res) => {
    try {
      const auctions = await storage.getAuctions();
      
      // Enhance auctions with inspector count
      const enhancedAuctions = await Promise.all(
        auctions.map(async (auction) => {
          const inspectors = await storage.getInspectorsByAuction(auction.id);
          return {
            ...auction,
            inspector_count: inspectors.length
          };
        })
      );
      
      res.json(enhancedAuctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      res.status(500).json({ error: "Failed to fetch auctions" });
    }
  });
  
  // Get inspectors assigned to an auction
  app.get("/api/auctions/:id/inspectors", async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }
      
      const inspectors = await storage.getInspectorsByAuction(auctionId);
      res.json(inspectors);
    } catch (error) {
      console.error("Error fetching inspectors by auction:", error);
      res.status(500).json({ error: "Failed to fetch inspectors" });
    }
  });

  // Get a specific auction
  app.get("/api/auctions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auction = await storage.getAuction(id);
      
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }
      
      res.json(auction);
    } catch (error) {
      console.error("Error fetching auction:", error);
      res.status(500).json({ error: "Failed to fetch auction" });
    }
  });

  // Create an auction
  app.post("/api/auctions", async (req, res) => {
    try {
      console.log("=== AUCTION CREATION REQUEST ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Headers:", JSON.stringify(req.headers, null, 2));
      console.log("Environment:", {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : "[NOT SET]"
      });
      
      const validation = insertAuctionSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.error("Validation failed:", validation.error);
        return handleZodError(validation.error, res);
      }
      
      console.log("Validation passed, creating auction with data:", validation.data);
      
      // Transform data for Railway compatibility - handle both local and Railway schemas
      const auctionData = {
        name: validation.data.name,
        description: validation.data.description,
        location: validation.data.location,
        // Include address for local schema compatibility
        ...(validation.data.address && { address: validation.data.address }),
        // Include Railway-specific fields with defaults
        date: new Date(),
        status: "active"
      };
      
      console.log("Transformed auction data for database:", auctionData);
      
      // Database diagnostics
      console.log("=== DATABASE DIAGNOSTICS ===");
      console.log("Storage object type:", typeof storage);
      console.log("Storage createAuction method:", typeof storage.createAuction);
      
      try {
        console.log("Testing database connection...");
        // Test basic database access through storage layer
        const existingAuctions = await storage.getAuctions();
        console.log("Database connection successful, existing auctions count:", existingAuctions.length);
        console.log("Sample auction data:", existingAuctions.slice(0, 1));
      } catch (dbError) {
        console.error("Database connection test failed:", dbError);
        throw new Error(`Database connection failed: ${dbError.message}`);
      }
      
      console.log("Attempting to create auction...");
      const auction = await storage.createAuction(auctionData);
      
      console.log("Auction created successfully:", auction);
      
      // Log activity
      await logActivity(7, "Auction created", { 
        auction_id: auction.id, 
        name: auction.name
      });
      
      console.log("Activity logged successfully");
      
      res.status(201).json(auction);
    } catch (error) {
      console.error("=== AUCTION CREATION ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Request body at time of error:", JSON.stringify(req.body, null, 2));
      console.error("Database connection status:", typeof storage);
      console.error("===============================");
      res.status(500).json({ error: "Failed to create auction" });
    }
  });

  // Delete an auction
  app.delete("/api/auctions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid auction ID" });
      }

      // Check if auction exists
      const auction = await storage.getAuction(id);
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }

      // Delete the auction
      const deleted = await storage.deleteAuction(id);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete auction" });
      }

      // Log the activity
      await logActivity(7, "Auction deleted", { 
        auction_id: id, 
        name: auction.name
      });

      res.status(200).json({ message: "Auction deleted successfully" });
    } catch (error) {
      console.error("Error deleting auction:", error);
      res.status(500).json({ error: "Failed to delete auction" });
    }
  });

  // ------------------------
  // Auction Schedule routes
  // ------------------------

  // Get auction schedules (optionally filtered by auction)
  app.get("/api/auction-schedules", async (req, res) => {
    try {
      const auctionId = req.query.auctionId ? parseInt(req.query.auctionId as string) : undefined;
      const schedules = await storage.getAuctionSchedules(auctionId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching auction schedules:", error);
      res.status(500).json({ error: "Failed to fetch auction schedules" });
    }
  });

  // Get a specific auction schedule
  app.get("/api/auction-schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getAuctionSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ error: "Auction schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching auction schedule:", error);
      res.status(500).json({ error: "Failed to fetch auction schedule" });
    }
  });

  // Create an auction schedule
  app.post("/api/auction-schedules", async (req, res) => {
    try {
      const validation = insertAuctionScheduleSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const schedule = await storage.createAuctionSchedule(validation.data);
      
      // Log activity
      await logActivity(7, "Auction Schedule Created", { 
        scheduleId: schedule.id,
        auctionId: schedule.auction_id,
        dayType: schedule.day_type
      });
      
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating auction schedule:", error);
      res.status(500).json({ error: "Failed to create auction schedule" });
    }
  });

  // Update an auction schedule
  app.patch("/api/auction-schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingSchedule = await storage.getAuctionSchedule(id);
      
      if (!existingSchedule) {
        return res.status(404).json({ error: "Auction schedule not found" });
      }
      
      const validation = insertAuctionScheduleSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const updatedSchedule = await storage.updateAuctionSchedule(id, validation.data);
      
      // Log activity
      await logActivity(7, "Auction Schedule Updated", { 
        scheduleId: id
      });
      
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error updating auction schedule:", error);
      res.status(500).json({ error: "Failed to update auction schedule" });
    }
  });

  // Delete an auction schedule
  app.delete("/api/auction-schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingSchedule = await storage.getAuctionSchedule(id);
      
      if (!existingSchedule) {
        return res.status(404).json({ error: "Auction schedule not found" });
      }
      
      await storage.deleteAuctionSchedule(id);
      
      // Log activity
      await logActivity(7, "Auction Schedule Deleted", { 
        scheduleId: id,
        auctionId: existingSchedule.auction_id
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting auction schedule:", error);
      res.status(500).json({ error: "Failed to delete auction schedule" });
    }
  });

  // ------------------------
  // Column Mapping routes
  // ------------------------
  
  // Get column mappings
  app.get("/api/column-mappings", async (req, res) => {
    try {
      const auctionId = req.query.auctionId ? parseInt(req.query.auctionId as string) : undefined;
      const mappings = await storage.getColumnMappings(auctionId);
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching column mappings:", error);
      res.status(500).json({ error: "Failed to fetch column mappings" });
    }
  });

  // Get a specific column mapping
  app.get("/api/column-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mapping = await storage.getColumnMapping(id);
      
      if (!mapping) {
        return res.status(404).json({ error: "Column mapping not found" });
      }
      
      res.json(mapping);
    } catch (error) {
      console.error("Error fetching column mapping:", error);
      res.status(500).json({ error: "Failed to fetch column mapping" });
    }
  });

  // Create a column mapping
  app.post("/api/column-mappings", async (req, res) => {
    try {
      const validation = insertColumnMappingSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const mapping = await storage.createColumnMapping(validation.data);
      
      // Log activity
      await logActivity(7, "Column Mapping Created", { 
        mapping_id: mapping.id,
        auction_id: mapping.auction_id,
        name: mapping.name
      });
      
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating column mapping:", error);
      res.status(500).json({ error: "Failed to create column mapping" });
    }
  });

  // Update a column mapping
  app.patch("/api/column-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mapping = await storage.getColumnMapping(id);
      
      if (!mapping) {
        return res.status(404).json({ error: "Column mapping not found" });
      }
      
      const validation = insertColumnMappingSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const updatedMapping = await storage.updateColumnMapping(id, validation.data);
      
      // Log activity
      await logActivity(7, "Column Mapping Updated", { 
        mapping_id: id,
        name: mapping.name
      });
      
      res.json(updatedMapping);
    } catch (error) {
      console.error("Error updating column mapping:", error);
      res.status(500).json({ error: "Failed to update column mapping" });
    }
  });

  // ------------------------
  // Runlist routes
  // ------------------------
  
  // Get runlists
  app.get("/api/runlists", async (req, res) => {
    try {
      const runlists = await storage.getRunlists();
      res.json(runlists);
    } catch (error) {
      console.error("Error fetching runlists:", error);
      res.status(500).json({ error: "Failed to fetch runlists" });
    }
  });

  // Get a specific runlist
  app.get("/api/runlists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const runlist = await storage.getRunlist(id);
      
      if (!runlist) {
        return res.status(404).json({ error: "Runlist not found" });
      }
      
      res.json(runlist);
    } catch (error) {
      console.error("Error fetching runlist:", error);
      res.status(500).json({ error: "Failed to fetch runlist" });
    }
  });

  // Upload a runlist (without processing)
  app.post("/api/runlists/upload", fileUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const auctionId = parseInt(req.body.auctionId);
      
      if (isNaN(auctionId)) {
        return res.status(400).json({ error: "Valid auction ID is required" });
      }
      
      // Parse inspection date
      let inspectionDate = null;
      if (req.body.inspectionDate) {
        try {
          // Support multiple date formats
          let date;
          
          // Try parsing as ISO or date string first
          date = new Date(req.body.inspectionDate);
          
          // If that fails, try parsing from parts
          if (isNaN(date.getTime()) && typeof req.body.inspectionDate === 'string') {
            const dateParts = req.body.inspectionDate.split('-');
            if (dateParts.length === 3) {
              const year = parseInt(dateParts[0], 10);
              const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
              const day = parseInt(dateParts[2], 10);
              
              date = new Date(year, month, day);
            }
          }
          
          // Ensure the date is valid before using it
          if (date && !isNaN(date.getTime())) {
            // Format as ISO string for PostgreSQL compatibility
            inspectionDate = date.toISOString();
          } else {
            console.error("Could not parse inspection date:", req.body.inspectionDate);
          }
        } catch (error) {
          console.error("Invalid inspection date format:", error);
        }
      }
      
      // Create runlist entry with inspection date handling
      const runlistData: any = {
        auction_id: auctionId,
        filename: req.file.originalname,
        processed: false,
        uploaded_by: 1, // Hardcoded for now
      };
      
      // Only include inspection_date if we have a valid date
      if (inspectionDate && typeof inspectionDate === 'string') {
        try {
          // For Drizzle with PostgreSQL, we need to use a proper Date object for timestamp columns
          // It will be converted to the proper format by the ORM
          // This is a fix for the "value.toISOString is not a function" error
          runlistData.inspection_date = new Date(inspectionDate);
        } catch (err) {
          console.error("Invalid date format, ignoring inspection date", err);
        }
      }
      
      // Create runlist entry without processing the CSV yet
      const runlist = await storage.createRunlist(runlistData);
      
      // Store file path for later processing
      const filePath = req.file.path;
      
      try {
        // First check the actual file content to determine type
        const fileBuffer = fs.readFileSync(filePath);
        let records: any[] = [];
        
        // Check if it's a binary file (likely Excel)
        const isBinary = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(fileBuffer.toString().substring(0, 1000));
        
        if (isBinary) {
          return res.status(400).json({ 
            error: "Excel or binary files are not supported. Please convert to CSV and try again." 
          });
        }
        
        try {
          // Try to parse as CSV
          const parser = fs
            .createReadStream(filePath)
            .pipe(parse({
              columns: true,
              skipEmptyLines: true,
              trim: true,
              relaxColumnCount: true,
              relax_quotes: true,
              skip_empty_lines: true
            }));
          
          for await (const record of parser) {
            records.push(record);
          }
        } catch (csvError) {
          console.error("CSV parsing error:", csvError);
          return res.status(400).json({ 
            error: "Failed to parse the file as CSV. Please ensure it's a valid CSV file."
          });
        }
        
        // Check for existing column mapping
        let columnMapping = await storage.getColumnMappings(auctionId);
        const hasMapping = columnMapping && columnMapping.length > 0;
        
        if (records.length === 0) {
          return res.status(400).json({ error: "No valid records found in the CSV file" });
        }
        
        // Store the file path for later processing
        try {
          fs.copyFileSync(filePath, path.join("uploads", runlist.filename));
        } catch (copyError) {
          console.error("Error copying file to uploads directory:", copyError);
        }
        
        // If we don't have a mapping, return the runlist with a sample record for column mapping
        if (!hasMapping) {
          // Log activity for the upload itself
          await logActivity(7, "Runlist uploaded, waiting for column mapping", { 
            runlist_id: runlist.id,
            auction_id: auctionId,
            record_count: records.length
          });
          
          res.status(201).json({ 
            runlist,
            needs_mapping: true,
            sample_record: records[0]
          });
          return;
        }
        
        // If we have a mapping, process the file now
        // Extract vehicles from the records and enrich with NHTSA data
        const vehicles = [];
        for (const record of records) {
          const vehicleData = mapRecordToVehicle(record, columnMapping[0], runlist.id);
          
          // If we have a VIN, attempt to fetch data from NHTSA API
          if (vehicleData.vin) {
            try {
              console.log(`Fetching NHTSA data for VIN: ${vehicleData.vin}`);
              const vinInfo = await NHTSAService.getVehicleInfoFromVin(vehicleData.vin);
              
              // Enrich vehicle data with NHTSA information
              if (vinInfo && vinInfo.make && vinInfo.model) {
                vehicleData.make = vinInfo.make;
                vehicleData.model = vinInfo.model;
                
                if (vinInfo.year) {
                  vehicleData.year = parseInt(vinInfo.year);
                }
                
                // Add body style if available
                if (vinInfo.bodyStyle) {
                  vehicleData.body_type = vinInfo.bodyStyle;
                }
                
                console.log(`NHTSA data success for VIN: ${vehicleData.vin}`, 
                          {make: vinInfo.make, model: vinInfo.model, year: vinInfo.year});
              }
            } catch (error) {
              console.error(`Error fetching NHTSA data for VIN: ${vehicleData.vin}`, error);
              // Continue with basic vehicle data even if NHTSA lookup fails
            }
          }
          
          vehicles.push(vehicleData);
        }
        
        // Save vehicles to database
        await storage.bulkCreateVehicles(vehicles);
        
        // Set runlist as processed
        await storage.updateRunlist(runlist.id, { processed: true });
        
        // Match vehicles against buy box
        const createdVehicles = await storage.getVehicles(runlist.id);
        const buyBoxMatches = await storage.matchVehiclesToBuyBoxes(createdVehicles);
        
        // Log activity
        await logActivity(7, "Runlist uploaded and processed", { 
          runlist_id: runlist.id,
          auction_id: auctionId,
          vehicle_count: vehicles.length,
          match_count: buyBoxMatches.reduce((count, match) => count + match.matches.length, 0)
        });
        
        res.status(201).json({ 
          runlist,
          vehicle_count: vehicles.length,
          match_count: buyBoxMatches.reduce((count, match) => count + match.matches.length, 0),
          needs_mapping: false
        });
      } catch (parseError) {
        console.error("Error parsing CSV:", parseError);
        res.status(400).json({ error: "Error parsing the file. Make sure it's a valid CSV." });
      } finally {
        // Clean up the temporary file
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Error uploading runlist:", error);
      // Clean up the file if it exists
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      }
      res.status(500).json({ error: "Failed to process runlist" });
    }
  });

  // Get vehicles for a runlist
  app.get("/api/runlists/:id/vehicles", async (req, res) => {
    try {
      const runlistId = parseInt(req.params.id);
      const vehicles = await storage.getVehicles(runlistId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching runlist vehicles:", error);
      res.status(500).json({ error: "Failed to fetch runlist vehicles" });
    }
  });

  // Get buy box matches for a runlist
  app.get("/api/runlists/:id/matches", async (req, res) => {
    try {
      const runlistId = parseInt(req.params.id);
      const vehicles = await storage.getVehicles(runlistId);
      
      if (vehicles.length === 0) {
        return res.json([]);
      }
      
      const matches = await storage.matchVehiclesToBuyBoxes(vehicles);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching runlist matches:", error);
      res.status(500).json({ error: "Failed to fetch runlist matches" });
    }
  });
  
  // Process a runlist from CSV with simplified column mapping
  app.post("/api/runlists/process", fileUpload.single("file"), async (req, res) => {
    try {
      // Validate request
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const {
        auctionId,
        inspectionDate,
        vinColumn,
        laneColumn,
        runColumn
      } = req.body;
      
      if (!auctionId) {
        return res.status(400).json({ error: "Auction ID is required" });
      }
      
      if (!inspectionDate) {
        return res.status(400).json({ error: "Inspection date is required" });
      }
      
      if (!vinColumn) {
        return res.status(400).json({ error: "VIN column mapping is required" });
      }
      
      const auctionIdNumber = parseInt(auctionId);
      const fileName = req.file.originalname;
      
      // Get the auction
      const auction = await storage.getAuction(auctionIdNumber);
      if (!auction) {
        return res.status(404).json({ error: "Auction not found" });
      }
      
      // Create a simple column mapping for the data
      const columnMapping = {
        vin_column: vinColumn,
        lane_column: laneColumn || "",
        run_column: runColumn || ""
      };
      
      // Create a runlist
      const runlist = await storage.createRunlist({
        auction_id: auctionIdNumber,
        filename: fileName,
        column_mapping: columnMapping,
      });
      
      // Save the file path for processing
      const filePath = req.file.path;
      
      // Parse CSV using csv-parse module
      const parser = fs.createReadStream(filePath).pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })
      );
      
      // Track the vehicles and their VINs
      const vehicles = [];
      const processedVins = new Set();
      let vehicleCount = 0;
      
      // Process each record
      for await (const record of parser) {
        vehicleCount++;
        
        // Extract VIN and lane/run data
        const vin = record[vinColumn];
        if (!vin) continue; // Skip records without VIN
        
        // Avoid duplicate VINs
        if (processedVins.has(vin)) continue;
        processedVins.add(vin);
        
        // Extract lane and run data
        const laneNumber = laneColumn && record[laneColumn] ? parseInt(record[laneColumn]) : null;
        const runNumber = runColumn && record[runColumn] ? parseInt(record[runColumn]) : null;
        
        // Create base vehicle data
        const vehicle: any = {
          runlist_id: runlist.id,
          vin: vin,
          make: "Unknown", // Will be updated from NHTSA API
          model: "Unknown", // Will be updated from NHTSA API
          lane_number: laneNumber,
          run_number: runNumber,
          raw_data: record
        };
        
        // Try to get vehicle info from NHTSA API
        if (NHTSAService.isValidVin(vin)) {
          try {
            console.log(`CSV upload: Decoding VIN ${vin}`);
            const vehicleInfo = await NHTSAService.getVehicleInfoFromVin(vin);
            
            if (vehicleInfo) {
              // Basic vehicle info
              if (vehicleInfo.year) {
                vehicle.year = parseInt(vehicleInfo.year);
              }
              vehicle.make = vehicleInfo.make || "Unknown";
              vehicle.model = vehicleInfo.model || "Unknown";
              
              // Add additional vehicle details
              if (vehicleInfo.bodyStyle) {
                vehicle.body_type = vehicleInfo.bodyStyle;
              }
              if (vehicleInfo.trim) {
                vehicle.trim = vehicleInfo.trim;
              }
              
              // Get more detailed information directly from raw NHTSA data
              try {
                const rawData = await NHTSAService.decodeVin(vin);
                if (rawData && typeof rawData === 'object') {
                  // These fields might not be in the standard response interface, 
                  // but we can safely access them from the raw data
                  vehicle.engine = rawData['Engine Configuration'] ? 
                                   String(rawData['Engine Configuration']) : null;
                  vehicle.transmission = rawData['Transmission Style'] ? 
                                       String(rawData['Transmission Style']) : null;
                }
              } catch (error) {
                console.error(`Error fetching detailed NHTSA data for VIN ${vin}:`, error);
                // Continue even if detailed data fetch fails
              }
              
              console.log(`VIN decoded successfully: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`);
            }
          } catch (error) {
            console.error(`Error fetching NHTSA data for VIN ${vin}:`, error);
            // Continue with base vehicle data if NHTSA API fails
          }
        } else {
          console.warn(`Invalid VIN format in CSV upload: ${vin}`);
        }
        
        vehicles.push(vehicle);
        
        // Process in batches of 100 to avoid memory issues with large files
        if (vehicles.length >= 100) {
          await storage.bulkCreateVehicles(vehicles);
          vehicles.length = 0; // Clear the array
        }
      }
      
      // Process any remaining vehicles
      if (vehicles.length > 0) {
        await storage.bulkCreateVehicles(vehicles);
      }
      
      // Mark the runlist as processed
      await storage.updateRunlist(runlist.id, {
        processed: true
      });
      
      // Match vehicles to buy box
      const allVehicles = await storage.getVehicles(runlist.id);
      const matches = await storage.matchVehiclesToBuyBoxes(allVehicles);
      
      // Create inspection records for matched vehicles
      let matchCount = 0;
      for (const match of matches) {
        // Only create inspection if there are matches
        if (match.matches.length > 0) {
          matchCount++;
          
          // Create inspection for each dealer match
          for (const buyBoxItem of match.matches) {
            // Get a template for this dealer
            const templates = await storage.getInspectionTemplates(buyBoxItem.dealer_id);
            const templateId = templates.length > 0 ? templates[0].id : 1; // Use first template or default
            
            // Parse inspection date
            const scheduledDate = new Date(inspectionDate);
            
            // Create inspection
            await storage.createInspection({
              vehicle_id: match.vehicle.id,
              dealer_id: buyBoxItem.dealer_id,
              inspector_id: null, // Will be assigned later
              template_id: templateId,
              status: "pending",
              scheduled_date: scheduledDate,
              notes: `Auto-matched from runlist ${runlist.id}`
            });
          }
        }
      }
      
      // Clean up the file
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
      
      // Log activity
      await logActivity(7, "Runlist processed", { 
        runlist_id: runlist.id,
        vehicle_count: vehicleCount,
        match_count: matchCount
      });
      
      res.json({
        runlist,
        vehicleCount,
        matchCount,
      });
    } catch (error) {
      console.error("Error processing runlist:", error);
      res.status(500).json({ error: "Failed to process runlist" });
    }
  });
  
  // Process a runlist using column mapping
  app.post("/api/runlists/:id/process", async (req, res) => {
    try {
      const runlistId = parseInt(req.params.id);
      const runlist = await storage.getRunlist(runlistId);
      
      if (!runlist) {
        return res.status(404).json({ error: "Runlist not found" });
      }
      
      // Get existing column mappings for this auction
      const columnMappings = await storage.getColumnMappings(runlist.auction_id);
      
      if (columnMappings.length === 0) {
        return res.status(400).json({ error: "No column mapping found for this auction" });
      }
      
      const filePath = path.join("uploads", runlist.filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({ error: "Runlist file not found" });
      }
      
      // Process the CSV file with the mapping
      try {
        const fileBuffer = fs.readFileSync(filePath);
        let records: any[] = [];
        
        // Parse CSV
        const parser = fs
          .createReadStream(filePath)
          .pipe(parse({
            columns: true,
            skipEmptyLines: true,
            trim: true,
            relaxColumnCount: true,
            relax_quotes: true,
            skip_empty_lines: true
          }));
        
        for await (const record of parser) {
          records.push(record);
        }
        
        if (records.length === 0) {
          return res.status(400).json({ error: "No valid records found in the CSV file" });
        }
        
        // Extract vehicles using the column mapping
        const vehicles = [];
        for (const record of records) {
          const vehicleData = mapRecordToVehicle(record, columnMappings[0], runlistId);
          
          // If we have a VIN, attempt to fetch data from NHTSA API
          if (vehicleData.vin) {
            try {
              console.log(`Fetching NHTSA data for VIN: ${vehicleData.vin}`);
              const vinInfo = await NHTSAService.getVehicleInfoFromVin(vehicleData.vin);
              
              // Enrich vehicle data with NHTSA information if available
              if (vinInfo && vinInfo.make && vinInfo.model) {
                vehicleData.make = vinInfo.make;
                vehicleData.model = vinInfo.model;
                
                if (vinInfo.year) {
                  vehicleData.year = parseInt(vinInfo.year);
                }
                
                if (vinInfo.bodyStyle) {
                  vehicleData.body_type = vinInfo.bodyStyle;
                }
                
                console.log(`NHTSA data success for VIN: ${vehicleData.vin}`, 
                          {make: vinInfo.make, model: vinInfo.model, year: vinInfo.year});
              }
            } catch (error) {
              console.error(`Error fetching NHTSA data for VIN: ${vehicleData.vin}`, error);
              // Continue with basic vehicle data even if NHTSA lookup fails
            }
          }
          
          vehicles.push(vehicleData);
        }
        
        // Save vehicles to database
        await storage.bulkCreateVehicles(vehicles);
        
        // Update runlist as processed
        await storage.updateRunlist(runlistId, { processed: true });
        
        // Match vehicles against buy box
        const createdVehicles = await storage.getVehicles(runlistId);
        const buyBoxMatches = await storage.matchVehiclesToBuyBoxes(createdVehicles);
        
        // Log activity
        await logActivity(7, "Runlist processed", { 
          runlist_id: runlistId,
          auction_id: runlist.auction_id,
          vehicle_count: vehicles.length,
          match_count: buyBoxMatches.reduce((count, match) => count + match.matches.length, 0)
        });
        
        res.status(200).json({ 
          runlist,
          vehicle_count: vehicles.length,
          match_count: buyBoxMatches.reduce((count, match) => count + match.matches.length, 0)
        });
      } catch (error) {
        console.error("Error processing runlist:", error);
        res.status(500).json({ error: "Failed to process runlist file" });
      }
    } catch (error) {
      console.error("Error processing runlist:", error);
      res.status(500).json({ error: "Failed to process runlist" });
    }
  });

  // ------------------------
  // Inspection Template routes
  // ------------------------
  
  // Get inspection templates
  app.get("/api/inspection-templates", async (req, res) => {
    try {
      const dealerId = req.query.dealerId ? parseInt(req.query.dealerId as string) : undefined;
      const templates = await storage.getInspectionTemplates(dealerId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching inspection templates:", error);
      res.status(500).json({ error: "Failed to fetch inspection templates" });
    }
  });

  // Create an inspection template
  app.post("/api/inspection-templates", async (req, res) => {
    try {
      const validation = insertInspectionTemplateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const template = await storage.createInspectionTemplate(validation.data);
      
      // Log activity
      await logActivity(7, "Inspection template created", { 
        template_id: template.id, 
        dealer_id: template.dealer_id,
        name: template.name
      });
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating inspection template:", error);
      res.status(500).json({ error: "Failed to create inspection template" });
    }
  });

  // Get a specific inspection template
  app.get("/api/inspection-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getInspectionTemplate(id);
      
      if (!template) {
        return res.status(404).json({ error: "Inspection template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching inspection template:", error);
      res.status(500).json({ error: "Failed to fetch inspection template" });
    }
  });

  // Update an inspection template
  app.patch("/api/inspection-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getInspectionTemplate(id);
      
      if (!template) {
        return res.status(404).json({ error: "Inspection template not found" });
      }
      
      const validation = insertInspectionTemplateSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const updatedTemplate = await storage.updateInspectionTemplate(id, validation.data);
      
      // Log activity
      await logActivity(7, "Inspection template updated", { 
        template_id: id,
        dealer_id: template.dealer_id,
        name: template.name
      });
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating inspection template:", error);
      res.status(500).json({ error: "Failed to update inspection template" });
    }
  });

  // ------------------------
  // Inspection Results routes
  // ------------------------

  // Get all inspection results
  app.get("/api/inspection-results", async (req, res) => {
    try {
      const results = await db.query.inspectionResults.findMany({
        orderBy: (inspectionResults, { asc }) => [asc(inspectionResults.inspection_id)]
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching inspection results:", error);
      res.status(500).json({ error: "Failed to fetch inspection results" });
    }
  });

  // Get inspection result by inspection ID
  app.get("/api/inspections/:id/result", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      const result = await storage.getInspectionResult(inspectionId);
      
      if (!result) {
        return res.status(404).json({ error: "Inspection result not found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching inspection result:", error);
      res.status(500).json({ error: "Failed to fetch inspection result" });
    }
  });

  // ------------------------
  // Vehicle routes
  // ------------------------

  // Get all vehicles
  app.get("/api/vehicles", async (req, res) => {
    try {
      const runlistId = req.query.runlistId ? parseInt(req.query.runlistId as string) : undefined;
      const vehicles = await storage.getVehicles(runlistId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // Get a specific vehicle
  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ error: "Failed to fetch vehicle" });
    }
  });
  
  // Decode a VIN using NHTSA API
  app.get("/api/vehicle/decode-vin/:vin", async (req, res) => {
    try {
      const { vin } = req.params;
      
      if (!vin || !NHTSAService.isValidVin(vin)) {
        return res.status(400).json({ error: "Invalid VIN format" });
      }
      
      const vehicleInfo = await NHTSAService.getVehicleInfoFromVin(vin);
      
      res.json({
        vin: vin,
        year: vehicleInfo.year,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        trim: vehicleInfo.trim,
        bodyStyle: vehicleInfo.bodyStyle
      });
      
      // Log activity
      await logActivity(7, "VIN decoded", { vin });
      
    } catch (error) {
      console.error(`Error decoding VIN ${req.params.vin}:`, error);
      res.status(500).json({ error: "Failed to decode VIN" });
    }
  });

  // Create a manual vehicle (with a dedicated "manual entry" runlist)
  app.post("/api/vehicles/manual", async (req, res) => {
    try {
      const { vin, make, model, year, trim, mileage, color, stock_number, lane_number, run_number, auction_id } = req.body;
      
      // We'll attempt VIN decoding if provided, so make/model are optional if VIN is provided
      if (!vin && (!make || !model)) {
        return res.status(400).json({ error: "Either a valid VIN or both make and model are required" });
      }

      if (!auction_id) {
        return res.status(400).json({ error: "Auction ID is required" });
      }
      
      // Check if we already have a "manual entries" runlist for this auction
      let runlist = await db.select()
        .from(runlists)
        .where(
          and(
            eq(runlists.auction_id, auction_id),
            eq(runlists.filename, "manual_entries")
          )
        )
        .limit(1);
      
      // If no manual entries runlist exists, create one
      if (runlist.length === 0) {
        const [newRunlist] = await db.insert(runlists)
          .values({
            auction_id,
            filename: "manual_entries",
            processed: true,
            uploaded_by: 7 // Current user ID
          })
          .returning();
        
        runlist = [newRunlist];
      }
      
      // Initialize vehicle data with default values
      let vehicleData: any = {
        runlist_id: runlist[0].id,
        vin: vin || null,
        make: make || "Unknown",
        model: model || "Unknown",
        year: year || null,
        trim: trim || null,
        mileage: mileage || null,
        color: color || null,
        stock_number: stock_number || null,
        lane_number: lane_number || null,
        run_number: run_number || null,
      };
      
      // If VIN is provided, attempt to decode it using NHTSA API
      if (vin && NHTSAService.isValidVin(vin)) {
        try {
          console.log(`Attempting to decode VIN: ${vin}`);
          const vehicleInfo = await NHTSAService.getVehicleInfoFromVin(vin);
          
          if (vehicleInfo) {
            // Update vehicle data with information from NHTSA
            vehicleData.make = vehicleInfo.make || vehicleData.make;
            vehicleData.model = vehicleInfo.model || vehicleData.model;
            
            if (vehicleInfo.year) {
              vehicleData.year = parseInt(vehicleInfo.year) || vehicleData.year;
            }
            
            vehicleData.trim = vehicleInfo.trim || vehicleData.trim;
            vehicleData.body_type = vehicleInfo.bodyStyle || null;
            
            console.log(`VIN decoded successfully: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`);
          }
        } catch (decodeError) {
          console.error(`Error decoding VIN ${vin}:`, decodeError);
          // Continue with creation even if decoding fails
        }
      }
      
      const vehicle = await storage.createVehicle(vehicleData);
      
      // Log activity
      await logActivity(7, "Manual vehicle created", { 
        vehicle_id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin || "Not provided"
      });
      
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating manual vehicle:", error);
      res.status(500).json({ error: "Failed to create manual vehicle" });
    }
  });

  // ------------------------
  // Inspection routes
  // ------------------------
  
  // Get inspections
  app.get("/api/inspections", async (req, res) => {
    try {
      const filters: {
        dealerId?: number;
        inspectorId?: number;
        status?: string;
        auctionId?: number;
        startDate?: Date;
        endDate?: Date;
        vinLast6?: string;
      } = {};
      
      // Parse numeric filters
      if (req.query.dealerId) filters.dealerId = parseInt(req.query.dealerId as string);
      if (req.query.inspectorId) filters.inspectorId = parseInt(req.query.inspectorId as string);
      if (req.query.auctionId) filters.auctionId = parseInt(req.query.auctionId as string);
      
      // Parse date filters
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      
      // String filters
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.vinLast6) filters.vinLast6 = req.query.vinLast6 as string;
      
      const inspections = await storage.getInspections(filters);
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  // Create an inspection
  app.post("/api/inspections", async (req, res) => {
    try {
      const validation = insertInspectionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      const inspection = await storage.createInspection(validation.data);
      
      // Log activity
      await logActivity(7, "Inspection created", { 
        inspection_id: inspection.id, 
        vehicle_id: inspection.vehicle_id,
        dealer_id: inspection.dealer_id
      });
      
      res.status(201).json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      res.status(500).json({ error: "Failed to create inspection" });
    }
  });

  // Create multiple inspections from batch upload
  app.post("/api/inspections/batch", async (req, res) => {
    try {
      const { data } = req.body;
      
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: "Data array is required" });
      }
      
      // Get the first item to determine auction_id
      const firstItem = data[0];
      if (!firstItem || !firstItem.auction_id) {
        return res.status(400).json({ error: "Auction ID is required" });
      }
      
      // Create a temporary runlist for these manually added vehicles (no user tracking needed)
      const runlist = await storage.createRunlist({
        auction_id: firstItem.auction_id, 
        filename: `Manual Batch Upload ${new Date().toISOString()}`,
        processed: true,
        column_mapping: { manual: true },
        uploaded_by: null // No user tracking for batch uploads
      });
      
      // Process each item in the batch
      const createdInspections = [];
      for (const item of data) {
        const { vin, lane_number, run_number, auction_id, inspector_id, dealer_id, scheduled_date, notes } = item;
        
        if (!vin) {
          console.warn("Skipping batch item - missing VIN");
          continue;
        }
        
        // 1. Create a temporary vehicle for the inspection
        const vehicleData = {
          runlist_id: runlist.id, // Use the newly created runlist
          vin: vin,
          make: "Unknown", // Will be updated from NHTSA data if available
          model: "Unknown", // Will be updated from NHTSA data if available
          year: null,
          trim: null,
          mileage: null,
          color: null,
          stock_number: null,
          lane_number: lane_number || null,
          run_number: run_number || null,
        };
        
        // Create the vehicle
        const vehicle = await storage.createVehicle(vehicleData);
        
        // 2. Try to enrich with NHTSA data if VIN is provided
        if (vin && NHTSAService.isValidVin(vin)) {
          try {
            console.log(`Batch upload: Decoding VIN ${vin}`);
            const vehicleInfo = await NHTSAService.getVehicleInfoFromVin(vin);
            
            if (vehicleInfo) {
              // Prepare update data
              const updateData: any = {};
              if (vehicleInfo.make) updateData.make = vehicleInfo.make;
              if (vehicleInfo.model) updateData.model = vehicleInfo.model;
              if (vehicleInfo.year) updateData.year = parseInt(vehicleInfo.year);
              if (vehicleInfo.trim) updateData.trim = vehicleInfo.trim;
              if (vehicleInfo.bodyStyle) updateData.body_type = vehicleInfo.bodyStyle;
              
              // Additional fields we might want to add from raw data
              try {
                const rawData = await NHTSAService.decodeVin(vin);
                if (rawData && typeof rawData === 'object') {
                  updateData.engine = rawData['Engine Configuration'] ? 
                                     String(rawData['Engine Configuration']) : null;
                  updateData.transmission = rawData['Transmission Style'] ? 
                                          String(rawData['Transmission Style']) : null;
                }
              } catch (error) {
                console.error(`Error fetching detailed NHTSA data for VIN ${vin}:`, error);
                // Continue even if detailed data fetch fails
              }
              
              // Update the vehicle with NHTSA data
              if (Object.keys(updateData).length > 0) {
                await db.update(vehicles)
                  .set(updateData)
                  .where(eq(vehicles.id, vehicle.id));
                  
                console.log(`VIN decoded successfully: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`);
              }
            }
          } catch (error) {
            console.error(`Error enriching vehicle data from NHTSA for VIN ${vin}:`, error);
            // Continue with the process even if NHTSA enrichment fails
          }
        }
        
        // 3. Create inspection (no templates needed)
        
        // dealer_id is optional, set to null if not provided
        
        // Process the scheduled date
        let processedScheduledDate = null;
        if (scheduled_date) {
          processedScheduledDate = typeof scheduled_date === 'string' 
            ? new Date(scheduled_date) 
            : scheduled_date;
        }
        
        const inspectionData = {
          vehicle_id: vehicle.id,
          dealer_id: dealer_id,
          inspector_id: inspector_id || null,
          template_id: null, // No templates needed
          scheduled_date: processedScheduledDate,
          status: "pending" as const,
          notes: notes || "Created via batch upload",
        };
        
        const inspection = await storage.createInspection(inspectionData);
        createdInspections.push(inspection);
        
        // Log activity for each created inspection (using default user for system actions)
        await logActivity(7, "Batch inspection created", { 
          inspection_id: inspection.id, 
          vehicle_id: vehicle.id
        });
      }
      
      res.status(201).json({ 
        message: `Created ${createdInspections.length} inspections`, 
        count: createdInspections.length 
      });
    } catch (error) {
      console.error("Error creating batch inspections:", error);
      res.status(500).json({ error: "Failed to create batch inspections" });
    }
  });

  // Get a specific inspection
  app.get("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inspection = await storage.getInspection(id);
      
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      
      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });
  
  // Get inspection result by inspection ID
  app.get("/api/inspections/:id/result", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      const result = await storage.getInspectionResult(inspectionId);
      
      if (!result) {
        return res.status(404).json({ error: "Inspection result not found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching inspection result:", error);
      res.status(500).json({ error: "Failed to fetch inspection result" });
    }
  });
  
  // Get inspection result by inspection ID (alternative route)
  app.get("/api/inspection-results/:id", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      const result = await storage.getInspectionResult(inspectionId);
      
      if (!result) {
        return res.status(404).json({ error: "Inspection result not found" });
      }
      
      // Get all available files in the uploads directory
      const uploadDir = path.join(process.cwd(), 'uploads');
      const availableFiles = fs.readdirSync(uploadDir);
      
      // Categorize files by type based on extension
      const availablePhotos = availableFiles.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') || 
        file.toLowerCase().endsWith('.png')
      );
      
      const availableVideos = availableFiles.filter(file => 
        file.toLowerCase().endsWith('.mov') || 
        file.toLowerCase().endsWith('.mp4') || 
        file.toLowerCase().endsWith('.webm')
      );
      
      const availableAudios = availableFiles.filter(file => 
        file.toLowerCase().endsWith('.webm') || 
        file.toLowerCase().endsWith('.mp3') || 
        file.toLowerCase().endsWith('.wav')
      );
      
      // Merge with database result
      const enhancedResult = {
        ...result,
        photos: result.photos && result.photos.length > 0 ? result.photos : availablePhotos.slice(0, 3),
        videos: result.videos && result.videos.length > 0 ? result.videos : availableVideos.slice(0, 2),
        audio_notes: availableAudios.slice(0, 1)
      };
      
      res.json(enhancedResult);
    } catch (error) {
      console.error("Error fetching inspection result:", error);
      res.status(500).json({ error: "Failed to fetch inspection result" });
    }
  });

  // Update an inspection
  app.patch("/api/inspections/:id", cloudinaryUpload.any(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inspection = await storage.getInspection(id);
      
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      
      // Handle both JSON and FormData requests
      let requestData = req.body;
      
      console.log('Inspection update request - body:', req.body);
      console.log('Inspection update request - files:', req.files);
      console.log('Content-Type:', req.headers['content-type']);
      
      // Check if this is FormData (has multipart content-type or files)
      const isFormData = req.headers['content-type']?.includes('multipart/form-data') || (req.files && Array.isArray(req.files) && req.files.length > 0);
      
      if (isFormData) {
        // This is a FormData request from inspector portal
        requestData = {};
        
        // Extract form fields
        if (req.body.status) requestData.status = req.body.status;
        if (req.body.notes) requestData.notes = req.body.notes;
        if (req.body.end_date) requestData.end_date = req.body.end_date;
        if (req.body.cosmetic_estimate) requestData.cosmetic_estimate = parseFloat(req.body.cosmetic_estimate);
        if (req.body.cosmetic_details) requestData.cosmetic_details = req.body.cosmetic_details;
        if (req.body.mechanical_estimate) requestData.mechanical_estimate = parseFloat(req.body.mechanical_estimate);
        if (req.body.mechanical_details) requestData.mechanical_details = req.body.mechanical_details;
        if (req.body.is_recommended !== undefined) requestData.is_recommended = req.body.is_recommended === 'true';
        
        console.log('Extracted FormData:', requestData);
        
        // Handle voice note upload if present
        const voiceNoteFile = req.files && req.files.find(f => f.fieldname === 'voice_note');
        if (voiceNoteFile) {
          console.log('Voice note uploaded - transcribing and adding to notes');
          try {
            // Get the voice language preference (Spanish or English)
            const voiceLanguage = req.body.voice_language || 'en';
            
            // Download the audio file from Cloudinary
            const audioResponse = await fetch(voiceNoteFile.path);
            const audioBlob = await audioResponse.blob();
            
            // Transcribe the audio
            const { transcribeAudioToText, translateSpanishToEnglish } = await import('./services/openai.js');
            let transcribedText = await transcribeAudioToText(audioBlob);
            
            // If the voice was in Spanish, translate to English
            if (voiceLanguage === 'es' && transcribedText) {
              console.log('Translating Spanish voice note to English');
              transcribedText = await translateSpanishToEnglish(transcribedText);
            }
            
            // Append transcribed text to notes
            const existingNotes = requestData.notes || '';
            const voiceNoteText = `\n\n[Voice Note Transcription]:\n${transcribedText}`;
            requestData.notes = existingNotes ? `${existingNotes}${voiceNoteText}` : voiceNoteText.trim();
            
            console.log('Voice note successfully transcribed and added to notes');
          } catch (error) {
            console.error('Error processing voice note:', error);
            // If transcription fails, store the URL as a fallback
            const existingNotes = requestData.notes || '';
            const voiceNoteMarker = `\n\n[Voice Note - Transcription Failed]: ${voiceNoteFile.path}`;
            requestData.notes = existingNotes ? `${existingNotes}${voiceNoteMarker}` : voiceNoteMarker.trim();
          }
        }
      }
      
      // Remove undefined, null, empty string values
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === undefined || requestData[key] === null || requestData[key] === '') {
          delete requestData[key];
        }
      });
      
      console.log('Final requestData for validation:', requestData);
      
      const validation = insertInspectionSchema.partial().safeParse(requestData);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }

      // Process date fields to ensure they are proper Date objects
      const data = { ...validation.data };
      
      // Convert string dates to Date objects
      if (typeof data.start_date === 'string') {
        data.start_date = new Date(data.start_date);
      }
      
      if (typeof data.completion_date === 'string') {
        data.completion_date = new Date(data.completion_date);
      }
      
      if (typeof data.scheduled_date === 'string') {
        data.scheduled_date = new Date(data.scheduled_date);
      }
      
      const updatedInspection = await storage.updateInspection(id, data);
      
      // Log activity
      await logActivity(7, "Inspection updated", { 
        inspection_id: id,
        updates: req.body
      });
      
      res.json(updatedInspection);
    } catch (error) {
      console.error("Error updating inspection:", error);
      res.status(500).json({ error: "Failed to update inspection" });
    }
  });



  // Create or update inspection result
  app.post("/api/inspections/:id/result", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      const inspection = await storage.getInspection(inspectionId);
      
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      
      const validation = insertInspectionResultSchema.safeParse({
        ...req.body,
        inspection_id: inspectionId
      });
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      // Check if result already exists
      const existingResult = await storage.getInspectionResult(inspectionId);
      
      let result;
      if (existingResult) {
        // Update existing result
        result = await storage.updateInspectionResult(existingResult.id, validation.data);
      } else {
        // Create new result
        result = await storage.createInspectionResult(validation.data);
      }
      
      // Get the current date
      const currentDate = new Date();
      console.log("Setting completion date:", currentDate);
      
      // Update inspection status to completed
      await storage.updateInspection(inspectionId, {
        status: "completed" as const,
        completion_date: currentDate
      });
      
      // Log activity
      await logActivity(7, "Inspection result submitted", { 
        inspection_id: inspectionId,
        result_id: result.id
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error submitting inspection result:", error);
      res.status(500).json({ error: "Failed to submit inspection result" });
    }
  });

  // Upload photos/videos for inspection result with extended timeout
  app.post("/api/inspections/:id/uploads", (req, res, next) => {
    // Extend timeout for large file uploads
    req.setTimeout(5 * 60 * 1000); // 5 minutes
    res.setTimeout(5 * 60 * 1000); // 5 minutes
    next();
  }, cloudinaryUpload.array("files", 10), async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      
      // Enhanced debugging - log request headers and details
      console.log(`\n==== Cloudinary Upload request for inspection ${inspectionId} ====`);
      console.log(`Content-Type:`, req.headers['content-type']);
      console.log(`Content-Length:`, req.headers['content-length']);
      
      // Check if we have files
      if (!req.files) {
        console.log("req.files is undefined or null");
        console.log("Request body:", req.body);
        return res.status(400).json({ error: "No files uploaded - files array is missing" });
      }
      
      if (!Array.isArray(req.files)) {
        console.log("req.files is not an array:", typeof req.files);
        return res.status(400).json({ error: "Invalid file upload format" });
      }
      
      if (req.files.length === 0) {
        console.log("req.files array is empty");
        return res.status(400).json({ error: "No files found in the upload" });
      }
      
      // Log file details for debugging - Cloudinary files have different structure
      const uploadedFiles = req.files as any[];
      console.log(`Processing ${uploadedFiles.length} files via Cloudinary:`);
      uploadedFiles.forEach((file, i) => {
        console.log(`File ${i}: ${file.originalname}, ${file.mimetype}, ${file.size} bytes`);
        console.log(`Cloudinary URL: ${file.path}`);
        console.log(`Cloudinary public_id: ${file.filename}`);
      });
      
      // Get or create inspection result
      const result = await storage.getInspectionResult(inspectionId);
      let resultId: number;
      
      if (!result) {
        console.log("Creating new inspection result");
        // Create empty result if it doesn't exist
        const newResult = await storage.createInspectionResult({
          inspection_id: inspectionId,
          data: {},
          photos: [],
          videos: [],
          links: []
        });
        resultId = newResult.id;
        
        // Log activity
        await logActivity(7, "Inspection result created", { 
          inspection_id: inspectionId,
          result_id: resultId
        });
      } else {
        resultId = result.id;
      }
      
      // Process uploaded files from Cloudinary
      const fileLinks = uploadedFiles.map(file => {
        const fileUrl = file.path; // Cloudinary URL
        const isVideo = file.mimetype.startsWith('video/');
        const isImage = file.mimetype.startsWith('image/');
        const isAudio = file.mimetype.startsWith('audio/');
        
        return {
          url: fileUrl,
          filename: file.originalname,
          cloudinary_public_id: file.filename, // Cloudinary public ID
          type: isVideo ? 'video' : isImage ? 'photo' : isAudio ? 'audio' : 'other',
          size: file.size,
          uploaded_at: new Date().toISOString()
        };
      });
      
      // Update inspection with start date if it's missing
      const inspection = await storage.getInspection(inspectionId);
      if (inspection && !inspection.start_date) {
        await storage.updateInspection(inspectionId, {
          start_date: new Date(),
          status: "in_progress"
        });
      }
      
      // Update the inspection result with the uploaded files
      const currentResult = await storage.getInspectionResult(inspectionId);
      if (currentResult) {
        // Separate files by type
        const photos = fileLinks.filter(f => f.type === 'photo').map(f => f.url);
        const videos = fileLinks.filter(f => f.type === 'video').map(f => f.url);
        const audios = fileLinks.filter(f => f.type === 'audio').map(f => f.url);
        
        // Update the result with new files
        const existingData = currentResult.data || {};
        const updatedData = {
          ...existingData,
          uploaded_files: fileLinks, // Store all file metadata
        };
        
        const currentPhotos = Array.isArray(currentResult.photos) ? currentResult.photos : [];
        const currentVideos = Array.isArray(currentResult.videos) ? currentResult.videos : [];
        const currentLinks = Array.isArray(currentResult.links) ? currentResult.links : [];
        
        await storage.updateInspectionResult(resultId, {
          data: updatedData,
          photos: [...currentPhotos, ...photos],
          videos: [...currentVideos, ...videos],
          links: [...currentLinks, ...audios],
        });
        
        console.log(`Updated inspection result ${resultId} with ${fileLinks.length} files`);
      }

      // Log activity
      await logActivity(7, "Files uploaded to inspection", { 
        inspection_id: inspectionId,
        result_id: resultId || 0,
        file_count: uploadedFiles.length,
        cloudinary_urls: fileLinks.map(f => f.url)
      });
      
      // Return detailed response
      res.status(201).json({ 
        message: "Files uploaded successfully",
        count: uploadedFiles.length,
        files: fileLinks,
        status: "success"
      });
    } catch (error) {
      console.error("Error uploading inspection files:", error);
      
      // Safe error handling
      let errorMessage = "Failed to upload inspection files";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      res.status(500).json({ 
        error: "Failed to upload inspection files", 
        message: errorMessage,
        status: "error"
      });
    }
  });

  // Test Upload endpoint for debugging
  app.post("/api/test-upload", mediaUpload.array("files", 10), async (req, res) => {
    try {
      console.log("\n==== TEST UPLOAD REQUEST ====");
      console.log(`Content-Type:`, req.headers['content-type']);
      console.log(`Content-Length:`, req.headers['content-length']);
      
      // Check if we have files
      if (!req.files) {
        console.log("req.files is undefined or null");
        console.log("Request body:", req.body);
        return res.status(400).json({ error: "No files uploaded - files array is missing" });
      }
      
      if (!Array.isArray(req.files)) {
        console.log("req.files is not an array:", typeof req.files);
        return res.status(400).json({ error: "Invalid file upload format" });
      }
      
      if (req.files.length === 0) {
        console.log("req.files array is empty");
        return res.status(400).json({ error: "No files found in the upload" });
      }
      
      // Log file details for debugging
      const uploadedFiles = req.files as Express.Multer.File[];
      console.log(`Processing ${uploadedFiles.length} files:`);
      uploadedFiles.forEach((file, i) => {
        console.log(`File ${i}: ${file.originalname}, ${file.mimetype}, ${file.size} bytes, saved as: ${file.filename}`);
      });
      
      // Return detailed response
      res.status(201).json({ 
        message: "Files uploaded successfully",
        count: uploadedFiles.length,
        files: uploadedFiles.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: `/uploads/${file.filename}`
        })),
        status: "success"
      });
    } catch (error) {
      console.error("Error in test upload:", error);
      
      // Safe error handling
      let errorMessage = "Failed to process test upload";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      res.status(500).json({ 
        error: "Failed to process test upload", 
        message: errorMessage,
        status: "error"
      });
    }
  });

  // Cleanup expired inspections (inspections created but not performed by 11:59 PM)
  app.post("/api/inspections/cleanup-expired", async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      console.log(`Cleaning up expired inspections. Current time: ${now.toISOString()}, Today: ${today.toISOString()}`);

      // Get all pending inspections created before today that haven't been started
      const allInspections = await storage.getInspections();
      const expiredInspections = allInspections.filter(inspection => {
        const createdDate = new Date(inspection.created_at);
        const scheduledDate = inspection.scheduled_date ? new Date(inspection.scheduled_date) : null;
        
        // Check if inspection was created before today and is still pending/assigned
        const isExpired = createdDate < today && (inspection.status === 'pending' || inspection.status === 'assigned');
        
        // Also check if scheduled date is in the past (before today)
        const isScheduledExpired = scheduledDate && scheduledDate < today;
        
        return isExpired || isScheduledExpired;
      });

      console.log(`Found ${expiredInspections.length} expired inspections to clean up`);

      // Delete expired inspections
      let deletedCount = 0;
      for (const inspection of expiredInspections) {
        try {
          await storage.deleteInspection(inspection.id);
          deletedCount++;
          console.log(`Deleted expired inspection ${inspection.id} (created: ${inspection.created_at}, scheduled: ${inspection.scheduled_date})`);
        } catch (error) {
          console.error(`Failed to delete expired inspection ${inspection.id}:`, error);
        }
      }

      // Log activity with system user (using inspector user_id 7 as fallback)
      try {
        await logActivity(7, "Expired inspections cleanup", { 
          deleted_count: deletedCount,
          cleanup_time: now.toISOString()
        });
      } catch (error) {
        console.error("Failed to log cleanup activity:", error);
      }

      res.json({ 
        message: `Cleanup completed: ${deletedCount} expired inspections removed`,
        deleted_count: deletedCount,
        expired_inspections: expiredInspections.map(i => ({
          id: i.id,
          created_at: i.created_at,
          scheduled_date: i.scheduled_date,
          status: i.status
        }))
      });
    } catch (error) {
      console.error("Error cleaning up expired inspections:", error);
      res.status(500).json({ error: "Failed to cleanup expired inspections" });
    }
  });

  // Clear ALL inspections (for testing/reset purposes) - handles foreign key constraints
  app.post("/api/inspections/clear-all", async (req, res) => {
    try {
      console.log('Starting complete inspection cleanup with related data...');

      // Get all inspections first for logging
      const allInspections = await storage.getInspections();
      console.log(`Found ${allInspections.length} total inspections to delete`);

      // Delete ALL inspections regardless of status
      let deletedCount = 0;
      let failedCount = 0;

      for (const inspection of allInspections) {
        try {
          // First delete related data to handle foreign key constraints
          
          // Delete inspection results
          try {
            await db.delete(inspectionResults).where(eq(inspectionResults.inspection_id, inspection.id));
            console.log(`Deleted inspection results for inspection ${inspection.id}`);
          } catch (error) {
            console.log(`No inspection results to delete for inspection ${inspection.id}`);
          }

          // Delete purchases
          try {
            await db.delete(purchases).where(eq(purchases.inspection_id, inspection.id));
            console.log(`Deleted purchases for inspection ${inspection.id}`);
          } catch (error) {
            console.log(`No purchases to delete for inspection ${inspection.id}`);
          }



          // Now delete the inspection itself
          await storage.deleteInspection(inspection.id);
          deletedCount++;
          console.log(`Deleted inspection ${inspection.id} (status: ${inspection.status})`);
        } catch (error) {
          failedCount++;
          console.error(`Failed to delete inspection ${inspection.id}:`, error);
        }
      }

      // Log the cleanup activity
      try {
        await logActivity(7, "Complete inspection database cleanup with related data", { 
          deleted_count: deletedCount,
          failed_count: failedCount,
          total_found: allInspections.length,
          cleanup_time: new Date().toISOString()
        });
      } catch (error) {
        console.error("Failed to log complete cleanup activity:", error);
      }

      console.log(`Complete cleanup finished: ${deletedCount} deleted, ${failedCount} failed`);

      res.json({ 
        message: `Complete cleanup completed: ${deletedCount} inspections removed, ${failedCount} failed`,
        deleted_count: deletedCount,
        failed_count: failedCount,
        total_found: allInspections.length,
        deleted_inspections: allInspections.slice(0, 20).map(i => ({
          id: i.id,
          status: i.status,
          created_at: i.created_at,
          vehicle_info: `${i.vehicle?.year} ${i.vehicle?.make} ${i.vehicle?.model}`.trim() || 'Unknown'
        }))
      });
    } catch (error) {
      console.error("Error during complete inspection cleanup:", error);
      res.status(500).json({ error: "Failed to complete inspection cleanup" });
    }
  });

  // ------------------------
  // Column Mapping routes
  // ------------------------
  
  // Get column mappings for an auction
  app.get("/api/column-mappings", async (req, res) => {
    try {
      const auctionId = req.query.auctionId ? parseInt(req.query.auctionId as string) : undefined;
      const mappings = await storage.getColumnMappings(auctionId);
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching column mappings:", error);
      res.status(500).json({ error: "Failed to fetch column mappings" });
    }
  });
  
  // Create a column mapping
  app.post("/api/column-mappings", async (req, res) => {
    try {
      const { name, mapping, auction_id } = req.body;
      
      if (!name || !mapping || !auction_id) {
        return res.status(400).json({ 
          error: "Name, mapping object, and auction ID are required" 
        });
      }
      
      // Create the mapping
      const columnMapping = await storage.createColumnMapping({
        name,
        auction_id,
        mapping
      });
      
      // Log activity
      await logActivity(7, "Column mapping created", { 
        mapping_id: columnMapping.id,
        auction_id: columnMapping.auction_id,
        name: columnMapping.name
      });
      
      res.status(201).json(columnMapping);
    } catch (error) {
      console.error("Error creating column mapping:", error);
      res.status(500).json({ error: "Failed to create column mapping" });
    }
  });
  
  // Get a specific column mapping
  app.get("/api/column-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mapping = await storage.getColumnMapping(id);
      
      if (!mapping) {
        return res.status(404).json({ error: "Column mapping not found" });
      }
      
      res.json(mapping);
    } catch (error) {
      console.error("Error fetching column mapping:", error);
      res.status(500).json({ error: "Failed to fetch column mapping" });
    }
  });
  
  // Update a column mapping
  app.patch("/api/column-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mapping = await storage.getColumnMapping(id);
      
      if (!mapping) {
        return res.status(404).json({ error: "Column mapping not found" });
      }
      
      const updatedMapping = await storage.updateColumnMapping(id, req.body);
      
      // Log activity
      await logActivity(7, "Column mapping updated", { 
        mapping_id: id,
        auction_id: mapping.auction_id,
        name: mapping.name
      });
      
      res.json(updatedMapping);
    } catch (error) {
      console.error("Error updating column mapping:", error);
      res.status(500).json({ error: "Failed to update column mapping" });
    }
  });
  
  // ------------------------
  // Purchase routes
  // ------------------------
  
  // Get purchases
  app.get("/api/purchases", async (req, res) => {
    try {
      const dealerId = req.query.dealerId ? parseInt(req.query.dealerId as string) : undefined;
      const purchases = await storage.getPurchases(dealerId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ error: "Failed to fetch purchases" });
    }
  });

  // Create a purchase
  app.post("/api/purchases", async (req, res) => {
    try {
      const validation = insertPurchaseSchema.safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      // Check if purchase already exists for this inspection
      const existingPurchase = await storage.getPurchaseByInspectionId(req.body.inspection_id);
      
      if (existingPurchase) {
        return res.status(400).json({ 
          error: "A purchase record already exists for this inspection" 
        });
      }
      
      // Process date fields to ensure they are proper Date objects
      const data = { ...validation.data };
      
      // Convert string dates to Date objects
      if (typeof data.purchase_date === 'string') {
        data.purchase_date = new Date(data.purchase_date);
      }
      
      if (typeof data.arrival_date === 'string') {
        data.arrival_date = new Date(data.arrival_date);
      }
      
      const purchase = await storage.createPurchase(data);
      
      // Log activity
      await logActivity(7, "Purchase created", { 
        purchase_id: purchase.id, 
        inspection_id: purchase.inspection_id,
        dealer_id: purchase.dealer_id,
        status: purchase.status
      });
      
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ error: "Failed to create purchase" });
    }
  });

  // Get a specific purchase
  app.get("/api/purchases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const purchase = await storage.getPurchase(id);
      
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      
      res.json(purchase);
    } catch (error) {
      console.error("Error fetching purchase:", error);
      res.status(500).json({ error: "Failed to fetch purchase" });
    }
  });

  // Update a purchase
  app.patch("/api/purchases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const purchase = await storage.getPurchase(id);
      
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      
      const validation = insertPurchaseSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return handleZodError(validation.error, res);
      }
      
      // Process date fields to ensure they are proper Date objects
      const data = { ...validation.data };
      
      // Convert string dates to Date objects
      if (typeof data.purchase_date === 'string') {
        data.purchase_date = new Date(data.purchase_date);
      }
      
      if (typeof data.arrival_date === 'string') {
        data.arrival_date = new Date(data.arrival_date);
      }

      const updatedPurchase = await storage.updatePurchase(id, data);
      
      // Log activity
      await logActivity(7, "Purchase updated", { 
        purchase_id: id,
        updates: req.body
      });
      
      res.json(updatedPurchase);
    } catch (error) {
      console.error("Error updating purchase:", error);
      res.status(500).json({ error: "Failed to update purchase" });
    }
  });



  // ------------------------
  // Test routes for development
  // ------------------------
  
  // Test buy box matching
  app.post("/api/test-match", async (req, res) => {
    try {
      const vehicleIds = req.body.vehicle_ids || [];
      
      if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
        return res.status(400).json({ error: "Vehicle IDs are required" });
      }
      
      const vehicles = [];
      
      // Fetch each vehicle
      for (const id of vehicleIds) {
        const vehicle = await storage.getVehicle(id);
        if (vehicle) {
          vehicles.push(vehicle);
        }
      }
      
      if (vehicles.length === 0) {
        return res.status(404).json({ error: "No valid vehicles found" });
      }
      
      // Match vehicles against buy box items
      const matches = await storage.matchVehiclesToBuyBoxes(vehicles);
      
      res.json({ matches });
    } catch (error) {
      console.error("Error testing buy box matches:", error);
      res.status(500).json({ error: "Failed to test buy box matches" });
    }
  });
  
  // Parse file (CSV/Excel) for manual batch upload
  app.post("/api/file/parse", fileUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      if (fileExt === ".csv") {
        // Process CSV file
        const parser = fs.createReadStream(filePath).pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
          })
        );
        
        const records: Record<string, string>[] = [];
        
        // Process each row
        for await (const record of parser) {
          records.push(record);
        }
        
        res.json({ data: records });
      } else if ([".xlsx", ".xls"].includes(fileExt)) {
        // Process Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1); // Get first worksheet
        
        if (!worksheet) {
          return res.status(400).json({ error: "Empty worksheet" });
        }
        
        const records: Record<string, string>[] = [];
        const headers: string[] = [];
        
        // Process headers
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || `Column ${colNumber}`;
        });
        
        // Process rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const record: Record<string, string> = {};
          
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            const value = cell.value?.toString() || "";
            record[header] = value;
          });
          
          records.push(record);
        });
        
        res.json({ data: records });
      } else {
        res.status(400).json({ error: "Unsupported file format. Please upload a CSV or Excel file." });
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      res.status(500).json({ error: "Failed to parse file" });
    } finally {
      // Clean up: remove the uploaded file
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error removing temporary file:", err);
        });
      }
    }
  });

  // ------------------------
  // NHTSA API Integration
  // ------------------------

  // Get all vehicle makes from NHTSA
  app.get("/api/nhtsa/makes", async (req, res) => {
    try {
      const makes = await NHTSAService.getAllMakes();
      res.json(makes);
    } catch (error) {
      console.error("Error fetching makes from NHTSA:", error);
      res.status(500).json({ error: "Failed to fetch vehicle makes" });
    }
  });

  // Get models for a specific make from NHTSA
  app.get("/api/nhtsa/models/:makeId", async (req, res) => {
    try {
      const makeId = req.params.makeId;
      const makeName = req.query.makeName as string;
      
      if (!makeName) {
        return res.status(400).json({ error: "makeName query parameter is required" });
      }
      
      const models = await NHTSAService.getModelsForMake(makeId, makeName);
      res.json(models);
    } catch (error) {
      console.error("Error fetching models from NHTSA:", error);
      res.status(500).json({ error: "Failed to fetch vehicle models" });
    }
  });

  // Decode a VIN
  app.get("/api/nhtsa/decode-vin/:vin", async (req, res) => {
    try {
      const vin = req.params.vin;
      
      if (!NHTSAService.isValidVin(vin)) {
        return res.status(400).json({ error: "Invalid VIN format" });
      }
      
      const decodedVin = await NHTSAService.decodeVin(vin);
      res.json(decodedVin);
    } catch (error) {
      console.error("Error decoding VIN:", error);
      res.status(500).json({ error: "Failed to decode VIN" });
    }
  });

  // Get vehicle info from a VIN
  app.get("/api/nhtsa/vehicle-info/:vin", async (req, res) => {
    try {
      const vin = req.params.vin;
      
      if (!NHTSAService.isValidVin(vin)) {
        return res.status(400).json({ error: "Invalid VIN format" });
      }
      
      const vehicleInfo = await NHTSAService.getVehicleInfoFromVin(vin);
      res.json(vehicleInfo);
    } catch (error) {
      console.error("Error getting vehicle info from VIN:", error);
      res.status(500).json({ error: "Failed to get vehicle info from VIN" });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (socket) => {
    console.log('WebSocket client connected');
    
    // Send a welcome message
    socket.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to AutoInspect Pro WebSocket Server',
      timestamp: new Date().toISOString()
    }));
    
    // Handle inspection status updates
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'inspection_update') {
          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'inspection_update',
                data: data.data,
                timestamp: new Date().toISOString()
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    socket.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Schedule automatic cleanup of expired inspections
  const scheduleCleanup = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999); // Set to 11:59:59 PM today
    
    // If it's already past midnight, schedule for tomorrow
    if (now > midnight) {
      midnight.setDate(midnight.getDate() + 1);
    }
    
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    console.log(`Scheduling cleanup in ${Math.round(msUntilMidnight / 1000 / 60)} minutes at ${midnight.toISOString()}`);
    
    setTimeout(async () => {
      try {
        console.log('Running scheduled cleanup of expired inspections...');
        
        // Call the cleanup function directly  
        const allInspections = await storage.getInspections();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const expiredInspections = allInspections.filter(inspection => {
          const createdDate = new Date(inspection.created_at);
          const scheduledDate = inspection.scheduled_date ? new Date(inspection.scheduled_date) : null;
          
          // Check if inspection was created before today and is still pending/assigned
          const isExpired = createdDate < today && (inspection.status === 'pending' || inspection.status === 'assigned');
          
          // Also check if scheduled date is in the past (before today)
          const isScheduledExpired = scheduledDate && scheduledDate < today;
          
          return isExpired || isScheduledExpired;
        });
        
        let deletedCount = 0;
        for (const inspection of expiredInspections) {
          try {
            await storage.deleteInspection(inspection.id);
            deletedCount++;
            console.log(`Deleted expired inspection ${inspection.id} (created: ${inspection.created_at}, scheduled: ${inspection.scheduled_date})`);
          } catch (error) {
            console.error(`Failed to delete expired inspection ${inspection.id}:`, error);
          }
        }
        
        try {
          await logActivity(7, "Scheduled expired inspections cleanup", { 
            deleted_count: deletedCount,
            cleanup_time: new Date().toISOString()
          });
        } catch (error) {
          console.error("Failed to log scheduled cleanup activity:", error);
        }
        
        console.log(`Scheduled cleanup completed: ${deletedCount} expired inspections removed`);
      } catch (error) {
        console.error('Error running scheduled cleanup:', error);
      }
      
      // Schedule the next cleanup for tomorrow
      scheduleCleanup();
    }, msUntilMidnight);
  };
  
  // Start the cleanup scheduler
  scheduleCleanup();
  
  // Notifications API
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const onlyUnread = req.query.unread === "true";
      const notifications = await storage.getNotifications(req.user.id, onlyUnread);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  
  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      if (notification.user_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to mark this notification as read" });
      }
      
      await storage.markNotificationAsRead(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });
  
  // Create notification when inspection is completed
  app.post("/api/inspections/:id/complete", async (req, res) => {
    try {
      
      const inspectionId = parseInt(req.params.id);
      const inspection = await storage.getInspection(inspectionId);
      
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      
      // Create or update inspection result with completion data
      const existingResult = await storage.getInspectionResult(inspectionId);
      const resultData = {
        cosmetic_estimate: req.body.cosmetic_estimate,
        cosmetic_details: req.body.cosmetic_details,
        mechanical_estimate: req.body.mechanical_estimate,
        mechanical_details: req.body.mechanical_details,
      };
      
      if (existingResult) {
        // Update existing result with completion data
        const existingData = existingResult.data || {};
        await storage.updateInspectionResult(existingResult.id, {
          data: { ...existingData, ...resultData },
          photos: req.body.photos || existingResult.photos || [],
          videos: req.body.videos || existingResult.videos || [],
        });
      } else {
        // Create new result
        await storage.createInspectionResult({
          inspection_id: inspectionId,
          data: resultData,
          photos: req.body.photos || [],
          videos: req.body.videos || [],
          links: []
        });
      }
      
      // Update inspection status to completed
      await storage.updateInspection(inspectionId, {
        status: "completed",
        completion_date: new Date()
      });
      
      // Get related data for notification
      const vehicle = await storage.getVehicle(inspection.vehicle_id);
      const dealer = await storage.getDealer(inspection.dealer_id);
      
      // Create notification for dealer
      if (dealer) {
        // Find users associated with this dealer (admin users)
        const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
        
        for (const admin of adminUsers) {
          await storage.createNotification({
            user_id: admin.id,
            type: "inspection_completed",
            title: "Inspection Completed",
            message: `Inspection for ${vehicle?.year || ""} ${vehicle?.make || ""} ${vehicle?.model || ""} (VIN: ${vehicle?.vin || "Unknown"}) has been completed.`,
            related_id: inspectionId,
            link: `/inspection-detail/${inspectionId}`,
            read: false
          });
        }
      }
      
      // Log activity
      await storage.createActivityLog({
        user_id: req.user.id,
        action: "Inspection completed",
        details: { 
          inspection_id: inspectionId,
          vehicle_id: inspection.vehicle_id
        }
      });
      
      res.status(200).json({ success: true, message: "Inspection completed successfully" });
    } catch (error) {
      console.error("Error completing inspection:", error);
      res.status(500).json({ error: "Failed to complete inspection" });
    }
  });
  
  // Share inspection report
  app.post("/api/inspections/:id/share", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const inspectionId = parseInt(req.params.id);
      const inspection = await storage.getInspection(inspectionId);
      
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      
      const crypto = require('crypto');
      const shareToken = crypto.randomBytes(16).toString('hex');
      
      // Set expiry date (default 30 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // Create shared report
      const sharedReport = await storage.createSharedReport({
        inspection_id: inspectionId,
        shared_by: req.user.id,
        shared_with_email: req.body.email || null,
        share_token: shareToken,
        expiry_date: expiryDate
      });
      
      // Generate the share URL
      const shareUrl = `${req.protocol}://${req.get('host')}/shared-report/${shareToken}`;
      
      // Check for SendGrid API key and send email if available
      if (req.body.email && process.env.SENDGRID_API_KEY) {
        try {
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          
          const vehicle = await storage.getVehicle(inspection.vehicle_id);
          
          const msg = {
            to: req.body.email,
            from: process.env.EMAIL_FROM || 'notifications@autoinspection.com',
            subject: 'Vehicle Inspection Report Shared With You',
            text: `An inspection report has been shared with you for ${vehicle?.year || ""} ${vehicle?.make || ""} ${vehicle?.model || ""}. View it here: ${shareUrl}`,
            html: `
              <h1>Inspection Report Shared With You</h1>
              <p>An inspection report has been shared with you for ${vehicle?.year || ""} ${vehicle?.make || ""} ${vehicle?.model || ""}.</p>
              <p><a href="${shareUrl}">Click here to view the report</a></p>
              <p>This link will expire on ${expiryDate.toLocaleDateString()}.</p>
            `,
          };
          
          await sgMail.send(msg);
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Continue even if email fails
        }
      }
      
      // Create notification for the user who shared the report
      await storage.createNotification({
        user_id: req.user.id,
        type: "report_shared",
        title: "Report Shared",
        message: `You've shared an inspection report${req.body.email ? ` with ${req.body.email}` : ''}.`,
        related_id: inspectionId,
        link: `/inspection-detail/${inspectionId}`,
        read: false
      });
      
      // Log activity
      await storage.createActivityLog({
        user_id: req.user.id,
        action: "Inspection report shared",
        details: { 
          inspection_id: inspectionId,
          shared_with: req.body.email,
          share_token: shareToken
        }
      });
      
      res.status(200).json({ 
        success: true, 
        shareUrl, 
        shareToken,
        expiryDate
      });
    } catch (error) {
      console.error("Error sharing inspection report:", error);
      res.status(500).json({ error: "Failed to share inspection report" });
    }
  });
  
  // Get shared report by token (public endpoint, no auth required)
  app.get("/api/shared-reports/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const sharedReport = await storage.getSharedReportByToken(token);
      
      if (!sharedReport) {
        return res.status(404).json({ error: "Shared report not found" });
      }
      
      // Check if expired
      if (sharedReport.expiry_date && new Date(sharedReport.expiry_date) < new Date()) {
        return res.status(410).json({ error: "Shared report has expired" });
      }
      
      // Get inspection and associated data
      const inspection = await storage.getInspection(sharedReport.inspection_id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      
      const vehicle = await storage.getVehicle(inspection.vehicle_id);
      const inspectionResult = await storage.getInspectionResult(inspection.id);
      const dealer = await storage.getDealer(inspection.dealer_id);
      let inspector = null;
      
      if (inspection.inspector_id) {
        inspector = await storage.getInspector(inspection.inspector_id);
      }
      
      // Return the data
      res.json({
        inspection,
        vehicle,
        inspectionResult,
        dealer,
        inspector,
        sharedBy: await storage.getUser(sharedReport.shared_by),
        sharedAt: sharedReport.created_at,
        expiryDate: sharedReport.expiry_date
      });
    } catch (error) {
      console.error("Error fetching shared report:", error);
      res.status(500).json({ error: "Failed to fetch shared report" });
    }
  });

  // Simplified runlist upload routes
  app.post("/api/runlists/upload", fileUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { auction_id, inspector_id, inspection_date } = req.body;
      
      if (!auction_id || !inspection_date) {
        return res.status(400).json({ error: "Auction and inspection date are required" });
      }

      // Create runlist entry
      const runlist = await storage.createRunlist({
        auction_id: parseInt(auction_id),
        filename: req.file.originalname,
        uploaded_by: null, // No user tracking needed
      });

      // Parse the uploaded file
      let vehicles: any[] = [];
      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      if (fileExtension === '.csv') {
        // Parse CSV file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = await new Promise<any[]>((resolve, reject) => {
          parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
          }, (err, records) => {
            if (err) reject(err);
            else resolve(records);
          });
        });

        vehicles = records.map(record => ({
          runlist_id: runlist.id,
          vin: record.VIN || record.vin || null,
          make: record.Make || record.make || "Unknown",
          model: record.Model || record.model || "Unknown", 
          year: record.Year || record.year ? parseInt(record.Year || record.year) : null,
          lane_number: record['Lane Number'] || record.lane_number || record.Lane || null,
          run_number: record['Run Number'] || record.run_number || record.Run || null,
          stock_number: record['Stock Number'] || record.stock_number || record.Stock || null,
          mileage: record.Mileage || record.mileage ? parseInt(record.Mileage || record.mileage) : null,
          color: record.Color || record.color || null,
          raw_data: record
        }));
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Parse Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        if (!worksheet) {
          throw new Error("No worksheet found in Excel file");
        }

        const headers: string[] = [];
        const records: any[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            // Header row
            row.eachCell((cell, colNumber) => {
              headers[colNumber] = cell.text || `Column${colNumber}`;
            });
          } else {
            // Data rows
            const record: any = {};
            row.eachCell((cell, colNumber) => {
              if (headers[colNumber]) {
                record[headers[colNumber]] = cell.text;
              }
            });
            if (Object.keys(record).length > 0) {
              records.push(record);
            }
          }
        });

        vehicles = records.map(record => ({
          runlist_id: runlist.id,
          vin: record.VIN || record.vin || null,
          make: record.Make || record.make || "Unknown",
          model: record.Model || record.model || "Unknown",
          year: record.Year || record.year ? parseInt(record.Year || record.year) : null,
          lane_number: record['Lane Number'] || record.lane_number || record.Lane || null,
          run_number: record['Run Number'] || record.run_number || record.Run || null,
          stock_number: record['Stock Number'] || record.stock_number || record.Stock || null,
          mileage: record.Mileage || record.mileage ? parseInt(record.Mileage || record.mileage) : null,
          color: record.Color || record.color || null,
          raw_data: record
        }));
      }

      // Bulk create vehicles
      if (vehicles.length > 0) {
        await storage.bulkCreateVehicles(vehicles);
        
        // Update runlist vehicle count
        await storage.updateRunlist(runlist.id, {
          total_vehicles: vehicles.length
        });

        // Create inspections for each vehicle
        const createdVehicles = await storage.bulkCreateVehicles(vehicles);
        
        for (const vehicle of createdVehicles) {
          await storage.createInspection({
            vehicle_id: vehicle.id,
            inspector_id: inspector_id ? parseInt(inspector_id) : null,
            status: "pending" as const,
            scheduled_date: new Date(inspection_date)
          });
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        runlistId: runlist.id,
        vehicleCount: vehicles.length,
        message: `Successfully uploaded ${vehicles.length} vehicles`
      });

    } catch (error) {
      console.error("Error uploading runlist:", error);
      res.status(500).json({ error: "Failed to upload runlist" });
    }
  });

  // Single vehicle entry route
  app.post("/api/runlists/single", async (req, res) => {
    try {
      const { auction_id, inspector_id, inspection_date, ...vehicleData } = req.body;
      
      if (!auction_id || !inspection_date || !vehicleData.vin) {
        return res.status(400).json({ error: "Auction, inspection date, and VIN are required" });
      }

      // Find or create a manual runlist for this auction and date
      const existingRunlists = await storage.getRunlists();
      let runlist = existingRunlists.find((r: any) => 
        r.auction_id === parseInt(auction_id) && 
        r.filename === 'manual_entries' &&
        new Date(r.inspection_date).toDateString() === new Date(inspection_date).toDateString()
      );

      if (!runlist) {
        runlist = await storage.createRunlist({
          auction_id: parseInt(auction_id),
          inspector_id: inspector_id ? parseInt(inspector_id) : null,
          inspection_date: new Date(inspection_date),
          filename: 'manual_entries',
          uploaded_by: 1, // Default user for now
          total_vehicles: 0
        });
      }

      // Create vehicle
      const vehicle = await storage.createVehicle({
        runlist_id: runlist.id,
        ...vehicleData,
        make: vehicleData.make || "Unknown",
        model: vehicleData.model || "Unknown"
      });

      // Update runlist vehicle count
      await storage.updateRunlist(runlist.id, {
        total_vehicles: (runlist.total_vehicles || 0) + 1
      });

      // Create inspection
      await storage.createInspection({
        vehicle_id: vehicle.id,
        inspector_id: inspector_id ? parseInt(inspector_id) : null,
        status: "pending",
        scheduled_date: new Date(inspection_date)
      });

      res.json({
        success: true,
        vehicleId: vehicle.id,
        runlistId: runlist.id,
        message: "Vehicle added successfully"
      });

    } catch (error) {
      console.error("Error adding single vehicle:", error);
      res.status(500).json({ error: "Failed to add vehicle" });
    }
  });
  
  return httpServer;
}

// Helper functions
function mapRecordToVehicle(record: any, mapping: any, runlistId: number) {
  // Map fields according to provided column mapping
  const mappedRecord: any = {};
  const columnMapping = mapping.mapping || {}; // Get the actual column mapping object
  
  // Define our column to field mapping
  const fieldMappings: Record<string, string> = {
    vin_column: "vin",
    lane_column: "lane_number",
    run_column: "run_number",
    make_column: "make",
    model_column: "model",
    year_column: "year",
    mileage_column: "mileage",
    stock_column: "stock_number",
    color_column: "color",
    body_column: "body_type",
    engine_column: "engine",
    transmission_column: "transmission",
    price_column: "auction_price",
    date_column: "auction_date",
    trim_column: "trim"
  };
  
  // Map each field using the column mapping
  for (const [columnKey, fieldName] of Object.entries(fieldMappings)) {
    if (columnMapping[columnKey]) {
      const sourceColumn = columnMapping[columnKey];
      if (record[sourceColumn] !== undefined) {
        mappedRecord[fieldName] = record[sourceColumn];
      }
    }
  }
  
  // Process the mapped record to get the vehicle data
  return {
    runlist_id: runlistId,
    stock_number: mappedRecord.stock_number || null,
    vin: mappedRecord.vin || null,
    make: mappedRecord.make || "Unknown",
    model: mappedRecord.model || "Unknown",
    trim: mappedRecord.trim || null,
    year: mappedRecord.year ? parseInt(mappedRecord.year) : null,
    mileage: mappedRecord.mileage ? parseInt(mappedRecord.mileage) : null,
    color: mappedRecord.color || null,
    body_type: mappedRecord.body_type || null,
    engine: mappedRecord.engine || null,
    transmission: mappedRecord.transmission || null,
    auction_price: mappedRecord.auction_price ? parseFloat(mappedRecord.auction_price) : null,
    auction_date: mappedRecord.auction_date || null,
    lane_number: mappedRecord.lane_number || null,
    run_number: mappedRecord.run_number || null,
    raw_data: record
  };
}

function guessVehicleMapping(record: any, runlistId: number) {
  // Focus only on the essential fields as requested
  const essentialFields = {
    vin: ["vin", "vin_number", "vinnumber", "Vin", "VIN"],
    lane_number: ["lane", "Lane", "lane_number", "lane_num", "LaneNumber", "Lane Number"],
    run_number: ["run", "Run", "run_number", "run_num", "RunNumber", "Run Number", "order", "Order"]
  };
  
  // Initialize vehicle with runlist ID
  const vehicle: any = {
    runlist_id: runlistId,
    make: "Unknown", // Will be populated from NHTSA API
    model: "Unknown", // Will be populated from NHTSA API
    raw_data: record
  };
  
  // Loop through record fields and try to match them to the essential vehicle fields
  for (const [field, possibleNames] of Object.entries(essentialFields)) {
    for (const name of possibleNames) {
      if (record[name] !== undefined) {
        vehicle[field] = record[name] || null;
        break;
      }
    }
  }
  
  return vehicle;
}