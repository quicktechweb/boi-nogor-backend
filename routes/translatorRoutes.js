import express from "express";
import {
  getTranslators,
  addTranslator,
  updateTranslator,
  deleteTranslator,
} from "../controllers/translatorController.js";

const router = express.Router();

router.get("/", getTranslators);
router.post("/", addTranslator);
router.put("/:id", updateTranslator);
router.delete("/:id", deleteTranslator);

export default router;