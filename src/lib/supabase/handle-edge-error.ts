import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

export default async function handleEdgeFunctionError(
  error: FunctionsHttpError | FunctionsRelayError | FunctionsFetchError | Error
) {
  if (error instanceof FunctionsHttpError) {
    const errorMessage = await error.context.json();
    return {
      message: errorMessage.error ?? JSON.stringify(errorMessage),
    };
  } else if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return {
      message: error.message,
    };
  }
}
