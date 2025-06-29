const { createClient } = require("@supabase/supabase-js");

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("NEXT_PUBLIC_SUPABASE_URL");
  console.error("SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log("Setting up Supabase storage...");

    // Create the bucket
    const { data: bucketData, error: bucketError } =
      await supabase.storage.createBucket("chat-images", {
        public: false, // Keep private for security
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/bmp",
          "image/tiff",
        ],
      });

    if (bucketError) {
      if (bucketError.message.includes("already exists")) {
        console.log("Bucket already exists, skipping creation...");
      } else {
        throw bucketError;
      }
    } else {
      console.log("✅ Storage bucket created successfully");
    }

    // Create RLS policies
    const policies = [
      {
        name: "Users can upload images to their own folder",
        definition: `bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]`,
      },
      {
        name: "Users can view images from their own folder",
        definition: `bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]`,
      },
      {
        name: "Users can update images in their own folder",
        definition: `bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]`,
      },
      {
        name: "Users can delete images from their own folder",
        definition: `bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]`,
      },
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc("create_policy", {
          policy_name: policy.name,
          table_name: "storage.objects",
          definition: policy.definition,
        });
        console.log(`✅ Policy "${policy.name}" created`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`Policy "${policy.name}" already exists, skipping...`);
        } else {
          console.error(
            `❌ Error creating policy "${policy.name}":`,
            error.message
          );
        }
      }
    }

    console.log("🎉 Storage setup completed successfully!");
  } catch (error) {
    console.error("❌ Error setting up storage:", error);
    process.exit(1);
  }
}

setupStorage();
