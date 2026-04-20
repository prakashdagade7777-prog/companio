(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime/runtime-types.d.ts" />
/// <reference path="../../../shared/runtime/dev-globals.d.ts" />
/// <reference path="../../../shared/runtime/dev-protocol.d.ts" />
/// <reference path="../../../shared/runtime/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateB.type === 'total') {
        // A total update replaces the entire chunk, so it supersedes any prior update.
        return updateB;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/Desktop/companio/lib/firebase.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "db",
    ()=>db,
    "default",
    ()=>__TURBOPACK__default__export__,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Desktop/companio/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
// lib/firebase.js
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/app/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/@firebase/app/dist/esm/index.esm2017.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/auth/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__o__as__getAuth$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-68602d24.js [client] (ecmascript) <export o as getAuth>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/firestore/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/@firebase/firestore/dist/index.esm2017.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/storage/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/@firebase/storage/dist/index.esm2017.js [client] (ecmascript)");
;
;
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyCYXyTmPnlXmCMwUNlSzbQjY6G7Zcngns4"),
    authDomain: ("TURBOPACK compile-time value", "companio-1712a.firebaseapp.com"),
    projectId: ("TURBOPACK compile-time value", "companio-1712a"),
    storageBucket: ("TURBOPACK compile-time value", "companio-1712a.firebasestorage.app"),
    messagingSenderId: ("TURBOPACK compile-time value", "773937018882"),
    appId: ("TURBOPACK compile-time value", "1:773937018882:web:1e5cfbb22d75a3a0e70f1b")
};
const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getApps"])().length ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getApp"])() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["initializeApp"])(firebaseConfig);
const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__o__as__getAuth$3e$__["getAuth"])(app);
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getFirestore"])(app);
const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getStorage"])(app);
const __TURBOPACK__default__export__ = app;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 /*
 * ────────────────────────────────────────────────────────────────────────────
 *  FIRESTORE COLLECTIONS SCHEMA
 * ────────────────────────────────────────────────────────────────────────────
 *
 *  users/{uid}
 *    ├─ uid: string
 *    ├─ email: string
 *    ├─ name: string
 *    ├─ phone: string
 *    ├─ avatar: string (url)
 *    ├─ role: 'user' | 'companion' | 'admin'
 *    ├─ plan: 'free' | 'premium'
 *    ├─ planExpiresAt: timestamp | null
 *    ├─ isBlocked: boolean
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  companions/{uid}
 *    ├─ uid: string
 *    ├─ displayName: string
 *    ├─ gender: 'male' | 'female' | 'other'
 *    ├─ age: number
 *    ├─ city: string
 *    ├─ bio: string
 *    ├─ photos: string[]  (urls)
 *    ├─ languages: string[]
 *    ├─ interests: string[]
 *    ├─ hourlyRate: number
 *    ├─ rating: number
 *    ├─ reviewCount: number
 *    ├─ isVerified: boolean (KYC approved)
 *    ├─ isFeatured: boolean
 *    ├─ featuredUntil: timestamp | null
 *    ├─ plan: 'free' | 'premium'
 *    ├─ planExpiresAt: timestamp | null
 *    ├─ bookingsCount: number
 *    ├─ availableDays: string[]
 *    ├─ availableHours: { start: string, end: string }
 *    ├─ isActive: boolean
 *    ├─ isBlocked: boolean
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  kyc/{uid}
 *    ├─ uid: string
 *    ├─ aadhaarNumber: string
 *    ├─ aadhaarFront: string (url)
 *    ├─ aadhaarBack: string (url)
 *    ├─ selfieUrl: string (url)
 *    ├─ status: 'pending' | 'approved' | 'rejected'
 *    ├─ adminNote: string
 *    ├─ submittedAt: timestamp
 *    └─ reviewedAt: timestamp | null
 *
 *  bookings/{bookingId}
 *    ├─ bookingId: string (uuid)
 *    ├─ userId: string
 *    ├─ companionId: string
 *    ├─ userSnapshot: { name, avatar }
 *    ├─ companionSnapshot: { displayName, avatar, city }
 *    ├─ date: string (ISO)
 *    ├─ startTime: string
 *    ├─ endTime: string
 *    ├─ hours: number
 *    ├─ location: string
 *    ├─ occasion: string
 *    ├─ notes: string
 *    ├─ baseRate: number
 *    ├─ surgeMultiplier: number
 *    ├─ totalAmount: number
 *    ├─ status: 'pending_payment' | 'pending_verification' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'
 *    ├─ paymentId: string | null
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  payments/{paymentId}
 *    ├─ paymentId: string
 *    ├─ bookingId: string
 *    ├─ userId: string
 *    ├─ amount: number
 *    ├─ utrNumber: string
 *    ├─ screenshotUrl: string (url)
 *    ├─ status: 'pending' | 'approved' | 'rejected'
 *    ├─ adminNote: string
 *    ├─ submittedAt: timestamp
 *    └─ verifiedAt: timestamp | null
 *
 *  reviews/{reviewId}
 *    ├─ reviewId: string
 *    ├─ bookingId: string
 *    ├─ userId: string
 *    ├─ companionId: string
 *    ├─ rating: number (1-5)
 *    ├─ comment: string
 *    ├─ isVisible: boolean
 *    ├─ createdAt: timestamp
 *    └─ updatedAt: timestamp
 *
 *  reports/{reportId}
 *    ├─ reportId: string
 *    ├─ reportedBy: string (uid)
 *    ├─ reportedUser: string (uid)
 *    ├─ type: 'harassment' | 'inappropriate_behavior' | 'fraud' | 'spam' | 'other'
 *    ├─ description: string
 *    ├─ status: 'open' | 'investigating' | 'resolved' | 'dismissed'
 *    ├─ adminNote: string
 *    ├─ createdAt: timestamp
 *    └─ resolvedAt: timestamp | null
 *
 *  messages/{chatId}/msgs/{msgId}
 *    ├─ chatId: string  (userId_companionId sorted)
 *    ├─ senderId: string
 *    ├─ text: string
 *    ├─ type: 'text' | 'image'
 *    ├─ isRead: boolean
 *    └─ createdAt: timestamp
 */ }),
