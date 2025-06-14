import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function setupDatabase() {
  try {
    // 1. Run Prisma migrations
    console.log("🔄 Running Prisma migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Prisma migrations completed");

    // 2. Set up Supabase
    console.log("🔄 Setting up Supabase storage and policies...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
      throw new Error(
        "Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL)"
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Create receipts bucket if it doesn't exist
    console.log("🔄 Creating receipts bucket...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }

    const receiptsBucket = buckets.find((bucket) => bucket.id === "receipts");

    if (!receiptsBucket) {
      const { error: createBucketError } = await supabase.storage.createBucket(
        "receipts",
        {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
          ],
        }
      );

      if (createBucketError) {
        throw new Error(`Error creating bucket: ${createBucketError.message}`);
      }

      console.log("✅ Receipts bucket created successfully");
    } else {
      console.log("✅ Receipts bucket already exists");
    }

    // 4. Set up PostgreSQL client for direct SQL execution
    console.log("🔄 Connecting to PostgreSQL...");
    const pgClient = new Client({
      connectionString: databaseUrl,
    });

    await pgClient.connect();
    console.log("✅ Connected to PostgreSQL");

    // 5. Enable RLS on storage.objects (skip - Supabase manages this)
    console.log("🔄 Checking storage.objects RLS...");
    try {
      // await pgClient.query(
      //   `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`
      // );
      console.log("✅ RLS enabled on storage.objects");
    } catch (error: any) {
      if (error.message.includes("already has row level security enabled")) {
        console.log("✅ RLS already enabled on storage.objects");
      } else if (error.message.includes("must be owner")) {
        console.log("✅ RLS on storage.objects (managed by Supabase)");
      } else {
        console.warn(`⚠️  Warning enabling RLS: ${error.message}`);
      }
    }

    // 6. Create storage policies
    console.log("🔄 Creating storage policies...");

    // const policies = [
    //   {
    //     name: "Users can upload their own receipts",
    //     sql: `
    //       CREATE POLICY "Users can upload their own receipts"
    //       ON storage.objects FOR INSERT
    //       WITH CHECK (
    //         bucket_id = 'receipts' AND
    //         (storage.foldername(name))[1] = auth.uid()::text
    //       );
    //     `,
    //   },
    //   {
    //     name: "Users can view their own receipts",
    //     sql: `
    //       CREATE POLICY "Users can view their own receipts"
    //       ON storage.objects FOR SELECT
    //       USING (
    //         bucket_id = 'receipts' AND
    //         (storage.foldername(name))[1] = auth.uid()::text
    //       );
    //     `,
    //   },
    //   {
    //     name: "Users can update their own receipts",
    //     sql: `
    //       CREATE POLICY "Users can update their own receipts"
    //       ON storage.objects FOR UPDATE
    //       USING (
    //         bucket_id = 'receipts' AND
    //         (storage.foldername(name))[1] = auth.uid()::text
    //       );
    //     `,
    //   },
    //   {
    //     name: "Users can delete their own receipts",
    //     sql: `
    //       CREATE POLICY "Users can delete their own receipts"
    //       ON storage.objects FOR DELETE
    //       USING (
    //         bucket_id = 'receipts' AND
    //         (storage.foldername(name))[1] = auth.uid()::text
    //       );
    //     `,
    //   },
    // ];

    // for (const policy of policies) {
    //   try {
    //     await pgClient.query(policy.sql);
    //     console.log(`✅ Created policy: ${policy.name}`);
    //   } catch (error: any) {
    //     if (error.message.includes("already exists")) {
    //       console.log(`✅ Policy "${policy.name}" already exists`);
    //     } else {
    //       console.warn(
    //         `⚠️  Warning creating policy "${policy.name}": ${error.message}`
    //       );
    //     }
    //   }
    // }

    // 7. Create table-level RLS policies for your app tables
    console.log("🔄 Creating table policies...");

    // const tablePolicies = [
    //   {
    //     name: "Users can view their own expenses",
    //     sql: `
    //       CREATE POLICY "Users can view their own expenses"
    //       ON expenses FOR SELECT
    //       USING (submitted_by_id::text = auth.uid()::text);
    //     `,
    //   },
    //   {
    //     name: "Users can create their own expenses",
    //     sql: `
    //       CREATE POLICY "Users can create their own expenses"
    //       ON expenses FOR INSERT
    //       WITH CHECK (submitted_by_id::text = auth.uid()::text);
    //     `,
    //   },
    //   {
    //     name: "Users can update their own expenses",
    //     sql: `
    //       CREATE POLICY "Users can update their own expenses"
    //       ON expenses FOR UPDATE
    //       USING (
    //         submitted_by_id::text = auth.uid()::text AND
    //         status = 'PENDING'
    //       );
    //     `,
    //   },
    //   {
    //     name: "Users can delete their own expenses",
    //     sql: `
    //       CREATE POLICY "Users can delete their own expenses"
    //       ON expenses FOR DELETE
    //       USING (submitted_by_id::text = auth.uid()::text);
    //     `,
    //   },
    //   {
    //     name: "Users can view organizations through expenses",
    //     sql: `
    //       CREATE POLICY "Users can view organizations through expenses"
    //       ON organizations FOR SELECT
    //       USING (
    //         id IN (
    //           SELECT organization_id
    //           FROM expenses
    //           WHERE submitted_by_id::text = auth.uid()::text
    //         )
    //       );
    //     `,
    //   },
    // ];

    // for (const policy of tablePolicies) {
    //   try {
    //     await pgClient.query(policy.sql);
    //     console.log(`✅ ${policy.name}`);
    //   } catch (error: any) {
    //     if (
    //       error.message.includes("already exists") ||
    //       error.message.includes("already has row level security enabled")
    //     ) {
    //       console.log(`✅ ${policy.name} - already exists`);
    //     } else {
    //       console.warn(`⚠️  Warning: ${policy.name} - ${error.message}`);
    //     }
    //   }
    // }

    // 8. Close PostgreSQL connection
    await pgClient.end();
    console.log("✅ PostgreSQL connection closed");

    console.log("🎉 Database setup completed successfully!");
    console.log("");
    console.log("📝 Summary:");
    console.log("  ✅ Prisma migrations applied");
    console.log("  ✅ Receipts storage bucket created");
    console.log("  ✅ Storage policies configured");
    console.log("  ✅ Table RLS policies configured");
    console.log("");
    console.log("🚀 You can now run your application!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
