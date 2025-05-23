require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Twilio Setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ✅ MongoDB Schema
const appointmentSchema = new mongoose.Schema({
    name: String,
    contact: String,
    email: String,
    date: String,
    time: String,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

// ✅ Email Function
async function sendEmail(patientEmail, patientDetails) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const emailContent = `
            <h2>Appointment Details</h2>
            <table border="1" cellspacing="0" cellpadding="10">
                <tr><th>Field</th><th>Details</th></tr>
                <tr><td><b>Name</b></td><td>${patientDetails.name}</td></tr>
                <tr><td><b>Contact Number</b></td><td>${patientDetails.contact}</td></tr>
                <tr><td><b>Email</b></td><td>${patientDetails.email}</td></tr>
                <tr><td><b>Appointment Date</b></td><td>${patientDetails.date}</td></tr>
                <tr><td><b>Appointment Time</b></td><td>${patientDetails.time}</td></tr>
            </table>
        `;

        // Email to Patient
        const mailOptionsForPatient = {
            from: process.env.EMAIL_USER,
            to: patientEmail,
            subject: "Appointment Confirmation - Wafgaonkar Hospital",
            html: `<p>Dear ${patientDetails.name},</p>
                   <p>Your appointment has been booked successfully.</p>
                   ${emailContent}
                   <p>Thank you!</p>`,
        };

        // Email to Admin
        const mailOptionsForAdmin = {
            from: process.env.EMAIL_USER,
            to: "atharvawafgaonkar27@gmail.com",
            subject: "New Appointment Received",
            html: `<p>A new appointment has been booked with the following details:</p>
                   ${emailContent}
                   <p>Please check the appointment records.</p>`,
        };

        await transporter.sendMail(mailOptionsForPatient);
        await transporter.sendMail(mailOptionsForAdmin);
        console.log("✅ Emails sent successfully!");

    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}

// ✅ WhatsApp Message Function via Twilio
async function sendWhatsApp(contactNumber, messageBody) {
    try {
        await twilioClient.messages.create({
            body: messageBody,
            from: "whatsapp:+14155238886", // Twilio Sandbox WhatsApp Number
            to: `whatsapp:+91${contactNumber}` // User's WhatsApp number
        });
        console.log("✅ WhatsApp message sent successfully!");
    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", error.message);
    }
}

// ✅ Appointment Booking Route
app.post("/book-appointment", async (req, res) => {
    try {
        const { name, contact, email, date, time } = req.body;
        const newAppointment = new Appointment({ name, contact, email, date, time });
        await newAppointment.save();

        // Send email
        await sendEmail(email, { name, contact, email, date, time });

        // Send WhatsApp message
        const message = `Hi ${name}, your appointment at Wafgaonkar Hospital is confirmed for ${date} at ${time}.`;
        await sendWhatsApp(contact, message);

        res.status(201).json({ message: "Appointment booked successfully!" });
    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: "Server Error", details: error.message });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
