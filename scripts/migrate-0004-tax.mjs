// One-off: GST columns (drizzle-kit push can't run multi-statement changes on PGlite).
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("./.data/pg");
await db.exec(`
  ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_slab text NOT NULL DEFAULT 'gst18';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn text;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_total integer NOT NULL DEFAULT 0;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_split jsonb;
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_rate integer NOT NULL DEFAULT 0;
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS hsn text;
  UPDATE products SET hsn = '21069099' WHERE hsn IS NULL AND kind <> 'gift';
  UPDATE products SET tax_slab = 'gst12', hsn = '44219990' WHERE kind = 'gift';
`);
console.log((await db.query("select tax_slab, count(*)::int n from products group by 1")).rows);
await db.close();
