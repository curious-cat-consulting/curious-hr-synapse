"use client";

import { AlertTriangle } from "lucide-react";
import { type ComponentProps } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@components/ui/button";

import { Alert, AlertDescription } from "./alert";

type Props = Omit<ComponentProps<typeof Button>, "formAction"> & {
  pendingText?: string;
  formAction: (prevState: unknown, formData: FormData) => Promise<unknown>;
  errorMessage?: string;
};

const initialState = {
  message: "",
};

export function SubmitButton({
  children,
  formAction,
  errorMessage,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending, action } = useFormStatus();
  const [state, internalFormAction] = useActionState(formAction, initialState);

  const isPending = pending && action === internalFormAction;

  return (
    <div className="flex w-full flex-col gap-y-4">
      {Boolean(errorMessage ?? (state as { message?: string }).message) && (
        <Alert variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage ?? (state as { message?: string }).message}
          </AlertDescription>
        </Alert>
      )}
      <div>
        <Button {...props} type="submit" aria-disabled={pending} formAction={internalFormAction}>
          {isPending ? pendingText : children}
        </Button>
      </div>
    </div>
  );
}
