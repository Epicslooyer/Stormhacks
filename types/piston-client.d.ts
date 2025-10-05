declare module 'piston-client' {
  interface PistonOptions {
    server?: string;
  }

  interface ExecuteConfig {
    language: string;
    version?: string;
    files?: Array<{
      name: string;
      content: string;
    }>;
    stdin?: string;
    args?: string[];
    compileTimeout?: number;
    runTimeout?: number;
    compileMemoryLimit?: number;
    runMemoryLimit?: number;
  }

  interface ExecuteResult {
    success: boolean;
    language?: string;
    version?: string;
    run?: {
      stdout: string;
      stderr: string;
      code: number;
      signal: string | null;
      output: string;
    };
    error?: Error;
  }

  interface PistonClient {
    runtimes(): Promise<Array<{
      language: string;
      version: string;
      aliases: string[];
    }>>;
    execute(language: string, code: string, config?: Partial<ExecuteConfig>): Promise<ExecuteResult>;
    execute(config: ExecuteConfig): Promise<ExecuteResult>;
  }

  function piston(options?: PistonOptions): PistonClient;
  export default piston;
}
