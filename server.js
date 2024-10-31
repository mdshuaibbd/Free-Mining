const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const DOMPurify = require('dompurify');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware ব্যবহার করুন
app.use(bodyParser.json());
app.use(express.static('public')); 
app.use(cors({
    origin: 'https://free-mining-git-master-shuaib017s-projects.vercel.app', 
    methods: ['GET', 'POST'],
}));

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); 
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); 
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); 
    }
};

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    points: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

const isValidUsername = (username) => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
};

app.post('/update-points', authenticateJWT, async (req, res) => {
    try {
        const { username } = req.user;

        if (!isValidUsername(username)) {
            return res.status(400).json({ message: 'Invalid username.' });
        }

        let user = await User.findOne({ username: username });

        if (user) {
            user.points += 1; 
            await user.save();
            res.json({ points: user.points }); 
        } else {
            user = new User({ username: username, points: 1 });
            await user.save();
            res.json({ points: user.points });
        }
    } catch (error) {
        console.error('Error updating points:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); 
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
