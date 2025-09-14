import ExcelJS from 'exceljs';
import { BuyBoxItem } from '@shared/schema';
import { Dealer } from '@shared/schema';

export interface GroupedBuyBox {
  make: string;
  minPrice?: number;
  maxPrice?: number;
  items: BuyBoxItem[];
}

export class ExcelService {
  /**
   * Generate an Excel file containing buy box items for a specific dealer
   * Items are grouped by make and price range
   */
  static async generateBuyBoxExcel(
    buyBoxItems: BuyBoxItem[],
    dealer?: Dealer
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AutoInspect Pro';
    workbook.created = new Date();
    
    // Create the main worksheet
    const sheet = workbook.addWorksheet('Buy Box Items');
    
    // Set the columns for the sheet
    sheet.columns = [
      { header: 'Make', key: 'make', width: 15 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Trim', key: 'trim', width: 15 },
      { header: 'Year Range', key: 'yearRange', width: 15 },
      { header: 'Mileage Range', key: 'mileageRange', width: 20 },
      { header: 'Price Range', key: 'priceRange', width: 20 },
      { header: 'Body Type', key: 'body_type', width: 15 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
    ];
    
    // Style the header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add the dealer information if provided
    if (dealer) {
      const infoSheet = workbook.addWorksheet('Dealer Info');
      infoSheet.columns = [
        { header: 'Property', key: 'property', width: 20 },
        { header: 'Value', key: 'value', width: 40 }
      ];
      
      infoSheet.getRow(1).font = { bold: true };
      
      infoSheet.addRows([
        { property: 'Dealer Name', value: dealer.name },
        { property: 'Contact Name', value: dealer.contact_name },
        { property: 'Contact Email', value: dealer.contact_email },
        { property: 'Contact Phone', value: dealer.contact_phone || 'N/A' },
        { property: 'Status', value: dealer.status },
        { property: 'Report Generated', value: new Date().toLocaleString() }
      ]);
      
      // Add a title to the main sheet
      sheet.addRow([`Buy Box Items for ${dealer.name}`]);
      sheet.getRow(1).font = { bold: true, size: 14 };
      sheet.getRow(1).height = 30;
      
      // Add empty row
      sheet.addRow([]);
      
      // Adjust the columns to start at row 3
      sheet.getRow(3).values = [
        'Make', 'Model', 'Trim', 'Year Range', 'Mileage Range', 
        'Price Range', 'Body Type', 'Color', 'Status'
      ];
      sheet.getRow(3).font = { bold: true };
      sheet.getRow(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Group items by make and price range
    const groupedItems = this.groupBuyBoxItems(buyBoxItems);
    
    // Current row to start adding data
    let currentRow = dealer ? 4 : 2;
    
    // Add data for each group
    groupedItems.forEach(group => {
      // Add group header
      const priceRange = group.minPrice && group.maxPrice 
        ? `$${group.minPrice.toLocaleString()} - $${group.maxPrice.toLocaleString()}`
        : group.minPrice 
          ? `Min: $${group.minPrice.toLocaleString()}`
          : group.maxPrice
            ? `Max: $${group.maxPrice.toLocaleString()}`
            : 'Any Price';
      
      sheet.addRow([`${group.make} (${priceRange})`]);
      const groupHeaderRow = currentRow;
      sheet.getRow(groupHeaderRow).font = { bold: true };
      sheet.getRow(groupHeaderRow).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };
      currentRow++;
      
      // Add items in the group
      group.items.forEach(item => {
        const yearRange = item.year_min && item.year_max 
          ? `${item.year_min} - ${item.year_max}` 
          : item.year_min 
            ? `Min: ${item.year_min}` 
            : item.year_max 
              ? `Max: ${item.year_max}` 
              : 'Any';
              
        const mileageRange = item.mileage_min && item.mileage_max 
          ? `${item.mileage_min.toLocaleString()} - ${item.mileage_max.toLocaleString()}` 
          : item.mileage_min 
            ? `Min: ${item.mileage_min.toLocaleString()}` 
            : item.mileage_max 
              ? `Max: ${item.mileage_max.toLocaleString()}` 
              : 'Any';
              
        const priceRange = item.price_min && item.price_max 
          ? `$${item.price_min.toLocaleString()} - $${item.price_max.toLocaleString()}` 
          : item.price_min 
            ? `Min: $${item.price_min.toLocaleString()}` 
            : item.price_max 
              ? `Max: $${item.price_max.toLocaleString()}` 
              : 'Any';
        
        sheet.addRow({
          make: item.make,
          model: item.model,
          trim: item.trim || 'Any',
          yearRange,
          mileageRange,
          priceRange,
          body_type: item.body_type || 'Any',
          color: item.color || 'Any',
          status: item.status
        });
        currentRow++;
      });
      
      // Add empty row after each group
      sheet.addRow([]);
      currentRow++;
    });
    
    // Add totals at the end
    sheet.addRow([`Total Items: ${buyBoxItems.length}`]);
    sheet.getRow(currentRow).font = { bold: true };
    
    // Apply some styling
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
  
  /**
   * Group buy box items by make and price range
   */
  static groupBuyBoxItems(items: BuyBoxItem[]): GroupedBuyBox[] {
    // Sort items by make and then by price range
    const sortedItems = [...items].sort((a, b) => {
      // First sort by make
      if (a.make !== b.make) {
        return a.make.localeCompare(b.make);
      }
      
      // Then sort by minimum price (if available)
      const aMinPrice = a.price_min || 0;
      const bMinPrice = b.price_min || 0;
      
      return aMinPrice - bMinPrice;
    });
    
    // Group by make and price range
    const groups: { [key: string]: GroupedBuyBox } = {};
    
    sortedItems.forEach(item => {
      // Create a unique key based on make and price range
      let priceGroupKey = 'any';
      
      if (item.price_min && item.price_max) {
        // We'll create price buckets in increments of $10,000
        const minBucket = Math.floor((item.price_min || 0) / 10000) * 10000;
        const maxBucket = Math.ceil((item.price_max || 0) / 10000) * 10000;
        priceGroupKey = `${minBucket}-${maxBucket}`;
      } else if (item.price_min) {
        const minBucket = Math.floor((item.price_min || 0) / 10000) * 10000;
        priceGroupKey = `${minBucket}+`;
      } else if (item.price_max) {
        const maxBucket = Math.ceil((item.price_max || 0) / 10000) * 10000;
        priceGroupKey = `0-${maxBucket}`;
      }
      
      const key = `${item.make}-${priceGroupKey}`;
      
      if (!groups[key]) {
        groups[key] = {
          make: item.make,
          minPrice: item.price_min || undefined,
          maxPrice: item.price_max || undefined,
          items: []
        };
      }
      
      // Ensure the group's price range encompasses this item
      if (item.price_min && (!groups[key].minPrice || item.price_min < groups[key].minPrice)) {
        groups[key].minPrice = item.price_min;
      }
      
      if (item.price_max && (!groups[key].maxPrice || item.price_max > groups[key].maxPrice)) {
        groups[key].maxPrice = item.price_max;
      }
      
      groups[key].items.push(item);
    });
    
    // Convert the groups object to an array
    return Object.values(groups);
  }
}