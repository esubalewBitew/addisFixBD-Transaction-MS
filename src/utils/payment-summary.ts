type JobLike = {
  _id?: unknown;
  jobPrice?: string | number | null;
  jobDownPayment?: string | number | null;
  jobRemainingAmount?: string | number | null;
  jobAdditionalCharges?: string | number | null;
  jobPaymentStatus?: string | null;
  jobStatus?: string | null;
};

type TransactionLike = {
  _id?: unknown;
  jobId?: unknown;
  amountForDownPayment?: number | null;
  amount?: number | null;
  isPaidForDownPayment?: boolean | null;
  isPaid?: boolean | null;
  transactionStatusForDownPayment?: string | null;
  transactionStatus?: string | null;
} | null;

export type PendingPaymentItem = {
  paymentType: "downPayment" | "finalPayment";
  amountDue: number;
};

export type PaidPaymentItem = {
  paymentType: "downPayment" | "finalPayment";
  amountPaid: number;
};

export type JobPaymentTotals = {
  pending: number;
  paid: number;
  pendingItems: PendingPaymentItem[];
  paidItems: PaidPaymentItem[];
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isCancelled = (job: JobLike): boolean =>
  String(job.jobStatus || "").toLowerCase() === "cancelled";

const paymentStatus = (job: JobLike): string =>
  String(job.jobPaymentStatus || "Pending").toLowerCase();

export const isDownPaymentPaid = (
  job: JobLike,
  txn: TransactionLike
): boolean => {
  const status = paymentStatus(job);
  return (
    txn?.isPaidForDownPayment === true ||
    status === "half" ||
    status === "completed"
  );
};

export const isFinalPaymentPaid = (
  job: JobLike,
  txn: TransactionLike
): boolean => {
  const status = paymentStatus(job);
  return txn?.isPaid === true || status === "completed";
};

export const computeJobPaymentTotals = (
  job: JobLike,
  txn: TransactionLike = null
): JobPaymentTotals => {
  if (isCancelled(job)) {
    return { pending: 0, paid: 0, pendingItems: [], paidItems: [] };
  }

  const downAmount = Math.max(
    toNumber(txn?.amountForDownPayment),
    toNumber(job.jobDownPayment)
  );
  const priceAmount = toNumber(job.jobPrice);
  const remainingAmount = toNumber(job.jobRemainingAmount);
  const additionalAmount = toNumber(job.jobAdditionalCharges);

  let pending = 0;
  let paid = 0;
  const pendingItems: PendingPaymentItem[] = [];
  const paidItems: PaidPaymentItem[] = [];

  const downPaid = isDownPaymentPaid(job, txn);
  const finalPaid = isFinalPaymentPaid(job, txn);
  const status = paymentStatus(job);
  const fullyPaid = status === "completed" || status === "paid";

  if (downAmount > 0) {
    if (downPaid || fullyPaid) {
      paid += downAmount;
      paidItems.push({
        paymentType: "downPayment",
        amountPaid: downAmount,
      });
    } else {
      pending += downAmount;
      pendingItems.push({
        paymentType: "downPayment",
        amountDue: downAmount,
      });
    }
  }

  const downSatisfied = downAmount === 0 || downPaid || fullyPaid;
  let finalDue = 0;

  if (remainingAmount > 0) {
    finalDue = remainingAmount;
  } else if (priceAmount > 0) {
    finalDue =
      downAmount > 0 && (downPaid || fullyPaid)
        ? Math.max(priceAmount - downAmount, 0)
        : priceAmount;
  }

  if (
    finalDue <= 0 &&
    toNumber(txn?.amount) > 0 &&
    (priceAmount > 0 || remainingAmount > 0 || txn?.isPaid)
  ) {
    finalDue = toNumber(txn?.amount);
  }

  if (downSatisfied && finalDue > 0) {
    if (finalPaid || fullyPaid) {
      paid += finalDue;
      paidItems.push({
        paymentType: "finalPayment",
        amountPaid: finalDue,
      });
    } else {
      pending += finalDue;
      pendingItems.push({
        paymentType: "finalPayment",
        amountDue: finalDue,
      });
    }
  }

  if (additionalAmount > 0 && !(finalPaid || fullyPaid)) {
    pending += additionalAmount;
  } else if (additionalAmount > 0 && (finalPaid || fullyPaid)) {
    paid += additionalAmount;
  }

  return { pending, paid, pendingItems, paidItems };
};

export const buildPendingPaymentsFromJobs = (
  jobs: JobLike[],
  transactions: TransactionLike[] = []
): Array<{
  job: JobLike;
  paymentType: "downPayment" | "finalPayment";
  amountDue: number;
  transaction: TransactionLike;
}> => {
  const txnByJobId = new Map<string, NonNullable<TransactionLike>>();

  for (const txn of transactions) {
    if (!txn?.jobId) continue;
    txnByJobId.set(String(txn.jobId), txn);
  }

  const results: Array<{
    job: JobLike;
    paymentType: "downPayment" | "finalPayment";
    amountDue: number;
    transaction: TransactionLike;
  }> = [];

  for (const job of jobs) {
    const txn = txnByJobId.get(String(job._id)) || null;
    const totals = computeJobPaymentTotals(job, txn);

    for (const item of totals.pendingItems) {
      results.push({
        job,
        paymentType: item.paymentType,
        amountDue: item.amountDue,
        transaction: txn,
      });
    }
  }

  return results;
};

export const buildPaidPaymentsFromJobs = (
  jobs: JobLike[],
  transactions: TransactionLike[] = []
): Array<{
  job: JobLike;
  paymentType: "downPayment" | "finalPayment";
  amountPaid: number;
  transaction: TransactionLike;
  paidAt?: Date | string | null;
}> => {
  const txnByJobId = new Map<string, NonNullable<TransactionLike>>();

  for (const txn of transactions) {
    if (!txn?.jobId) continue;
    txnByJobId.set(String(txn.jobId), txn);
  }

  const results: Array<{
    job: JobLike;
    paymentType: "downPayment" | "finalPayment";
    amountPaid: number;
    transaction: TransactionLike;
    paidAt?: Date | string | null;
  }> = [];

  for (const job of jobs) {
    const txn = txnByJobId.get(String(job._id)) || null;

    // Prefer explicit transaction paid flags for accurate history
    const downPaidAmount = toNumber(txn?.amountForDownPayment);
    if (txn?.isPaidForDownPayment && downPaidAmount > 0) {
      results.push({
        job,
        paymentType: "downPayment",
        amountPaid: downPaidAmount,
        transaction: txn,
        paidAt: (txn as any)?.paidAt || (txn as any)?.updatedAt || null,
      });
    }

    const finalPaidAmount = toNumber(txn?.amount);
    if (txn?.isPaid && finalPaidAmount > 0) {
      results.push({
        job,
        paymentType: "finalPayment",
        amountPaid: finalPaidAmount,
        transaction: txn,
        paidAt: (txn as any)?.paidAt || (txn as any)?.updatedAt || null,
      });
    }

    // Fallback: job marked paid/half with admin-set amounts but incomplete txn flags
    if (!txn?.isPaidForDownPayment && !txn?.isPaid) {
      const totals = computeJobPaymentTotals(job, txn);
      for (const item of totals.paidItems) {
        results.push({
          job,
          paymentType: item.paymentType,
          amountPaid: item.amountPaid,
          transaction: txn,
          paidAt: (job as any)?.jobUpdatedAt || null,
        });
      }
    }
  }

  return results.sort((a, b) => {
    const aTime = a.paidAt ? new Date(a.paidAt).getTime() : 0;
    const bTime = b.paidAt ? new Date(b.paidAt).getTime() : 0;
    return bTime - aTime;
  });
};