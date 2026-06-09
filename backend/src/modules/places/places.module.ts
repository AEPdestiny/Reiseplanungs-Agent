import { Module } from "@nestjs/common";
import { GeocodingModule } from "../geocoding/geocoding.module";
import { OpenTripMapPlacesProvider } from "../../providers/places/opentripmap-places.provider";
import { WikidataPlacesProvider } from "../../providers/places/wikidata-places.provider";
import { WikipediaPlacesProvider } from "../../providers/places/wikipedia-places.provider";
import { PLACES_PROVIDER } from "./places-provider.interface";
import { PlacesService } from "./places.service";

@Module({
  imports: [GeocodingModule],
  providers: [
    PlacesService,
    WikidataPlacesProvider,
    WikipediaPlacesProvider,
    OpenTripMapPlacesProvider,
    {
      provide: PLACES_PROVIDER,
      useExisting: WikidataPlacesProvider
    }
  ],
  exports: [PlacesService]
})
export class PlacesModule {}
