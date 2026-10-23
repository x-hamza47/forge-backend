import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../src/models/user.model.js";

const createAdmin = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/forge";
  await mongoose.connect(uri);

  const email = (process.env.ADMIN_EMAIL || "admin@forge.fitness").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "Admin12345!";

  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    user.isActive = true;
    user.password = password;
    await user.save();
    console.log(`User ${email} promoted to admin.`);
  } else {
    user = await User.create({
      name: "Forge Admin",
      username: "admin",
      email,
      password,
      role: "admin",
      isActive: true,
      consentAt: new Date(),
    });
    console.log(`Admin user created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
