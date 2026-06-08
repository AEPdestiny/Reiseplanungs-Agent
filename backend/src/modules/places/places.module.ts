import { Module } from "@nestjs/common";
import { WikidataPlacesProvider } from "../../providers/places/wikidata-places.provider";
import { PLACES_PROVIDER } from "./places-provider.interface";
import { PlacesService } from "./places.service";

@Module({
  providers: [
    PlacesService,
    WikidataPlacesProvider,
    {
      provide: PLACES_PROVIDER,
      useExisting: WikidataPlacesProvider
    }
  ],
  exports: [PlacesService]
})
export class PlacesModule {}
