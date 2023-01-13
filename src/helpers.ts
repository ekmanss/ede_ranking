import {Address, BigInt, ethereum, log} from "@graphprotocol/graph-ts"
import {
    Transaction,
    Account,
    PositionKeyAccount,
    DurationTotalVolume
} from "../generated/schema"
import {IncreasePosition as IncreasePositionEvent} from "../generated/Vault/Vault";
import {getIntervalId, getIntervalIdentifier} from "./interval";

export const BASIS_POINTS_DIVISOR = BigInt.fromI32(10000)

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const BI_18 = BigInt.fromI32(18)
export const BI_10 = BigInt.fromI32(10)

export const BI_12_PRECISION = BigInt.fromI32(10).pow(12)
export const BI_18_PRECISION = BigInt.fromI32(10).pow(18)
export const BI_22_PRECISION = BigInt.fromI32(10).pow(22)


export const weekly = "weekly"
export const daily = "daily"

export enum TokenDecimals {
    USDC = 6,
    USDT = 6,
    BTC = 8,
    WETH = 18,
    LINK = 18,
    UNI = 18,
    MIM = 18,
    SPELL = 18,
    SUSHI = 18,
    AVAX = 18,
    FRAX = 18,
    DAI = 18,
    GMX = 18,
    GLP = 18,
}


export enum intervalUnixTime {
    SEC = 1,
    SEC60 = 60,
    MIN5 = 300,
    MIN15 = 900,
    MIN30 = 1800,
    MIN60 = 3600,
    HR2 = 7200,
    HR4 = 14400,
    HR8 = 28800,
    HR24 = 86400,
    DAY7 = 604800,
    MONTH = 2628000,
    MONTH2 = 5256000
}


export function negate(n: BigInt): BigInt {
    return n.abs().times(BigInt.fromI32(-1))
}

export function timestampToDay(timestamp: BigInt): BigInt {
    return BigInt.fromI32(86400).times(BigInt.fromI32(86400)).div(timestamp)
}


export function getIdFromEvent(event: ethereum.Event): string {
    return event.transaction.hash.toHexString() + ':' + event.logIndex.toString()
}

export function _createTransaction(event: ethereum.Event, id: string): Transaction {
    const to = event.transaction.to
    const entity = new Transaction(id)

    entity.timestamp = event.block.timestamp.toI32()
    entity.blockNumber = event.block.number.toI32()
    entity.from = event.transaction.from.toHexString()

    if (to !== null) {
        entity.to = to.toHexString()
    }

    return entity
}


export function calculatePositionDelta(marketPrice: BigInt, isLong: boolean, size: BigInt, averagePrice: BigInt): BigInt {
    const priceDelta = averagePrice.gt(marketPrice) ? averagePrice.minus(marketPrice) : marketPrice.minus(averagePrice)

    if (priceDelta.equals(ZERO_BI) || averagePrice.equals(ZERO_BI)) {
        return ZERO_BI
    }

    const hasProfit = isLong ? marketPrice > averagePrice : marketPrice < averagePrice
    const delta = size.times(priceDelta).div(averagePrice)

    return hasProfit ? delta : negate(delta)
}

export function calculatePositionDeltaPercentage(delta: BigInt, collateral: BigInt): BigInt {
    if (collateral.equals(ZERO_BI)) {
        return ZERO_BI
    }

    return delta.times(BASIS_POINTS_DIVISOR).div(collateral)
}

export function accumulateIncMarginTradingVolume(accoutn: Account, sizeDelta: BigInt): void {
    accoutn.durationAccumulatedMarginTradingVolume = BigInt.fromString(accoutn.durationAccumulatedMarginTradingVolume).plus(sizeDelta).toString()
}

export function accumulatePnl(account: Account, pnl: BigInt, fee: BigInt, hasProfit: boolean): void {
    account.durationAccumulatedMarginTradingPnl = hasProfit ? BigInt.fromString(account.durationAccumulatedMarginTradingPnl).minus(fee).plus(pnl).toString() : BigInt.fromString(account.durationAccumulatedMarginTradingPnl).minus(fee).minus(pnl).toString()
}

export function getAccountByPositionKey(positionKey: string): string {
    let pkmap = PositionKeyAccount.load(positionKey);
    if (pkmap == null) {
        return "ede";
    }
    return pkmap.account.toHexString();
}

export function _storeOriginPkMap(event: IncreasePositionEvent): void {
    let pkmapId = event.params.key.toHexString();
    let pkmap = PositionKeyAccount.load(pkmapId);

    if (pkmap == null) {
        pkmap = new PositionKeyAccount(pkmapId);
        pkmap.account = event.params.account;
        pkmap.collateralToken = event.params.collateralToken;
        pkmap.indexToken = event.params.indexToken;
        pkmap.isLong = event.params.isLong;
        pkmap.initBlockNumber = event.params._event.block.number;
        pkmap.collateralRemaining = BigInt.fromI32(0);
        pkmap.totalSize = BigInt.fromI32(0);
    }

    // total size in current position
    pkmap.totalSize = pkmap.totalSize.plus(event.params.sizeDelta);

    // total collateralRemaining in current position
    pkmap.collateralRemaining = pkmap.collateralRemaining.plus(
        event.params.collateralDelta
    );
    pkmap.save();
}

export function accumulateRealisedPnl(account: Account, positionRealisedPnl: BigInt): void {
    account.durationAccumulatedMarginTradingRealisedPnl = BigInt.fromString(account.durationAccumulatedMarginTradingRealisedPnl).plus(positionRealisedPnl).toString()
}

export function accumulateDurationTotalVolume(sizeDelta: BigInt, event: ethereum.Event): void {
    let dailyId = getIntervalId(intervalUnixTime.HR24, event);
    let weeklyId = getIntervalId(intervalUnixTime.DAY7, event);

    let dailyDurationTotalVolumeId = getIntervalIdentifier(event, daily, intervalUnixTime.HR24);
    let weeklyDurationTotalVolumeId = getIntervalIdentifier(event, weekly, intervalUnixTime.DAY7);

    let dailyDurationTotalVolume = DurationTotalVolume.load(dailyDurationTotalVolumeId);
    let weeklyDurationTotalVolume = DurationTotalVolume.load(weeklyDurationTotalVolumeId);

    if (dailyDurationTotalVolume === null) {
        dailyDurationTotalVolume = new DurationTotalVolume(dailyDurationTotalVolumeId);
        dailyDurationTotalVolume.duration = daily;
        dailyDurationTotalVolume.durationId = dailyId.toString();
        dailyDurationTotalVolume.totalVolume = sizeDelta.toString();

        dailyDurationTotalVolume.save()
    }

    if (weeklyDurationTotalVolume === null) {
        weeklyDurationTotalVolume = new DurationTotalVolume(weeklyDurationTotalVolumeId);
        weeklyDurationTotalVolume.duration = weekly;
        weeklyDurationTotalVolume.durationId = weeklyId.toString();
        weeklyDurationTotalVolume.totalVolume = sizeDelta.toString();

        weeklyDurationTotalVolume.save()
    }


    dailyDurationTotalVolume.totalVolume = BigInt.fromString(dailyDurationTotalVolume.totalVolume).plus(sizeDelta).toString();
    weeklyDurationTotalVolume.totalVolume = BigInt.fromString(weeklyDurationTotalVolume.totalVolume).plus(sizeDelta).toString();

    dailyDurationTotalVolume.save();
    weeklyDurationTotalVolume.save();
}








