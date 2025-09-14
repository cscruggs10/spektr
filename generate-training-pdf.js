import puppeteer from 'puppeteer';
import htmlPdf from 'html-pdf-node';
import fs from 'fs';

async function generateTrainingPDF() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  // Base URL for the application
  const baseUrl = 'http://localhost:5000';
  
  const screenshots = [];
  
  try {
    // Screenshot 1: Inspector Portal Login
    console.log('Capturing Inspector Portal Login...');
    await page.goto(`${baseUrl}/inspector-portal`);
    await page.waitForTimeout(2000);
    const loginScreenshot = await page.screenshot({ 
      fullPage: true,
      encoding: 'base64'
    });
    screenshots.push({
      title: 'Inspector Portal Login',
      description: 'Select your name from the inspector dropdown to access your assigned inspections.',
      image: `data:image/png;base64,${loginScreenshot}`
    });

    // Try to select an inspector if available
    try {
      await page.click('[data-testid="inspector-select"]');
      await page.waitForTimeout(500);
      const inspectorOptions = await page.$$('[role="option"]');
      if (inspectorOptions.length > 0) {
        await inspectorOptions[0].click();
        await page.waitForTimeout(1000);
        
        // Screenshot 2: Inspection List
        console.log('Capturing Inspection List...');
        const inspectionListScreenshot = await page.screenshot({ 
          fullPage: true,
          encoding: 'base64'
        });
        screenshots.push({
          title: 'Pending Inspections List',
          description: 'View all pending and in-progress inspections assigned to you. Inspections are sorted by lane and run number.',
          image: `data:image/png;base64,${inspectionListScreenshot}`
        });

        // Try to start an inspection
        const startButtons = await page.$$('button:has-text("Start Inspection")');
        if (startButtons.length > 0) {
          await startButtons[0].click();
          await page.waitForTimeout(2000);
          
          // Screenshot 3: Inspection Form
          console.log('Capturing Inspection Form...');
          const inspectionFormScreenshot = await page.screenshot({ 
            fullPage: true,
            encoding: 'base64'
          });
          screenshots.push({
            title: 'Vehicle Inspection Form',
            description: 'Complete the inspection by adding photos, recording voice notes, and filling in repair estimates.',
            image: `data:image/png;base64,${inspectionFormScreenshot}`
          });
        }
      }
    } catch (error) {
      console.log('Could not navigate through inspector flow:', error.message);
    }

    // Screenshot 4: Completed Inspections (if accessible)
    try {
      await page.goto(`${baseUrl}/completed-inspections`);
      await page.waitForTimeout(2000);
      const completedScreenshot = await page.screenshot({ 
        fullPage: true,
        encoding: 'base64'
      });
      screenshots.push({
        title: 'Completed Inspections',
        description: 'View completed inspections with repair estimates and embedded voice notes.',
        image: `data:image/png;base64,${completedScreenshot}`
      });
    } catch (error) {
      console.log('Could not capture completed inspections:', error.message);
    }

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  }
  
  await browser.close();

  // Generate HTML content for PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Inspector Portal Training Guide</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 16px;
        }
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #2563eb;
            font-size: 22px;
            margin-bottom: 15px;
            border-left: 4px solid #2563eb;
            padding-left: 15px;
        }
        .section p {
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.8;
        }
        .screenshot {
            width: 100%;
            max-width: 100%;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin: 20px 0;
        }
        .step-number {
            background: #2563eb;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
        }
        .overview {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .overview h3 {
            color: #1e40af;
            margin-top: 0;
        }
        .key-features {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .key-features h3 {
            color: #065f46;
            margin-top: 0;
        }
        .key-features ul {
            margin: 0;
            padding-left: 20px;
        }
        .key-features li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Inspector Portal Training Guide</h1>
        <p>Complete guide for vehicle inspection workflow</p>
    </div>

    <div class="overview">
        <h3>Inspector Portal Overview</h3>
        <p>The Inspector Portal is designed for mobile-first vehicle inspections at auto auctions. Inspectors can efficiently complete vehicle assessments, capture photos and videos, record voice notes, and provide repair estimates.</p>
    </div>

    <div class="key-features">
        <h3>Key Features</h3>
        <ul>
            <li><strong>Mobile-Optimized:</strong> Designed to work seamlessly on phones and tablets</li>
            <li><strong>Photo & Video Capture:</strong> Direct camera integration for documentation</li>
            <li><strong>Voice Notes:</strong> Record audio notes that integrate with inspection records</li>
            <li><strong>Repair Estimates:</strong> Separate cosmetic and mechanical damage assessments</li>
            <li><strong>Real-time Updates:</strong> Instant synchronization with the main system</li>
            <li><strong>Filtered Workflow:</strong> Only shows pending and in-progress inspections</li>
        </ul>
    </div>

    <div class="section">
        <h2><span class="step-number">1</span>Getting Started</h2>
        <p>Access the Inspector Portal by navigating to the inspector portal page. You'll need to select your name from the inspector dropdown to view your assigned inspections.</p>
        <p><strong>Important:</strong> Only inspections assigned to you and in "pending" or "in-progress" status will be displayed. Completed inspections automatically disappear from your view.</p>
    </div>

    <div class="section">
        <h2><span class="step-number">2</span>Viewing Assigned Inspections</h2>
        <p>Once logged in, you'll see a list of vehicles requiring inspection. Each entry shows:</p>
        <ul>
            <li>Vehicle information (Year, Make, Model, VIN)</li>
            <li>Lane and run numbers for easy location</li>
            <li>Current inspection status</li>
            <li>Action buttons to start or continue inspections</li>
        </ul>
        <p>Inspections are automatically sorted by lane number, then by run number to optimize your workflow path through the auction.</p>
    </div>

    <div class="section">
        <h2><span class="step-number">3</span>Conducting an Inspection</h2>
        <p>When you start an inspection, the system changes the status to "in-progress" and opens the inspection form. Here you can:</p>
        <ul>
            <li><strong>Add Photos:</strong> Capture multiple angles and damage areas</li>
            <li><strong>Record Videos:</strong> Document mechanical issues or detailed damage</li>
            <li><strong>Voice Notes:</strong> Record detailed observations that will be embedded in the inspection notes</li>
            <li><strong>Repair Estimates:</strong> Provide separate estimates for cosmetic and mechanical repairs</li>
            <li><strong>Written Notes:</strong> Add any additional text-based observations</li>
        </ul>
    </div>

    <div class="section">
        <h2><span class="step-number">4</span>Voice Notes Integration</h2>
        <p>Voice notes are a key feature of the inspection process:</p>
        <ul>
            <li>Record voice notes using the microphone button</li>
            <li>Voice recordings are automatically embedded into the main inspection notes</li>
            <li>Playback controls are available for review</li>
            <li>Voice notes appear alongside any written notes in the final report</li>
        </ul>
        <p><strong>Note:</strong> Voice notes are stored as audio files and integrated directly into the inspection record, not as separate attachments.</p>
    </div>

    <div class="section">
        <h2><span class="step-number">5</span>Repair Estimates</h2>
        <p>Provide accurate repair estimates in two categories:</p>
        <ul>
            <li><strong>Cosmetic Repairs:</strong> Paint, dents, scratches, interior damage</li>
            <li><strong>Mechanical Repairs:</strong> Engine, transmission, electrical, suspension issues</li>
        </ul>
        <p>For each category, enter both the estimated cost and detailed description of required repairs.</p>
    </div>

    <div class="section">
        <h2><span class="step-number">6</span>Completing Inspections</h2>
        <p>Once all documentation is complete:</p>
        <ol>
            <li>Review all captured media and notes</li>
            <li>Verify repair estimates are accurate</li>
            <li>Click "Complete Inspection"</li>
            <li>The inspection will be marked as completed and removed from your active list</li>
            <li>Data is immediately available in the main system for review</li>
        </ol>
    </div>

    <div class="section">
        <h2><span class="step-number">7</span>Best Practices</h2>
        <ul>
            <li><strong>Photo Quality:</strong> Ensure good lighting and clear focus</li>
            <li><strong>Comprehensive Documentation:</strong> Capture all damage areas and mechanical issues</li>
            <li><strong>Accurate Estimates:</strong> Base repair costs on current market rates</li>
            <li><strong>Voice Notes:</strong> Speak clearly and include specific details</li>
            <li><strong>Workflow Efficiency:</strong> Follow lane/run number sequence to minimize walking</li>
            <li><strong>Regular Sync:</strong> Ensure strong internet connection for real-time updates</li>
        </ul>
    </div>

    ${screenshots.map((screenshot, index) => `
    <div class="section">
        <h2>${screenshot.title}</h2>
        <p>${screenshot.description}</p>
        <img src="${screenshot.image}" class="screenshot" alt="${screenshot.title}" />
    </div>
    `).join('')}

    <div class="section">
        <h2>Support & Troubleshooting</h2>
        <p>If you encounter issues with the Inspector Portal:</p>
        <ul>
            <li>Ensure you have a stable internet connection</li>
            <li>Refresh the page if inspections don't load</li>
            <li>Contact system administrators for technical support</li>
            <li>Report any bugs or usability issues for system improvements</li>
        </ul>
    </div>
</body>
</html>`;

  // Generate PDF
  console.log('Generating PDF...');
  const options = {
    format: 'A4',
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    }
  };

  const file = { content: htmlContent };
  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  
  // Save PDF
  fs.writeFileSync('inspector-portal-training-guide.pdf', pdfBuffer);
  console.log('Training guide PDF generated: inspector-portal-training-guide.pdf');
}

generateTrainingPDF().catch(console.error);