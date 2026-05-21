import mongoose from "mongoose";

const SocialLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true },
  color: { type: String, required: true },
  icon: { type: String, required: true },
});

const ContactItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  icon: { type: String, required: true },
  lines: [{ type: String }],
});

const FooterSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, required: true },
    contacts: [ContactItemSchema],
    socialLinks: [SocialLinkSchema],
    address: {
      line1: { type: String },
      line2: { type: String },
    },
    adminEmail: { type: String },
    copyrightText: { type: String },
  },
  { timestamps: true, collection: "Footer" } // 👈 এটাই fix
);

export default mongoose.model("Footer", FooterSchema);
