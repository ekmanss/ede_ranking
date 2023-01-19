import {BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";

import {
    Account
} from "../generated/schema";
import {
    ClosePosition as ClosePositionEvent,
    DecreasePosition as DecreasePositionEvent,
    IncreasePosition as IncreasePositionEvent,
    LiquidatePosition as LiquidatePositionEvent,
    UpdatePnl as UpdatePnlEvent,
} from "../generated/Vault/Vault";

import {getIntervalIdentifier, getIntervalId} from "./interval";
import {
    daily, weekly,
    intervalUnixTime,
    accumulateIncMarginTradingVolume,
    accumulatePnl,
    ZERO_BI,
    _storeOriginPkMap,
    getAccountByPositionKey, accumulateRealisedPnl,
    accumulateDurationTotalVolume,
} from "./helpers";


export function handleIncreasePositionSingle(event: IncreasePositionEvent): void {
    _storeOriginPkMap(event);
    accumulateDurationTotalVolume(event.params.sizeDelta, event);
    //======================volume start======================
    let dailyId = getIntervalId(intervalUnixTime.HR24, event);
    let weeklyId = getIntervalId(intervalUnixTime.DAY7, event);

    let accountDailyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.HR24);
    let accountWeeklyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.DAY7);

    let accountDaily = Account.load(accountDailyId);
    let accountWeekly = Account.load(accountWeeklyId);

    if (accountDaily === null) {
        accountDaily = new Account(accountDailyId);
        accountDaily.address = event.params.account.toHexString();
        accountDaily.duration = daily;
        accountDaily.durationId = dailyId.toString();
        accountDaily.durationAccumulatedMarginTradingVolume = "0";
        accountDaily.durationAccumulatedMarginTradingPnl = "0"
        accountDaily.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateIncMarginTradingVolume(accountDaily, event.params.sizeDelta);
    }else{
        accumulateIncMarginTradingVolume(accountDaily, event.params.sizeDelta);
    }

    if (accountWeekly === null) {
        accountWeekly = new Account(accountWeeklyId);
        accountWeekly.address = event.params.account.toHexString();
        accountWeekly.duration = weekly;
        accountWeekly.durationId = weeklyId.toString();
        accountWeekly.durationAccumulatedMarginTradingVolume = "0";
        accountWeekly.durationAccumulatedMarginTradingPnl = "0"
        accountWeekly.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateIncMarginTradingVolume(accountWeekly, event.params.sizeDelta);
    }else {
        accumulateIncMarginTradingVolume(accountWeekly, event.params.sizeDelta);
    }




    //======================volume end======================

    //======================pnl start======================
    accumulatePnl(accountDaily, ZERO_BI, event.params.fee, true);
    accumulatePnl(accountWeekly, ZERO_BI, event.params.fee, true);
    //======================pnl end======================


    accountDaily.save();
    accountWeekly.save();
}


export function handleDecreasePosition(event: DecreasePositionEvent): void {
    accumulateDurationTotalVolume(event.params.sizeDelta, event);

    //======================volume start======================
    let dailyId = getIntervalId(intervalUnixTime.HR24, event);
    let weeklyId = getIntervalId(intervalUnixTime.DAY7, event);

    let accountDailyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.HR24);
    let accountWeeklyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.DAY7);

    let accountDaily = Account.load(accountDailyId);
    let accountWeekly = Account.load(accountWeeklyId);

    if (accountDaily === null) {
        accountDaily = new Account(accountDailyId);
        accountDaily.address = event.params.account.toHexString();
        accountDaily.duration = daily;
        accountDaily.durationId = dailyId.toString();
        accountDaily.durationAccumulatedMarginTradingVolume = "0";
        accountDaily.durationAccumulatedMarginTradingPnl = "0"
        accountDaily.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateIncMarginTradingVolume(accountDaily, event.params.sizeDelta);
        accountDaily.save();
    }

    if (accountWeekly === null) {
        accountWeekly = new Account(accountWeeklyId);
        accountWeekly.address = event.params.account.toHexString();
        accountWeekly.duration = weekly;
        accountWeekly.durationId = weeklyId.toString();
        accountWeekly.durationAccumulatedMarginTradingVolume = "0";
        accountWeekly.durationAccumulatedMarginTradingPnl = "0"
        accountWeekly.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateIncMarginTradingVolume(accountWeekly, event.params.sizeDelta);
        accountWeekly.save();
    }

    accumulateIncMarginTradingVolume(accountDaily, event.params.sizeDelta);
    accumulateIncMarginTradingVolume(accountWeekly, event.params.sizeDelta);
    //======================volume end======================

    //======================pnl start======================
    accumulatePnl(accountDaily, ZERO_BI, event.params.fee, true);
    accumulatePnl(accountWeekly, ZERO_BI, event.params.fee, true);
    //======================pnl end======================


    accountDaily.save();
    accountWeekly.save();

}


