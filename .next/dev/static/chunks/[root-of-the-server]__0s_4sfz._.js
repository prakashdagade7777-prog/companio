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
"[project]/Desktop/companio/lib/utils.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "KYC_META",
    ()=>KYC_META,
    "STATUS_META",
    ()=>STATUS_META,
    "avatarPlaceholder",
    ()=>avatarPlaceholder,
    "calculateTotal",
    ()=>calculateTotal,
    "cn",
    ()=>cn,
    "formatCurrency",
    ()=>formatCurrency,
    "formatDate",
    ()=>formatDate,
    "formatDateTime",
    ()=>formatDateTime,
    "getChatId",
    ()=>getChatId,
    "getInitials",
    ()=>getInitials,
    "getSurgeLabel",
    ()=>getSurgeLabel,
    "getSurgeMultiplier",
    ()=>getSurgeMultiplier,
    "renderStars",
    ()=>renderStars,
    "timeAgo",
    ()=>timeAgo,
    "validateAadhaar",
    ()=>validateAadhaar,
    "validateEmail",
    ()=>validateEmail,
    "validatePhone",
    ()=>validatePhone,
    "validateUTR",
    ()=>validateUTR
]);
// lib/utils.js
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/clsx/dist/clsx.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/tailwind-merge/dist/bundle-mjs.mjs [client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function getSurgeMultiplier(date, startTime) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 6=Sat
    const hour = parseInt(startTime?.split(':')[0] ?? 14, 10);
    const isWeekend = day === 0 || day === 6;
    const isEvening = hour >= 18 && hour <= 23;
    const isPeakFriday = day === 5 && hour >= 17;
    if (isWeekend && isEvening) return 1.5;
    if (isWeekend) return 1.25;
    if (isEvening || isPeakFriday) return 1.15;
    return 1.0;
}
function getSurgeLabel(multiplier) {
    if (multiplier >= 1.5) return {
        label: '1.5× Surge',
        color: 'text-rose-400'
    };
    if (multiplier >= 1.25) return {
        label: '1.25× Surge',
        color: 'text-amber-400'
    };
    if (multiplier > 1) return {
        label: '1.15× Surge',
        color: 'text-amber-300'
    };
    return {
        label: 'Standard Rate',
        color: 'text-emerald-400'
    };
}
function calculateTotal(hourlyRate, hours, surgeMultiplier) {
    return Math.round(hourlyRate * hours * surgeMultiplier);
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(new Date(date));
}
function formatDateTime(ts) {
    if (!ts) return '–';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}
