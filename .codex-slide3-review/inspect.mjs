import fs from 'node:fs/promises';
import {FileBlob,PresentationFile} from 'file:///C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=await PresentationFile.importPptx(await FileBlob.load('C:/NAM4_2/DoAn/fastLock/Groq_AI_Module_LiveOrder.pptx'));
console.log((await p.inspect({kind:'slide,textbox,shape',maxChars:25000})).ndjson);
const s=p.slides.items[2];
const b=await p.export({slide:s,format:'png',scale:1});
await fs.writeFile('C:/NAM4_2/DoAn/fastLock/.codex-slide3-review/before.png',new Uint8Array(await b.arrayBuffer()));

