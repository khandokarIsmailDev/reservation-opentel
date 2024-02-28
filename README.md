

# Use Technologies

- express js ( node js )
- react js
- opentel tracing span

for frontend we use react and for backend use express js, 


# File Folder Structure

```
MERN_STACK_RESTAURANT_REPOSITORY
├── backend
│   ├── controller
│   ├── database
│   ├── middlewares
│   ├── models
│   ├── node_modules
│   ├── routes
│   ├── app.js
│   ├── config.env
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── tracing.js
│   └── vercel.json
├── frontend
│   ├── node_modules
│   ├── public
│   ├── SRC
│   │   ├── .eslintrc.cjs
│   │   ├── .gitignore
│   │   ├── index.html
│   │   ├── package-lock.json
│   │   └── package.json
│   └── README.md
└── vite.config.js
```


# setup  opentel in backend

opentel work in every api calling end point. First we have to create a basic express js app or if we have already a express js app, thats fine . but now we work with our existing project

 we have to install for some packages to explore opentel. 

```js
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

then we have to create a `tracing.js` file , please remember tracing file is already created by opentel, so we don't need to create it manually. (obviously its boring). `tracing.js ` file locate in root folder, (where `pckage.json` locate)

```js tracing.js
// tracing.mjs

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
  

//exporter

const traceExporter = new JaegerExporter({
endpoint: "http://localhost:14268/api/traces",
serviceName: "Reservation-app",
});

//provider
const sdk = new NodeSDK({
traceExporter,
instrumentations: [getNodeAutoInstrumentations()],
resource: new Resource({
[SemanticResourceAttributes.SERVICE_NAME]: "reservation-mern",
}),
});

try {
sdk.start();
console.log("Tracing initialized");
} catch (error) {
console.log("Error initializing tracing", error);
}

export default sdk;
```

now we have to understand what does `tracing.js` file code mean?

- first we import all necessary packages
-  we have to create a provider. provider helps to create span
-  and we need a exporter to show our all span details , so now install jaeger ui to show our all span details `npm install @opentelemetry/exporter-jaeger`


# Provider 

we know provider helps to create span, if we breackdown provider then we see our provider need some info, like 

1) **`instrumentations`** - Instrumentation in OpenTelemetry refers to the process of adding code to your application to capture telemetry data, such as traces, metrics, and logs, for observability purposes. OpenTelemetry provides instrumentation libraries for various languages and frameworks, which allow developers to easily instrument their applications without having to manually add instrumentation code for each telemetry type. 
2) **`resource`**: This field specifies the resource associated with the application. In OpenTelemetry, a resource represents the entity being monitored (e.g., a service, a host, a process). The `Resource` constructor initializes a new resource with attributes. In this case, the attribute `[SemanticResourceAttributes.SERVICE_NAME]` is set to `"reservation-mern"`, indicating that the service being monitored is named "reservation-mern".
3) **`traceExporter`** : We have already discus. this is our jaeger exporter, our all span detail show here.

Finally we called `sdk.start();` , typically it refers to the action of starting the SDK's telemetry data collection and export processes. When you call `sdk.start()`, you're essentially initializing the components necessary for tracing, metrics, and logging, and activating their respective exporters to send this telemetry data to the configured backend systems for storage, analysis, and visualization



# Import `tracing.js` file in our root file (app.js)

after completing `tracing.js` file, then we have to configure or connect it with project root file like `app.js` 
`import {trace} from '@opentelemetry/api';`

```js app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import reservationRouter from "./routes/reservationRoute.js";
import { dbConnection } from "./database/dbConnection.js";
import {trace} from '@opentelemetry/api';
import sdk from './tracing.js';

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
```


##### `import sdk from './tracing.js';`

Importing `sdk` from `./tracing.js` allows your current JavaScript file to access and utilize the functionalities defined in `tracing.js`


now we need to create a span, so now we find the api end point, our project has only one api `reservation` so we have to create span in `./controler/reservation.js`

```js reservation.js
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
```

- in this file we import `trace` from `@opentelemetry/api` 
- **`const tracer = trace.getTracer('reservation-app');`**: This line is retrieving a tracer object named `tracer` using a function called `getTracer`
- **`const span = tracer.startSpan('/api/v1/reservation/send');`**: This line creates a new span using the `startSpan` method of the `tracer` object. Spans represent a single operation or activity within your code
- finally we have to end span `span.end()`


now all is done, `npm run dev` our application start port at 4000; 

# Jaeger Setup 

our opentel data already available in Jaeger. now we need install `docker` to run Jaeger. after install docker please run this code in your terminal

```js
docker run -d --name jaeger \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 14250:14250 \
  -p 9411:9411 \
  jaegertracing/all-in-one:1.24
```

`http://localhost:16686/` browse this link open Jaeger ui. 

NOTE: please remember our exporter port must be presents here .

`tracing.js` 
```js tracing.js
//exporter
const traceExporter = new JaegerExporter({
endpoint: "http://localhost:14268/api/traces",
serviceName: "Reservation-app",
});
```


