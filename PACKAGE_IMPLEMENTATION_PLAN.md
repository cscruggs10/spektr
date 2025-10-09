# Inspection Package System Implementation Plan

## Overview
This document outlines the complete implementation of the package-based inspection workflow. This refactors the system so inspectors work with **packages** (groups of inspections for a specific auction date) instead of individual inspections.

## Current Status: Phase 1 Complete ✅

### What's Done:
- ✅ Database schema: `inspection_packages` table created
- ✅ Database migration: Successfully run
- ✅ `package_id` added to inspections table
- ✅ TypeScript types exported
- ✅ Skip endpoint: Now marks as 'completed' not 'canceled'
- ✅ Inspector portal: Filters out past auction dates
- ✅ Storage imports: Package types imported

---

## Phase 2: Storage Layer (6-8 methods)

### File: `server/storage.ts`

Add to IStorage interface (around line 108, before inspection methods):

```typescript
// Inspection package management
getInspectionPackages(filters?: {
  auctionId?: number;
  inspectorId?: number;
  status?: string;
  futureOnly?: boolean; // Only show packages where auction_date hasn't passed
}): Promise<(InspectionPackage & { auction: Auction, inspector?: Inspector })[]>;
getInspectionPackage(id: number): Promise<InspectionPackage | undefined>;
getInspectionPackageWithInspections(id: number): Promise<(InspectionPackage & {
  inspections: (Inspection & { vehicle: Vehicle })[],
  auction: Auction
}) | undefined>;
createInspectionPackage(pkg: InsertInspectionPackage): Promise<InspectionPackage>;
updateInspectionPackage(id: number, data: Partial<InsertInspectionPackage>): Promise<InspectionPackage | undefined>;
deleteInspectionPackage(id: number): Promise<boolean>;
```

Add implementations in Storage class (around line 690):

```typescript
async getInspectionPackages(filters = {}) {
  const { auctionId, inspectorId, status, futureOnly } = filters;
  let query = db.select()
    .from(inspectionPackages)
    .leftJoin(auctions, eq(inspectionPackages.auction_id, auctions.id))
    .leftJoin(inspectors, eq(inspectionPackages.inspector_id, inspectors.id));

  const conditions = [];
  if (auctionId) conditions.push(eq(inspectionPackages.auction_id, auctionId));
  if (inspectorId) conditions.push(eq(inspectionPackages.inspector_id, inspectorId));
  if (status) conditions.push(eq(inspectionPackages.status, status));
  if (futureOnly) conditions.push(gte(inspectionPackages.auction_date, new Date()));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const results = await query.orderBy(desc(inspectionPackages.auction_date));

  return results.map(row => ({
    ...row.inspection_packages,
    auction: row.auctions!,
    inspector: row.inspectors || undefined
  }));
}

async getInspectionPackage(id: number) {
  const result = await db.select()
    .from(inspectionPackages)
    .where(eq(inspectionPackages.id, id))
    .limit(1);
  return result[0];
}

async getInspectionPackageWithInspections(id: number) {
  const pkg = await this.getInspectionPackage(id);
  if (!pkg) return undefined;

  const pkgInspections = await db.select()
    .from(inspections)
    .leftJoin(vehicles, eq(inspections.vehicle_id, vehicles.id))
    .where(eq(inspections.package_id, id));

  const auction = await db.select()
    .from(auctions)
    .where(eq(auctions.id, pkg.auction_id))
    .limit(1);

  return {
    ...pkg,
    inspections: pkgInspections.map(row => ({
      ...row.inspections,
      vehicle: row.vehicles!
    })),
    auction: auction[0]!
  };
}

async createInspectionPackage(pkg: InsertInspectionPackage) {
  const result = await db.insert(inspectionPackages).values(pkg).returning();
  return result[0];
}

async updateInspectionPackage(id: number, data: Partial<InsertInspectionPackage>) {
  const result = await db.update(inspectionPackages)
    .set(data)
    .where(eq(inspectionPackages.id, id))
    .returning();
  return result[0];
}

async deleteInspectionPackage(id: number) {
  const result = await db.delete(inspectionPackages)
    .where(eq(inspectionPackages.id, id))
    .returning();
  return result.length > 0;
}
```

---

## Phase 3: API Routes (5 endpoints)

### File: `server/routes.ts`

Add after inspection routes (around line 3200):

