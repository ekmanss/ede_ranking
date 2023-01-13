import {ethereum} from "@graphprotocol/graph-ts"
import {intervalUnixTime} from "./helpers"


export function getIntervalIdentifier(event: ethereum.Event, name: string, interval: intervalUnixTime): string {
    const intervalID = getIntervalId(interval, event)
    return name + ":" + interval.toString() + ':' + intervalID.toString()
}

export function getIntervalId(interval: intervalUnixTime, event: ethereum.Event): i32 {
    return event.block.timestamp.toI32() / interval
}

export function getHourlyId(event: ethereum.Event): i32 {
    return getIntervalId(3600, event)
}

export function getDailyId(event: ethereum.Event): i32 {
    return getIntervalId(86400, event)
}

export function getWeeklyId(event: ethereum.Event): i32 {
    return getIntervalId(604800, event)
}
