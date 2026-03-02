"use client";

import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import type { ReactNode } from "react";

interface StripeProviderProps {
  clientSecret: string;
  children: ReactNode;
}

export default function StripeProvider({
  clientSecret,
  children,
}: StripeProviderProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1a1a2e",
            colorBackground: "#ffffff",
            colorText: "#1a1a2e",
            colorDanger: "#ef4444",
            fontFamily: "system-ui, -apple-system, sans-serif",
            borderRadius: "8px",
          },
          rules: {
            ".Input": {
              border: "1px solid #e5e7eb",
              boxShadow: "none",
              padding: "12px",
            },
            ".Input:focus": {
              border: "1px solid #1a1a2e",
              boxShadow: "0 0 0 1px #1a1a2e",
            },
            ".Label": {
              fontWeight: "500",
              marginBottom: "6px",
            },
          },
        },
        locale: "it",
      }}
    >
      {children}
    </Elements>
  );
}
