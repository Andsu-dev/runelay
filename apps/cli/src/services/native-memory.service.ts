import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { attemptSync } from "@runelay/shared";
import { MANUAL_MEMORY_STEPS, NATIVE_MEMORY_TARGETS } from "@/constants/agent-memory.constants";
import { getIn, type JsonObject, parseJsonObject, setIn } from "@/lib/json";
import { readTomlValue, setTomlValue } from "@/lib/toml";
import { readYamlValue, setYamlValue } from "@/lib/yaml";
import type {
  ManualMemoryStep,
  NativeMemoryOutcome,
  NativeMemorySetting,
  NativeMemoryTarget,
} from "@/types/native-memory.types";

const splitAt = (key: string, index: number) => ({ table: key.slice(0, index), name: key.slice(index + 1) });

const tomlKey = (key: string) => splitAt(key, key.lastIndexOf("."));

const yamlKey = (key: string) => splitAt(key, key.indexOf("."));

const tomlLiteral = (value: boolean | string) => (typeof value === "string" ? JSON.stringify(value) : String(value));

const settingLabel = ({ key, value, mode }: NativeMemorySetting) => (mode === "include" ? `${key} += ${value}` : key);

const jsonApplied = (settings: JsonObject, { key, value, mode }: NativeMemorySetting) => {
  const current = getIn(settings, key);
  return mode === "include" ? Array.isArray(current) && current.includes(value) : current === value;
};

const applyJson = (settings: JsonObject, setting: NativeMemorySetting) => {
  if (setting.mode !== "include") return setIn(settings, setting.key, setting.value);
  const current = getIn(settings, setting.key);
  if (current !== undefined && !Array.isArray(current)) throw new Error(`${setting.key} is not a list`);
  setIn(settings, setting.key, [...(Array.isArray(current) ? current : []), setting.value]);
};

const textApplied = (target: NativeMemoryTarget, content: string, { key, value }: NativeMemorySetting) => {
  if (target.format === "toml") {
    const { table, name } = tomlKey(key);
    return readTomlValue(content, table, name) === tomlLiteral(value);
  }
  const { table, name } = yamlKey(key);
  return readYamlValue(content, table, name) === String(value);
};

const applyText = (target: NativeMemoryTarget, content: string, { key, value }: NativeMemorySetting) => {
  if (target.format === "toml") {
    const { table, name } = tomlKey(key);
    return setTomlValue(content, table, name, tomlLiteral(value));
  }
  const { table, name } = yamlKey(key);
  return setYamlValue(content, table, name, String(value));
};

const readContent = ({ file }: NativeMemoryTarget) => (existsSync(file) ? readFileSync(file, "utf8") : "");

const pendingSettings = (target: NativeMemoryTarget, content: string) => {
  if (target.format !== "json") return target.settings.filter((setting) => !textApplied(target, content, setting));
  const settings = parseJsonObject(content, target.file);
  return target.settings.filter((setting) => !jsonApplied(settings, setting));
};

const withSettings = (target: NativeMemoryTarget, content: string, pending: NativeMemorySetting[]) => {
  if (target.format !== "json")
    return pending.reduce((current, setting) => applyText(target, current, setting), content);
  const settings = parseJsonObject(content, target.file);
  for (const setting of pending) applyJson(settings, setting);
  return `${JSON.stringify(settings, null, 2)}\n`;
};

const isInstalled = ({ detect }: { detect: string[] }) => detect.some((path) => existsSync(path));

export const inspectNativeMemory = (targets = NATIVE_MEMORY_TARGETS): NativeMemoryOutcome[] =>
  targets.filter(isInstalled).map((target) => ({
    target,
    result: attemptSync(() => pendingSettings(target, readContent(target)).map(settingLabel), "INVALID_INPUT"),
  }));

export const disableNativeMemory = (targets = NATIVE_MEMORY_TARGETS): NativeMemoryOutcome[] =>
  targets.filter(isInstalled).map((target) => ({
    target,
    result: attemptSync(() => {
      const content = readContent(target);
      const pending = pendingSettings(target, content);
      if (!pending.length) return [];
      mkdirSync(dirname(target.file), { recursive: true });
      writeFileSync(target.file, withSettings(target, content, pending));
      return pending.map(settingLabel);
    }, "STORAGE_FAILED"),
  }));

export const installedManualSteps = (steps = MANUAL_MEMORY_STEPS): ManualMemoryStep[] => steps.filter(isInstalled);
