/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fe=function(e){const t=[];let n=0;for(let r=0;r<e.length;r++){let o=e.charCodeAt(r);o<128?t[n++]=o:o<2048?(t[n++]=o>>6|192,t[n++]=o&63|128):(o&64512)===55296&&r+1<e.length&&(e.charCodeAt(r+1)&64512)===56320?(o=65536+((o&1023)<<10)+(e.charCodeAt(++r)&1023),t[n++]=o>>18|240,t[n++]=o>>12&63|128,t[n++]=o>>6&63|128,t[n++]=o&63|128):(t[n++]=o>>12|224,t[n++]=o>>6&63|128,t[n++]=o&63|128)}return t},Tt=function(e){const t=[];let n=0,r=0;for(;n<e.length;){const o=e[n++];if(o<128)t[r++]=String.fromCharCode(o);else if(o>191&&o<224){const s=e[n++];t[r++]=String.fromCharCode((o&31)<<6|s&63)}else if(o>239&&o<365){const s=e[n++],a=e[n++],u=e[n++],c=((o&7)<<18|(s&63)<<12|(a&63)<<6|u&63)-65536;t[r++]=String.fromCharCode(55296+(c>>10)),t[r++]=String.fromCharCode(56320+(c&1023))}else{const s=e[n++],a=e[n++];t[r++]=String.fromCharCode((o&15)<<12|(s&63)<<6|a&63)}}return t.join("")},Dt={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let o=0;o<e.length;o+=3){const s=e[o],a=o+1<e.length,u=a?e[o+1]:0,c=o+2<e.length,i=c?e[o+2]:0,B=s>>2,D=(s&3)<<4|u>>4;let k=(u&15)<<2|i>>6,v=i&63;c||(v=64,a||(k=64)),r.push(n[B],n[D],n[k],n[v])}return r.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(Fe(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):Tt(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let o=0;o<e.length;){const s=n[e.charAt(o++)],u=o<e.length?n[e.charAt(o)]:0;++o;const i=o<e.length?n[e.charAt(o)]:64;++o;const D=o<e.length?n[e.charAt(o)]:64;if(++o,s==null||u==null||i==null||D==null)throw new At;const k=s<<2|u>>4;if(r.push(k),i!==64){const v=u<<4&240|i>>2;if(r.push(v),D!==64){const St=i<<6&192|D;r.push(St)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class At extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const _t=function(e){const t=Fe(e);return Dt.encodeByteArray(t,!0)},He=function(e){return _t(e).replace(/\./g,"")};function Ct(){try{return typeof indexedDB=="object"}catch{return!1}}function Bt(){return new Promise((e,t)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",o=self.indexedDB.open(r);o.onsuccess=()=>{o.result.close(),n||self.indexedDB.deleteDatabase(r),e(!0)},o.onupgradeneeded=()=>{n=!1},o.onerror=()=>{var s;t(((s=o.error)==null?void 0:s.message)||"")}}catch(n){t(n)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kt="FirebaseError";class T extends Error{constructor(t,n,r){super(n),this.code=t,this.customData=r,this.name=kt,Object.setPrototypeOf(this,T.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,M.prototype.create)}}class M{constructor(t,n,r){this.service=t,this.serviceName=n,this.errors=r}create(t,...n){const r=n[0]||{},o=`${this.service}/${t}`,s=this.errors[t],a=s?vt(s,r):"Error",u=`${this.serviceName}: ${a} (${o}).`;return new T(o,u,r)}}function vt(e,t){return e.replace($t,(n,r)=>{const o=t[r];return o!=null?String(o):`<${r}?>`})}const $t=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mt(e){return e&&e._delegate?e._delegate:e}class y{constructor(t,n,r){this.name=t,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var d;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(d||(d={}));const Nt={debug:d.DEBUG,verbose:d.VERBOSE,info:d.INFO,warn:d.WARN,error:d.ERROR,silent:d.SILENT},Ot=d.INFO,Rt={[d.DEBUG]:"log",[d.VERBOSE]:"log",[d.INFO]:"info",[d.WARN]:"warn",[d.ERROR]:"error"},Pt=(e,t,...n)=>{if(t<e.logLevel)return;const r=new Date().toISOString(),o=Rt[t];if(o)console[o](`[${r}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class Lt{constructor(t){this.name=t,this._logLevel=Ot,this._logHandler=Pt,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in d))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?Nt[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,d.DEBUG,...t),this._logHandler(this,d.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,d.VERBOSE,...t),this._logHandler(this,d.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,d.INFO,...t),this._logHandler(this,d.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,d.WARN,...t),this._logHandler(this,d.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,d.ERROR,...t),this._logHandler(this,d.ERROR,...t)}}const xt=(e,t)=>t.some(n=>e instanceof n);let be,me;function Vt(){return be||(be=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Ft(){return me||(me=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const je=new WeakMap,X=new WeakMap,We=new WeakMap,R=new WeakMap,se=new WeakMap;function Ht(e){const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("success",s),e.removeEventListener("error",a)},s=()=>{n(g(e.result)),o()},a=()=>{r(e.error),o()};e.addEventListener("success",s),e.addEventListener("error",a)});return t.then(n=>{n instanceof IDBCursor&&je.set(n,e)}).catch(()=>{}),se.set(t,e),t}function jt(e){if(X.has(e))return;const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("complete",s),e.removeEventListener("error",a),e.removeEventListener("abort",a)},s=()=>{n(),o()},a=()=>{r(e.error||new DOMException("AbortError","AbortError")),o()};e.addEventListener("complete",s),e.addEventListener("error",a),e.addEventListener("abort",a)});X.set(e,t)}let Q={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return X.get(e);if(t==="objectStoreNames")return e.objectStoreNames||We.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return g(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function Wt(e){Q=e(Q)}function Kt(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const r=e.call(P(this),t,...n);return We.set(r,t.sort?t.sort():[t]),g(r)}:Ft().includes(e)?function(...t){return e.apply(P(this),t),g(je.get(this))}:function(...t){return g(e.apply(P(this),t))}}function Ut(e){return typeof e=="function"?Kt(e):(e instanceof IDBTransaction&&jt(e),xt(e,Vt())?new Proxy(e,Q):e)}function g(e){if(e instanceof IDBRequest)return Ht(e);if(R.has(e))return R.get(e);const t=Ut(e);return t!==e&&(R.set(e,t),se.set(t,e)),t}const P=e=>se.get(e);function qt(e,t,{blocked:n,upgrade:r,blocking:o,terminated:s}={}){const a=indexedDB.open(e,t),u=g(a);return r&&a.addEventListener("upgradeneeded",c=>{r(g(a.result),c.oldVersion,c.newVersion,g(a.transaction),c)}),n&&a.addEventListener("blocked",c=>n(c.oldVersion,c.newVersion,c)),u.then(c=>{s&&c.addEventListener("close",()=>s()),o&&c.addEventListener("versionchange",i=>o(i.oldVersion,i.newVersion,i))}).catch(()=>{}),u}const Gt=["get","getKey","getAll","getAllKeys","count"],Jt=["put","add","delete","clear"],L=new Map;function we(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(L.get(t))return L.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=Jt.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(o||Gt.includes(n)))return;const s=async function(a,...u){const c=this.transaction(a,o?"readwrite":"readonly");let i=c.store;return r&&(i=i.index(u.shift())),(await Promise.all([i[n](...u),o&&c.done]))[0]};return L.set(t,s),s}Wt(e=>({...e,get:(t,n,r)=>we(t,n)||e.get(t,n,r),has:(t,n)=>!!we(t,n)||e.has(t,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yt{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(zt(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function zt(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Z="@firebase/app",ye="0.14.5";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const p=new Lt("@firebase/app"),Xt="@firebase/app-compat",Qt="@firebase/analytics-compat",Zt="@firebase/analytics",en="@firebase/app-check-compat",tn="@firebase/app-check",nn="@firebase/auth",rn="@firebase/auth-compat",on="@firebase/database",sn="@firebase/data-connect",an="@firebase/database-compat",cn="@firebase/functions",un="@firebase/functions-compat",dn="@firebase/installations",fn="@firebase/installations-compat",ln="@firebase/messaging",hn="@firebase/messaging-compat",pn="@firebase/performance",gn="@firebase/performance-compat",bn="@firebase/remote-config",mn="@firebase/remote-config-compat",wn="@firebase/storage",yn="@firebase/storage-compat",En="@firebase/firestore",In="@firebase/ai",Sn="@firebase/firestore-compat",Tn="firebase",Dn={[Z]:"fire-core",[Xt]:"fire-core-compat",[Zt]:"fire-analytics",[Qt]:"fire-analytics-compat",[tn]:"fire-app-check",[en]:"fire-app-check-compat",[nn]:"fire-auth",[rn]:"fire-auth-compat",[on]:"fire-rtdb",[sn]:"fire-data-connect",[an]:"fire-rtdb-compat",[cn]:"fire-fn",[un]:"fire-fn-compat",[dn]:"fire-iid",[fn]:"fire-iid-compat",[ln]:"fire-fcm",[hn]:"fire-fcm-compat",[pn]:"fire-perf",[gn]:"fire-perf-compat",[bn]:"fire-rc",[mn]:"fire-rc-compat",[wn]:"fire-gcs",[yn]:"fire-gcs-compat",[En]:"fire-fst",[Sn]:"fire-fst-compat",[In]:"fire-vertex","fire-js":"fire-js",[Tn]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const An=new Map,_n=new Map,Ee=new Map;function Ie(e,t){try{e.container.addComponent(t)}catch(n){p.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function E(e){const t=e.name;if(Ee.has(t))return p.debug(`There were multiple attempts to register component ${t}.`),!1;Ee.set(t,e);for(const n of An.values())Ie(n,e);for(const n of _n.values())Ie(n,e);return!0}function Ke(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cn={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},ae=new M("app","Firebase",Cn);function w(e,t,n){let r=Dn[e]??e;n&&(r+=`-${n}`);const o=r.match(/\s|\//),s=t.match(/\s|\//);if(o||s){const a=[`Unable to register library "${r}" with version "${t}":`];o&&a.push(`library name "${r}" contains illegal characters (whitespace or "/")`),o&&s&&a.push("and"),s&&a.push(`version name "${t}" contains illegal characters (whitespace or "/")`),p.warn(a.join(" "));return}E(new y(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bn="firebase-heartbeat-database",kn=1,A="firebase-heartbeat-store";let x=null;function Ue(){return x||(x=qt(Bn,kn,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(A)}catch(n){console.warn(n)}}}}).catch(e=>{throw ae.create("idb-open",{originalErrorMessage:e.message})})),x}async function vn(e){try{const n=(await Ue()).transaction(A),r=await n.objectStore(A).get(qe(e));return await n.done,r}catch(t){if(t instanceof T)p.warn(t.message);else{const n=ae.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});p.warn(n.message)}}}async function Se(e,t){try{const r=(await Ue()).transaction(A,"readwrite");await r.objectStore(A).put(t,qe(e)),await r.done}catch(n){if(n instanceof T)p.warn(n.message);else{const r=ae.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});p.warn(r.message)}}}function qe(e){return`${e.name}!${e.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $n=1024,Mn=30;class Nn{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new Rn(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,n;try{const o=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=Te();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(a=>a.date===s))return;if(this._heartbeatsCache.heartbeats.push({date:s,agent:o}),this._heartbeatsCache.heartbeats.length>Mn){const a=Pn(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){p.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=Te(),{heartbeatsToSend:r,unsentEntries:o}=On(this._heartbeatsCache.heartbeats),s=He(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,o.length>0?(this._heartbeatsCache.heartbeats=o,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(n){return p.warn(n),""}}}function Te(){return new Date().toISOString().substring(0,10)}function On(e,t=$n){const n=[];let r=e.slice();for(const o of e){const s=n.find(a=>a.agent===o.agent);if(s){if(s.dates.push(o.date),De(n)>t){s.dates.pop();break}}else if(n.push({agent:o.agent,dates:[o.date]}),De(n)>t){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class Rn{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Ct()?Bt().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await vn(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return Se(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return Se(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function De(e){return He(JSON.stringify({version:2,heartbeats:e})).length}function Pn(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let r=1;r<e.length;r++)e[r].date<n&&(n=e[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ln(e){E(new y("platform-logger",t=>new Yt(t),"PRIVATE")),E(new y("heartbeat",t=>new Nn(t),"PRIVATE")),w(Z,ye,e),w(Z,ye,"esm2020"),w("fire-js","")}Ln("");const xn=(e,t)=>t.some(n=>e instanceof n);let Ae,_e;function Vn(){return Ae||(Ae=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Fn(){return _e||(_e=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Ge=new WeakMap,ee=new WeakMap,Je=new WeakMap,V=new WeakMap,ie=new WeakMap;function Hn(e){const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("success",s),e.removeEventListener("error",a)},s=()=>{n(b(e.result)),o()},a=()=>{r(e.error),o()};e.addEventListener("success",s),e.addEventListener("error",a)});return t.then(n=>{n instanceof IDBCursor&&Ge.set(n,e)}).catch(()=>{}),ie.set(t,e),t}function jn(e){if(ee.has(e))return;const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("complete",s),e.removeEventListener("error",a),e.removeEventListener("abort",a)},s=()=>{n(),o()},a=()=>{r(e.error||new DOMException("AbortError","AbortError")),o()};e.addEventListener("complete",s),e.addEventListener("error",a),e.addEventListener("abort",a)});ee.set(e,t)}let te={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return ee.get(e);if(t==="objectStoreNames")return e.objectStoreNames||Je.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return b(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function Wn(e){te=e(te)}function Kn(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const r=e.call(F(this),t,...n);return Je.set(r,t.sort?t.sort():[t]),b(r)}:Fn().includes(e)?function(...t){return e.apply(F(this),t),b(Ge.get(this))}:function(...t){return b(e.apply(F(this),t))}}function Un(e){return typeof e=="function"?Kn(e):(e instanceof IDBTransaction&&jn(e),xn(e,Vn())?new Proxy(e,te):e)}function b(e){if(e instanceof IDBRequest)return Hn(e);if(V.has(e))return V.get(e);const t=Un(e);return t!==e&&(V.set(e,t),ie.set(t,e)),t}const F=e=>ie.get(e);function qn(e,t,{blocked:n,upgrade:r,blocking:o,terminated:s}={}){const a=indexedDB.open(e,t),u=b(a);return r&&a.addEventListener("upgradeneeded",c=>{r(b(a.result),c.oldVersion,c.newVersion,b(a.transaction),c)}),n&&a.addEventListener("blocked",c=>n(c.oldVersion,c.newVersion,c)),u.then(c=>{s&&c.addEventListener("close",()=>s()),o&&c.addEventListener("versionchange",i=>o(i.oldVersion,i.newVersion,i))}).catch(()=>{}),u}const Gn=["get","getKey","getAll","getAllKeys","count"],Jn=["put","add","delete","clear"],H=new Map;function Ce(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(H.get(t))return H.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=Jn.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(o||Gn.includes(n)))return;const s=async function(a,...u){const c=this.transaction(a,o?"readwrite":"readonly");let i=c.store;return r&&(i=i.index(u.shift())),(await Promise.all([i[n](...u),o&&c.done]))[0]};return H.set(t,s),s}Wn(e=>({...e,get:(t,n,r)=>Ce(t,n)||e.get(t,n,r),has:(t,n)=>!!Ce(t,n)||e.has(t,n)}));const Ye="@firebase/installations",ce="0.6.19";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ze=1e4,Xe=`w:${ce}`,Qe="FIS_v2",Yn="https://firebaseinstallations.googleapis.com/v1",zn=60*60*1e3,Xn="installations",Qn="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zn={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},I=new M(Xn,Qn,Zn);function Ze(e){return e instanceof T&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function et({projectId:e}){return`${Yn}/projects/${e}/installations`}function tt(e){return{token:e.token,requestStatus:2,expiresIn:tr(e.expiresIn),creationTime:Date.now()}}async function nt(e,t){const r=(await t.json()).error;return I.create("request-failed",{requestName:e,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function rt({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function er(e,{refreshToken:t}){const n=rt(e);return n.append("Authorization",nr(t)),n}async function ot(e){const t=await e();return t.status>=500&&t.status<600?e():t}function tr(e){return Number(e.replace("s","000"))}function nr(e){return`${Qe} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function rr({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const r=et(e),o=rt(e),s=t.getImmediate({optional:!0});if(s){const i=await s.getHeartbeatsHeader();i&&o.append("x-firebase-client",i)}const a={fid:n,authVersion:Qe,appId:e.appId,sdkVersion:Xe},u={method:"POST",headers:o,body:JSON.stringify(a)},c=await ot(()=>fetch(r,u));if(c.ok){const i=await c.json();return{fid:i.fid||n,registrationStatus:2,refreshToken:i.refreshToken,authToken:tt(i.authToken)}}else throw await nt("Create Installation",c)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function st(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function or(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sr=/^[cdef][\w-]{21}$/,ne="";function ar(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=ir(e);return sr.test(n)?n:ne}catch{return ne}}function ir(e){return or(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function N(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const at=new Map;function it(e,t){const n=N(e);ct(n,t),cr(n,t)}function ct(e,t){const n=at.get(e);if(n)for(const r of n)r(t)}function cr(e,t){const n=ur();n&&n.postMessage({key:e,fid:t}),dr()}let m=null;function ur(){return!m&&"BroadcastChannel"in self&&(m=new BroadcastChannel("[Firebase] FID Change"),m.onmessage=e=>{ct(e.data.key,e.data.fid)}),m}function dr(){at.size===0&&m&&(m.close(),m=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fr="firebase-installations-database",lr=1,S="firebase-installations-store";let j=null;function ue(){return j||(j=qn(fr,lr,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(S)}}})),j}async function $(e,t){const n=N(e),o=(await ue()).transaction(S,"readwrite"),s=o.objectStore(S),a=await s.get(n);return await s.put(t,n),await o.done,(!a||a.fid!==t.fid)&&it(e,t.fid),t}async function ut(e){const t=N(e),r=(await ue()).transaction(S,"readwrite");await r.objectStore(S).delete(t),await r.done}async function O(e,t){const n=N(e),o=(await ue()).transaction(S,"readwrite"),s=o.objectStore(S),a=await s.get(n),u=t(a);return u===void 0?await s.delete(n):await s.put(u,n),await o.done,u&&(!a||a.fid!==u.fid)&&it(e,u.fid),u}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function de(e){let t;const n=await O(e.appConfig,r=>{const o=hr(r),s=pr(e,o);return t=s.registrationPromise,s.installationEntry});return n.fid===ne?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function hr(e){const t=e||{fid:ar(),registrationStatus:0};return dt(t)}function pr(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const o=Promise.reject(I.create("app-offline"));return{installationEntry:t,registrationPromise:o}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},r=gr(e,n);return{installationEntry:n,registrationPromise:r}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:br(e)}:{installationEntry:t}}async function gr(e,t){try{const n=await rr(e,t);return $(e.appConfig,n)}catch(n){throw Ze(n)&&n.customData.serverCode===409?await ut(e.appConfig):await $(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function br(e){let t=await Be(e.appConfig);for(;t.registrationStatus===1;)await st(100),t=await Be(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:r}=await de(e);return r||n}return t}function Be(e){return O(e,t=>{if(!t)throw I.create("installation-not-found");return dt(t)})}function dt(e){return mr(e)?{fid:e.fid,registrationStatus:0}:e}function mr(e){return e.registrationStatus===1&&e.registrationTime+ze<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function wr({appConfig:e,heartbeatServiceProvider:t},n){const r=yr(e,n),o=er(e,n),s=t.getImmediate({optional:!0});if(s){const i=await s.getHeartbeatsHeader();i&&o.append("x-firebase-client",i)}const a={installation:{sdkVersion:Xe,appId:e.appId}},u={method:"POST",headers:o,body:JSON.stringify(a)},c=await ot(()=>fetch(r,u));if(c.ok){const i=await c.json();return tt(i)}else throw await nt("Generate Auth Token",c)}function yr(e,{fid:t}){return`${et(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function fe(e,t=!1){let n;const r=await O(e.appConfig,s=>{if(!ft(s))throw I.create("not-registered");const a=s.authToken;if(!t&&Sr(a))return s;if(a.requestStatus===1)return n=Er(e,t),s;{if(!navigator.onLine)throw I.create("app-offline");const u=Dr(s);return n=Ir(e,u),u}});return n?await n:r.authToken}async function Er(e,t){let n=await ke(e.appConfig);for(;n.authToken.requestStatus===1;)await st(100),n=await ke(e.appConfig);const r=n.authToken;return r.requestStatus===0?fe(e,t):r}function ke(e){return O(e,t=>{if(!ft(t))throw I.create("not-registered");const n=t.authToken;return Ar(n)?{...t,authToken:{requestStatus:0}}:t})}async function Ir(e,t){try{const n=await wr(e,t),r={...t,authToken:n};return await $(e.appConfig,r),n}catch(n){if(Ze(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await ut(e.appConfig);else{const r={...t,authToken:{requestStatus:0}};await $(e.appConfig,r)}throw n}}function ft(e){return e!==void 0&&e.registrationStatus===2}function Sr(e){return e.requestStatus===2&&!Tr(e)}function Tr(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+zn}function Dr(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function Ar(e){return e.requestStatus===1&&e.requestTime+ze<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _r(e){const t=e,{installationEntry:n,registrationPromise:r}=await de(t);return r?r.catch(console.error):fe(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Cr(e,t=!1){const n=e;return await Br(n),(await fe(n,t)).token}async function Br(e){const{registrationPromise:t}=await de(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kr(e){if(!e||!e.options)throw W("App Configuration");if(!e.name)throw W("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw W(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function W(e){return I.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lt="installations",vr="installations-internal",$r=e=>{const t=e.getProvider("app").getImmediate(),n=kr(t),r=Ke(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},Mr=e=>{const t=e.getProvider("app").getImmediate(),n=Ke(t,lt).getImmediate();return{getId:()=>_r(n),getToken:o=>Cr(n,o)}};function Nr(){E(new y(lt,$r,"PUBLIC")),E(new y(vr,Mr,"PRIVATE"))}Nr();w(Ye,ce);w(Ye,ce,"esm2020");const Or=(e,t)=>t.some(n=>e instanceof n);let ve,$e;function Rr(){return ve||(ve=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Pr(){return $e||($e=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const ht=new WeakMap,re=new WeakMap,pt=new WeakMap,K=new WeakMap,le=new WeakMap;function Lr(e){const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("success",s),e.removeEventListener("error",a)},s=()=>{n(h(e.result)),o()},a=()=>{r(e.error),o()};e.addEventListener("success",s),e.addEventListener("error",a)});return t.then(n=>{n instanceof IDBCursor&&ht.set(n,e)}).catch(()=>{}),le.set(t,e),t}function xr(e){if(re.has(e))return;const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("complete",s),e.removeEventListener("error",a),e.removeEventListener("abort",a)},s=()=>{n(),o()},a=()=>{r(e.error||new DOMException("AbortError","AbortError")),o()};e.addEventListener("complete",s),e.addEventListener("error",a),e.addEventListener("abort",a)});re.set(e,t)}let oe={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return re.get(e);if(t==="objectStoreNames")return e.objectStoreNames||pt.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return h(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function Vr(e){oe=e(oe)}function Fr(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const r=e.call(U(this),t,...n);return pt.set(r,t.sort?t.sort():[t]),h(r)}:Pr().includes(e)?function(...t){return e.apply(U(this),t),h(ht.get(this))}:function(...t){return h(e.apply(U(this),t))}}function Hr(e){return typeof e=="function"?Fr(e):(e instanceof IDBTransaction&&xr(e),Or(e,Rr())?new Proxy(e,oe):e)}function h(e){if(e instanceof IDBRequest)return Lr(e);if(K.has(e))return K.get(e);const t=Hr(e);return t!==e&&(K.set(e,t),le.set(t,e)),t}const U=e=>le.get(e);function gt(e,t,{blocked:n,upgrade:r,blocking:o,terminated:s}={}){const a=indexedDB.open(e,t),u=h(a);return r&&a.addEventListener("upgradeneeded",c=>{r(h(a.result),c.oldVersion,c.newVersion,h(a.transaction),c)}),n&&a.addEventListener("blocked",c=>n(c.oldVersion,c.newVersion,c)),u.then(c=>{s&&c.addEventListener("close",()=>s()),o&&c.addEventListener("versionchange",i=>o(i.oldVersion,i.newVersion,i))}).catch(()=>{}),u}function q(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",r=>t(r.oldVersion,r)),h(n).then(()=>{})}const jr=["get","getKey","getAll","getAllKeys","count"],Wr=["put","add","delete","clear"],G=new Map;function Me(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(G.get(t))return G.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=Wr.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(o||jr.includes(n)))return;const s=async function(a,...u){const c=this.transaction(a,o?"readwrite":"readonly");let i=c.store;return r&&(i=i.index(u.shift())),(await Promise.all([i[n](...u),o&&c.done]))[0]};return G.set(t,s),s}Vr(e=>({...e,get:(t,n,r)=>Me(t,n)||e.get(t,n,r),has:(t,n)=>!!Me(t,n)||e.has(t,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kr="/firebase-messaging-sw.js",Ur="/firebase-cloud-messaging-push-scope",bt="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",qr="https://fcmregistrations.googleapis.com/v1",mt="google.c.a.c_id",Gr="google.c.a.c_l",Jr="google.c.a.ts",Yr="google.c.a.e",Ne=1e4;var Oe;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(Oe||(Oe={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var _;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(_||(_={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function l(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function zr(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),r=atob(n),o=new Uint8Array(r.length);for(let s=0;s<r.length;++s)o[s]=r.charCodeAt(s);return o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const J="fcm_token_details_db",Xr=5,Re="fcm_token_object_Store";async function Qr(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(s=>s.name).includes(J))return null;let t=null;return(await gt(J,Xr,{upgrade:async(r,o,s,a)=>{if(o<2||!r.objectStoreNames.contains(Re))return;const u=a.objectStore(Re),c=await u.index("fcmSenderId").get(e);if(await u.clear(),!!c){if(o===2){const i=c;if(!i.auth||!i.p256dh||!i.endpoint)return;t={token:i.fcmToken,createTime:i.createTime??Date.now(),subscriptionOptions:{auth:i.auth,p256dh:i.p256dh,endpoint:i.endpoint,swScope:i.swScope,vapidKey:typeof i.vapidKey=="string"?i.vapidKey:l(i.vapidKey)}}}else if(o===3){const i=c;t={token:i.fcmToken,createTime:i.createTime,subscriptionOptions:{auth:l(i.auth),p256dh:l(i.p256dh),endpoint:i.endpoint,swScope:i.swScope,vapidKey:l(i.vapidKey)}}}else if(o===4){const i=c;t={token:i.fcmToken,createTime:i.createTime,subscriptionOptions:{auth:l(i.auth),p256dh:l(i.p256dh),endpoint:i.endpoint,swScope:i.swScope,vapidKey:l(i.vapidKey)}}}}}})).close(),await q(J),await q("fcm_vapid_details_db"),await q("undefined"),Zr(t)?t:null}function Zr(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eo="firebase-messaging-database",to=1,C="firebase-messaging-store";let Y=null;function wt(){return Y||(Y=gt(eo,to,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(C)}}})),Y}async function no(e){const t=yt(e),r=await(await wt()).transaction(C).objectStore(C).get(t);if(r)return r;{const o=await Qr(e.appConfig.senderId);if(o)return await he(e,o),o}}async function he(e,t){const n=yt(e),o=(await wt()).transaction(C,"readwrite");return await o.objectStore(C).put(t,n),await o.done,t}function yt({appConfig:e}){return e.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ro={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},f=new M("messaging","Messaging",ro);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function oo(e,t){const n=await ge(e),r=Et(t),o={method:"POST",headers:n,body:JSON.stringify(r)};let s;try{s=await(await fetch(pe(e.appConfig),o)).json()}catch(a){throw f.create("token-subscribe-failed",{errorInfo:a==null?void 0:a.toString()})}if(s.error){const a=s.error.message;throw f.create("token-subscribe-failed",{errorInfo:a})}if(!s.token)throw f.create("token-subscribe-no-token");return s.token}async function so(e,t){const n=await ge(e),r=Et(t.subscriptionOptions),o={method:"PATCH",headers:n,body:JSON.stringify(r)};let s;try{s=await(await fetch(`${pe(e.appConfig)}/${t.token}`,o)).json()}catch(a){throw f.create("token-update-failed",{errorInfo:a==null?void 0:a.toString()})}if(s.error){const a=s.error.message;throw f.create("token-update-failed",{errorInfo:a})}if(!s.token)throw f.create("token-update-no-token");return s.token}async function ao(e,t){const r={method:"DELETE",headers:await ge(e)};try{const s=await(await fetch(`${pe(e.appConfig)}/${t}`,r)).json();if(s.error){const a=s.error.message;throw f.create("token-unsubscribe-failed",{errorInfo:a})}}catch(o){throw f.create("token-unsubscribe-failed",{errorInfo:o==null?void 0:o.toString()})}}function pe({projectId:e}){return`${qr}/projects/${e}/registrations`}async function ge({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function Et({p256dh:e,auth:t,endpoint:n,vapidKey:r}){const o={web:{endpoint:n,auth:t,p256dh:e}};return r!==bt&&(o.web.applicationPubKey=r),o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const io=7*24*60*60*1e3;async function co(e){const t=await fo(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:l(t.getKey("auth")),p256dh:l(t.getKey("p256dh"))},r=await no(e.firebaseDependencies);if(r){if(lo(r.subscriptionOptions,n))return Date.now()>=r.createTime+io?uo(e,{token:r.token,createTime:Date.now(),subscriptionOptions:n}):r.token;try{await ao(e.firebaseDependencies,r.token)}catch(o){console.warn(o)}return Pe(e.firebaseDependencies,n)}else return Pe(e.firebaseDependencies,n)}async function uo(e,t){try{const n=await so(e.firebaseDependencies,t),r={...t,token:n,createTime:Date.now()};return await he(e.firebaseDependencies,r),n}catch(n){throw n}}async function Pe(e,t){const r={token:await oo(e,t),createTime:Date.now(),subscriptionOptions:t};return await he(e,r),r.token}async function fo(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:zr(t)})}function lo(e,t){const n=t.vapidKey===e.vapidKey,r=t.endpoint===e.endpoint,o=t.auth===e.auth,s=t.p256dh===e.p256dh;return n&&r&&o&&s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Le(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return ho(t,e),po(t,e),go(t,e),t}function ho(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const r=t.notification.body;r&&(e.notification.body=r);const o=t.notification.image;o&&(e.notification.image=o);const s=t.notification.icon;s&&(e.notification.icon=s)}function po(e,t){t.data&&(e.data=t.data)}function go(e,t){var o,s,a,u;if(!t.fcmOptions&&!((o=t.notification)!=null&&o.click_action))return;e.fcmOptions={};const n=((s=t.fcmOptions)==null?void 0:s.link)??((a=t.notification)==null?void 0:a.click_action);n&&(e.fcmOptions.link=n);const r=(u=t.fcmOptions)==null?void 0:u.analytics_label;r&&(e.fcmOptions.analyticsLabel=r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bo(e){return typeof e=="object"&&!!e&&mt in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mo(e){if(!e||!e.options)throw z("App Configuration Object");if(!e.name)throw z("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const r of t)if(!n[r])throw z(r);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function z(e){return f.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wo{constructor(t,n,r){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const o=mo(t);this.firebaseDependencies={app:t,appConfig:o,installations:n,analyticsProvider:r}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function yo(e){try{e.swRegistration=await navigator.serviceWorker.register(Kr,{scope:Ur}),e.swRegistration.update().catch(()=>{}),await Eo(e.swRegistration)}catch(t){throw f.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}async function Eo(e){return new Promise((t,n)=>{const r=setTimeout(()=>n(new Error(`Service worker not registered after ${Ne} ms`)),Ne),o=e.installing||e.waiting;e.active?(clearTimeout(r),t()):o?o.onstatechange=s=>{var a;((a=s.target)==null?void 0:a.state)==="activated"&&(o.onstatechange=null,clearTimeout(r),t())}:(clearTimeout(r),n(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Io(e,t){if(!t&&!e.swRegistration&&await yo(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw f.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function So(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=bt)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function It(e,t){if(!navigator)throw f.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw f.create("permission-blocked");return await So(e,t==null?void 0:t.vapidKey),await Io(e,t==null?void 0:t.serviceWorkerRegistration),co(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function To(e,t,n){const r=Do(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(r,{message_id:n[mt],message_name:n[Gr],message_time:n[Jr],message_device_time:Math.floor(Date.now()/1e3)})}function Do(e){switch(e){case _.NOTIFICATION_CLICKED:return"notification_open";case _.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ao(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===_.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(Le(n)):e.onMessageHandler.next(Le(n)));const r=n.data;bo(r)&&r[Yr]==="1"&&await To(e,n.messageType,r)}const xe="@firebase/messaging",Ve="0.12.23";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _o=e=>{const t=new wo(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>Ao(t,n)),t},Co=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:r=>It(t,r)}};function Bo(){E(new y("messaging",_o,"PUBLIC")),E(new y("messaging-internal",Co,"PRIVATE")),w(xe,Ve),w(xe,Ve,"esm2020")}async function ko(e,t){return e=Mt(e),It(e,t)}Bo();export{ko as getToken};
