import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function setupDatabase() {
  try {
    // 1. Run Prisma migrations
    console.log("Running Prisma migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });

    // 2. Apply Supabase RLS policies
    console.log("Applying Supabase RLS policies...");

    console.warn(
      "process.env.NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Read and execute RLS policies
    const rlsSql = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20240320000000_initial_schema.sql"
      ),
      "utf-8"
    );

    // Split the SQL file into individual statements
    const statements = rlsSql
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await supabase.rpc("exec_sql", { query: statement });
    }

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
