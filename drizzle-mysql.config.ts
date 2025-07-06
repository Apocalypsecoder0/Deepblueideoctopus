import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./migrations/mysql",
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.MYSQL_URL || process.env.DATABASE_URL || "",
    // Alternative configuration for individual parameters
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "deepblue_user",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "deepblue_octopus_ide",
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: false
    } : undefined
  },
  verbose: process.env.NODE_ENV === "development",
  strict: true,
  migrations: {
    table: "drizzle_migrations",
    schema: "deepblue_octopus_ide"
  }
} satisfies Config;