import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import reservationRouter from "./routes/reservationRoute.js";
import { dbConnection } from "./database/dbConnection.js";
import {trace} from '@opentelemetry/api';
import sdk from './tracing.js';



// Function to add tracing to the reservation router middleware
const addTracingRouter = (router) => {
  return (req,res,next)=>{
    //get the tracer
    const tracer = trace.getTracer('reservation-app');

    //get the span
    const span = tracer.startSpan('send_reservation');

    try{
      next()
    }catch(error){
      span.recordException(error)
    }finally{
      // end span after the response is snd
      
        span.end()
    }
  }
}


const app = express();
dotenv.config({ path: "./config.env" });

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["POST"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/reservation", reservationRouter);
app.get("/", (req, res, next)=>{return res.status(200).json({
  success: true,
  message: "HELLO WORLD AGAIN"
})})

dbConnection();

app.use(errorMiddleware);

export default app;
