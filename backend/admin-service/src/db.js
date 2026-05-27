import pg from "pg";
import mssql from "mssql";
import { config } from "./config.js";

const { Pool } = pg;

export const orderPool = new Pool({
  connectionString: config.orderDbUrl,
});

export const menuPool = new Pool({
  connectionString: config.menuDbUrl,
});

let userPoolPromise = null;

export function getUserPool() {
  if (!userPoolPromise) {
    const pool = new mssql.ConnectionPool(config.userDb);
    userPoolPromise = pool.connect();
  }

  return userPoolPromise;
}

export { mssql };
