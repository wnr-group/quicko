"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  createPackageSchema,
  createTripSchema,
  type CreatePackageInput,
  type CreateTripInput,
} from "@/lib/validation";
import {
  createPackage,
  updatePackage,
  deletePackage,
  setPackageReceiver,
  getOwnedPackage,
  getPackage,
} from "@/lib/queries/packages";
import { updateProfile } from "@/lib/queries/users";
import {
  sendRequest,
  acceptRequest,
  declineRequest,
  acceptOfferAsSender,
  declineOfferAsSender,
  adminCreateMatch,
  capacityError,
  pendingRequestOverCapacity,
} from "@/lib/queries/requests";
import {
  payForMatch,
  advanceMatchAsTraveler,
  confirmDelivery,
  rateTraveler,
  setDetourOptOut,
  cancelMatchAsParticipant,
} from "@/lib/queries/matches";
import { getTrip, getOwnedTrip, createTrip, deleteTrip } from "@/lib/queries/trips";
import { markAllRead } from "@/lib/queries/notifications";
import { sendMessage, sendLocationMessage } from "@/lib/queries/messages";
import { submitKyc, approveKyc, rejectKyc } from "@/lib/queries/kyc";
import { postUserSupportMessage, postStaffReply, setSupportThreadStatus, setMySupportStatus } from "@/lib/queries/support";
import {
  setUserStatus, setUserStaffRole, forceVerifyUser, editUserName,
  adminRefundMatch, adminReleaseMatch, adminHoldMatch, adminCancelMatch,
} from "@/lib/queries/adminOps";
import { raiseDispute, dismissDispute, withdrawDispute } from "@/lib/queries/disputes";
import { createReport, actionReport } from "@/lib/queries/reports";
import { requireAdmin, requireSupport } from "@/lib/auth";
import {
  notifyMatchesForNewTrip,
  notifyMatchesForNewPackage,
} from "@/lib/queries/automatch";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidatePackage(packageId: string) {
  revalidatePath(`/app/packages/${packageId}`);
  revalidatePath("/app");
}

function revalidateTraveler(tripId: string, packageId: string) {
  revalidatePath(`/app/travel/trips/${tripId}`);
  revalidatePath("/app/travel");
  revalidatePath(`/app/packages/${packageId}`);
}

export async function payForMatchAction(
  matchId: string,
  packageId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const res = await payForMatch(matchId, user.id);
  if (res.ok) revalidatePackage(packageId);
  return res;
}

// Sender toggles the traveller's detour on/off (door-service vs self-collect),
// before paying. Changes agreedPrice.
export async function setDetourOptOutAction(
  matchId: string,
  packageId: string,
  optedOut: boolean,
): Promise<ActionResult> {
  const user = await requireUser();
  const res = await setDetourOptOut(matchId, user.id, optedOut);
  if (res.ok) revalidatePackage(packageId);
  return res;
}

// Either party cancels a match before pickup (refunds the sender if already paid).
export async function cancelMatchAction(matchId: string, packageId: string): Promise<ActionResult> {
  const user = await requireUser();
  const res = await cancelMatchAsParticipant(matchId, user.id);
  if (res.ok) {
    revalidatePackage(packageId);
    revalidatePath("/app/travel");
  }
  return res;
}

// Traveler-side: advance pickup/in-transit and confirm delivery with the OTP.
export async function advanceMatchAction(
  matchId: string,
  tripId: string,
  packageId: string,
  to: "picked_up" | "in_transit",
  photo?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const res = await advanceMatchAsTraveler(matchId, user.id, to, photo);
  if (res.ok) revalidateTraveler(tripId, packageId);
  return res;
}

export async function confirmDeliveryAction(
  matchId: string,
  tripId: string,
  packageId: string,
  otp: string,
  photo?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const res = await confirmDelivery(matchId, user.id, otp, photo);
  if (res.ok) revalidateTraveler(tripId, packageId);
  return res;
}

export async function rateTravelerAction(
  matchId: string,
  packageId: string,
  stars: number,
  comment: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (stars < 1 || stars > 5) return { ok: false, error: "Pick 1–5 stars" };
  const res = await rateTraveler(matchId, user.id, stars, comment.trim() || null);
  if (res.ok) revalidatePackage(packageId);
  return res;
}

export async function createPackageAction(input: CreatePackageInput) {
  const user = await requireUser();
  const parsed = createPackageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const pkg = await createPackage(user.id, parsed.data);
  revalidatePath("/app");
  redirect(`/app/packages/${pkg.id}/travelers`);
}

