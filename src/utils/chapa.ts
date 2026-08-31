import makeRequest from "./axiosClient";
import Transaction from "../models/transaction.model";
import Jobs from "../models/jobs.model";
import config from "../config";

export function getChapaSecret(): string {
  return (
    process.env.CHAPA_SECRET_KEY?.replace(/^['"]|['"]$/g, "") ||
    "CHASECK-EgmFAPq28jE6uDTUQrxleAPs1ffy907H"
  );
}

export function getMiniAppUrl(): string {
  return (
    process.env.MINI_APP_URL?.trim() ||
    process.env.CHAPA_RETURN_URL_BASE?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getChapaCallbackUrl(): string {
  const configured = process.env.CHAPA_CALLBACK_URL?.trim();
  if (configured) return configured;

  const baseUrl = (process.env.BASE_URL || config._VALS.baseURL || "http://localhost:3006").replace(
    /\/$/,
    ""
  );
  return `${baseUrl}/addisfix/transaction/chapa/callback`;
}

export function buildChapaTxRef(
  transactionId: string,
  paymentType: "downPayment" | "finalPayment"
): string {
  const prefix = paymentType === "downPayment" ? "DP" : "FP";
  return `${prefix}-${transactionId}-${Date.now()}`;
}

export function resolvePaymentEmail(user: any, transaction: any): string {
  const email =
    user?.email ||
    transaction?.debitAccountHolderName ||
    transaction?.phoneNumber ||
    user?.phoneNumber;

  if (email && String(email).includes("@")) {
    return String(email);
  }

  const phone = String(user?.phoneNumber || transaction?.phoneNumber || "customer").replace(
    /\D/g,
    ""
  );
  return `pay-${phone || "customer"}@addisfix.local`;
}

export async function verifyWithChapa(txRef: string) {
  const chapaSecret = getChapaSecret();
  if (!chapaSecret) return undefined;

  return makeRequest(
    "https://api.chapa.co",
    `/v1/transaction/verify/${encodeURIComponent(txRef)}`,
    "get",
    undefined,
    chapaSecret
  );
}

export async function findTransactionByTxRef(txRef: string) {
  return Transaction.findOne({
    $or: [{ transactionIDForDownPayment: txRef }, { transactionID: txRef }],
  });
}

export function resolvePaymentTypeFromTxRef(
  transaction: any,
  txRef: string
): "downPayment" | "finalPayment" {
  if (transaction.transactionIDForDownPayment === txRef) {
    return "downPayment";
  }
  if (transaction.transactionID === txRef) {
    return "finalPayment";
  }

  return transaction.paymentType === "downPayment" ? "downPayment" : "finalPayment";
}

export async function applyVerifiedChapaStatus(
  transaction: any,
  paymentType: "downPayment" | "finalPayment",
  chapaStatus: string
) {
  const isSuccess = chapaStatus === "success";
  const isPending = chapaStatus === "pending" || chapaStatus === "processing";

  if (paymentType === "downPayment") {
    if (isSuccess) {
      transaction.transactionStatusForDownPayment = "completed";
      transaction.isPaidForDownPayment = true;
      transaction.isFailedForDownPayment = false;
      transaction.paidAt = new Date();
    } else if (!isPending) {
      transaction.transactionStatusForDownPayment = "failed";
      transaction.isPaidForDownPayment = false;
      transaction.isFailedForDownPayment = true;
    } else {
      transaction.transactionStatusForDownPayment = "processing";
    }
  } else if (isSuccess) {
    transaction.transactionStatus = "completed";
    transaction.isPaid = true;
    transaction.isFailed = false;
    transaction.paidAt = new Date();
  } else if (!isPending) {
    transaction.transactionStatus = "failed";
    transaction.isPaid = false;
    transaction.isFailed = true;
  } else {
    transaction.transactionStatus = "processing";
  }

  await transaction.save();

  if (isSuccess && transaction.jobId) {
    await syncJobPaymentStatus(String(transaction.jobId), paymentType, isSuccess);
  }

  return transaction;
}

export async function syncJobPaymentStatus(
  jobId: string,
  paymentType: "downPayment" | "finalPayment",
  isSuccess: boolean
) {
  if (!isSuccess) return;

  const jobPaymentStatus = paymentType === "downPayment" ? "half" : "Completed";

  await Jobs.findByIdAndUpdate(jobId, {
    jobPaymentStatus,
    jobUpdatedAt: new Date(),
  });
}

export function extractCallbackTxRef(reqBody: any, reqQuery: any): string | undefined {
  const payload = { ...reqBody, ...reqQuery };
  return payload.trx_ref || payload.tx_ref || payload.txRef;
}
