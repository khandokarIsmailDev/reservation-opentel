import ErrorHandler from "../middlewares/error.js";
import { Reservation } from "../models/reservation.js";



import {trace} from '@opentelemetry/api'

const send_reservation = async (req, res, next) => {

  const tracer = trace.getTracer('reservation-app');
  const span = tracer.startSpan('/api/v1/reservation/send')


  const { firstName, lastName, email, date, time, phone } = req.body;
  if (!firstName || !lastName || !email || !date || !time || !phone) {
    return next(new ErrorHandler("Please Fill Full Reservation Form!", 400));
  }

  try {
    await Reservation.create({ firstName, lastName, email, date, time, phone });
    res.status(201).json({
      success: true,
      message: "Reservation Sent Successfully!",
    });

    span.setAttribute('username', firstName)
    span.setAttribute('date',date)
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(new ErrorHandler(validationErrors.join(', '), 400));
    }

    // Handle other errors
    return next(error);
  }finally{
    span.end()
  }
};


export default send_reservation;

