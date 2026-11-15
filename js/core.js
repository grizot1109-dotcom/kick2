'use strict';
/* ===== KICK: базовые утилиты, характеристики, имена, игроки ===== */
const rnd=Math.random;
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const pick=a=>a[Math.floor(rnd()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function gauss(){let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function poisson(l){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=rnd();}while(p>L);return k-1;}
function pickW(arr,wf){let tot=0;const w=arr.map(x=>{const v=Math.max(0,wf(x));tot+=v;return v;});if(tot<=0)return arr[Math.floor(rnd()*arr.length)];let r=rnd()*tot;for(let i=0;i<arr.length;i++){r-=w[i];if(r<=0)return arr[i];}return arr[arr.length-1];}
function money(v){const a=Math.abs(v);let s;if(a>=1e6)s=(v/1e6).toFixed(a>=1e8?0:1).replace('.',',')+' млн';else if(a>=1e3)s=Math.round(v/1e3)+' тыс.';else s=Math.round(v)+'';return '€'+s;}
function plural(n,a,b,c){n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c;}
const lastName=n=>{const i=n.indexOf(' ');return i<0?n:n.slice(i+1);};

/* ----- характеристики ----- */
const AK='cor cro dri fin fir fre hea lon lth mar pas pen tck tec agg ant bra cmp cnt dec det fla ldr otb pos tea vis wor acc agi bal jum nat pac sta str aer cmd com ecc han kic one ref rus pun thr'.split(' ');
const AL=['Угловые','Навесы','Дриблинг','Завершение','Первое касание','Штрафные','Игра головой','Дальние удары','Вбрасывания','Опека','Пас','Пенальти','Отбор','Техника',
'Агрессивность','Предвидение','Смелость','Хладнокровие','Концентрация','Решения','Целеустремлённость','Импровизация','Лидерство','Игра без мяча','Выбор позиции','Командная игра','Видение поля','Работоспособность',
'Ускорение','Ловкость','Баланс','Прыгучесть','Природная форма','Скорость','Выносливость','Сила',
'Игра на выходах','Контроль штрафной','Коммуникация','Эксцентричность','Игра руками','Игра ногами','Один на один','Реакция','Выходы из ворот','Отбивание кулаками','Ввод мяча рукой'];
const A={};AK.forEach((k,i)=>A[k]=i);
const POSL=['GK','DL','DC','DR','DM','ML','MC','MR','AML','AMC','AMR','ST'];
const PR={GK:'ВРТ',DL:'ЛЗ',DC:'ЦЗ',DR:'ПЗ',DM:'ОП',ML:'ЛП',MC:'ЦП',MR:'ПП',AML:'ЛВ',AMC:'АП',AMR:'ПВ',ST:'НАП'};
const ROLE_RAW={GK:'ref3 han2 one2 aer2 cmd2 com1 kic1 pos2 cnt1 agi2 dec1 thr1',DC:'mar3 tck3 hea2 pos3 str2 jum2 bra1 cnt2 ant2 cmp1 pac1 dec1',FB:'tck3 mar2 cro2 pac2 sta2 acc2 pos2 wor2 tea1 dri1 ant1 cnt1',DM:'tck3 pos3 pas2 ant2 tea2 wor2 sta1 dec2 cnt2 mar1 str1 fir1',MC:'pas3 vis2 fir2 tec2 dec3 tea2 wor2 sta2 cmp2 otb1 ant1 tck1',WM:'cro3 dri2 pac2 acc2 sta2 wor2 pas2 tec2 otb1 fir1 tea1',AMC:'pas3 vis3 tec2 fir2 fla2 dri2 otb2 cmp2 lon1 dec2 agi1 fin1',W:'dri3 pac2 acc3 tec2 fla2 cro2 fir2 otb2 fin1 agi2 cmp1',ST:'fin3 cmp2 otb3 fir2 ant2 hea1 pac2 acc2 str1 tec1 dri1'};
const POS_ROLE={GK:'GK',DL:'FB',DR:'FB',DC:'DC',DM:'DM',MC:'MC',ML:'WM',MR:'WM',AMC:'AMC',AML:'W',AMR:'W',ST:'ST'};
const ROLE={};for(const r in ROLE_RAW)ROLE[r]=ROLE_RAW[r].split(' ').map(t=>[A[t.slice(0,3)],+t.slice(3)]);
const NEAR={GK:[],DL:['DC','ML','DR'],DR:['DC','MR','DL'],DC:['DL','DR','DM'],DM:['DC','MC'],MC:['DM','AMC','ML','MR'],ML:['DL','AML','MC','MR'],MR:['DR','AMR','MC','ML'],AMC:['MC','ST','AML','AMR'],AML:['ML','AMR','ST','AMC'],AMR:['MR','AML','ST','AMC'],ST:['AMC','AML','AMR']};
function eff(p,pos){const w=ROLE[POS_ROLE[pos]];let s=0,t=0;for(const [i,k] of w){s+=p.a[i]*k;t+=k;}return s/t;}
function fam(p,pos){if(p.pos===pos)return 1;if(p.alt&&p.alt.includes(pos))return .94;if(pos==='GK'||p.pos==='GK')return .3;if(NEAR[p.pos].includes(pos))return .82;return .62;}
const ca=p=>eff(p,p.pos);
function slotVal(p,pos){return eff(p,pos)*fam(p,pos)*(.8+.2*p.cond/100)*(.96+.08*p.mor/100);}
function famLabel(f){return f>=1?['Естественная','good']:f>=.94?['Освоенная','good']:f>=.82?['Неуверенная','warn']:['Неподходящая','bad'];}
const FORM={'4-2-3-1':['GK','DL','DC','DC','DR','DM','DM','AML','AMC','AMR','ST'],'4-3-3':['GK','DL','DC','DC','DR','DM','MC','MC','AML','AMR','ST'],'4-4-2':['GK','DL','DC','DC','DR','ML','MC','MC','MR','ST','ST'],'4-1-4-1':['GK','DL','DC','DC','DR','DM','ML','MC','MC','MR','ST'],'3-5-2':['GK','DC','DC','DC','ML','DM','MC','MC','MR','ST','ST'],'3-4-3':['GK','DC','DC','DC','ML','MC','MC','MR','AML','AMR','ST'],'5-3-2':['GK','DL','DC','DC','DC','DR','MC','MC','MC','ST','ST']};
const FKEYS=Object.keys(FORM);
const SQUAD=['GK','GK','GK','DC','DC','DC','DC','DL','DL','DR','DR','DM','DM','MC','MC','MC','ML','MR','AML','AMR','AMC','AMC','ST','ST','ST'];
const MENT=['Очень оборонительный','Оборонительный','Сбалансированный','Атакующий','Очень атакующий'];
const LVL3={pr:['Низкий','Средний','Высокий'],te:['Низкий','Обычный','Высокий'],wi:['Узкая','Обычная','Широкая']};
const TRAIN={bal:'Сбалансированная',att:'Атака',def:'Оборона',phy:'Физика',tec:'Техника',men:'Тактика и психология'};
const TRAIN_ATTR={att:['fin','otb','fir','cmp','dri','lon'],def:['mar','tck','pos','hea','cnt','ant'],phy:['acc','pac','sta','str','agi','nat','jum'],tec:['tec','fir','pas','dri','cro','fre'],men:['dec','ant','tea','vis','cmp','wor','pos']};
const EXPS=[['Без опыта',12],['Любительский уровень',22],['Бывший профессиональный игрок',35],['Бывший игрок сборной',48]];

/* ----- страны ----- */
const NATS={};
('ENG Англия;ESP Испания;ITA Италия;GER Германия;FRA Франция;NED Нидерланды;POR Португалия;RUS Россия;TUR Турция;BRA Бразилия;ARG Аргентина;SEN Сенегал;CRO Хорватия;DEN Дания;'+
'ALB Албания;ALG Алжир;AND Андорра;ANG Ангола;ARM Армения;AUS Австралия;AUT Австрия;AZE Азербайджан;BEL Бельгия;BEN Бенин;BFA Буркина-Фасо;BIH Босния и Герцеговина;BLR Беларусь;BOL Боливия;BUL Болгария;CAN Канада;CHI Чили;CHN Китай;CIV Кот-д’Ивуар;CMR Камерун;COD ДР Конго;CGO Конго;COL Колумбия;CPV Кабо-Верде;CRC Коста-Рика;CUW Кюрасао;CYP Кипр;CZE Чехия;ECU Эквадор;EGY Египет;EQG Экваториальная Гвинея;EST Эстония;FIN Финляндия;GAB Габон;GAM Гамбия;GEO Грузия;GHA Гана;GNB Гвинея-Бисау;GRE Греция;GUI Гвинея;HAI Гаити;HON Гондурас;HUN Венгрия;IRL Ирландия;IRN Иран;IRQ Ирак;ISL Исландия;ISR Израиль;JAM Ямайка;JPN Япония;KAZ Казахстан;KEN Кения;KOR Южная Корея;KOS Косово;KSA Саудовская Аравия;LTU Литва;LUX Люксембург;LVA Латвия;MAD Мадагаскар;MAR Марокко;MDA Молдова;MEX Мексика;MKD Северная Македония;MLI Мали;MNE Черногория;MOZ Мозамбик;MTN Мавритания;NGA Нигерия;NIR Северная Ирландия;NOR Норвегия;NZL Новая Зеландия;PAN Панама;PAR Парагвай;PER Перу;POL Польша;QAT Катар;ROU Румыния;RSA ЮАР;SCO Шотландия;SLE Сьерра-Леоне;SVN Словения;SRB Сербия;SUI Швейцария;SUR Суринам;SVK Словакия;SWE Швеция;SYR Сирия;TAN Танзания;TJK Таджикистан;TOG Того;TUN Тунис;UKR Украина;URU Уругвай;USA США;UZB Узбекистан;VEN Венесуэла;WAL Уэльс;ZAM Замбия;ZIM Зимбабве;KGZ Киргизия;GUA Гватемала;PHI Филиппины;IDN Индонезия;MLT Мальта;FRO Фарерские острова;SLV Сальвадор;NAM Намибия;BDI Бурунди;UGA Уганда;LBY Ливия;RWA Руанда;CTA ЦАР;COM Коморы;GLP Гваделупа;MTQ Мартиника;GUF Французская Гвиана;JOR Иордания;LBN Ливан;UAE ОАЭ;SDN Судан;SSD Южный Судан;ETH Эфиопия;TRI Тринидад и Тобаго;PUR Пуэрто-Рико;DOM Доминиканская Республика;CUB Куба;NCA Никарагуа;OMA Оман;BHR Бахрейн;KUW Кувейт;THA Таиланд;VIE Вьетнам;PLE Палестина;IND Индия')
.split(';').forEach(s=>{const i=s.indexOf(' ');NATS[s.slice(0,i)]=s.slice(i+1);});
const RU3={ENG:'АНГ',ESP:'ИСП',ITA:'ИТА',GER:'ГЕР',FRA:'ФРА',NED:'НИД',POR:'ПОР',RUS:'РОС',TUR:'ТУР',BRA:'БРА',ARG:'АРГ'};
const natName=c=>NATS[c]||c||'—';
const natCode=c=>RU3[c]||c||'—';

/* ----- имена ----- */
const NM={
ENG:['Гарри Джек Оливер Джеймс Том Бен Луис Мейсон Кайл Джордан Райан Коннор Калум Джош Эдди Марк Дэниел Кобби Сэм Алфи','Смит Джонсон Уокер Брайт Хьюз Тейлор Кларк Райт Робинсон Томпсон Уайт Холл Грин Вуд Барнс Кук Фостер Мур Беннетт Хилл Уорд Палмер Стоун Роуз Картер'],
ESP:['Алехандро Пабло Серхио Хавьер Даниэль Адриан Альваро Дани Марко Иван Хорхе Карлос Мигель Рауль Хуан Гонсало Иньиго Мартин Начо Альберто','Гарсия Мартинес Лопес Санчес Перес Гомес Фернандес Руис Морено Муньос Альварес Ромеро Торрес Наварро Домингес Хиль Васкес Рамос Серрано Ортега Кастро Молина Мерино Гуэрра Иглесиас'],
ITA:['Лоренцо Маттео Алессандро Федерико Джакомо Андреа Франческо Никколо Давиде Риккардо Марко Сандро Пьетро Габриэле Томмазо Симоне Джанлука Стефано Филиппо Эмануэле','Росси Руссо Феррари Эспозито Бьянки Романо Коломбо Риччи Марино Греко Бруно Галло Конти Де_Лука Манчини Коста Джордано Риццо Ломбарди Моретти Барбьери Фонтана Сантори Кальдара Пеллегрини'],
GER:['Лукас Леон Феликс Макс Йонас Пауль Нико Тим Янник Флориан Кай Юлиан Томас Марвин Робин Себастьян Николас Бенедикт Ларс Маттиас','Мюллер Шмидт Шнайдер Фишер Вебер Мейер Вагнер Беккер Шульц Хоффман Кох Рихтер Кляйн Вольф Шрёдер Нойман Шварц Циммерман Браун Крюгер Хартманн Ланге Вернер Кребс Фогт'],
FRA:['Люка Тео Хьюго Матео Антуан Жюль Адриен Рафаэль Бенжамен Матис Ибрагима Мусса Нордин Орельен Лоик Ромен Кевин Валентен Тома Эли','Мартен Бернар Дюбуа Робер Ришар Пети Дюран Леруа Моро Симон Лоран Лефевр Мишель Гарнье Фор Андре Мерсье Бланк Гиро Камара Диаби Траоре Кулибали Фонтен Рено'],
NED:['Даан Сем Люк Йорди Тейс Райан Квинтен Мике Стевен Йоэй Бас Йелле Вют Тейн Ксави Юрриен Марк Рик Яп Ноа','де_Йонг Янсен де_Врис ван_ден_Берг Баккер Виссер Смит Мейер де_Бур Мюлдер де_Грот Бос Вос Петерс Хендрикс ван_Леувен Дейкстра Схаутен ван_дер_Линден Кёйперс Вербек Тиммер Ворм Брюггинк Постма'],
POR:['Жуан Диогу Тьягу Гонсалу Руй Бруну Андре Педру Франсишку Мигел Нуну Рафаэл Тому Витор Рикарду Жозе Фабиу Дуарте Гильерме Рубен','Силва Сантуш Феррейра Перейра Оливейра Кошта Родригеш Мартинш Жезуш Соуза Фернандеш Гонсалвеш Гомеш Лопеш Маркеш Алвеш Алмейда Рибейру Пинту Карвалью Тейшейра Мора Кардозу Невеш Мендеш'],
RUS:['Александр Дмитрий Максим Сергей Андрей Алексей Артём Илья Кирилл Михаил Никита Матвей Роман Егор Арсений Иван Даниил Денис Владислав Игорь','Иванов Смирнов Кузнецов Попов Васильев Петров Соколов Михайлов Новиков Фёдоров Морозов Волков Алексеев Лебедев Семёнов Егоров Павлов Козлов Степанов Николаев Орлов Андреев Макаров Никитин Захаров'],
TUR:['Мехмет Эмре Бурак Кенан Арда Озан Хакан Керем Чаглар Мерт Угур Ферди Юсуф Барыш Окан Энес Халил Октай Сердар Онур','Йылмаз Кая Демир Шахин Челик Йылдыз Йылдырым Озтюрк Айдын Оздемир Арслан Доган Кылыч Аслан Четин Кара Коч Курт Озкан Шимшек Полат Акын Гюлер Тосун Эрен'],
BRA:['Габриэл Лукас Матеус Педро Витор Жуан Рафаэл Густаво Фелипе Бруно Родриго Каио Тьяго Даниэл Леандро Андре Эвертон Луан Рикардо Вагнер','да_Силва Сантос Оливейра Соуза Лима Перейра Феррейра Алвес Родригес Рибейро Карвалью Гомес Мартинс Араужо Барбоза Кардозо Насименто Кошта Морейра Рамос Мендес Фрейтас Кастро Виейра Пинту'],
ARG:['Лаутаро Матиас Хулиан Факундо Николас Гонсало Франко Алексис Энсо Агустин Леандро Тьяго Валентин Нахуэль Родриго Эсекьель Херман Хоакин Себастьян Лисандро','Гонсалес Родригес Гомес Фернандес Лопес Диас Мартинес Перес Ромеро Санчес Суарес Акунья Паласиос Пас Медина Соса Рохас Молина Бенитес Кабраль Альмада Бальди Бустос Видаль Ледесма'],
SEN:['Исмаила Шейх Мамаду Бамба Пап Абду Ибраима Секу Усман Модибо Буна Ламин Мусса Илиман Фоде Крепен Бабакар Сулейман Нико Абдулай','Диоп Ндиайе Фаль Сарр Сиссе Гейе Мбай Сене Тиам Ба Ньянг Диатта Сов Камара Дьедью Мендес Гомис Сиби Диалло Тине Сейди Кейта Сане Туре Дьюф'],
CRO:['Лука Иван Марко Матео Йосип Никола Анте Мартин Доминик Борна Мислав Дарио Бруно Франьо Деян Юре Томислав Петар Кристиян Матея','Хорват Ковачевич Бабич Марич Юрич Новак Ковачич Вукович Кнежевич Маркович Петрович Матич Томич Павлович Божич Блажевич Грбич Шутало Видович Лончар Сосич Пашалич Ерич Мамич Брекало'],
DEN:['Расмус Мадс Кристиан Йонас Микель Андреас Фредерик Оливер Матиас Ларс Нильс Каспер Йеспер Виктор Густав Мортен Свен Эмиль Тобиас Йоаким','Йенсен Нильсен Хансен Педерсен Андерсен Кристенсен Ларсен Сёренсен Расмуссен Йёргенсен Петерсен Мадсен Кристиансен Ольсен Тофт Мёллер Дамсгор Хольм Бах Линдберг Кьер Сков Бьорн Вестергор Фриис'],
ARA:['Мохаммед Абдулла Салем Фахад Султан Насер Али Хамад Яссер Омар Халид Саад Фейсал Турки Абдулрахман Хасан Сауд Нават Юсеф Ахмед','Аль-Даусари Аль-Шахрани Аль-Фарадж Аль-Бурайк Аль-Овайс Аль-Амри Аль-Гамди Аль-Муваллад Аль-Буляйхи Аль-Хамдан Аль-Обуд Аль-Наджи Аль-Харби Аль-Отайби Аль-Мутайри Аль-Кахтани Хаддад Мансур Юсеф Саид Бенали Хамди Шариф Азиз Аттия'],
JPN:['Такуми Кадзуя Каору Рицу Дайти Хироки Юто Ватару Такэхиро Сё Аясэ Кэйто Ко Рё Юки Сота Харуто Рэн Кодзи Дайсукэ','Сато Судзуки Такахаси Танака Ито Ватанабэ Ямамото Накамура Кобаяси Като Ёсида Ямада Сасаки Ямагути Мацумото Иноуэ Кимура Хаяси Симидзу Ямадзаки Мори Абэ Икэда Хасимото Исикава'],
KOR:['Мин-джэ Хын-мин Кан-ин Хи-чхан Джи-сон Сон-ёп Чжун-хо Тхэ-хван Ён-у Чан-хун Сын-хо Мин-хёк Хён-у До-хён Чжи-хун Ин-бом Ки-хёк Сан-хо Гю-сон Сон-мин','Ким Ли Пак Чхве Чон Кан Чо Юн Чан Лим Хан О Со Син Квон Хван Ан Сон Ю Хон'],
CHN:['Вэй Лэй Цзюнь Пэн Хао Тао Бинь Юй Чэнь Цзе Лун Мин Фэй Синь Кай Цян Бо Жуй Чжэ Ян','Ван Ли Чжан Лю Чэнь Ян Хуан Чжао У Чжоу Сюй Сунь Ма Чжу Ху Го Хэ Гао Линь Ло'],
GRE:['Йоргос Костас Димитрис Никос Яннис Христос Василис Панагиотис Тасос Андреас Ставрос Михалис Сотирис Лефтерис Танасис Петрос Алексис Манолис Стелиос Фотис','Пападопулос Пападимитриу Константину Георгиу Николау Василиу Иоанну Димитриу Хадзис Маврас Пелкас Масурас Сиопис Бакасетас Карецас Дусис Ставропулос Мануйлидис Кутрис Ретсос Пасалидис Лимниос Пападакис Галанопулос Кутсиас'],
UKR:['Андрей Александр Виталий Николай Руслан Тарас Богдан Владислав Илья Артём Георгий Олег Юрий Евгений Назар Максим Остап Роман Дмитрий Игорь','Шевчук Коваленко Бондаренко Ткаченко Кравченко Мельник Олийнык Шаповал Сидоренко Матвиенко Гуменюк Литвиненко Гончаренко Дяченко Савченко Марченко Руденко Мазур Пилипенко Остапенко Кушнир Семенюк Лысенко Захарченко Ярошенко'],
CZE:['Томаш Ян Якуб Лукаш Мартин Ондржей Давид Петр Адам Михал Матей Вацлав Филип Йиржи Павел Патрик Доминик Даниэль Войтех Иржи','Новак Свобода Новотны Дворжак Черны Прохазка Кучера Веселы Горак Немец Поспишил Соучек Зима Коуба Холеш Цоуфал Крейчи Провод Бартл Садилек Ярош Ставьяник Чвянчара Гавел Кадлец'],
POL:['Роберт Кшиштоф Якуб Пётр Камиль Мацей Бартош Лукаш Себастьян Павел Михал Николя Кароль Мариуш Шимон Адам Яцек Томаш Матеуш Дамиан','Новак Ковальский Вишневский Левандовский Зелиньский Каминьский Шиманьский Возняк Козловский Мазур Кравчик Бульга Моджер Фрамковский Беднарек Кивиор Швидерский Пентак Слиш Яньский Скорупский Цаш Пёнтек Залевский Бусь'],
SRB:['Душан Александр Сергей Никола Стефан Лука Марко Неманья Милош Филип Вельо Урош Андрия Богдан Лазар Драган Срджан Мийат Огнен Предраг','Влахович Митрович Милинкович Тадич Костич Павлович Лукич Живкович Гудель Миленкович Бабич Раткович Илич Максимович Гаичич Николич Йович Станкович Петрович Йованович Маркович Симич Радонич Вукович Зечевич']
};
for(const k in NM)NM[k]=NM[k].map(s=>s.split(' ').map(x=>x.replace(/_/g,' ')));
const POOL={USA:'ENG',CAN:'ENG',AUS:'ENG',NZL:'ENG',SCO:'ENG',WAL:'ENG',NIR:'ENG',IRL:'ENG',JAM:'ENG',TRI:'ENG',RSA:'SEN',
 MEX:'ESP',COL:'ARG',URU:'ARG',CHI:'ARG',ECU:'ESP',PAR:'ARG',PER:'ESP',BOL:'ESP',VEN:'ESP',CRC:'ESP',PAN:'ESP',HON:'ESP',SLV:'ESP',GUA:'ESP',
 BEL:'NED',AUT:'GER',SUI:'GER',KSA:'ARA',QAT:'ARA',UAE:'ARA',EGY:'ARA',MAR:'ARA',TUN:'ARA',ALG:'ARA',LBY:'ARA',IRQ:'ARA',JOR:'ARA',SYR:'ARA',KUW:'ARA',BHR:'ARA',OMA:'ARA',PLE:'ARA',LBN:'ARA',SDN:'ARA',IRN:'ARA',
 NGA:'SEN',GHA:'SEN',CIV:'SEN',CMR:'SEN',MLI:'SEN',COD:'SEN',BFA:'SEN',GUI:'SEN',GAB:'SEN',ANG:'POR',CPV:'POR',ZAM:'SEN',BEN:'SEN',GAM:'SEN',GNB:'POR',TOG:'SEN',MTN:'ARA',
 AZE:'TUR',BLR:'RUS',KAZ:'RUS',UZB:'RUS',KGZ:'RUS',TJK:'RUS',ARM:'RUS',GEO:'RUS',MDA:'RUS',SVN:'CRO',BIH:'CRO',MNE:'SRB',MKD:'SRB',HUN:'CZE',ROU:'SRB',BUL:'SRB',SVK:'CZE',CYP:'GRE',ALB:'SRB',KOS:'SRB',
 NOR:'DEN',SWE:'DEN',FIN:'DEN',ISL:'DEN',THA:'CHN',VIE:'CHN',IDN:'CHN',IND:'CHN',PHI:'CHN',ISR:'ENG',LTU:'RUS',LVA:'RUS',EST:'RUS',LUX:'FRA'};
const poolOf=n=>NM[n]?n:(POOL[n]||'ENG');
const genName=nat=>{const L=NM[poolOf(nat)];return pick(L[0])+' '+pick(L[1]);};
const FOREIGN=['BRA','ARG','FRA','ESP','POR','NED','SEN','NGA','CIV','GHA','CMR','MAR','COL','URU','CRO','SRB','DEN','SWE','NOR','BEL','GER','ENG','ITA','JPN','KOR','USA','MLI','ALG','POL','UKR','AUT','SUI','GRE','CZE','ECU','PAR','CHI','VEN','GEO','TUR','EGY','TUN','SCO','IRL','AUS','MEX'];

/* ----- имена из Википедии ----- */
const PATR=/(вич|вна|ична|оглы|кызы|улы)$/;
const CIS=new Set(['RUS','UKR','BLR','KAZ','UZB','TJK','KGZ','ARM','GEO','AZE','MDA']);
function translit(s){
  s=s.replace(/sky\b/g,'ский').replace(/skiy\b/g,'ский').replace(/iy\b/g,'ий').replace(/yy\b/g,'ый').replace(/ey\b/g,'ей').replace(/ay\b/g,'ай').replace(/oy\b/g,'ой');
  const D=[['shch','щ'],['sch','щ'],['zh','ж'],['kh','х'],['ts','ц'],['ch','ч'],['sh','ш'],['yu','ю'],['ya','я'],['yo','ё'],['ye','е'],['iu','ю'],['ia','я']];
  const L={a:'а',b:'б',v:'в',g:'г',d:'д',e:'е',z:'з',i:'и',y:'ы',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',r:'р',s:'с',t:'т',u:'у',f:'ф',h:'х',c:'к',j:'й',w:'в',x:'кс',q:'к',"'":'ь'};
  let out='';let i=0;
  while(i<s.length){const lo=s.toLowerCase();let hit=null;for(const [a,b] of D)if(lo.startsWith(a,i)){hit=[a,b];break;}
    const up=s[i]!==lo[i];
    if(hit){out+=up?hit[1][0].toUpperCase()+hit[1].slice(1):hit[1];i+=hit[0].length;continue;}
    const c=L[lo[i]];if(c!=null){const r=(lo[i]==='y'&&(i===0||/[aeiou\s]/.test(lo[i-1])))?'й':c;out+=up?r[0].toUpperCase()+r.slice(1):r;}else out+=s[i];i++;}
  return out;
}
function cleanName(n,nat){
  n=String(n).replace(/\s*\(.*?\)/g,'').trim();
  if(n.includes(',')){const [l,f]=n.split(',').map(s=>s.trim());const fw=(f||'').split(/\s+/).filter(w=>w&&!PATR.test(w));n=(fw.length?fw[0]+' ':'')+l;}
  else{const w=n.split(/\s+/);if(w.length>=3)n=w.filter((x,i)=>!(i>0&&i<w.length-1&&PATR.test(x))).join(' ');}
  if(CIS.has(nat)&&/^[A-Za-z' .-]+$/.test(n))n=translit(n);
  return n;
}

/* ----- игроки ----- */
function newStats(){return {ap:0,g:0,as:0,r:0,yc:0,rc:0};}
// амплуа внутри позиции: сильные стороны (+) и слабые (−)
const ARCH={
  GK:[['Классический вратарь','ref han aer cmd pos','rus kic'],['Вратарь-чистильщик','rus kic one acc com','aer'],['Мастер реакции','ref agi one','kic cmd']],
  DC:[['Стоппер','hea str jum agg tck bra','pas tec'],['Защитник с мячом','pas fir tec cmp vis','agg'],['Быстрый защитник','pac acc ant pos','hea str']],
  FB:[['Атакующий крайний','cro dri sta pac otb','mar pos'],['Надёжный крайний','tck mar pos str cnt','cro dri'],['Инвертированный защитник','pas fir tec dec','cro']],
  DM:[['Разрушитель','tck agg wor sta str','vis fla'],['Опорный распасовщик','pas vis cmp fir tec','agg tck']],
  MC:[['Box-to-box','sta wor tck otb lon','fla'],['Плеймейкер','pas vis tec fir dec','tck str'],['Мезала','dri otb lon fla acc','mar tck']],
  WM:[['Вингер-навесчик','cro pac sta acc','fin'],['Работяга','wor sta tea tck','fla']],
  AMC:[['Атакующий плеймейкер','pas vis tec fla fir','tck str'],['Теневой форвард','otb fin cmp ant','pas']],
  W:[['Скоростной вингер','pac acc dri','hea str'],['Инвертированный вингер','fin lon dri tec cmp','cro'],['Креативный вингер','pas vis fla cro','str']],
  ST:[['Бомбардир','fin otb ant cmp acc','pas tck'],['Таран','hea str jum bra','acc agi dri'],['Ложная девятка','pas vis tec fir dri','hea str'],['Универсальный форвард','fin hea str pac tec','']]};
// футбольная школа страны: небольшие сдвиги характеристик
const STYLE={latam:'dri1 fla1.2 tec.8 cnt-.4',esp:'pas1 fir1 tec.8 vis.5',ita:'mar1 pos1 dec.6 tck.5 cnt.5',ger:'det1 tea.8 wor.8 cnt.6',eng:'wor1 bra.8 hea.6 sta.6 cmp-.3',
  ned:'pas.6 tec.6 vis.6 dec.4',fra:'pac.6 acc.6 str.5 tec.4',afr:'pac1 acc.8 str.8 nat.6 dec-.4',asia:'wor1 sta.8 tea.8 str-.6',nord:'hea.6 str.6 tea.6',bal:'tec.6 pas.5 agg.5',east:'wor.5 str.4 cnt.3'};
const STYLE_OF={BRA:'latam',ARG:'latam',URU:'latam',COL:'latam',POR:'latam',ECU:'latam',PAR:'latam',CHI:'latam',VEN:'latam',PER:'latam',MEX:'latam',ESP:'esp',ITA:'ita',GER:'ger',AUT:'ger',SUI:'ger',
  ENG:'eng',SCO:'eng',IRL:'eng',WAL:'eng',NIR:'eng',USA:'eng',AUS:'eng',NED:'ned',BEL:'ned',FRA:'fra',SEN:'afr',NGA:'afr',CIV:'afr',GHA:'afr',CMR:'afr',MLI:'afr',GUI:'afr',COD:'afr',BFA:'afr',
  JPN:'asia',KOR:'asia',CHN:'asia',DEN:'nord',SWE:'nord',NOR:'nord',ISL:'nord',FIN:'nord',SRB:'bal',CRO:'bal',BIH:'bal',SVN:'bal',MNE:'bal',RUS:'east',UKR:'east',BLR:'east',POL:'east',CZE:'east'};
const parseMods=s=>s?s.split(' ').filter(Boolean).map(t=>[A[t.slice(0,3)],+t.slice(3)]):[];
function genPlayer(level,pos,age,nat,height){
  const a=new Array(47);const role=POS_ROLE[pos];const keys=new Map(ROLE[role]);const gk=pos==='GK';
  const h=height||Math.round(178+gauss()*6+(pos==='GK'?9:pos==='DC'?7:pos==='ST'?2:0));
  const arch=pick(ARCH[role]);const plus=new Set(arch[1].split(' ').map(k=>A[k])),minus=new Set(arch[2].split(' ').filter(Boolean).map(k=>A[k]));
  const style=parseMods(STYLE[STYLE_OF[nat]]);const hz=clamp((h-182)/6,-2.5,2.5);
  for(let i=0;i<47;i++){
    let v;
    if(keys.has(i))v=level+gauss()*1.2+(keys.get(i)-2)*.6;
    else if(i>=36)v=gk?level-2+gauss()*2:ri(1,3);
    else if(gk&&i<14)v=level-7+gauss()*2;
    else v=level-3.5+gauss()*2.2;
    if(plus.has(i))v+=1.6+Math.abs(gauss())*.6;if(minus.has(i))v-=1.6;
    a[i]=v;
  }
  // рост: высокие сильнее в воздухе и в борьбе, ниже ростом — подвижнее
  a[A.hea]+=hz*.8;a[A.jum]+=hz*.6;a[A.str]+=hz*.8;a[A.agi]-=hz*.6;a[A.bal]-=hz*.5;a[A.acc]-=hz*.4;if(gk)a[A.aer]+=hz*.7;
  // возраст: скорость пикует к 24-27, сила и выносливость растут до 26, ментальные качества — с опытом
  const sp=age<20?-(20-age)*.55:age>28?-(age-28)*.55:0;a[A.pac]+=sp;a[A.acc]+=sp;a[A.agi]+=sp*.8;
  if(age<23){a[A.str]-=(23-age)*.5;a[A.sta]-=(23-age)*.35;}if(age>31){a[A.nat]-=(age-31)*.5;a[A.sta]-=(age-31)*.4;}
  for(const k of ['dec','cmp','ant','pos','ldr','tea','cnt','vis'])a[A[k]]+=clamp((age-24)*.17,-1.2,1.6);
  for(const [i,d] of style)a[i]+=d;
  for(let i=0;i<47;i++)a[i]=clamp(Math.round(a[i]),1,20);
  const alt=[];if(pos!=='GK'){if(rnd()<.5)alt.push(pick(NEAR[pos]));if(rnd()<.18){const x=pick(NEAR[pos]);if(!alt.includes(x))alt.push(x);}}
  const p={id:S.nid++,n:genName(nat),nat,age,pos,alt,a,arch:arch[0],club:-1,ce:S.year+1,wage:1000,cond:100,inj:0,sus:0,mor:70,form:[],st:newStats(),car:{ap:0,g:0},ft:rnd()<.24?'Левая':rnd()<.08?'Обе':'Правая',h,pa:0,listed:false,hf:0};
  const c=ca(p);
  p.pa=age<=23?Math.min(20,c+Math.max(0,gauss()*1.2+(24-age)*.45)):c;
  return p;
}
function value(p){const c=ca(p);let v=22000*Math.exp(.66*(c-5));if(p.age<24)v*=1+Math.max(0,p.pa-c)*.18;if(p.age>28)v*=Math.pow(.84,p.age-28);if(p.club>=0&&p.ce-S.year<=1)v*=.75;return v>1e6?Math.round(v/1e5)*1e5:Math.max(1e4,Math.round(v/1e4)*1e4);}
function wageFor(p,rep){const c=ca(p);return Math.max(400,Math.round(22000*Math.exp(.66*(c-5))*.0012*(.5+rep/100)/100)*100);}
