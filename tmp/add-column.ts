import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumn() {
  console.log("Attempting to add work_place column to attendance table...");
  const { error } = await supabase.rpc("execute_sql", {
    sql_query:
      "ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS work_place TEXT;",
  });

  if (error) {
    if (error.message.includes('function "execute_sql" does not exist')) {
      console.log(
        'NOTICE: "execute_sql" RPC function not found. Please manually add the "work_place" column (TEXT) to the "attendance" table in the Supabase Dashboard SQL Editor:',
      );
      console.log(
        "ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS work_place TEXT;",
      );
    } else {
      console.error("Error adding column:", error.message);
    }
  } else {
    console.log('Column "work_place" ensured in "attendance" table.');
  }
}

addColumn();
