import{t as e}from"./mic-DI231pqe.js";import{t}from"./send-Cf8mFvMB.js";import{t as n}from"./square-BNASWqnj.js";import{t as r}from"./trash-2-CCPTbGB-.js";import{d as i,g as a,i as o,l as s,n as c,r as ee,t as l}from"./index-C6xJmreT.js";var u=i(`check-check`,[[`path`,{d:`M18 6 7 17l-5-5`,key:`116fxf`}],[`path`,{d:`m22 10-7.5 7.5L13 16`,key:`ke71qq`}]]),te=i(`image`,[[`rect`,{width:`18`,height:`18`,x:`3`,y:`3`,rx:`2`,ry:`2`,key:`1m3agn`}],[`circle`,{cx:`9`,cy:`9`,r:`2`,key:`af1f0g`}],[`path`,{d:`m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21`,key:`1xmnt7`}]]),d=i(`lock`,[[`rect`,{width:`18`,height:`11`,x:`3`,y:`11`,rx:`2`,ry:`2`,key:`1w4ew1`}],[`path`,{d:`M7 11V7a5 5 0 0 1 10 0v4`,key:`fwvmzm`}]]),ne=i(`paperclip`,[[`path`,{d:`m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551`,key:`1miecu`}]]),re=i(`phone-off`,[[`path`,{d:`M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272`,key:`1wngk7`}],[`path`,{d:`M22 2 2 22`,key:`y4kqgn`}],[`path`,{d:`M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473`,key:`10hv5p`}]]),f=i(`phone`,[[`path`,{d:`M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384`,key:`9njp5v`}]]),p=i(`video`,[[`path`,{d:`m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5`,key:`ftymec`}],[`rect`,{x:`2`,y:`6`,width:`14`,height:`12`,rx:`2`,key:`158x01`}]]),m=a(),h=l(),g=e=>{if(!e)return``;if(/^https?:\/\//i.test(e))return e;let t=String(e).replace(/^\/+/,``);return`${c.defaults.baseURL}/${t}`},_=e=>{if(!e)return`Last seen not available`;let t=new Date(e),n=Date.now()-t.getTime(),r=Math.max(1,Math.round(n/6e4));return r<2?`Last seen just now`:r<60?`Last seen ${r} min ago`:`Last seen ${t.toLocaleString([],{dateStyle:`medium`,timeStyle:`short`})}`},v=()=>{let i=o(),[a,l]=(0,m.useState)([]),[v,y]=(0,m.useState)(``),[b,x]=(0,m.useState)(``),[S,C]=(0,m.useState)(``),[w,T]=(0,m.useState)([]),[E,D]=(0,m.useState)(``),[O,k]=(0,m.useState)(null),[A,j]=(0,m.useState)(``),[M,N]=(0,m.useState)(!0),[P,F]=(0,m.useState)(!1),[I,L]=(0,m.useState)(!1),[R,z]=(0,m.useState)(null),B=(0,m.useRef)(null),V=(0,m.useRef)(null),H=(0,m.useRef)(null),U=(0,m.useRef)(null),W=(0,m.useRef)(null),G=(0,m.useRef)([]),K=a.find(e=>String(e.id)===String(v)),q=v&&String(b)===String(v),J=async({silent:e=!1}={})=>{try{let t=await c.get(`/api/chat/contacts`),n=Array.isArray(t.data)?t.data:[];l(n),y(e=>e||String(n[0]?.id||``)),e||j(``)}catch(t){console.error(`Chat contacts failed`,t),e||j(t.response?.data?.message||`Contacts could not be loaded.`)}finally{N(!1)}},Y=async({silent:e=!1}={})=>{if(!v||!q){T([]),N(!1);return}try{let t=await c.get(`/api/chat/messages`,{params:{recipientId:v,chatCode:S}});T(Array.isArray(t.data)?t.data:[]),e||j(``)}catch(t){console.error(`Chat fetch failed`,t),e||j(t.response?.data?.message||`Chat could not be loaded.`),t.response?.status===403&&x(``)}finally{N(!1)}};(0,m.useEffect)(()=>{let e=()=>{c.post(`/api/chat/heartbeat`).catch(()=>{})},t=()=>{c.post(`/api/chat/offline`).catch(()=>{})},n=()=>{let e=ee(),t=`${c.defaults.baseURL}/api/chat/offline`;fetch(t,{method:`POST`,headers:e?{Authorization:`Bearer ${e}`}:{},keepalive:!0}).catch(()=>{})},r=()=>{document.visibilityState===`hidden`?n():(e(),J({silent:!0}))};J(),e();let i=window.setInterval(()=>{e(),J({silent:!0})},3e4);return document.addEventListener(`visibilitychange`,r),window.addEventListener(`pagehide`,n),window.addEventListener(`beforeunload`,n),()=>{window.clearInterval(i),document.removeEventListener(`visibilitychange`,r),window.removeEventListener(`pagehide`,n),window.removeEventListener(`beforeunload`,n),t()}},[]),(0,m.useEffect)(()=>{x(``),C(``),T([])},[v]),(0,m.useEffect)(()=>{Y();let e=window.setInterval(()=>Y({silent:!0}),5e3);return()=>window.clearInterval(e)},[v,q,S]),(0,m.useEffect)(()=>{B.current?.scrollIntoView({behavior:`smooth`})},[w.length]),(0,m.useEffect)(()=>{H.current&&R?.type===`video`&&U.current&&(H.current.srcObject=U.current)},[R]);let X=async()=>{if(!v){j(`Select a student or teacher first.`);return}if(S.trim().length<4){j(`Enter the private code. Both users must type the same code.`);return}try{N(!0),await c.post(`/api/chat/session`,{recipientId:v,chatCode:S.trim()}),x(v),j(``)}catch(e){console.error(`Chat unlock failed`,e),j(e.response?.data?.message||`Chat code could not be verified.`)}finally{N(!1)}},Z=async(e=null)=>{let t=e||O;if(!E.trim()&&!t){j(`Type a message or attach a picture/video/voice note.`);return}if(!q){j(`Unlock this chat with the private code first.`);return}try{F(!0);let e=new FormData;e.append(`text`,E.trim()),e.append(`recipientId`,v),e.append(`chatCode`,S.trim()),t&&e.append(`file`,t),await c.post(`/api/chat/messages`,e),D(``),k(null),V.current&&(V.current.value=``),await Y({silent:!0})}catch(e){console.error(`Chat send failed`,e),j(e.response?.data?.message||`Message could not be sent.`)}finally{F(!1)}},ie=async()=>{if(!q){j(`Unlock this chat with the private code before clearing it.`);return}if(window.confirm(`Clear this secure chat for both users? A new code will be required next time.`))try{await c.delete(`/api/chat/messages`,{params:{recipientId:v,chatCode:S}}),T([]),x(``),C(``),j(`Chat cleared for both users. Set a new code to chat again.`)}catch(e){console.error(`Chat clear failed`,e),j(e.response?.data?.message||`Chat could not be cleared.`)}},ae=async()=>{if(!q){j(`Unlock this chat with the private code before recording a voice note.`);return}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){j(`Voice recording is not supported in this browser.`);return}try{let e=await navigator.mediaDevices.getUserMedia({audio:!0}),t=new MediaRecorder(e);G.current=[],t.ondataavailable=e=>{e.data.size&&G.current.push(e.data)},t.onstop=async()=>{e.getTracks().forEach(e=>e.stop());let t=new Blob(G.current,{type:`audio/webm`}),n=new File([t],`voice-note-${Date.now()}.webm`,{type:`audio/webm`});L(!1),await Z(n)},W.current=t,t.start(),L(!0)}catch(e){console.error(`Voice recording failed`,e),j(`Microphone permission is required for voice notes.`)}},oe=()=>{W.current?.stop()},se=e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),Z())},Q=()=>{U.current?.getTracks().forEach(e=>e.stop()),U.current=null,z(null)},$=async e=>{if(!K){j(`Select a student or teacher first.`);return}if(!q){j(`Unlock this chat with the private code before starting a call.`);return}try{Q(),U.current=await navigator.mediaDevices.getUserMedia(e===`video`?{audio:!0,video:!0}:{audio:!0}),j(``),z({type:e,startedAt:Date.now(),status:`calling`})}catch(t){console.error(`Call permission failed`,t),j(e===`video`?`Camera and microphone permission is required for video call.`:`Microphone permission is required for audio call.`)}};return(0,m.useEffect)(()=>()=>{U.current?.getTracks().forEach(e=>e.stop())},[]),(0,m.useEffect)(()=>{Q()},[v]),(0,h.jsxs)(`div`,{className:`portal-chat`,children:[(0,h.jsx)(`style`,{children:`
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
      `}),(0,h.jsxs)(`aside`,{className:`chat-sidebar`,children:[(0,h.jsxs)(`div`,{className:`chat-brand`,children:[(0,h.jsx)(`div`,{className:`chat-brand-icon`,children:(0,h.jsx)(s,{size:24})}),(0,h.jsxs)(`div`,{children:[(0,h.jsx)(`h1`,{className:`chat-title`,children:`Portal Chat`}),(0,h.jsx)(`p`,{className:`chat-subtitle`,children:`Private teacher-student messages`})]})]}),(0,h.jsxs)(`select`,{className:`contact-select`,value:v,onChange:e=>y(e.target.value),children:[a.length===0?(0,h.jsx)(`option`,{value:``,children:`No contacts found`}):null,a.map(e=>(0,h.jsxs)(`option`,{value:e.id,children:[e.name,` (`,e.role,`)`]},e.id))]}),(0,h.jsx)(`div`,{className:`contact-list`,children:a.map(e=>(0,h.jsxs)(`button`,{type:`button`,className:`contact-item ${String(e.id)===String(v)?`active`:``}`,onClick:()=>y(String(e.id)),children:[(0,h.jsxs)(`div`,{className:`contact-main`,children:[(0,h.jsx)(`span`,{className:`contact-name`,children:e.name}),(0,h.jsx)(`span`,{className:`status-dot ${e.online?`online`:``}`})]}),(0,h.jsxs)(`div`,{className:`contact-meta`,children:[e.role,` `,e.rollNumber?`- ${e.rollNumber}`:``,` -`,` `,e.online?`Online`:_(e.lastSeenAt)]})]},e.id))}),(0,h.jsxs)(`div`,{className:`signed-in`,children:[`Signed in as `,(0,h.jsx)(`strong`,{children:i?.name||i?.email||`Portal user`}),(0,h.jsx)(`div`,{children:i?.role||`user`})]})]}),(0,h.jsxs)(`main`,{className:`chat-main`,children:[(0,h.jsxs)(`header`,{className:`chat-header`,children:[(0,h.jsxs)(`div`,{className:`chat-person`,children:[(0,h.jsx)(`h2`,{children:K?K.name:`Select a contact`}),(0,h.jsx)(`div`,{className:`presence ${K?.online?`online`:``}`,children:K?.online?`Online`:_(K?.lastSeenAt)})]}),(0,h.jsxs)(`div`,{className:`header-actions`,children:[(0,h.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Audio call`,onClick:()=>$(`audio`),disabled:!q,children:(0,h.jsx)(f,{size:19})}),(0,h.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Video call`,onClick:()=>$(`video`),disabled:!q,children:(0,h.jsx)(p,{size:19})}),(0,h.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Clear chat`,onClick:ie,children:(0,h.jsx)(r,{size:19})})]})]}),A?(0,h.jsx)(`div`,{className:`notice`,children:A}):null,R?(0,h.jsxs)(`section`,{className:`call-panel`,children:[(0,h.jsxs)(`div`,{className:`call-info`,children:[(0,h.jsx)(`div`,{className:`call-avatar`,children:R.type===`video`?(0,h.jsx)(p,{size:23}):(0,h.jsx)(f,{size:23})}),(0,h.jsxs)(`div`,{children:[(0,h.jsxs)(`strong`,{children:[R.type===`video`?`Video call`:`Audio call`,` with `,K?.name]}),(0,h.jsx)(`span`,{children:`Calling...`})]})]}),(0,h.jsx)(`button`,{type:`button`,className:`end-call`,title:`End call`,onClick:Q,children:(0,h.jsx)(re,{size:21})}),R.type===`video`?(0,h.jsx)(`video`,{ref:H,className:`call-video`,autoPlay:!0,muted:!0,playsInline:!0}):null]}):null,q?null:(0,h.jsxs)(`section`,{className:`lock-panel`,children:[(0,h.jsx)(d,{size:22,color:`#2563eb`}),(0,h.jsxs)(`div`,{className:`lock-copy`,children:[(0,h.jsx)(`strong`,{children:`Secure code required`}),(0,h.jsx)(`small`,{children:`First time both users type the same code. Next time this chat asks for that code again.`})]}),(0,h.jsx)(`input`,{className:`code-input`,value:S,onChange:e=>C(e.target.value),onKeyDown:e=>{e.key===`Enter`&&X()},type:`password`,placeholder:`Private code`}),(0,h.jsxs)(`button`,{type:`button`,className:`primary-button`,onClick:X,children:[(0,h.jsx)(d,{size:17}),` Open`]})]}),(0,h.jsxs)(`section`,{className:`messages`,children:[M?(0,h.jsx)(`div`,{className:`empty`,children:`Loading chat...`}):null,!M&&!v?(0,h.jsx)(`div`,{className:`empty`,children:`Select a student or teacher.`}):null,!M&&v&&!q?(0,h.jsx)(`div`,{className:`empty`,children:`Enter the private code to open this secure chat.`}):null,!M&&v&&q&&w.length===0?(0,h.jsx)(`div`,{className:`empty`,children:`No messages yet with this user.`}):null,w.map(e=>{let t=String(e.senderId)===String(i?.id||i?._id);return(0,h.jsx)(`article`,{className:`message-row ${t?`mine`:``}`,children:(0,h.jsxs)(`div`,{className:`message-bubble`,children:[(0,h.jsxs)(`div`,{className:`message-meta`,children:[(0,h.jsxs)(`span`,{children:[e.senderName||`Portal User`,` - `,e.senderRole]}),t?(0,h.jsxs)(`span`,{className:`read-tick ${e.readAt?`seen`:`sent`}`,children:[(0,h.jsx)(u,{size:15}),` `,e.readAt?`Seen`:`Sent`]}):null]}),e.text?(0,h.jsx)(`p`,{className:`message-text`,children:e.text}):null,e.fileUrl&&e.fileType===`image`?(0,h.jsx)(`img`,{src:g(e.fileUrl),alt:`Chat attachment`,className:`message-media`}):null,e.fileUrl&&e.fileType===`video`?(0,h.jsx)(`video`,{src:g(e.fileUrl),controls:!0,className:`message-media`}):null,e.fileUrl&&e.fileType===`audio`?(0,h.jsx)(`audio`,{src:g(e.fileUrl),controls:!0,className:`message-media`}):null]})},e._id)}),(0,h.jsx)(`div`,{ref:B})]}),(0,h.jsxs)(`footer`,{className:`composer`,children:[O?(0,h.jsxs)(`div`,{className:`file-pill`,children:[O.type.startsWith(`video/`)?(0,h.jsx)(p,{size:15}):O.type.startsWith(`audio/`)?(0,h.jsx)(e,{size:15}):(0,h.jsx)(te,{size:15}),(0,h.jsx)(`span`,{children:O.name}),(0,h.jsx)(`button`,{type:`button`,onClick:()=>k(null),children:`x`})]}):null,(0,h.jsxs)(`div`,{className:`input-row`,children:[(0,h.jsx)(`input`,{ref:V,type:`file`,accept:`image/*,video/*,audio/*`,onChange:e=>k(e.target.files?.[0]||null),style:{display:`none`}}),(0,h.jsx)(`button`,{type:`button`,onClick:()=>V.current?.click(),className:`icon-button`,title:`Attach file`,disabled:!q,children:(0,h.jsx)(ne,{size:19})}),(0,h.jsx)(`button`,{type:`button`,onClick:I?oe:ae,className:`icon-button`,title:I?`Stop voice recording`:`Record voice message`,disabled:!q&&!I,children:I?(0,h.jsx)(n,{size:18}):(0,h.jsx)(e,{size:19})}),(0,h.jsx)(`textarea`,{value:E,onChange:e=>D(e.target.value),onKeyDown:se,placeholder:K?`Message ${K.name}...`:`Select contact first...`,rows:1,className:`textarea`,disabled:!q}),(0,h.jsxs)(`button`,{type:`button`,onClick:()=>Z(),disabled:P||!q,className:`primary-button send-label`,children:[(0,h.jsx)(t,{size:17}),(0,h.jsx)(`span`,{children:P?`Sending`:`Send`})]})]})]})]})]})};export{v as default};