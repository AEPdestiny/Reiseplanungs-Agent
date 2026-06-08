import { Module } from "@nestjs/common";
import { NominatimGeocodingProvider } from "../../providers/geocoding/nominatim-geocoding.provider";
import { GeocodingService } from "./geocoding.service";

@Module({
  providers: [NominatimGeocodingProvider, GeocodingService],
  exports: [GeocodingService]
})
export class GeocodingModule {}
