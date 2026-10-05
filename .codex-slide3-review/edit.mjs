import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {FileBlob,PresentationFile} from 'file:///C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/NAM4_2/DoAn/fastLock';
const skill='C:/Users/asus/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations';
const p=await PresentationFile.importPptx(await FileBlob.load(root+'/Groq_AI_Module_LiveOrder.pptx'));
const edit=(id,pairs)=>{const t=p.resolve(id); for(const [a,b] of pairs)t.text.replace(a,b);};
edit('sh/298ryl4v',[['Bản Chất Groq & Cách Đồ Án Sử Dụng','GroqCloud Trong LiveOrder & Lý Do Lựa Chọn']]);
edit('sh/3ah8rqlg',[['Phân định rõ vai trò của Qwen, GroqCloud và luồng tích hợp với NestJS','Qwen sinh câu trả lời; GroqCloud cung cấp hạ tầng chạy mô hình']]);
edit('sh/obq90bml',[
['Mô hình AI xử lý nội dung, thấu hiểu ngữ cảnh câu hỏi và sinh câu trả lời tư vấn.','Mô hình xử lý ngữ cảnh và sinh câu trả lời tư vấn.'],
['Dịch vụ đám mây chạy mô hình và cung cấp API suy luận tốc độ cao cho ứng dụng.','Dịch vụ chạy mô hình trên hạ tầng suy luận LPU và cung cấp API.'],
['Thư viện cài đặt trong NestJS (groq-sdk) để gửi nhận dữ liệu trực tiếp với GroqCloud.','Thư viện giúp Backend NestJS gọi API và nhận câu trả lời.'],
['NestJS → gửi câu hỏi + Knowledge Base + lịch sử → GroqCloud chạy Qwen → nhận câu trả lời.','NestJS gửi câu hỏi + KB + lịch sử → Qwen trên GroqCloud → Backend nhận và lưu câu trả lời.']]);
edit('sh/pcjqtg36',[
['✔ Tốc độ phản hồi cực nhanh (~200ms - 500ms):','✔ Ưu tiên chi phí thử nghiệm:'],
['Hạ tầng GroqCloud tối ưu hóa suy luận siêu tốc, khách hàng nhận phản hồi gần như tức thì.','Hạn mức miễn phí phù hợp để nhóm kiểm thử nhiều lượt hỏi đáp trong giai đoạn đồ án.'],
['✔ Không cần tự vận hành hạ tầng AI:','✔ Phản hồi nhanh trong thử nghiệm:'],
['Ứng dụng gọi trực tiếp qua API đám mây, không tốn tài nguyên máy chủ hay chi phí thuê GPU riêng.','Nhóm đã thử hỏi đáp và ghi nhận phản hồi nhanh, phù hợp với trải nghiệm tư vấn trong Inbox.'],
['✔ Hạn mức miễn phí (Free Tier) dồi dào:','✔ Không cần tự triển khai mô hình:'],
['Cho phép gọi hàng nghìn token/ngày mà không tốn chi phí, rất thích hợp cho thử nghiệm đồ án.','Backend gọi API; nhóm không cần tự cài mô hình hoặc thuê GPU riêng.'],
['✔ Tập trung tư vấn bằng văn bản:','• Phạm vi triển khai hiện tại:'],
['Sử dụng câu hỏi, Knowledge Base và lịch sử hội thoại; giữ phạm vi triển khai gọn gàng, ổn định.','Tư vấn bằng văn bản dựa trên KB và lịch sử. Đây là phạm vi đồ án, không phải giới hạn của Groq.']]);
p.slides.items[2].speakerNotes.textFrame.setText('Lý do lựa chọn chính: chi phí thử nghiệm. Nhóm đã thử hỏi đáp và đánh giá phản hồi nhanh; chưa có số liệu thời gian đo cụ thể nên slide không ghi 200–500 ms. GroqCloud là dịch vụ inference; Qwen là mô hình. Model trong ai.service.ts: qwen/qwen3.8-27b. Hạn mức gồm request và token, kiểm tra quota thực tế trong Console. Nguồn: https://console.groq.com/docs/rate-limits ; https://console.groq.com/docs/vision . Chỉ chỉnh slide 3.');
await fs.mkdir(root+'/artifacts',{recursive:true});
const candidate=root+'/.codex-slide3-review/candidate.pptx';
await (await PresentationFile.exportPptx(p)).save(candidate);
const {finalizePresentation}=await import(pathToFileURL(skill+'/container_tools/artifact_tool_utils.mjs').href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:root+'/artifacts/Groq_AI_Module_LiveOrder_slide3_updated.pptx',pythonExecutable:'C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12191365,6858000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:4,verifyArtifactToolImport:true,receiptPath:root+'/.codex-slide3-review/validation.json'});
for(let i=0;i<p.slides.items.length;i++){
const png=await p.export({slide:p.slides.items[i],format:'png',scale:1});
await fs.writeFile(root+'/.codex-slide3-review/after-'+(i+1)+'.png',new Uint8Array(await png.arrayBuffer()));
}
console.log('Saved updated deck');

