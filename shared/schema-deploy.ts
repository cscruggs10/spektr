import { pgTable, text, serial, integer, boolean, json, timestamp, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  status: text("status").notNull().default("active"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectorSchema = createInsertSchema(inspectors).pick({
  user_id: true,
  bio: true,
  rating: true,
  status: true,
});

// Auctions
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  date: timestamp("date"),
  status: text("status").notNull().default("active"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  name: true,
  description: true,
  location: true,
  date: true,
  status: true,
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
});

export const insertRunlistSchema = createInsertSchema(runlists).pick({
  auction_id: true,
  filename: true,
  processed: true,
  column_mapping: true,
  uploaded_by: true,
});

// Vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  runlist_id: integer("runlist_id").references(() => runlists.id).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  trim: text("trim"),
  body_type: text("body_type"),
  color: text("color"),
  stock_number: text("stock_number"),
  lane: text("lane"),
  run_number: integer("run_number"),
  vin: text("vin"),
  mileage: integer("mileage"),
  condition: text("condition"),
  auction_date: timestamp("auction_date"),
  estimated_value: integer("estimated_value"),
  raw_data: json("raw_data"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  runlist_id: true,
  make: true,
  model: true,
  year: true,
  trim: true,
  body_type: true,
  color: true,
  stock_number: true,
  lane: true,
  run_number: true,
  vin: true,
  mileage: true,
  condition: true,
  auction_date: true,
  estimated_value: true,
  raw_data: true,
});

// Inspection status enum
export const inspectionStatus = pgEnum("inspection_status", [
  "pending",
  "scheduled", 
  "in_progress",
  "completed",
  "canceled"
]);

// Inspections
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  vehicle_id: integer("vehicle_id").references(() => vehicles.id).notNull(),
  inspector_id: integer("inspector_id").references(() => inspectors.id),
  dealer_id: integer("dealer_id").references(() => dealers.id),
  status: inspectionStatus("status").notNull().default("pending"),
  scheduled_date: timestamp("scheduled_date"),
  completed_date: timestamp("completed_date"),
  priority: text("priority").default("medium"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectionSchema = createInsertSchema(inspections).pick({
  vehicle_id: true,
  inspector_id: true,
  dealer_id: true,
  status: true,
  scheduled_date: true,
  completed_date: true,
  priority: true,
  notes: true,
});

// Inspection Results
export const inspectionResults = pgTable("inspection_results", {
  id: serial("id").primaryKey(),
  inspection_id: integer("inspection_id").references(() => inspections.id).notNull(),
  photos: json("photos"),
  walkaround_video: text("walkaround_video"),
  engine_video: text("engine_video"),
  cosmetic_estimate: integer("cosmetic_estimate"),
  mechanical_estimate: integer("mechanical_estimate"),
  voice_notes: json("voice_notes"),
  overall_condition: text("overall_condition"),
  recommendation: text("recommendation"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectionResultSchema = createInsertSchema(inspectionResults).pick({
  inspection_id: true,
  photos: true,
  walkaround_video: true,
  engine_video: true,
  cosmetic_estimate: true,
  mechanical_estimate: true,
  voice_notes: true,
  overall_condition: true,
  recommendation: true,
});

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  inspector: one(inspectors, {
    fields: [users.id],
    references: [inspectors.user_id],
  }),
}));

export const dealersRelations = relations(dealers, ({ many }) => ({
  inspections: many(inspections),
}));

export const inspectorsRelations = relations(inspectors, ({ one, many }) => ({
  user: one(users, {
    fields: [inspectors.user_id],
    references: [users.id],
  }),
  inspections: many(inspections),
}));

export const auctionsRelations = relations(auctions, ({ many }) => ({
  runlists: many(runlists),
}));

export const runlistsRelations = relations(runlists, ({ one, many }) => ({
  auction: one(auctions, {
    fields: [runlists.auction_id],
    references: [auctions.id],
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

export const inspectionsRelations = relations(inspections, ({ one }) => ({
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
  result: one(inspectionResults, {
    fields: [inspections.id],
    references: [inspectionResults.inspection_id],
  }),
}));

export const inspectionResultsRelations = relations(inspectionResults, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionResults.inspection_id],
    references: [inspections.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Dealer = typeof dealers.$inferSelect;
export type InsertDealer = z.infer<typeof insertDealerSchema>;

export type Inspector = typeof inspectors.$inferSelect;
export type InsertInspector = z.infer<typeof insertInspectorSchema>;

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type Runlist = typeof runlists.$inferSelect;
export type InsertRunlist = z.infer<typeof insertRunlistSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type InspectionResult = typeof inspectionResults.$inferSelect;
export type InsertInspectionResult = z.infer<typeof insertInspectionResultSchema>;