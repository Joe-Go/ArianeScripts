importScripts("./caches/zip-lib/zip.js");
importScripts("./caches/zip-lib/ArrayBufferReader.js");
importScripts("./caches/zip-lib/deflate.js");
importScripts("./caches/zip-lib/inflate.js");
zip.useWebWorkers = false;

/**
 * Constantes
 */
const DEBUG = true;

const RUNTIME = "runtime";
const VERSION = "230920-114821";
const CACHE_CORE = "cache_core-v_230920-114821";
const CACHE_RES = "cache_res-v_230920-114821";
const CURRENT_CACHES = [CACHE_CORE, CACHE_RES];

const CACHE_APP_URL = ["datas.txt","index.html","lib-md/w_idKeyMgr/idKeyMgr.js","lib-md/w_idKeyTax/idKeyTaxMgr.js","lib-md/w_mediaelement/mediaelement.min.js","lib-md/w_scImageMgr/scImageMgr.js","lib-md/w_teMgr/fullscreen-api-polyfill.min.js","lib-md/w_teMgr/teMgr.js","lib-md/w_teMgr/teSubControllers.js","lib-md/w_teMgr/vtt.min.js","lib-md/w_tePlayer/TESettingsFromTracks.js","lib-md/w_tePlayer/icons.svg","lib-md/w_tePlayer/tePlayer.css","lib-md/w_tePlayer/tePlayer.js","lib-sc/scCoLib.js","lib-sc/scDynUiMgr.js","lib-sc/scPaLib.js","lib-sc/scSiLib.js","lib-sc/scTiLib.js","lib-sc/scTooltipMgr.js","skin/font/fontello.eot","skin/font/fontello.svg","skin/font/fontello.ttf","skin/font/fontello.woff","skin/img/download.svg","skin/img/lic/by-nc-nd.svg","skin/img/lic/by-nc-sa.svg","skin/img/lic/by-nc.svg","skin/img/lic/by-nd.svg","skin/img/lic/by-sa.svg","skin/img/lic/by.svg","skin/img/lic/zero.svg","skin/img/scBtn.png","skin/img/update.svg","skin/js/skin.js","skin/skin.css"];
const CACHE_CORE_URL = "caches/core.zip";
const CACHE_RES_URL = "caches/res.zip"

const CURRENT_CACHES_URLS = [CACHE_CORE_URL, CACHE_RES_URL];
const FILES_PER_CACHE = 100;

const APP_SIZE = 828758;

const IS_CHROME = navigator.userAgent.indexOf("Chrome") != -1;

const EXT_CT_MAP = {
	"html": "text/html","css": "text/css","js": "application/javascript","json":"application/json", //core
	"ttf":"application/octet-stream",
	"png": "image/png","jpg": "image/jpeg","jpeg": "image/jpeg","gif": "image/gif", "svg":"image/svg+xml", //image
	"mp3":"audio/mpeg","oga":"audio/ogg","ogg":"audio/ogg","ma4":"audio/mp4", //video
	"mp4":"video/mp4","f4v":"video/mp4","ogv":"video/ogg","webm":"video/webm" //audio
};
/**
 * Sur installation, on récupère uniquement le coeur de l'app
 * index.html
 * skin
 * lib js
 * data.txt
 */
self.addEventListener('install', async (event) => {
	event.waitUntil(
		caches.delete(RUNTIME).then(function(){caches.open(RUNTIME).then(function(cache) {return cache.addAll(CACHE_APP_URL);})})
	);
});
/**
 * Renvoie les fichiers mis en cache. S'ils n'existent pas les met dans cache Runtime et les utilise
 */
self.addEventListener("fetch", (event) => event.respondWith(cacheThenNetwork(event)));
async function cacheThenNetwork(event) {
	let opt = {"ignoreSearch":true, "ignoreMethod":true, "ignoreVary":true}
	if(IS_CHROME) opt["cacheName"] = await getCacheName(event.request.url);
    const cachedResponse = await caches.match(event.request, opt);
	if (cachedResponse) return cachedResponse;

	const runtimeCache = await caches.open(RUNTIME);
	const networkResponse = await fetch(event.request, { credentials: "include", mode: "no-cors" });
	await runtimeCache.put(event.request, networkResponse.clone())
	return networkResponse;
}

