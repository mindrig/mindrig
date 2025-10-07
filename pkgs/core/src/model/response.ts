export namespace ModelResponse {
  export type Data<Payload> = DataOk<Payload> | DataError;

  export interface DataOk<Payload> {
    status: "ok";
    payload: Payload;
  }

  export interface DataError {
    status: "error";
    message: string;
  }
}

export function modelResponseErrorData(
  error: unknown,
): ModelResponse.DataError {
  return {
    status: "error",
    message: error instanceof Error ? error.message : String(error),
  };
}
