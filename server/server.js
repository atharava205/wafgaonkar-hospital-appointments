require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const AppointmentSchema = new mongoose.Schema({
    name: String,
    contact: String,
    email: String,
    datetime: String
});
const Appointment = mongoose.model("Appointment", AppointmentSchema);

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// API to Handle Appointment Booking
app.post("/book-appointment", async (req, res) => {
    try {
        const { name, contact, email, datetime } = req.body;
        const newAppointment = new Appointment({ name, contact, email, datetime });
        await newAppointment.save();

        // Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "atharvawafgaonkar27@gmail.com",
            subject: "New Appointment Booking",
            text: `New appointment booked:\n\nName: ${name}\nContact: ${contact}\nEmail: ${email}\nDate & Time: ${datetime}`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "Appointment booked successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error booking appointment", error });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
