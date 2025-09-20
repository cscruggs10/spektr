/**
 * Utilities for handling different auction format types
 */

/**
 * Parse Auto Nation combined run number format
 * Format: "BB-0123" or "C-0062"
 * @param runNumber Combined lane-run format
 * @returns Object with lane_number and run_number or null values if invalid
 */
export function parseAutoNationRunNumber(runNumber: string): {
  lane_number: string | null;
  run_number: string | null;
} {
  if (!runNumber) {
    return { lane_number: null, run_number: null };
  }

  // Trim and uppercase the input
  const normalized = runNumber.trim().toUpperCase();

  // Match pattern: Letters-Numbers (e.g., "BB-0123", "C-0062")
  const match = normalized.match(/^([A-Z]+)-(\d+)$/);

  if (match) {
    return {
      lane_number: match[1], // "BB" or "C"
      run_number: parseInt(match[2], 10).toString() // Remove leading zeros: "0123" -> "123"
    };
  }

  // Invalid format
  return { lane_number: null, run_number: null };
}

/**
 * Validate Auto Nation run number format
 * @param runNumber The run number to validate
 * @returns True if valid Auto Nation format
 */
export function isValidAutoNationFormat(runNumber: string): boolean {
  const parsed = parseAutoNationRunNumber(runNumber);
  return parsed.lane_number !== null && parsed.run_number !== null;
}

/**
 * Check if an auction is Auto Nation based on name
 * @param auctionName The auction name
 * @returns True if this is an Auto Nation auction
 */
export function isAutoNationAuction(auctionName: string): boolean {
  if (!auctionName) return false;
  const lowerName = auctionName.toLowerCase();
  return lowerName.includes('auto nation') || lowerName.includes('autonation');
}

/**
 * Format lane and run numbers for display
 * @param lane Lane identifier
 * @param run Run number
 * @param format Format type ('combined' or 'separate')
 * @returns Formatted string
 */
export function formatLaneRun(
  lane: string | null,
  run: string | null,
  format: 'combined' | 'separate' = 'separate'
): string {
  if (!lane && !run) return 'N/A';

  if (format === 'combined') {
    // Format as Auto Nation style with leading zeros for run
    const paddedRun = run ? run.padStart(4, '0') : '0000';
    return `${lane || 'X'}-${paddedRun}`;
  }

  // Separate format
  if (lane && run) {
    return `Lane ${lane} / Run ${run}`;
  }

  return lane ? `Lane ${lane}` : `Run ${run}`;
}