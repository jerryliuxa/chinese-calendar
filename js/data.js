/* ═══════════════════════════════════════════════
 * 玄玑数据集 data.js
 * 节日(公共/传统/道教/佛教/民族/伊斯兰)· 八卦 · 六十四卦 · 节气诗语 · 宜忌
 * 全局暴露:window.DATA
 * ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────── 节日类别(古风色) ─────────── */
  const CATS = {
    public:    { label: '公共节日', color: '#b03a2e' },
    tradition: { label: '传统节日', color: '#9a7226' },
    term:      { label: '节气',     color: '#46714e' },
    taoist:    { label: '道教',     color: '#2f5d7c' },
    buddhist:  { label: '佛教',     color: '#7a4e78' },
    ethnic:    { label: '民族',     color: '#b8526f' },
    islamic:   { label: '伊斯兰',   color: '#2f7d6d' }
  };

  /*
   * type:
   *  solar  → 公历 m月d日
   *  lunar  → 农历 m月d日(逢月小而日超出者取晦日)
   *  term   → 节气(name 匹配节气名)
   *  hijri  → 伊斯兰历 m月d日(历表推算,以新月观测为准)
   *  special→ 特殊计算(除夕)
   */
  const FESTS = [
    /* ── 公共节日 ── */
    { name: '元旦', cat: 'public', type: 'solar', m: 1, d: 1, legal: true, desc: '公历新年之首,万象更新,四海同庆。' },
    { name: '妇女节', cat: 'public', type: 'solar', m: 3, d: 8, desc: '国际劳动妇女节,致敬半边天。' },
    { name: '植树节', cat: 'public', type: 'solar', m: 3, d: 12, desc: '孙中山先生逝世纪念日,亦是全民植绿之日。' },
    { name: '劳动节', cat: 'public', type: 'solar', m: 5, d: 1, legal: true, desc: '国际劳动节,致敬天下劳动者。' },
    { name: '青年节', cat: 'public', type: 'solar', m: 5, d: 4, desc: '纪念五四运动,青年当自强。' },
    { name: '儿童节', cat: 'public', type: 'solar', m: 6, d: 1, desc: '国际儿童节,愿天下孩童皆得欢愉。' },
    { name: '建党节', cat: 'public', type: 'solar', m: 7, d: 1, desc: '中国共产党成立纪念日。' },
    { name: '建军节', cat: 'public', type: 'solar', m: 8, d: 1, desc: '中国人民解放军建军纪念日。' },
    { name: '教师节', cat: 'public', type: 'solar', m: 9, d: 10, desc: '尊师重道,传灯授业。' },
    { name: '抗战胜利纪念日', cat: 'public', type: 'solar', m: 9, d: 3, desc: '中国人民抗日战争胜利纪念日,铭记历史。' },
    { name: '国家公祭日', cat: 'public', type: 'solar', m: 12, d: 13, desc: '南京大屠杀死难者国家公祭日,勿忘国殇。' },
    { name: '国庆节', cat: 'public', type: 'solar', m: 10, d: 1, legal: true, desc: '中华人民共和国成立纪念日,山河锦绣。' },
    { name: '春节', cat: 'public', type: 'lunar', m: 1, d: 1, legal: true, alias: '岁旦', desc: '农历正月初一,一元复始,辞旧迎新,万家灯火。' },
    { name: '清明节', cat: 'public', type: 'term', term: '清明', legal: true, desc: '节气与节日合一,踏青插柳,祭祖追远。' },
    { name: '端午节', cat: 'public', type: 'lunar', m: 5, d: 5, legal: true, desc: '五月初五,龙舟竞渡,粽叶飘香,遥祭屈子。' },
    { name: '中秋节', cat: 'public', type: 'lunar', m: 8, d: 15, legal: true, desc: '八月十五,月满人团圆,千里共婵娟。' },

    /* ── 传统节日 ── */
    { name: '除夕', cat: 'tradition', type: 'special', special: 'chuxi', desc: '岁末最后一夜,守岁燃灯,阖家围炉。' },
    { name: '元宵节', cat: 'tradition', type: 'lunar', m: 1, d: 15, desc: '正月十五,火树银花,灯月交辉,汤圆贺团圆。' },
    { name: '龙抬头', cat: 'tradition', type: 'lunar', m: 2, d: 2, desc: '二月二,苍龙抬头,剃龙头,祈雨顺。' },
    { name: '上巳节', cat: 'tradition', type: 'lunar', m: 3, d: 3, desc: '三月三,曲水流觞,祓禊踏青,古之春游。' },
    { name: '七夕节', cat: 'tradition', type: 'lunar', m: 7, d: 7, desc: '七月初七,鹊桥相会,乞巧许愿,中国情人节。' },
    { name: '寒衣节', cat: 'tradition', type: 'lunar', m: 10, d: 1, desc: '十月初一,送寒衣,祭先人,念故土。' },
    { name: '腊八节', cat: 'tradition', type: 'lunar', m: 12, d: 8, desc: '腊月初八,五谷熬粥,年味自此始。' },
    { name: '小年', cat: 'tradition', type: 'lunar', m: 12, d: 23, desc: '腊月廿三,北方小年,祭灶送神,南方多在廿四。' },
    { name: '重阳节', cat: 'tradition', type: 'lunar', m: 9, d: 9, desc: '九九重阳,登高望远,佩萸赏菊,敬老之节。' },

    /* ── 道教节日 ── */
    { name: '上元节', cat: 'taoist', type: 'lunar', m: 1, d: 15, desc: '天官赐福之辰,三元节之首,燃灯祈福。' },
    { name: '玉皇诞', cat: 'taoist', type: 'lunar', m: 1, d: 9, alias: '天公生', desc: '正月初九,玉皇大帝圣诞,闽南一带祭天公。' },
    { name: '文昌诞', cat: 'taoist', type: 'lunar', m: 2, d: 3, desc: '文昌帝君圣诞,学子祈慧,文运亨通。' },
    { name: '太上老君圣诞', cat: 'taoist', type: 'lunar', m: 2, d: 15, desc: '道德天尊诞辰,道气长存。' },
    { name: '真武诞', cat: 'taoist', type: 'lunar', m: 3, d: 3, alias: '蟠桃会', desc: '真武大帝圣诞,亦传王母蟠桃盛会之期。' },
    { name: '财神诞', cat: 'taoist', type: 'lunar', m: 3, d: 15, desc: '赵公明元帅圣诞,商贾祈福纳财。' },
    { name: '关帝诞', cat: 'taoist', type: 'lunar', m: 6, d: 24, desc: '关圣帝君圣诞,忠义千秋。' },
    { name: '中元节', cat: 'taoist', type: 'lunar', m: 7, d: 15, alias: '地官赦罪', desc: '地官赦罪之辰,河灯度幽,慎终追远。' },
    { name: '斗姆诞', cat: 'taoist', type: 'lunar', m: 9, d: 9, desc: '斗姆元君圣诞,与重阳同日,登高亦朝斗。' },
    { name: '下元节', cat: 'taoist', type: 'lunar', m: 10, d: 15, alias: '水官解厄', desc: '水官解厄之辰,修斋祭孤,祈愿顺遂。' },
    { name: '元始天尊圣诞', cat: 'taoist', type: 'term', term: '冬至', desc: '冬至一阳生,道书记为元始天尊圣诞。' },
    { name: '灵宝天尊圣诞', cat: 'taoist', type: 'term', term: '夏至', desc: '夏至一阴生,道书记为灵宝天尊圣诞。' },

    /* ── 佛教节日 ── */
    { name: '弥勒圣诞', cat: 'buddhist', type: 'lunar', m: 1, d: 1, desc: '正月初一,弥勒菩萨圣诞,笑迎新岁。' },
    { name: '释迦出家日', cat: 'buddhist', type: 'lunar', m: 2, d: 8, desc: '二月初八,释迦牟尼佛出家纪念日。' },
    { name: '释迦涅槃日', cat: 'buddhist', type: 'lunar', m: 2, d: 15, desc: '二月十五,释迦牟尼佛涅槃纪念日。' },
    { name: '观音圣诞', cat: 'buddhist', type: 'lunar', m: 2, d: 19, desc: '二月十九,观世音菩萨圣诞,香火最盛。' },
    { name: '普贤圣诞', cat: 'buddhist', type: 'lunar', m: 2, d: 21, desc: '二月廿一,普贤菩萨圣诞,行愿无边。' },
    { name: '文殊圣诞', cat: 'buddhist', type: 'lunar', m: 4, d: 4, desc: '四月初四,文殊菩萨圣诞,智慧第一。' },
    { name: '浴佛节', cat: 'buddhist', type: 'lunar', m: 4, d: 8, alias: '佛诞节', desc: '四月初八,释迦牟尼佛圣诞,浴佛祈福。' },
    { name: '药王圣诞', cat: 'buddhist', type: 'lunar', m: 4, d: 28, desc: '四月廿八,药王菩萨圣诞,施药济世。' },
    { name: '韦驮圣诞', cat: 'buddhist', type: 'lunar', m: 6, d: 3, desc: '六月初三,韦驮菩萨圣诞,护法安僧。' },
    { name: '观音成道日', cat: 'buddhist', type: 'lunar', m: 6, d: 19, desc: '六月十九,观世音菩萨成道纪念日。' },
    { name: '大势至圣诞', cat: 'buddhist', type: 'lunar', m: 7, d: 13, desc: '七月十三,大势至菩萨圣诞。' },
    { name: '盂兰盆节', cat: 'buddhist', type: 'lunar', m: 7, d: 15, desc: '七月十五,设盂兰盆供,报亲恩,度孤魂。' },
    { name: '地藏圣诞', cat: 'buddhist', type: 'lunar', m: 7, d: 30, desc: '七月三十(月小则廿九),地藏菩萨圣诞,大愿安忍。' },
    { name: '观音出家日', cat: 'buddhist', type: 'lunar', m: 9, d: 19, desc: '九月十九,观世音菩萨出家纪念日。' },
    { name: '药师佛圣诞', cat: 'buddhist', type: 'lunar', m: 9, d: 30, desc: '九月三十(月小则廿九),药师琉璃光佛圣诞。' },
    { name: '弥陀圣诞', cat: 'buddhist', type: 'lunar', m: 11, d: 17, desc: '十一月十七,阿弥陀佛圣诞,佛光普照。' },
    { name: '腊八(成道日)', cat: 'buddhist', type: 'lunar', m: 12, d: 8, desc: '腊月初八,释迦牟尼佛成道日,寺院施粥。' },

    /* ── 民族节日 ── */
    { name: '目瑙纵歌节', cat: 'ethnic', type: 'lunar', m: 1, d: 15, approx: true, desc: '景颇族盛典,万人踩鼓共舞,"目瑙示栋"之下千万人同歌。' },
    { name: '刀杆节', cat: 'ethnic', type: 'lunar', m: 2, d: 8, desc: '傈僳族节日,"上刀山、下火海",勇者之舞。' },
    { name: '三月三', cat: 'ethnic', type: 'lunar', m: 3, d: 3, alias: '歌圩节', desc: '壮、黎、苗、侗等多民族歌节,对歌抛绣,五色糯饭。' },
    { name: '泼水节', cat: 'ethnic', type: 'solar', m: 4, d: 13, span: 3, desc: '傣历新年,公历4月13-15日,圣水互泼,祝福倾城。' },
    { name: '那达慕', cat: 'ethnic', type: 'solar', m: 7, d: 11, approx: true, desc: '蒙古族盛会,多在公历7-8月,摔跤赛马射箭,草原欢腾。' },
    { name: '火把节', cat: 'ethnic', type: 'lunar', m: 6, d: 24, desc: '彝、白、纳西等族节日,火把游田,星河落人间。' },
    { name: '苗年', cat: 'ethnic', type: 'lunar', m: 10, d: 1, approx: true, desc: '苗族新年,多在农历十月至十一月间,各地日期不一。' },

    /* ── 伊斯兰教节日(历表推算) ── */
    { name: '回历新年', cat: 'islamic', type: 'hijri', m: 1, d: 1, desc: '希吉来历岁首,穆哈兰姆月初一。' },
    { name: '阿舒拉日', cat: 'islamic', type: 'hijri', m: 1, d: 10, desc: '穆哈兰月初十,斋戒追思之日。' },
    { name: '圣纪节', cat: 'islamic', type: 'hijri', m: 3, d: 12, desc: '先知穆罕默德诞辰与归真纪念日。' },
    { name: '登霄节', cat: 'islamic', type: 'hijri', m: 7, d: 27, desc: '纪念先知"夜行登霄"。' },
    { name: '拜拉特夜', cat: 'islamic', type: 'hijri', m: 8, d: 15, alias: '赦免之夜', desc: '舍尔邦月月中之夜,诵经悔过。' },
    { name: '斋月始', cat: 'islamic', type: 'hijri', m: 9, d: 1, desc: '莱麦丹月首日,封斋之始,见月入斋。' },
    { name: '盖德尔夜', cat: 'islamic', type: 'hijri', m: 9, d: 27, alias: '高贵之夜', desc: '斋月末旬奇数夜,《古兰经》始降之夜。' },
    { name: '开斋节', cat: 'islamic', type: 'hijri', m: 10, d: 1, desc: '莱麦丹斋功圆满,闪瓦鲁月初一,欢庆开斋。' },
    { name: '阿拉法特日', cat: 'islamic', type: 'hijri', m: 12, d: 9, desc: '朝觐驻阿拉法特山之日,斋戒祈福。' },
    { name: '宰牲节', cat: 'islamic', type: 'hijri', m: 12, d: 10, alias: '古尔邦节', desc: '祖勒希哲月初十,宰牲献祭,回族维吾尔族等盛大节日。' }
  ];

  /* ─────────── 节气诗语 ─────────── */
  const TERM_DESC = {
    '小寒': '天渐寒,尚未大冷,雁北乡,鹊始巢,围炉煮雪正当时。',
    '大寒': '寒气之逆极,坚冰深处春水生,岁末迎新,静候东风。',
    '立春': '东风解冻,蛰虫始振,一年之计在于春。',
    '雨水': '东风既解冻,散而为雨,草木萌动,春意初酿。',
    '惊蛰': '春雷乍动,惊醒蛰伏百虫,桃始华,仓庚鸣。',
    '春分': '昼夜均而寒暑平,玄鸟至,雷乃发声。',
    '清明': '气清景明,万物皆显,踏青祭祖,慎终追远。',
    '谷雨': '雨生百谷,浮萍始生,布谷啼春,播种正忙。',
    '立夏': '万物至此皆长大,蝼蝈鸣,蚯蚓出,绿荫渐浓。',
    '小满': '麦粒渐满,将熟未熟,江河渐盈,人生小满胜万全。',
    '芒种': '有芒之谷可种,螳螂生,麦黄梅熟,家家麦饭美。',
    '夏至': '日长之至,阴阳争,鹿角解,蝉始鸣,半夏生。',
    '小暑': '温风至,蟋蟀居宇,伏天将至,荷风送香。',
    '大暑': '一年中最炎热的时节,腐草为萤,土润溽暑,大雨时行。',
    '立秋': '凉风有信,一叶知秋,暑去凉来,梧桐始落。',
    '处暑': '暑气至此而止,鹰乃祭鸟,天地始肃,禾乃登。',
    '白露': '阴气渐重,露凝而白,鸿雁来,玄鸟归。',
    '秋分': '昼夜再度均分,雷始收声,蛰虫坯户,丹桂飘香。',
    '寒露': '露气寒冷,将凝结也,鸿雁南迁,菊有黄华。',
    '霜降': '气肃而凝,露结为霜,豺乃祭兽,草木黄落。',
    '立冬': '万物收藏,水始冰,地始冻,休养生息。',
    '小雪': '虹藏不见,天地闭塞,初雪将至,围炉夜话。',
    '大雪': '至此而雪盛,鹖鴠不鸣,虎始交,荔挺出。',
    '冬至': '阴极之至,阳气始生,日短之至,数九消寒,一阳来复。'
  };

  /* ─────────── 八卦(后天方位) ─────────── */
  /* rows: 自上而下三爻,1=阳 0=阴 */
  const BAGUA = [
    { name: '乾', sym: '☰', rows: [1, 1, 1], xiang: '天', xing: '健', wx: '金', pos: '西北', posOld: '南', num: 1, body: '首', animal: '马', person: '君 · 父', quote: '天行健,君子以自强不息。' },
    { name: '兑', sym: '☱', rows: [0, 1, 1], xiang: '泽', xing: '悦', wx: '金', pos: '西', posOld: '东南', num: 2, body: '口', animal: '羊', person: '少女', quote: '丽泽,兑;君子以朋友讲习。' },
    { name: '离', sym: '☲', rows: [1, 0, 1], xiang: '火', xing: '丽', wx: '火', pos: '南', posOld: '东', num: 3, body: '目', animal: '雉', person: '中女', quote: '明两作,离;大人以继明照于四方。' },
    { name: '震', sym: '☳', rows: [0, 0, 1], xiang: '雷', xing: '动', wx: '木', pos: '东', posOld: '东北', num: 4, body: '足', animal: '龙', person: '长男', quote: '洊雷,震;君子以恐惧修省。' },
    { name: '巽', sym: '☴', rows: [1, 1, 0], xiang: '风', xing: '入', wx: '木', pos: '东南', posOld: '西南', num: 5, body: '股', animal: '鸡', person: '长女', quote: '随风,巽;君子以申命行事。' },
    { name: '坎', sym: '☵', rows: [0, 1, 0], xiang: '水', xing: '陷', wx: '水', pos: '北', posOld: '西', num: 6, body: '耳', animal: '豕', person: '中男', quote: '水洊至,习坎;君子以常德行。' },
    { name: '艮', sym: '☶', rows: [1, 0, 0], xiang: '山', xing: '止', wx: '土', pos: '东北', posOld: '西北', num: 7, body: '手', animal: '狗', person: '少男', quote: '兼山,艮;君子以思不出其位。' },
    { name: '坤', sym: '☷', rows: [0, 0, 0], xiang: '地', xing: '顺', wx: '土', pos: '西南', posOld: '北', num: 8, body: '腹', animal: '牛', person: '母', quote: '地势坤,君子以厚德载物。' }
  ];
  /* 后天八卦轮盘序(上南离,顺时针:离南→艮东北→兑西→乾西北→坎北→坤西南→震东→巽东南) */
  const BAGUA_WHEEL = ['离', '艮', '兑', '乾', '坎', '坤', '震', '巽'];

  /* ─────────── 六十四卦(文王序) ─────────── */
  /* u=上卦 l=下卦(索引:0乾 1兑 2离 3震 4巽 5坎 6艮 7坤),line=一句卦语 */
  const HEX64 = [
    ['乾', 0, 0, '天行刚健,自强不息'], ['坤', 7, 7, '厚德载物,柔顺包容'], ['屯', 5, 3, '草木初生,蓄势待时'],
    ['蒙', 6, 5, '蒙昧待启,循序求教'], ['需', 5, 0, '云上于天,守正待机'], ['讼', 0, 5, '争讼不和,以和为贵'],
    ['师', 7, 5, '行险而顺,严明出征'], ['比', 5, 7, '水地相亲,择善而从'], ['小畜', 4, 0, '密云不雨,小有蓄积'],
    ['履', 0, 1, '履虎之危,谨慎前行'], ['泰', 7, 0, '天地交泰,通泰祥和'], ['否', 0, 7, '天地不交,否极泰来'],
    ['同人', 0, 2, '志同道合,和同于人'], ['大有', 2, 0, '火天大有,丰盛富有'], ['谦', 7, 6, '地中有山,谦逊受益'],
    ['豫', 3, 7, '雷出地上,顺动而豫'], ['随', 1, 3, '随时而动,择善相随'], ['蛊', 6, 4, '整饬积弊,革新图治'],
    ['临', 7, 1, '君临其事,宽厚临民'], ['观', 4, 7, '风行地上,观仰化人'], ['噬嗑', 2, 3, '咬合除梗,明刑敕法'],
    ['贲', 6, 2, '山火贲饰,文质彬彬'], ['剥', 6, 7, '剥落衰极,剥极将复'], ['复', 7, 3, '一阳来复,迷途知返'],
    ['无妄', 0, 3, '无妄至诚,顺乎自然'], ['大畜', 6, 0, '山天大畜,蓄德养贤'], ['颐', 6, 3, '山雷养正,慎言节食'],
    ['大过', 1, 4, '泽灭于木,非常之举'], ['坎', 5, 5, '重险叠陷,守常维心'], ['离', 2, 2, '附丽光明,柔顺守正'],
    ['咸', 1, 6, '山泽通气,感应相与'], ['恒', 3, 4, '雷风相与,持之以恒'], ['遁', 0, 6, '远小人遁,退避保身'],
    ['大壮', 3, 0, '雷在天上,刚壮守礼'], ['晋', 2, 7, '火出地上,晋升向明'], ['明夷', 7, 2, '明入地中,韬光养晦'],
    ['家人', 4, 2, '风自火出,正家之道'], ['睽', 2, 1, '火泽睽异,异中求同'], ['蹇', 5, 6, '行路蹇难,反身修德'],
    ['解', 3, 5, '雷雨作解,赦过宥罪'], ['损', 6, 1, '损下益上,惩忿窒欲'], ['益', 4, 3, '损上益下,迁善改过'],
    ['夬', 1, 0, '决而能和,扬善决恶'], ['姤', 0, 4, '天风相遇,防微杜渐'], ['萃', 1, 7, '泽上于地,聚人以正'],
    ['升', 7, 4, '地中生木,积小成大'], ['困', 1, 5, '泽无水困,处困守志'], ['井', 5, 4, '井养不穷,修德济人'],
    ['革', 1, 2, '泽火革变,顺天应人'], ['鼎', 2, 4, '木火成鼎,稳重图新'], ['震', 3, 3, '洊雷震惊,临危不惧'],
    ['艮', 6, 6, '兼山艮止,当止则止'], ['渐', 4, 6, '山上有木,循序渐进'], ['归妹', 3, 1, '泽上有雷,守礼慎归'],
    ['丰', 3, 2, '雷电皆至,丰大守中'], ['旅', 2, 6, '山上有火,旅居谦柔'], ['巽', 4, 4, '随风巽入,谦逊顺从'],
    ['兑', 1, 1, '丽泽相说,以诚相悦'], ['涣', 4, 5, '风行水上,涣然冰释'], ['节', 5, 1, '泽上有水,制度有节'],
    ['中孚', 4, 1, '泽上有风,诚信立身'], ['小过', 3, 6, '雷行山上,小有过越'], ['既济', 5, 2, '水火既济,功成守成'],
    ['未济', 2, 5, '火水未济,慎终如始']
  ];

  /* ─────────── 十二值神宜忌(民俗简则) ─────────── */
  const ZHISHEN_YIJI = {
    '建': { yi: '出行、上任、会友', ji: '动土、开仓' },
    '除': { yi: '除旧布新、沐浴、疗疾', ji: '嫁娶、远行' },
    '满': { yi: '祈福、开市、纳财', ji: '服药、安葬' },
    '平': { yi: '修整、平常诸事', ji: '大兴土木' },
    '定': { yi: '订盟、签约、安床', ji: '词讼、出行' },
    '执': { yi: '执守、捕捉、造葬', ji: '迁移、远行' },
    '破': { yi: '破屋、坏垣、求医', ji: '诸事不宜' },
    '危': { yi: '谨慎行事、祭祀', ji: '登高、冒险、行船' },
    '成': { yi: '开业、入学、成就诸事', ji: '词讼' },
    '收': { yi: '收纳、纳财、买入', ji: '放债、安葬' },
    '开': { yi: '开业、求医、出行', ji: '安葬、破土' },
    '闭': { yi: '安葬、修坟、闭藏', ji: '开市、出行' }
  };

  /* ─────────── 星座 ─────────── */
  function constellation(M, D) {
    const md = M * 100 + D;
    const ranges = [[101, 119, '摩羯座'], [120, 218, '水瓶座'], [219, 320, '双鱼座'], [321, 419, '白羊座'],
      [420, 520, '金牛座'], [521, 621, '双子座'], [622, 722, '巨蟹座'], [723, 822, '狮子座'],
      [823, 922, '处女座'], [923, 1023, '天秤座'], [1024, 1122, '天蝎座'], [1123, 1221, '射手座'],
      [1222, 1231, '摩羯座']];
    for (const [a, b, n] of ranges) if (md >= a && md <= b) return n;
    return '';
  }

  /* ─────────── 节日匹配 ─────────── */
  /* ctx = {Y,M,D, lunar, term, hijri} ; lunar 为 LC.solar2lunar 结果 */
  function matchFests(ctx) {
    const out = [];
    const { Y, M, D, lunar, term, hijri } = ctx;
    for (const f of FESTS) {
      let hit = null;
      if (f.type === 'solar') {
        if (f.m === M && D >= f.d && D < f.d + (f.span || 1)) hit = f.span && D > f.d ? `${f.name}(${D - f.d + 1}/${f.span})` : f.name;
        if (f.span && f.m === M && D === f.d) hit = f.name;
      } else if (f.type === 'lunar') {
        if (!lunar.isLeap && lunar.lMonth === f.m && lunar.lDay === f.d) hit = f.name;
        else if (!lunar.isLeap && lunar.lMonth === f.m && lunar.lDay === lunar.lMonthDays && f.d > lunar.lMonthDays) hit = f.name; // 月小取晦
      } else if (f.type === 'term') {
        if (term && term.name === f.term) hit = f.name;
      } else if (f.type === 'hijri') {
        if (hijri.m === f.m && hijri.d === f.d) hit = f.name;
      } else if (f.type === 'special' && f.special === 'chuxi') {
        const nx = LC.solar2lunar(Y + (M === 12 && D === 31 ? 1 : 0), M === 12 && D === 31 ? 1 : M, M === 12 && D === 31 ? 1 : D + 1);
        if (!nx.isLeap && nx.lMonth === 1 && nx.lDay === 1) hit = f.name;
      }
      if (hit) out.push({ fest: f, label: hit });
    }
    return out;
  }

  window.DATA = { CATS, FESTS, TERM_DESC, BAGUA, BAGUA_WHEEL, HEX64, ZHISHEN_YIJI, constellation, matchFests };
})();