// Explore-first: create the package with the details, then either request the
// chosen traveler (tripId) or leave it open (notify-me). Redirects to detail.
export async function createFromExploreAction(
  input: CreatePackageInput,
  tripId?: string,
) {
  const user = await requireUser();
  const parsed = createPackageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Explore lists trips before the weight is known, so the chosen traveller may
  // not be able to carry it. Check before creating anything — otherwise a
  // rejected request leaves an orphan package behind.
  const chosen = tripId ? await getTrip(tripId) : null;
  if (tripId && chosen) {
    const tooHeavy = capacityError(parsed.data.weightKg, chosen.capacityKg);
    if (tooHeavy) return { ok: false as const, error: tooHeavy };
  }

  const pkg = await createPackage(user.id, parsed.data);
  if (tripId) {
    if (chosen && chosen.status === "active") {
      await sendRequest({
        packageId: pkg.id,
        tripId,
        requestedBy: user.id,
        initiatorRole: "sender",
        amount: Math.min(pkg.offerPrice, pkg.maxPrice),
      });
    }
  } else {
    // "Notify me" — left open. Alert any travelers already on this route.
    await notifyMatchesForNewPackage(pkg);
  }
  revalidatePath("/app");
  redirect(`/app/packages/${pkg.id}`);
}

export async function updatePackageAction(
  packageId: string,
  input: CreatePackageInput,
) {
  const user = await requireUser();
  const parsed = createPackageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // A package with a pending request is still "active" and so still editable.
  // Don't let the weight be raised past the capacity of a traveller who already
  // has a request for it sitting in their queue.
  const overCapacity = await pendingRequestOverCapacity(packageId, parsed.data.weightKg);
  if (overCapacity !== null) {
    return {
      ok: false as const,
      error: `A traveller you've already requested has only ${overCapacity} kg spare. Cancel that request before raising the weight to ${parsed.data.weightKg} kg.`,
    };
  }

  const updated = await updatePackage(packageId, user.id, parsed.data);
  if (!updated) {
    return { ok: false as const, error: "This package can no longer be edited" };
  }
  revalidatePath("/app");
  revalidatePath(`/app/packages/${packageId}`);
  redirect(`/app/packages/${packageId}`);
}

export async function deletePackageAction(packageId: string): Promise<ActionResult> {
  const user = await requireUser();
  const deleted = await deletePackage(packageId, user.id);
  if (!deleted) return { ok: false, error: "This package can no longer be cancelled" };
  revalidatePath("/app");
  redirect("/app");
}

export async function setReceiverAction(
  packageId: string,
  name: string,
  phone: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const n = name.trim();
  const p = phone.replace(/\D/g, "");
  if (n.length < 2) return { ok: false, error: "Enter the receiver's name" };
  if (p.length < 10) return { ok: false, error: "Enter a valid receiver phone" };
  const row = await setPackageReceiver(packageId, user.id, n, p);
  if (!row) return { ok: false, error: "Package not found" };
  revalidatePackage(packageId);
  return { ok: true };
}

export async function updateProfileAction(
  fullName: string,
  email: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const name = fullName.trim();
  const mail = email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "Enter a valid name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { ok: false, error: "Enter a valid email" };
  await updateProfile(user.id, { fullName: name, email: mail });
  revalidatePath("/app/profile");
  revalidatePath("/app");
  return { ok: true };
}

export async function sendRequestAction(params: {
  packageId: string;
  tripId: string;
  amount: number;
}): Promise<ActionResult> {
  const user = await requireUser();
  const pkg = await getOwnedPackage(params.packageId, user.id);
  if (!pkg) return { ok: false, error: "Package not found" };
  if (pkg.status !== "active") return { ok: false, error: "Package is no longer active" };

  const trip = await getTrip(params.tripId);
  if (!trip || trip.status !== "active") {
    return { ok: false, error: "This trip is no longer available" };
  }
  const tooHeavy = capacityError(pkg.weightKg, trip.capacityKg);
  if (tooHeavy) return { ok: false, error: tooHeavy };

  await sendRequest({
    packageId: params.packageId,
    tripId: params.tripId,
    requestedBy: user.id,
    initiatorRole: "sender",
    amount: Math.min(params.amount, pkg.maxPrice),
  });
  revalidatePath(`/app/packages/${params.packageId}`);
  revalidatePath(`/app/packages/${params.packageId}/travelers`);
  return { ok: true };
}

// ---- Traveler: trips + accepting requests ----

export async function createTripAction(input: CreateTripInput) {
  const user = await requireUser();
  const parsed = createTripSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const trip = await createTrip(user.id, parsed.data);
  // Auto-match: alert senders of open packages already waiting on this route.
  await notifyMatchesForNewTrip(trip);
  revalidatePath("/app/travel");
  redirect(`/app/travel/trips/${trip.id}`);
}

export async function deleteTripAction(tripId: string): Promise<ActionResult> {
  const user = await requireUser();
  const deleted = await deleteTrip(tripId, user.id);
  if (!deleted) return { ok: false, error: "This trip can no longer be cancelled" };
  revalidatePath("/app/travel");
  redirect("/app/travel");
}

