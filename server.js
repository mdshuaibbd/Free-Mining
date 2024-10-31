// মডিউলগুলি ইম্পোর্ট করুন
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const DOMPurify = require('dompurify');
require('dotenv').config();

// অ্যাপ তৈরি করুন
const app = express();
const PORT = 5000;

// Middleware ব্যবহার করুন
app.use(bodyParser.json());
app.use(express.static('public')); // public ফোল্ডার থেকে স্ট্যাটিক ফাইল সার্ভ করার জন্য
app.use(cors({
    origin: 'https://your-allowed-origin.com', // অনুমোদিত ডোমেইন যুক্ত করুন
    methods: ['GET', 'POST'],
}));

// MongoDB এর সাথে সংযোগ করুন
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the application
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // .env ফাইলে রাখুন

// Middleware to authenticate user
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

// ইউজার স্কিমা তৈরি করুন
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    points: { type: Number, default: 0 },
});

// ইউজার মডেল তৈরি করুন
const User = mongoose.model('User', userSchema);

// Validate username
const isValidUsername = (username) => {
    // Simple regex to check if username is alphanumeric
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
};

// ইউজার পয়েন্ট আপডেট করার জন্য এন্ডপয়েন্ট
app.post('/update-points', authenticateJWT, async (req, res) => {
    try {
        const { username } = req.user;

        if (!isValidUsername(username)) {
            return res.status(400).json({ message: 'Invalid username.' }); // Bad request
        }

        // ইউজারকে খুঁজে বের করুন
        let user = await User.findOne({ username: username });

        if (user) {
            user.points += 1; // পয়েন্ট ১ বাড়ান (আপনি আপনার প্রয়োজন অনুসারে পরিবর্তন করতে পারেন)
            await user.save();
            res.json({ points: user.points }); // ইউজারের নতুন পয়েন্ট পাঠান
        } else {
            // ইউজার যদি না পাওয়া যায় তবে নতুন ইউজার তৈরি করুন
            user = new User({ username: username, points: 1 });
            await user.save();
            res.json({ points: user.points });
        }
    } catch (error) {
        console.error('Error updating points:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// হোম রুট
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // আপনার HTML ফাইল পাঠান
});

// সার্ভার চালু করুন
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
