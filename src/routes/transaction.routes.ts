import { Router } from "express";
import { TransactionController } from "../controller/transaction.controller";

const router = Router();

// Transaction CRUD operations
router.post("/create-transaction", TransactionController.createTransaction);
router.put("/confirm-transaction", TransactionController.confirmTransaction);
router.get("/get-transactions", TransactionController.getTransactions);
router.get("/get-transaction-by-id", TransactionController.getTransactionById);
router.put("/update-transaction", TransactionController.updateTransaction);
router.delete("/delete-transaction", TransactionController.deleteTransaction);

// Transaction status operations
router.patch("/:id/mark-paid", TransactionController.markAsPaid);

// Financial reporting
router.get("/reports/summary", TransactionController.getFinancialSummary);

// Job-related transactions
router.get("/job/:jobId", TransactionController.getTransactionsByJob);

// Technician-related transactions
router.get("/technician/:technicianId", TransactionController.getTransactionsByTechnician);

export default router; 