// acc all position of accounts pnl, including open interest
export function handleUpdatePnl(event: UpdatePnlEvent): void {
    let address = getAccountByPositionKey(event.params.key.toHexString());

    let dailyId = getIntervalId(intervalUnixTime.HR24, event);
    let weeklyId = getIntervalId(intervalUnixTime.DAY7, event);

    let accountDailyId = getIntervalIdentifier(event, address, intervalUnixTime.HR24);
    let accountWeeklyId = getIntervalIdentifier(event, address, intervalUnixTime.DAY7);

    let accountDaily = Account.load(accountDailyId);
    let accountWeekly = Account.load(accountWeeklyId);

    if (accountDaily === null) {
        accountDaily = new Account(accountDailyId);
        accountDaily.address = address;
        accountDaily.duration = daily;
        accountDaily.durationId = dailyId.toString();
        accountDaily.durationAccumulatedMarginTradingVolume = "0";
        accountDaily.durationAccumulatedMarginTradingPnl = "0"
        accountDaily.durationAccumulatedMarginTradingRealisedPnl = "0"

        accountDaily.save();
    }

    if (accountWeekly === null) {
        accountWeekly = new Account(accountWeeklyId);
        accountWeekly.address = address;
        accountWeekly.duration = weekly;
        accountWeekly.durationId = weeklyId.toString();
        accountWeekly.durationAccumulatedMarginTradingVolume = "0";
        accountWeekly.durationAccumulatedMarginTradingPnl = "0"
        accountWeekly.durationAccumulatedMarginTradingRealisedPnl = "0"

        accountWeekly.save();
    }


    accumulatePnl(accountDaily, event.params.delta, ZERO_BI, event.params.hasProfit);
    accumulatePnl(accountWeekly, event.params.delta, ZERO_BI, event.params.hasProfit);


    accountDaily.save()
    accountWeekly.save()

}


// acc all position of accounts realisedPnl ,not include open interest
export function handleClosePosition(event: ClosePositionEvent): void {
    //======================volume start======================
    let dailyId = getIntervalId(intervalUnixTime.HR24, event);
    let weeklyId = getIntervalId(intervalUnixTime.DAY7, event);

    let accountDailyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.HR24);
    let accountWeeklyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.DAY7);

    let accountDaily = Account.load(accountDailyId);
    let accountWeekly = Account.load(accountWeeklyId);

    if (accountDaily === null) {
        accountDaily = new Account(accountDailyId);
        accountDaily.address = event.params.account.toHexString();
        accountDaily.duration = daily;
        accountDaily.durationId = dailyId.toString();
        accountDaily.durationAccumulatedMarginTradingVolume = "0";
        accountDaily.durationAccumulatedMarginTradingPnl = "0"
        accountDaily.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateRealisedPnl(accountDaily, event.params.realisedPnl)
        accountDaily.save();
    }

    if (accountWeekly === null) {
        accountWeekly = new Account(accountWeeklyId);
        accountWeekly.address = event.params.account.toHexString();
        accountWeekly.duration = weekly;
        accountWeekly.durationId = weeklyId.toString();
        accountWeekly.durationAccumulatedMarginTradingVolume = "0";
        accountWeekly.durationAccumulatedMarginTradingPnl = "0"
        accountWeekly.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateRealisedPnl(accountWeekly, event.params.realisedPnl)
        accountWeekly.save();
    }

    accumulateRealisedPnl(accountDaily, event.params.realisedPnl)
    accumulateRealisedPnl(accountWeekly, event.params.realisedPnl)


    accountDaily.save()
    accountWeekly.save()
}


export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
    accumulateDurationTotalVolume(event.params.size, event);

    //======================volume start======================
    let dailyId = getIntervalId(intervalUnixTime.HR24, event);
    let weeklyId = getIntervalId(intervalUnixTime.DAY7, event);

    let accountDailyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.HR24);
    let accountWeeklyId = getIntervalIdentifier(event, event.params.account.toHexString(), intervalUnixTime.DAY7);

    let accountDaily = Account.load(accountDailyId);
    let accountWeekly = Account.load(accountWeeklyId);

    if (accountDaily === null) {
        accountDaily = new Account(accountDailyId);
        accountDaily.address = event.params.account.toHexString();
        accountDaily.duration = daily;
        accountDaily.durationId = dailyId.toString();
        accountDaily.durationAccumulatedMarginTradingVolume = "0";
        accountDaily.durationAccumulatedMarginTradingPnl = "0"
        accountDaily.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateIncMarginTradingVolume(accountDaily, event.params.size);
        accountDaily.save();
    }

    if (accountWeekly === null) {
        accountWeekly = new Account(accountWeeklyId);
        accountWeekly.address = event.params.account.toHexString();
        accountWeekly.duration = weekly;
        accountWeekly.durationId = weeklyId.toString();
        accountWeekly.durationAccumulatedMarginTradingVolume = "0";
        accountWeekly.durationAccumulatedMarginTradingPnl = "0"
        accountWeekly.durationAccumulatedMarginTradingRealisedPnl = "0"

        accumulateIncMarginTradingVolume(accountWeekly, event.params.size);
        accountWeekly.save();
    }

    accumulateIncMarginTradingVolume(accountDaily, event.params.size);
    accountDaily.save();

    accumulateIncMarginTradingVolume(accountWeekly, event.params.size);
    accountWeekly.save();
    //======================volume end======================
}


