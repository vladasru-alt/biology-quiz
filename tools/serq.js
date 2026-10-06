// Сериализатор вопроса в формат quiz-data.js: фиксированный порядок полей, отступ 8 пробелов.
// Одинаковый вид всех блоков — в git-диффе видны только смысловые правки, блок находится по строке id.

const s=JSON.stringify;
const arr=(name,a,ind)=>`${ind}${name}: [\n`+a.map(x=>`${ind}  ${s(x)}`).join(',\n')+`\n${ind}]`;
module.exports=function ser(q){
  const I='        ', L=[];
  L.push(`${I}id: ${s(q.id)}`,`${I}type: ${s(q.type)}`,`${I}level: ${s(q.level)}`,`${I}steps: ${q.steps}`,`${I}topic: ${s(q.topic)}`,`${I}skill: ${s(q.skill)}`,`${I}difficulty: ${q.difficulty}`);
  if(q.misconception===true) L.push(`${I}misconception: true`);
  L.push(`${I}q: ${s(q.q)}`);
  if(q.type==='single'||q.type==='twotier'){ L.push(arr('options',q.options,I),`${I}correct: ${q.correct}`); }
  else if(q.type==='multi'){ L.push(arr('options',q.options,I),`${I}correct: [${q.correct.join(',')}]`); }
  else if(q.type==='truefalse'){ L.push(`${I}answer: ${q.answer}`); }
  else if(q.type==='match'){ L.push(arr('left',q.left,I),arr('right',q.right,I)); }
  else if(q.type==='order'){ L.push(arr('items',q.items,I)); }
  if(q.type==='twotier'){ L.push(`${I}reasonQ: ${s(q.reasonQ)}`,arr('reasons',q.reasons,I),`${I}reasonCorrect: ${q.reasonCorrect}`); }
  L.push(`${I}why: ${s(q.why)}`);
  return '      {\n'+L.join(',\n')+'\n      }';
};
