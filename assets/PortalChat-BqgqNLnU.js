import{t as e}from"./mic-jadWttKZ.js";import{t}from"./send-DLizrUAS.js";import{t as n}from"./square-DGFiK1Cz.js";import{t as r}from"./trash-2-Dz6UXHwf.js";import{c as i,h as a,n as o,r as s,t as c,u as l}from"./index-CprAr5jo.js";var u=l(`check-check`,[[`path`,{d:`M18 6 7 17l-5-5`,key:`116fxf`}],[`path`,{d:`m22 10-7.5 7.5L13 16`,key:`ke71qq`}]]),d=l(`image`,[[`rect`,{width:`18`,height:`18`,x:`3`,y:`3`,rx:`2`,ry:`2`,key:`1m3agn`}],[`circle`,{cx:`9`,cy:`9`,r:`2`,key:`af1f0g`}],[`path`,{d:`m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21`,key:`1xmnt7`}]]),f=l(`lock`,[[`rect`,{width:`18`,height:`11`,x:`3`,y:`11`,rx:`2`,ry:`2`,key:`1w4ew1`}],[`path`,{d:`M7 11V7a5 5 0 0 1 10 0v4`,key:`fwvmzm`}]]),p=l(`paperclip`,[[`path`,{d:`m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551`,key:`1miecu`}]]),m=l(`phone`,[[`path`,{d:`M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384`,key:`9njp5v`}]]),h=l(`video`,[[`path`,{d:`m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5`,key:`ftymec`}],[`rect`,{x:`2`,y:`6`,width:`14`,height:`12`,rx:`2`,key:`158x01`}]]),g=a(),_=c(),v=e=>{if(!e)return``;if(/^https?:\/\//i.test(e))return e;let t=String(e).replace(/^\/+/,``);return`${o.defaults.baseURL}/${t}`},y=e=>{if(!e)return`Last seen not available`;let t=new Date(e),n=Date.now()-t.getTime(),r=Math.max(1,Math.round(n/6e4));return r<2?`Last seen just now`:r<60?`Last seen ${r} min ago`:`Last seen ${t.toLocaleString([],{dateStyle:`medium`,timeStyle:`short`})}`},b=()=>{let a=s(),[c,l]=(0,g.useState)([]),[b,x]=(0,g.useState)(``),[S,C]=(0,g.useState)(``),[w,T]=(0,g.useState)(``),[E,D]=(0,g.useState)([]),[O,k]=(0,g.useState)(``),[A,j]=(0,g.useState)(null),[M,N]=(0,g.useState)(``),[P,F]=(0,g.useState)(!0),[I,L]=(0,g.useState)(!1),[R,z]=(0,g.useState)(!1),B=(0,g.useRef)(null),V=(0,g.useRef)(null),H=(0,g.useRef)(null),U=(0,g.useRef)([]),W=c.find(e=>String(e.id)===String(b)),G=b&&String(S)===String(b),K=async({silent:e=!1}={})=>{try{let t=await o.get(`/api/chat/contacts`),n=Array.isArray(t.data)?t.data:[];l(n),x(e=>e||String(n[0]?.id||``)),e||N(``)}catch(t){console.error(`Chat contacts failed`,t),e||N(t.response?.data?.message||`Contacts could not be loaded.`)}finally{F(!1)}},q=async({silent:e=!1}={})=>{if(!b||!G){D([]),F(!1);return}try{let t=await o.get(`/api/chat/messages`,{params:{recipientId:b,chatCode:w}});D(Array.isArray(t.data)?t.data:[]),e||N(``)}catch(t){console.error(`Chat fetch failed`,t),e||N(t.response?.data?.message||`Chat could not be loaded.`),t.response?.status===403&&C(``)}finally{F(!1)}};(0,g.useEffect)(()=>{K();let e=window.setInterval(()=>{o.post(`/api/chat/heartbeat`).catch(()=>{}),K({silent:!0})},3e4);return()=>window.clearInterval(e)},[]),(0,g.useEffect)(()=>{C(``),T(``),D([])},[b]),(0,g.useEffect)(()=>{q();let e=window.setInterval(()=>q({silent:!0}),5e3);return()=>window.clearInterval(e)},[b,G,w]),(0,g.useEffect)(()=>{B.current?.scrollIntoView({behavior:`smooth`})},[E.length]);let J=async()=>{if(!b){N(`Select a student or teacher first.`);return}if(w.trim().length<4){N(`Enter the private code. Both users must type the same code.`);return}try{F(!0),await o.post(`/api/chat/session`,{recipientId:b,chatCode:w.trim()}),C(b),N(``)}catch(e){console.error(`Chat unlock failed`,e),N(e.response?.data?.message||`Chat code could not be verified.`)}finally{F(!1)}},Y=async(e=null)=>{let t=e||A;if(!O.trim()&&!t){N(`Type a message or attach a picture/video/voice note.`);return}if(!G){N(`Unlock this chat with the private code first.`);return}try{L(!0);let e=new FormData;e.append(`text`,O.trim()),e.append(`recipientId`,b),e.append(`chatCode`,w.trim()),t&&e.append(`file`,t),await o.post(`/api/chat/messages`,e),k(``),j(null),V.current&&(V.current.value=``),await q({silent:!0})}catch(e){console.error(`Chat send failed`,e),N(e.response?.data?.message||`Message could not be sent.`)}finally{L(!1)}},X=async()=>{if(!G){N(`Unlock this chat with the private code before clearing it.`);return}if(window.confirm(`Clear this secure chat for both users? A new code will be required next time.`))try{await o.delete(`/api/chat/messages`,{params:{recipientId:b,chatCode:w}}),D([]),C(``),T(``),N(`Chat cleared for both users. Set a new code to chat again.`)}catch(e){console.error(`Chat clear failed`,e),N(e.response?.data?.message||`Chat could not be cleared.`)}},Z=async()=>{if(!G){N(`Unlock this chat with the private code before recording a voice note.`);return}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){N(`Voice recording is not supported in this browser.`);return}try{let e=await navigator.mediaDevices.getUserMedia({audio:!0}),t=new MediaRecorder(e);U.current=[],t.ondataavailable=e=>{e.data.size&&U.current.push(e.data)},t.onstop=async()=>{e.getTracks().forEach(e=>e.stop());let t=new Blob(U.current,{type:`audio/webm`}),n=new File([t],`voice-note-${Date.now()}.webm`,{type:`audio/webm`});z(!1),await Y(n)},H.current=t,t.start(),z(!0)}catch(e){console.error(`Voice recording failed`,e),N(`Microphone permission is required for voice notes.`)}},Q=()=>{H.current?.stop()},ee=e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),Y())},$=e=>{N(`${e} call option is ready for this contact. Connect a real calling service/WebRTC to start live calls.`)};return(0,_.jsxs)(`div`,{className:`portal-chat`,children:[(0,_.jsx)(`style`,{children:`
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
          .input-row { grid-template-columns: 40px 40px minmax(0, 1fr) 44px; }
          .primary-button.send-label span { display: none; }
          .composer { padding: 10px; }
        }
      `}),(0,_.jsxs)(`aside`,{className:`chat-sidebar`,children:[(0,_.jsxs)(`div`,{className:`chat-brand`,children:[(0,_.jsx)(`div`,{className:`chat-brand-icon`,children:(0,_.jsx)(i,{size:24})}),(0,_.jsxs)(`div`,{children:[(0,_.jsx)(`h1`,{className:`chat-title`,children:`Portal Chat`}),(0,_.jsx)(`p`,{className:`chat-subtitle`,children:`Private teacher-student messages`})]})]}),(0,_.jsxs)(`select`,{className:`contact-select`,value:b,onChange:e=>x(e.target.value),children:[c.length===0?(0,_.jsx)(`option`,{value:``,children:`No contacts found`}):null,c.map(e=>(0,_.jsxs)(`option`,{value:e.id,children:[e.name,` (`,e.role,`)`]},e.id))]}),(0,_.jsx)(`div`,{className:`contact-list`,children:c.map(e=>(0,_.jsxs)(`button`,{type:`button`,className:`contact-item ${String(e.id)===String(b)?`active`:``}`,onClick:()=>x(String(e.id)),children:[(0,_.jsxs)(`div`,{className:`contact-main`,children:[(0,_.jsx)(`span`,{className:`contact-name`,children:e.name}),(0,_.jsx)(`span`,{className:`status-dot ${e.online?`online`:``}`})]}),(0,_.jsxs)(`div`,{className:`contact-meta`,children:[e.role,` `,e.rollNumber?`- ${e.rollNumber}`:``,` -`,` `,e.online?`Online`:y(e.lastSeenAt)]})]},e.id))}),(0,_.jsxs)(`div`,{className:`signed-in`,children:[`Signed in as `,(0,_.jsx)(`strong`,{children:a?.name||a?.email||`Portal user`}),(0,_.jsx)(`div`,{children:a?.role||`user`})]})]}),(0,_.jsxs)(`main`,{className:`chat-main`,children:[(0,_.jsxs)(`header`,{className:`chat-header`,children:[(0,_.jsxs)(`div`,{className:`chat-person`,children:[(0,_.jsx)(`h2`,{children:W?W.name:`Select a contact`}),(0,_.jsx)(`div`,{className:`presence ${W?.online?`online`:``}`,children:W?.online?`Online`:y(W?.lastSeenAt)})]}),(0,_.jsxs)(`div`,{className:`header-actions`,children:[(0,_.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Audio call`,onClick:()=>$(`Audio`),children:(0,_.jsx)(m,{size:19})}),(0,_.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Video call`,onClick:()=>$(`Video`),children:(0,_.jsx)(h,{size:19})}),(0,_.jsx)(`button`,{type:`button`,className:`icon-button`,title:`Clear chat`,onClick:X,children:(0,_.jsx)(r,{size:19})})]})]}),M?(0,_.jsx)(`div`,{className:`notice`,children:M}):null,G?null:(0,_.jsxs)(`section`,{className:`lock-panel`,children:[(0,_.jsx)(f,{size:22,color:`#2563eb`}),(0,_.jsxs)(`div`,{className:`lock-copy`,children:[(0,_.jsx)(`strong`,{children:`Secure code required`}),(0,_.jsx)(`small`,{children:`First time both users type the same code. Next time this chat asks for that code again.`})]}),(0,_.jsx)(`input`,{className:`code-input`,value:w,onChange:e=>T(e.target.value),onKeyDown:e=>{e.key===`Enter`&&J()},type:`password`,placeholder:`Private code`}),(0,_.jsxs)(`button`,{type:`button`,className:`primary-button`,onClick:J,children:[(0,_.jsx)(f,{size:17}),` Open`]})]}),(0,_.jsxs)(`section`,{className:`messages`,children:[P?(0,_.jsx)(`div`,{className:`empty`,children:`Loading chat...`}):null,!P&&!b?(0,_.jsx)(`div`,{className:`empty`,children:`Select a student or teacher.`}):null,!P&&b&&!G?(0,_.jsx)(`div`,{className:`empty`,children:`Enter the private code to open this secure chat.`}):null,!P&&b&&G&&E.length===0?(0,_.jsx)(`div`,{className:`empty`,children:`No messages yet with this user.`}):null,E.map(e=>{let t=String(e.senderId)===String(a?.id||a?._id);return(0,_.jsx)(`article`,{className:`message-row ${t?`mine`:``}`,children:(0,_.jsxs)(`div`,{className:`message-bubble`,children:[(0,_.jsxs)(`div`,{className:`message-meta`,children:[(0,_.jsxs)(`span`,{children:[e.senderName||`Portal User`,` - `,e.senderRole]}),t?(0,_.jsxs)(`span`,{className:`read-tick ${e.readAt?`seen`:`sent`}`,children:[(0,_.jsx)(u,{size:15}),` `,e.readAt?`Seen`:`Sent`]}):null]}),e.text?(0,_.jsx)(`p`,{className:`message-text`,children:e.text}):null,e.fileUrl&&e.fileType===`image`?(0,_.jsx)(`img`,{src:v(e.fileUrl),alt:`Chat attachment`,className:`message-media`}):null,e.fileUrl&&e.fileType===`video`?(0,_.jsx)(`video`,{src:v(e.fileUrl),controls:!0,className:`message-media`}):null,e.fileUrl&&e.fileType===`audio`?(0,_.jsx)(`audio`,{src:v(e.fileUrl),controls:!0,className:`message-media`}):null]})},e._id)}),(0,_.jsx)(`div`,{ref:B})]}),(0,_.jsxs)(`footer`,{className:`composer`,children:[A?(0,_.jsxs)(`div`,{className:`file-pill`,children:[A.type.startsWith(`video/`)?(0,_.jsx)(h,{size:15}):A.type.startsWith(`audio/`)?(0,_.jsx)(e,{size:15}):(0,_.jsx)(d,{size:15}),(0,_.jsx)(`span`,{children:A.name}),(0,_.jsx)(`button`,{type:`button`,onClick:()=>j(null),children:`x`})]}):null,(0,_.jsxs)(`div`,{className:`input-row`,children:[(0,_.jsx)(`input`,{ref:V,type:`file`,accept:`image/*,video/*,audio/*`,onChange:e=>j(e.target.files?.[0]||null),style:{display:`none`}}),(0,_.jsx)(`button`,{type:`button`,onClick:()=>V.current?.click(),className:`icon-button`,title:`Attach file`,disabled:!G,children:(0,_.jsx)(p,{size:19})}),(0,_.jsx)(`button`,{type:`button`,onClick:R?Q:Z,className:`icon-button`,title:R?`Stop voice recording`:`Record voice message`,disabled:!G&&!R,children:R?(0,_.jsx)(n,{size:18}):(0,_.jsx)(e,{size:19})}),(0,_.jsx)(`textarea`,{value:O,onChange:e=>k(e.target.value),onKeyDown:ee,placeholder:W?`Message ${W.name}...`:`Select contact first...`,rows:1,className:`textarea`,disabled:!G}),(0,_.jsxs)(`button`,{type:`button`,onClick:()=>Y(),disabled:I||!G,className:`primary-button send-label`,children:[(0,_.jsx)(t,{size:17}),(0,_.jsx)(`span`,{children:I?`Sending`:`Send`})]})]})]})]})]})};export{b as default};