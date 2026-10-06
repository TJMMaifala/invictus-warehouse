export interface InitializeArgs {
  reference: string;
  amountCents: number;
  email: string;
  callbackUrl: string;
  metadata: { orderNumber: string };
}
export interface InitializeResult { redirectUrl: string }
export interface VerifyResult {
  /** provider confirms funds were captured */
  paid: boolean;
  amountCents: number;
  currency: string;
  raw: unknown;
}

/**
 * Payment gateway abstraction. Implementations run SERVER-SIDE only and read
 * secrets from env. Card data never touches this application — the customer
 * pays on the gateway's hosted page.
 */
export interface PaymentProvider {
  id: "paystack" | "payfast";
  isConfigured(): boolean;
  initialize(args: InitializeArgs): Promise<InitializeResult>;
  /** Server-to-server verification; never trust the redirect alone. */
  verify(reference: string): Promise<VerifyResult>;
}
