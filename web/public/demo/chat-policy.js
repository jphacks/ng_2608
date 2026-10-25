/* Shared deterministic chat policy. No message is sent to an external classifier. */
(function(root){
'use strict';
function normalize(text){return String(text).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/[\p{Cf}]/gu,'');}
function check(text){
 const plain=normalize(text),compact=plain.replace(/[\p{White_Space}\p{P}\p{S}]/gu,'');
 const sexual=/(?<!ぱ)ちん[こぽ]|まんこ|おっぱい|ふぇら|ぱいずり|手こき|てこき|おなにー|自慰|勃起|射精|精液|中出し|せっくす|せふれ|えっち(?!んぐ)|陰茎|陰部|乳首|ちくび|性欲|性行為|性交|あなる(?!ほど)|えろ(?:い|画像|動画|写真)|すけべ|ぽるの|裸(?:の)?(?:写真|画像)(?:を)?(?:送|見せ)|h(?:しよ|したい)/u.test(compact)||/(?:^|[^a-z])(?:sex|porn|nudes?)(?:$|[^a-z])/.test(plain);
 if(sexual)return{allowed:false,category:'sexual',message:'性的な言葉や下ネタは送れません。別の表現に書き直してください。'};
 const abuse=/死ね|死んでしまえ|殺す|殺してやる|ぶっ殺|ぶち殺|ころすぞ|自殺しろ|消えろ|黙れ|だまれ|くたばれ|ふざけんな|馬鹿(?!正直)|(?:お前|おまえ|てめえ|あんた|君|きみ).{0,8}(?:ばか(?!んす)|あほ|くず|きもい|ぶす)/u.test(compact)||/^(?:しね|ばか|ばーか|あほ|くず|ぶす|きもい)(?:だ|です|よ|や|な|ね|あ|ぁ)*$/.test(compact)||/(?:^|[\s。、！？!?])(?:ばか(?!んす|り)|あほ|くず|ぶす|きもい)(?:だ|です|だろ|だよ|だな|よ|ね)?(?:$|[\s。、！？!?])/.test(plain)||/(?:^|[^a-z])(?:f[\s\p{P}]*u[\s\p{P}]*c[\s\p{P}]*k(?:ing)?|shit|bitch|asshole|stfu)(?:$|[^a-z])/u.test(plain);
 if(abuse)return{allowed:false,category:'abuse',message:'暴言や相手を傷つける言葉は送れません。落ち着いた表現に書き直してください。'};
 return{allowed:true,category:null,message:''};
}
root.SukiChatPolicy={check};
})(globalThis);
