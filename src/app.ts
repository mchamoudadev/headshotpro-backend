import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config";
import v1Routes from "./routes/v1";
import { errorMiddleware } from "./middleware/error.middleware";
import { errorResponse } from "./util/response";


const app = express();


// express middleware

// cors middleware


app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "stripe-signature"],
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.get('/health', (req, res) => {
    res.json({
        status: "ok",
        timeStamp: new Date().toISOString(),
    })
})

// TODO: Routes 
app.use('/api/v1', v1Routes);
// TODO: 404 Route

app.use((req, res) => {
    return errorResponse(res, "Route not found", 404, [{ path: req.originalUrl, message: "Route not found" }]);
})

// Error handling middleware
app.use(errorMiddleware);

export default app;