
import mongoose from 'mongoose';

const dbUrl = process.env.DB_URL || '';


const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl).then((data:any) => {
            console.log(`Connected to MongoDB: ${data.connection.host}`);
        })
        
    } catch (error) {
        console.log('Error connecting to MongoDB', error);
        setTimeout(connectDB, 5000);
    }
}

export default connectDB;