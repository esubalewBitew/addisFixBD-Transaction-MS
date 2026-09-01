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

export type JobPaymentTotals = {
  pending: number;
  paid: number;
  pendingItems: PendingPaymentItem[];
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
    return { pending: 0, paid: 0, pendingItems: [] };
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

  const downPaid = isDownPaymentPaid(job, txn);
  const finalPaid = isFinalPaymentPaid(job, txn);

  if (downAmount > 0) {
    if (downPaid) {
      paid += downAmount;
    } else {
      pending += downAmount;
      pendingItems.push({
        paymentType: "downPayment",
        amountDue: downAmount,
      });
    }
  }

  const downSatisfied = downAmount === 0 || downPaid;
  let finalDue = 0;

  if (remainingAmount > 0) {
    finalDue = remainingAmount;
  } else if (priceAmount > 0) {
    finalDue = downAmount > 0 && downPaid ? Math.max(priceAmount - downAmount, 0) : priceAmount;
  }

  if (finalDue <= 0 && toNumber(txn?.amount) > 0) {
    finalDue = toNumber(txn?.amount);
  }

  if (downSatisfied && finalDue > 0) {
    if (finalPaid) {
      paid += finalDue;
    } else {
      pending += finalDue;
      pendingItems.push({
        paymentType: "finalPayment",
        amountDue: finalDue,
      });
    }
  }

  if (additionalAmount > 0 && !finalPaid) {
    pending += additionalAmount;
  } else if (additionalAmount > 0 && finalPaid) {
    paid += additionalAmount;
  }

  return { pending, paid, pendingItems };
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
