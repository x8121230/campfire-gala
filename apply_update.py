from pathlib import Path
import json,sys,shutil,datetime
HERE=Path(__file__).resolve().parent

def plan(root):
 changes=[];errors=[]
 if not (root/'src').is_dir():return [],['找不到 src，請選遊戲根目錄。']
 if not (root/'assets/wardrobe_v70/head_default.png').is_file():errors.append('缺少 assets/wardrobe_v70/head_default.png；需要目前使用的完整頭部素材。')
 for e in json.loads((HERE/'patch.json').read_text(encoding='utf8')):
  rel=e['path'];dest=root/rel;new=(HERE/'payload'/rel).read_bytes()
  if not dest.exists():
   if e['variants'] and rel!='src/data/SubmapDollLayout.js':errors.append(rel+'：原程式缺失');continue
   changes.append((rel,new));continue
  old=dest.read_bytes()
  if old==new:continue
  if rel.endswith('.png'):errors.append(rel+'：已有不同素材，未覆蓋');continue
  original=old.decode('utf-8-sig').replace('\r\n','\n');result=None
  for hunks in e['variants']:
   trial=original
   for before,after in hunks:
    if trial.count(after)==1:continue
    if trial.count(before)!=1:break
    trial=trial.replace(before,after,1)
   else:result=trial;break
  if result is None:errors.append(rel+'：版本片段不同，需要合併最新檔案');continue
  if result==original:continue
  newline='\r\n' if b'\r\n' in old else '\n'
  changes.append((rel,result.replace('\n',newline).encode('utf8')))
 return changes,errors

def main():
 if len(sys.argv)>1:root=Path(sys.argv[1]).resolve()
 else:
  import tkinter as tk
  from tkinter import filedialog
  app=tk.Tk();app.withdraw();chosen=filedialog.askdirectory(title='選擇遊戲根目錄（內含 src 與 assets）');app.destroy()
  if not chosen:return
  root=Path(chosen)
 changes,errors=plan(root)
 if errors:
  report=HERE/'修補衝突報告.txt';report.write_text('\n'.join(errors),encoding='utf8')
  print('尚未修改任何遊戲檔案。請把下列最新檔案與此報告提供給我：\n'+'\n'.join(errors));return 2
 if not changes:print('已是本次更新版本，不重複放大。');return 0
 backup=root/('_backup_cabin705_'+datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f'))
 backup.mkdir();done=[]
 try:
  for rel,data in changes:
   dest=root/rel
   if dest.exists():
    saved=backup/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dest,saved)
  for rel,data in changes:
   dest=root/rel;dest.parent.mkdir(parents=True,exist_ok=True);done.append(rel);dest.write_bytes(data)
 except Exception:
  for rel in done:
   dest=root/rel;saved=backup/rel
   if saved.exists():shutil.copy2(saved,dest)
   else:dest.unlink(missing_ok=True)
  raise
 (backup/'changed.json').write_text(json.dumps([r for r,_ in changes]),encoding='utf8')
 print('完成：'+str(len(changes))+' 個變更檔案。備份：'+str(backup)+'\n重新開啟遊戲並 Ctrl+F5，再進入小屋領取三件裝備。')
 return 0
if __name__=='__main__':sys.exit(main())
