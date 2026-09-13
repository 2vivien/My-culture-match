import { and, eq, or } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { userLocationSettings, locationPrecision, locationVisibility, type LocationPrecision, type LocationVisibility } from './location.schema';
import { AppError } from '../../shared/utils/AppError';
import { haversineKm } from '../users/users.service';

const cacheKey = (id: string) => `location:settings:${id}`;
export interface LocationSettingsDto { sharingEnabled:boolean; visibility:LocationVisibility; precision:LocationPrecision; ghostMode:boolean; showDistance:boolean; showActiveStatus:boolean; expiresAt:string|null; }
const validVisibility=(v:unknown):v is LocationVisibility=>typeof v==='string'&&(locationVisibility as readonly string[]).includes(v);
const validPrecision=(v:unknown):v is LocationPrecision=>typeof v==='string'&&(locationPrecision as readonly string[]).includes(v);
async function rowFor(userId:string){const [row]=await db.select().from(userLocationSettings).where(eq(userLocationSettings.userId,userId)).limit(1);if(row)return row;const [created]=await db.insert(userLocationSettings).values({userId}).returning();return created;}

export async function getLocationSettings(userId:string):Promise<LocationSettingsDto>{
 const cached=await redis.get(cacheKey(userId));if(cached)return JSON.parse(cached) as LocationSettingsDto;
 const [user]=await db.select({sharingEnabled:schema.users.locationSharingEnabled}).from(schema.users).where(eq(schema.users.id,userId)).limit(1);if(!user)throw AppError.notFound('Utilisateur introuvable','USER_NOT_FOUND');
 const row=await rowFor(userId);const dto:LocationSettingsDto={sharingEnabled:user.sharingEnabled,visibility:validVisibility(row.visibility)?row.visibility:'nearby',precision:validPrecision(row.precision)?row.precision:'approximate',ghostMode:row.ghostMode,showDistance:row.showDistance,showActiveStatus:row.showActiveStatus,expiresAt:row.expiresAt?.toISOString()??null};await redis.set(cacheKey(userId),JSON.stringify(dto),'EX',300);return dto;
}

export async function updateLocationSettings(userId:string,input:Partial<LocationSettingsDto>):Promise<LocationSettingsDto>{
 const current=await rowFor(userId);const visibility=input.visibility??current.visibility;const precision=input.precision??current.precision;
 if(!validVisibility(visibility))throw AppError.badRequest('Visibilité de localisation invalide','INVALID_LOCATION_VISIBILITY');if(!validPrecision(precision))throw AppError.badRequest('Précision de localisation invalide','INVALID_LOCATION_PRECISION');
 const expiresAt=input.expiresAt===null?null:input.expiresAt?new Date(input.expiresAt):current.expiresAt;if(expiresAt&&Number.isNaN(expiresAt.getTime()))throw AppError.badRequest('Expiration invalide','INVALID_LOCATION_EXPIRY');
 await db.insert(userLocationSettings).values({userId,visibility,precision,ghostMode:input.ghostMode??current.ghostMode,showDistance:input.showDistance??current.showDistance,showActiveStatus:input.showActiveStatus??current.showActiveStatus,expiresAt,updatedAt:new Date()}).onConflictDoUpdate({target:userLocationSettings.userId,set:{visibility,precision,ghostMode:input.ghostMode??current.ghostMode,showDistance:input.showDistance??current.showDistance,showActiveStatus:input.showActiveStatus??current.showActiveStatus,expiresAt,updatedAt:new Date()}});
 if(input.sharingEnabled!==undefined)await db.update(schema.users).set({locationSharingEnabled:input.sharingEnabled,latitude:input.sharingEnabled?undefined:null,longitude:input.sharingEnabled?undefined:null,updatedAt:new Date()}).where(eq(schema.users.id,userId));await redis.del(cacheKey(userId));return getLocationSettings(userId);
}
function jitter(value:number,seed:string,magnitude:number){let h=2166136261;for(const ch of seed)h=Math.imul(h^ch.charCodeAt(0),16777619);return value+((((h>>>0)%100000)/100000)-.5)*magnitude;}
function fuzz(lat:number,lon:number,id:string,precision:LocationPrecision){const m=precision==='area'?.02:.006;return{latitude:jitter(lat,`${id}:lat`,m),longitude:jitter(lon,`${id}:lon`,m)};}

