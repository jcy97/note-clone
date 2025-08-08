import { Router, Request, Response } from "express";
import { Page } from "../models/Page";

export const createPageRoutes = (io: any) => {
  const pageRoutes = Router();

  pageRoutes.get("/", async (req: Request, res: Response) => {
    try {
      const pages = await Page.find().sort({ updatedAt: -1 });
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  pageRoutes.get("/:id", async (req: Request, res: Response) => {
    try {
      const page = await Page.findById(req.params.id);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching page:", error);
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  pageRoutes.post("/", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const page = new Page({
        title: title || "Untitled",
        blocks: [
          {
            id: `block-${Date.now()}`,
            type: "text",
            content: "",
            position: 0,
          },
        ],
      });
      await page.save();

      io.emit("page-created", page);

      res.status(201).json(page);
    } catch (error) {
      console.error("Error creating page:", error);
      res.status(500).json({ error: "Failed to create page" });
    }
  });

  pageRoutes.put("/:id", async (req: Request, res: Response) => {
    try {
      const page = await Page.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      io.emit("page-updated", page);

      res.json(page);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ error: "Failed to update page" });
    }
  });

  pageRoutes.delete("/:id", async (req: Request, res: Response) => {
    try {
      const page = await Page.findByIdAndDelete(req.params.id);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      io.emit("page-deleted", req.params.id);

      res.json({ success: true, message: "Page deleted successfully" });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ error: "Failed to delete page" });
    }
  });

  return pageRoutes;
};
