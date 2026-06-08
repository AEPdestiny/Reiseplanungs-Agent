import { Module } from "@nestjs/common";
import { MockWeatherProvider } from "../../providers/weather/mock-weather-provider";
import { OpenMeteoWeatherProvider } from "./providers/open-meteo-weather.provider";
import { WeatherService } from "./weather.service";

@Module({
  providers: [MockWeatherProvider, OpenMeteoWeatherProvider, WeatherService],
  exports: [MockWeatherProvider, WeatherService]
})
export class WeatherModule {}
