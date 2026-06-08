import { Module } from "@nestjs/common";
import { MockWeatherProvider } from "../../providers/weather/mock-weather-provider";
import { GeocodingModule } from "../geocoding/geocoding.module";
import { OpenMeteoWeatherProvider } from "./providers/open-meteo-weather.provider";
import { WeatherService } from "./weather.service";

@Module({
  imports: [GeocodingModule],
  providers: [MockWeatherProvider, OpenMeteoWeatherProvider, WeatherService],
  exports: [MockWeatherProvider, WeatherService]
})
export class WeatherModule {}
