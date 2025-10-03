export interface RunResult {
  success: boolean;
  runId?: string | null;
  resultId?: string;
  runLabel?: string;
  label?: string;
  prompt?: string | null;
  text?: string | null;
  textParts?: string[];
  streaming?: boolean;
  isLoading?: boolean;
  nonStreamingNote?: string | null;
  request?: object | null;
  response?: object | null;
  usage?: any;
  totalUsage?: any;
  steps?: any;
  finishReason?: any;
  warnings?: any;
  error?: string | null;
  model?: {
    key: string;
    id: string | null;
    providerId: string | null;
    label?: string | null;
    settings?: any;
  };
}
