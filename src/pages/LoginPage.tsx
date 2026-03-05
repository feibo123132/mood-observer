import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Mail } from 'lucide-react';

const DAILY_QUOTES = [
  '长风破浪会有时，直挂云帆济沧海。',
  '两岸猿声啼不住，轻舟已过万重山。',
  '会当凌绝顶，一览众山小。',
  '千磨万击还坚劲，任尔东西南北风。',
  '路漫漫其修远兮，吾将上下而求索。',
  '天行健，君子以自强不息。',
  '不积跬步，无以至千里。',
  '不飞则已，一飞冲天。',
  '穷且益坚，不坠青云之志。',
  '大鹏一日同风起，扶摇直上九万里。',
  '宝剑锋从磨砺出，梅花香自苦寒来。',
  '少年辛苦终身事，莫向光阴惰寸功。',
  '黄沙百战穿金甲，不破楼兰终不还。',
  '欲穷千里目，更上一层楼。',
  '山重水复疑无路，柳暗花明又一村。',
  '仰天大笑出门去，我辈岂是蓬蒿人。',
  '长风几万里，吹度玉门关。',
  '雄关漫道真如铁，而今迈步从头越。',
  '咬定青山不放松，立根原在破岩中。',
  '沉舟侧畔千帆过，病树前头万木春。',
  '海阔凭鱼跃，天高任鸟飞。',
  '不经一番寒彻骨，怎得梅花扑鼻香。',
  '莫听穿林打叶声，何妨吟啸且徐行。',
  '行到水穷处，坐看云起时。',
  '山高路远，止不住行者征程。',
  '千淘万漉虽辛苦，吹尽狂沙始到金。',
  '丈夫志四海，万里犹比邻。',
  '世上无难事，只要肯登攀。',
  '为者常成，行者常至。',
  '星光不问赶路人，时光不负有心人。',
  '既然选择了远方，便只顾风雨兼程。',
  '追风赶月莫停留，平芜尽处是春山。',
  '愿你出走半生，归来仍是少年。',
  '一万年太久，只争朝夕。',
  '且将新火试新茶，诗酒趁年华。',
  '苔花如米小，也学牡丹开。',
  '愿乘风破万里浪，甘面壁读十年书。',
  '休言女子非英物，夜夜龙泉壁上鸣。',
  '但愿苍生俱饱暖，不辞辛苦出山林。',
  '自信人生二百年，会当水击三千里。',
  '山河无恙，少年可期。',
  '心有所向，日复一日，必有精进。',
  '愿你踏遍山海，仍觉人间值得。',
  '安于当下，享受当下，用肌肤和感官去感受世界，并心存感激。',
  '醉卧沙场君莫笑，古来征战几人回。秦时明月汉时关，万里长征人未还。',
  '希望自己成长为战士，去勇敢，去战斗，无论是非，不顾成败。',
  '尽人事，听天命；做到自己的最好，也接纳一切命运安排。',
  '天将降大任于斯人也，必先苦其心志，劳其筋骨，饿其体肤，空乏其身，行拂乱其所为，所以动心忍性，曾益其所不能。',
  '金樽清酒斗十千，玉盘珍羞直万钱。停杯投箸不能食，拔剑四顾心茫然。欲渡黄河冰塞川，将登太行雪满山。闲来垂钓碧溪上，忽复乘舟梦日边。行路难，行路难，多歧路，今安在？长风破浪会有时，直挂云帆济沧海。',
  '五花马，千金裘，呼儿将出换美酒，与尔同销万古愁。',
  '滚滚长江东逝水，浪花淘尽英雄。是非成败转头空。青山依旧在，几度夕阳红。白发渔樵江渚上，惯看秋月春风。一壶浊酒喜相逢。古今多少事，都付笑谈中。',
  '举世誉之而不加劝，举世非之而不加沮。定乎内外之分，辩乎荣辱之境。',
  '亲爱的，外面没有别人。',
  '我的时常万念俱灰，也时常死灰复燃。生活给了我多少风霜，我就能遇到多少个春天。',
  '都曾淋过大雨，穿过这冷风，都曾怀抱四季，知年月有冬。我会带上一把伞，也会多燃一把火。当你需要时，我会在这里。',
  '昨夜西风凋碧树，独上高楼，望尽天涯路。衣带渐宽终不悔，为伊消得人憔悴。众里寻他千百度，蓦然回首，那人却在灯火阑珊处。',
  '人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。',
  '纵有疾风起，人生不言弃。',
  '人生最重要的不是凯旋，而是战斗！',
  '世人都晓神仙好，唯有功名忘不了。古来将相在何处，荒冢一堆草没了。',
  '劝君莫惜金缕衣，劝君惜取少年时。有花堪折直须折，莫待无花空折枝。'
];

