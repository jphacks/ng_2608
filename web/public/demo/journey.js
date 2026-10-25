/* Persistent onboarding and score-only conversation feedback. */
(function(){
'use strict';
let loading=true,error='',first=true,previousStage=null;
s.onboarding=null;s.questionReview=false;
const realAPI=api;
async function sync(){const d=await realAPI('onboarding');s.onboarding=d.onboarding;return s.onboarding;}
api=async function(path,options={}){const d=await realAPI(path,options);if(['basics','profile','values-profile','photo'].includes(path)&&['POST','PUT','DELETE'].includes(options.method)){await sync();if(path==='profile')s.questionReview=false;}return d;};
const isComplete=()=>s.onboarding?.complete===true;
function nextPage(){return ['basics','photo'].includes(s.onboarding?.next)?'profile':s.onboarding?.next==='complete'?'discover':'talk';}
function progressBar(){const n=s.onboarding?.next,index=['basics','photo'].includes(n)?0:n==='questions'?1:['ai','review'].includes(n)?2:3;return `<ol class="love-progress" aria-label="出会いまでのステップ">${['プロフィール・写真','性格診断','AI診断','マッチング'].map((v,i)=>`<li class="${i<index?'done':i===index?'current':''}"><span>${i<index?'✓':i+1}</span>${v}</li>`).join('')}</ol>`;}
const originalGo=go;go=function(page){if(s.busy)return;if(!isComplete()&&!['trust'].includes(page))page=nextPage();originalGo(page);};
const originalTalk=talk,originalProfile=profile;
function questionReview(){return `<h1 class="page-heading">あなたのスタイルが見えてきました。</h1><p class="sub">${esc(Q.typeName(s.preferences))}。公開する回答を選んで、次はAI診断へ。</p><form id="questionProfileForm"><input id="qProfileName" type="hidden" value="${esc(s.name)}">${Q.summaries(s.preferences).map(g=>`<section class="panel"><h3>${g.title}</h3>${g.items.map(i=>`<label class="review-answer"><input type="checkbox" data-q-public="${i.id}" ${s.qPrivate[i.id]?'':'checked'}><span>${esc(i.title)}<strong>${esc(i.label)}</strong></span></label>`).join('')||'<p class="sub">この分野は未回答です。</p>'}</section>`).join('')}<p class="sub">選んだ回答を公開し、相性計算に使います。次のAI診断では、加工した回答と選択式の回答の送信内容を確認できます。</p><button class="btn wide">保存して、AI診断へ →</button></form>`;}
profile=function(){if(!isComplete()&&s.onboarding?.next==='photo')return `<div class="profile-mini"><span>♡ ${esc(s.name)} / ${s.age}歳</span><button class="text-btn" id="editBasics">基本情報を編集</button></div>${s.editBasics?basicsView(true):photo()}<div class="photo-next"><button class="btn wide" id="continueAfterPhoto" ${s.published?.hasPhoto?'':'disabled'}>写真を登録して、性格診断へ →</button><p class="sub">プロフィール写真の登録後に次へ進めます。</p></div>`;return originalProfile();};
talk=function(){if(s.questionReview||(s.onboarding?.next==='questions'&&s.qComplete))return questionReview();return originalTalk();};
const originalFinish=finishQuestions;finishQuestions=function(){s.questionReview=true;originalFinish();};
// Keep publication preferences and questionnaire answers separate in the existing form.
const originalRender=render;
render=function(){
 if(loading||!s.basicsReady){$('#app').innerHTML=`<main class="onboarding-loading"><strong>スキあらば恋<small>隙間ないAI</small></strong><p>${error?esc(error):'あなたの出会いを準備しています…'}</p>${error?'<button id="retryJourney" class="btn">もう一度読み込む</button><a href="/signin-with-chatgpt?return_to=%2Fdemo%2F">ログインする</a>':''}</main>`;if($('#retryJourney'))$('#retryJourney').onclick=load;return;}
 const stage=s.onboarding?.next;
 if(!isComplete()&&s.page!=='trust')s.page=nextPage();
 if(first&&isComplete())s.page='discover';
 if(stage!==previousStage&&stage==='review'&&s.onboarding.diagnosis&&!s.valueTalk.summary){const d=s.onboarding.diagnosis;s.valueTalk.summary={shared_time:d.time,contact_pace:d.pace,decision_style:d.disagreement,profile_text:d.bio};}
 const becameComplete=previousStage&&previousStage!=='complete'&&stage==='complete';
 if(becameComplete)s.page='discover';
 previousStage=stage;const initial=first;first=false;
 originalRender();
 document.title='スキあらば恋、隙間ないAI';
 document.querySelectorAll('.brand').forEach(el=>{el.setAttribute('aria-label','スキあらば恋、隙間ないAI');el.innerHTML='<i class="mark"></i><span>スキあらば恋<small>隙間ないAI</small></span>';});
 const sub=$('.brand-sub');if(sub)sub.textContent='SUKI ARABA KOI';
 if(!isComplete()&&s.page!=='trust'){
  $('.content').insertAdjacentHTML('afterbegin',progressBar());
  document.querySelectorAll('.signup-steps').forEach(el=>el.remove());
  if(stage==='photo')KotonohaPhoto.bind();
  const defer=$('#deferValue');if(defer)defer.remove();
  const skip=$('#skipPhoto');if(skip)skip.remove();
  if($('#valueForm'))$('#valueForm').insertAdjacentHTML('beforebegin','<p class="ai-purpose">✧ あなたの言葉と14問の回答から、価値観をもう一段くわしく整理します。</p>');
 }
 if(initial||becameComplete){if(s.page==='discover')void loadPeople();}
 window.updateJourneyScore();
};
const originalBind=bind;bind=function(){originalBind();if($('#continueAfterPhoto'))$('#continueAfterPhoto').onclick=()=>go('talk');};
window.journeyScoreMarkup=function(){const r=SukiConversation.score(s.messages);return `<div class="live-love-score" role="status" aria-live="polite" aria-label="会話相性 ${r.score===null?'会話を待っています':r.score+'点'}"><span class="live-heart">♡</span><div><small>いまの会話相性${s.peer?.demo?' · デモ':''}</small><strong>${r.score===null?'—':r.score}<em>${r.score===null?'会話が始まると更新':'/ 100'}</em></strong></div><button type="button" class="score-info" aria-label="会話相性の計算方法" id="scoreMethod">ⓘ</button></div>`;};
window.updateJourneyScore=function(){const el=$('#insightPanel');if(!el)return;el.innerHTML=window.journeyScoreMarkup();$('#scoreMethod').onclick=()=>showModal('<h2>会話相性について</h2><p>送信のたびに、表示中の直近100件から端末内で計算します。双方の会話が始まってから、80点を起点に、共通の話題・やりとり・前向きな言葉を加点する80〜98点の参考スコアです。</p><p>外部AIへ会話履歴を送りません。相手の好意や恋愛の成功確率を測る点数ではありません。</p>');};
const priorMatch=D.match;D.match=function(a,b){const r=priorMatch(a,b),ai=SukiConversation.publicAI(a.valueSummary,b.valueSummary);if(r.score!==null&&ai!==null){r.score=Math.round(r.score*.8+ai*20);r.reasons=[...r.reasons,'公開したAI診断の希望も比較'];}return r;};
async function load(){loading=true;error='';try{await sync();if(s.onboarding.next==='review'&&s.onboarding.diagnosis){const d=s.onboarding.diagnosis;s.valueTalk.summary={shared_time:d.time,contact_pace:d.pace,decision_style:d.disagreement,profile_text:d.bio};}loading=false;}catch(e){error=e.message;loading=true;}render();}
render();void load();
})();
