import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import type sqlite3 from 'sqlite3';

// Define the database interfaces and structures
export interface PadData {
  path: string;
  content: string;
  language: string;
  last_updated: string;
  last_accessed: string;
}

export interface IDatabase {
  getPad(padPath: string): Promise<PadData | null>;
  savePad(padPath: string, content: string, language: string): Promise<boolean>;
  cleanupExpiredPads(maxAgeMs: number): Promise<number>;
}

// Local storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_DB_DIR = path.join(DATA_DIR, 'json_db');

// Ensure local directories exist only when fallbacks are instantiated


// Global threshold configuration (default 3 days)
const DEFAULT_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days (automatically purges inactive pads)

// -------------------------------------------------------------
// 1. File-Based Database Implementation (Local Fallback 2)
// -------------------------------------------------------------
class FileDatabase implements IDatabase {
  constructor() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(JSON_DB_DIR)) {
        fs.mkdirSync(JSON_DB_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('[FileDB] Failed to create directories:', err);
    }
  }

  private getFilePath(padPath: string): string {
    const safeName = Buffer.from(padPath).toString('hex') + '.json';
    return path.join(JSON_DB_DIR, safeName);
  }

  async getPad(padPath: string): Promise<PadData | null> {
    try {
      const filePath = this.getFilePath(padPath);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const dataStr = fs.readFileSync(filePath, 'utf-8');
      const pad = JSON.parse(dataStr);
      
      const lastAccessed = new Date().toISOString();
      const updatedPad: PadData = {
        path: pad.path || padPath,
        content: pad.content ?? '',
        language: pad.language ?? 'plaintext',
        last_updated: pad.last_updated || new Date().toISOString(),
        last_accessed: lastAccessed,
      };

      // Write updated last_accessed back to disk asynchronously
      fs.writeFile(filePath, JSON.stringify(updatedPad, null, 2), 'utf-8', () => {});
      
      return updatedPad;
    } catch (error) {
      console.error('[FileDB] Error reading pad:', error);
      return null;
    }
  }

  async savePad(padPath: string, content: string, language: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(padPath);
      const now = new Date().toISOString();
      const data: PadData = {
        path: padPath,
        content,
        language,
        last_updated: now,
        last_accessed: now,
      };
      
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);

      // Random 5% chance to run non-blocking garbage collection on saves
      if (Math.random() < 0.05) {
        this.cleanupExpiredPads(DEFAULT_EXPIRY_MS).then(cnt => {
          if (cnt > 0) console.log(`[FileDB GC] Cleared ${cnt} expired pads.`);
        });
      }
      return true;
    } catch (error) {
      console.error('[FileDB] Error saving pad:', error);
      return false;
    }
  }

  async cleanupExpiredPads(maxAgeMs: number): Promise<number> {
    try {
      const files = fs.readdirSync(JSON_DB_DIR);
      let deleteCount = 0;
      const now = Date.now();

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(JSON_DB_DIR, file);
        try {
          const dataStr = fs.readFileSync(filePath, 'utf-8');
          const pad = JSON.parse(dataStr);
          const lastAccessedTime = new Date(pad.last_accessed || pad.last_updated).getTime();
          
          if (now - lastAccessedTime > maxAgeMs) {
            fs.unlinkSync(filePath);
            deleteCount++;
          }
        } catch {
          // If file is corrupt or unreadable, delete it to clean up space
          fs.unlinkSync(filePath);
          deleteCount++;
        }
      }
      return deleteCount;
    } catch (error) {
      console.error('[FileDB GC] Error running cleanup:', error);
      return 0;
    }
  }
}

// -------------------------------------------------------------
// 2. SQLite Database Implementation (Local Fallback 1)
// -------------------------------------------------------------
class SqliteDatabase implements IDatabase {
  private db: sqlite3.Database | null = null;

