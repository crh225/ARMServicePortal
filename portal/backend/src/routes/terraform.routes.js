import express from "express";
import { generateTerraformCode } from "../controllers/terraform.controller.js";

const router = express.Router();

/**
 * @route   POST /api/terraform/generate
 * @desc    Generate Terraform code for an Azure resource
 * @access  Public
 */
router.post("/generate", generateTerraformCode);

/**
 * @route   GET /api/terraform/generate
 * @desc    Generate Terraform code for an Azure resource
 * @access  Public
 */
router.get("/generate", generateTerraformCode);

export default router;
