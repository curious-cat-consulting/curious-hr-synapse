"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "./alert";

interface OAuthError {
  error: string;
  error_code?: string;
  error_description?: string;
}

export function OAuthErrorHandler() {
  const [error, setError] = useState<OAuthError | null>(null);

  useEffect(() => {
    // Check if there's an error in the URL hash
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash !== "" && hash.includes("error=")) {
        const params = new URLSearchParams(hash.substring(1));
        const oauthError: OAuthError = {
          error: params.get("error") ?? "",
          error_code: params.get("error_code") ?? undefined,
          error_description: params.get("error_description") ?? undefined,
        };

        if (oauthError.error !== "") {
          setError(oauthError);

          // Clean up the URL by removing the hash
          const url = new URL(window.location.href);
          url.hash = "";
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, []);

  if (error === null) {
    return null;
  }

  const getErrorMessage = (oauthError: OAuthError): string => {
    // Handle specific error codes
    switch (oauthError.error_code) {
      case "unexpected_failure":
        return "An unexpected error occurred during authentication. Please try again.";
      case "server_error":
        return "Authentication server error. Please try again later.";
      case "access_denied":
        return "Access was denied. Please try again or contact support.";
      case "invalid_request":
        return "Invalid authentication request. Please try again.";
      default:
        // Use the error description if available, otherwise use the error code
        return oauthError.error_description !== undefined && oauthError.error_description !== ""
          ? decodeURIComponent(oauthError.error_description.replace(/\+/g, " "))
          : `Authentication error: ${oauthError.error}`;
    }
  };

  return (
    <Alert variant="destructive" className="w-full">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{getErrorMessage(error)}</AlertDescription>
    </Alert>
  );
}