  constructor(sqliteModule: typeof sqlite3) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('[SQLite] Failed to create data directory:', err);
    }
    const dbPath = path.join(DATA_DIR, 'scratchpad.db');
    const sqlite3Lib = sqliteModule.verbose ? (sqliteModule.verbose() as typeof sqlite3) : sqliteModule;

    this.db = new sqlite3Lib.Database(dbPath, (err: Error | null) => {
      if (err) {
        console.error('[SQLite] Error opening database:', err);
        throw err;
      }
      
      if (!this.db) return;

      this.db.serialize(() => {
        // Create table with full columns in case it is a new installation
        this.db!.run(`
          CREATE TABLE IF NOT EXISTS pads (
            path TEXT PRIMARY KEY,
            content TEXT,
            language TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (tableErr: Error | null) => {
          if (tableErr) {
            console.error('[SQLite] Table creation failed:', tableErr);
          } else {
            // Run ALTER TABLE migrations to safely add new columns to existing installations
            this.db!.run("ALTER TABLE pads ADD COLUMN language TEXT", (errCol: Error | null) => {
              if (errCol && !errCol.message.includes('duplicate column name')) {
                console.warn('[SQLite Migration] language column warning:', errCol.message);
              }
            });
            
            this.db!.run("ALTER TABLE pads ADD COLUMN last_accessed TIMESTAMP DEFAULT '2026-05-31 00:00:00'", (errAcc: Error | null) => {
              if (errAcc && !errAcc.message.includes('duplicate column name')) {
                console.warn('[SQLite Migration] last_accessed column warning:', errAcc.message);
              }
            });
            
            console.log('[SQLite] Persistence layer initialized and migrations verified successfully');
          }
        });
      });
    });
  }

  getPad(padPath: string): Promise<PadData | null> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }
      this.db.get(
        'SELECT path, content, language, last_updated, last_accessed FROM pads WHERE path = ?',
        [padPath],
        (err: Error | null, row: unknown) => {
          if (err) {
            console.error('[SQLite] GET Error:', err);
            resolve(null);
          } else if (row) {
            // Asynchronously update last_accessed timestamp in the background
            this.db!.run(
              "UPDATE pads SET last_accessed = datetime('now') WHERE path = ?",
              [padPath],
              () => {}
            );
            resolve(row as PadData);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  savePad(padPath: string, content: string, language: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(false);
        return;
      }
      this.db.run(
        `INSERT OR REPLACE INTO pads (path, content, language, last_updated, last_accessed) 
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        [padPath, content, language],
        (err: Error | null) => {
          if (err) {
            console.error('[SQLite] SAVE Error:', err);
            resolve(false);
          } else {
            // Random 5% chance to trigger garbage collection in the background
            if (Math.random() < 0.05) {
              this.cleanupExpiredPads(DEFAULT_EXPIRY_MS).then(cnt => {
                if (cnt > 0) console.log(`[SQLite GC] Pruned ${cnt} expired pads.`);
              });
            }
            resolve(true);
          }
        }
      );
    });
  }

  cleanupExpiredPads(maxAgeMs: number): Promise<number> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(0);
        return;
      }
      const ageInSeconds = Math.floor(maxAgeMs / 1000);
      this.db.run(
        `DELETE FROM pads WHERE last_accessed < datetime('now', '-' || ? || ' seconds')`,
        [ageInSeconds],
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            console.error('[SQLite GC] Clean Error:', err);
            resolve(0);
          } else {
            resolve(this.changes || 0);
          }
        }
      );
    });
  }
}

// -------------------------------------------------------------
// 3. Hosted MongoDB Implementation (Cloud Production Choice)
// -------------------------------------------------------------
class MongoDatabase implements IDatabase {
  private client: MongoClient;
  private dbName: string = 'scratchpad';

  constructor(clientInstance: MongoClient) {
    this.client = clientInstance;
    const uri = process.env.MONGODB_URI || '';
    
    // Parse DB name out of URI if present (e.g. mongodb+srv://.../dbname)
    try {
      const match = uri.match(/\/([a-zA-Z0-9_-]+)\?/);
      if (match && match[1]) {
        this.dbName = match[1];
      }
    } catch {
      // Ignore parsing errors and fallback to default dbName
    }
    
    console.log(`[MongoDB] Initialized serverless connection pool targeting db: "${this.dbName}"`);
  }

  private getCollection() {
    return this.client.db(this.dbName).collection('pads');
  }

