import { 
  users, runlists, dealers, inspectors, inspectorAuctions, buyBoxItems, auctions, auctionSchedules, vehicles, 
  inspectionTemplates, inspections, inspectionResults, purchases, 
  columnMappings, activityLogs, vehicleMakeAliases, vehicleModelAliases,
  notifications, sharedReports,
  type User, type InsertUser, type Dealer, type InsertDealer,
  type Inspector, type InsertInspector, type InspectorAuction, type InsertInspectorAuction,
  type BuyBoxItem, type InsertBuyBoxItem,
  type Auction, type InsertAuction, type AuctionSchedule, type InsertAuctionSchedule,
  type Runlist, type InsertRunlist, type Vehicle, type InsertVehicle, 
  type InspectionTemplate, type InsertInspectionTemplate,
  type Inspection, type InsertInspection, type InspectionResult, type InsertInspectionResult,
  type Purchase, type InsertPurchase, type ColumnMapping, type InsertColumnMapping,
  type ActivityLog, type InsertActivityLog, type VehicleMakeAlias, type InsertVehicleMakeAlias,
  type VehicleModelAlias, type InsertVehicleModelAlias, type Notification, type InsertNotification,
  type SharedReport, type InsertSharedReport
} from "../shared/schema.js";
import { db } from "./db";
import { eq, and, or, gte, lte, desc, sql, between, inArray, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Notification management
  getNotifications(userId: number, onlyUnread?: boolean): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Shared reports management
  getSharedReports(inspectionId: number): Promise<SharedReport[]>;
  getSharedReportByToken(token: string): Promise<SharedReport | undefined>;
  createSharedReport(report: InsertSharedReport): Promise<SharedReport>;
  deleteSharedReport(id: number): Promise<boolean>;

  // Dealer management
  getDealers(): Promise<Dealer[]>;
  getDealer(id: number): Promise<Dealer | undefined>;
  createDealer(dealer: InsertDealer): Promise<Dealer>;
  updateDealer(id: number, data: Partial<InsertDealer>): Promise<Dealer | undefined>;

  // Inspector management
  getInspectors(): Promise<(Inspector & { user: User, auctions?: Auction[] })[]>;
  getInspectorsByAuction(auctionId: number): Promise<(Inspector & { user: User })[]>;
  getInspector(id: number): Promise<Inspector | undefined>;
  getInspectorById(id: number): Promise<(Inspector & { user: User }) | undefined>;
  getInspectorByPassword(password: string): Promise<(Inspector & { user: User }) | undefined>;
  createInspector(inspector: InsertInspector): Promise<Inspector>;
  updateInspector(id: number, data: Partial<InsertInspector>): Promise<Inspector | undefined>;
  
  // Inspector-Auction assignments
  getInspectorAuctions(inspectorId: number): Promise<InspectorAuction[]>;
  assignInspectorToAuction(assignment: InsertInspectorAuction): Promise<InspectorAuction>;
  removeInspectorFromAuction(inspectorId: number, auctionId: number): Promise<boolean>;

  // Buy Box management
  getBuyBoxItems(dealerId?: number): Promise<BuyBoxItem[]>;
  getBuyBoxItem(id: number): Promise<BuyBoxItem | undefined>;
  createBuyBoxItem(item: InsertBuyBoxItem): Promise<BuyBoxItem>;
  updateBuyBoxItem(id: number, data: Partial<InsertBuyBoxItem>): Promise<BuyBoxItem | undefined>;
  deleteBuyBoxItem(id: number): Promise<boolean>;

  // Auction management
  getAuctions(): Promise<Auction[]>;
  getAuction(id: number): Promise<Auction | undefined>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  deleteAuction(id: number): Promise<boolean>;
  
  // Auction schedule management
  getAuctionSchedules(auctionId?: number): Promise<AuctionSchedule[]>;
  getAuctionSchedule(id: number): Promise<AuctionSchedule | undefined>;
  createAuctionSchedule(schedule: InsertAuctionSchedule): Promise<AuctionSchedule>;
  updateAuctionSchedule(id: number, data: Partial<InsertAuctionSchedule>): Promise<AuctionSchedule | undefined>;
  deleteAuctionSchedule(id: number): Promise<boolean>;

  // Runlist management
  getRunlists(): Promise<Runlist[]>;
  getRunlist(id: number): Promise<Runlist | undefined>;
  createRunlist(runlist: InsertRunlist): Promise<Runlist>;
  updateRunlist(id: number, data: Partial<InsertRunlist>): Promise<Runlist | undefined>;

  // Vehicle management
  getVehicles(runlistId?: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  bulkCreateVehicles(vehicles: InsertVehicle[]): Promise<Vehicle[]>;
  matchVehiclesToBuyBoxes(vehicles: Vehicle[]): Promise<{vehicle: Vehicle, matches: BuyBoxItem[]}[]>;

  // Inspection template management
  getInspectionTemplates(dealerId?: number): Promise<InspectionTemplate[]>;
  getInspectionTemplate(id: number): Promise<InspectionTemplate | undefined>;
  createInspectionTemplate(template: InsertInspectionTemplate): Promise<InspectionTemplate>;
  updateInspectionTemplate(id: number, data: Partial<InsertInspectionTemplate>): Promise<InspectionTemplate | undefined>;

  // Inspection management
  getInspections(filters?: {
    dealerId?: number;
    inspectorId?: number;
    status?: string;
    auctionId?: number;
    startDate?: Date;
    endDate?: Date;
    vinLast6?: string;
    laneNumber?: string;
    runNumber?: string;
  }): Promise<(Inspection & { vehicle: Vehicle, dealer?: Dealer, inspector?: Inspector })[]>;
  getInspection(id: number): Promise<Inspection | undefined>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: number, data: Partial<InsertInspection>): Promise<Inspection | undefined>;
  deleteInspection(id: number): Promise<boolean>;

  // Inspection results
  getInspectionResult(inspectionId: number): Promise<InspectionResult | undefined>;
  createInspectionResult(result: InsertInspectionResult): Promise<InspectionResult>;
  updateInspectionResult(id: number, data: Partial<InsertInspectionResult>): Promise<InspectionResult | undefined>;

  // Purchase tracking
  getPurchases(dealerId?: number): Promise<(Purchase & { inspection: Inspection })[]>;
  getPurchase(id: number): Promise<Purchase | undefined>;
  getPurchaseByInspectionId(inspectionId: number): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: number, data: Partial<InsertPurchase>): Promise<Purchase | undefined>;

  // Column mapping
  getColumnMappings(auctionId?: number): Promise<ColumnMapping[]>;
  getColumnMapping(id: number): Promise<ColumnMapping | undefined>;
  createColumnMapping(mapping: InsertColumnMapping): Promise<ColumnMapping>;
  updateColumnMapping(id: number, data: Partial<InsertColumnMapping>): Promise<ColumnMapping | undefined>;

  // Vehicle make/model alias management
  getVehicleMakeAliases(auctionId?: number): Promise<VehicleMakeAlias[]>;
  createVehicleMakeAlias(alias: InsertVehicleMakeAlias): Promise<VehicleMakeAlias>;
  deleteVehicleMakeAlias(id: number): Promise<boolean>;
  
  getVehicleModelAliases(make: string, auctionId?: number): Promise<VehicleModelAlias[]>;
  createVehicleModelAlias(alias: InsertVehicleModelAlias): Promise<VehicleModelAlias>;
  deleteVehicleModelAlias(id: number): Promise<boolean>;
  
  // Normalize vehicle make/model for matching
  normalizeVehicleMake(make: string, auctionId?: number): Promise<string>;
  normalizeVehicleModel(make: string, model: string, auctionId?: number): Promise<string>;

  // Activity logs
  getActivityLogs(limit?: number): Promise<(ActivityLog & { user: User })[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;



  // Dashboard data
  getDashboardStats(): Promise<{
    pendingInspections: number;
    completedToday: number;
    todayMatches: number;
    activeDealers: number;
    avgCompletionTime: number;
    activeInspectors: number;
  }>;
  getUpcomingInspections(limit?: number): Promise<(Inspection & { 
    vehicle: Vehicle;
    dealer: Dealer;
    inspector?: Inspector;
  })[]>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Dealer management
  async getDealers(): Promise<Dealer[]> {
    return db.select().from(dealers).orderBy(dealers.name);
  }

  async getDealer(id: number): Promise<Dealer | undefined> {
    const [dealer] = await db.select().from(dealers).where(eq(dealers.id, id));
    return dealer;
  }

  async createDealer(dealer: InsertDealer): Promise<Dealer> {
    const [createdDealer] = await db.insert(dealers).values(dealer).returning();
    return createdDealer;
  }

  async updateDealer(id: number, data: Partial<InsertDealer>): Promise<Dealer | undefined> {
    const [updatedDealer] = await db
      .update(dealers)
      .set(data)
      .where(eq(dealers.id, id))
      .returning();
    return updatedDealer;
  }

  // Inspector management
  async getInspectors(): Promise<(Inspector & { user: User, auctions?: Auction[] })[]> {
    // Get all inspectors with their user information
    const inspectorResults = await db.query.inspectors.findMany({
      with: {
        user: true
      },
      orderBy: (inspectors, { asc }) => [asc(inspectors.id)]
    });
    
    // For each inspector, get their assigned auctions
    const resultsWithAuctions = await Promise.all(
      inspectorResults.map(async (inspector) => {
        const assignedAuctions = await db
          .select({
            auction: auctions
          })
          .from(inspectorAuctions)
          .innerJoin(auctions, eq(inspectorAuctions.auction_id, auctions.id))
          .where(eq(inspectorAuctions.inspector_id, inspector.id));
        
        return {
          ...inspector,
          auctions: assignedAuctions.map(result => result.auction)
        };
      })
    );
    
    return resultsWithAuctions;
  }
  
  async getInspectorsByAuction(auctionId: number): Promise<(Inspector & { user: User })[]> {
    const results = await db.select({
      inspector: inspectors,
      user: users
    })
    .from(inspectorAuctions)
    .innerJoin(inspectors, eq(inspectorAuctions.inspector_id, inspectors.id))
    .innerJoin(users, eq(inspectors.user_id, users.id))
    .where(eq(inspectorAuctions.auction_id, auctionId))
    .orderBy(inspectors.id);
    
    return results.map(r => ({
      ...r.inspector,
      user: r.user
    }));
  }

  async getInspector(id: number): Promise<Inspector | undefined> {
    const [inspector] = await db.select().from(inspectors).where(eq(inspectors.id, id));
    return inspector;
  }

  async createInspector(inspector: InsertInspector): Promise<Inspector> {
    const [createdInspector] = await db.insert(inspectors).values(inspector).returning();
    return createdInspector;
  }

  async updateInspector(id: number, data: Partial<InsertInspector>): Promise<Inspector | undefined> {
    const [updatedInspector] = await db
      .update(inspectors)
      .set(data)
      .where(eq(inspectors.id, id))
      .returning();
    return updatedInspector;
  }

  async getInspectorById(id: number): Promise<(Inspector & { user: User }) | undefined> {
    const [result] = await db.select()
      .from(inspectors)
      .innerJoin(users, eq(inspectors.user_id, users.id))
      .where(eq(inspectors.id, id));

    if (!result) return undefined;

    return {
      ...result.inspectors,
      user: result.users
    };
  }

  async getInspectorByPassword(password: string): Promise<(Inspector & { user: User }) | undefined> {
    const [result] = await db.select()
      .from(inspectors)
      .innerJoin(users, eq(inspectors.user_id, users.id))
      .where(eq(users.password, password));

    if (!result) return undefined;

    return {
      ...result.inspectors,
      user: result.users
    };
  }

  // Inspector-Auction assignments
  async getInspectorAuctions(inspectorId: number): Promise<InspectorAuction[]> {
    return db.select()
      .from(inspectorAuctions)
      .where(eq(inspectorAuctions.inspector_id, inspectorId))
      .orderBy(inspectorAuctions.auction_id);
  }
  
  async assignInspectorToAuction(assignment: InsertInspectorAuction): Promise<InspectorAuction> {
    // Check if this assignment already exists
    const existingAssignments = await db.select()
      .from(inspectorAuctions)
      .where(
        and(
          eq(inspectorAuctions.inspector_id, assignment.inspector_id),
          eq(inspectorAuctions.auction_id, assignment.auction_id)
        )
      );
    
    // If it already exists, just return the existing assignment
    if (existingAssignments.length > 0) {
      return existingAssignments[0];
    }
    
    // Otherwise, create a new assignment
    const [createdAssignment] = await db.insert(inspectorAuctions)
      .values(assignment)
      .returning();
    
    return createdAssignment;
  }
  
  async removeInspectorFromAuction(inspectorId: number, auctionId: number): Promise<boolean> {
    await db.delete(inspectorAuctions)
      .where(
        and(
          eq(inspectorAuctions.inspector_id, inspectorId),
          eq(inspectorAuctions.auction_id, auctionId)
        )
      );
    
    return true;
  }

  // Buy Box management
  async getBuyBoxItems(dealerId?: number): Promise<BuyBoxItem[]> {
    if (dealerId) {
      return db
        .select()
        .from(buyBoxItems)
        .where(eq(buyBoxItems.dealer_id, dealerId))
        .orderBy(buyBoxItems.make, buyBoxItems.model);
    }
    return db.select().from(buyBoxItems).orderBy(buyBoxItems.dealer_id);
  }

  async getBuyBoxItem(id: number): Promise<BuyBoxItem | undefined> {
    const [item] = await db.select().from(buyBoxItems).where(eq(buyBoxItems.id, id));
    return item;
  }

  async createBuyBoxItem(item: InsertBuyBoxItem): Promise<BuyBoxItem> {
    const [createdItem] = await db.insert(buyBoxItems).values(item).returning();
    return createdItem;
  }

  async updateBuyBoxItem(id: number, data: Partial<InsertBuyBoxItem>): Promise<BuyBoxItem | undefined> {
    const [updatedItem] = await db
      .update(buyBoxItems)
      .set(data)
      .where(eq(buyBoxItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteBuyBoxItem(id: number): Promise<boolean> {
    const result = await db.delete(buyBoxItems).where(eq(buyBoxItems.id, id));
    return true;
  }

  // Auction management
  async getAuctions(): Promise<Auction[]> {
    return db.select().from(auctions).orderBy(auctions.name);
  }

  async getAuction(id: number): Promise<Auction | undefined> {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    return auction;
  }

  async createAuction(auction: InsertAuction): Promise<Auction> {
    const [createdAuction] = await db.insert(auctions).values(auction).returning();
    return createdAuction;
  }

  async deleteAuction(id: number): Promise<boolean> {
    const result = await db.delete(auctions).where(eq(auctions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Auction schedule management
  async getAuctionSchedules(auctionId?: number): Promise<AuctionSchedule[]> {
    if (auctionId) {
      return db
        .select()
        .from(auctionSchedules)
        .where(eq(auctionSchedules.auction_id, auctionId))
        .orderBy(auctionSchedules.day_of_week, auctionSchedules.start_time);
    }
    return db.select().from(auctionSchedules).orderBy(auctionSchedules.auction_id);
  }

  async getAuctionSchedule(id: number): Promise<AuctionSchedule | undefined> {
    const [schedule] = await db.select().from(auctionSchedules).where(eq(auctionSchedules.id, id));
    return schedule;
  }

  async createAuctionSchedule(schedule: InsertAuctionSchedule): Promise<AuctionSchedule> {
    const [createdSchedule] = await db.insert(auctionSchedules).values(schedule).returning();
    return createdSchedule;
  }

  async updateAuctionSchedule(id: number, data: Partial<InsertAuctionSchedule>): Promise<AuctionSchedule | undefined> {
    const [updatedSchedule] = await db
      .update(auctionSchedules)
      .set(data)
      .where(eq(auctionSchedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteAuctionSchedule(id: number): Promise<boolean> {
    await db.delete(auctionSchedules).where(eq(auctionSchedules.id, id));
    return true;
  }

  // Runlist management
  async getRunlists(): Promise<Runlist[]> {
    return db
      .select()
      .from(runlists)
      .orderBy(desc(runlists.upload_date));
  }

  async getRunlist(id: number): Promise<Runlist | undefined> {
    const [runlist] = await db.select().from(runlists).where(eq(runlists.id, id));
    return runlist;
  }

  async createRunlist(runlist: InsertRunlist): Promise<Runlist> {
    const [createdRunlist] = await db.insert(runlists).values(runlist).returning();
    return createdRunlist;
  }

  async updateRunlist(id: number, data: Partial<InsertRunlist>): Promise<Runlist | undefined> {
    const [updatedRunlist] = await db
      .update(runlists)
      .set(data)
      .where(eq(runlists.id, id))
      .returning();
    return updatedRunlist;
  }

  // Vehicle management
  async getVehicles(runlistId?: number): Promise<Vehicle[]> {
    if (runlistId) {
      return db
        .select()
        .from(vehicles)
        .where(eq(vehicles.runlist_id, runlistId))
        .orderBy(vehicles.make, vehicles.model);
    }
    return db.select().from(vehicles).orderBy(desc(vehicles.id));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [createdVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return createdVehicle;
  }

  async bulkCreateVehicles(vehiclesToCreate: InsertVehicle[]): Promise<Vehicle[]> {
    if (vehiclesToCreate.length === 0) return [];
    return db.insert(vehicles).values(vehiclesToCreate).returning();
  }

  async matchVehiclesToBuyBoxes(vehiclesToMatch: Vehicle[]): Promise<{vehicle: Vehicle, matches: BuyBoxItem[]}[]> {
    const results: {vehicle: Vehicle, matches: BuyBoxItem[]}[] = [];
    
    for (const vehicle of vehiclesToMatch) {
      const runlist = await db
        .select()
        .from(runlists)
        .where(eq(runlists.id, vehicle.runlist_id))
        .limit(1);
      
      // Get the auction ID from the runlist to use for normalization
      const auctionId = runlist.length > 0 ? runlist[0].auction_id : undefined;
      
      // Normalize vehicle make and model
      const normalizedMake = await this.normalizeVehicleMake(vehicle.make, auctionId);
      const normalizedModel = await this.normalizeVehicleModel(vehicle.make, vehicle.model, auctionId);
      
      // Get all active buy box items that could match this vehicle
      const matchingItems = await db
        .select()
        .from(buyBoxItems)
        .where(
          and(
            eq(buyBoxItems.status, "active"),
            eq(buyBoxItems.make, normalizedMake),
            eq(buyBoxItems.model, normalizedModel),
            // Add year range check if both vehicle.year and buyBoxItems year ranges are defined
            vehicle.year ? 
              and(
                // Either year_min is null or vehicle year is >= year_min
                or(
                  sql`${buyBoxItems.year_min} IS NULL`,
                  gte(vehicle.year, buyBoxItems.year_min)
                ),
                // Either year_max is null or vehicle year is <= year_max
                or(
                  sql`${buyBoxItems.year_max} IS NULL`,
                  lte(vehicle.year, buyBoxItems.year_max)
                )
              ) : undefined,
            // Add mileage range check if vehicle.mileage and buyBoxItems mileage ranges are defined
            vehicle.mileage ?
              and(
                // Either mileage_min is null or vehicle mileage is >= mileage_min
                or(
                  sql`${buyBoxItems.mileage_min} IS NULL`,
                  gte(vehicle.mileage, buyBoxItems.mileage_min)
                ),
                // Either mileage_max is null or vehicle mileage is <= mileage_max
                or(
                  sql`${buyBoxItems.mileage_max} IS NULL`,
                  lte(vehicle.mileage, buyBoxItems.mileage_max)
                )
              ) : undefined,
            // Condition checks for the vehicle have been added
            // These will be checked after the SQL query since they require data from vehicle history reports
            // If trim is specified in both, match it
            vehicle.trim && buyBoxItems.trim ?
              eq(vehicles.trim, buyBoxItems.trim) : undefined
          )
        );
      
      results.push({
        vehicle: {
          ...vehicle,
          // Include the normalized values in the result for debugging/display
          normalizedMake,
          normalizedModel
        } as Vehicle,
        matches: matchingItems
      });
    }
    
    return results;
  }

  // Inspection template management
  async getInspectionTemplates(dealerId?: number): Promise<InspectionTemplate[]> {
    if (dealerId) {
      return db
        .select()
        .from(inspectionTemplates)
        .where(eq(inspectionTemplates.dealer_id, dealerId))
        .orderBy(inspectionTemplates.name);
    }
    return db.select().from(inspectionTemplates).orderBy(inspectionTemplates.dealer_id);
  }

  async getInspectionTemplate(id: number): Promise<InspectionTemplate | undefined> {
    const [template] = await db.select().from(inspectionTemplates).where(eq(inspectionTemplates.id, id));
    return template;
  }

  async createInspectionTemplate(template: InsertInspectionTemplate): Promise<InspectionTemplate> {
    const [createdTemplate] = await db.insert(inspectionTemplates).values(template).returning();
    return createdTemplate;
  }

  async updateInspectionTemplate(id: number, data: Partial<InsertInspectionTemplate>): Promise<InspectionTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(inspectionTemplates)
      .set(data)
      .where(eq(inspectionTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  // Inspection management
  async getInspections(filters?: {
    dealerId?: number;
    inspectorId?: number;
    status?: string;
    auctionId?: number;
    startDate?: Date;
    endDate?: Date;
    vinLast6?: string;
    laneNumber?: string;
    runNumber?: string;
  }): Promise<(Inspection & { vehicle: Vehicle, dealer?: Dealer, inspector?: Inspector })[]> {
    let query = db.query.inspections.findMany({
      with: {
        vehicle: {
          with: {
            runlist: {
              with: {
                auction: true
              }
            }
          }
        },
        dealer: true,
        inspector: true
      },
      orderBy: (inspections, { desc }) => [
        desc(inspections.created_at)
      ]
    });

    // Clone the query for filtering
    if (filters) {
      const conditions = [];
      
      if (filters.dealerId) {
        conditions.push(eq(inspections.dealer_id, filters.dealerId));
      }
      
      if (filters.inspectorId) {
        conditions.push(eq(inspections.inspector_id, filters.inspectorId));
      }
      
      if (filters.status) {
        conditions.push(eq(inspections.status, filters.status));
      }
      
      // Filter by auction through vehicle's runlist
      if (filters.auctionId) {
        // We need to join with vehicles and runlists to filter by auction
        // This will be handled by using a SQL subquery
        conditions.push(
          sql`${inspections.vehicle_id} IN (
            SELECT v.id FROM ${vehicles} v
            LEFT JOIN ${runlists} r ON v.runlist_id = r.id
            WHERE r.auction_id = ${filters.auctionId}
          )`
        );
      }

      // Filter by lane number
      if (filters.laneNumber) {
        conditions.push(
          sql`${inspections.vehicle_id} IN (
            SELECT id FROM ${vehicles} WHERE lane_number = ${filters.laneNumber}
          )`
        );
      }

      // Filter by run number
      if (filters.runNumber) {
        conditions.push(
          sql`${inspections.vehicle_id} IN (
            SELECT id FROM ${vehicles} WHERE run_number = ${filters.runNumber}
          )`
        );
      }
      
      // Date range filters
      if (filters.startDate) {
        conditions.push(gte(
          sql`COALESCE(${inspections.completion_date}, ${inspections.scheduled_date}, ${inspections.created_at})`,
          filters.startDate
        ));
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        conditions.push(lte(
          sql`COALESCE(${inspections.completion_date}, ${inspections.scheduled_date}, ${inspections.created_at})`,
          endDate
        ));
      }
      
      // VIN last 6 characters search
      if (filters.vinLast6) {
        query = db.query.inspections.findMany({
          with: {
            vehicle: {
              with: {
                runlist: {
                  with: {
                    auction: true
                  }
                }
              }
            },
            dealer: true,
            inspector: true
          },
          where: sql`${vehicles.vin} LIKE ${'%' + filters.vinLast6}`,
          orderBy: (inspections, { desc }) => [
            desc(inspections.created_at)
          ]
        });
        // Skip other conditions if vinLast6 is specified
        return query;
      }
      
      if (conditions.length > 0) {
        query = db.query.inspections.findMany({
          with: {
            vehicle: {
              with: {
                runlist: {
                  with: {
                    auction: true
                  }
                }
              }
            },
            dealer: true,
            inspector: true
          },
          where: and(...conditions),
          orderBy: (inspections, { desc }) => [
            desc(inspections.created_at)
          ]
        });
      }
    }
    
    return query;
  }

  async getInspection(id: number): Promise<Inspection | undefined> {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection;
  }

  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [createdInspection] = await db.insert(inspections).values(inspection).returning();
    return createdInspection;
  }

  async updateInspection(id: number, data: Partial<InsertInspection>): Promise<Inspection | undefined> {
    const [updatedInspection] = await db
      .update(inspections)
      .set(data)
      .where(eq(inspections.id, id))
      .returning();
    return updatedInspection;
  }

  async deleteInspection(id: number): Promise<boolean> {
    try {
      const [deletedInspection] = await db
        .delete(inspections)
        .where(eq(inspections.id, id))
        .returning();
      return !!deletedInspection;
    } catch (error) {
      console.error("Error deleting inspection:", error);
      return false;
    }
  }

  // Inspection results
  async getInspectionResult(inspectionId: number): Promise<InspectionResult | undefined> {
    const [result] = await db
      .select()
      .from(inspectionResults)
      .where(eq(inspectionResults.inspection_id, inspectionId));
    return result;
  }

  async createInspectionResult(result: InsertInspectionResult): Promise<InspectionResult> {
    const [createdResult] = await db.insert(inspectionResults).values(result).returning();
    return createdResult;
  }

  async updateInspectionResult(id: number, data: Partial<InsertInspectionResult>): Promise<InspectionResult | undefined> {
    const [updatedResult] = await db
      .update(inspectionResults)
      .set(data)
      .where(eq(inspectionResults.id, id))
      .returning();
    return updatedResult;
  }

  // Purchase tracking
  async getPurchases(dealerId?: number): Promise<(Purchase & { inspection: Inspection })[]> {
    if (dealerId) {
      return db.query.purchases.findMany({
        with: {
          inspection: true
        },
        where: eq(purchases.dealer_id, dealerId),
        orderBy: (purchases, { desc }) => [desc(purchases.created_at)]
      });
    }
    
    return db.query.purchases.findMany({
      with: {
        inspection: true
      },
      orderBy: (purchases, { desc }) => [desc(purchases.created_at)]
    });
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }
  
  async getPurchaseByInspectionId(inspectionId: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.inspection_id, inspectionId));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [createdPurchase] = await db.insert(purchases).values(purchase).returning();
    return createdPurchase;
  }

  async updatePurchase(id: number, data: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const [updatedPurchase] = await db
      .update(purchases)
      .set(data)
      .where(eq(purchases.id, id))
      .returning();
    return updatedPurchase;
  }

  // Column mapping
  async getColumnMappings(auctionId?: number): Promise<ColumnMapping[]> {
    if (auctionId) {
      return db
        .select()
        .from(columnMappings)
        .where(eq(columnMappings.auction_id, auctionId))
        .orderBy(columnMappings.name);
    }
    return db.select().from(columnMappings).orderBy(columnMappings.auction_id);
  }

  async getColumnMapping(id: number): Promise<ColumnMapping | undefined> {
    const [mapping] = await db.select().from(columnMappings).where(eq(columnMappings.id, id));
    return mapping;
  }

  async createColumnMapping(mapping: InsertColumnMapping): Promise<ColumnMapping> {
    const [createdMapping] = await db.insert(columnMappings).values(mapping).returning();
    return createdMapping;
  }

  async updateColumnMapping(id: number, data: Partial<InsertColumnMapping>): Promise<ColumnMapping | undefined> {
    const [updatedMapping] = await db
      .update(columnMappings)
      .set(data)
      .where(eq(columnMappings.id, id))
      .returning();
    return updatedMapping;
  }

  // Activity logs
  async getActivityLogs(limit: number = 100): Promise<(ActivityLog & { user: User })[]> {
    return db.query.activityLogs.findMany({
      with: {
        user: true
      },
      orderBy: (activityLogs, { desc }) => [desc(activityLogs.timestamp)],
      limit
    });
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [createdLog] = await db.insert(activityLogs).values(log).returning();
    return createdLog;
  }
  
  // Notification management
  async getNotifications(userId: number, onlyUnread: boolean = false): Promise<Notification[]> {
    if (onlyUnread) {
      return db
        .select()
        .from(notifications)
        .where(and(eq(notifications.user_id, userId), eq(notifications.read, false)))
        .orderBy(desc(notifications.created_at));
    }
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at));
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db.insert(notifications).values(notification).returning();
    return createdNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
    return true;
  }
  
  // Shared reports management
  async getSharedReports(inspectionId: number): Promise<SharedReport[]> {
    return db
      .select()
      .from(sharedReports)
      .where(eq(sharedReports.inspection_id, inspectionId))
      .orderBy(desc(sharedReports.created_at));
  }
  
  async getSharedReportByToken(token: string): Promise<SharedReport | undefined> {
    const [report] = await db.select().from(sharedReports).where(eq(sharedReports.share_token, token));
    return report;
  }
  
  async createSharedReport(report: InsertSharedReport): Promise<SharedReport> {
    const [createdReport] = await db.insert(sharedReports).values(report).returning();
    return createdReport;
  }
  
  async deleteSharedReport(id: number): Promise<boolean> {
    await db.delete(sharedReports).where(eq(sharedReports.id, id));
    return true;
  }

  // Dashboard data
  async getDashboardStats(): Promise<{
    pendingInspections: number;
    completedToday: number;
    todayMatches: number;
    activeDealers: number;
    avgCompletionTime: number;
    activeInspectors: number;
  }> {
    // Get pending inspections count
    const pendingInspectionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(inspections)
      .where(inArray(inspections.status, ["pending", "scheduled", "in_progress"]));
    
    // Get completed inspections today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedTodayResult = await db.select({ count: sql<number>`count(*)` })
      .from(inspections)
      .where(
        and(
          eq(inspections.status, "completed"),
          gte(inspections.completion_date, today)
        )
      );
    
    // Get vehicles matched to buy boxes today
    const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const vehiclesCreatedToday = await db.select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(sql`DATE(auction_date) = ${todayStr}`);
    
    // Get active dealers count
    const activeDealersResult = await db.select({ count: sql<number>`count(*)` })
      .from(dealers)
      .where(eq(dealers.status, "active"));

    // Get active inspectors count (inspectors with inspections in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeInspectorsResult = await db.selectDistinct({ inspector_id: inspections.inspector_id })
      .from(inspections)
      .where(
        and(
          isNotNull(inspections.inspector_id),
          gte(inspections.start_date, sevenDaysAgo)
        )
      );

    // Calculate average completion time in minutes
    const completionTimesResult = await db.select({
      avgMinutes: sql<number>`AVG(EXTRACT(EPOCH FROM (end_date - start_date)) / 60)`
    })
      .from(inspections)
      .where(
        and(
          eq(inspections.status, "completed"),
          isNotNull(inspections.start_date),
          isNotNull(inspections.end_date)
        )
      );

    return {
      pendingInspections: pendingInspectionsResult[0]?.count || 0,
      completedToday: completedTodayResult[0]?.count || 0,
      todayMatches: vehiclesCreatedToday[0]?.count || 0,
      activeDealers: activeDealersResult[0]?.count || 0,
      avgCompletionTime: Math.round(completionTimesResult[0]?.avgMinutes || 0),
      activeInspectors: activeInspectorsResult.length
    };
  }

  async getUpcomingInspections(limit: number = 4): Promise<(Inspection & { 
    vehicle: Vehicle;
    dealer: Dealer;
    inspector?: Inspector;
  })[]> {
    return db.query.inspections.findMany({
      with: {
        vehicle: true,
        dealer: true,
        inspector: true
      },
      where: inArray(inspections.status, ["scheduled", "in_progress"]),
      orderBy: (inspections, { desc }) => [
        // First by scheduled date if available
        desc(inspections.scheduled_date),
        // Then by created date as fallback
        desc(inspections.created_at)
      ],
      limit
    });
  }

  // Vehicle Make Aliases
  async getVehicleMakeAliases(auctionId?: number): Promise<VehicleMakeAlias[]> {
    if (auctionId) {
      return db
        .select()
        .from(vehicleMakeAliases)
        .where(eq(vehicleMakeAliases.auction_id, auctionId))
        .orderBy(vehicleMakeAliases.canonical_make, vehicleMakeAliases.alias);
    }
    return db
      .select()
      .from(vehicleMakeAliases)
      .orderBy(vehicleMakeAliases.canonical_make, vehicleMakeAliases.alias);
  }

  async createVehicleMakeAlias(alias: InsertVehicleMakeAlias): Promise<VehicleMakeAlias> {
    const [createdAlias] = await db.insert(vehicleMakeAliases).values(alias).returning();
    return createdAlias;
  }

  async deleteVehicleMakeAlias(id: number): Promise<boolean> {
    await db.delete(vehicleMakeAliases).where(eq(vehicleMakeAliases.id, id));
    return true;
  }

  // Vehicle Model Aliases
  async getVehicleModelAliases(make: string, auctionId?: number): Promise<VehicleModelAlias[]> {
    let query = db
      .select()
      .from(vehicleModelAliases)
      .where(eq(vehicleModelAliases.make, make));

    if (auctionId) {
      query = db
        .select()
        .from(vehicleModelAliases)
        .where(
          and(
            eq(vehicleModelAliases.make, make),
            eq(vehicleModelAliases.auction_id, auctionId)
          )
        );
    }

    return query.orderBy(vehicleModelAliases.canonical_model, vehicleModelAliases.alias);
  }

  async createVehicleModelAlias(alias: InsertVehicleModelAlias): Promise<VehicleModelAlias> {
    const [createdAlias] = await db.insert(vehicleModelAliases).values(alias).returning();
    return createdAlias;
  }

  async deleteVehicleModelAlias(id: number): Promise<boolean> {
    await db.delete(vehicleModelAliases).where(eq(vehicleModelAliases.id, id));
    return true;
  }

  // Normalize vehicle make/model for matching
  async normalizeVehicleMake(make: string, auctionId?: number): Promise<string> {
    if (!make) return make;
    
    // First, try exact match with auction-specific alias
    if (auctionId) {
      const [auctionSpecificAlias] = await db
        .select()
        .from(vehicleMakeAliases)
        .where(
          and(
            eq(vehicleMakeAliases.alias, make),
            eq(vehicleMakeAliases.auction_id, auctionId)
          )
        );
      
      if (auctionSpecificAlias) {
        return auctionSpecificAlias.canonical_make;
      }
    }
    
    // If no auction-specific alias, try general alias (null auction_id)
    const [generalAlias] = await db
      .select()
      .from(vehicleMakeAliases)
      .where(
        and(
          eq(vehicleMakeAliases.alias, make),
          sql`${vehicleMakeAliases.auction_id} IS NULL`
        )
      );
    
    if (generalAlias) {
      return generalAlias.canonical_make;
    }
    
    // If no match, return original make
    return make;
  }

  async normalizeVehicleModel(make: string, model: string, auctionId?: number): Promise<string> {
    if (!make || !model) return model;
    
    // First try to normalize the make
    const normalizedMake = await this.normalizeVehicleMake(make, auctionId);
    
    // Then look for model aliases for this make
    if (auctionId) {
      const [auctionSpecificAlias] = await db
        .select()
        .from(vehicleModelAliases)
        .where(
          and(
            eq(vehicleModelAliases.make, normalizedMake),
            eq(vehicleModelAliases.alias, model),
            eq(vehicleModelAliases.auction_id, auctionId)
          )
        );
      
      if (auctionSpecificAlias) {
        return auctionSpecificAlias.canonical_model;
      }
    }
    
    // If no auction-specific model alias, try general alias
    const [generalAlias] = await db
      .select()
      .from(vehicleModelAliases)
      .where(
        and(
          eq(vehicleModelAliases.make, normalizedMake),
          eq(vehicleModelAliases.alias, model),
          sql`${vehicleModelAliases.auction_id} IS NULL`
        )
      );
    
    if (generalAlias) {
      return generalAlias.canonical_model;
    }
    
    // If no match, return original model
    return model;
  }


}

export const storage = new DatabaseStorage();
