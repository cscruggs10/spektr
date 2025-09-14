import { pgTable, serial, integer, text, timestamp, boolean, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("inspector"), // inspector, admin
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Auctions
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  name: true,
  location: true,
  address: true,
  description: true,
});

// Inspectors
export const inspectors = pgTable("inspectors", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  active: boolean("active").default(true),
  bio: text("bio"),
  rating: integer("rating"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectorSchema = createInsertSchema(inspectors).pick({
  user_id: true,
  name: true,
  email: true,
  phone: true,
  active: true,
  bio: true,
  rating: true,
});

// Inspector-Auction assignments (many-to-many)
export const inspectorAuctions = pgTable("inspector_auctions", {
  id: serial("id").primaryKey(),
  inspector_id: integer("inspector_id").references(() => inspectors.id).notNull(),
  auction_id: integer("auction_id").references(() => auctions.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectorAuctionSchema = createInsertSchema(inspectorAuctions).omit({
  id: true,
  created_at: true,
});

// Runlists
export const runlists = pgTable("runlists", {
  id: serial("id").primaryKey(),
  auction_id: integer("auction_id").references(() => auctions.id).notNull(),
  inspector_id: integer("inspector_id").references(() => inspectors.id),
  inspection_date: timestamp("inspection_date").notNull(),
  filename: text("filename").notNull(),
  total_vehicles: integer("total_vehicles").default(0),
  uploaded_by: integer("uploaded_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

const baseRunlistSchema = createInsertSchema(runlists).omit({
  id: true,
  created_at: true,
});

export const insertRunlistSchema = baseRunlistSchema.extend({
  inspection_date: z.string().datetime().or(z.date()),
});

// Vehicles
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
  created_at: timestamp("created_at").defaultNow().notNull(),
});

const baseVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  created_at: true,
});

export const insertVehicleSchema = baseVehicleSchema.extend({
  auction_date: z.string().datetime().optional().or(z.date().optional()),
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
  inspector_id: integer("inspector_id").references(() => inspectors.id),
  status: inspectionStatusEnum("status").notNull().default("pending"),
  scheduled_date: timestamp("scheduled_date"),
  start_date: timestamp("start_date"),
  completion_date: timestamp("completion_date"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

const baseInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  created_at: true,
});

export const insertInspectionSchema = baseInspectionSchema.extend({
  scheduled_date: z.string().datetime().optional().or(z.date().optional()),
  start_date: z.string().datetime().optional().or(z.date().optional()),
  completion_date: z.string().datetime().optional().or(z.date().optional()),
});

// Inspection results
export const inspectionResults = pgTable("inspection_results", {
  id: serial("id").primaryKey(),
  inspection_id: integer("inspection_id").references(() => inspections.id).notNull().unique(),
  data: json("data"),
  photos: json("photos").default([]),
  videos: json("videos").default([]),
  audio_notes: json("audio_notes").default([]),
  links: json("links").default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectionResultSchema = createInsertSchema(inspectionResults).omit({
  id: true,
  created_at: true,
});

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  inspector: one(inspectors, {
    fields: [users.id],
    references: [inspectors.user_id],
  }),
  activityLogs: many(activityLogs),
}));

export const inspectorsRelations = relations(inspectors, ({ one, many }) => ({
  user: one(users, {
    fields: [inspectors.user_id],
    references: [users.id],
  }),
  auctions: many(inspectorAuctions),
  inspections: many(inspections),
  runlists: many(runlists),
}));

export const inspectorAuctionsRelations = relations(inspectorAuctions, ({ one }) => ({
  inspector: one(inspectors, {
    fields: [inspectorAuctions.inspector_id],
    references: [inspectors.id],
  }),
  auction: one(auctions, {
    fields: [inspectorAuctions.auction_id],
    references: [auctions.id],
  }),
}));

export const auctionsRelations = relations(auctions, ({ many }) => ({
  runlists: many(runlists),
  inspectors: many(inspectorAuctions),
}));

export const runlistsRelations = relations(runlists, ({ one, many }) => ({
  auction: one(auctions, {
    fields: [runlists.auction_id],
    references: [auctions.id],
  }),
  inspector: one(inspectors, {
    fields: [runlists.inspector_id],
    references: [inspectors.id],
  }),
  uploader: one(users, {
    fields: [runlists.uploaded_by],
    references: [users.id],
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

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.user_id],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type Inspector = typeof inspectors.$inferSelect;
export type InsertInspector = z.infer<typeof insertInspectorSchema>;

export type InspectorAuction = typeof inspectorAuctions.$inferSelect;
export type InsertInspectorAuction = z.infer<typeof insertInspectorAuctionSchema>;

export type Runlist = typeof runlists.$inferSelect;
export type InsertRunlist = z.infer<typeof insertRunlistSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type InspectionResult = typeof inspectionResults.$inferSelect;
export type InsertInspectionResult = z.infer<typeof insertInspectionResultSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;