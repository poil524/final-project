// Importing required libraries and modules
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import userRoutes from './api/routes/userRoutes.js';
import testRoutes from './api/routes/testRoutes.js';
// Set up mongoose
mongoose.Promise = global.Promise;

// Create an Express app instance
const app = express();

// Connect to MongoDB database, set the port
mongoose.connect('mongodb://localhost/final-project');
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
    next();
});


//app.use("/api/users", userRoutes);
app.use('/api/tests', testRoutes);

app.get('/api/test-check', (req, res) => {
    res.json({ message: 'Proxy works!' });
});


// Handle undefined routes
app.use((req, res) => {
    res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
