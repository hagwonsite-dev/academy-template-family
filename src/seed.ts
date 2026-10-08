import {koreanToday} from './calendar.ts';
import type { SQLInputValue } from 'node:sqlite';
export function demoSeed(today = new Date()) {
 const date = (offset:number) => koreanToday(new Date(today.getTime()+offset*86400000));
 const rows:Record<string,Record<string,SQLInputValue>[]>={Profile:[],Session:[],Pass:[],Invoice:[],Notice:[],Message:[],FamilyPolicy:[],Teacher:[],PassUsage:[],Refund:[],Comment:[],NoticeMedia:[]};
 for(const [id,name,academy,className,teacher] of [['haneul','김하늘','배움 영어학원','리딩 A반','이지은'],['jiwoo','김지우','소리숲 음악학원','피아노 기초반','박수연']]) {
  rows.Profile.push({id,name,academy,className,teacher});
  for(const [i,offset] of [-3,0,2,5].entries()) rows.Session.push({id:id+'-session-'+i,studentId:id,title:className,date:date(offset),time:id==='haneul'?'16:00–17:00':'15:00–15:50',room:id==='haneul'?'2층 · 201호':'1층 · 연습실 3',status:offset<0?'present':offset===0?'arrived':'scheduled',checkIn:offset<=0?'15:55':'',checkOut:offset<0?'17:02':'',intention:'',reason:''});
  rows.Pass.push({id:id+'-pass',studentId:id,title:className+' 12회권',total:12,remaining:id==='haneul'?8:3,expires:date(30)});
  rows.Invoice.push({id:id+'-invoice',studentId:id,title:'이번 달 '+className+' 수강료',amount:id==='haneul'?180000:150000,dueDate:date(7),status:'unpaid',paidAt:''});
  rows.Notice.push({id:id+'-notice',studentId:id,title:'이번 주 수업을 안내해 드려요',body:'배움의 과정을 함께 응원해 주세요. 수업 시작 5분 전까지 도착해 주세요. 준비물은 교재와 필기구예요. 변경된 일정은 일정·출결에서 확인할 수 있어요.',date:date(0),poll:0});
  rows.Notice.push({id:id+'-poll',studentId:id,title:'가족 공개수업에 함께해요',body:'아이들의 성장을 함께 나누는 공개수업을 준비하고 있어요. 참석 여부를 알려주세요. 이 투표는 예시 체험용이며 언제든 변경할 수 있어요.',date:date(-1),poll:1});
  rows.Message.push({id:id+'-welcome',studentId:id,sender:'teacher',body:'안녕하세요! 오늘도 즐겁게 배웠어요. 궁금한 점은 여기에 남겨주세요. 이 대화는 가상의 예시이며 실제 선생님에게 알림이 가지 않아요.',createdAt:today.toISOString()});
  rows.FamilyPolicy.push({id:id+'-policy',studentId:id,advanceAttendance:1});
  rows.Teacher.push({id:id+'-teacher',studentId:id,name:teacher,subject:className},{id:id+'-director',studentId:id,name:'정다온',subject:'원장 · 학원 생활'});
  for(const [suffix,offset,status] of [['absent',-7,'absent'],['makeup',-5,'makeup']] as const)rows.Session.push({id:id+'-session-'+suffix,studentId:id,title:className,date:date(offset),time:'16:00–17:00',room:'201호',status,checkIn:status==='makeup'?'15:58':'',checkOut:status==='makeup'?'17:00':'',intention:'',reason:''});
  const used=id==='haneul'?4:9;
  for(let i=0;i<used;i++)rows.PassUsage.push({id:id+'-usage-'+i,studentId:id,passId:id+'-pass',date:date(-3-(used-1-i)*3),title:className,kind:i===used-2?'보강':'수업',units:1,remaining:11-i});
  rows.Invoice.push({id:id+'-materials',studentId:id,title:'교재와 학습 준비물',amount:20000,discount:5000,dueDate:date(7),status:'unpaid',paidAt:''},{id:id+'-previous',studentId:id,title:'지난 수강료 · 부분 환불 예시',amount:100000,discount:0,dueDate:date(-20),status:'demo-paid',paidAt:date(-21)+'T03:00:00.000Z',paymentId:id+'-previous-payment'});
  rows.Refund.push({id:id+'-refund',studentId:id,invoiceId:id+'-previous',amount:25000,reason:'수업 변경에 따른 부분 환불 · 가상 기록',createdAt:date(-10)+'T03:00:00.000Z'});
  rows.Notice.push({id:id+'-important',studentId:id,title:'안전한 등하원 안내',body:'수업 시작 전 교실을 확인해 주세요. 귀가 일정 변경은 보호자가 선생님에게 알려주세요. 가상 공지입니다.',date:date(0),poll:0,category:'notice',important:1});
  rows.Notice.push({id:id+'-album',studentId:id,title:'우리 반의 작은 배움 앨범',body:'책을 읽고 서로의 생각을 나눈 하루예요. 그림은 실제 학생 사진이 아닌 체험용 일러스트입니다.',date:date(-2),poll:0,category:'album',important:0});
  for(const asset of ['reading','art'])rows.NoticeMedia.push({id:id+'-media-'+asset,studentId:id,noticeId:id+'-album',asset,caption:asset==='reading'?'함께 읽는 시간 · 가상 그림':'색으로 표현하는 시간 · 가상 그림'});

 }
 return Object.entries(rows).flatMap(([table,list])=>list.map(row=>({sql:`INSERT INTO "${table}" (${Object.keys(row).map(k=>'"'+k+'"').join(',')}) VALUES (${Object.keys(row).map(()=>'?').join(',')}) ON CONFLICT ("id") DO NOTHING`,args:Object.values(row)})));
}
