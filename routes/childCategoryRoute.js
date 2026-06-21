// routes/childCategoryRoutes.js
import express from "express";
import {
  createChildCategory,
  getChildCategories,
  updateChildCategory,
  deleteChildCategory,
  toggleFollowAuthor
} from "../controllers/childCategoryController.js";

const router = express.Router();

router.post("/", createChildCategory);
router.get("/", getChildCategories);
router.put("/:id", updateChildCategory);
router.delete("/:id", deleteChildCategory);
router.patch("/:id/follow", toggleFollowAuthor);

export default router;
