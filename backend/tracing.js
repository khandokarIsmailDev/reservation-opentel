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
