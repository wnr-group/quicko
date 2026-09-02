import "server-only";
import { createHmac } from "node:crypto";

// Payments provider seam, mirroring lib/otp.ts.
//   Dev / demo (no CASHFREE_APP_ID) → "simulated": money moves instantly in-DB,
//     no checkout, no real settlement. This is the current behaviour.
//   Prod (CASHFREE_APP_ID set) → Cashfree Easy Split: the sender pays into an
//     order whose vendor (traveler) split is HELD, then released on delivery.
// Swapping payment providers later means editing only this file.

export interface VendorInput {
  vendorId: string; // our profile id, reused as the Cashfree vendor id
  name: string;
  email: string;
  phone: string;
  pan: string;
  bank?: { accountNumber: string; accountHolder: string; ifsc: string };
  upi?: { vpa: string; accountHolder: string };
}

export interface EscrowPaymentInput {
  orderId: string; // deterministic, stored as transactions.providerRef
  matchId: string;
  amount: number; // total the sender pays (₹)
  travelerEarns: number; // vendor split, held until delivery (₹)
  commission: number; // Quiko's cut (₹) — stays with the merchant
  travelerVendorId: string;
  customer: { id: string; name: string; phone: string; email?: string };
  notifyUrl: string; // webhook
  returnUrl: string; // post-checkout redirect
}

// "completed" = nothing more to do, hold already recorded (simulated).
// "checkout"  = client must open Cashfree checkout with paymentSessionId.
export type EscrowPaymentResult =
  | { mode: "completed" }
  | { mode: "checkout"; paymentSessionId: string; orderId: string };

export interface PaymentsProvider {
  readonly kind: "simulated" | "cashfree";
  ensureVendor(input: VendorInput): Promise<{ vendorId: string }>;
  createEscrowPayment(input: EscrowPaymentInput): Promise<EscrowPaymentResult>;
  /** Release the held vendor split to the traveler after delivery is confirmed. */
  releaseToTraveler(input: { orderId: string; matchId: string }): Promise<void>;
  /** Refund the sender (ops action for disputes/cancellations). */
  refundToSender(input: { orderId: string; matchId: string; amount: number }): Promise<void>;
  /** Verify an inbound webhook. Returns the parsed event, or null if invalid. */
  verifyWebhook(rawBody: string, headers: Record<string, string>): unknown | null;
}

// ---- Simulated (default) -------------------------------------------------

const simulated: PaymentsProvider = {
  kind: "simulated",
  async ensureVendor(input) {
    return { vendorId: input.vendorId };
  },
  async createEscrowPayment() {
    // Money is recorded as held directly by the caller — no external checkout.
    return { mode: "completed" };
  },
  async releaseToTraveler() {
    // No-op: the caller records the payout as released immediately.
  },
  async refundToSender() {
    // No-op: the caller records the refund transaction directly.
  },
  verifyWebhook(rawBody) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  },
};

// ---- Cashfree Easy Split -------------------------------------------------

function cashfreeBase(): string {
  return process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeHeaders(): Record<string, string> {
  return {
    "x-client-id": process.env.CASHFREE_APP_ID!,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
    "x-api-version": process.env.CASHFREE_API_VERSION ?? "2023-08-01",
    "Content-Type": "application/json",
  };
}

async function cashfreeFetch(path: string, method: string, body?: unknown) {
  const res = await fetch(`${cashfreeBase()}${path}`, {
    method,
    headers: cashfreeHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Cashfree ${method} ${path} failed (${res.status})`);
  }
  return data;
}

const cashfree: PaymentsProvider = {
  kind: "cashfree",

  async ensureVendor(input) {
    const payload = {
      vendor_id: input.vendorId,
      status: "ACTIVE",
      name: input.name,
      email: input.email,
      phone: input.phone,
      verify_account: true,
      dashboard_access: false,
      // schedule_option controls the DEFAULT settlement cycle; we override per
      // order by holding the split and releasing it on delivery.
      schedule_option: 1,
      kyc_details: { account_type: "INDIVIDUAL", business_type: "Logistics", pan: input.pan },
      ...(input.bank && {
        bank: {
          account_number: input.bank.accountNumber,
          account_holder: input.bank.accountHolder,
          ifsc: input.bank.ifsc,
        },
      }),
      ...(input.upi && { upi: { vpa: input.upi.vpa, account_holder: input.upi.accountHolder } }),
    };
    // PATCH-or-create: try create, fall back to update if the vendor exists.
    try {
      await cashfreeFetch("/easy-split/vendors", "POST", payload);
    } catch {
      await cashfreeFetch(`/easy-split/vendors/${input.vendorId}`, "PATCH", payload);
    }
    return { vendorId: input.vendorId };
  },

  async createEscrowPayment(input) {
    const data = await cashfreeFetch("/orders", "POST", {
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      // Hold the traveler's share on the vendor's balance until we release it
      // after delivery. `tags.hold` marks it deferred (auto-releases at 45d).
      order_splits: [
        {
          vendor_id: input.travelerVendorId,
          amount: input.travelerEarns,
          tags: { hold: "delivery" },
        },
      ],
      customer_details: {
        customer_id: input.customer.id,
        customer_name: input.customer.name,
        customer_phone: input.customer.phone,
        ...(input.customer.email && { customer_email: input.customer.email }),
      },
      order_meta: { return_url: input.returnUrl, notify_url: input.notifyUrl },
    });
    return {
      mode: "checkout",
      paymentSessionId: data.payment_session_id,
      orderId: input.orderId,
    };
  },

  async releaseToTraveler({ orderId }) {
    // Release the held vendor split ahead of the auto-release window.
    // NOTE: verify the exact Easy Split settlement/adjustment endpoint against
    // the sandbox before go-live; the 45-day auto-release is the safety net.
    await cashfreeFetch(`/easy-split/orders/${orderId}/split`, "POST", {
      split: [{ tags: { hold: "delivery" }, action: "RELEASE" }],
    });
  },

  async refundToSender({ orderId, matchId, amount }) {
    // NOTE: verify the exact refunds endpoint/fields against the sandbox before go-live.
    await cashfreeFetch(`/orders/${orderId}/refunds`, "POST", {
      refund_amount: amount,
      refund_id: `rf_${matchId}`,
      refund_note: "Quiko ops refund",
    });
  },

  verifyWebhook(rawBody, headers) {
    const signature = headers["x-webhook-signature"];
    const timestamp = headers["x-webhook-timestamp"];
    if (!signature || !timestamp) return null;
    const expected = createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
      .update(timestamp + rawBody)
      .digest("base64");
    if (expected !== signature) return null;
    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  },
};

export function payments(): PaymentsProvider {
  return process.env.CASHFREE_APP_ID ? cashfree : simulated;
}