export async function acceptRequestAction(
  requestId: string,
  tripId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await acceptRequest(requestId, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not accept" };
  }
  revalidatePath(`/app/travel/trips/${tripId}`);
  revalidatePath("/app/travel");
  return { ok: true };
}

export async function declineRequestAction(
  requestId: string,
  tripId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const res = await declineRequest(requestId, user.id);
  if (res.ok) revalidatePath(`/app/travel/trips/${tripId}`);
  return res;
}

// ---- Traveler discovery: offer to carry a package + sender accepts/declines ----

export async function offerToCarryAction(
  tripId: string,
  packageId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const trip = await getOwnedTrip(tripId, user.id);
  if (!trip) return { ok: false, error: "Trip not found" };
  if (trip.status !== "active") return { ok: false, error: "This trip is no longer active" };
  const pkg = await getPackage(packageId);
  if (!pkg || pkg.status !== "active") return { ok: false, error: "This package is no longer available" };
  const tooHeavy = capacityError(pkg.weightKg, trip.capacityKg);
  if (tooHeavy) return { ok: false, error: tooHeavy };
  await sendRequest({
    packageId,
    tripId,
    requestedBy: user.id,
    initiatorRole: "traveler",
    amount: pkg.offerPrice,
  });
  revalidatePath(`/app/travel/trips/${tripId}/packages`);
  revalidatePath(`/app/travel/trips/${tripId}`);
  revalidatePath(`/app/packages/${packageId}`);
  return { ok: true };
}

export async function acceptOfferAction(
  requestId: string,
  packageId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await acceptOfferAsSender(requestId, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not accept" };
  }
  revalidatePackage(packageId);
  return { ok: true };
}

export async function declineOfferAction(
  requestId: string,
  packageId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const res = await declineOfferAsSender(requestId, user.id);
  if (res.ok) revalidatePackage(packageId);
  return res;
}

// ---- Notifications ----

export async function markNotificationsReadAction(): Promise<ActionResult> {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath("/app");
  revalidatePath("/app/travel");
  revalidatePath("/app/notifications");
  return { ok: true };
}

// ---- Chat ----

export async function sendMessageAction(matchId: string, body: string): Promise<ActionResult> {
  const user = await requireUser();
  const res = await sendMessage(matchId, user.id, body);
  if (!res.ok) return res;
  revalidatePath(`/app/chat/${matchId}`);
  return { ok: true };
}

export async function sendLocationAction(matchId: string, lat: number, lng: number, label: string): Promise<ActionResult> {
  const user = await requireUser();
  const res = await sendLocationMessage(matchId, user.id, lat, lng, label);
  if (!res.ok) return res;
  revalidatePath(`/app/chat/${matchId}`);
  return { ok: true };
}

// ---- KYC (user submits, admin reviews) ----

const ID_TYPES = ["aadhaar", "pan", "passport", "driving_license"];

