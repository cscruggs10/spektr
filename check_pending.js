const data = JSON.parse(require('fs').readFileSync('all_inspections.json', 'utf8'));
const pending = data.filter(i => i.status !== 'completed');
console.log('Pending inspections:');
pending.forEach(i => {
  const lane = i.vehicle?.lane_number || 'N/A';
  const run = i.vehicle?.run_number || 'N/A';
  const vehicle = `${i.vehicle?.year || ''} ${i.vehicle?.make || ''} ${i.vehicle?.model || ''}`.trim() || 'Unknown Vehicle';
  console.log(`ID: ${i.id}, Status: ${i.status}, Lane: ${lane}, Run: ${run}, Vehicle: ${vehicle}`);
});