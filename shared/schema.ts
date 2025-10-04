import { pgTable, text, serial, integer, boolean, json, timestamp, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Users and authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Dealers
export const dealers = pgTable("dealers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact_name: text("contact_name").notNull(),
  contact_email: text("contact_email").notNull(),
  contact_phone: text("contact_phone"),
  address: text("address"),
  status: text("status").notNull().default("active"),
  joined_date: timestamp("joined_date").defaultNow().notNull(),
});

export const insertDealerSchema = createInsertSchema(dealers).pick({
  name: true,
  contact_name: true,
  contact_email: true,
  contact_phone: true,
  address: true,
  status: true,
});

// Inspectors
export const inspectors = pgTable("inspectors", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  bio: text("bio"),
  rating: integer("rating"),
  active: boolean("active").notNull().default(true),
  language: text("language").notNull().default("en"), // 'en' for English, 'es' for Spanish
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Inspector-Auction assignments (many-to-many relationship)
export const inspectorAuctions = pgTable("inspector_auctions", {
  id: serial("id").primaryKey(),
  inspector_id: integer("inspector_id").references(() => inspectors.id).notNull(),
  auction_id: integer("auction_id").references(() => auctions.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectorSchema = createInsertSchema(inspectors).pick({
  user_id: true,
  bio: true,
  active: true,
});

export const insertInspectorAuctionSchema = createInsertSchema(inspectorAuctions).omit({
  id: true,
  created_at: true,
});

// Buy Box criteria
export const buyBoxItems = pgTable("buy_box_items", {
  id: serial("id").primaryKey(),
  dealer_id: integer("dealer_id").references(() => dealers.id).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  year_min: integer("year_min"),
  year_max: integer("year_max"),
  mileage_min: integer("mileage_min"),
  mileage_max: integer("mileage_max"),
  body_type: text("body_type"),
  color: text("color"),
  structural_damage: boolean("structural_damage").default(false),
  max_accidents: integer("max_accidents"),
  max_owners: integer("max_owners"),
  damage_severity: text("damage_severity"), // Minor, Moderate, Severe
  leather: boolean("leather").default(false),
  sunroof: boolean("sunroof").default(false),
  price_min: integer("price_min"),
  price_max: integer("price_max"),
  status: text("status").notNull().default("active"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertBuyBoxItemSchema = createInsertSchema(buyBoxItems).omit({
  id: true,
  created_at: true,
});

// Auction Houses
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  location: text("location").default("Unknown").notNull(),
  address: text("address").default("Unknown").notNull(),
  auction_group: text("auction_group"), // e.g., "Auto Nation", "Regular", etc.
  requires_vin: boolean("requires_vin").default(true), // false for Auto Nation
  run_format: text("run_format").default("separate"), // "combined" for Auto Nation, "separate" for regular
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

// Auction schedule - defines when auctions and inspections occur
export const auctionSchedules = pgTable("auction_schedules", {
  id: serial("id").primaryKey(),
  auction_id: integer("auction_id").references(() => auctions.id).notNull(),
  day_type: text("day_type").notNull(), // 'auction' or 'inspection'
  day_of_week: text("day_of_week").notNull(), // Monday, Tuesday, etc.
  start_time: text("start_time").notNull(), // Format: "HH:MM" in 24-hour format
  end_time: text("end_time").notNull(), // Format: "HH:MM" in 24-hour format
  slots_per_hour: integer("slots_per_hour").default(4), // For inspection days, how many slots per hour
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Base auction schedule schema from Drizzle
const baseAuctionScheduleSchema = createInsertSchema(auctionSchedules).omit({
  id: true,
  created_at: true,
});

// Enhanced auction schedule schema with additional validations
export const insertAuctionScheduleSchema = baseAuctionScheduleSchema;

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  name: true,
  description: true,
  location: true,
  address: true,
}).partial({ address: true }).extend({
  // Add Railway-specific fields for compatibility
  date: z.date().optional(),
  status: z.string().optional(),
});

// Runlists
export const runlists = pgTable("runlists", {
  id: serial("id").primaryKey(),
  auction_id: integer("auction_id").references(() => auctions.id).notNull(),
  filename: text("filename").notNull(),
  upload_date: timestamp("upload_date").defaultNow().notNull(),
  processed: boolean("processed").default(false),
  column_mapping: json("column_mapping"),
  uploaded_by: integer("uploaded_by").references(() => users.id),
  // Package-related fields for inspector workflow
  package_name: text("package_name"), // Friendly name for the inspection package
  assigned_inspector_id: integer("assigned_inspector_id").references(() => inspectors.id), // Which inspector should do this package
  package_status: text("package_status").default("pending"), // 'pending', 'in_progress', 'completed'
  is_package: boolean("is_package").default(false), // Whether this runlist represents an inspection package
});

// Base runlist schema from Drizzle
const baseRunlistSchema = createInsertSchema(runlists).omit({
  id: true,
  upload_date: true,
});

// Enhanced runlist schema with proper date handling
export const insertRunlistSchema = baseRunlistSchema;

// Vehicles (from runlists)
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  runlist_id: integer("runlist_id").references(() => runlists.id).notNull(),
  stock_number: text("stock_number"),
  vin: text("vin"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  year: integer("year"),
  mileage: integer("mileage"),
  color: text("color"),
  body_type: text("body_type"),
  engine: text("engine"),
  transmission: text("transmission"),
  auction_price: integer("auction_price"),
  auction_date: timestamp("auction_date"),
  lane_number: text("lane_number"),
  run_number: text("run_number"),
  raw_data: json("raw_data"),
});

// Base vehicle schema from Drizzle
const baseVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

// Enhanced vehicle schema with proper date handling
export const insertVehicleSchema = baseVehicleSchema.extend({
  // Allow date fields to accept ISO strings that will be converted to dates
  auction_date: z.string().datetime().optional().or(z.date().optional()),
});

// Inspection templates
export const inspectionTemplates = pgTable("inspection_templates", {
  id: serial("id").primaryKey(),
  dealer_id: integer("dealer_id").references(() => dealers.id).notNull(),
  name: text("name").notNull(),
  fields: json("fields").notNull(),
  require_photos: boolean("require_photos").default(true),
  require_videos: boolean("require_videos").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInspectionTemplateSchema = createInsertSchema(inspectionTemplates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Inspection status enum
export const inspectionStatusEnum = pgEnum("inspection_status", [
  "pending",
  "scheduled",
  "in_progress",
  "completed",
  "canceled",
]);

// Inspections
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  vehicle_id: integer("vehicle_id").references(() => vehicles.id).notNull(),
  dealer_id: integer("dealer_id").references(() => dealers.id), // Made optional for simplified system
  inspector_id: integer("inspector_id").references(() => inspectors.id),
  template_id: integer("template_id").references(() => inspectionTemplates.id), // Made optional
  status: inspectionStatusEnum("status").notNull().default("pending"),
  scheduled_date: timestamp("scheduled_date"),
  auction_start_date: timestamp("auction_start_date"), // Date the auction runs
  start_date: timestamp("start_date"),
  completion_date: timestamp("completion_date"),
  notes: text("notes"),
  cosmetic_estimate: integer("cosmetic_estimate"),
  cosmetic_details: text("cosmetic_details"),
  mechanical_estimate: integer("mechanical_estimate"),
  mechanical_details: text("mechanical_details"),
  voice_note_url: text("voice_note_url"),
  is_recommended: boolean("is_recommended").default(false),
  reviewed: boolean("reviewed").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Base inspection schema from Drizzle
const baseInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  created_at: true,
});

// Enhanced inspection schema with proper date handling
export const insertInspectionSchema = baseInspectionSchema.extend({
  // Allow date fields to accept ISO strings that will be converted to dates
  scheduled_date: z.string().datetime().optional().or(z.date().optional()),
  auction_start_date: z.string().datetime().optional().or(z.date().optional()),
  start_date: z.string().datetime().optional().or(z.date().optional()),
  completion_date: z.string().datetime().optional().or(z.date().optional()),
});

// Inspection results
export const inspectionResults = pgTable("inspection_results", {
  id: serial("id").primaryKey(),
  inspection_id: integer("inspection_id").references(() => inspections.id).notNull(),
  data: json("data").notNull(),
  photos: json("photos"),
  videos: json("videos"),
  links: json("links"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectionResultSchema = createInsertSchema(inspectionResults).omit({
  id: true,
  created_at: true,
});

// Purchase status
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "pending",
  "purchased",
  "not_purchased",
]);

// Purchase tracking
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  inspection_id: integer("inspection_id").references(() => inspections.id).notNull().unique(),
  dealer_id: integer("dealer_id").references(() => dealers.id).notNull(),
  status: purchaseStatusEnum("status").notNull().default("pending"),
  purchase_date: timestamp("purchase_date"),
  purchase_price: integer("purchase_price"),
  arrival_date: timestamp("arrival_date"),
  feedback_provided: boolean("feedback_provided").default(false),
  feedback_rating: integer("feedback_rating"),
  feedback_comments: text("feedback_comments"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Base purchase schema from Drizzle
const basePurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  created_at: true,
});

// Enhanced purchase schema with proper date handling
export const insertPurchaseSchema = basePurchaseSchema.extend({
  // Allow date fields to accept ISO strings that will be converted to dates
  purchase_date: z.string().datetime().optional().or(z.date().optional()),
  arrival_date: z.string().datetime().optional().or(z.date().optional()),
});

// Column mapping templates
export const columnMappings = pgTable("column_mappings", {
  id: serial("id").primaryKey(),
  auction_id: integer("auction_id").references(() => auctions.id).notNull(),
  name: text("name").notNull(),
  mapping: json("mapping").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertColumnMappingSchema = createInsertSchema(columnMappings).omit({
  id: true,
  created_at: true,
});

// Inspector activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'inspection_completed', 'inspection_shared', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").default(false),
  related_id: integer("related_id"), // Can be inspection_id, vehicle_id, etc.
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true,
});

// Shared inspection reports
export const sharedReports = pgTable("shared_reports", {
  id: serial("id").primaryKey(),
  inspection_id: integer("inspection_id").references(() => inspections.id).notNull(),
  shared_by: integer("shared_by").references(() => users.id).notNull(),
  shared_with_email: text("shared_with_email"),
  share_token: text("share_token").notNull().unique(),
  expiry_date: timestamp("expiry_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertSharedReportSchema = createInsertSchema(sharedReports).omit({
  id: true,
  created_at: true,
});



// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  inspector: one(inspectors, {
    fields: [users.id],
    references: [inspectors.user_id],
  }),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
}));

export const dealersRelations = relations(dealers, ({ many }) => ({
  buyBoxItems: many(buyBoxItems),
  inspectionTemplates: many(inspectionTemplates),
  inspections: many(inspections),
  purchases: many(purchases),
}));

export const buyBoxItemsRelations = relations(buyBoxItems, ({ one }) => ({
  dealer: one(dealers, {
    fields: [buyBoxItems.dealer_id],
    references: [dealers.id],
  }),
}));

export const inspectorsRelations = relations(inspectors, ({ one, many }) => ({
  user: one(users, {
    fields: [inspectors.user_id],
    references: [users.id],
  }),
  auctions: many(inspectorAuctions, { relationName: "inspector_auctions" }),
  inspections: many(inspections),
}));

export const inspectorAuctionsRelations = relations(inspectorAuctions, ({ one }) => ({
  inspector: one(inspectors, {
    fields: [inspectorAuctions.inspector_id],
    references: [inspectors.id],
    relationName: "inspector_auctions",
  }),
  auction: one(auctions, {
    fields: [inspectorAuctions.auction_id],
    references: [auctions.id],
    relationName: "auction_inspectors",
  }),
}));

export const auctionSchedulesRelations = relations(auctionSchedules, ({ one }) => ({
  auction: one(auctions, {
    fields: [auctionSchedules.auction_id],
    references: [auctions.id],
  }),
}));

export const auctionsRelations = relations(auctions, ({ many }) => ({
  schedules: many(auctionSchedules),
  runlists: many(runlists),
  columnMappings: many(columnMappings),
  inspectors: many(inspectorAuctions, { relationName: "auction_inspectors" }),
}));

export const runlistsRelations = relations(runlists, ({ one, many }) => ({
  auction: one(auctions, {
    fields: [runlists.auction_id],
    references: [auctions.id],
  }),
  uploader: one(users, {
    fields: [runlists.uploaded_by],
    references: [users.id],
  }),
  assignedInspector: one(inspectors, {
    fields: [runlists.assigned_inspector_id],
    references: [inspectors.id],
  }),
  vehicles: many(vehicles),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  runlist: one(runlists, {
    fields: [vehicles.runlist_id],
    references: [runlists.id],
  }),
  inspections: many(inspections),
}));

export const inspectionTemplatesRelations = relations(inspectionTemplates, ({ one, many }) => ({
  dealer: one(dealers, {
    fields: [inspectionTemplates.dealer_id],
    references: [dealers.id],
  }),
  inspections: many(inspections),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [inspections.vehicle_id],
    references: [vehicles.id],
  }),
  dealer: one(dealers, {
    fields: [inspections.dealer_id],
    references: [dealers.id],
  }),
  inspector: one(inspectors, {
    fields: [inspections.inspector_id],
    references: [inspectors.id],
  }),
  template: one(inspectionTemplates, {
    fields: [inspections.template_id],
    references: [inspectionTemplates.id],
  }),
  result: one(inspectionResults, {
    fields: [inspections.id],
    references: [inspectionResults.inspection_id],
  }),
  purchase: one(purchases, {
    fields: [inspections.id],
    references: [purchases.inspection_id],
  }),
}));

export const inspectionResultsRelations = relations(inspectionResults, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionResults.inspection_id],
    references: [inspections.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  inspection: one(inspections, {
    fields: [purchases.inspection_id],
    references: [inspections.id],
  }),
  dealer: one(dealers, {
    fields: [purchases.dealer_id],
    references: [dealers.id],
  }),
}));

