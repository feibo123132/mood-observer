import { useSettingsStore } from '../store/useSettingsStore';
import { getMoodState } from '../utils/moodUtils';

type AudioMode = 'classical' | 'modern' | 'friend';

class AudioPlayerService {
  private static instance: AudioPlayerService;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private lastPreloadedUrl: string | null = null;

  private constructor() {}

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  // 计算资源路径
  private getAudioUrl(score: number, mode: AudioMode): string {
    // 根据分数计算等级 (0-10)
    // 逻辑复用 moodUtils，简单映射：
    // 0-9: level_0, 10-19: level_1, ... 90-95: level_9, 96-100: level_10
    let level = Math.floor(score / 10);
    if (score >= 96) level = 10;
    else if (score >= 90) level = 9; // 90-95 特殊处理
    
    // 如果您想使用随机播放逻辑，可以解开下面的注释并修改 getRandomInt 逻辑
    // const randomId = Math.floor(Math.random() * 2) + 1; // 假设每个等级有2个文件：1.mp3, 2.mp3
    // return `/audio/${mode}/level_${level}/${randomId}.mp3`;

    // 目前逻辑：直接读取对应等级的 level_X.mp3
    return `/audio/${mode}/level_${level}.mp3`; 
  }

  // 预加载
  public preload(score: number): void {
    const { isAudioEnabled, audioMode } = useSettingsStore.getState();
    if (!isAudioEnabled) return;

    const url = this.getAudioUrl(score, audioMode);
    
    // 避免重复加载同一资源
    if (url === this.lastPreloadedUrl && this.audioCache.has(url)) return;

    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto';
    
    // 缓存起来
    this.audioCache.set(url, audio);
    this.lastPreloadedUrl = url;
    
    // 简单的缓存清理策略：只保留最近 5 个
    if (this.audioCache.size > 5) {
      const firstKey = this.audioCache.keys().next().value;
      this.audioCache.delete(firstKey);
    }
  }

  // 播放
  public async play(score: number): Promise<void> {
    const { isAudioEnabled, audioMode } = useSettingsStore.getState();
    if (!isAudioEnabled) return;

    const url = this.getAudioUrl(score, audioMode);
    let audio = this.audioCache.get(url);

    if (!audio) {
      audio = new Audio(url);
      this.audioCache.set(url, audio);
    } else {
      // 重置播放进度，以便重复播放
      audio.currentTime = 0;
    }

    try {
      await audio.play();
      console.log(`[AudioPlayer] Playing: ${url} (Score: ${score}, Mode: ${audioMode})`);
    } catch (error) {
      // 静默失败，不打扰用户
      // 常见原因：Auto-play 策略拦截、文件不存在 (404)、网络错误
      console.warn('[AudioPlayer] Play failed (silenced):', error);
    }
  }
}

export const audioPlayer = AudioPlayerService.getInstance();
