import { Module } from "@nestjs/common";
import { MockWeatherProvider } from "../../providers/weather/mock-weather-provider";
import { WeatherService } from "./weather.service";

@Module({
  providers: [MockWeatherProvider, WeatherService],
  exports: [MockWeatherProvider, WeatherService]
})
export class WeatherModule {}