"[project]/Desktop/companio/contexts/AuthContext.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
// contexts/AuthContext.jsx
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/auth/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__y__as__onAuthStateChanged$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-68602d24.js [client] (ecmascript) <export y as onAuthStateChanged>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__ab__as__signInWithEmailAndPassword$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-68602d24.js [client] (ecmascript) <export ab as signInWithEmailAndPassword>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__aa__as__createUserWithEmailAndPassword$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-68602d24.js [client] (ecmascript) <export aa as createUserWithEmailAndPassword>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__C__as__signOut$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-68602d24.js [client] (ecmascript) <export C as signOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__ak__as__updateProfile$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-68602d24.js [client] (ecmascript) <export ak as updateProfile>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__a5__as__sendPasswordResetEmail$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-68602d24.js [client] (ecmascript) <export a5 as sendPasswordResetEmail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/firebase/firestore/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/@firebase/firestore/dist/index.esm2017.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/lib/firebase.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react-hot-toast/dist/index.mjs [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const unsub = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__y__as__onAuthStateChanged$3e$__["onAuthStateChanged"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["auth"], {
                "AuthProvider.useEffect.unsub": async (firebaseUser)=>{
                    if (firebaseUser) {
                        setUser(firebaseUser);
                        const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'users', firebaseUser.uid));
                        if (snap.exists()) setProfile(snap.data());
                    } else {
                        setUser(null);
                        setProfile(null);
                    }
                    setLoading(false);
                }
            }["AuthProvider.useEffect.unsub"]);
            return unsub;
        }
    }["AuthProvider.useEffect"], []);
    // ── Register ──────────────────────────────────────────
    async function register({ name, email, password, phone, role = 'user' }) {
        const cred = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__aa__as__createUserWithEmailAndPassword$3e$__["createUserWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["auth"], email, password);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__ak__as__updateProfile$3e$__["updateProfile"])(cred.user, {
            displayName: name
        });
        const userData = {
            uid: cred.user.uid,
            name,
            email,
            phone,
            role,
            plan: 'free',
            planExpiresAt: null,
            avatar: '',
            isBlocked: false,
            createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
            updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["setDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'users', cred.user.uid), userData);
        if (role === 'companion') {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["setDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'companions', cred.user.uid), {
                uid: cred.user.uid,
                displayName: name,
                gender: 'other',
                age: 18,
                city: '',
                bio: '',
                photos: [],
                languages: [],
                interests: [],
                hourlyRate: 500,
                rating: 0,
                reviewCount: 0,
                isVerified: false,
                isFeatured: false,
                featuredUntil: null,
                plan: 'free',
                planExpiresAt: null,
                bookingsCount: 0,
                availableDays: [],
                availableHours: {
                    start: '10:00',
                    end: '20:00'
                },
                isActive: false,
                isBlocked: false,
                createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
                updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
            });
        }
        setProfile(userData);
        return cred.user;
    }
    // ── Login ─────────────────────────────────────────────
    async function login(email, password) {
        const cred = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__ab__as__signInWithEmailAndPassword$3e$__["signInWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["auth"], email, password);
        const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'users', cred.user.uid));
        if (snap.exists()) setProfile(snap.data());
        return cred.user;
    }
    // ── Logout ────────────────────────────────────────────
    async function logout() {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__C__as__signOut$3e$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["auth"]);
        setUser(null);
        setProfile(null);
    }
    // ── Password Reset ────────────────────────────────────
    async function resetPassword(email) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm2017$2f$index$2d$68602d24$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__a5__as__sendPasswordResetEmail$3e$__["sendPasswordResetEmail"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["auth"], email);
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["default"].success('Password reset email sent!');
    }
    // ── Refresh profile ───────────────────────────────────
    async function refreshProfile() {
        if (!user) return;
        const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'users', user.uid));
        if (snap.exists()) setProfile(snap.data());
    }
    // ── Update profile ────────────────────────────────────
    async function updateUserProfile(data) {
        if (!user) return;
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$firebase$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'users', user.uid), {
            ...data,
            updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm2017$2e$js__$5b$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
        });
        await refreshProfile();
    }
    const isAdmin = profile?.role === 'admin';
    const isCompanion = profile?.role === 'companion';
    const isPremium = profile?.plan === 'premium';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            profile,
            loading,
            register,
            login,
            logout,
            resetPassword,
            updateUserProfile,
            refreshProfile,
            isAdmin,
            isCompanion,
            isPremium
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/companio/contexts/AuthContext.jsx",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "DYSpA4ZauWKW8e4CNkO4ayA+RbM=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
_s1(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/companio/pages/auth/register.jsx [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/Desktop/companio/pages/auth/register.jsx'\n\nExpected '</', got 'ident'");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/Desktop/companio/pages/auth/login.jsx [client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
// pages/auth/login.jsx
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/contexts/AuthContext.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react-hot-toast/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react-icons/ri/index.mjs [client] (ecmascript)");
// ─── Register Page ────────────────────────────────────────────────────────────
// pages/auth/register.jsx  (combined in same file for brevity – split in prod)
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$pages$2f$auth$2f$register$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/pages/auth/register.jsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
function LoginPage() {
    _s();
    const { login } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        email: '',
        password: ''
    });
    const [show, setShow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!form.email || !form.password) return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["default"].error('Please fill all fields');
        setBusy(true);
        try {
            await login(form.email, form.password);
            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["default"].success('Welcome back!');
            router.push(router.query.next || '/dashboard');
        } catch (err) {
            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["default"].error(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : 'Login failed. Please try again.');
        } finally{
            setBusy(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Sign In – Companio"
                }, void 0, false, {
                    fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                    lineNumber: 35,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthLayout, {
                title: "Welcome Back",
                subtitle: "Sign in to your Companio account",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleSubmit,
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                label: "Email",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiMailLine"], {}, void 0, false, {
                                    fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                    lineNumber: 38,
                                    columnNumber: 38
                                }, this),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "email",
                                    className: "glass-input",
                                    placeholder: "you@example.com",
                                    value: form.email,
                                    onChange: (e)=>setForm((p)=>({
                                                ...p,
                                                email: e.target.value
                                            }))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                    lineNumber: 39,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                label: "Password",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiLockPasswordLine"], {}, void 0, false, {
                                    fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                    lineNumber: 42,
                                    columnNumber: 41
                                }, this),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: show ? 'text' : 'password',
                                            className: "glass-input pr-10",
                                            placeholder: "Your password",
                                            value: form.password,
                                            onChange: (e)=>setForm((p)=>({
                                                        ...p,
                                                        password: e.target.value
                                                    }))
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                            lineNumber: 44,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setShow((p)=>!p),
                                            className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white",
                                            children: show ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiEyeOffLine"], {}, void 0, false, {
                                                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                                lineNumber: 52,
                                                columnNumber: 25
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiEyeLine"], {}, void 0, false, {
                                                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                                lineNumber: 52,
                                                columnNumber: 44
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                            lineNumber: 51,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                    lineNumber: 43,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                lineNumber: 42,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-end",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/auth/forgot-password",
                                    className: "text-xs text-indigo-400 hover:text-indigo-300",
                                    children: "Forgot password?"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                    lineNumber: 58,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                disabled: busy,
                                className: "btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed",
                                children: busy ? 'Signing in…' : 'Sign In'
                            }, void 0, false, {
                                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-center text-sm text-gray-500 mt-4",
                        children: [
                            "Don't have an account?",
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/auth/register",
                                className: "text-indigo-400 hover:text-indigo-300 font-medium",
                                children: "Create one free"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/companio/pages/auth/login.jsx",
                lineNumber: 36,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(LoginPage, "jPZA8GG8DkPGnMMU77EwBS0jrcA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LoginPage;
;
var _c;
__turbopack_context__.k.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/companio/pages/auth/login.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RegisterPage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$pages$2f$auth$2f$register$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"],
    "default",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$pages$2f$auth$2f$login$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$pages$2f$auth$2f$login$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/companio/pages/auth/login.jsx [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$pages$2f$auth$2f$register$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/pages/auth/register.jsx [client] (ecmascript)");
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/Desktop/companio/pages/auth/login.jsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/auth/login";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/Desktop/companio/pages/auth/login.jsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if ("TURBOPACK compile-time truthy", 1) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/Desktop/companio/pages/auth/login.jsx\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/Desktop/companio/pages/auth/login.jsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0_gs6fs._.js.map