self.addEventListener("message", function(event) {
	if(event.data){
		switch (event.data.type) {
			case "ping":
				//no op. Client is waiting fow app ready
				break;
			case "clearCache":
				resetCache().then(()=>{event.ports[0].postMessage({"type": "cacheCleared"});}).catch((e)=>{console.error(e)});
				break;
			case "activate":
				self.skipWaiting();
				break;

			case "fetchNewSize":
				event.ports[0].postMessage({"type":"updateSize", "appSize":APP_SIZE, "onStart": event.data.onStart});
				break;

			case "loadOffline":
				downloadAllCaches()
					.then(()=>{event.ports[0].postMessage({"type":"allCacheInstalled"});})
					.catch((e)=>{
						console.log(e);
						event.ports[0].postMessage({"type":"installationFailed"});});
				break;
			case "isFullyOffline":
				isFullyOffline()
					.then(()=>{event.ports[0].postMessage({"type": "offlineReady"});})
					.catch((e)=>{event.ports[0].postMessage({"type":"offlineNotReady", "appSize":APP_SIZE});});
				break;
			default:
				log("unknown message : "+JSON.stringify(event.data));
		}
	}
});

function isFullyOffline(){
	return new Promise(function (resolve, reject){
		getDb().catch(reject)
			.then((db)=> {
				const cachesStore = db.transaction("caches").objectStore("caches");
				const request = cachesStore.getAll();
				request.onerror = reject
				request.onsuccess = function (reqEvent) {
					let count = 0;
					reqEvent.target.result.forEach((line)=>{if(CURRENT_CACHES.indexOf(line.key)!= -1) count++;});
					if (CURRENT_CACHES.length === count) resolve();
					else  reject();
				};
			});
	});
}


async function downloadAllCaches(){
	const getZipReader = function(data) {return new Promise(function(resolve, reject) {zip.createReader(new zip.ArrayBufferReader(data), resolve, reject);});}
	const getBaseUrl = function(){
		let curPath = location.pathname.split("/");
		curPath.pop();
		return location.origin + curPath.join("/")+"/";
	}
	const cacheContents = function (reader, cacheName) {
		return new Promise(function(resolve, reject) {
			let curCache = null;
			let curCacheName = null;
			const baseUrl = getBaseUrl();
			reader.getEntries(async function(entries){
				if(IS_CHROME){
					let filesRecord = [];
					for(let i = 0 ; i < entries.length ; i++){
						if(i%FILES_PER_CACHE == 0) {
							curCache = null;
							if(filesRecord.length) await writeFilesOnDb(filesRecord);
						}
						if(curCache == null) {
							curCacheName = cacheName + "_" + Math.trunc(i / FILES_PER_CACHE);
							curCache = await caches.open(curCacheName);
							filesRecord = [];
						}

						/** on groupe toutes les ecritures dans l'indexedDb on une seule transaction */
						if (entries[i].filename === "index.html") filesRecord.push({"url": baseUrl, cache: curCacheName, version: VERSION});
						filesRecord.push({"url": baseUrl + entries[i].filename, cache: curCacheName, version: VERSION});
						/**  */

						await cacheEntry(entries[i], curCache);
					}
					if(filesRecord.length) await writeFilesOnDb(filesRecord);
					resolve();
				}
				else{
					curCache = await caches.open(cacheName);
					for(let i = 0 ; i < entries.length ; i++) await cacheEntry(entries[i], curCache);
					resolve();
				}
			});
		});
	}
	const writeFilesOnDb = function(filesRecorcds){
		return new Promise(function(resolve, reject){
			getDb().catch(reject).then(async (db)=> {
				const filesTx = db.transaction("files", "readwrite");
				filesTx.onerror = reject;
				const files = filesTx.objectStore("files");
				filesRecorcds.forEach(async function (fileRecord){await files.put(fileRecord);});
				await filesTx.complete;
				resolve();
			});
		});
	}

	const cacheEntry = function(entry, cache) {
		if (entry.directory) {return Promise.resolve();}
		return new Promise(function(resolve, reject){
			entry.getData(new zip.BlobWriter(), async function(data) {
				const baseUrl = getBaseUrl();
				const response = new Response(data, { headers: {"Content-Type": EXT_CT_MAP[entry.filename.split(".").pop().toLowerCase()] || "text/plain"}});
				if (entry.filename === "index.html") await cache.put(baseUrl, response.clone());
				await cache.put(baseUrl + entry.filename, response);
				resolve();
			});
		});
	}
	let promises = [];
	return new Promise(function (resolve, reject){
		getDb().catch(reject).then((db)=>{
			CURRENT_CACHES_URLS.forEach(async function (url, index) {
				promises.push(new Promise(function (subResolve, subReject) {
					fetch(url)
						.then(function (response) {return response.arrayBuffer();})
						.then(getZipReader)
						.then((reader) => {
							cacheContents(reader, CURRENT_CACHES[index]).then(()=>{
								const db_req = db.transaction("caches", "readwrite").objectStore("caches").put({"key":CURRENT_CACHES[index]});
								db_req.onerror = subReject;
								db_req.onsuccess = subResolve;
							}).catch(subReject);
						}).catch(subReject);
				}));
			});
			Promise.all(promises).then(resolve).catch(reject)
		});
	});
}

