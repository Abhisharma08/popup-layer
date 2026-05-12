const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  // 1. Get the popup
  const popup = await prisma.popup.findFirst();
  if (!popup) {
    console.log("No popup found in database. Create one first.");
    process.exit(1);
  }

  // Make sure it's ACTIVE for the test to work
  await prisma.popup.update({
    where: { id: popup.id },
    data: { status: 'ACTIVE' }
  });

  console.log(`Using Popup ID: ${popup.id}`);

  // 2. Generate test.html
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PopLayer E2E Test</title>
    <!-- PopLayer Embed -->
    <script src="http://localhost:4000/embed/poplayer.iife.js" data-popup-id="0882422c-a322-4647-bcf0-9f8df0a848c7"></script>

    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 2rem; max-width: 800px; margin: 0 auto; background: #f9fafb; color: #111827; }
        h1 { color: #4f46e5; }
        .content { margin-top: 2rem; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <h1>My Test Website</h1>
    <div class="content">
        <h2>Welcome to the demo</h2>
        <p>This is a simulated customer website. The PopLayer script is embedded in the head of this page.</p>
        <p>If the trigger is immediate, you should see the popup right away. If it's a time delay, wait a few seconds.</p>
    </div>
</body>
</html>
  `;

  const testHtmlPath = path.join(__dirname, '..', 'frontend', 'public', 'test.html');
  fs.writeFileSync(testHtmlPath, htmlContent);
  console.log(`Created test page at: http://localhost:5173/test.html`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