export async function submitKycAction(input: {
  idType: string;
  idNumber: string;
  legalName: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const idType = input.idType;
  const idNumber = input.idNumber.trim();
  const legalName = input.legalName.trim();
  if (!ID_TYPES.includes(idType)) return { ok: false, error: "Pick an ID type" };
  if (idNumber.length < 4) return { ok: false, error: "Enter a valid ID number" };
  if (legalName.length < 2) return { ok: false, error: "Enter the name on your ID" };
  const res = await submitKyc(user.id, { idType, idNumber, legalName });
  if (res.ok) {
    revalidatePath("/app/verify");
    revalidatePath("/app/profile");
  }
  return res;
}

export async function approveKycAction(kycId: string): Promise<ActionResult> {
  await requireAdmin();
  const res = await approveKyc(kycId);
  if (res.ok) {
    revalidatePath("/admin/kyc");
    revalidatePath("/admin");
  }
  return res;
}

export async function rejectKycAction(kycId: string, notes?: string): Promise<ActionResult> {
  await requireAdmin();
  const res = await rejectKyc(kycId, notes);
  if (res.ok) {
    revalidatePath("/admin/kyc");
    revalidatePath("/admin");
  }
  return res;
}

// ---- Admin: user actions ----

function revalidateAdminUser(userId: string) {
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function setUserStatusAction(userId: string, status: "active" | "suspended"): Promise<ActionResult> {
  const admin = await requireAdmin();
  const res = await setUserStatus(admin.id, userId, status);
  if (res.ok) revalidateAdminUser(userId);
  return res;
}

export async function setUserRoleAction(userId: string, role: "user" | "support" | "admin"): Promise<ActionResult> {
  const admin = await requireAdmin();
  const res = await setUserStaffRole(admin.id, userId, role);
  if (res.ok) revalidateAdminUser(userId);
  return res;
}

export async function forceVerifyUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const res = await forceVerifyUser(admin.id, userId);
  if (res.ok) revalidateAdminUser(userId);
  return res;
}

export async function editUserNameAction(userId: string, name: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const res = await editUserName(admin.id, userId, name);
  if (res.ok) revalidateAdminUser(userId);
  return res;
}

// ---- Admin: match money actions (disputes / refund ops) ----

type MatchAction = "refund" | "release" | "hold" | "cancel";

export async function matchMoneyAction(matchId: string, action: MatchAction): Promise<ActionResult> {
  const admin = await requireAdmin();
  const fn = {
    refund: adminRefundMatch,
    release: adminReleaseMatch,
    hold: adminHoldMatch,
    cancel: adminCancelMatch,
  }[action];
  const res = await fn(admin.id, matchId);
  if (res.ok) {
    revalidatePath(`/admin/matches/${matchId}`);
    revalidatePath("/admin/disputes");
  }
  return res;
}

// ---- Disputes ----

type DisputeReason = "lost" | "damaged" | "wrong_otp" | "no_show" | "other";

// User side: report a problem on a match.
export async function raiseDisputeAction(
  matchId: string,
  packageId: string,
  reason: DisputeReason,
  detail: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const res = await raiseDispute(matchId, user.id, reason, detail);
  if (res.ok) revalidatePackage(packageId);
  return res;
}

// User side: the person who raised the dispute withdraws it (resumes delivery).
export async function withdrawDisputeAction(matchId: string, packageId: string): Promise<ActionResult> {
  const user = await requireUser();
  const res = await withdrawDispute(matchId, user.id);
  if (res.ok) {
    revalidatePackage(packageId);
    revalidatePath("/app/travel");
  }
  return res;
}

// Admin side: close a dispute with no money movement (restores prior state).
export async function dismissDisputeAction(matchId: string): Promise<ActionResult> {
  const staff = await requireSupport(); // support may dismiss disputes (no money moves)
  const res = await dismissDispute(staff.id, matchId);
  if (res.ok) {
    revalidatePath(`/admin/matches/${matchId}`);
    revalidatePath("/admin/disputes");
  }
  return res;
}

// ---- Manual matching (concierge) ----

export async function adminCreateMatchAction(
  packageId: string,
  tripId: string,
): Promise<{ ok: true; matchId: string } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const res = await adminCreateMatch(admin.id, packageId, tripId);
  if (res.ok) {
    revalidatePath("/admin/matching");
    revalidatePath(`/admin/matching/${packageId}`);
  }
  return res;
}

// ---- Safety reports / moderation ----

// User side: report a counterpart (abuse) or a package (prohibited items).
export async function createReportAction(
  reportedUserId: string,
  matchId: string,
  type: "user" | "prohibited",
  detail: string,
): Promise<ActionResult> {
  const user = await requireUser();
  return createReport(user.id, { reportedUserId, matchId, type, detail });
}

// Admin side: resolve a report.
export async function actionReportAction(reportId: string, action: "warn" | "suspend" | "dismiss"): Promise<ActionResult> {
  // Suspending a user is an admin power; warn/dismiss are open to support.
  const staff = action === "suspend" ? await requireAdmin() : await requireSupport();
  const res = await actionReport(staff.id, reportId, action);
  if (res.ok) revalidatePath("/admin/moderation");
  return res;
}

// ---- Support (in-app help desk) ----

// User side: send a message to support (opens a thread if needed).
export async function sendSupportMessageAction(body: string): Promise<ActionResult> {
  const user = await requireUser();
  const res = await postUserSupportMessage(user.id, body);
  if (res.ok) revalidatePath("/app/support");
  return res;
}

// Customer resolves or reopens their own support thread.
export async function setMySupportStatusAction(threadId: string, status: "open" | "closed"): Promise<ActionResult> {
  const user = await requireUser();
  const res = await setMySupportStatus(user.id, threadId, status);
  if (res.ok) revalidatePath("/app/support");
  return res;
}

// Staff side: reply to a thread from the console.
export async function replySupportAction(threadId: string, body: string): Promise<ActionResult> {
  const staff = await requireSupport();
  const res = await postStaffReply(threadId, staff.id, body);
  if (res.ok) {
    revalidatePath(`/support/${threadId}`);
    revalidatePath("/support");
  }
  return res;
}

// Staff side: close or reopen a thread.
export async function setSupportStatusAction(threadId: string, status: "open" | "closed"): Promise<ActionResult> {
  await requireSupport();
  const res = await setSupportThreadStatus(threadId, status);
  if (res.ok) {
    revalidatePath(`/support/${threadId}`);
    revalidatePath("/support");
  }
  return res;
}