const QUOTE_SOURCE = [
  '李白《行路难》',
  '李白《早发白帝城》',
  '杜甫《望岳》',
  '郑燮《竹石》',
  '屈原《离骚》',
  '《周易》',
  '《荀子》',
  '司马迁',
  '王勃《滕王阁序》',
  '李白《上李邕》',
  '《警世贤文》',
  '杜甫《题壁》',
  '王昌龄《从军行》',
  '王之涣《登鹳雀楼》',
  '陆游《游山西村》',
  '李白《南陵别儿童入京》',
  '李白《关山月》',
  '毛泽东《忆秦娥·娄山关》',
  '郑燮《竹石》',
  '刘禹锡《酬乐天扬州初逢席上见赠》',
  '古训',
  '《警世贤文》',
  '苏轼《定风波》',
  '王维',
  '现代语',
  '刘禹锡《浪淘沙》',
  '曹植',
  '毛泽东',
  '《晏子春秋》',
  '佚名',
  '汪国真',
  '华岳',
  '愿语',
  '毛泽东',
  '苏轼',
  '袁枚《苔》',
  '古训',
  '秋瑾',
  '于谦',
  '毛泽东',
  '愿语',
  '现代语',
  '愿语',
  '佚名',
  '王翰《凉州词》、王昌龄《出塞》',
  '佚名',
  '佚名',
  '孟子《生于忧患，死于安乐》',
  '李白《行路难·其一》',
  '李白《将进酒》',
  '杨慎《临江仙·滚滚长江东逝水》',
  '庄子《逍遥游》',
  '张德芬',
  '佚名',
  '佚名',
  '晏殊《蝶恋花》、柳永《凤栖梧》、辛弃疾《青玉案·元夕》',
  '苏轼《水调歌头·明月几时有》',
  '佚名',
  '顾拜旦',
  '曹雪芹《红楼梦·好了歌》',
  '杜秋娘《金缕衣》'
];

const LOGIN_LOGO_SRC = '/images/login-logo.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { sendCode, loginWithCode, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [logoLoadError, setLogoLoadError] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer); // Cleanup on unmount or re-render
    }
  }, [countdown]);

  useEffect(() => {
    const now = new Date();
    const daySerial = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / (24 * 60 * 60 * 1000));
    const index = ((daySerial % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length;
    setQuoteIndex(index);
  }, []);

  const handleSendCode = async () => {
    setMsg('');
    if (!email) {
      setMsg('请输入邮箱地址');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setMsg('请输入有效的邮箱地址');
        return;
    }

    const success = await sendCode(email);
    if (success) {
      setCodeSent(true);
      setCountdown(60);
      setMsg('验证码已发送，请查收邮件');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    
    if (!code) {
      setMsg('请输入验证码');
      return;
    }

    try {
      await loginWithCode(email, code);
      navigate('/'); // Redirect to home on success
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mb-6 flex flex-col items-center text-center px-4">
        <div className="w-28 h-28 rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center mb-5">
          {!logoLoadError ? (
            <img
              src={LOGIN_LOGO_SRC}
              alt="JIEYOU Logo"
              className="w-full h-full object-cover rounded-full"
              onError={() => setLogoLoadError(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-indigo-300 text-indigo-400 flex items-center justify-center text-xs font-medium">
              LOGO
            </div>
          )}
        </div>
        <p className="text-base text-slate-600 leading-relaxed min-h-[48px]">{DAILY_QUOTES[quoteIndex]}</p>
        <p className="text-sm text-slate-400 mt-2">—— {QUOTE_SOURCE[quoteIndex]}</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-bold text-slate-800">
            验证码登录
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            无需记忆密码，使用邮箱验证码快捷登录
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                placeholder="your-email@example.com"
                disabled={codeSent && countdown > 0} // Optional: lock email while countdown is active
              />
            </div>
          </div>

          {codeSent && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-medium text-slate-700 mb-1">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all tracking-widest text-center text-lg font-mono"
                placeholder="输入6位验证码"
                maxLength={6}
              />
            </div>
          )}

          {(error || msg) && (
            <div className={`text-sm text-center p-2 rounded-lg ${error ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
              {error || msg}
            </div>
          )}

          <div className="space-y-3">
            {!codeSent ? (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="animate-spin" size={18} />}
                发送验证码
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="animate-spin" size={18} />}
                  确认登录
                </button>
                
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isLoading}
                  className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `${countdown}秒后可重新发送` : '没有收到？重新发送'}
                </button>
              </>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          未注册的邮箱将自动创建账号
        </div>
      </div>
    </div>
  );
};
