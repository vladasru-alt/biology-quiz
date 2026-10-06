// node tools/lang-kanc.js [quiz-data.js] — канцелярит (30 шаблонов) с частотами и примерами,
// а также реплики в служебных текстах, которые додумывают чувства ученика или оценивают его сверху вниз
const { fs, BANK } = require('./lib');const src=fs.readFileSync(process.argv[2]||BANK,'utf8');
const QUIZ=new Function(src+';return QUIZ')();
const W='(?<![А-Яа-яЁё])', E='(?![А-Яа-яЁё])';
const KANC=['явля(?:ется|ются|ющ[а-яё]*)','осуществля[а-яё]*','данн(?:ый|ая|ое|ые|ого|ой|ом|ых|ую)','производ(?:ится|ятся)','в целях','в связи с','посредством','в процессе','имеет место','в результате чего','при наличии','в случае','вследствие','в ходе','происход(?:ит|ят)','обусловлен[а-яё]*','наблюда(?:ется|ются)','с целью','выполня(?:ет|ют) функци[а-яё]*','в качестве','по причине','служит','необходим[а-яё]*','осуществлени[а-яё]*','способствует','представля(?:ет|ют) собой','обеспечива(?:ет|ют)','характеризу[а-яё]*','за счёт','путём'].map(k=>[k,new RegExp(W+k+E,'gi')]);
const cnt={},ex={};
const fields=q=>[q.q,...(q.options||[]),...(q.reasons||[]),q.reasonQ||'',...(q.left||[]),...(q.right||[]),...(q.items||[]),q.why];
for(const ch in QUIZ)for(const q of QUIZ[ch].questions)for(const t of fields(q))for(const [k,r] of KANC){const m=t.match(r);if(m){cnt[k]=(cnt[k]||0)+m.length;(ex[k]=ex[k]||[]).length<3&&ex[k].push(q.id+': '+t.slice(0,120));}}
console.log(Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(' | '));
for(const k of Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,10)){console.log('\n# '+k);ex[k].forEach(x=>console.log('  '+x));}
// служебные тексты
const tail=src.split('const supportText')[1];
console.log('\n# служебные тексты: реплики про чувства и оценки');
(('const supportText'+tail).match(/"[^"]{5,}"/g)||[]).filter(s=>/(Спокойно|Не беда|Нормально|не волну|Бывает|Хорош|Отличн|Молодец|ничего страшного|Ничего страшного|Прервалось)/i.test(s)).forEach(s=>console.log('  '+s));