export const columnMappingsRelations = relations(columnMappings, ({ one }) => ({
  auction: one(auctions, {
    fields: [columnMappings.auction_id],
    references: [auctions.id],
  }),
}));

// Vehicle Make Aliases
export const vehicleMakeAliases = pgTable("vehicle_make_aliases", {
  id: serial("id").primaryKey(),
  canonical_make: text("canonical_make").notNull(), // The standardized make name
  alias: text("alias").notNull(), // The variant of the make name
  auction_id: integer("auction_id").references(() => auctions.id), // Optional: specific to an auction
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleMakeAliasSchema = createInsertSchema(vehicleMakeAliases).omit({
  id: true,
  created_at: true,
});

// Vehicle Model Aliases
export const vehicleModelAliases = pgTable("vehicle_model_aliases", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(), // The make this model belongs to
  canonical_model: text("canonical_model").notNull(), // The standardized model name
  alias: text("alias").notNull(), // The variant of the model name
  auction_id: integer("auction_id").references(() => auctions.id), // Optional: specific to an auction
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleModelAliasSchema = createInsertSchema(vehicleModelAliases).omit({
  id: true,
  created_at: true,
});

// NHTSA Vehicle Makes and Models
export const vehicleMakes = pgTable("vehicle_makes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  external_id: text("external_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleMakeSchema = createInsertSchema(vehicleMakes).omit({
  id: true,
  created_at: true,
});

export const vehicleModels = pgTable("vehicle_models", {
  id: serial("id").primaryKey(),
  make_id: integer("make_id").notNull().references(() => vehicleMakes.id),
  name: text("name").notNull(),
  external_id: text("external_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleModelSchema = createInsertSchema(vehicleModels).omit({
  id: true,
  created_at: true,
});

// Add relationships
export const vehicleMakeAliasesRelations = relations(vehicleMakeAliases, ({ one }) => ({
  auction: one(auctions, {
    fields: [vehicleMakeAliases.auction_id],
    references: [auctions.id],
  }),
}));

export const vehicleModelAliasesRelations = relations(vehicleModelAliases, ({ one }) => ({
  auction: one(auctions, {
    fields: [vehicleModelAliases.auction_id],
    references: [auctions.id],
  }),
}));

export const vehicleMakesRelations = relations(vehicleMakes, ({ many }) => ({
  models: many(vehicleModels),
}));

export const vehicleModelsRelations = relations(vehicleModels, ({ one }) => ({
  make: one(vehicleMakes, {
    fields: [vehicleModels.make_id],
    references: [vehicleMakes.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.user_id],
    references: [users.id],
  }),
}));



export const sharedReportsRelations = relations(sharedReports, ({ one }) => ({
  inspection: one(inspections, {
    fields: [sharedReports.inspection_id],
    references: [inspections.id],
  }),
  sharedBy: one(users, {
    fields: [sharedReports.shared_by],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Dealer = typeof dealers.$inferSelect;
export type InsertDealer = z.infer<typeof insertDealerSchema>;

export type Inspector = typeof inspectors.$inferSelect;
export type InsertInspector = z.infer<typeof insertInspectorSchema>;

export type BuyBoxItem = typeof buyBoxItems.$inferSelect;
export type InsertBuyBoxItem = z.infer<typeof insertBuyBoxItemSchema>;

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type AuctionSchedule = typeof auctionSchedules.$inferSelect;
export type InsertAuctionSchedule = z.infer<typeof insertAuctionScheduleSchema>;

export type InspectorAuction = typeof inspectorAuctions.$inferSelect;
export type InsertInspectorAuction = z.infer<typeof insertInspectorAuctionSchema>;

export type Runlist = typeof runlists.$inferSelect;
export type InsertRunlist = z.infer<typeof insertRunlistSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type InspectionTemplate = typeof inspectionTemplates.$inferSelect;
export type InsertInspectionTemplate = z.infer<typeof insertInspectionTemplateSchema>;

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type InspectionResult = typeof inspectionResults.$inferSelect;
export type InsertInspectionResult = z.infer<typeof insertInspectionResultSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type ColumnMapping = typeof columnMappings.$inferSelect;
export type InsertColumnMapping = z.infer<typeof insertColumnMappingSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type VehicleMakeAlias = typeof vehicleMakeAliases.$inferSelect;
export type InsertVehicleMakeAlias = z.infer<typeof insertVehicleMakeAliasSchema>;

export type VehicleModelAlias = typeof vehicleModelAliases.$inferSelect;
export type InsertVehicleModelAlias = z.infer<typeof insertVehicleModelAliasSchema>;

export type VehicleMake = typeof vehicleMakes.$inferSelect;
export type InsertVehicleMake = z.infer<typeof insertVehicleMakeSchema>;

export type VehicleModel = typeof vehicleModels.$inferSelect;
export type InsertVehicleModel = z.infer<typeof insertVehicleModelSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type SharedReport = typeof sharedReports.$inferSelect;
export type InsertSharedReport = z.infer<typeof insertSharedReportSchema>;


