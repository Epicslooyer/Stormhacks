import { ConvexHttpClient } from "convex/browser";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the Convex URL from environment or use default
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://your-convex-deployment.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);

async function migrateTestCases() {
  try {
    console.log("Starting test cases migration...");
    
    // Read the existing JSON file
    const testCasesFile = path.join(__dirname, "..", "data", "testcases.json");
    const data = await fs.readFile(testCasesFile, "utf-8");
    const testCasesMap = JSON.parse(data);
    
    console.log(`Found ${Object.keys(testCasesMap).length} test case entries to migrate`);
    
    // Migrate each test case entry
    for (const [problemSlug, testCaseData] of Object.entries(testCasesMap)) {
      console.log(`Migrating test cases for problem: ${problemSlug}`);
      
      try {
        // Check if test cases already exist in Convex
        const existing = await convex.query("problems:getTestCases", {
          problemSlug,
        });
        
        if (existing) {
          console.log(`  Test cases for ${problemSlug} already exist, skipping...`);
          continue;
        }
        
        // Create the test cases in Convex
        await convex.mutation("problems:createOrUpdateTestCases", {
          problemSlug,
          testCases: testCaseData.testCases,
        });
        
        console.log(`  ✅ Successfully migrated test cases for ${problemSlug}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate test cases for ${problemSlug}:`, error);
      }
    }
    
    console.log("Migration completed!");
    
    // Optionally, backup the original file
    const backupFile = path.join(__dirname, "..", "data", "testcases.json.backup");
    await fs.copyFile(testCasesFile, backupFile);
    console.log(`Original file backed up to: ${backupFile}`);
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateTestCases();
