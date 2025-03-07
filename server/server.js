const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define Schema & Model for Appointments
const appointmentSchema = new mongoose.Schema({
  name: String,
  contact: String,
  email: String,
  dateTime: String,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API Route to Handle Appointments
app.post("/book-appointment", async (req, res) => {
  const { name, contact, email, dateTime } = req.body;

  if (!name || !contact || !email || !dateTime) {
    return res.status(400).send("All fields are required.");
  }

  try {
    // Save appointment to MongoDB
    const newAppointment = new Appointment({ name, contact, email, dateTime });
    await newAppointment.save();

    // Send Email Notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email, // Send confirmation to patient
      subject: "Appointment Confirmation - Wafgaonkar Hospital",
      text: `Hello ${name},\n\nYour appointment has been booked successfully!\nDate & Time: ${dateTime}\n\nThank you,\nWafgaonkar Hospital`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Email Sending Error:", error);
      } else {
        console.log("📩 Email Sent:", info.response);
      }
    });

    res.status(201).send("✅ Appointment booked successfully!");
  } catch (error) {
    console.error("❌ Error saving appointment:", error);
    res.status(500).send("❌ Server error, please try again later.");
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
