import Pbf from 'pbf';

export enum WeatherCode {
    UNKNOWN = 0,
    CLEAR = 1,
    CLOUDY = 2,
    RAIN = 3,
    HEAVY_RAIN = 4,
    THUNDER = 5
}

export enum NewsCategory {
    NONE = 0,
    SAFETY = 1,
    PROGRAM = 2,
    TRANSPORT = 3,
    ANNOUNCEMENT = 4
}

export interface CurrentWeather {
    code: WeatherCode;
    temp: number;
    humidity: number;
    precip: number;
    windSpeed: number;
}

export interface TomorrowForecast {
    code: WeatherCode;
    temp: number;
    tempMax: number;
    tempMin: number;
    pop: number;
    precip: number;
    windSpeed: number;
}

export interface HourlyForecast {
    startTime: number;
    codes: WeatherCode[];
    temps: number[];
    humidities: number[];
    pops: number[];
    precips: number[];
    windSpeeds: number[];
}

export interface WeatherData {
    updatedAt: number;
    current: CurrentWeather | null;
    tomorrow: TomorrowForecast | null;
    hourly: HourlyForecast | null;
}

export interface News {
    id: number;
    createdAt: number;
    title: string;
    category: NewsCategory;
}

export interface EventData {
    id: number;
    title: string;
    startTime: number;
    endTime: number;
    location: string;
    description: string;
}

export interface SyncData {
    timestamp: number;
    weather: WeatherData | null;
    news: News[];
    events: EventData[];
}

// === CurrentWeather Serializers ===
export function readCurrentWeather(pbf: Pbf, end?: number): CurrentWeather {
    return pbf.readFields(readCurrentWeatherField, { code: 0, temp: 0, humidity: 0, precip: 0, windSpeed: 0 }, end);
}
function readCurrentWeatherField(tag: number, obj: CurrentWeather, pbf: Pbf) {
    if (tag === 1) obj.code = pbf.readVarint();
    else if (tag === 2) obj.temp = pbf.readSVarint();
    else if (tag === 3) obj.humidity = pbf.readVarint();
    else if (tag === 4) obj.precip = pbf.readVarint();
    else if (tag === 5) obj.windSpeed = pbf.readVarint();
}
export function writeCurrentWeather(obj: CurrentWeather, pbf: Pbf) {
    if (obj.code) pbf.writeVarintField(1, obj.code);
    if (obj.temp) pbf.writeSVarintField(2, obj.temp);
    if (obj.humidity) pbf.writeVarintField(3, obj.humidity);
    if (obj.precip) pbf.writeVarintField(4, obj.precip);
    if (obj.windSpeed) pbf.writeVarintField(5, obj.windSpeed);
}

// === TomorrowForecast Serializers ===
export function readTomorrowForecast(pbf: Pbf, end?: number): TomorrowForecast {
    return pbf.readFields(readTomorrowForecastField, { code: 0, temp: 0, tempMax: 0, tempMin: 0, pop: 0, precip: 0, windSpeed: 0 }, end);
}
function readTomorrowForecastField(tag: number, obj: TomorrowForecast, pbf: Pbf) {
    if (tag === 1) obj.code = pbf.readVarint();
    else if (tag === 2) obj.temp = pbf.readSVarint();
    else if (tag === 3) obj.tempMax = pbf.readSVarint();
    else if (tag === 4) obj.tempMin = pbf.readSVarint();
    else if (tag === 5) obj.pop = pbf.readVarint();
    else if (tag === 6) obj.precip = pbf.readVarint();
    else if (tag === 7) obj.windSpeed = pbf.readVarint();
}
export function writeTomorrowForecast(obj: TomorrowForecast, pbf: Pbf) {
    if (obj.code) pbf.writeVarintField(1, obj.code);
    if (obj.temp) pbf.writeSVarintField(2, obj.temp);
    if (obj.tempMax) pbf.writeSVarintField(3, obj.tempMax);
    if (obj.tempMin) pbf.writeSVarintField(4, obj.tempMin);
    if (obj.pop) pbf.writeVarintField(5, obj.pop);
    if (obj.precip) pbf.writeVarintField(6, obj.precip);
    if (obj.windSpeed) pbf.writeVarintField(7, obj.windSpeed);
}

// === HourlyForecast Serializers ===
export function readHourlyForecast(pbf: Pbf, end?: number): HourlyForecast {
    return pbf.readFields(readHourlyForecastField, { startTime: 0, codes: [], temps: [], humidities: [], pops: [], precips: [], windSpeeds: [] }, end);
}
function readHourlyForecastField(tag: number, obj: HourlyForecast, pbf: Pbf) {
    if (tag === 1) obj.startTime = pbf.readVarint();
    else if (tag === 2) pbf.readPackedVarint(obj.codes);
    else if (tag === 3) pbf.readPackedSVarint(obj.temps);
    else if (tag === 4) pbf.readPackedVarint(obj.humidities);
    else if (tag === 5) pbf.readPackedVarint(obj.pops);
    else if (tag === 6) pbf.readPackedVarint(obj.precips);
    else if (tag === 7) pbf.readPackedVarint(obj.windSpeeds);
}
export function writeHourlyForecast(obj: HourlyForecast, pbf: Pbf) {
    if (obj.startTime) pbf.writeVarintField(1, obj.startTime);
    if (obj.codes && obj.codes.length) pbf.writePackedVarint(2, obj.codes);
    if (obj.temps && obj.temps.length) pbf.writePackedSVarint(3, obj.temps);
    if (obj.humidities && obj.humidities.length) pbf.writePackedVarint(4, obj.humidities);
    if (obj.pops && obj.pops.length) pbf.writePackedVarint(5, obj.pops);
    if (obj.precips && obj.precips.length) pbf.writePackedVarint(6, obj.precips);
    if (obj.windSpeeds && obj.windSpeeds.length) pbf.writePackedVarint(7, obj.windSpeeds);
}

