import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config";
import v1Routes from "./routes/v1";
import { errorMiddleware } from "./middleware/error.middleware";
import { errorResponse } from "./util/response";
import ingestRoute from "./routes/ingest.route";
import { apiRateLimitConfig } from "./middleware/rateLimit";
import helmet from "helmet";
import compression from "compression";

const app = express();


// 1. Helmet - Secure HTTP Headers (MUST BE FIRST)
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],  // Inline styles for Tailwind/CSS frameworks
        scriptSrc: ["'self'"],                    // Only your domain (Cloudflare proxies transparently)
        imgSrc: ["'self'", "data:", "https:"],    // S3 images + base64
        // connectSrc: [
        //   "'self'",
        //   "https://api.stripe.com",               // Stripe API
        //   "https://replicate.com",                // Replicate AI API
        //   config.env === 'development' 
        //     ? 'http://localhost:3000'             // Local frontend
        //     : config.frontendUrl,                 // Production frontend
        // ],
        fontSrc: ["'self'", "data:"],             // Your fonts (Cloudflare caches them)
        frameSrc: ["'self'"],                     // No external iframes
        objectSrc: ["'none'"],                    // Block plugins
        upgradeInsecureRequests: [],              // Force HTTPS
      },
    },
    crossOriginEmbedderPolicy: false,             // Allow S3 images
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow Cloudflare proxy
  }));
  

// 2. Compression - Compress responses
app.use(compression());

app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "stripe-signature"],
}))


// stripe middleware

app.post('/api/v1/payment/webhook/stripe', express.raw({type: 'application/json'}) , async(req, res, next)=> {

    try {
        // TODO : Implement the stripe webhook
        const  { handleStripeWebhook } = await import("./controllers/payment.controller");
        await handleStripeWebhook(req, res);
    } catch (error) {
        next(error);
    }
})
// sharp - image processing`

// 4. Body parsing (after webhook route)
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());



app.get('/health', apiRateLimitConfig.general, (req, res, next) => {
    res.json({
        status: "ok",
        timeStamp: new Date().toISOString(),
        message: "Backend is running with PM2 Process Manager and Node.js version 24.x 😍",
        frontendUrl: config.frontendUrl,
        env: config.env,
    })
})

// TODO: Routes 
app.use('/api/v1', v1Routes);
app.use('/api/inngest', ingestRoute)


// 404 Route

app.use((req, res) => {
    return errorResponse(res, "Route not found", 404, [{ path: req.originalUrl, message: "Route not found" }]);
})

// Error handling middleware
app.use(errorMiddleware);

export default app;