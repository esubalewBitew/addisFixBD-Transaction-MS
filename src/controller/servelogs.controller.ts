import { Request, Response, NextFunction } from "express";
import path from "node:path";
import fs from "node:fs/promises";

const listFiles = async (req: Request, res: Response) => {
  const LOGS_DIR = path.resolve(__dirname, "../../logs");
  try {
    try {
      await fs.access(LOGS_DIR);
    } catch {
      return res.status(500).json({
        success: false,
        error: true,
        message: "Logs directory does not exist",
      });
    }
    const files = await fs.readdir(LOGS_DIR);

    const logFiles = files
      .filter((file) => file.endsWith(".log"))
      .map((file) => file.replace(/\.log$/, ""))
      .reverse();

    res.json({
      success: true,
      error: false,
      message: "Logs fetched successfully",
      data: logFiles,
    });
  } catch (error) {
    console.error("Error listing log files:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Unable to list log files. Please try again later.",
    });
  }
};

const serveLogFile = async (req: Request, res: Response) => {
  const { fileName } = req.params;
  const LOGS_DIR = path.join(__dirname, "../../logs");

  try {
    if (!fileName || /[<>:"/\\|?*\x00-\x1F]/.test(fileName)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid file name",
        data: null,
      });
    }

    const filePath = path.join(LOGS_DIR, `${fileName}.log`);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: true,
        message: "File Not Found",
        data: null,
      });
    }

    res.download(filePath, `${fileName}.log`, (err) => {
      if (err) {
        console.error("Error sending file:", err.message);
        res.status(500).json({
          success: false,
          error: true,
          message: "Error serving the file",
          data: null,
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
      data: null,
    });
  }
};

export default {
  listFiles,
  serveLogFile,
};