function getDb(){
	return new Promise(function (resolve, reject) {
		const request = self.indexedDB.open("IDKey", 1);
		request.onupgradeneeded = function (event) {
			event.target.result.createObjectStore("caches",{keyPath:"key"});
			if(IS_CHROME) event.target.result.createObjectStore("files",{keyPath:"url"})
				.createIndex("version", "version", { unique: false });
		};
		request.onerror = reject;
		request.onsuccess = function (event) {resolve(event.target.result);};
	});
}

function resetCache(){
	const resetFilesRecord = function() {
		return new Promise(function (resolve, reject) {
			getDb().then(db => {
				const version = db.transaction("files", "readwrite").objectStore("files").index('version');
				const cursorRequest = version.openCursor(IDBKeyRange.only(VERSION));
				cursorRequest.onerror = reject;
				let usedCaches = {};
				cursorRequest.onsuccess = function (event) {
					const cursor = event.target.result;
					if (cursor){
						usedCaches[cursor.value.cache] = true;
						cursor.delete(cursor.value.url);
						cursor.continue();
					}
					else
						resolve(Object.keys(usedCaches));
				}
			}).catch(reject);
		});
	}
	const resetUsedCaches = function(usedCaches) {
		return new Promise(function (resolve, reject) {
			getDb().then(db => {
				const cacheTx = db.transaction("caches", "readwrite").objectStore("caches");
				let promises = [];
				CURRENT_CACHES.forEach(function (masterCacheKey) {cacheTx.delete(masterCacheKey).onerror = reject;});
				usedCaches.forEach(function (key) {
					promises.push(new Promise(function (subResolve, subReject) {
						const req = cacheTx.delete(key);
						req.onerror = reject;
						req.onsuccess = async function () {
							await caches.delete(key);
							subResolve();
						}
					}));
				});
				Promise.all(promises).then(resolve, reject);
			}).catch(reject);
		});
	}
	return new Promise(async function (resolve, reject){
		await caches.delete(RUNTIME);
		if(IS_CHROME) resetFilesRecord().then(resetUsedCaches).then(resolve).catch(reject);
		else return getDb().then(async  db => {
			db.transaction("caches", "readwrite").objectStore("caches").clear();
			caches.keys().then(async function(names) {
				for (const name of names)
					await caches.delete(name);
				resolve();
			});
		});
	});
}

function getCacheName(request){
	return new Promise(function (resolve, reject){
		const url = (request.indexOf('?') != -1 ? request.substring(0, request.indexOf('?')) : request);
		getDb().catch(reject).then((db)=>{
			const files = db.transaction("files").objectStore("files");
			const request = files.get(url);
			//Fichiers de premier niveau
			request.onerror = reject;
			request.onsuccess = function (event) {
				resolve(event.target.result ? event.target.result.cache : RUNTIME);
			};
		});
	});
}

/**
 * log si debug à true
 */
function log(message, ...data) {
    if (DEBUG) {
        if (data.length > 0) console.log(VERSION, message, data);
        else console.log(VERSION, message);
    }
}