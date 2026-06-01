import{t as e}from"./mic-DawiyRb4.js";import{t}from"./send-YBPgGBZs.js";import{t as n}from"./square-BJRlM54g.js";import{t as r}from"./trash-2-6PJyH5P8.js";import{h as i,i as a,n as o,r as s,t as c,u as l,v as u}from"./index-Dq102y83.js";var ee=l(`check-check`,[[`path`,{d:`M18 6 7 17l-5-5`,key:`116fxf`}],[`path`,{d:`m22 10-7.5 7.5L13 16`,key:`ke71qq`}]]),te=l(`image`,[[`rect`,{width:`18`,height:`18`,x:`3`,y:`3`,rx:`2`,ry:`2`,key:`1m3agn`}],[`circle`,{cx:`9`,cy:`9`,r:`2`,key:`af1f0g`}],[`path`,{d:`m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21`,key:`1xmnt7`}]]),ne=l(`lock`,[[`rect`,{width:`18`,height:`11`,x:`3`,y:`11`,rx:`2`,ry:`2`,key:`1w4ew1`}],[`path`,{d:`M7 11V7a5 5 0 0 1 10 0v4`,key:`fwvmzm`}]]),re=l(`message-circle`,[[`path`,{d:`M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719`,key:`1sd12s`}]]),ie=l(`paperclip`,[[`path`,{d:`m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551`,key:`1miecu`}]]),ae=l(`phone-off`,[[`path`,{d:`M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272`,key:`1wngk7`}],[`path`,{d:`M22 2 2 22`,key:`y4kqgn`}],[`path`,{d:`M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473`,key:`10hv5p`}]]),oe=l(`phone`,[[`path`,{d:`M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384`,key:`9njp5v`}]]),se=l(`video`,[[`path`,{d:`m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5`,key:`ftymec`}],[`rect`,{x:`2`,y:`6`,width:`14`,height:`12`,rx:`2`,key:`158x01`}]]),d=i(),f=Object.create(null);f.open=`0`,f.close=`1`,f.ping=`2`,f.pong=`3`,f.message=`4`,f.upgrade=`5`,f.noop=`6`;var p=Object.create(null);Object.keys(f).forEach(e=>{p[f[e]]=e});var m={type:`error`,data:`parser error`},h=typeof Blob==`function`||typeof Blob<`u`&&Object.prototype.toString.call(Blob)===`[object BlobConstructor]`,g=typeof ArrayBuffer==`function`,_=e=>typeof ArrayBuffer.isView==`function`?ArrayBuffer.isView(e):e&&e.buffer instanceof ArrayBuffer,v=({type:e,data:t},n,r)=>h&&t instanceof Blob?n?r(t):y(t,r):g&&(t instanceof ArrayBuffer||_(t))?n?r(t):y(new Blob([t]),r):r(f[e]+(t||``)),y=(e,t)=>{let n=new FileReader;return n.onload=function(){let e=n.result.split(`,`)[1];t(`b`+(e||``))},n.readAsDataURL(e)};function ce(e){return e instanceof Uint8Array?e:e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}var b;function le(e,t){if(h&&e.data instanceof Blob)return e.data.arrayBuffer().then(ce).then(t);if(g&&(e.data instanceof ArrayBuffer||_(e.data)))return t(ce(e.data));v(e,!1,e=>{b||=new TextEncoder,t(b.encode(e))})}var ue=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`,x=typeof Uint8Array>`u`?[]:new Uint8Array(256);for(let e=0;e<64;e++)x[ue.charCodeAt(e)]=e;const S=e=>{let t=e.length*.75,n=e.length,r,i=0,a,o,s,c;e[e.length-1]===`=`&&(t--,e[e.length-2]===`=`&&t--);let l=new ArrayBuffer(t),u=new Uint8Array(l);for(r=0;r<n;r+=4)a=x[e.charCodeAt(r)],o=x[e.charCodeAt(r+1)],s=x[e.charCodeAt(r+2)],c=x[e.charCodeAt(r+3)],u[i++]=a<<2|o>>4,u[i++]=(o&15)<<4|s>>2,u[i++]=(s&3)<<6|c&63;return l};var C=typeof ArrayBuffer==`function`;const w=(e,t)=>{if(typeof e!=`string`)return{type:`message`,data:T(e,t)};let n=e.charAt(0);return n===`b`?{type:`message`,data:de(e.substring(1),t)}:p[n]?e.length>1?{type:p[n],data:e.substring(1)}:{type:p[n]}:m};var de=(e,t)=>C?T(S(e),t):{base64:!0,data:e},T=(e,t)=>{switch(t){case`blob`:return e instanceof Blob?e:new Blob([e]);case`arraybuffer`:default:return e instanceof ArrayBuffer?e:e.buffer}},E=``,D=(e,t)=>{let n=e.length,r=Array(n),i=0;e.forEach((e,a)=>{v(e,!1,e=>{r[a]=e,++i===n&&t(r.join(E))})})},O=(e,t)=>{let n=e.split(E),r=[];for(let e=0;e<n.length;e++){let i=w(n[e],t);if(r.push(i),i.type===`error`)break}return r};function fe(){return new TransformStream({transform(e,t){le(e,n=>{let r=n.length,i;if(r<126)i=new Uint8Array(1),new DataView(i.buffer).setUint8(0,r);else if(r<65536){i=new Uint8Array(3);let e=new DataView(i.buffer);e.setUint8(0,126),e.setUint16(1,r)}else{i=new Uint8Array(9);let e=new DataView(i.buffer);e.setUint8(0,127),e.setBigUint64(1,BigInt(r))}e.data&&typeof e.data!=`string`&&(i[0]|=128),t.enqueue(i),t.enqueue(n)})}})}var k;function pe(e){return e.reduce((e,t)=>e+t.length,0)}function A(e,t){if(e[0].length===t)return e.shift();let n=new Uint8Array(t),r=0;for(let i=0;i<t;i++)n[i]=e[0][r++],r===e[0].length&&(e.shift(),r=0);return e.length&&r<e[0].length&&(e[0]=e[0].slice(r)),n}function me(e,t){k||=new TextDecoder;let n=[],r=0,i=-1,a=!1;return new TransformStream({transform(o,s){for(n.push(o);;){if(r===0){if(pe(n)<1)break;let e=A(n,1);a=(e[0]&128)==128,i=e[0]&127,r=i<126?3:i===126?1:2}else if(r===1){if(pe(n)<2)break;let e=A(n,2);i=new DataView(e.buffer,e.byteOffset,e.length).getUint16(0),r=3}else if(r===2){if(pe(n)<8)break;let e=A(n,8),t=new DataView(e.buffer,e.byteOffset,e.length),a=t.getUint32(0);if(a>2**21-1){s.enqueue(m);break}i=a*2**32+t.getUint32(4),r=3}else{if(pe(n)<i)break;let e=A(n,i);s.enqueue(w(a?e:k.decode(e),t)),r=0}if(i===0||i>e){s.enqueue(m);break}}}})}function j(e){if(e)return he(e)}function he(e){for(var t in j.prototype)e[t]=j.prototype[t];return e}j.prototype.on=j.prototype.addEventListener=function(e,t){return this._callbacks=this._callbacks||{},(this._callbacks[`$`+e]=this._callbacks[`$`+e]||[]).push(t),this},j.prototype.once=function(e,t){function n(){this.off(e,n),t.apply(this,arguments)}return n.fn=t,this.on(e,n),this},j.prototype.off=j.prototype.removeListener=j.prototype.removeAllListeners=j.prototype.removeEventListener=function(e,t){if(this._callbacks=this._callbacks||{},arguments.length==0)return this._callbacks={},this;var n=this._callbacks[`$`+e];if(!n)return this;if(arguments.length==1)return delete this._callbacks[`$`+e],this;for(var r,i=0;i<n.length;i++)if(r=n[i],r===t||r.fn===t){n.splice(i,1);break}return n.length===0&&delete this._callbacks[`$`+e],this},j.prototype.emit=function(e){this._callbacks=this._callbacks||{};for(var t=Array(arguments.length-1),n=this._callbacks[`$`+e],r=1;r<arguments.length;r++)t[r-1]=arguments[r];if(n){n=n.slice(0);for(var r=0,i=n.length;r<i;++r)n[r].apply(this,t)}return this},j.prototype.emitReserved=j.prototype.emit,j.prototype.listeners=function(e){return this._callbacks=this._callbacks||{},this._callbacks[`$`+e]||[]},j.prototype.hasListeners=function(e){return!!this.listeners(e).length};const ge=(()=>typeof Promise==`function`&&typeof Promise.resolve==`function`?e=>Promise.resolve().then(e):(e,t)=>t(e,0))(),M=(()=>typeof self<`u`?self:typeof window<`u`?window:Function(`return this`)())();function N(e,...t){return t.reduce((t,n)=>(e.hasOwnProperty(n)&&(t[n]=e[n]),t),{})}var P=M.setTimeout,F=M.clearTimeout;function I(e,t){t.useNativeTimers?(e.setTimeoutFn=P.bind(M),e.clearTimeoutFn=F.bind(M)):(e.setTimeoutFn=M.setTimeout.bind(M),e.clearTimeoutFn=M.clearTimeout.bind(M))}var L=1.33;function R(e){return typeof e==`string`?z(e):Math.ceil((e.byteLength||e.size)*L)}function z(e){let t=0,n=0;for(let r=0,i=e.length;r<i;r++)t=e.charCodeAt(r),t<128?n+=1:t<2048?n+=2:t<55296||t>=57344?n+=3:(r++,n+=4);return n}function B(){return Date.now().toString(36).substring(3)+Math.random().toString(36).substring(2,5)}function V(e){let t=``;for(let n in e)e.hasOwnProperty(n)&&(t.length&&(t+=`&`),t+=encodeURIComponent(n)+`=`+encodeURIComponent(e[n]));return t}function _e(e){let t={},n=e.split(`&`);for(let e=0,r=n.length;e<r;e++){let r=n[e].split(`=`);t[decodeURIComponent(r[0])]=decodeURIComponent(r[1])}return t}var ve=class extends Error{constructor(e,t,n){super(e),this.description=t,this.context=n,this.type=`TransportError`}},H=class extends j{constructor(e){super(),this.writable=!1,I(this,e),this.opts=e,this.query=e.query,this.socket=e.socket,this.supportsBinary=!e.forceBase64}onError(e,t,n){return super.emitReserved(`error`,new ve(e,t,n)),this}open(){return this.readyState=`opening`,this.doOpen(),this}close(){return(this.readyState===`opening`||this.readyState===`open`)&&(this.doClose(),this.onClose()),this}send(e){this.readyState===`open`&&this.write(e)}onOpen(){this.readyState=`open`,this.writable=!0,super.emitReserved(`open`)}onData(e){let t=w(e,this.socket.binaryType);this.onPacket(t)}onPacket(e){super.emitReserved(`packet`,e)}onClose(e){this.readyState=`closed`,super.emitReserved(`close`,e)}pause(e){}createUri(e,t={}){return e+`://`+this._hostname()+this._port()+this.opts.path+this._query(t)}_hostname(){let e=this.opts.hostname;return e.indexOf(`:`)===-1?e:`[`+e+`]`}_port(){return this.opts.port&&(this.opts.secure&&Number(this.opts.port)!==443||!this.opts.secure&&Number(this.opts.port)!==80)?`:`+this.opts.port:``}_query(e){let t=V(e);return t.length?`?`+t:``}},U=class extends H{constructor(){super(...arguments),this._polling=!1}get name(){return`polling`}doOpen(){this._poll()}pause(e){this.readyState=`pausing`;let t=()=>{this.readyState=`paused`,e()};if(this._polling||!this.writable){let e=0;this._polling&&(e++,this.once(`pollComplete`,function(){--e||t()})),this.writable||(e++,this.once(`drain`,function(){--e||t()}))}else t()}_poll(){this._polling=!0,this.doPoll(),this.emitReserved(`poll`)}onData(e){O(e,this.socket.binaryType).forEach(e=>{if(this.readyState===`opening`&&e.type===`open`&&this.onOpen(),e.type===`close`)return this.onClose({description:`transport closed by the server`}),!1;this.onPacket(e)}),this.readyState!==`closed`&&(this._polling=!1,this.emitReserved(`pollComplete`),this.readyState===`open`&&this._poll())}doClose(){let e=()=>{this.write([{type:`close`}])};this.readyState===`open`?e():this.once(`open`,e)}write(e){this.writable=!1,D(e,e=>{this.doWrite(e,()=>{this.writable=!0,this.emitReserved(`drain`)})})}uri(){let e=this.opts.secure?`https`:`http`,t=this.query||{};return!1!==this.opts.timestampRequests&&(t[this.opts.timestampParam]=B()),!this.supportsBinary&&!t.sid&&(t.b64=1),this.createUri(e,t)}},W=!1;try{W=typeof XMLHttpRequest<`u`&&`withCredentials`in new XMLHttpRequest}catch{}const G=W;function ye(){}var be=class extends U{constructor(e){if(super(e),typeof location<`u`){let t=location.protocol===`https:`,n=location.port;n||=t?`443`:`80`,this.xd=typeof location<`u`&&e.hostname!==location.hostname||n!==e.port}}doWrite(e,t){let n=this.request({method:`POST`,data:e});n.on(`success`,t),n.on(`error`,(e,t)=>{this.onError(`xhr post error`,e,t)})}doPoll(){let e=this.request();e.on(`data`,this.onData.bind(this)),e.on(`error`,(e,t)=>{this.onError(`xhr poll error`,e,t)}),this.pollXhr=e}},K=class e extends j{constructor(e,t,n){super(),this.createRequest=e,I(this,n),this._opts=n,this._method=n.method||`GET`,this._uri=t,this._data=n.data===void 0?null:n.data,this._create()}_create(){var t;let n=N(this._opts,`agent`,`pfx`,`key`,`passphrase`,`cert`,`ca`,`ciphers`,`rejectUnauthorized`,`autoUnref`);n.xdomain=!!this._opts.xd;let r=this._xhr=this.createRequest(n);try{r.open(this._method,this._uri,!0);try{if(this._opts.extraHeaders)for(let e in r.setDisableHeaderCheck&&r.setDisableHeaderCheck(!0),this._opts.extraHeaders)this._opts.extraHeaders.hasOwnProperty(e)&&r.setRequestHeader(e,this._opts.extraHeaders[e])}catch{}if(this._method===`POST`)try{r.setRequestHeader(`Content-type`,`text/plain;charset=UTF-8`)}catch{}try{r.setRequestHeader(`Accept`,`*/*`)}catch{}(t=this._opts.cookieJar)==null||t.addCookies(r),`withCredentials`in r&&(r.withCredentials=this._opts.withCredentials),this._opts.requestTimeout&&(r.timeout=this._opts.requestTimeout),r.onreadystatechange=()=>{var e;r.readyState===3&&((e=this._opts.cookieJar)==null||e.parseCookies(r.getResponseHeader(`set-cookie`))),r.readyState===4&&(r.status===200||r.status===1223?this._onLoad():this.setTimeoutFn(()=>{this._onError(typeof r.status==`number`?r.status:0)},0))},r.send(this._data)}catch(e){this.setTimeoutFn(()=>{this._onError(e)},0);return}typeof document<`u`&&(this._index=e.requestsCount++,e.requests[this._index]=this)}_onError(e){this.emitReserved(`error`,e,this._xhr),this._cleanup(!0)}_cleanup(t){if(!(this._xhr===void 0||this._xhr===null)){if(this._xhr.onreadystatechange=ye,t)try{this._xhr.abort()}catch{}typeof document<`u`&&delete e.requests[this._index],this._xhr=null}}_onLoad(){let e=this._xhr.responseText;e!==null&&(this.emitReserved(`data`,e),this.emitReserved(`success`),this._cleanup())}abort(){this._cleanup()}};if(K.requestsCount=0,K.requests={},typeof document<`u`){if(typeof attachEvent==`function`)attachEvent(`onunload`,xe);else if(typeof addEventListener==`function`){let e=`onpagehide`in M?`pagehide`:`unload`;addEventListener(e,xe,!1)}}function xe(){for(let e in K.requests)K.requests.hasOwnProperty(e)&&K.requests[e].abort()}var Se=(function(){let e=we({xdomain:!1});return e&&e.responseType!==null})(),Ce=class extends be{constructor(e){super(e);let t=e&&e.forceBase64;this.supportsBinary=Se&&!t}request(e={}){return Object.assign(e,{xd:this.xd},this.opts),new K(we,this.uri(),e)}};function we(e){let t=e.xdomain;try{if(typeof XMLHttpRequest<`u`&&(!t||G))return new XMLHttpRequest}catch{}if(!t)try{return new M[[`Active`,`Object`].join(`X`)](`Microsoft.XMLHTTP`)}catch{}}var Te=typeof navigator<`u`&&typeof navigator.product==`string`&&navigator.product.toLowerCase()===`reactnative`,Ee=class extends H{get name(){return`websocket`}doOpen(){let e=this.uri(),t=this.opts.protocols,n=Te?{}:N(this.opts,`agent`,`perMessageDeflate`,`pfx`,`key`,`passphrase`,`cert`,`ca`,`ciphers`,`rejectUnauthorized`,`localAddress`,`protocolVersion`,`origin`,`maxPayload`,`family`,`checkServerIdentity`);this.opts.extraHeaders&&(n.headers=this.opts.extraHeaders);try{this.ws=this.createSocket(e,t,n)}catch(e){return this.emitReserved(`error`,e)}this.ws.binaryType=this.socket.binaryType,this.addEventListeners()}addEventListeners(){this.ws.onopen=()=>{this.opts.autoUnref&&this.ws._socket.unref(),this.onOpen()},this.ws.onclose=e=>this.onClose({description:`websocket connection closed`,context:e}),this.ws.onmessage=e=>this.onData(e.data),this.ws.onerror=e=>this.onError(`websocket error`,e)}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],r=t===e.length-1;v(n,this.supportsBinary,e=>{try{this.doWrite(n,e)}catch{}r&&ge(()=>{this.writable=!0,this.emitReserved(`drain`)},this.setTimeoutFn)})}}doClose(){this.ws!==void 0&&(this.ws.onerror=()=>{},this.ws.close(),this.ws=null)}uri(){let e=this.opts.secure?`wss`:`ws`,t=this.query||{};return this.opts.timestampRequests&&(t[this.opts.timestampParam]=B()),this.supportsBinary||(t.b64=1),this.createUri(e,t)}},De=M.WebSocket||M.MozWebSocket;const q={websocket:class extends Ee{createSocket(e,t,n){return Te?new De(e,t,n):t?new De(e,t):new De(e)}doWrite(e,t){this.ws.send(t)}},webtransport:class extends H{get name(){return`webtransport`}doOpen(){try{this._transport=new WebTransport(this.createUri(`https`),this.opts.transportOptions[this.name])}catch(e){return this.emitReserved(`error`,e)}this._transport.closed.then(()=>{this.onClose()}).catch(e=>{this.onError(`webtransport error`,e)}),this._transport.ready.then(()=>{this._transport.createBidirectionalStream().then(e=>{let t=me(2**53-1,this.socket.binaryType),n=e.readable.pipeThrough(t).getReader(),r=fe();r.readable.pipeTo(e.writable),this._writer=r.writable.getWriter();let i=()=>{n.read().then(({done:e,value:t})=>{e||(this.onPacket(t),i())}).catch(e=>{})};i();let a={type:`open`};this.query.sid&&(a.data=`{"sid":"${this.query.sid}"}`),this._writer.write(a).then(()=>this.onOpen())})})}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],r=t===e.length-1;this._writer.write(n).then(()=>{r&&ge(()=>{this.writable=!0,this.emitReserved(`drain`)},this.setTimeoutFn)})}}doClose(){var e;(e=this._transport)==null||e.close()}},polling:Ce};var Oe=/^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,ke=[`source`,`protocol`,`authority`,`userInfo`,`user`,`password`,`host`,`port`,`relative`,`path`,`directory`,`file`,`query`,`anchor`];function Ae(e){if(e.length>8e3)throw`URI too long`;let t=e,n=e.indexOf(`[`),r=e.indexOf(`]`);n!=-1&&r!=-1&&(e=e.substring(0,n)+e.substring(n,r).replace(/:/g,`;`)+e.substring(r,e.length));let i=Oe.exec(e||``),a={},o=14;for(;o--;)a[ke[o]]=i[o]||``;return n!=-1&&r!=-1&&(a.source=t,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,`:`),a.authority=a.authority.replace(`[`,``).replace(`]`,``).replace(/;/g,`:`),a.ipv6uri=!0),a.pathNames=je(a,a.path),a.queryKey=Me(a,a.query),a}function je(e,t){let n=t.replace(/\/{2,9}/g,`/`).split(`/`);return(t.slice(0,1)==`/`||t.length===0)&&n.splice(0,1),t.slice(-1)==`/`&&n.splice(n.length-1,1),n}function Me(e,t){let n={};return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,function(e,t,r){t&&(n[t]=r)}),n}var Ne=typeof addEventListener==`function`&&typeof removeEventListener==`function`,Pe=[];Ne&&addEventListener(`offline`,()=>{Pe.forEach(e=>e())},!1);var Fe=class e extends j{constructor(e,t){if(super(),this.binaryType=`arraybuffer`,this.writeBuffer=[],this._prevBufferLen=0,this._pingInterval=-1,this._pingTimeout=-1,this._maxPayload=-1,this._pingTimeoutTime=1/0,e&&typeof e==`object`&&(t=e,e=null),e){let n=Ae(e);t.hostname=n.host,t.secure=n.protocol===`https`||n.protocol===`wss`,t.port=n.port,n.query&&(t.query=n.query)}else t.host&&(t.hostname=Ae(t.host).host);I(this,t),this.secure=t.secure==null?typeof location<`u`&&location.protocol===`https:`:t.secure,t.hostname&&!t.port&&(t.port=this.secure?`443`:`80`),this.hostname=t.hostname||(typeof location<`u`?location.hostname:`localhost`),this.port=t.port||(typeof location<`u`&&location.port?location.port:this.secure?`443`:`80`),this.transports=[],this._transportsByName={},t.transports.forEach(e=>{let t=e.prototype.name;this.transports.push(t),this._transportsByName[t]=e}),this.opts=Object.assign({path:`/engine.io`,agent:!1,withCredentials:!1,upgrade:!0,timestampParam:`t`,rememberUpgrade:!1,addTrailingSlash:!0,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!1},t),this.opts.path=this.opts.path.replace(/\/$/,``)+(this.opts.addTrailingSlash?`/`:``),typeof this.opts.query==`string`&&(this.opts.query=_e(this.opts.query)),Ne&&(this.opts.closeOnBeforeunload&&(this._beforeunloadEventListener=()=>{this.transport&&(this.transport.removeAllListeners(),this.transport.close())},addEventListener(`beforeunload`,this._beforeunloadEventListener,!1)),this.hostname!==`localhost`&&(this._offlineEventListener=()=>{this._onClose(`transport close`,{description:`network connection lost`})},Pe.push(this._offlineEventListener))),this.opts.withCredentials&&(this._cookieJar=void 0),this._open()}createTransport(e){let t=Object.assign({},this.opts.query);t.EIO=4,t.transport=e,this.id&&(t.sid=this.id);let n=Object.assign({},this.opts,{query:t,socket:this,hostname:this.hostname,secure:this.secure,port:this.port},this.opts.transportOptions[e]);return new this._transportsByName[e](n)}_open(){if(this.transports.length===0){this.setTimeoutFn(()=>{this.emitReserved(`error`,`No transports available`)},0);return}let t=this.opts.rememberUpgrade&&e.priorWebsocketSuccess&&this.transports.indexOf(`websocket`)!==-1?`websocket`:this.transports[0];this.readyState=`opening`;let n=this.createTransport(t);n.open(),this.setTransport(n)}setTransport(e){this.transport&&this.transport.removeAllListeners(),this.transport=e,e.on(`drain`,this._onDrain.bind(this)).on(`packet`,this._onPacket.bind(this)).on(`error`,this._onError.bind(this)).on(`close`,e=>this._onClose(`transport close`,e))}onOpen(){this.readyState=`open`,e.priorWebsocketSuccess=this.transport.name===`websocket`,this.emitReserved(`open`),this.flush()}_onPacket(e){if(this.readyState===`opening`||this.readyState===`open`||this.readyState===`closing`)switch(this.emitReserved(`packet`,e),this.emitReserved(`heartbeat`),e.type){case`open`:this.onHandshake(JSON.parse(e.data));break;case`ping`:this._sendPacket(`pong`),this.emitReserved(`ping`),this.emitReserved(`pong`),this._resetPingTimeout();break;case`error`:let t=Error(`server error`);t.code=e.data,this._onError(t);break;case`message`:this.emitReserved(`data`,e.data),this.emitReserved(`message`,e.data);break}}onHandshake(e){this.emitReserved(`handshake`,e),this.id=e.sid,this.transport.query.sid=e.sid,this._pingInterval=e.pingInterval,this._pingTimeout=e.pingTimeout,this._maxPayload=e.maxPayload,this.onOpen(),this.readyState!==`closed`&&this._resetPingTimeout()}_resetPingTimeout(){this.clearTimeoutFn(this._pingTimeoutTimer);let e=this._pingInterval+this._pingTimeout;this._pingTimeoutTime=Date.now()+e,this._pingTimeoutTimer=this.setTimeoutFn(()=>{this._onClose(`ping timeout`)},e),this.opts.autoUnref&&this._pingTimeoutTimer.unref()}_onDrain(){this.writeBuffer.splice(0,this._prevBufferLen),this._prevBufferLen=0,this.writeBuffer.length===0?this.emitReserved(`drain`):this.flush()}flush(){if(this.readyState!==`closed`&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){let e=this._getWritablePackets();this.transport.send(e),this._prevBufferLen=e.length,this.emitReserved(`flush`)}}_getWritablePackets(){if(!(this._maxPayload&&this.transport.name===`polling`&&this.writeBuffer.length>1))return this.writeBuffer;let e=1;for(let t=0;t<this.writeBuffer.length;t++){let n=this.writeBuffer[t].data;if(n&&(e+=R(n)),t>0&&e>this._maxPayload)return this.writeBuffer.slice(0,t);e+=2}return this.writeBuffer}_hasPingExpired(){if(!this._pingTimeoutTime)return!0;let e=Date.now()>this._pingTimeoutTime;return e&&(this._pingTimeoutTime=0,ge(()=>{this._onClose(`ping timeout`)},this.setTimeoutFn)),e}write(e,t,n){return this._sendPacket(`message`,e,t,n),this}send(e,t,n){return this._sendPacket(`message`,e,t,n),this}_sendPacket(e,t,n,r){if(typeof t==`function`&&(r=t,t=void 0),typeof n==`function`&&(r=n,n=null),this.readyState===`closing`||this.readyState===`closed`)return;n||={},n.compress=!1!==n.compress;let i={type:e,data:t,options:n};this.emitReserved(`packetCreate`,i),this.writeBuffer.push(i),r&&this.once(`flush`,r),this.flush()}close(){let e=()=>{this._onClose(`forced close`),this.transport.close()},t=()=>{this.off(`upgrade`,t),this.off(`upgradeError`,t),e()},n=()=>{this.once(`upgrade`,t),this.once(`upgradeError`,t)};return(this.readyState===`opening`||this.readyState===`open`)&&(this.readyState=`closing`,this.writeBuffer.length?this.once(`drain`,()=>{this.upgrading?n():e()}):this.upgrading?n():e()),this}_onError(t){if(e.priorWebsocketSuccess=!1,this.opts.tryAllTransports&&this.transports.length>1&&this.readyState===`opening`)return this.transports.shift(),this._open();this.emitReserved(`error`,t),this._onClose(`transport error`,t)}_onClose(e,t){if(this.readyState===`opening`||this.readyState===`open`||this.readyState===`closing`){if(this.clearTimeoutFn(this._pingTimeoutTimer),this.transport.removeAllListeners(`close`),this.transport.close(),this.transport.removeAllListeners(),Ne&&(this._beforeunloadEventListener&&removeEventListener(`beforeunload`,this._beforeunloadEventListener,!1),this._offlineEventListener)){let e=Pe.indexOf(this._offlineEventListener);e!==-1&&Pe.splice(e,1)}this.readyState=`closed`,this.id=null,this.emitReserved(`close`,e,t),this.writeBuffer=[],this._prevBufferLen=0}}};Fe.protocol=4;var Ie=class extends Fe{constructor(){super(...arguments),this._upgrades=[]}onOpen(){if(super.onOpen(),this.readyState===`open`&&this.opts.upgrade)for(let e=0;e<this._upgrades.length;e++)this._probe(this._upgrades[e])}_probe(e){let t=this.createTransport(e),n=!1;Fe.priorWebsocketSuccess=!1;let r=()=>{n||(t.send([{type:`ping`,data:`probe`}]),t.once(`packet`,e=>{if(!n)if(e.type===`pong`&&e.data===`probe`){if(this.upgrading=!0,this.emitReserved(`upgrading`,t),!t)return;Fe.priorWebsocketSuccess=t.name===`websocket`,this.transport.pause(()=>{n||this.readyState!==`closed`&&(l(),this.setTransport(t),t.send([{type:`upgrade`}]),this.emitReserved(`upgrade`,t),t=null,this.upgrading=!1,this.flush())})}else{let e=Error(`probe error`);e.transport=t.name,this.emitReserved(`upgradeError`,e)}}))};function i(){n||(n=!0,l(),t.close(),t=null)}let a=e=>{let n=Error(`probe error: `+e);n.transport=t.name,i(),this.emitReserved(`upgradeError`,n)};function o(){a(`transport closed`)}function s(){a(`socket closed`)}function c(e){t&&e.name!==t.name&&i()}let l=()=>{t.removeListener(`open`,r),t.removeListener(`error`,a),t.removeListener(`close`,o),this.off(`close`,s),this.off(`upgrading`,c)};t.once(`open`,r),t.once(`error`,a),t.once(`close`,o),this.once(`close`,s),this.once(`upgrading`,c),this._upgrades.indexOf(`webtransport`)!==-1&&e!==`webtransport`?this.setTimeoutFn(()=>{n||t.open()},200):t.open()}onHandshake(e){this._upgrades=this._filterUpgrades(e.upgrades),super.onHandshake(e)}_filterUpgrades(e){let t=[];for(let n=0;n<e.length;n++)~this.transports.indexOf(e[n])&&t.push(e[n]);return t}},Le=class extends Ie{constructor(e,t={}){let n=typeof e==`object`?e:t;(!n.transports||n.transports&&typeof n.transports[0]==`string`)&&(n.transports=(n.transports||[`polling`,`websocket`,`webtransport`]).map(e=>q[e]).filter(e=>!!e)),super(e,n)}};Le.protocol;function Re(e,t=``,n){let r=e;n||=typeof location<`u`&&location,e??=n.protocol+`//`+n.host,typeof e==`string`&&(e.charAt(0)===`/`&&(e=e.charAt(1)===`/`?n.protocol+e:n.host+e),/^(https?|wss?):\/\//.test(e)||(e=n===void 0?`https://`+e:n.protocol+`//`+e),r=Ae(e)),r.port||(/^(http|ws)$/.test(r.protocol)?r.port=`80`:/^(http|ws)s$/.test(r.protocol)&&(r.port=`443`)),r.path=r.path||`/`;let i=r.host.indexOf(`:`)===-1?r.host:`[`+r.host+`]`;return r.id=r.protocol+`://`+i+`:`+r.port+t,r.href=r.protocol+`://`+i+(n&&n.port===r.port?``:`:`+r.port),r}var ze=typeof ArrayBuffer==`function`,Be=e=>typeof ArrayBuffer.isView==`function`?ArrayBuffer.isView(e):e.buffer instanceof ArrayBuffer,Ve=Object.prototype.toString,He=typeof Blob==`function`||typeof Blob<`u`&&Ve.call(Blob)===`[object BlobConstructor]`,Ue=typeof File==`function`||typeof File<`u`&&Ve.call(File)===`[object FileConstructor]`;function We(e){return ze&&(e instanceof ArrayBuffer||Be(e))||He&&e instanceof Blob||Ue&&e instanceof File}function Ge(e,t){if(!e||typeof e!=`object`)return!1;if(Array.isArray(e)){for(let t=0,n=e.length;t<n;t++)if(Ge(e[t]))return!0;return!1}if(We(e))return!0;if(e.toJSON&&typeof e.toJSON==`function`&&arguments.length===1)return Ge(e.toJSON(),!0);for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t)&&Ge(e[t]))return!0;return!1}function Ke(e){let t=[],n=e.data,r=e;return r.data=qe(n,t),r.attachments=t.length,{packet:r,buffers:t}}function qe(e,t){if(!e)return e;if(We(e)){let n={_placeholder:!0,num:t.length};return t.push(e),n}else if(Array.isArray(e)){let n=Array(e.length);for(let r=0;r<e.length;r++)n[r]=qe(e[r],t);return n}else if(typeof e==`object`&&!(e instanceof Date)){let n={};for(let r in e)Object.prototype.hasOwnProperty.call(e,r)&&(n[r]=qe(e[r],t));return n}return e}function Je(e,t){return e.data=Ye(e.data,t),delete e.attachments,e}function Ye(e,t){if(!e)return e;if(e&&e._placeholder===!0){if(typeof e.num==`number`&&e.num>=0&&e.num<t.length)return t[e.num];throw Error(`illegal attachments`)}else if(Array.isArray(e))for(let n=0;n<e.length;n++)e[n]=Ye(e[n],t);else if(typeof e==`object`)for(let n in e)Object.prototype.hasOwnProperty.call(e,n)&&(e[n]=Ye(e[n],t));return e}var Xe=u({Decoder:()=>$e,Encoder:()=>Qe,PacketType:()=>J,isPacketValid:()=>ot,protocol:()=>5}),Ze=[`connect`,`connect_error`,`disconnect`,`disconnecting`,`newListener`,`removeListener`],J;(function(e){e[e.CONNECT=0]=`CONNECT`,e[e.DISCONNECT=1]=`DISCONNECT`,e[e.EVENT=2]=`EVENT`,e[e.ACK=3]=`ACK`,e[e.CONNECT_ERROR=4]=`CONNECT_ERROR`,e[e.BINARY_EVENT=5]=`BINARY_EVENT`,e[e.BINARY_ACK=6]=`BINARY_ACK`})(J||={});var Qe=class{constructor(e){this.replacer=e}encode(e){return(e.type===J.EVENT||e.type===J.ACK)&&Ge(e)?this.encodeAsBinary({type:e.type===J.EVENT?J.BINARY_EVENT:J.BINARY_ACK,nsp:e.nsp,data:e.data,id:e.id}):[this.encodeAsString(e)]}encodeAsString(e){let t=``+e.type;return(e.type===J.BINARY_EVENT||e.type===J.BINARY_ACK)&&(t+=e.attachments+`-`),e.nsp&&e.nsp!==`/`&&(t+=e.nsp+`,`),e.id!=null&&(t+=e.id),e.data!=null&&(t+=JSON.stringify(e.data,this.replacer)),t}encodeAsBinary(e){let t=Ke(e),n=this.encodeAsString(t.packet),r=t.buffers;return r.unshift(n),r}},$e=class e extends j{constructor(e){super(),this.opts=Object.assign({reviver:void 0,maxAttachments:10},typeof e==`function`?{reviver:e}:e)}add(e){let t;if(typeof e==`string`){if(this.reconstructor)throw Error(`got plaintext data when reconstructing a packet`);t=this.decodeString(e);let n=t.type===J.BINARY_EVENT;n||t.type===J.BINARY_ACK?(t.type=n?J.EVENT:J.ACK,this.reconstructor=new et(t),t.attachments===0&&super.emitReserved(`decoded`,t)):super.emitReserved(`decoded`,t)}else if(We(e)||e.base64)if(this.reconstructor)t=this.reconstructor.takeBinaryData(e),t&&(this.reconstructor=null,super.emitReserved(`decoded`,t));else throw Error(`got binary data when not reconstructing a packet`);else throw Error(`Unknown type: `+e)}decodeString(t){let n=0,r={type:Number(t.charAt(0))};if(J[r.type]===void 0)throw Error(`unknown packet type `+r.type);if(r.type===J.BINARY_EVENT||r.type===J.BINARY_ACK){let e=n+1;for(;t.charAt(++n)!==`-`&&n!=t.length;);let i=t.substring(e,n);if(i!=Number(i)||t.charAt(n)!==`-`)throw Error(`Illegal attachments`);let a=Number(i);if(!nt(a)||a<0)throw Error(`Illegal attachments`);if(a>this.opts.maxAttachments)throw Error(`too many attachments`);r.attachments=a}if(t.charAt(n+1)===`/`){let e=n+1;for(;++n&&!(t.charAt(n)===`,`||n===t.length););r.nsp=t.substring(e,n)}else r.nsp=`/`;let i=t.charAt(n+1);if(i!==``&&Number(i)==i){let e=n+1;for(;++n;){let e=t.charAt(n);if(e==null||Number(e)!=e){--n;break}if(n===t.length)break}r.id=Number(t.substring(e,n+1))}if(t.charAt(++n)){let i=this.tryParse(t.substr(n));if(e.isPayloadValid(r.type,i))r.data=i;else throw Error(`invalid payload`)}return r}tryParse(e){try{return JSON.parse(e,this.opts.reviver)}catch{return!1}}static isPayloadValid(e,t){switch(e){case J.CONNECT:return it(t);case J.DISCONNECT:return t===void 0;case J.CONNECT_ERROR:return typeof t==`string`||it(t);case J.EVENT:case J.BINARY_EVENT:return Array.isArray(t)&&(typeof t[0]==`number`||typeof t[0]==`string`&&Ze.indexOf(t[0])===-1);case J.ACK:case J.BINARY_ACK:return Array.isArray(t)}}destroy(){this.reconstructor&&=(this.reconstructor.finishedReconstruction(),null)}},et=class{constructor(e){this.packet=e,this.buffers=[],this.reconPack=e}takeBinaryData(e){if(this.buffers.push(e),this.buffers.length===this.reconPack.attachments){let e=Je(this.reconPack,this.buffers);return this.finishedReconstruction(),e}return null}finishedReconstruction(){this.reconPack=null,this.buffers=[]}};function tt(e){return typeof e==`string`}var nt=Number.isInteger||function(e){return typeof e==`number`&&isFinite(e)&&Math.floor(e)===e};function rt(e){return e===void 0||nt(e)}function it(e){return Object.prototype.toString.call(e)===`[object Object]`}function at(e,t){switch(e){case J.CONNECT:return t===void 0||it(t);case J.DISCONNECT:return t===void 0;case J.EVENT:return Array.isArray(t)&&(typeof t[0]==`number`||typeof t[0]==`string`&&Ze.indexOf(t[0])===-1);case J.ACK:return Array.isArray(t);case J.CONNECT_ERROR:return typeof t==`string`||it(t);default:return!1}}function ot(e){return tt(e.nsp)&&rt(e.id)&&at(e.type,e.data)}function Y(e,t,n){return e.on(t,n),function(){e.off(t,n)}}var st=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1}),ct=class extends j{constructor(e,t,n){super(),this.connected=!1,this.recovered=!1,this.receiveBuffer=[],this.sendBuffer=[],this._queue=[],this._queueSeq=0,this.ids=0,this.acks={},this.flags={},this.io=e,this.nsp=t,n&&n.auth&&(this.auth=n.auth),this._opts=Object.assign({},n),this.io._autoConnect&&this.open()}get disconnected(){return!this.connected}subEvents(){if(this.subs)return;let e=this.io;this.subs=[Y(e,`open`,this.onopen.bind(this)),Y(e,`packet`,this.onpacket.bind(this)),Y(e,`error`,this.onerror.bind(this)),Y(e,`close`,this.onclose.bind(this))]}get active(){return!!this.subs}connect(){return this.connected?this:(this.subEvents(),this.io._reconnecting||this.io.open(),this.io._readyState===`open`&&this.onopen(),this)}open(){return this.connect()}send(...e){return e.unshift(`message`),this.emit.apply(this,e),this}emit(e,...t){if(st.hasOwnProperty(e))throw Error(`"`+e.toString()+`" is a reserved event name`);if(t.unshift(e),this._opts.retries&&!this.flags.fromQueue&&!this.flags.volatile)return this._addToQueue(t),this;let n={type:J.EVENT,data:t};if(n.options={},n.options.compress=this.flags.compress!==!1,typeof t[t.length-1]==`function`){let e=this.ids++,r=t.pop();this._registerAckCallback(e,r),n.id=e}let r=this.io.engine?.transport?.writable,i=this.connected&&!this.io.engine?._hasPingExpired();return this.flags.volatile&&!r||(i?(this.notifyOutgoingListeners(n),this.packet(n)):this.sendBuffer.push(n)),this.flags={},this}_registerAckCallback(e,t){let n=this.flags.timeout??this._opts.ackTimeout;if(n===void 0){this.acks[e]=t;return}let r=this.io.setTimeoutFn(()=>{delete this.acks[e];for(let t=0;t<this.sendBuffer.length;t++)this.sendBuffer[t].id===e&&this.sendBuffer.splice(t,1);t.call(this,Error(`operation has timed out`))},n),i=(...e)=>{this.io.clearTimeoutFn(r),t.apply(this,e)};i.withError=!0,this.acks[e]=i}emitWithAck(e,...t){return new Promise((n,r)=>{let i=(e,t)=>e?r(e):n(t);i.withError=!0,t.push(i),this.emit(e,...t)})}_addToQueue(e){let t;typeof e[e.length-1]==`function`&&(t=e.pop());let n={id:this._queueSeq++,tryCount:0,pending:!1,args:e,flags:Object.assign({fromQueue:!0},this.flags)};e.push((e,...r)=>(this._queue[0],e===null?(this._queue.shift(),t&&t(null,...r)):n.tryCount>this._opts.retries&&(this._queue.shift(),t&&t(e)),n.pending=!1,this._drainQueue())),this._queue.push(n),this._drainQueue()}_drainQueue(e=!1){if(!this.connected||this._queue.length===0)return;let t=this._queue[0];t.pending&&!e||(t.pending=!0,t.tryCount++,this.flags=t.flags,this.emit.apply(this,t.args))}packet(e){e.nsp=this.nsp,this.io._packet(e)}onopen(){typeof this.auth==`function`?this.auth(e=>{this._sendConnectPacket(e)}):this._sendConnectPacket(this.auth)}_sendConnectPacket(e){this.packet({type:J.CONNECT,data:this._pid?Object.assign({pid:this._pid,offset:this._lastOffset},e):e})}onerror(e){this.connected||this.emitReserved(`connect_error`,e)}onclose(e,t){this.connected=!1,delete this.id,this.emitReserved(`disconnect`,e,t),this._clearAcks()}_clearAcks(){Object.keys(this.acks).forEach(e=>{if(!this.sendBuffer.some(t=>String(t.id)===e)){let t=this.acks[e];delete this.acks[e],t.withError&&t.call(this,Error(`socket has been disconnected`))}})}onpacket(e){if(e.nsp===this.nsp)switch(e.type){case J.CONNECT:e.data&&e.data.sid?this.onconnect(e.data.sid,e.data.pid):this.emitReserved(`connect_error`,Error(`It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)`));break;case J.EVENT:case J.BINARY_EVENT:this.onevent(e);break;case J.ACK:case J.BINARY_ACK:this.onack(e);break;case J.DISCONNECT:this.ondisconnect();break;case J.CONNECT_ERROR:this.destroy();let t=Error(e.data.message);t.data=e.data.data,this.emitReserved(`connect_error`,t);break}}onevent(e){let t=e.data||[];e.id!=null&&t.push(this.ack(e.id)),this.connected?this.emitEvent(t):this.receiveBuffer.push(Object.freeze(t))}emitEvent(e){if(this._anyListeners&&this._anyListeners.length){let t=this._anyListeners.slice();for(let n of t)n.apply(this,e)}super.emit.apply(this,e),this._pid&&e.length&&typeof e[e.length-1]==`string`&&(this._lastOffset=e[e.length-1])}ack(e){let t=this,n=!1;return function(...r){n||(n=!0,t.packet({type:J.ACK,id:e,data:r}))}}onack(e){let t=this.acks[e.id];typeof t==`function`&&(delete this.acks[e.id],t.withError&&e.data.unshift(null),t.apply(this,e.data))}onconnect(e,t){this.id=e,this.recovered=t&&this._pid===t,this._pid=t,this.connected=!0,this.emitBuffered(),this._drainQueue(!0),this.emitReserved(`connect`)}emitBuffered(){this.receiveBuffer.forEach(e=>this.emitEvent(e)),this.receiveBuffer=[],this.sendBuffer.forEach(e=>{this.notifyOutgoingListeners(e),this.packet(e)}),this.sendBuffer=[]}ondisconnect(){this.destroy(),this.onclose(`io server disconnect`)}destroy(){this.subs&&=(this.subs.forEach(e=>e()),void 0),this.io._destroy(this)}disconnect(){return this.connected&&this.packet({type:J.DISCONNECT}),this.destroy(),this.connected&&this.onclose(`io client disconnect`),this}close(){return this.disconnect()}compress(e){return this.flags.compress=e,this}get volatile(){return this.flags.volatile=!0,this}timeout(e){return this.flags.timeout=e,this}onAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(e),this}prependAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(e),this}offAny(e){if(!this._anyListeners)return this;if(e){let t=this._anyListeners;for(let n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyListeners=[];return this}listenersAny(){return this._anyListeners||[]}onAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.push(e),this}prependAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.unshift(e),this}offAnyOutgoing(e){if(!this._anyOutgoingListeners)return this;if(e){let t=this._anyOutgoingListeners;for(let n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyOutgoingListeners=[];return this}listenersAnyOutgoing(){return this._anyOutgoingListeners||[]}notifyOutgoingListeners(e){if(this._anyOutgoingListeners&&this._anyOutgoingListeners.length){let t=this._anyOutgoingListeners.slice();for(let n of t)n.apply(this,e.data)}}};function X(e){e||={},this.ms=e.min||100,this.max=e.max||1e4,this.factor=e.factor||2,this.jitter=e.jitter>0&&e.jitter<=1?e.jitter:0,this.attempts=0}X.prototype.duration=function(){var e=this.ms*this.factor**+ this.attempts++;if(this.jitter){var t=Math.random(),n=Math.floor(t*this.jitter*e);e=Math.floor(t*10)&1?e+n:e-n}return Math.min(e,this.max)|0},X.prototype.reset=function(){this.attempts=0},X.prototype.setMin=function(e){this.ms=e},X.prototype.setMax=function(e){this.max=e},X.prototype.setJitter=function(e){this.jitter=e};var lt=class extends j{constructor(e,t){super(),this.nsps={},this.subs=[],e&&typeof e==`object`&&(t=e,e=void 0),t||={},t.path=t.path||`/socket.io`,this.opts=t,I(this,t),this.reconnection(t.reconnection!==!1),this.reconnectionAttempts(t.reconnectionAttempts||1/0),this.reconnectionDelay(t.reconnectionDelay||1e3),this.reconnectionDelayMax(t.reconnectionDelayMax||5e3),this.randomizationFactor(t.randomizationFactor??.5),this.backoff=new X({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(t.timeout==null?2e4:t.timeout),this._readyState=`closed`,this.uri=e;let n=t.parser||Xe;this.encoder=new n.Encoder,this.decoder=new n.Decoder,this._autoConnect=t.autoConnect!==!1,this._autoConnect&&this.open()}reconnection(e){return arguments.length?(this._reconnection=!!e,e||(this.skipReconnect=!0),this):this._reconnection}reconnectionAttempts(e){return e===void 0?this._reconnectionAttempts:(this._reconnectionAttempts=e,this)}reconnectionDelay(e){var t;return e===void 0?this._reconnectionDelay:(this._reconnectionDelay=e,(t=this.backoff)==null||t.setMin(e),this)}randomizationFactor(e){var t;return e===void 0?this._randomizationFactor:(this._randomizationFactor=e,(t=this.backoff)==null||t.setJitter(e),this)}reconnectionDelayMax(e){var t;return e===void 0?this._reconnectionDelayMax:(this._reconnectionDelayMax=e,(t=this.backoff)==null||t.setMax(e),this)}timeout(e){return arguments.length?(this._timeout=e,this):this._timeout}maybeReconnectOnOpen(){!this._reconnecting&&this._reconnection&&this.backoff.attempts===0&&this.reconnect()}open(e){if(~this._readyState.indexOf(`open`))return this;this.engine=new Le(this.uri,this.opts);let t=this.engine,n=this;this._readyState=`opening`,this.skipReconnect=!1;let r=Y(t,`open`,function(){n.onopen(),e&&e()}),i=t=>{this.cleanup(),this._readyState=`closed`,this.emitReserved(`error`,t),e?e(t):this.maybeReconnectOnOpen()},a=Y(t,`error`,i);if(!1!==this._timeout){let e=this._timeout,n=this.setTimeoutFn(()=>{r(),i(Error(`timeout`)),t.close()},e);this.opts.autoUnref&&n.unref(),this.subs.push(()=>{this.clearTimeoutFn(n)})}return this.subs.push(r),this.subs.push(a),this}connect(e){return this.open(e)}onopen(){this.cleanup(),this._readyState=`open`,this.emitReserved(`open`);let e=this.engine;this.subs.push(Y(e,`ping`,this.onping.bind(this)),Y(e,`data`,this.ondata.bind(this)),Y(e,`error`,this.onerror.bind(this)),Y(e,`close`,this.onclose.bind(this)),Y(this.decoder,`decoded`,this.ondecoded.bind(this)))}onping(){this.emitReserved(`ping`)}ondata(e){try{this.decoder.add(e)}catch(e){this.onclose(`parse error`,e)}}ondecoded(e){ge(()=>{this.emitReserved(`packet`,e)},this.setTimeoutFn)}onerror(e){this.emitReserved(`error`,e)}socket(e,t){let n=this.nsps[e];return n?this._autoConnect&&!n.active&&n.connect():(n=new ct(this,e,t),this.nsps[e]=n),n}_destroy(e){let t=Object.keys(this.nsps);for(let e of t)if(this.nsps[e].active)return;this._close()}_packet(e){let t=this.encoder.encode(e);for(let n=0;n<t.length;n++)this.engine.write(t[n],e.options)}cleanup(){this.subs.forEach(e=>e()),this.subs.length=0,this.decoder.destroy()}_close(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose(`forced close`)}disconnect(){return this._close()}onclose(e,t){var n;this.cleanup(),(n=this.engine)==null||n.close(),this.backoff.reset(),this._readyState=`closed`,this.emitReserved(`close`,e,t),this._reconnection&&!this.skipReconnect&&this.reconnect()}reconnect(){if(this._reconnecting||this.skipReconnect)return this;let e=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved(`reconnect_failed`),this._reconnecting=!1;else{let t=this.backoff.duration();this._reconnecting=!0;let n=this.setTimeoutFn(()=>{e.skipReconnect||(this.emitReserved(`reconnect_attempt`,e.backoff.attempts),!e.skipReconnect&&e.open(t=>{t?(e._reconnecting=!1,e.reconnect(),this.emitReserved(`reconnect_error`,t)):e.onreconnect()}))},t);this.opts.autoUnref&&n.unref(),this.subs.push(()=>{this.clearTimeoutFn(n)})}}onreconnect(){let e=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved(`reconnect`,e)}},Z={};function Q(e,t){typeof e==`object`&&(t=e,e=void 0),t||={};let n=Re(e,t.path||`/socket.io`),r=n.source,i=n.id,a=n.path,o=Z[i]&&a in Z[i].nsps,s=t.forceNew||t[`force new connection`]||!1===t.multiplex||o,c;return s?c=new lt(r,t):(Z[i]||(Z[i]=new lt(r,t)),c=Z[i]),n.query&&!t.query&&(t.query=n.queryKey),c.socket(n.path,t)}Object.assign(Q,{Manager:lt,Socket:ct,io:Q,connect:Q});var $=c(),ut=e=>{if(!e)return``;if(/^https?:\/\//i.test(e))return e;let t=String(e).replace(/^\/+/,``);return`${o.defaults.baseURL}/${t}`},dt=e=>{if(!e)return`Last seen not available`;let t=new Date(e),n=Date.now()-t.getTime(),r=Math.max(1,Math.round(n/6e4));return r<2?`Last seen just now`:r<60?`Last seen ${r} min ago`:`Last seen ${t.toLocaleString([],{dateStyle:`medium`,timeStyle:`short`})}`},ft=()=>{let i=a(),[c,l]=(0,d.useState)([]),[u,f]=(0,d.useState)(``),[p,m]=(0,d.useState)(``),[h,g]=(0,d.useState)(``),[_,v]=(0,d.useState)([]),[y,ce]=(0,d.useState)(``),[b,le]=(0,d.useState)(null),[ue,x]=(0,d.useState)(``),[S,C]=(0,d.useState)(!0),[w,de]=(0,d.useState)(!1),[T,E]=(0,d.useState)(!1),[D,O]=(0,d.useState)(null),[fe,k]=(0,d.useState)(null),[pe,A]=(0,d.useState)(!1),[me,j]=(0,d.useState)(!1),[he,ge]=(0,d.useState)(!0),M=(0,d.useRef)(null),N=(0,d.useRef)(null),P=(0,d.useRef)(null),F=(0,d.useRef)(null),I=(0,d.useRef)(null),L=(0,d.useRef)(null),R=(0,d.useRef)(null),z=(0,d.useRef)(null),B=(0,d.useRef)(null),V=(0,d.useRef)(null),_e=(0,d.useRef)(null),ve=(0,d.useRef)(null),H=(0,d.useRef)([]),U=c.find(e=>String(e.id)===String(u)),W=u&&String(p)===String(u),G=async({silent:e=!1}={})=>{try{let t=await o.get(`/api/chat/contacts`),n=Array.isArray(t.data)?t.data:[];l(n),f(e=>e||String(n[0]?.id||``)),e||x(``)}catch(t){console.error(`Chat contacts failed`,t),e||x(t.response?.data?.message||`Contacts could not be loaded.`)}finally{C(!1)}},ye=async({silent:e=!1}={})=>{if(!u||!W){v([]),C(!1);return}try{let t=await o.get(`/api/chat/messages`,{params:{recipientId:u,chatCode:h}});v(Array.isArray(t.data)?t.data:[]),e||x(``)}catch(t){console.error(`Chat fetch failed`,t),e||x(t.response?.data?.message||`Chat could not be loaded.`),t.response?.status===403&&m(``)}finally{C(!1)}};(0,d.useEffect)(()=>{let e=()=>{o.post(`/api/chat/heartbeat`).catch(()=>{})},t=()=>{o.post(`/api/chat/offline`).catch(()=>{})},n=()=>{let e=s(),t=`${o.defaults.baseURL}/api/chat/offline`;fetch(t,{method:`POST`,headers:e?{Authorization:`Bearer ${e}`}:{},keepalive:!0}).catch(()=>{})},r=()=>{document.visibilityState===`hidden`?n():(e(),G({silent:!0}))};G(),e();let i=window.setInterval(()=>{e(),G({silent:!0})},3e4);return document.addEventListener(`visibilitychange`,r),window.addEventListener(`pagehide`,n),window.addEventListener(`beforeunload`,n),()=>{window.clearInterval(i),document.removeEventListener(`visibilitychange`,r),window.removeEventListener(`pagehide`,n),window.removeEventListener(`beforeunload`,n),t()}},[]),(0,d.useEffect)(()=>{m(``),g(``),v([])},[u]),(0,d.useEffect)(()=>{ye();let e=window.setInterval(()=>ye({silent:!0}),5e3);return()=>window.clearInterval(e)},[u,W,h]),(0,d.useEffect)(()=>{M.current?.scrollIntoView({behavior:`smooth`})},[_.length]),(0,d.useEffect)(()=>{P.current&&D?.type===`video`&&L.current&&(P.current.srcObject=L.current)},[D]),(0,d.useEffect)(()=>{F.current&&R.current&&(F.current.srcObject=R.current),I.current&&R.current&&(I.current.srcObject=R.current,I.current.muted=!he)},[D,he]),(0,d.useEffect)(()=>{V.current=D},[D]),(0,d.useEffect)(()=>{_e.current=fe},[fe]);let be=async()=>{if(!u){x(`Select a student or teacher first.`);return}if(h.trim().length<4){x(`Enter the private code. Both users must type the same code.`);return}try{C(!0),await o.post(`/api/chat/session`,{recipientId:u,chatCode:h.trim()}),m(u),x(``)}catch(e){console.error(`Chat unlock failed`,e),x(e.response?.data?.message||`Chat code could not be verified.`)}finally{C(!1)}},K=async(e=null)=>{let t=e||b;if(!y.trim()&&!t){x(`Type a message or attach a picture/video/voice note.`);return}if(!W){x(`Unlock this chat with the private code first.`);return}try{de(!0);let e=new FormData;e.append(`text`,y.trim()),e.append(`recipientId`,u),e.append(`chatCode`,h.trim()),t&&e.append(`file`,t),await o.post(`/api/chat/messages`,e),ce(``),le(null),N.current&&(N.current.value=``),await ye({silent:!0})}catch(e){console.error(`Chat send failed`,e),x(e.response?.data?.message||`Message could not be sent.`)}finally{de(!1)}},xe=async()=>{if(!W){x(`Unlock this chat with the private code before clearing it.`);return}if(window.confirm(`Clear this secure chat for both users? A new code will be required next time.`))try{await o.delete(`/api/chat/messages`,{params:{recipientId:u,chatCode:h}}),v([]),m(``),g(``),x(`Chat cleared for both users. Set a new code to chat again.`)}catch(e){console.error(`Chat clear failed`,e),x(e.response?.data?.message||`Chat could not be cleared.`)}},Se=async()=>{if(!W){x(`Unlock this chat with the private code before recording a voice note.`);return}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){x(`Voice recording is not supported in this browser.`);return}try{let e=await navigator.mediaDevices.getUserMedia({audio:!0}),t=new MediaRecorder(e);H.current=[],t.ondataavailable=e=>{e.data.size&&H.current.push(e.data)},t.onstop=async()=>{e.getTracks().forEach(e=>e.stop());let t=new Blob(H.current,{type:`audio/webm`}),n=new File([t],`voice-note-${Date.now()}.webm`,{type:`audio/webm`});E(!1),await K(n)},ve.current=t,t.start(),E(!0)}catch(e){console.error(`Voice recording failed`,e),x(`Microphone permission is required for voice notes.`)}},Ce=()=>{ve.current?.stop()},we=e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),K())},Te=(e,t)=>{let n=new RTCPeerConnection({iceServers:[{urls:`stun:stun.l.google.com:19302`}]});return n.onicecandidate=n=>{n.candidate&&B.current?.emit(`webrtc:ice-candidate`,{recipientId:e,callId:t,candidate:n.candidate})},n.ontrack=e=>{let[t]=e.streams;R.current=t,F.current&&(F.current.srcObject=t),I.current&&(I.current.srcObject=t,I.current.muted=!he),O(e=>e&&{...e,status:`connected`})},n.onconnectionstatechange=()=>{[`failed`,`closed`,`disconnected`].includes(n.connectionState)&&O(e=>e&&{...e,status:n.connectionState})},z.current=n,n},Ee=async e=>{let t=await navigator.mediaDevices.getUserMedia(e===`video`?{audio:!0,video:!0}:{audio:!0,video:!1});return L.current=t,A(!1),j(!1),t},De=()=>{L.current?.getTracks().forEach(e=>e.stop()),L.current=null,R.current?.getTracks().forEach(e=>e.stop()),R.current=null,P.current&&(P.current.srcObject=null),F.current&&(F.current.srcObject=null),I.current&&(I.current.srcObject=null)},q=({notify:e=!0}={})=>{e&&D?.contactId&&B.current?.emit(`call:end`,{recipientId:D.contactId,callId:D.callId}),z.current?.close(),z.current=null,De(),O(null),k(null)},Oe=async e=>{if(!U){x(`Select a student or teacher first.`);return}if(!W){x(`Unlock this chat with the private code before starting a call.`);return}try{q({notify:!1});let t=await Ee(e),n=`${i?.id||i?._id}-${U.id}-${Date.now()}`,r=Te(U.id,n);t.getTracks().forEach(e=>r.addTrack(e,t)),x(``),O({callId:n,type:e,contactId:U.id,contactName:U.name,direction:`outgoing`,startedAt:Date.now(),status:`calling`}),B.current?.emit(`call:start`,{recipientId:U.id,type:e,callId:n})}catch(t){console.error(`Call permission failed`,t),x(e===`video`?`Camera and microphone permission is required for video call.`:`Microphone permission is required for audio call.`)}};return(0,d.useEffect)(()=>{let e=s();if(!e)return;let t=Q(o.defaults.baseURL,{auth:{token:e},transports:[`websocket`,`polling`]});return B.current=t,t.on(`call:incoming`,e=>{k(e)}),t.on(`call:accepted`,async({callId:e,fromId:n})=>{if(!(!z.current||V.current?.callId!==e))try{O(e=>e&&{...e,status:`connecting`});let r=await z.current.createOffer();await z.current.setLocalDescription(r),t.emit(`webrtc:offer`,{recipientId:n,callId:e,description:r})}catch(e){console.error(`Create offer failed`,e),x(`Call connection failed while creating offer.`)}}),t.on(`call:rejected`,({callId:e})=>{V.current?.callId===e&&(x(`Call was rejected.`),q({notify:!1}))}),t.on(`call:ended`,({callId:e})=>{(V.current?.callId===e||_e.current?.callId===e)&&(x(`Call ended.`),q({notify:!1}))}),t.on(`webrtc:offer`,async({callId:e,fromId:n,description:r})=>{if(!(!z.current||V.current?.callId!==e))try{await z.current.setRemoteDescription(new RTCSessionDescription(r));let i=await z.current.createAnswer();await z.current.setLocalDescription(i),t.emit(`webrtc:answer`,{recipientId:n,callId:e,description:i})}catch(e){console.error(`Handle offer failed`,e),x(`Call connection failed while answering.`)}}),t.on(`webrtc:answer`,async({callId:e,description:t})=>{if(!(!z.current||V.current?.callId!==e))try{await z.current.setRemoteDescription(new RTCSessionDescription(t))}catch(e){console.error(`Handle answer failed`,e),x(`Call connection failed while connecting.`)}}),t.on(`webrtc:ice-candidate`,async({callId:e,candidate:t})=>{if(!(!z.current||V.current?.callId!==e))try{await z.current.addIceCandidate(new RTCIceCandidate(t))}catch(e){console.error(`ICE candidate failed`,e)}}),t.on(`call:error`,({message:e})=>{x(e||`Call failed.`),q({notify:!1})}),()=>{t.disconnect(),B.current=null}},[]),(0,d.useEffect)(()=>()=>{L.current?.getTracks().forEach(e=>e.stop())},[]),(0,d.useEffect)(()=>{q()},[u]),(0,$.jsxs)(`div`,{className:`portal-chat`,children:[(0,$.jsx)(`style`,{children:`
        .portal-chat {
          height: calc(100dvh - 104px);
          min-height: 620px;
          display: grid;
          grid-template-columns: minmax(250px, 330px) minmax(0, 1fr);
          background: #eef4ff;
          color: #0f172a;
        }
        .chat-sidebar {
          min-height: 0;
          background: #0f172a;
          color: #fff;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          gap: 14px;
          padding: 18px;
        }
        .chat-brand { display: flex; align-items: center; gap: 12px; }
        .chat-brand-icon {
          width: 46px;
          height: 46px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: #2563eb;
        }
        .chat-title { margin: 0; font-size: 24px; line-height: 1.1; }
        .chat-subtitle { margin: 3px 0 0; color: rgba(255,255,255,.68); font-size: 13px; }
        .contact-select {
          width: 100%;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 8px;
          background: #fff;
          color: #0f172a;
          padding: 12px;
          font-weight: 800;
          outline: none;
        }
        .contact-list {
          min-height: 0;
          overflow: auto;
          display: grid;
          align-content: start;
          gap: 8px;
        }
        .contact-item {
          width: 100%;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.07);
          color: #fff;
          border-radius: 8px;
          padding: 11px;
          text-align: left;
          cursor: pointer;
        }
        .contact-item.active { background: #1d4ed8; border-color: #60a5fa; }
        .contact-main { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .contact-name { font-weight: 900; overflow-wrap: anywhere; }
        .contact-meta { margin-top: 4px; color: rgba(255,255,255,.68); font-size: 12px; text-transform: capitalize; }
        .status-dot { width: 9px; height: 9px; border-radius: 999px; background: #94a3b8; flex: 0 0 auto; }
        .status-dot.online { background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.18); }
        .signed-in {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 8px;
          padding: 12px;
          background: rgba(255,255,255,.07);
          font-size: 13px;
        }
        .chat-main {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          background: #f8fafc;
        }
        .chat-header {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .chat-person { min-width: 0; }
        .chat-person h2 { margin: 0; font-size: 22px; overflow-wrap: anywhere; }
        .presence { margin-top: 4px; color: #64748b; font-size: 13px; font-weight: 800; }
        .presence.online { color: #15803d; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .icon-button {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #334155;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .icon-button:disabled, .primary-button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }
        .notice {
          margin: 10px 18px 0;
          padding: 11px 12px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 800;
        }
        .lock-panel {
          margin: 12px 18px 0;
          padding: 12px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #dbeafe;
          display: grid;
          grid-template-columns: auto minmax(180px, 1fr) minmax(140px, 220px) auto;
          gap: 10px;
          align-items: center;
        }
        .lock-copy strong { display: block; }
        .lock-copy small { color: #64748b; font-weight: 700; }
        .code-input {
          min-width: 0;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          font: inherit;
          font-weight: 900;
          outline: none;
        }
        .primary-button {
          min-height: 42px;
          border: 0;
          border-radius: 8px;
          background: #2563eb;
          color: #fff;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }
        .danger-button {
          background: #991b1b;
        }
        .call-panel {
          margin: 10px 18px 0;
          border-radius: 8px;
          background: #020617;
          color: #fff;
          padding: 14px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          box-shadow: 0 16px 36px rgba(15, 23, 42, .18);
        }
        .call-info {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .call-avatar {
          width: 46px;
          height: 46px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: #2563eb;
          flex: 0 0 auto;
        }
        .call-info strong, .call-info span {
          display: block;
          overflow-wrap: anywhere;
        }
        .call-info span {
          margin-top: 3px;
          color: rgba(255,255,255,.72);
          font-size: 13px;
          font-weight: 800;
        }
        .call-video {
          width: min(240px, 38vw);
          aspect-ratio: 16 / 10;
          border-radius: 8px;
          background: #0f172a;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,.16);
        }
        .end-call {
          width: 46px;
          height: 46px;
          border: 0;
          border-radius: 8px;
          background: #dc2626;
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .messages {
          min-height: 0;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
        }
        .empty {
          flex: 1;
          min-height: 220px;
          display: grid;
          place-items: center;
          color: #64748b;
          font-weight: 900;
          text-align: center;
        }
        .message-row { display: flex; margin-bottom: 10px; }
        .message-row.mine { justify-content: flex-end; }
        .message-bubble {
          max-width: min(680px, 76%);
          border-radius: 8px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          box-shadow: 0 8px 20px rgba(15, 23, 42, .07);
        }
        .message-row.mine .message-bubble {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .message-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 11px;
          opacity: .78;
          text-transform: capitalize;
        }
        .message-text { margin: 7px 0 0; white-space: pre-wrap; line-height: 1.5; overflow-wrap: anywhere; }
        .message-media {
          display: block;
          margin-top: 9px;
          max-width: 100%;
          border-radius: 8px;
          background: #020617;
        }
        img.message-media { max-height: 320px; object-fit: contain; background: transparent; }
        video.message-media { width: min(520px, 100%); max-height: 320px; }
        audio.message-media { width: min(360px, 100%); background: transparent; }
        .read-tick { display: inline-flex; align-items: center; gap: 4px; font-weight: 900; }
        .read-tick.seen { color: #38bdf8; }
        .read-tick.sent { color: rgba(255,255,255,.68); }
        .composer {
          border-top: 1px solid #e2e8f0;
          background: #fff;
          padding: 12px;
        }
        .file-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          margin-bottom: 8px;
          padding: 7px 9px;
          border-radius: 8px;
          background: #ecfeff;
          color: #0f766e;
          font-weight: 800;
        }
        .file-pill span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-pill button {
          border: 0;
          border-radius: 7px;
          background: #ccfbf1;
          color: #0f766e;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-weight: 900;
        }
        .input-row {
          display: grid;
          grid-template-columns: 42px 42px minmax(0, 1fr) auto;
          gap: 8px;
          align-items: end;
        }
        .textarea {
          min-width: 0;
          resize: none;
          min-height: 42px;
          max-height: 120px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          padding: 10px 12px;
          font: inherit;
          outline: none;
        }
        @media (max-width: 820px) {
          .portal-chat {
            height: calc(100dvh - 104px);
            min-height: 0;
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr);
          }
          .chat-sidebar {
            grid-template-rows: auto auto;
            padding: 12px;
          }
          .chat-brand, .signed-in { display: none; }
          .contact-list {
            grid-auto-flow: column;
            grid-auto-columns: minmax(190px, 72%);
            overflow-x: auto;
            overflow-y: hidden;
          }
          .chat-header {
            padding: 10px 12px;
            align-items: flex-start;
          }
          .chat-person h2 { font-size: 18px; }
          .header-actions .icon-button { width: 38px; height: 38px; }
          .lock-panel {
            margin: 8px 12px 0;
            grid-template-columns: 1fr;
          }
          .messages { padding: 12px; }
          .message-bubble { max-width: 88%; }
          .notice { margin: 8px 12px 0; }
          .call-panel {
            margin: 8px 12px 0;
            grid-template-columns: 1fr auto;
          }
          .call-video {
            grid-column: 1 / -1;
            width: 100%;
          }
          .input-row { grid-template-columns: 40px 40px minmax(0, 1fr) 44px; }
          .primary-button.send-label span { display: none; }
          .composer { padding: 10px; }
        }
      `}),(0,$.jsxs)(`aside`,{className:`chat-sidebar`,children:[(0,$.jsxs)(`div`,{className:`chat-brand`,children:[(0,$.jsx)(`div`,{className:`chat-brand-icon`,children:(0,$.jsx)(re,{size:24})}),(0,$.jsxs)(`div`,{children:[(0,$.jsx)(`h1`,{className:`chat-title`,children:`Portal Chat`}),(0,$.jsx)(`p`,{className:`chat-subtitle`,children:`Private teacher-student messages`})]})]}),(0,$.jsxs)(`select`,{className:`contact-select`,value:u,onChange:e=>f(e.target.value),children:[c.length===0?(0,$.jsx)(`option`,{value:``,children:`No contacts found`}):null,c.map(e=>(0,$.jsxs)(`option`,{value:e.id,children:[e.name,` (`,e.role,`)`]},e.id))]}),(0,$.jsx)(`div`,{className:`contact-list`,children:c.map(e=>(0,$.jsxs)(`button`,{type:`button`,className:`contact-item ${String(e.id)===String(u)?`active`:``}`,onClick:()=>f(String(e.id)),children:[(0,$.jsxs)(`div`,{className:`contact-main`,children:[(0,$.jsx)(`span`,{className:`contact-name`,children:e.name}),(0,$.jsx)(`span`,{className:`status-dot ${e.online?`online`:``}`})]}),(0,$.jsxs)(`div`,{className:`contact-meta`,children:[e.role,` `,e.rollNumber?`- ${e.rollNumber}`:``,` -`,` `,e.online?`Online`:dt(e.lastSeenAt)]})]},e.id))}),(0,$.jsxs)(`div`,{className:`signed-in`,children:[`Signed in as `,(0,$.jsx)(`strong`,{children:i?.name||i?.email||`Portal user`}),(0,$.jsx)(`div`,{children:i?.role||`user`})]})]}),(0,$.jsxs)(`main`,{className:`chat-main`,children:[(0,$.jsxs)(`header`,{className:`chat-header`,children:[(0,$.jsxs)(`div`,{className:`chat-person`,children:[(0,$.jsx)(`h2`,{children:U?U.name:`Select a contact`}),(0,$.jsx)(`div`,{className:`presence ${U?.online?`online`:``}`,children:U?.online?`Online`:dt(U?.lastSeenAt)})]}),(0,$.jsxs)(`div`,{className:`header-actions`,children:[(0,$.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Audio call`,onClick:()=>Oe(`audio`),disabled:!W,children:(0,$.jsx)(oe,{size:19})}),(0,$.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Video call`,onClick:()=>Oe(`video`),disabled:!W,children:(0,$.jsx)(se,{size:19})}),(0,$.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Clear chat`,onClick:xe,children:(0,$.jsx)(r,{size:19})})]})]}),ue?(0,$.jsx)(`div`,{className:`notice`,children:ue}):null,D?(0,$.jsxs)(`section`,{className:`call-panel`,children:[(0,$.jsxs)(`div`,{className:`call-info`,children:[(0,$.jsx)(`div`,{className:`call-avatar`,children:D.type===`video`?(0,$.jsx)(se,{size:23}):(0,$.jsx)(oe,{size:23})}),(0,$.jsxs)(`div`,{children:[(0,$.jsxs)(`strong`,{children:[D.type===`video`?`Video call`:`Audio call`,` with `,U?.name]}),(0,$.jsx)(`span`,{children:`Calling...`})]})]}),(0,$.jsx)(`button`,{type:`button`,className:`end-call`,title:`End call`,onClick:q,children:(0,$.jsx)(ae,{size:21})}),D.type===`video`?(0,$.jsx)(`video`,{ref:P,className:`call-video`,autoPlay:!0,muted:!0,playsInline:!0}):null]}):null,W?null:(0,$.jsxs)(`section`,{className:`lock-panel`,children:[(0,$.jsx)(ne,{size:22,color:`#2563eb`}),(0,$.jsxs)(`div`,{className:`lock-copy`,children:[(0,$.jsx)(`strong`,{children:`Secure code required`}),(0,$.jsx)(`small`,{children:`First time both users type the same code. Next time this chat asks for that code again.`})]}),(0,$.jsx)(`input`,{className:`code-input`,value:h,onChange:e=>g(e.target.value),onKeyDown:e=>{e.key===`Enter`&&be()},type:`password`,placeholder:`Private code`}),(0,$.jsxs)(`button`,{type:`button`,className:`primary-button`,onClick:be,children:[(0,$.jsx)(ne,{size:17}),` Open`]})]}),(0,$.jsxs)(`section`,{className:`messages`,children:[S?(0,$.jsx)(`div`,{className:`empty`,children:`Loading chat...`}):null,!S&&!u?(0,$.jsx)(`div`,{className:`empty`,children:`Select a student or teacher.`}):null,!S&&u&&!W?(0,$.jsx)(`div`,{className:`empty`,children:`Enter the private code to open this secure chat.`}):null,!S&&u&&W&&_.length===0?(0,$.jsx)(`div`,{className:`empty`,children:`No messages yet with this user.`}):null,_.map(e=>{let t=String(e.senderId)===String(i?.id||i?._id);return(0,$.jsx)(`article`,{className:`message-row ${t?`mine`:``}`,children:(0,$.jsxs)(`div`,{className:`message-bubble`,children:[(0,$.jsxs)(`div`,{className:`message-meta`,children:[(0,$.jsxs)(`span`,{children:[e.senderName||`Portal User`,` - `,e.senderRole]}),t?(0,$.jsxs)(`span`,{className:`read-tick ${e.readAt?`seen`:`sent`}`,children:[(0,$.jsx)(ee,{size:15}),` `,e.readAt?`Seen`:`Sent`]}):null]}),e.text?(0,$.jsx)(`p`,{className:`message-text`,children:e.text}):null,e.fileUrl&&e.fileType===`image`?(0,$.jsx)(`img`,{src:ut(e.fileUrl),alt:`Chat attachment`,className:`message-media`}):null,e.fileUrl&&e.fileType===`video`?(0,$.jsx)(`video`,{src:ut(e.fileUrl),controls:!0,className:`message-media`}):null,e.fileUrl&&e.fileType===`audio`?(0,$.jsx)(`audio`,{src:ut(e.fileUrl),controls:!0,className:`message-media`}):null]})},e._id)}),(0,$.jsx)(`div`,{ref:M})]}),(0,$.jsxs)(`footer`,{className:`composer`,children:[b?(0,$.jsxs)(`div`,{className:`file-pill`,children:[b.type.startsWith(`video/`)?(0,$.jsx)(se,{size:15}):b.type.startsWith(`audio/`)?(0,$.jsx)(e,{size:15}):(0,$.jsx)(te,{size:15}),(0,$.jsx)(`span`,{children:b.name}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>le(null),children:`x`})]}):null,(0,$.jsxs)(`div`,{className:`input-row`,children:[(0,$.jsx)(`input`,{ref:N,type:`file`,accept:`image/*,video/*,audio/*`,onChange:e=>le(e.target.files?.[0]||null),style:{display:`none`}}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>N.current?.click(),className:`icon-button`,title:`Attach file`,disabled:!W,children:(0,$.jsx)(ie,{size:19})}),(0,$.jsx)(`button`,{type:`button`,onClick:T?Ce:Se,className:`icon-button`,title:T?`Stop voice recording`:`Record voice message`,disabled:!W&&!T,children:T?(0,$.jsx)(n,{size:18}):(0,$.jsx)(e,{size:19})}),(0,$.jsx)(`textarea`,{value:y,onChange:e=>ce(e.target.value),onKeyDown:we,placeholder:U?`Message ${U.name}...`:`Select contact first...`,rows:1,className:`textarea`,disabled:!W}),(0,$.jsxs)(`button`,{type:`button`,onClick:()=>K(),disabled:w||!W,className:`primary-button send-label`,children:[(0,$.jsx)(t,{size:17}),(0,$.jsx)(`span`,{children:w?`Sending`:`Send`})]})]})]})]})]})};export{ft as default};