```typescript
// ============================================================================
// INSPECTION PACKAGE ROUTES
// ============================================================================

// Get all packages (with filters)
app.get("/api/packages", async (req, res) => {
  try {
    const { auctionId, inspectorId, status, futureOnly } = req.query;

    const packages = await storage.getInspectionPackages({
      auctionId: auctionId ? parseInt(auctionId as string) : undefined,
      inspectorId: inspectorId ? parseInt(inspectorId as string) : undefined,
      status: status as string,
      futureOnly: futureOnly === 'true'
    });

    res.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

// Get single package with all inspections
app.get("/api/packages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pkg = await storage.getInspectionPackageWithInspections(id);

    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.json(pkg);
  } catch (error) {
    console.error("Error fetching package:", error);
    res.status(500).json({ error: "Failed to fetch package" });
  }
});

// Create new package
app.post("/api/packages", async (req, res) => {
  try {
    const packageData = req.body;

    // Validate required fields
    if (!packageData.name || !packageData.auction_id || !packageData.auction_date) {
      return res.status(400).json({
        error: "Missing required fields: name, auction_id, auction_date"
      });
    }

    const newPackage = await storage.createInspectionPackage(packageData);
    res.status(201).json(newPackage);
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({ error: "Failed to create package" });
  }
});

// Update package
app.patch("/api/packages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const updated = await storage.updateInspectionPackage(id, updates);

    if (!updated) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({ error: "Failed to update package" });
  }
});

// Delete package (only if no inspections)
app.delete("/api/packages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if package has inspections
    const pkg = await storage.getInspectionPackageWithInspections(id);
    if (pkg && pkg.inspections.length > 0) {
      return res.status(400).json({
        error: "Cannot delete package with inspections"
      });
    }

    const deleted = await storage.deleteInspectionPackage(id);

    if (!deleted) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting package:", error);
    res.status(500).json({ error: "Failed to delete package" });
  }
});
```

---

## Phase 4: Update Batch Upload

### File: `server/routes.ts` (batch upload endpoint around line 1400)

Modify the batch upload endpoint to:
1. Accept `package_id` OR create new package
2. Assign all created inspections to the package

```typescript
// Add to batch upload form handling:
const packageId = req.body.package_id ? parseInt(req.body.package_id) : null;
const createNewPackage = req.body.create_new_package === 'true';
const packageName = req.body.package_name;
const auctionDate = req.body.auction_date;

let finalPackageId = packageId;

// If creating new package
if (createNewPackage && packageName && auctionDate) {
  const newPackage = await storage.createInspectionPackage({
    name: packageName,
    auction_id: auctionId,
    auction_date: new Date(auctionDate),
    created_by: req.user?.id
  });
  finalPackageId = newPackage.id;
}

// When creating inspections, add package_id:
const inspection = await storage.createInspection({
  vehicle_id: vehicle.id,
  package_id: finalPackageId, // ADD THIS
  inspector_id: assignedInspectorId,
  auction_start_date: auctionDate,
  notes: row.notes || null,
  status: 'pending'
});
```

---

## Phase 5: Update Single Inspection Form

### File: `client/src/pages/dashboard.tsx` (or wherever single inspection form is)

Add package selection to the inspection creation form:

```tsx
// Add state
const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
const [showCreatePackage, setShowCreatePackage] = useState(false);
const [newPackageName, setNewPackageName] = useState("");

// Fetch packages for selection
const { data: availablePackages = [] } = useQuery({
  queryKey: ["/api/packages", { futureOnly: true, auctionId: selectedAuction }],
  enabled: !!selectedAuction
});

// Add to form:
<div>
  <Label>Inspection Package *</Label>
  <Select value={selectedPackageId?.toString()} onValueChange={(val) => {
    if (val === "create_new") {
      setShowCreatePackage(true);
    } else {
      setSelectedPackageId(parseInt(val));
    }
  }}>
    <SelectTrigger>
      <SelectValue placeholder="Select package..." />
    </SelectTrigger>
    <SelectContent>
      {availablePackages.map((pkg) => (
        <SelectItem key={pkg.id} value={pkg.id.toString()}>
          {pkg.name} - {format(new Date(pkg.auction_date), 'MMM d, yyyy')}
        </SelectItem>
      ))}
      <SelectItem value="create_new">+ Create New Package</SelectItem>
    </SelectContent>
  </Select>
</div>

{showCreatePackage && (
  <div className="space-y-2">
    <Label>New Package Name</Label>
    <Input
      value={newPackageName}
      onChange={(e) => setNewPackageName(e.target.value)}
      placeholder="e.g., Chicago - Jan 15"
    />
  </div>
)}
```

---

## Phase 6: Refactor Inspector Portal UI

### File: `client/src/pages/inspector-portal.tsx`

**Major Changes Needed:**

1. **Replace inspection query with package query:**

```tsx
// Replace current inspections query with:
const { data: packages = [], isLoading } = useQuery({
  queryKey: ["/api/packages", { inspectorId, futureOnly: true }],
  enabled: !!inspectorId,
  select: (data) => {
    // Filter by selected auction if needed
    if (selectedAuctionId && selectedAuctionId !== "all") {
      return data.filter(pkg => pkg.auction_id === parseInt(selectedAuctionId));
    }
    return data;
  }
});
```

2. **Show packages instead of individual inspections:**

