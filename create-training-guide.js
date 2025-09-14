import htmlPdf from 'html-pdf-node';
import fs from 'fs';

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Inspector Portal Training Guide</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            color: #333;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 50px;
            border-bottom: 4px solid #2563eb;
            padding-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            font-size: 36px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            color: #666;
            font-size: 18px;
            margin: 0;
        }
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #2563eb;
            font-size: 24px;
            margin-bottom: 20px;
            border-left: 5px solid #2563eb;
            padding-left: 20px;
            font-weight: 600;
        }
        .section h3 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 15px;
            margin-top: 25px;
        }
        .section p {
            margin-bottom: 15px;
            font-size: 15px;
            line-height: 1.7;
        }
        .section ul, .section ol {
            margin-bottom: 20px;
            padding-left: 25px;
        }
        .section li {
            margin-bottom: 8px;
            font-size: 15px;
            line-height: 1.6;
        }
        .step-number {
            background: #2563eb;
            color: white;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            font-size: 16px;
        }
        .overview {
            background: #f8fafc;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #6366f1;
        }
        .overview h3 {
            color: #1e40af;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .key-features {
            background: #ecfdf5;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #10b981;
            margin-bottom: 30px;
        }
        .key-features h3 {
            color: #065f46;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .key-features ul {
            margin: 0;
            padding-left: 20px;
        }
        .key-features li {
            margin-bottom: 10px;
        }
        .workflow-step {
            background: #fff7ed;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #f97316;
        }
        .workflow-step h4 {
            color: #c2410c;
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .important-note {
            background: #fef2f2;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ef4444;
            margin: 20px 0;
        }
        .important-note p {
            margin: 0;
            color: #991b1b;
            font-weight: 500;
        }
        .tip {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
        }
        .tip h4 {
            color: #1d4ed8;
            margin-top: 0;
            margin-bottom: 10px;
        }
        .tip p {
            margin: 0;
            color: #1e40af;
        }
        .feature-highlight {
            background: #fefce8;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #eab308;
            margin: 15px 0;
        }
        .feature-highlight strong {
            color: #a16207;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Inspector Portal Training Guide</h1>
        <p>Complete Mobile Inspection Workflow for Auto Auctions</p>
    </div>

    <div class="overview">
        <h3>📱 Inspector Portal Overview</h3>
        <p>The Inspector Portal is a mobile-first application designed for efficient vehicle inspections at auto auctions. It provides a streamlined workflow for inspectors to document vehicle conditions, capture multimedia evidence, and provide accurate repair estimates.</p>
    </div>

    <div class="key-features">
        <h3>🔧 Key Features & Capabilities</h3>
        <ul>
            <li><strong>Mobile-Optimized Interface:</strong> Designed specifically for phones and tablets with touch-friendly controls</li>
            <li><strong>Real-time Photo & Video Capture:</strong> Direct camera integration for immediate documentation</li>
            <li><strong>Voice Note Integration:</strong> Record audio observations that embed directly into inspection notes</li>
            <li><strong>Dual Repair Estimates:</strong> Separate tracking for cosmetic and mechanical damage assessments</li>
            <li><strong>Automatic Workflow Management:</strong> Only shows pending and in-progress inspections</li>
            <li><strong>Cloud Synchronization:</strong> Instant data backup and real-time updates</li>
            <li><strong>Offline Capability:</strong> Continue working even with poor network connectivity</li>
        </ul>
    </div>

    <div class="section">
        <h2><span class="step-number">1</span>Getting Started</h2>
        
        <h3>Accessing the Inspector Portal</h3>
        <p>Navigate to the Inspector Portal section of the application. You will be presented with an inspector selection screen where you must choose your name from the dropdown menu.</p>
        
        <div class="important-note">
            <p><strong>Important:</strong> Only inspections specifically assigned to you will be visible. The system automatically filters inspections based on your inspector ID.</p>
        </div>
        
        <h3>What You'll See</h3>
        <ul>
            <li>Inspector dropdown for login selection</li>
            <li>Your assigned inspection queue</li>
            <li>Vehicle information and location details</li>
            <li>Current inspection status indicators</li>
        </ul>
    </div>

    <div class="section">
        <h2><span class="step-number">2</span>Understanding Your Inspection Queue</h2>
        
        <p>Once logged in, you'll see a prioritized list of vehicles requiring inspection. The system automatically filters and sorts your assignments for optimal workflow efficiency.</p>
        
        <h3>Inspection List Features</h3>
        <table>
            <tr>
                <th>Information</th>
                <th>Description</th>
                <th>Purpose</th>
            </tr>
            <tr>
                <td>Vehicle Details</td>
                <td>Year, Make, Model, VIN last 6</td>
                <td>Quick vehicle identification</td>
            </tr>
            <tr>
                <td>Lane & Run Numbers</td>
                <td>Physical location in auction</td>
                <td>Efficient navigation through lot</td>
            </tr>
            <tr>
                <td>Status Indicators</td>
                <td>Pending, In-Progress</td>
                <td>Track inspection progress</td>
            </tr>
            <tr>
                <td>Action Buttons</td>
                <td>Start/Continue Inspection</td>
                <td>Begin or resume work</td>
            </tr>
        </table>

        <div class="tip">
            <h4>💡 Pro Tip: Optimal Workflow</h4>
            <p>Inspections are automatically sorted by lane number, then run number. Follow this sequence to minimize walking distance and maximize efficiency.</p>
        </div>
    </div>

    <div class="section">
        <h2><span class="step-number">3</span>Starting an Inspection</h2>
        
        <p>When you tap "Start Inspection," the system immediately changes the status to "in-progress" and opens the comprehensive inspection form.</p>
        
        <div class="workflow-step">
            <h4>Automatic Status Management</h4>
            <p>The system tracks your progress automatically. Started inspections remain in your queue until completed, then disappear to keep your workflow clean.</p>
        </div>
        
        <h3>Inspection Form Sections</h3>
        <ul>
            <li><strong>Vehicle Information:</strong> Pre-populated from auction data</li>
            <li><strong>Photo Documentation:</strong> Multiple image capture with categorization</li>
            <li><strong>Video Documentation:</strong> For complex damage or mechanical issues</li>
            <li><strong>Voice Notes:</strong> Audio observations embedded in final report</li>
            <li><strong>Repair Estimates:</strong> Separate cosmetic and mechanical assessments</li>
            <li><strong>Written Notes:</strong> Additional text-based observations</li>
        </ul>
    </div>

    <div class="section page-break">
        <h2><span class="step-number">4</span>Photo & Video Documentation</h2>
        
        <h3>Best Practices for Visual Documentation</h3>
        
        <div class="feature-highlight">
            <strong>Photo Requirements:</strong> Capture multiple angles, all damage areas, and overall vehicle condition
        </div>
        
        <ul>
            <li><strong>Exterior Photos:</strong> Front, rear, both sides, roof (if accessible)</li>
            <li><strong>Damage Documentation:</strong> Close-up shots of all dents, scratches, rust</li>
            <li><strong>Interior Condition:</strong> Seats, dashboard, controls, wear patterns</li>
            <li><strong>Engine Bay:</strong> Overall cleanliness, visible damage, fluid leaks</li>
            <li><strong>Undercarriage:</strong> If accessible, frame damage, exhaust, suspension</li>
        </ul>
        
        <h3>Video Documentation Guidelines</h3>
        <ul>
            <li>Record engine running (if possible)</li>
            <li>Document operational issues (lights, electronics)</li>
            <li>Show extent of damage that photos cannot capture</li>
            <li>Demonstrate mechanical problems (noises, vibrations)</li>
        </ul>
        
        <div class="tip">
            <h4>📸 Photography Tips</h4>
            <p>Ensure adequate lighting, hold device steady, and capture damage from multiple angles. Poor quality images may require re-inspection.</p>
        </div>
    </div>

    <div class="section">
        <h2><span class="step-number">5</span>Voice Notes Integration</h2>
        
        <p>Voice notes are a powerful feature that allows you to provide detailed verbal assessments that integrate seamlessly with your written documentation.</p>
        
        <h3>How Voice Notes Work</h3>
        <div class="workflow-step">
            <h4>Recording Process</h4>
            <p>Tap the microphone icon to start recording. Speak clearly and include specific details about your observations.</p>
        </div>
        
        <div class="workflow-step">
            <h4>Automatic Integration</h4>
            <p>Voice notes are automatically embedded into the main inspection notes field, not stored as separate files.</p>
        </div>
        
        <div class="workflow-step">
            <h4>Playback & Review</h4>
            <p>Audio controls appear in the final inspection report for easy playback and review.</p>
        </div>
        
        <h3>What to Include in Voice Notes</h3>
        <ul>
            <li>Detailed damage descriptions</li>
            <li>Mechanical observations (sounds, vibrations)</li>
            <li>Overall vehicle condition assessment</li>
            <li>Recommendations for potential buyers</li>
            <li>Any unusual findings or concerns</li>
        </ul>
        
        <div class="important-note">
            <p><strong>Note:</strong> Speak clearly and avoid background noise. Voice notes become part of the permanent inspection record.</p>
        </div>
    </div>

    <div class="section">
        <h2><span class="step-number">6</span>Repair Estimates</h2>
        
        <p>Provide accurate, market-based repair estimates in two distinct categories to help buyers make informed decisions.</p>
        
        <h3>Cosmetic Repairs</h3>
        <div class="feature-highlight">
            <strong>Includes:</strong> Paint touch-ups, dent repair, scratch removal, interior cleaning/repair, trim replacement
        </div>
        
        <ul>
            <li>Minor paint scratches: $50-200</li>
            <li>Small dent repair: $100-300 per panel</li>
            <li>Bumper repair/repaint: $300-800</li>
            <li>Interior detailing: $100-300</li>
            <li>Seat repair/replacement: $200-1000</li>
        </ul>
        
        <h3>Mechanical Repairs</h3>
        <div class="feature-highlight">
            <strong>Includes:</strong> Engine issues, transmission problems, electrical faults, suspension repairs, brake work
        </div>
        
        <ul>
            <li>Minor engine service: $200-500</li>
            <li>Major engine repair: $1000-5000+</li>
            <li>Transmission issues: $800-3000+</li>
            <li>Brake system: $300-800</li>
            <li>Suspension components: $400-1200</li>
        </ul>
        
        <div class="tip">
            <h4>💰 Estimation Guidelines</h4>
            <p>Base estimates on current market rates for quality repairs. When in doubt, provide a range rather than a specific amount.</p>
        </div>
    </div>

    <div class="section page-break">
        <h2><span class="step-number">7</span>Completing Inspections</h2>
        
        <p>The completion process ensures all documentation is thorough and accurate before finalizing the inspection.</p>
        
        <h3>Pre-Completion Checklist</h3>
        <ul>
            <li>✅ All required photos captured</li>
            <li>✅ Voice notes recorded (if applicable)</li>
            <li>✅ Repair estimates provided</li>
            <li>✅ Written notes completed</li>
            <li>✅ All damage documented</li>
        </ul>
        
        <div class="workflow-step">
            <h4>Final Review</h4>
            <p>Before marking complete, review all captured media and verify repair estimates are reasonable and justified.</p>
        </div>
        
        <div class="workflow-step">
            <h4>Submit Inspection</h4>
            <p>Tap "Complete Inspection" to finalize. The inspection immediately disappears from your queue and becomes available in the main system.</p>
        </div>
        
        <div class="important-note">
            <p><strong>Cannot Undo:</strong> Once marked complete, inspections cannot be edited. Ensure accuracy before submitting.</p>
        </div>
    </div>

    <div class="section">
        <h2><span class="step-number">8</span>Workflow Efficiency Tips</h2>
        
        <h3>Maximize Your Productivity</h3>
        
        <div class="tip">
            <h4>🗺️ Route Planning</h4>
            <p>Follow the lane/run number sequence displayed in your queue. This minimizes walking and maximizes inspection throughput.</p>
        </div>
        
        <div class="tip">
            <h4>⚡ Speed vs. Quality</h4>
            <p>Maintain thorough documentation while working efficiently. Missed details may require costly re-inspections.</p>
        </div>
        
        <div class="tip">
            <h4>📶 Connectivity Management</h4>
            <p>The app works offline, but sync regularly when you have strong signal to backup your work.</p>
        </div>
        
        <h3>Common Time-Savers</h3>
        <ul>
            <li>Pre-position your mobile device for quick photo access</li>
            <li>Use voice notes for detailed observations while moving</li>
            <li>Complete estimates immediately while damage is fresh in mind</li>
            <li>Take advantage of automatic status tracking</li>
        </ul>
    </div>

    <div class="section">
        <h2><span class="step-number">9</span>Quality Standards</h2>
        
        <h3>Documentation Requirements</h3>
        
        <table>
            <tr>
                <th>Element</th>
                <th>Minimum Standard</th>
                <th>Best Practice</th>
            </tr>
            <tr>
                <td>Photos</td>
                <td>4 exterior angles + damage</td>
                <td>8+ photos including interior</td>
            </tr>
            <tr>
                <td>Voice Notes</td>
                <td>Optional but recommended</td>
                <td>Include for complex issues</td>
            </tr>
            <tr>
                <td>Repair Estimates</td>
                <td>Required when damage present</td>
                <td>Detailed breakdown preferred</td>
            </tr>
            <tr>
                <td>Written Notes</td>
                <td>Brief condition summary</td>
                <td>Comprehensive observations</td>
            </tr>
        </table>
        
        <h3>Accuracy Standards</h3>
        <ul>
            <li>Repair estimates within 20% of actual costs</li>
            <li>All visible damage documented</li>
            <li>Clear, well-lit photography</li>
            <li>Professional, objective language</li>
        </ul>
    </div>

    <div class="section page-break">
        <h2><span class="step-number">10</span>Troubleshooting & Support</h2>
        
        <h3>Common Issues & Solutions</h3>
        
        <div class="workflow-step">
            <h4>🚫 Inspections Not Loading</h4>
            <p><strong>Solution:</strong> Refresh the page, check internet connection, verify you're logged in with correct inspector ID.</p>
        </div>
        
        <div class="workflow-step">
            <h4>📷 Camera Not Working</h4>
            <p><strong>Solution:</strong> Ensure browser permissions are granted, try refreshing page, check device camera functionality.</p>
        </div>
        
        <div class="workflow-step">
            <h4>🎤 Voice Recording Issues</h4>
            <p><strong>Solution:</strong> Check microphone permissions, ensure quiet environment, verify browser supports audio recording.</p>
        </div>
        
        <div class="workflow-step">
            <h4>💾 Data Not Saving</h4>
            <p><strong>Solution:</strong> Check internet connection, avoid closing browser during uploads, retry submission.</p>
        </div>
        
        <h3>When to Contact Support</h3>
        <ul>
            <li>Persistent technical errors</li>
            <li>Missing inspection assignments</li>
            <li>Data synchronization problems</li>
            <li>System performance issues</li>
            <li>Questions about repair estimation guidelines</li>
        </ul>
        
        <div class="important-note">
            <p><strong>Emergency Contact:</strong> If critical issues prevent you from completing assigned inspections, contact system administrators immediately.</p>
        </div>
    </div>

    <div class="section">
        <h2>📋 Quick Reference Checklist</h2>
        
        <h3>For Each Inspection:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li>□ Select inspector name and log in</li>
            <li>□ Choose inspection from queue</li>
            <li>□ Tap "Start Inspection"</li>
            <li>□ Capture exterior photos (minimum 4 angles)</li>
            <li>□ Photograph all damage areas</li>
            <li>□ Take interior photos if needed</li>
            <li>□ Record voice notes for complex issues</li>
            <li>□ Provide cosmetic repair estimate</li>
            <li>□ Provide mechanical repair estimate</li>
            <li>□ Add written notes</li>
            <li>□ Review all documentation</li>
            <li>□ Tap "Complete Inspection"</li>
        </ul>
        
        <h3>Daily Workflow:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li>□ Check inspection queue at start of day</li>
            <li>□ Plan route based on lane/run numbers</li>
            <li>□ Ensure device is charged and connected</li>
            <li>□ Complete inspections in efficient sequence</li>
            <li>□ Sync data regularly throughout day</li>
            <li>□ Verify all assignments completed before leaving</li>
        </ul>
    </div>

    <div class="section">
        <h2>📞 Contact Information</h2>
        <p>For technical support, training questions, or system issues, contact your system administrator or auction management team.</p>
        
        <div class="tip">
            <h4>Remember</h4>
            <p>This training guide covers the core functionality of the Inspector Portal. The system is designed to be intuitive, but don't hesitate to ask questions or request additional training if needed.</p>
        </div>
    </div>

</body>
</html>`;

async function generatePDF() {
  try {
    console.log('Generating Inspector Portal Training Guide PDF...');
    
    const options = {
      format: 'A4',
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '12mm',
        right: '12mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Inspector Portal Training Guide</div>',
      footerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    };

    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    fs.writeFileSync('inspector-portal-training-guide.pdf', pdfBuffer);
    console.log('✅ Training guide PDF generated successfully: inspector-portal-training-guide.pdf');
    console.log('📄 The PDF includes comprehensive training materials for inspector workflow');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

generatePDF();