  async getPad(padPath: string): Promise<PadData | null> {
    try {
      const collection = this.getCollection();
      const now = new Date();
      
      // Atomic lookup and touch: find the pad and update its last_accessed in one operation
      const result = await collection.findOneAndUpdate(
        { path: padPath },
        { $set: { last_accessed: now } },
        { returnDocument: 'after' }
      );

      // In some older mongodb driver versions, result might contain a 'value' property
      const doc = result && 'value' in result ? result.value : result;

      if (!doc) return null;

      return {
        path: doc.path,
        content: doc.content,
        language: doc.language,
        last_updated: doc.last_updated instanceof Date ? doc.last_updated.toISOString() : doc.last_updated,
        last_accessed: doc.last_accessed instanceof Date ? doc.last_accessed.toISOString() : doc.last_accessed,
      };
    } catch (err) {
      console.error('[MongoDB] GET Error:', err);
      return null;
    }
  }

  async savePad(padPath: string, content: string, language: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const now = new Date();
      
      // Upsert: update content and last_updated, and set last_accessed
      await collection.updateOne(
        { path: padPath },
        { 
          $set: { 
            content, 
            language, 
            last_updated: now,
            last_accessed: now
          } 
        },
        { upsert: true }
      );

      // Random 5% chance to run automatic garbage collection on saves
      if (Math.random() < 0.05) {
        this.cleanupExpiredPads(DEFAULT_EXPIRY_MS).then(cnt => {
          if (cnt > 0) console.log(`[MongoDB GC] Purged ${cnt} expired pads.`);
        });
      }
      return true;
    } catch (err) {
      console.error('[MongoDB] SAVE Error:', err);
      return false;
    }
  }

  async cleanupExpiredPads(maxAgeMs: number): Promise<number> {
    try {
      const collection = this.getCollection();
      const thresholdDate = new Date(Date.now() - maxAgeMs);
      
      // Delete all documents that haven't been accessed within the age window
      const result = await collection.deleteMany({
        last_accessed: { $lt: thresholdDate }
      });
      
      return result.deletedCount || 0;
    } catch (err) {
      console.error('[MongoDB GC] Pruning Error:', err);
      return 0;
    }
  }
}

// -------------------------------------------------------------
// Dynamic Resilience Connection Selector
// -------------------------------------------------------------
let activeDatabase: IDatabase;

const MONGODB_URI = process.env.MONGODB_URI;

async function initializeDatabase() {
  // Option A: If MONGODB_URI exists, connect to cloud database (Serverless safe)
  if (MONGODB_URI) {
    try {
      console.log('[DB] Detected MONGODB_URI. Attempting cloud database connection...');
      const client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      await client.connect();
      
      // Create indexes for high-speed lookups
      await client.db('scratchpad').collection('pads').createIndex({ path: 1 }, { unique: true });
      await client.db('scratchpad').collection('pads').createIndex({ last_accessed: 1 });
      
      activeDatabase = new MongoDatabase(client);
      console.log('[DB] Successfully connected to hosted MongoDB cloud.');
      return;
    } catch (mongoError) {
      console.error('[DB] Failed to load MongoDB driver. Trying local SQLite instead...', mongoError);
    }
  }

  // Option B: Fallback to local SQLite database
  try {
    const sqlite3Module = await import('sqlite3');
    activeDatabase = new SqliteDatabase(sqlite3Module);
    console.log('[DB] Successfully initialized SQLite storage.');
  } catch {
    // Option C: Absolute fallback to zero-dependency directory JSON DB files
    console.warn('[DB] SQLite failed to initialize. Falling back to Atomic JSON File Database.');
    activeDatabase = new FileDatabase();
  }
}

// Trigger synchronous load checks or hold a promise
initializeDatabase();

export const db = {
  getPad: async (padPath: string) => {
    if (!activeDatabase) await initializeDatabase();
    return activeDatabase.getPad(padPath);
  },
  savePad: async (padPath: string, content: string, language: string) => {
    if (!activeDatabase) await initializeDatabase();
    return activeDatabase.savePad(padPath, content, language);
  },
  cleanupExpiredPads: async (maxAgeMs: number) => {
    if (!activeDatabase) await initializeDatabase();
    return activeDatabase.cleanupExpiredPads(maxAgeMs);
  }
};