function timeAgo(ts) {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return formatDate(d);
}
function renderStars(rating, size = 'sm') {
    const sz = size === 'sm' ? 'text-xs' : 'text-sm';
    return Array.from({
        length: 5
    }, (_, i)=>({
            filled: i < Math.round(rating),
            key: i
        }));
}
function getInitials(name = '') {
    return name.split(' ').map((w)=>w[0]).join('').toUpperCase().slice(0, 2);
}
function getChatId(uid1, uid2) {
    return [
        uid1,
        uid2
    ].sort().join('_');
}
const STATUS_META = {
    pending_payment: {
        label: 'Pending Payment',
        cls: 'status-pending'
    },
    pending_verification: {
        label: 'Under Verification',
        cls: 'status-pending'
    },
    confirmed: {
        label: 'Confirmed',
        cls: 'status-approved'
    },
    completed: {
        label: 'Completed',
        cls: 'status-approved'
    },
    cancelled: {
        label: 'Cancelled',
        cls: 'status-rejected'
    },
    disputed: {
        label: 'Disputed',
        cls: 'status-rejected'
    }
};
const KYC_META = {
    pending: {
        label: 'Pending Review',
        cls: 'status-pending'
    },
    approved: {
        label: 'Approved',
        cls: 'status-approved'
    },
    rejected: {
        label: 'Rejected',
        cls: 'status-rejected'
    }
};
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}
function validateAadhaar(num) {
    return /^\d{12}$/.test(num.replace(/\s/g, ''));
}
function validateUTR(utr) {
    return utr.trim().length >= 12 && utr.trim().length <= 22;
}
function avatarPlaceholder(gender = 'other', seed = '') {
    const styles = {
        female: 'adventurer',
        male: 'avataaars',
        other: 'bottts'
    };
    const style = styles[gender] ?? 'bottts';
    return `https://api.dicebear.com/8.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1e3f`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/companio/components/Navbar.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Navbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
// components/Navbar.jsx
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/contexts/AuthContext.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/lib/utils.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react-icons/ri/index.mjs [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const NAV_LINKS = [
    {
        href: '/companions',
        label: 'Find Companions'
    },
    {
        href: '/how-it-works',
        label: 'How It Works'
    },
    {
        href: '/safety',
        label: 'Safety'
    },
    {
        href: '/pricing',
        label: 'Pricing'
    }
];
function Navbar() {
    _s();
    const { user, profile, logout, isAdmin, isCompanion } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [scrolled, setScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mobileOpen, setMobileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [profileOpen, setProfileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar.useEffect": ()=>{
            const onScroll = {
                "Navbar.useEffect.onScroll": ()=>setScrolled(window.scrollY > 20)
            }["Navbar.useEffect.onScroll"];
            window.addEventListener('scroll', onScroll, {
                passive: true
            });
            return ({
                "Navbar.useEffect": ()=>window.removeEventListener('scroll', onScroll)
            })["Navbar.useEffect"];
        }
    }["Navbar.useEffect"], []);
    // Close menus on route change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar.useEffect": ()=>{
            setMobileOpen(false);
            setProfileOpen(false);
        }
    }["Navbar.useEffect"], [
        router.pathname
    ]);
    const dashboardHref = isAdmin ? '/admin' : isCompanion ? '/dashboard/companion' : '/dashboard';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].nav, {
                initial: {
                    y: -80,
                    opacity: 0
                },
                animate: {
                    y: 0,
                    opacity: 1
                },
                transition: {
                    duration: 0.5,
                    ease: 'easeOut'
                },
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])('fixed top-0 left-0 right-0 z-50 transition-all duration-300', scrolled ? 'glass-nav shadow-lg' : 'bg-transparent'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between h-16",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    className: "flex items-center gap-2.5 group",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative w-9 h-9",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 59,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 60,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "absolute inset-0 flex items-center justify-center text-white font-bold text-sm",
                                                    children: "C"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 61,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                            lineNumber: 58,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-display font-bold text-xl text-white",
                                            children: [
                                                "Companio",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-gradient ml-0.5",
                                                    children: "."
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 65,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                            lineNumber: 63,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                    lineNumber: 57,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "hidden md:flex items-center gap-1",
                                    children: NAV_LINKS.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: link.href,
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])('px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200', router.pathname.startsWith(link.href) ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'),
                                            children: link.label
                                        }, link.href, false, {
                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                            lineNumber: 72,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                    lineNumber: 70,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        !user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/auth/login",
                                                    className: "hidden sm:block btn-ghost text-sm px-4 py-2",
                                                    children: "Sign In"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 91,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/auth/register",
                                                    className: "btn-primary text-sm px-4 py-2",
                                                    children: "Get Started"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 94,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setProfileOpen((p)=>!p),
                                                    className: "flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass hover:border-indigo-500/30 transition-all duration-200",
                                                    children: [
                                                        profile?.avatar ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                            src: profile.avatar,
                                                            alt: "",
                                                            className: "w-7 h-7 rounded-full object-cover"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                            lineNumber: 105,
                                                            columnNumber: 23
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getInitials"])(profile?.name || user.displayName || 'U')
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                            lineNumber: 107,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "hidden sm:block text-sm font-medium text-gray-200 max-w-[100px] truncate",
                                                            children: profile?.name?.split(' ')[0] || 'Account'
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                            lineNumber: 111,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiArrowDownSLine"], {
                                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])('text-gray-400 transition-transform', profileOpen && 'rotate-180')
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                            lineNumber: 114,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 100,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                                    children: profileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                        initial: {
                                                            opacity: 0,
                                                            y: 8,
                                                            scale: 0.95
                                                        },
                                                        animate: {
                                                            opacity: 1,
                                                            y: 0,
                                                            scale: 1
                                                        },
                                                        exit: {
                                                            opacity: 0,
                                                            y: 8,
                                                            scale: 0.95
                                                        },
                                                        transition: {
                                                            duration: 0.15
                                                        },
                                                        className: "absolute right-0 top-full mt-2 w-52 glass-card p-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "px-3 py-2 border-b border-white/5 mb-1",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm font-semibold text-white truncate",
                                                                        children: profile?.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                        lineNumber: 127,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs text-gray-500 truncate",
                                                                        children: user.email
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                        lineNumber: 128,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                lineNumber: 126,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuItem, {
                                                                href: dashboardHref,
                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiDashboardLine"], {}, void 0, false, {
                                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                    lineNumber: 130,
                                                                    columnNumber: 62
                                                                }, this),
                                                                label: "Dashboard"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                lineNumber: 130,
                                                                columnNumber: 25
                                                            }, this),
                                                            isAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuItem, {
                                                                href: "/admin",
                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiAdminLine"], {}, void 0, false, {
                                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                    lineNumber: 131,
                                                                    columnNumber: 67
                                                                }, this),
                                                                label: "Admin Panel"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                lineNumber: 131,
                                                                columnNumber: 37
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuItem, {
                                                                href: "/dashboard/profile",
                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiUserLine"], {}, void 0, false, {
                                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                    lineNumber: 132,
                                                                    columnNumber: 67
                                                                }, this),
                                                                label: "My Profile"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                lineNumber: 132,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuItem, {
                                                                href: "/dashboard/settings",
                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiSettings3Line"], {}, void 0, false, {
                                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                    lineNumber: 133,
                                                                    columnNumber: 68
                                                                }, this),
                                                                label: "Settings"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                lineNumber: 133,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "my-1 divider"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                lineNumber: 134,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: logout,
                                                                className: "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiLogoutBoxLine"], {
                                                                        className: "text-base"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                        lineNumber: 139,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    "Sign Out"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                                lineNumber: 135,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                        lineNumber: 119,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                    lineNumber: 117,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                            lineNumber: 99,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setMobileOpen((p)=>!p),
                                            className: "md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors",
                                            children: mobileOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiCloseLine"], {
                                                size: 22
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                lineNumber: 153,
                                                columnNumber: 31
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiMenuLine"], {
                                                size: 22
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                lineNumber: 153,
                                                columnNumber: 59
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                            lineNumber: 149,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                    lineNumber: 88,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                            lineNumber: 54,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        children: mobileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                height: 0
                            },
                            animate: {
                                opacity: 1,
                                height: 'auto'
                            },
                            exit: {
                                opacity: 0,
                                height: 0
                            },
                            className: "md:hidden glass-nav border-t border-white/5",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-4 space-y-1",
                                children: [
                                    NAV_LINKS.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: link.href,
                                            className: "block px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors",
                                            children: link.label
                                        }, link.href, false, {
                                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                            lineNumber: 170,
                                            columnNumber: 19
                                        }, this)),
                                    !user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pt-3 flex gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/auth/login",
                                                className: "flex-1 btn-ghost text-center",
                                                children: "Sign In"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                lineNumber: 180,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/auth/register",
                                                className: "flex-1 btn-primary text-center",
                                                children: "Get Started"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                                lineNumber: 181,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                        lineNumber: 179,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                                lineNumber: 168,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                            lineNumber: 162,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            profileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-40",
                onClick: ()=>setProfileOpen(false)
            }, void 0, false, {
                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                lineNumber: 192,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
_s(Navbar, "l6B4jmJyJ2R0PkaZZEHN+qmTFgE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Navbar;
function MenuItem({ href, icon, label }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        className: "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-indigo-400 text-base",
                children: icon
            }, void 0, false, {
                fileName: "[project]/Desktop/companio/components/Navbar.jsx",
                lineNumber: 204,
                columnNumber: 7
            }, this),
            label
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/companio/components/Navbar.jsx",
        lineNumber: 200,
        columnNumber: 5
    }, this);
}
_c1 = MenuItem;
var _c, _c1;
__turbopack_context__.k.register(_c, "Navbar");
__turbopack_context__.k.register(_c1, "MenuItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/companio/components/Footer.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Footer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
// components/Footer.jsx
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react-icons/ri/index.mjs [client] (ecmascript)");
;
;
;
const LINKS = {
    Company: [
        [
            'About',
            '/about'
        ],
        [
            'Careers',
            '/careers'
        ],
        [
            'Blog',
            '/blog'
        ],
        [
            'Press',
            '/press'
        ]
    ],
    Platform: [
        [
            'Browse Companions',
            '/companions'
        ],
        [
            'Become a Companion',
            '/auth/register?role=companion'
        ],
        [
            'How It Works',
            '/how-it-works'
        ],
        [
            'Pricing',
            '/pricing'
        ]
    ],
    Safety: [
        [
            'Trust & Safety',
            '/safety'
        ],
        [
            'Report Abuse',
            '/report'
        ],
        [
            'Community Guidelines',
            '/guidelines'
        ],
        [
            'KYC Policy',
            '/kyc-policy'
        ]
    ],
    Support: [
        [
            'Help Center',
            '/help'
        ],
        [
            'Contact Us',
            '/contact'
        ],
        [
            'Terms of Service',
            '/terms'
        ],
        [
            'Privacy Policy',
            '/privacy'
        ]
    ]
};
function Footer() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
        className: "border-t border-white/5 mt-24",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "col-span-2 md:col-span-3 lg:col-span-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    className: "flex items-center gap-2 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm",
                                            children: "C"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                            lineNumber: 21,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-display font-bold text-lg text-white",
                                            children: "Companio"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                            lineNumber: 22,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                    lineNumber: 20,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500 leading-relaxed mb-4",
                                    children: "Safe, verified social companionship for meaningful experiences. No adult services. Ever."
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                    lineNumber: 24,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-1.5 text-emerald-400 text-xs font-semibold",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiShieldCheckLine"], {
                                            className: "text-base"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                            lineNumber: 28,
                                            columnNumber: 15
                                        }, this),
                                        "Safe Social Companionship Only"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                    lineNumber: 27,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-3 mt-5",
                                    children: [
                                        [
                                            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiInstagramLine"],
                                            '#'
                                        ],
                                        [
                                            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiTwitterXLine"],
                                            '#'
                                        ],
                                        [
                                            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiLinkedinBoxLine"],
                                            '#'
                                        ]
                                    ].map(([Icon, href], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: href,
                                            className: "w-8 h-8 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white hover:border-indigo-500/30 transition-all duration-200",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                className: "text-base"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                                lineNumber: 34,
                                                columnNumber: 19
                                            }, this)
                                        }, i, false, {
                                            fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                            lineNumber: 33,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                    lineNumber: 31,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/companio/components/Footer.jsx",
                            lineNumber: 19,
                            columnNumber: 11
                        }, this),
                        Object.entries(LINKS).map(([title, links])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: "text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4",
                                        children: title
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                        lineNumber: 43,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2.5",
                                        children: links.map(([label, href])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: href,
                                                    className: "text-sm text-gray-400 hover:text-white transition-colors duration-200",
                                                    children: label
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                                    lineNumber: 47,
                                                    columnNumber: 21
                                                }, this)
                                            }, label, false, {
                                                fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                                lineNumber: 46,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                        lineNumber: 44,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, title, true, {
                                fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                lineNumber: 42,
                                columnNumber: 13
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                    lineNumber: 17,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/companio/components/Footer.jsx",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-t border-white/5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-600",
                            children: [
                                "© ",
                                new Date().getFullYear(),
                                " Companio Technologies Pvt. Ltd. All rights reserved."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/companio/components/Footer.jsx",
                            lineNumber: 61,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs text-gray-600",
                                    children: "🇮🇳 Made in India"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                    lineNumber: 63,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "w-1 h-1 rounded-full bg-gray-700"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                    lineNumber: 64,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-semibold text-emerald-600",
                                    children: "🚫 No Adult Services"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                                    lineNumber: 65,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/companio/components/Footer.jsx",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/companio/components/Footer.jsx",
                    lineNumber: 60,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/companio/components/Footer.jsx",
                lineNumber: 59,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/companio/components/Footer.jsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
_c = Footer;
var _c;
__turbopack_context__.k.register(_c, "Footer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/companio/components/TrustBanner.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TrustBadges",
    ()=>TrustBadges,
    "default",
    ()=>TrustBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react-icons/ri/index.mjs [client] (ecmascript)");
// components/TrustBanner.jsx
"use client";
;
;
;
const ITEMS = [
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiShieldCheckLine"], {}, void 0, false, {
            fileName: "[project]/Desktop/companio/components/TrustBanner.js",
            lineNumber: 7,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0)),
        label: '🚫 No Adult Services – Ever'
    },
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiVerifiedBadgeLine"], {}, void 0, false, {
            fileName: "[project]/Desktop/companio/components/TrustBanner.js",
            lineNumber: 8,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0)),
        label: 'KYC Verified Companions Only'
    },
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiHeartLine"], {}, void 0, false, {
            fileName: "[project]/Desktop/companio/components/TrustBanner.js",
            lineNumber: 9,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0)),
        label: 'Safe Social Companionship Only'
    },
    {
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RiShieldCheckLine"], {}, void 0, false, {
            fileName: "[project]/Desktop/companio/components/TrustBanner.js",
            lineNumber: 10,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0)),
        label: '24/7 Safety Monitoring'
    }
];
function TrustBanner({ className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `trust-strip py-2.5 overflow-hidden ${className}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
            className: "flex gap-12 items-center",
            animate: {
                x: [
                    '0%',
                    '-50%'
                ]
            },
            transition: {
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
            },
            children: [
                ...ITEMS,
                ...ITEMS
            ].map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-emerald-400 shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-base",
                            children: item.icon
                        }, void 0, false, {
                            fileName: "[project]/Desktop/companio/components/TrustBanner.js",
                            lineNumber: 23,
                            columnNumber: 13
                        }, this),
                        item.label,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "w-1.5 h-1.5 rounded-full bg-emerald-500/60 ml-4"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/companio/components/TrustBanner.js",
                            lineNumber: 25,
                            columnNumber: 13
                        }, this)
                    ]
                }, i, true, {
                    fileName: "[project]/Desktop/companio/components/TrustBanner.js",
                    lineNumber: 22,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/Desktop/companio/components/TrustBanner.js",
            lineNumber: 16,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/companio/components/TrustBanner.js",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_c = TrustBanner;
function TrustBadges() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-wrap gap-3 justify-center",
        children: [
            {
                icon: '🚫',
                text: 'No Adult Services'
            },
            {
                icon: '✅',
                text: 'KYC Verified'
            },
            {
                icon: '🛡️',
                text: 'Safe & Monitored'
            },
            {
                icon: '⭐',
                text: 'Rated & Reviewed'
            }
        ].map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-semibold text-emerald-400 border border-emerald-500/20",
                children: [
                    b.icon,
                    " ",
                    b.text
                ]
            }, b.text, true, {
                fileName: "[project]/Desktop/companio/components/TrustBanner.js",
                lineNumber: 43,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/Desktop/companio/components/TrustBanner.js",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c1 = TrustBadges;
var _c, _c1;
__turbopack_context__.k.register(_c, "TrustBanner");
__turbopack_context__.k.register(_c1, "TrustBadges");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/companio/pages/_app.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pages/_app.jsx
__turbopack_context__.s([
    "default",
    ()=>App
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/node_modules/react-hot-toast/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/contexts/AuthContext.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$components$2f$Navbar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/components/Navbar.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$components$2f$Footer$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/components/Footer.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$components$2f$TrustBanner$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/companio/components/TrustBanner.js [client] (ecmascript)");
;
;
;
;
;
;
;
;
// Pages that use the admin layout (no public nav/footer)
const ADMIN_PAGES = [
    '/admin'
];
const NO_NAV_PAGES = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password'
];
function App({ Component, pageProps, router }) {
    const path = router.pathname;
    const isAdmin = path.startsWith('/admin');
    const isAuth = NO_NAV_PAGES.some((p)=>path.startsWith(p));
    const showPublicNav = !isAdmin && !isAuth;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$contexts$2f$AuthContext$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AuthProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-brand-black noise",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "fixed inset-0 mesh-bg pointer-events-none",
                    "aria-hidden": true
                }, void 0, false, {
                    fileName: "[project]/Desktop/companio/pages/_app.jsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                showPublicNav && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$components$2f$Navbar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/Desktop/companio/pages/_app.jsx",
                    lineNumber: 26,
                    columnNumber: 27
                }, this),
                showPublicNav && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
                }, void 0, false, {
                    fileName: "[project]/Desktop/companio/pages/_app.jsx",
                    lineNumber: 29,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                    className: showPublicNav ? 'pt-16' : '',
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Component, {
                        ...pageProps
                    }, void 0, false, {
                        fileName: "[project]/Desktop/companio/pages/_app.jsx",
                        lineNumber: 35,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Desktop/companio/pages/_app.jsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this),
                showPublicNav && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$components$2f$Footer$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/Desktop/companio/pages/_app.jsx",
                    lineNumber: 38,
                    columnNumber: 27
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$companio$2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Toaster"], {
                    position: "top-right",
                    toastOptions: {
                        style: {
                            background: '#16162a',
                            color: '#f8f8ff',
                            border: '1px solid rgba(99,102,241,0.20)',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem'
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff'
                            }
                        },
                        error: {
                            iconTheme: {
                                primary: '#f43f5e',
                                secondary: '#fff'
                            }
                        }
                    }
                }, void 0, false, {
                    fileName: "[project]/Desktop/companio/pages/_app.jsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/companio/pages/_app.jsx",
            lineNumber: 22,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/companio/pages/_app.jsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
_c = App;
var _c;
__turbopack_context__.k.register(_c, "App");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/Desktop/companio/pages/_app.jsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/_app";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/Desktop/companio/pages/_app.jsx [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/Desktop/companio/pages/_app\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/Desktop/companio/pages/_app.jsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0s_4sfz._.js.map