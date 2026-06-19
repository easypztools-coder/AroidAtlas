import fs from "fs";
import path from "path";
import { getDbPool } from "../src/lib/db";

// Load .env.local for local running
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      const value = values.join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key.trim()] = value;
    }
  }
}

async function migrate() {
  console.log("Starting database migrations...");
  const pool = getDbPool();

  try {
    // 1. Scrape Runs
    console.log("Creating retail_scrape_runs table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retail_scrape_runs (
        id SERIAL PRIMARY KEY,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL DEFAULT 'running',
        retailer_count INTEGER DEFAULT 0,
        fetched_product_count INTEGER DEFAULT 0,
        accepted_count INTEGER DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        rejected_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        error_summary TEXT
      );
    `);

    // 2. Retail Price Observations
    console.log("Creating retail_price_observations table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retail_price_observations (
        id SERIAL PRIMARY KEY,
        plant_slug VARCHAR(255) NOT NULL,
        retailer_slug VARCHAR(255) NOT NULL,
        retailer_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        product_url TEXT NOT NULL,
        price_gbp DECIMAL(10, 2) NOT NULL,
        original_price_gbp DECIMAL(10, 2),
        previous_price_gbp DECIMAL(10, 2),
        in_stock BOOLEAN NOT NULL DEFAULT TRUE,
        variant_title VARCHAR(255),
        pot_size_cm DECIMAL(5, 2),
        plant_size_label VARCHAR(50),
        source_method VARCHAR(50) NOT NULL,
        match_confidence DECIMAL(5, 4) NOT NULL,
        first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_price_change_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(retailer_slug, product_url)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_obs_plant_stock ON retail_price_observations(plant_slug, in_stock);
    `);

    // 3. Retail Price Snapshots
    console.log("Creating retail_price_snapshots table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retail_price_snapshots (
        id SERIAL PRIMARY KEY,
        plant_slug VARCHAR(255) NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
        observed_count INTEGER NOT NULL DEFAULT 0,
        min_price DECIMAL(10, 2) NOT NULL,
        p25_price DECIMAL(10, 2) NOT NULL,
        median_price DECIMAL(10, 2) NOT NULL,
        mean_price DECIMAL(10, 2) NOT NULL,
        trimmed_mean_price DECIMAL(10, 2) NOT NULL,
        p75_price DECIMAL(10, 2) NOT NULL,
        max_price DECIMAL(10, 2) NOT NULL
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_snapshots_plant_date ON retail_price_snapshots(plant_slug, checked_at);
    `);

    // 4. Review Queue
    console.log("Creating retail_price_review_queue table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retail_price_review_queue (
        id SERIAL PRIMARY KEY,
        retailer_slug VARCHAR(255) NOT NULL,
        product_title VARCHAR(255) NOT NULL,
        product_url TEXT NOT NULL,
        proposed_plant_slug VARCHAR(255) NOT NULL,
        match_confidence DECIMAL(5, 4) NOT NULL,
        proposed_item_type VARCHAR(50) NOT NULL,
        price_gbp DECIMAL(10, 2) NOT NULL,
        reason TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_review_status ON retail_price_review_queue(status);
    `);

    // 5. Scrape Errors
    console.log("Creating retail_scrape_errors table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retail_scrape_errors (
        id SERIAL PRIMARY KEY,
        run_id INTEGER REFERENCES retail_scrape_runs(id) ON DELETE CASCADE,
        retailer_slug VARCHAR(255) NOT NULL,
        extraction_method VARCHAR(50) NOT NULL,
        http_status INTEGER,
        error_message TEXT,
        time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        retry_outcome VARCHAR(255)
      );
    `);

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