```tsx
{packages.map((pkg) => (
  <Card key={pkg.id} className="cursor-pointer hover:shadow-lg">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{pkg.name}</h3>
          <p className="text-sm text-gray-600">
            {pkg.auction.name} - {format(new Date(pkg.auction_date), 'MMM d, yyyy')}
          </p>
          <Badge variant={pkg.status === 'completed' ? 'success' : 'default'}>
            {pkg.status}
          </Badge>
        </div>
        <Button onClick={() => openPackage(pkg.id)}>
          Start Package
        </Button>
      </div>
    </CardContent>
  </Card>
))}
```

3. **Create package detail modal** showing all inspections in the package

4. **Update workflow** to work through package inspections sequentially

---

## Phase 7: Add Skip Reason Display

### File: `client/src/pages/inspection-detail-new.tsx`

When displaying completed inspections, show skip reason if present:

```tsx
{inspection.status === 'completed' && inspection.result?.data?.skipped && (
  <Alert className="bg-yellow-50 border-yellow-200">
    <AlertTitle>Inspection Skipped</AlertTitle>
    <AlertDescription>
      <p><strong>Reason:</strong> {inspection.result.data.skip_reason}</p>
      {inspection.result.data.skip_note && (
        <p><strong>Note:</strong> {inspection.result.data.skip_note}</p>
      )}
      {inspection.result.data.skip_photo && (
        <img src={inspection.result.data.skip_photo} alt="Skip documentation" />
      )}
    </AlertDescription>
  </Alert>
)}
```

---

## Phase 8: Testing Checklist

### Database:
- [ ] inspection_packages table exists with correct schema
- [ ] package_id foreign key on inspections works
- [ ] Can create packages via API
- [ ] Can query packages with filters

### Package Management:
- [ ] Can create new package
- [ ] Can assign inspector to package
- [ ] Can view all packages for inspector
- [ ] Packages past auction date don't show

### Batch Upload:
- [ ] Can create new package during upload
- [ ] Can assign to existing package
- [ ] All inspections in batch get same package_id
- [ ] Old packages filtered from selection

### Single Inspection:
- [ ] Must select package (required field)
- [ ] Can create new package inline
- [ ] Can select from existing packages
- [ ] Only shows future packages

### Inspector Portal:
- [ ] Shows packages not individual inspections
- [ ] Can open package to see all inspections
- [ ] Can work through inspections in package
- [ ] Skipped inspections marked complete
- [ ] Skip reason visible in results

### Edge Cases:
- [ ] What happens to existing inspections without package_id?
- [ ] Can't delete package with inspections
- [ ] Package status updates when all inspections complete
- [ ] Proper handling of timezone for auction_date

---

## Migration Strategy for Existing Data

**Option 1: Create default package for orphaned inspections**
```sql
-- Create a default package for each auction/inspector combo
INSERT INTO inspection_packages (name, auction_id, inspector_id, auction_date, status)
SELECT
  CONCAT(a.name, ' - Legacy Inspections'),
  a.id,
  i.inspector_id,
  COALESCE(i.auction_start_date, NOW()),
  'completed'
FROM inspections i
JOIN vehicles v ON i.vehicle_id = v.id
JOIN runlists r ON v.runlist_id = r.id
JOIN auctions a ON r.auction_id = a.id
WHERE i.package_id IS NULL
GROUP BY a.id, a.name, i.inspector_id, i.auction_start_date;

-- Assign orphaned inspections to these packages
UPDATE inspections i
SET package_id = (
  SELECT ip.id
  FROM inspection_packages ip
  JOIN vehicles v ON i.vehicle_id = v.id
  JOIN runlists r ON v.runlist_id = r.id
  WHERE ip.auction_id = r.auction_id
  AND ip.inspector_id = i.inspector_id
  LIMIT 1
)
WHERE i.package_id IS NULL;
```

**Option 2: Make package_id nullable and handle null case in UI**
- Show "unassigned" inspections separately
- Require package assignment before inspection can be started

---

## Estimated Effort

- **Phase 2** (Storage): 2-3 hours
- **Phase 3** (API): 1-2 hours
- **Phase 4** (Batch Upload): 1-2 hours
- **Phase 5** (Single Form): 1 hour
- **Phase 6** (Inspector UI): 3-4 hours (major refactor)
- **Phase 7** (Skip Display): 30 minutes
- **Phase 8** (Testing): 2-3 hours
- **Data Migration**: 1 hour

**Total: 12-18 hours of development work**

---

## Benefits After Completion

1. ✅ **Cleaner Inspector Workflow** - Work on packages not scattered inspections
2. ✅ **Auto-cleanup** - Old packages disappear after auction date
3. ✅ **Better Organization** - Group related inspections logically
4. ✅ **Proper Skip Handling** - Skipped = completed, not hanging around
5. ✅ **Package-level Status** - See progress on entire package at once
6. ✅ **Flexible Assignment** - Can batch OR single inspections into packages