// === WeatherData Serializers ===
export function readWeatherData(pbf: Pbf, end?: number): WeatherData {
    return pbf.readFields(readWeatherDataField, { updatedAt: 0, current: null, tomorrow: null, hourly: null }, end);
}
function readWeatherDataField(tag: number, obj: WeatherData, pbf: Pbf) {
    if (tag === 1) obj.updatedAt = pbf.readVarint();
    else if (tag === 2) obj.current = readCurrentWeather(pbf, pbf.readVarint() + pbf.pos);
    else if (tag === 3) obj.tomorrow = readTomorrowForecast(pbf, pbf.readVarint() + pbf.pos);
    else if (tag === 4) obj.hourly = readHourlyForecast(pbf, pbf.readVarint() + pbf.pos);
}
export function writeWeatherData(obj: WeatherData, pbf: Pbf) {
    if (obj.updatedAt) pbf.writeVarintField(1, obj.updatedAt);
    if (obj.current) pbf.writeMessage(2, writeCurrentWeather, obj.current);
    if (obj.tomorrow) pbf.writeMessage(3, writeTomorrowForecast, obj.tomorrow);
    if (obj.hourly) pbf.writeMessage(4, writeHourlyForecast, obj.hourly);
}

// === News Serializers ===
export function readNews(pbf: Pbf, end?: number): News {
    return pbf.readFields(readNewsField, { id: 0, createdAt: 0, title: '', category: 0 }, end);
}
function readNewsField(tag: number, obj: News, pbf: Pbf) {
    if (tag === 1) obj.id = pbf.readVarint();
    else if (tag === 2) obj.createdAt = pbf.readVarint();
    else if (tag === 3) obj.title = pbf.readString();
    else if (tag === 4) obj.category = pbf.readVarint();
}
export function writeNews(obj: News, pbf: Pbf) {
    if (obj.id) pbf.writeVarintField(1, obj.id);
    if (obj.createdAt) pbf.writeVarintField(2, obj.createdAt);
    if (obj.title) pbf.writeStringField(3, obj.title);
    if (obj.category) pbf.writeVarintField(4, obj.category);
}

// === EventData Serializers ===
export function readEventData(pbf: Pbf, end?: number): EventData {
    return pbf.readFields(readEventDataField, { id: 0, title: '', startTime: 0, endTime: 0, location: '', description: '' }, end);
}
function readEventDataField(tag: number, obj: EventData, pbf: Pbf) {
    if (tag === 1) obj.id = pbf.readVarint();
    else if (tag === 2) obj.title = pbf.readString();
    else if (tag === 3) obj.startTime = pbf.readVarint();
    else if (tag === 4) obj.endTime = pbf.readVarint();
    else if (tag === 5) obj.location = pbf.readString();
    else if (tag === 6) obj.description = pbf.readString();
}
export function writeEventData(obj: EventData, pbf: Pbf) {
    if (obj.id) pbf.writeVarintField(1, obj.id);
    if (obj.title) pbf.writeStringField(2, obj.title);
    if (obj.startTime) pbf.writeVarintField(3, obj.startTime);
    if (obj.endTime) pbf.writeVarintField(4, obj.endTime);
    if (obj.location) pbf.writeStringField(5, obj.location);
    if (obj.description) pbf.writeStringField(6, obj.description);
}

// === SyncData Serializers ===
export function readSyncData(pbf: Pbf, end?: number): SyncData {
    return pbf.readFields(readSyncDataField, { timestamp: 0, weather: null, news: [], events: [] }, end);
}
function readSyncDataField(tag: number, obj: SyncData, pbf: Pbf) {
    if (tag === 1) obj.timestamp = pbf.readVarint();
    else if (tag === 2) obj.weather = readWeatherData(pbf, pbf.readVarint() + pbf.pos);
    else if (tag === 3) obj.news.push(readNews(pbf, pbf.readVarint() + pbf.pos));
    else if (tag === 4) obj.events.push(readEventData(pbf, pbf.readVarint() + pbf.pos));
}
export function writeSyncData(obj: SyncData, pbf: Pbf) {
    if (obj.timestamp) pbf.writeVarintField(1, obj.timestamp);
    if (obj.weather) pbf.writeMessage(2, writeWeatherData, obj.weather);
    if (obj.news && obj.news.length) {
        for (let i = 0; i < obj.news.length; i++) {
            pbf.writeMessage(3, writeNews, obj.news[i]);
        }
    }
    if (obj.events && obj.events.length) {
        for (let i = 0; i < obj.events.length; i++) {
            pbf.writeMessage(4, writeEventData, obj.events[i]);
        }
    }
}

// === Helper Functions ===
export function serializeSyncData(data: SyncData): Uint8Array {
    const pbf = new Pbf();
    writeSyncData(data, pbf);
    return pbf.finish();
}

export function deserializeSyncData(buffer: Uint8Array): SyncData {
    const pbf = new Pbf(buffer);
    return readSyncData(pbf);
}
