import type { YamlNode } from "@/lib/yaml";

export interface McpTarget {
  id: string;
  name: string;
  detect: string[];
  command?: string;
  format: "json" | "yaml";
  serverPath: string;
  files: string[];
  mirrors?: string[];
  lookups?: string[];
  entry: (url: string, authorization: string) => Record<string, YamlNode>;
}

export interface McpTargetDirs {
  configHome?: string;
  kimiHome?: string;
}

export interface McpRegistration {
  registered: boolean;
  message: string | null;
}
