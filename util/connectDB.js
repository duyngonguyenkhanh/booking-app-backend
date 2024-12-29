const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(
            'mongodb+srv://duyngonguyenkhanh:reyt3clSrRT1l5iI@cluster0.mqoq6.mongodb.net/bookingapp',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
        console.log('MongoDB connected');
    } catch (error) {
        console.log('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
