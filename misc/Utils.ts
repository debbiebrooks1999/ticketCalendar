import {CorePublicListingEventResource} from "@vivenu/vivenu-js/types/interfaces/CorePublicListingEventResource"
import momentTZ from "moment-timezone"

export enum AvailabilityIndicator {
  green = "green",
  yellow = "yellow",
  red = "red",
}

export class Utils {
  static isPastEvent(event: CorePublicListingEventResource): boolean {
    return new Date(event.start).getTime() < new Date().getTime()
  }
  static getStatus(event: CorePublicListingEventResource): string {
    if (event.availabilityIndicator === AvailabilityIndicator.green) {
      return "high"
    } else if (event.availabilityIndicator === AvailabilityIndicator.yellow) {
      return "low"
    } else if (event.availabilityIndicator === AvailabilityIndicator.red || event.saleStatus == "soldOut") {
      return "soldOut"
    }
    return ""
  }

  static getTitle(event: CorePublicListingEventResource): string {
    if (
      event.availabilityIndicator === AvailabilityIndicator.green
    ) {
      return "Available"
    } else if (event.availabilityIndicator === AvailabilityIndicator.yellow) {
      return "Low Avail"
    } else if (event.availabilityIndicator === AvailabilityIndicator.red || event.saleStatus == "soldOut") {
      return "Sold Out"
    }
    return ""
  }
  static getMoment(date: Date | string, timezone: string) {
    let momentObject = momentTZ(date).tz(timezone)
    return momentObject
  }
}
