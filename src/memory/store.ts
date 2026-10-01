import fs from "node:fs/promises";
import path from "node:path";

export class FileMemoryStore {
  constructor(private readonly filePath: string) {}

  async ensure(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, "{}\n", "utf8");
    }
  }

  private async readAll(): Promise<Record<string, string>> {
    await this.ensure();
    const raw = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(raw) as Record<string, string>;
  }

  private async writeAll(data: Record<string, string>): Promise<void> {
    await fs.writeFile(
      this.filePath,
      `${JSON.stringify(data, null, 2)}\n`,
      "utf8",
    );
  }

  async get(key: string): Promise<string | null> {
    const data = await this.readAll();
    return data[key] ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const data = await this.readAll();
    data[key] = value;
    await this.writeAll(data);
  }
}