export async function getPeopleNearby(userId:string,viewerLocation?:{latitude:number;longitude:number}){
 const [viewer]=await db.select({latitude:schema.users.latitude,longitude:schema.users.longitude,sharingEnabled:schema.users.locationSharingEnabled}).from(schema.users).where(eq(schema.users.id,userId)).limit(1);if(!viewer)throw AppError.notFound('Utilisateur introuvable','USER_NOT_FOUND');
 const origin=viewer.sharingEnabled&&viewer.latitude!==null&&viewer.longitude!==null?{latitude:viewer.latitude,longitude:viewer.longitude}:viewerLocation;if(!origin)return{people:[],total:0};
 const blockedRows=await db.select({blockerId:schema.blocks.blockerId,blockedId:schema.blocks.blockedId}).from(schema.blocks).where(or(eq(schema.blocks.blockerId,userId),eq(schema.blocks.blockedId,userId)));const blocked=new Set(blockedRows.map(r=>r.blockerId===userId?r.blockedId:r.blockerId));
 const companionRows=await db.select({fromUserId:schema.connections.fromUserId,toUserId:schema.connections.toUserId}).from(schema.connections).where(and(or(eq(schema.connections.fromUserId,userId),eq(schema.connections.toUserId,userId)),eq(schema.connections.status,'companion')));const friends=new Set(companionRows.map(r=>r.fromUserId===userId?r.toUserId:r.fromUserId));
 const candidates=await db.select({id:schema.users.id,name:schema.users.name,username:schema.users.username,avatar:schema.users.avatar,bio:schema.users.bio,country:schema.users.country,location:schema.users.location,languages:schema.users.languages,values:schema.users.values,intention:schema.users.intention,latitude:schema.users.latitude,longitude:schema.users.longitude,updated:schema.users.locationUpdatedAt,visibility:userLocationSettings.visibility,precision:userLocationSettings.precision,ghost:userLocationSettings.ghostMode,showDistance:userLocationSettings.showDistance,showActive:userLocationSettings.showActiveStatus,expiresAt:userLocationSettings.expiresAt}).from(schema.users).leftJoin(userLocationSettings,eq(userLocationSettings.userId,schema.users.id)).where(and(eq(schema.users.profileCompleted,true),eq(schema.users.locationSharingEnabled,true))).limit(1000);
 const people:Array<Record<string,unknown>>=[];
 for(const c of candidates){if(c.id===userId||blocked.has(c.id)||c.latitude===null||c.longitude===null||c.ghost)continue;if(c.expiresAt&&c.expiresAt.getTime()<=Date.now())continue;const visibility=validVisibility(c.visibility)?c.visibility:'nearby';const friend=friends.has(c.id);if(visibility==='nobody'||(visibility==='friends'&&!friend))continue;const distance=haversineKm(origin.latitude,origin.longitude,c.latitude,c.longitude);if(distance>50)continue;const precision=validPrecision(c.precision)?c.precision:'approximate';const distanceKm=c.showDistance?(distance<1?Number(distance.toFixed(1)):Math.round(distance)):null;people.push({id:c.id,name:c.name,username:c.username,avatar:c.avatar,bio:c.bio,country:c.country,location:c.location,languages:c.languages,values:c.values,intention:c.intention,matchScore:0,...fuzz(c.latitude,c.longitude,c.id,precision),distanceKm,distanceLabel:distanceKm===null?null:distanceKm<1?'Nearby':`~${distanceKm} km away`,isCompanion:friend,isActive:c.showActive?!!c.updated&&Date.now()-c.updated.getTime()<900000:false});}
 people.sort((a,b)=>Number(a.distanceKm??999)-Number(b.distanceKm??999));return{people:people.slice(0,200),total:people.length};
}
