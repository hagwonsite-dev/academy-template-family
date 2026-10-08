import type { SQLInputValue } from 'node:sqlite';
export function demoSeed(today = new Date()) {
 const date = (offset:number) => new Date(today.getTime()+offset*86400000).toISOString().slice(0,10);
 const rows:Record<string,Record<string,SQLInputValue>[]>={Profile:[],Session:[],Pass:[],Invoice:[],Notice:[],Message:[]};
 for(const [id,name,academy,className,teacher] of [['haneul','김하늘','배움 영어학원','리딩 A반','이지은'],['jiwoo','김지우','소리숲 음악학원','피아노 기초반','박수연']]) {
  rows.Profile.push({id,name,academy,className,teacher});
  for(const [i,offset] of [-3,0,2,5].entries()) rows.Session.push({id:id+'-session-'+i,studentId:id,title:className,date:date(offset),time:id==='haneul'?'16:00–17:00':'15:00–15:50',room:id==='haneul'?'2층 · 201호':'1층 · 연습실 3',status:offset<0?'present':offset===0?'arrived':'scheduled',checkIn:offset<=0?'15:55':'',checkOut:offset<0?'17:02':'',intention:'',reason:''});
  rows.Pass.push({id:id+'-pass',studentId:id,title:className+' 12회권',total:12,remaining:id==='haneul'?8:3,expires:date(30)});
  rows.Invoice.push({id:id+'-invoice',studentId:id,title:'이번 달 '+className+' 수강료',amount:id==='haneul'?180000:150000,dueDate:date(7),status:'unpaid',paidAt:''});
  rows.Notice.push({id:id+'-notice',studentId:id,title:'이번 주 수업을 안내해 드려요',body:'배움의 과정을 함께 응원해 주세요. 수업 시작 5분 전까지 도착해 주세요. 준비물은 교재와 필기구예요. 변경된 일정은 일정·출결에서 확인할 수 있어요.',date:date(0),poll:0});
  rows.Notice.push({id:id+'-poll',studentId:id,title:'가족 공개수업에 함께해요',body:'아이들의 성장을 함께 나누는 공개수업을 준비하고 있어요. 참석 여부를 알려주세요. 이 투표는 예시 체험용이며 언제든 변경할 수 있어요.',date:date(-1),poll:1});
  rows.Message.push({id:id+'-welcome',studentId:id,sender:'teacher',body:'안녕하세요! 오늘도 즐겁게 배웠어요. 궁금한 점은 여기에 남겨주세요. 이 대화는 가상의 예시이며 실제 선생님에게 알림이 가지 않아요.',createdAt:today.toISOString()});
 }
 return Object.entries(rows).flatMap(([table,list])=>list.map(row=>({sql:`INSERT INTO "${table}" (${Object.keys(row).map(k=>'"'+k+'"').join(',')}) VALUES (${Object.keys(row).map(()=>'?').join(',')}) ON CONFLICT ("id") DO NOTHING`,args:Object.values(row)})));
}
