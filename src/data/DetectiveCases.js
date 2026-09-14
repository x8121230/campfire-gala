// Stable IDs are the save contract. Truth never changes when a case is replayed.
const clue=(id,name,text,place,kind='物證')=>({id,name,text,place,kind});
const place=(id,name,description,clues,actor=null)=>({id,name,description,clues,actor});
const person=(id,name,role,statement,claim,challenge=null)=>({id,name,role,statement,claim,challenge});
const deduction=(id,q,options,answer,proofs,why)=>({id,q,options,answer,proofs,why});
export const DETECTIVE_CAST={
 otter:{name:'水獺・波波',frame:0},bird:{name:'翠鳥・青羽',frame:1},rabbit:{name:'小兔・露米',frame:2},fox:{name:'小狐・栗栗',frame:3}
};
export const DETECTIVE_CASES=[
 {
  id:'moonfish',number:'01',title:'消失的月光魚',tag:'足跡 × 水流 × 善意的隱瞞',art:'dock',badge:'月光追跡者',
  intro:'月光節前夕，碼頭養池裡的月光魚全不見了。池蓋封條沒破，岸邊卻留下濕腳印和一根藍色羽毛。星燈請你找回魚，也請你先別急著指認小偷。',
  places:[
   place('pier','養池與棧橋','池面空蕩蕩。先分清楚：哪些痕跡真的發生在魚消失之後？',['tracks','seal']),
   place('gate','石砌水閘','一條窄水道穿過養池下方，水位比岸上的舊痕低了一截。',['gate']),
   place('reeds','發光蘆葦灣','水草向灣內倒伏。遠處有很微弱的銀色閃光。',['weed'],'rabbit'),
   place('boat','波波的小船','一隻蓋著濕布的活水箱放在船尾。波波擋在箱子前，笑得有點僵。',['tank'],'otter'),
   place('post','青羽的郵桌','藍色的東西卡在木縫裡；郵件每件都有出發時間。',['feather','delivery'],'bird'),
   place('workshop','栗栗的修繕角','工具擦得乾乾淨淨，留在牆上的告示卻被風吹翻了。',['notice'],'fox')
  ],
  clues:[
   clue('tracks','往返的濕腳印','帶蹼的腳印由船走到養池，再回到船；回程印子較深，壓在剛露出的濕泥上。','pier'),
   clue('seal','完整的池蓋封條','池蓋封條完整；池底另有連通水道。魚不一定從池蓋離開。','pier'),
   clue('gate','20:10 的開閘刻度','值班牌記錄今晚 20:10 開閘降水。水道箭頭指向蘆葦灣。','gate'),
   clue('weed','向灣內倒伏的水草','水草沿水道朝蘆葦灣倒伏，夾著月光魚的銀色鱗片。','reeds'),
   clue('tank','活水箱裡的銀光','掀開濕布：幾尾月光魚在充氣的活水箱裡。箱邊有蘆葦碎片，沒有魚網傷痕。','boat'),
   clue('feather','紙做的藍羽毛','放大看有剪刀邊和紙纖維，是郵件裝飾；背面印著昨天的節慶圖樣。','post'),
   clue('delivery','20:05 的簽收單','星燈的值班簿附在簽收單後：青羽 20:05 進入觀測台，20:25 才離開。這段時間她留在屋內整理星圖。','post'),
   clue('notice','修閘告示','栗栗寫著「20:10 降水，請先轉移養池魚群」。告示被風吹向牆面。','workshop'),
   clue('otter_s','波波的最初證詞','「我從八點起就沒搬過任何東西。那些腳印大概是昨天的。」','boat','證詞'),
   clue('bird_s','青羽的擔心','「大家看見藍羽毛就看我……但我今晚一直在送星圖。」','post','證詞'),
   clue('rabbit_s','露米的觀察','「20:15 我看見小魚在淺灘擠成一團。月光魚需要流動的水，困在淺水會很難受。」','reeds','證詞'),
   clue('fox_s','栗栗的疏忽','「我照表開閘，以為大家看過告示，沒有再去確認養池。」','workshop','證詞'),
   clue('route','魚群的水路','開閘方向與水草、魚鱗相互印證：魚沿池底水道被帶往蘆葦灣。',null,'推論'),
   clue('alibi','羽毛不能指認青羽','紙羽毛不是身體羽毛；簽收單也支持她當時在觀測台。',null,'推論'),
   clue('rescue','波波更正證詞','「20:20 我把困在淺灘的魚搬上船。怕大家怪我沒守好養池，就說沒搬東西。」',null,'更正證詞'),
   clue('care','露米的照護計畫','「把魚先留在活水箱，確認養池水深後再送回。波波救了魚，但還是應該說實話。」',null,'補充證詞'),
   clue('flow','水道重建結果','養池底道打開、出口朝蘆葦灣時，漂浮葉片會先到淺灣；封條完全不需碰觸。',null,'實驗')
  ],
  people:[
   person('otter','波波','擺渡人','otter_s','「八點之後我沒搬過任何東西。」',{evidence:'tank',reveal:'rescue',reply:'波波垂下耳朵，承認把魚搬進了活水箱。你記下他更正後的時間。'}),
   person('bird','青羽','湖畔郵差','bird_s','「藍色並不能證明那是我的羽毛。」'),
   person('rabbit','露米','星象觀察員','rabbit_s','「魚需要活水；牠們不是故意躲起來。」',{evidence:'rescue',reveal:'care',reply:'知道波波救魚的經過後，露米提出了安全送魚回家的方法。'}),
   person('fox','栗栗','修繕工匠','fox_s','「我貼了告示，但沒有確認大家讀到。」')
  ],
  combinations:[{inputs:['gate','weed'],output:'route'},{inputs:['feather','delivery'],output:'alibi'}],
  experiment:{title:'重建魚群的水路',requires:['gate','seal'],description:'依照現場痕跡設定模型。讓漂浮葉片重走當晚的水路，觀察魚能否在封條完好的情況下離開。',controls:[{label:'養池底道',options:['關閉','打開']},{label:'出口方向',options:['深湖','蘆葦灣','回養池']}],solution:[1,1],output:'flow',failure:['底道關閉，葉片留在養池；無法解釋消失。','葉片離開了，但目的地與水草和魚鱗的位置不同。']},
  deductions:[
   deduction('route_q','魚最初如何離開養池？',['有人撕掉封條再貼好','開閘後沿底道流向淺灣','青羽從空中叼走'],1,[['route','flow']],'水流痕跡與模型都支持底道；不用假設有人打開池蓋。'),
   deduction('who_q','之後是誰移動了魚？',['波波把魚由淺灣搬上船','栗栗把魚藏在工具箱','青羽把魚裝進郵袋'],0,[['tank','rescue']],'船上的魚和波波更正的證詞，指向同一次搬運。'),
   deduction('why_q','這次事件最合理的解釋是？',['波波為賣魚而預謀偷竊','魚消失只是大家看錯','降水造成危險，波波救魚卻隱瞞'],2,[['notice','rescue'],['rabbit_s','rescue']],'修閘降水在先，救魚在後；隱瞞不等於原本就打算偷魚。')
  ],
  timeline:[{id:'warn',text:'栗栗貼上降水告示',evidence:'notice'},{id:'open',text:'20:10 開閘，魚流入淺灣',evidence:'gate'},{id:'see',text:'20:15 露米看見淺灘魚群',evidence:'rabbit_s'},{id:'save',text:'20:20 波波搬魚上船',evidence:'rescue'}],
  timelineWhy:'告示先貼、開閘後魚進淺灣；露米看見魚受困，波波才把魚搬上船。',
  normal:'你找到月光魚，也還原了開閘與救魚的經過。波波向大家道歉。星燈提醒：結案之前，還可以查清青羽是否被誤會，以及魚回家後的照護。',
  full:'紙羽毛洗清了青羽的嫌疑。栗栗答應以後當面確認修繕通知，波波不再隱瞞，露米安排活水照護。月光魚回到安全的養池，第一盞節慶魚燈亮了。',
  fullRequires:['alibi','care'],secret:'救魚不是一個人的功勞：有人察覺危險，有人出手，也要有人改善制度。'
 },
 {
  id:'midnight',number:'02',title:'觀測台的午夜怪聲',tag:'不可靠的鐘 × 機械重現',art:'tower',badge:'午夜解謎者',
  intro:'觀測台傳來「嗚——叮、叮」的怪聲，露米的錄音卻寫著 00:10。大家明明在午夜聽見，難道有人倒轉了時間？請查清時刻與聲音的來源。',
  places:[
   place('clock','星象鐘座','指針仍在走，但校時卡被夾在鐘後。',['clock','record']),
   place('window','北側風窗','窗外小風輪正在慢慢轉，旁邊垂著兩支空心蘆笛。',['wind'],'bird'),
   place('gears','木齒輪平台','齒輪上纏著半截絲帶，每繞一圈就碰響小鈴。',['ribbon']),
   place('desk','觀測書桌','桌上的星圖與錄音紙帶一起留下了記錄。',['log'],'rabbit'),
   place('bench','栗栗的工具凳','少了一枚固定銷，工具盒裡有備品，還有一張維修便條。',['pin','memo'],'fox'),
   place('stairs','樓梯與值班簿','腳步声能傳得很遠；門簿卻記得誰真的上過樓。',['visits'],'otter')
  ],
  clues:[
   clue('clock','快十分鐘的星象鐘','校時卡：星象鐘比碼頭標準鐘快 10 分鐘，今晚尚未校正。','clock'),
   clue('record','00:10 的錄音紙帶','錄音機跟星象鐘走。00:10 記下「嗚——叮、叮」，每隔 6 秒重複。','clock'),
   clue('wind','午夜北風記錄','自記風向紙顯示 00:00 起北風吹進風窗；空心蘆笛口正對窗外。','window'),
   clue('ribbon','被夾住的節慶絲帶','絲帶仍連著裝飾架，末端繞在齒輪上，每圈能依序碰到兩隻鈴。','gears'),
   clue('log','露米的星圖筆記','23:58 露米在外平台畫星圖；00:00 記下聽見怪聲並跑回室內。','desk'),
   clue('pin','空著的固定銷孔','風輪和報時輪之間的隔離銷被抽走，風輪可帶動齒輪；備品在凳下。','bench'),
   clue('memo','23:40 維修便條','栗栗寫著：取下隔離銷測試，節慶佈置完畢後必須裝回。','bench'),
   clue('visits','出入值班簿','23:45 栗栗下樓；23:55 青羽送信後離開。午夜只有露米還在觀測台。','stairs'),
   clue('otter_s','波波的聽覺證詞','「碼頭鐘敲十二下時我聽到怪聲。可我只聽見聲音，沒看見樓上的人。」','stairs','證詞'),
   clue('bird_s','青羽的送信記憶','「離開前窗邊有絲帶在飄。我以為那是露米準備的表演。」','window','證詞'),
   clue('rabbit_s','露米的錯誤時刻','「錄音寫 00:10，所以怪聲一定在 00:10，當時我已回房。」','desk','證詞'),
   clue('fox_s','栗栗的保證','「維修做完我就離開了，所有零件應該都裝回了。」','bench','證詞'),
   clue('time','真正的午夜錄音','錄音 00:10 減掉鐘快的 10 分鐘，實際是 00:00；與碼頭報時相符。',null,'推論'),
   clue('mechanism','風驅動的發聲鏈','隔離銷缺失使風輪連到報時輪；絲帶能隨轉動碰鈴。',null,'推論'),
   clue('corrected','露米更正時刻','「我忘了錄音跟那座快鐘走。實際午夜我在外平台，是聽見後才跑回來。」',null,'更正證詞'),
   clue('forgot','栗栗承認漏裝','「佈置時有人叫我搬梯子，我把銷放在凳下就走了。那句『裝回』還沒勾掉。」',null,'更正證詞'),
   clue('sound','怪聲重現','開北風、抽掉隔離銷、保留絲帶，模型發出同樣的長笛聲與兩次鈴聲，週期也是 6 秒。',null,'實驗')
  ],
  people:[
   person('otter','波波','碼頭值班人','otter_s','「我能證明時間，不能證明是誰發聲。」'),
   person('bird','青羽','夜班郵差','bird_s','「我離開時窗邊已經有絲帶。」'),
   person('rabbit','露米','觀測員','rabbit_s','「錄音 00:10 就是真正的 00:10。」',{evidence:'time',reveal:'corrected',reply:'露米對照校時卡，修正了證詞：快鐘把她的記憶帶偏了。'}),
   person('fox','栗栗','機械維修師','fox_s','「所有零件應該都裝回了。」',{evidence:'pin',reveal:'forgot',reply:'栗栗找到凳下的固定銷，承認維修流程沒有完成。'})
  ],
  combinations:[{inputs:['clock','record'],output:'time'},{inputs:['pin','ribbon'],output:'mechanism'}],
  experiment:{title:'怪聲重現台',requires:['wind','mechanism'],description:'調整三個部件，讓模型重現錄音中的「嗚——叮、叮」。觀察哪個條件負責哪一段聲音。',controls:[{label:'北風',options:['關閉','吹入']},{label:'隔離銷',options:['裝回','抽走']},{label:'絲帶',options:['取下','保留']}],solution:[1,1,1],output:'sound',failure:['沒有風，蘆笛與風輪都安靜。','蘆笛發出長音，但隔離銷阻止齒輪轉動，沒有鈴聲。','風輪轉了、蘆笛響了，但缺少碰鈴的絲帶。']},
  deductions:[
   deduction('when_q','怪聲真正開始的時間？',['00:10','23:50','00:00'],2,[['time','otter_s']],'校正後的錄音和獨立的碼頭報時，指向同一時刻。'),
   deduction('sound_q','怪聲由什麼產生？',['北風經蘆笛，風輪帶絲帶碰鈴','露米躲在鐘後唱歌','青羽把鳥叫聲錄進機器'],0,[['mechanism','sound']],'可重複的機械實驗解釋了聲音組合與週期。'),
   deduction('cause_q','為何維修後才發生？',['有人偷偷搬走整座鐘','漏裝隔離銷，佈置絲帶又碰到齒輪','鐘快十分鐘會使鈴自動響'],1,[['memo','forgot']],'維修便條和栗栗的更正說明漏裝；快鐘只影響時間記錄。')
  ],
  timeline:[{id:'repair',text:'23:40 栗栗抽銷測試',evidence:'memo'},{id:'leave',text:'23:45 栗栗離開觀測台',evidence:'visits'},{id:'wind',text:'00:00 北風驅動發聲機關',evidence:'wind'},{id:'return',text:'露米聽聲後由平台跑回室內',evidence:'corrected'}],
  timelineWhy:'維修留下可被風吹動的機關，維修者先離開；午夜起風，露米才聽見並跑回來。',
  normal:'你拆穿了「時間倒轉」的傳言，也重現了怪聲。觀測台恢復安靜；再找齊每個人的記錄，就能把誤會與維修疏漏一起寫清楚。',
  full:'露米校正了鐘，栗栗把固定銷裝回，青羽重新綁好絲帶。大家把意外的聲音改成節慶風琴，並訂下完成維修後雙人檢查的約定。',
  fullRequires:['corrected','bird_s','log'],secret:'儀器的記錄也需要校正；親耳聽見不等於親眼看見。'
 },
 {
  id:'crystal',number:'03',title:'水晶洞的假寶藏',tag:'重量 × 光學 × 假象與動機',art:'cave',badge:'稜光鑑識者',
  intro:'水晶洞展示的「月心寶石」忽然變輕了。櫃門鎖得好好的，玻璃裡卻有兩道一模一樣的亮光。守衛說沒人碰過，工匠說那只是光線。哪一部分是真的？',
  places:[
   place('case','月心展示櫃','寶石泛著銀藍光；玻璃外框多了一塊新木板。',['weight','lock']),
   place('mirror','側面的觀景縫','換個角度，左邊的亮光會先消失。',['mirror'],'rabbit'),
   place('bench','雕刻工作桌','刻刀、空心模具和真正寶石的尺寸表放在一起。',['mold','spec'],'fox'),
   place('store','修復保管櫃','封條沒有被撕破，旁邊的入庫簿寫著精確時間。',['storage'],'otter'),
   place('letters','洞口郵袋','兩封信的收件人相同，一封給觀眾，一封只給工匠。',['letter'],'bird'),
   place('cart','節慶佈置車','一張未掛出的說明牌壓在布底，背面沾了新漆。',['label'])
  ],
  clues:[
   clue('weight','只有 30 克的展示石','展示石與標準砝碼比較，只有 30 克。天平已用另一顆 100 克砝碼校正。','case'),
   clue('lock','可拆的展示背板','正門鎖完好；背板用可旋開的木扣固定。只看門鎖不能排除更換。','case'),
   clue('mirror','斜放的鏡片','展示石後斜放鏡片。移動視角時，第二道亮光與實物不同步消失。','mirror'),
   clue('mold','空心樹脂模具','工作桌有與展示石同尺寸的空心模具、銀藍顏料和乾燥樹脂碎片。','bench'),
   clue('spec','真石的測量卡','上週測量：月心寶石重 120 克，內有不對稱月牙紋；真石樣本卡附透光圖。','bench'),
   clue('storage','18:00 的修復入庫單','波波與栗栗共同簽收：月心寶石 120 克，移入修復保管櫃，封條編號 07。','store'),
   clue('letter','修復委託信','星燈批准把真石送去修復裂痕，允許暫用複製品展示，但要求清楚標示。','letters'),
   clue('label','藏在布底的說明牌','牌上寫「修復期間，展示複製品」。牌子已上漆，掛繩卻從未繫上。','cart'),
   clue('otter_s','波波的守衛證詞','「六點簽收後櫃子沒開過。我守的是保管櫃，不是外面的展示櫃。」','store','證詞'),
   clue('bird_s','青羽的投遞證詞','「我把修復許可信交給栗栗，也說過要讓遊客知道展示的是複製品。」','letters','證詞'),
   clue('rabbit_s','露米的雙寶石猜測','「看到兩道一樣的亮光，我一開始以為裡面有兩顆真石。」','mirror','證詞'),
   clue('fox_s','栗栗的含糊說法','「展示石還是同一顆，變輕只是天平或光線的問題。」','bench','證詞'),
   clue('replica','重量與材料不符','同尺寸真石應重 120 克，展示石僅 30 克；空心模具解釋了差重。',null,'推論'),
   clue('safe','真石的去向','修復委託與雙人入庫單相符：真石已按程序收入封條 07 的保管櫃。',null,'推論'),
   clue('admit','栗栗承認換上複製品','「真石入庫後，我從背板放入複製品，用鏡片讓它更閃。怕遊客失望，沒掛說明牌，還說是真石。」',null,'更正證詞'),
   clue('correction','露米修正觀察','「改變角度後副影消失，兩道光不等於兩顆石頭。我會把觀察和猜測分開記。」',null,'更正證詞'),
   clue('optics','鑑識台的比對結果','以 120 克為基準、移開鏡片、側光比對：展示物較輕、只有一顆且沒有真石內部月牙紋。',null,'實驗')
  ],
  people:[
   person('otter','波波','保管櫃守衛','otter_s','「我沒說過展示櫃沒被碰過。」'),
   person('bird','青羽','委託信郵差','bird_s','「允許複製品，不代表可以說它是真品。」'),
   person('rabbit','露米','觀察員','rabbit_s','「兩道亮光，也許是兩顆寶石？」',{evidence:'optics',reveal:'correction',reply:'露米繞到側面，親眼確認第二道光是鏡像。'}),
   person('fox','栗栗','修復工匠','fox_s','「還是同一顆，只是天平或光線的問題。」',{evidence:'replica',reveal:'admit',reply:'你指出校正過的天平與空心模具。栗栗承認更換與未標示的事。'})
  ],
  combinations:[{inputs:['weight','mold'],output:'replica'},{inputs:['storage','letter'],output:'safe'}],
  experiment:{title:'重量與光影鑑識台',requires:['spec','mirror','weight'],description:'設定真石比較基準，再排除鏡像與表面閃光。觀察重量、數量、內部紋路三項是否一致。',controls:[{label:'真石基準',options:['30 克','120 克','240 克']},{label:'鏡片',options:['保留','移開']},{label:'照明',options:['正面強光','側面透光']}],solution:[1,1,1],output:'optics',failure:['重量基準與測量卡不同，這次比對不能判定真偽。','鏡片仍製造第二道亮光，數量判讀受干擾。','正面反光遮住內部紋路，還不能和真石樣本卡比對。']},
  deductions:[
   deduction('fake_q','展示的是什麼？',['兩顆真正的月心寶石','空心複製品，加上鏡像','真石被光線照得變輕'],1,[['replica','optics']],'重量與材料、鏡像與內紋的比對，互相支持複製品結論。'),
   deduction('where_q','真石最有根據的去向？',['青羽的郵袋','已經沉入湖底','有封條的修復保管櫃'],2,[['safe','otter_s']],'正式入庫記錄與看守的證詞共同支持去向。'),
   deduction('wrong_q','栗栗真正做錯的是？',['沒有標示複製品，還否認更換','遵照委託修復真石','使用鏡片一定是偷竊'],0,[['label','admit'],['letter','admit']],'修復和暫代展示得到允許；隱瞞複製品才違反約定。')
  ],
  timeline:[{id:'allow',text:'星燈批准修復及暫代展示',evidence:'letter'},{id:'store',text:'18:00 真石簽收進保管櫃',evidence:'storage'},{id:'replace',text:'栗栗從背板換上複製品',evidence:'admit'},{id:'notice',text:'大家發現重量與亮光異常',evidence:'weight'}],
  timelineWhy:'先有修復許可與真石入庫，才有複製品暫代；異常是在展示後被注意到。',
  normal:'你找到了真石的保管記錄，辨認出展示的複製品。栗栗答應補掛說明牌；繼續查訪，還能幫露米分清看到的亮光和自己的猜測。',
  full:'說明牌正式掛好，真石修復流程公開給大家看。露米把錯誤猜測劃掉，栗栗用複製品教大家認識鏡像：有趣的展示，也可以誠實。',
  fullRequires:['correction','bird_s','lock'],secret:'找出假象之後，還要分辨哪個行為得到允許、哪個行為傷害了信任。'
 },
 {
  id:'lantern',number:'終章',title:'寫給整片湖的邀請',tag:'三案之後的共同祕密',art:'dock',badge:'星湖偵探社徽章',hidden:true,
  intro:'三個案件結束後，星燈收到一封沒有署名的信：「魚、風、光，各自找到位置時，湖會唱歌。」這次沒有犯人。你要查出誰準備了什麼，替大家完成月光節。',
  places:[place('pier','碼頭魚燈','波波把小魚形燈籠排成一條路。',['fish'],'otter'),place('tower','觀測台風琴','修好的風輪只連著節慶風琴。',['music']),place('cave','洞口光幕','有標示的複製水晶把燈光投向湖心。',['light']),place('hut','夜行動物屋','星燈的信封內側，四種墨水交錯。',['invite'])],
  clues:[clue('fish','引路的魚燈','波波寫：魚燈先點亮，帶大家安全走到碼頭。','pier'),clue('music','等候人群的風琴','栗栗寫：看到大家抵達碼頭，再讓風琴響起。','tower'),clue('light','最後亮起的光幕','露米寫：第一段風琴演奏結束，才打開湖心的水晶光幕。','cave'),clue('invite','四種筆跡的邀請','信上有波波、青羽、露米、栗栗四種筆跡。內容是分工，不是彼此指控。','hut'),clue('otter_s','波波的願望','「上次大家幫我找回勇氣，這次想一起送星燈一份驚喜。」','pier','證詞'),clue('together','一同準備的月光節','四人聯名邀請與波波的說明相符：大家各自準備一部分，共同完成節慶。',null,'推論')],
  people:[person('otter','波波','魚燈引路人','otter_s','「一個人完成不了整片湖的驚喜。」')],
  combinations:[{inputs:['invite','otter_s'],output:'together'}],
  deductions:[deduction('plan_q','這封信真正想請你做什麼？',['找出三案背後的同一個犯人','協調大家共同準備的節慶','把所有展品鎖起來'],1,[['together','invite']],'共同分工有明確記錄，不需要額外假設一場陰謀。')],
  timeline:[{id:'fish',text:'點亮魚燈，引導人群',evidence:'fish'},{id:'music',text:'人群抵達，風琴開始',evidence:'music'},{id:'light',text:'第一段結束，亮起光幕',evidence:'light'}],
  timelineWhy:'依照三張分工便條：先引路，再演奏，最後亮起光幕。',
  normal:'魚燈、風琴與水晶光幕依序亮起。星燈把偵探社徽章交給你：謝謝你願意觀察，也願意理解。',
  full:'整片湖亮起了。波波負責引路，栗栗照看風琴，露米調整光幕，青羽送出邀請。星燈說：「好偵探讓真相被看見，也讓大家重新走到一起。」',fullRequires:['fish','music','light','invite'],secret:'案件結束了，角色的生活還在繼續。'
 }
];
export function detectiveCase(id){const c=DETECTIVE_CASES.find(c=>c.id===id);if(!c)throw Error('找不到這份案件');return c;}
