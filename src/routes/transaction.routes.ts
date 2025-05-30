import { Router } from "express";
import { TransactionController } from "../controller/transaction.controller";

const router = Router();

// Transaction CRUD operations
router.post("/", TransactionController.createTransaction);
router.get("/", TransactionController.getTransactions);
router.get("/:id", TransactionController.getTransactionById);
router.put("/:id", TransactionController.updateTransaction);
router.delete("/:id", TransactionController.deleteTransaction);

// Transaction status operations
router.patch("/:id/mark-paid", TransactionController.markAsPaid);

// Financial reporting
router.get("/reports/summary", TransactionController.getFinancialSummary);

// Job-related transactions
router.get("/job/:jobId", TransactionController.getTransactionsByJob);

// Technician-related transactions
router.get("/technician/:technicianId", TransactionController.getTransactionsByTechnician);

export default router; 