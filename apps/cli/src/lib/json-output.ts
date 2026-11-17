export const JSON_FLAG = "--json";

export const wantsJson = (args: string[]) => args.includes(JSON_FLAG);

export const sendLogsToStderr = () => {
  console.log = (...values: unknown[]) => console.error(...values);
};

export const printJson = (value: unknown) => {
  process.stdout.write(`${JSON.stringify(value)}\n`);
};
