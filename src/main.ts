import "./instrument"; // Must be first import
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  // Listen on all interfaces
  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");

  console.log(`Application running on port ${port} (${process.env.NODE_ENV === 'production' ? 'production' : 'development'})`);
}

bootstrap();
